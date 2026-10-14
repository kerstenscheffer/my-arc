// src/modules/coach-command-center/components/TrajectModal.jsx
//
// Klik-door blad voor de looptijd van een klant, in dezelfde stijl als het
// slaapblad op home (één vraag per stap, sliders, witte knop onderaan).
//
//   modus 'start'   — nieuwe klant zonder looptijd: startdatum, hoe lang,
//                     hoe betaalt hij. Geen omzet: die sale staat al op het
//                     leadbord.
//   modus 'verleng' — hoe lang erbij, hoe betaalt hij, wat kost het. Schuift
//                     de einddatum op én boekt de verlenging als omzet in
//                     lead_movements, zodat hij meetelt in de weekstats, de
//                     cashflow en de partner-uitbetaling.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, ChevronLeft, CalendarPlus, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import HorizontaleSlider from '../../../client/components/HorizontaleSlider'
import { computePeriod } from './trajectPeriode'

const DAG = 86400000
const isoVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vandaagIso = () => isoVan(new Date())
const plusDagen = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return isoVan(d) }
const plusMaanden = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setMonth(d.getMonth() + n); return isoVan(d) }
const dagenTussen = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / DAG)
const mooi = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
const euro = (n) => `€${Math.round(n).toLocaleString('nl-NL')}`

// De omzetregel krijgt een eigen sectietitel zonder "sale" erin: dan telt hij
// wel als omzet (elke regel met order_value telt), maar niet als nieuwe sale
// in de funnel.
const VERLENGING_TITEL = 'Verlenging 🔁'

// Partner-aandeel (Marcel) voor een verlenging als de oorspronkelijke sale
// niet terug te vinden is. Zelfde standaard als SaleForm en getPartnerPayouts.
const STANDAARD_PARTNER_PCT = 50

const MAANDEN = Array.from({ length: 24 }, (_, i) => i + 1)
// Startdatum: half jaar terug tot twee maanden vooruit, als dag-offset.
const START_OFFSETS = Array.from({ length: 241 }, (_, i) => i - 180)
const PRIJZEN_PREPAID = Array.from({ length: 241 }, (_, i) => i * 25)   // €0–6000
const PRIJZEN_MAAND = Array.from({ length: 301 }, (_, i) => i * 5)      // €0–1500

export default function TrajectModal({ open, modus = 'verleng', client, coachId, onClose, onClientUpdate }) {
  const [stap, setStap] = useState(1)
  const [startOffset, setStartOffset] = useState(0)
  const [maanden, setMaanden] = useState(4)
  const [betaling, setBetaling] = useState('prepaid')
  const [prijs, setPrijs] = useState(500)
  const [vorige, setVorige] = useState(null)   // { leadId, pct } van de oorspronkelijke sale
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  // Bij openen: alles terug naar begin, en de oorspronkelijke sale van deze
  // klant opzoeken (lead op e-mail). Die geeft de startprijs, de betaalwijze
  // en het partner-percentage voor de verlenging.
  useEffect(() => {
    if (!open || !client?.id) return
    let weg = false
    setStap(1); setFout(null); setBezig(false)
    setStartOffset(0); setMaanden(4)
    setBetaling(client.payment_plan === 'monthly' ? 'monthly' : 'prepaid')
    setPrijs(client.payment_plan === 'monthly' ? 150 : 500)
    setVorige(null)
    const email = (client.email || '').trim()
    if (modus !== 'verleng' || !email) return
    ;(async () => {
      const { data: leads } = await supabase.from('call_leads').select('id').ilike('email', email).limit(5)
      const ids = (leads || []).map(l => l.id)
      if (weg || !ids.length) return
      const { data: sales } = await supabase.from('lead_movements')
        .select('lead_id, order_value, payment_type, duration_months, partner_share_pct')
        .in('lead_id', ids).not('order_value', 'is', null).is('reverted_at', null)
        .eq('sale_kind', 'coaching')
        .order('moved_at', { ascending: false }).limit(1)
      if (weg) return
      const s = sales?.[0]
      setVorige({ leadId: s?.lead_id || ids[0], pct: s?.partner_share_pct ?? null })
      if (s?.order_value) {
        const soort = s.payment_type === 'monthly' ? 'monthly' : 'prepaid'
        setBetaling(soort)
        const bedrag = soort === 'monthly'
          ? Number(s.order_value) / Math.max(1, Number(s.duration_months) || 1)
          : Number(s.order_value)
        const lijst = soort === 'monthly' ? PRIJZEN_MAAND : PRIJZEN_PREPAID
        const stapje = soort === 'monthly' ? 5 : 25
        setPrijs(Math.min(lijst[lijst.length - 1], Math.round(bedrag / stapje) * stapje))
      }
    })().catch(() => {})
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id, modus])

  if (!open || !client?.id) return null

  const isStart = modus === 'start'
  const stappen = 3
  const periode = computePeriod(client)
  const gepauzeerd = client.coaching_paused_days_total || 0

  // Nieuwe einddatum. Verlengen gaat vanaf het huidige eind, of vanaf vandaag
  // als dat eind al voorbij is — anders koopt hij weken die al om zijn.
  const startIso = isStart ? plusDagen(vandaagIso(), startOffset) : (client.coaching_start_date || vandaagIso())
  const basis = isStart
    ? startIso
    : (periode && periode.endDate > vandaagIso() ? periode.endDate : vandaagIso())
  const nieuwEind = plusMaanden(basis, maanden)
  const totaalWeken = Math.max(1, Math.round((dagenTussen(startIso, nieuwEind) - (isStart ? 0 : gepauzeerd)) / 7))
  const totaalBedrag = betaling === 'monthly' ? prijs * maanden : prijs

  const bewaar = async () => {
    setBezig(true); setFout(null)
    try {
      const payload = isStart
        ? {
            coaching_start_date: startIso,
            coaching_total_weeks: totaalWeken,
            coaching_status: 'active',
            coaching_paused_at: null,
            coaching_pause_reason: null,
            payment_plan: betaling,
            goal_deadline: nieuwEind,
          }
        : {
            coaching_total_weeks: totaalWeken,
            coaching_status: 'active',
            payment_plan: betaling,
            goal_deadline: nieuwEind,
          }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.(payload)

      if (!isStart && totaalBedrag > 0) {
        const { data: { user } = {} } = await supabase.auth.getUser()
        const { error: omzetFout } = await supabase.from('lead_movements').insert({
          lead_id: vorige?.leadId || null,
          to_section_title: VERLENGING_TITEL,
          lead_name: client.name || [client.first_name, client.last_name].filter(Boolean).join(' ') || client.email || 'Klant',
          coach_id: user?.id || coachId || null,
          outcome_type: 'verlenging',
          order_value: totaalBedrag,
          payment_type: betaling,
          duration_months: betaling === 'monthly' ? maanden : 1,
          // Leads komen meestal binnen zonder e-mail, dus de oorspronkelijke
          // sale wordt vaak niet gevonden. Dan viel het aandeel op null en telde
          // de verlenging niet mee in de partner-uitbetaling. Zonder gevonden
          // sale geldt het standaard-aandeel uit SaleForm (50%).
          partner_share_pct: vorige?.pct ?? STANDAARD_PARTNER_PCT,
          payment_received: true,
          sale_kind: 'coaching',
        })
        if (omzetFout) {
          setFout('Verlengd, maar de omzet is niet geboekt: ' + omzetFout.message)
          setBezig(false)
          return
        }
      }
      onClose?.()
    } catch (e) {
      console.error('Looptijd opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  const kleinKnop = {
    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const primair = {
    width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
    fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer',
    opacity: bezig ? 0.6 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const vraag = (tekst) => (
    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 16, letterSpacing: '-0.015em' }}>{tekst}</div>
  )
  const onder = (tekst) => (
    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '2px 0 18px', lineHeight: 1.4 }}>{tekst}</div>
  )
  const keuze = (id, titel, sub) => {
    const aan = betaling === id
    return (
      <button key={id} onClick={() => setBetaling(id)} style={{
        width: '100%', minHeight: 58, marginBottom: 8, padding: '0 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14,
        color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <span>
          <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900 }}>{titel}</span>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, opacity: 0.55 }}>{sub}</span>
        </span>
        {aan && <Check size={18} strokeWidth={3} />}
      </button>
    )
  }

  // Volgorde van de stappen per modus.
  const STAPPEN = isStart ? ['start', 'duur', 'betaling'] : ['duur', 'betaling', 'prijs']
  const huidig = STAPPEN[stap - 1]
  const laatste = stap === stappen

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {stap > 1
            ? <button onClick={() => setStap(n => n - 1)} aria-label="Vorige stap" style={kleinKnop}><ChevronLeft size={18} strokeWidth={2.8} /></button>
            : <div style={{ width: 40 }} />}
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isStart ? 'Looptijd instellen' : 'Verlengen'} · stap {stap} van {stappen}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
              {isStart ? <Clock size={15} strokeWidth={2.6} /> : <CalendarPlus size={15} strokeWidth={2.6} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {client.name || client.first_name || 'Klant'}
              </span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={kleinKnop}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {huidig === 'start' && (
          <>
            {vraag('Wanneer is hij gestart?')}
            <HorizontaleSlider
              waarden={START_OFFSETS}
              waarde={startOffset}
              onChange={setStartOffset}
              toon={(v) => new Date(`${plusDagen(vandaagIso(), v)}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              itemBreedte={96}
              groot="1.5rem"
            />
            {onder(startOffset === 0 ? 'Vandaag' : mooi(startIso))}
          </>
        )}

        {huidig === 'duur' && (
          <>
            {vraag(isStart ? 'Hoe lang loopt het traject?' : 'Hoe lang verlengen?')}
            <HorizontaleSlider
              waarden={MAANDEN}
              waarde={maanden}
              onChange={setMaanden}
              toon={(v) => `${v} mnd`}
              itemBreedte={88}
              groot="1.6rem"
            />
            {onder(isStart
              ? `Loopt tot ${mooi(nieuwEind)} · ${totaalWeken} weken`
              : `${periode ? `Nu tot ${mooi(periode.endDate)} → ` : ''}nieuw eind ${mooi(nieuwEind)}`)}
          </>
        )}

        {huidig === 'betaling' && (
          <>
            {vraag('Hoe betaalt hij?')}
            {keuze('prepaid', 'In één keer', 'Prepaid, alles vooraf')}
            {keuze('monthly', 'Maandelijks', 'Elke maand een termijn')}
            <div style={{ height: 10 }} />
          </>
        )}

        {huidig === 'prijs' && (
          <>
            {vraag(betaling === 'monthly' ? 'Wat betaalt hij per maand?' : 'Wat is de prijs?')}
            <HorizontaleSlider
              key={betaling}
              waarden={betaling === 'monthly' ? PRIJZEN_MAAND : PRIJZEN_PREPAID}
              waarde={prijs}
              onChange={setPrijs}
              toon={(v) => `€${v}`}
              itemBreedte={96}
              groot="1.6rem"
            />
            {onder(betaling === 'monthly'
              ? `${maanden} × ${euro(prijs)} = ${euro(totaalBedrag)} omzet`
              : `${euro(totaalBedrag)} omzet, deze maand binnen`)}
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: -6, marginBottom: 16 }}>
              {maanden} mnd erbij · loopt tot <span style={{ color: '#fff', fontWeight: 900 }}>{mooi(nieuwEind)}</span>
              {vorige?.pct ? <> · {Number(vorige.pct)}% partner</> : null}
            </div>
          </>
        )}

        {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{fout}</div>}

        {laatste
          ? (
            <button onClick={bewaar} disabled={bezig} style={primair}>
              <Check size={16} strokeWidth={3} />
              {bezig ? 'Opslaan…' : isStart ? 'Looptijd opslaan' : `Verlengen · ${euro(totaalBedrag)}`}
            </button>
          )
          : <button onClick={() => setStap(n => n + 1)} style={primair}>Volgende</button>}
        {isStart && stap === 1 && (
          <button onClick={onClose} style={{ ...primair, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', minHeight: 40, marginTop: 4 }}>
            Later
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
