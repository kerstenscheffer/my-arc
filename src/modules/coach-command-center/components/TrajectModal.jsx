// src/modules/coach-command-center/components/TrajectModal.jsx
//
// Klik-door blad voor de looptijd van een klant, in dezelfde stijl als het
// slaapblad op home (één vraag per stap, sliders, witte knop onderaan).
//
//   modus 'start'   — nieuwe klant zonder looptijd: startdatum, aantal weken
//                     (intypen), hoe betaalt hij. Geen omzet: die sale staat al op het
//                     leadbord.
//   modus 'verleng' — hoe lang erbij en vanaf wanneer, hoe betaalt hij, wat
//                     kost het en is het al binnen. Boekt via boekVerlenging
//                     (trajectPeriode.js): einddatum, omzetregel in
//                     lead_movements en de doorstap-stand in één keer. Zelfde
//                     route vanuit Coach Inzicht, Einde traject en Business OS.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Check, ChevronLeft, CalendarPlus, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import HorizontaleSlider from '../../../client/components/HorizontaleSlider'
import { computePeriod, planVervolg, directeStart, vorigeSale, boekVerlenging } from './trajectPeriode'
import { laadAanbod } from '../../business-os/aanbodOpslag'
import { aanbodOpties } from '../../business-os/aanbodData'

const isoVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const vandaagIso = () => isoVan(new Date())
const plusDagen = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return isoVan(d) }
const mooi = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
const mooiKort = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const euro = (n) => `€${Math.round(n).toLocaleString('nl-NL')}`

const MAX_WEKEN = 104
const MAANDEN = Array.from({ length: 24 }, (_, i) => i + 1)
// Startdatum: half jaar terug tot twee maanden vooruit, als dag-offset.
const START_OFFSETS = Array.from({ length: 241 }, (_, i) => i - 180)
const PRIJZEN_PREPAID = Array.from({ length: 241 }, (_, i) => i * 25)   // €0–6000
const PRIJZEN_MAAND = Array.from({ length: 301 }, (_, i) => i * 5)      // €0–1500

// voorstel = { maanden, betaling, prijs }: vult de verlenging vooraf in (Einde
// traject in het lead-systeem). betaald = startwaarde van de vraag "Betaald?"
// in de laatste stap; nog niet betaald staat bij "wacht op betaling" tot het
// geld binnen is. borgId: challenge-sale die bij deze doorstap hoort (leeg =
// zelf zoeken). onGeboekt(pakket, doorstapRij) na het boeken.
export default function TrajectModal({ open, modus = 'verleng', client, coachId, onClose, onClientUpdate, voorstel = null, betaald = true, borgId, onGeboekt = null }) {
  const [stap, setStap] = useState(1)
  const [startOffset, setStartOffset] = useState(0)
  const [maanden, setMaanden] = useState(4)
  const [weken, setWeken] = useState('12')     // tekst: het veld mag tijdens typen leeg zijn
  const [betaling, setBetaling] = useState('prepaid')
  const [prijs, setPrijs] = useState(500)
  const [vorige, setVorige] = useState(null)   // { leadId, pct } van de oorspronkelijke sale
  const [startKeuze, setStartKeuze] = useState('direct')  // 'direct' na het huidige einde, of 'datum'
  const [startDatum, setStartDatum] = useState('')
  const [isBetaald, setIsBetaald] = useState(true)
  const [betaalDatum, setBetaalDatum] = useState('')
  // Aanbod uit Business OS → Aanbod (producten + tiers met prijs). keuzeAanbod = gekozen optie of null (zelf invullen).
  const [opties, setOpties] = useState([])
  const [keuzeAanbod, setKeuzeAanbod] = useState(null)
  const [eigenPrijs, setEigenPrijs] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  // Bij openen: alles terug naar begin, en de oorspronkelijke sale van deze
  // klant opzoeken (lead op e-mail). Die geeft de startprijs, de betaalwijze
  // en het partner-percentage voor de verlenging.
  useEffect(() => {
    if (!open || !client?.id) return
    let weg = false
    setStap(1); setFout(null); setBezig(false)
    setStartOffset(0); setMaanden(4); setWeken('12')
    setStartKeuze('direct'); setStartDatum(''); setIsBetaald(betaald !== false); setBetaalDatum('')
    setKeuzeAanbod(null); setEigenPrijs(false); setOpties([])
    setBetaling(client.payment_plan === 'monthly' ? 'monthly' : 'prepaid')
    setPrijs(client.payment_plan === 'monthly' ? 150 : 500)
    if (voorstel) {
      if (voorstel.maanden) setMaanden(voorstel.maanden)
      if (voorstel.betaling) setBetaling(voorstel.betaling)
      if (voorstel.prijs != null) setPrijs(voorstel.prijs)
    }
    setVorige(null)
    if (modus !== 'verleng') return
    // Met een voorstel (Einde traject → challenge-afspraak) geen aanbod-stap.
    if (!voorstel) laadAanbod().then(a => { if (!weg && !a.fout) setOpties(aanbodOpties(a.gegevens)) }).catch(() => {})
    ;(async () => {
      const v = await vorigeSale(supabase, client)
      if (weg || !v) return
      setVorige({ leadId: v.leadId, pct: v.pct })
      const s = v.sale
      // Met een voorstel blijven periode en bedrag staan zoals aangeleverd.
      if (s?.order_value && !voorstel) {
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
  // Volgorde van de stappen per modus. Verlengen begint met het aanbod (behalve met een voorstel).
  const STAPPEN = isStart ? ['start', 'duur', 'betaling'] : (voorstel ? ['duur', 'betaling', 'prijs'] : ['aanbod', 'duur', 'betaling', 'prijs'])
  const stappen = STAPPEN.length
  const prijsVan = (o, b) => (b === 'monthly' ? o.perMaand : o.vooruit)
  const kiesAanbod = (o) => {
    setKeuzeAanbod(o); setEigenPrijs(false); setMaanden(o.maanden)
    const b = o.vooruit && o.perMaand ? betaling : o.perMaand ? 'monthly' : 'prepaid'
    setBetaling(b); setPrijs(prijsVan(o, b))
    setStap(2)
  }
  const periode = computePeriod(client)

  // Nieuwe einddatum. Verlengen gaat standaard vanaf het huidige eind, of vanaf
  // vandaag als dat eind al voorbij is. Een vervolg kan ook op een eigen datum
  // starten (1 jan); tot dan loopt de toegang door.
  const startIso = isStart ? plusDagen(vandaagIso(), startOffset) : (client.coaching_start_date || vandaagIso())
  const wekenGetal = Number(weken)
  const wekenGeldig = wekenGetal >= 1 && wekenGetal <= MAX_WEKEN
  const vervolgStart = startKeuze === 'datum' && startDatum ? startDatum : directeStart(client)
  const plan = isStart ? null : planVervolg(client, { maanden, startOp: vervolgStart })
  const nieuwEind = isStart ? plusDagen(startIso, (wekenGeldig ? wekenGetal : 0) * 7) : plan.eind
  const totaalWeken = isStart ? wekenGetal : plan.totaalWeken
  const totaalBedrag = betaling === 'monthly' ? prijs * maanden : prijs
  const startGeldig = isStart || nieuwEind > vandaagIso()

  const bewaar = async () => {
    setBezig(true); setFout(null)
    try {
      if (isStart) {
        const payload = {
          coaching_start_date: startIso,
          coaching_total_weeks: totaalWeken,
          coaching_onbeperkt: false,
          coaching_status: 'active',
          coaching_paused_at: null,
          coaching_pause_reason: null,
          payment_plan: betaling,
          goal_deadline: nieuwEind,
        }
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
        if (error) throw error
        onClientUpdate?.(payload)
        onClose?.()
        return
      }
      const uit = await boekVerlenging(supabase, {
        client, coachId, maanden, betaling, prijs,
        startOp: vervolgStart,
        betaald: isBetaald,
        betaalDatum: isBetaald ? null : (betaalDatum || null),
        vorige,
        borgId,
        aanbod: keuzeAanbod?.naam || null,
      })
      onClientUpdate?.(uit.clientPayload)
      onGeboekt?.(uit.pakket, uit.doorstap)
      onClose?.()
    } catch (e) {
      console.error('Looptijd opslaan mislukt:', e)
      // Einddatum wel opgeschoven, omzet niet: wel doorgeven, anders klopt het scherm niet.
      if (e?.clientPayload) onClientUpdate?.(e.clientPayload)
      setFout(e.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  // Geen einddatum: geen weken, geen betaalvraag, meteen klaar.
  const bewaarOnbeperkt = async () => {
    setBezig(true); setFout(null)
    const payload = {
      coaching_start_date: startIso,
      coaching_total_weeks: null,
      coaching_onbeperkt: true,
      coaching_status: 'active',
      coaching_paused_at: null,
      coaching_pause_reason: null,
      goal_deadline: null,
    }
    const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
    setBezig(false)
    if (error) { setFout(error.message || 'Opslaan mislukt'); return }
    onClientUpdate?.(payload)
    onClose?.()
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
      <button key={id} onClick={() => { setBetaling(id); if (keuzeAanbod && !eigenPrijs && prijsVan(keuzeAanbod, id)) setPrijs(prijsVan(keuzeAanbod, id)) }} style={{
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

  const pil = (aan, klik, tekst) => (
    <button onClick={klik} style={{
      flex: 1, minHeight: 42, padding: '0 0.5rem', borderRadius: 12, fontFamily: 'inherit',
      fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer',
      background: aan ? '#fff' : 'rgba(255,255,255,0.05)', color: aan ? '#0a0a0a' : '#fff',
      border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>{tekst}</button>
  )
  const datumVeld = {
    width: '100%', minHeight: 44, boxSizing: 'border-box', padding: '0 0.75rem', marginBottom: 6,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
    color: '#fff', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark', outline: 'none',
  }

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

        {huidig === 'duur' && isStart && (
          <>
            {vraag('Hoeveel weken loopt het traject?')}
            <label style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, height: 86, cursor: 'text' }}>
              <input
                value={weken}
                onChange={(e) => setWeken(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Aantal weken"
                style={{
                  width: '2.2em', padding: '0.1em 0', textAlign: 'center',
                  background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.35)',
                  borderRadius: 0, outline: 'none', color: '#fff', fontFamily: 'inherit',
                  fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
                }}
              />
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>weken</span>
            </label>
            {onder(wekenGeldig ? `Loopt tot ${mooi(nieuwEind)}` : `Vul 1 tot ${MAX_WEKEN} weken in`)}
          </>
        )}

        {huidig === 'aanbod' && (
          <>
            {vraag('Wat neemt hij?')}
            {opties.map((o, i) => {
              const geld = [o.vooruit ? `${euro(o.vooruit)} ineens` : null, o.perMaand ? `${euro(o.perMaand)}/mnd` : null].filter(Boolean).join(' · ')
              const aan = keuzeAanbod?.id === o.id
              return (
                <div key={o.id}>
                  {o.soort === 'tier' && opties[i - 1]?.soort !== 'tier' && (
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '12px 0 6px' }}>Tiers</div>
                  )}
                  <button type="button" onClick={() => kiesAanbod(o)} style={{
                    width: '100%', minHeight: 54, marginBottom: 8, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    background: aan ? '#fff' : 'rgba(255,255,255,0.05)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14,
                    color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900 }}>{o.naam}</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, opacity: 0.6 }}>{o.maanden} mnd · {geld}</span>
                    </span>
                    {aan && <Check size={18} strokeWidth={3} />}
                  </button>
                </div>
              )
            })}
            <button type="button" onClick={() => { setKeuzeAanbod(null); setEigenPrijs(false); setStap(2) }} style={{ ...primair, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', marginTop: 4 }}>
              Zelf invullen
            </button>
            {!opties.length && onder('Nog geen aanbod geladen. Vul je aanbod in via Business OS → Aanbod.')}
          </>
        )}

        {huidig === 'duur' && !isStart && (
          <>
            {vraag('Hoe lang verlengen?')}
            <HorizontaleSlider
              waarden={MAANDEN}
              waarde={maanden}
              onChange={setMaanden}
              toon={(v) => `${v} mnd`}
              itemBreedte={88}
              groot="1.6rem"
            />
            <div style={{ display: 'flex', gap: 6, margin: '4px 0 8px' }}>
              {pil(startKeuze === 'direct', () => setStartKeuze('direct'), `Direct · ${mooiKort(directeStart(client))}`)}
              {pil(startKeuze === 'datum', () => { setStartKeuze('datum'); if (!startDatum) setStartDatum(directeStart(client)) }, 'Op datum')}
            </div>
            {startKeuze === 'datum' && (
              <input type="date" value={startDatum} min={client.coaching_start_date || undefined}
                onChange={(e) => setStartDatum(e.target.value)} aria-label="Startdatum vervolg" style={datumVeld} />
            )}
            {onder(`${periode ? `Nu tot ${mooi(periode.endDate)} → ` : ''}start ${mooi(plan.start)}, eind ${mooi(nieuwEind)}`)}
            {plan.gatDagen > 0 && (
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginTop: -8, marginBottom: 16, lineHeight: 1.4 }}>
                Tot {mooi(plan.start)} houdt hij gewoon toegang tot de app.
              </div>
            )}
          </>
        )}

        {huidig === 'betaling' && (
          <>
            {vraag('Hoe betaalt hij?')}
            {(!keuzeAanbod || keuzeAanbod.vooruit || eigenPrijs) && keuze('prepaid', 'In één keer', keuzeAanbod?.vooruit && !eigenPrijs ? euro(keuzeAanbod.vooruit) : 'Prepaid, alles vooraf')}
            {(!keuzeAanbod || keuzeAanbod.perMaand || eigenPrijs) && keuze('monthly', 'Maandelijks', keuzeAanbod?.perMaand && !eigenPrijs ? `${keuzeAanbod.maanden} × ${euro(keuzeAanbod.perMaand)}` : 'Elke maand een termijn')}
            <div style={{ height: 10 }} />
          </>
        )}

        {huidig === 'prijs' && (
          <>
            {vraag(betaling === 'monthly' ? 'Wat betaalt hij per maand?' : 'Wat is de prijs?')}
            {keuzeAanbod && !eigenPrijs ? (
              // Prijs uit het aanbod: exact, geen slider (die kent alleen stappen van €25 / €5).
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{keuzeAanbod.naam}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                  {betaling === 'monthly' ? `${maanden} × ${euro(prijs)}` : euro(prijs)}
                </div>
                <button type="button" onClick={() => setEigenPrijs(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}>
                  Andere prijs
                </button>
              </div>
            ) : (
              <HorizontaleSlider
                key={betaling}
                waarden={betaling === 'monthly' ? PRIJZEN_MAAND : PRIJZEN_PREPAID}
                waarde={prijs}
                onChange={setPrijs}
                toon={(v) => `€${v}`}
                itemBreedte={96}
                groot="1.6rem"
              />
            )}
            {onder(betaling === 'monthly'
              ? `${maanden} × ${euro(prijs)} = ${euro(totaalBedrag)} omzet`
              : `${euro(totaalBedrag)} omzet${isBetaald ? ', deze maand binnen' : ''}`)}
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: -6, marginBottom: 16 }}>
              {maanden} mnd vanaf {mooiKort(plan.start)} · loopt tot <span style={{ color: '#fff', fontWeight: 900 }}>{mooi(nieuwEind)}</span>
              {vorige?.pct ? <> · {Number(vorige.pct)}% partner</> : null}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {pil(isBetaald, () => setIsBetaald(true), 'Betaald')}
              {pil(!isBetaald, () => { setIsBetaald(false); if (!betaalDatum) setBetaalDatum(plan.start > vandaagIso() ? plan.start : vandaagIso()) }, 'Nog niet betaald')}
            </div>
            {!isBetaald && (
              <>
                <input type="date" value={betaalDatum} onChange={(e) => setBetaalDatum(e.target.value)}
                  aria-label="Verwachte betaaldatum" style={datumVeld} />
                {onder('Verwacht op. Staat bij "wacht op betaling" tot je hem afvinkt.')}
              </>
            )}
          </>
        )}

        {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{fout}</div>}

        {laatste
          ? (
            <button onClick={bewaar} disabled={bezig || !startGeldig} style={{ ...primair, opacity: bezig || !startGeldig ? 0.5 : 1 }}>
              <Check size={16} strokeWidth={3} />
              {bezig ? 'Opslaan…' : isStart ? 'Looptijd opslaan' : `${isBetaald ? 'Verlengen' : 'Boeken, nog niet betaald'} · ${euro(totaalBedrag)}`}
            </button>
          )
          : huidig === 'aanbod' ? null : (() => {
              const geblokkeerd = (isStart && huidig === 'duur' && !wekenGeldig) || (!isStart && huidig === 'duur' && !startGeldig)
              return (
                <button
                  onClick={() => setStap(n => n + 1)}
                  disabled={geblokkeerd}
                  style={{ ...primair, opacity: geblokkeerd ? 0.4 : 1, cursor: geblokkeerd ? 'default' : 'pointer' }}
                >
                  Volgende
                </button>
              )
            })()}
        {isStart && huidig === 'duur' && (
          <button onClick={bewaarOnbeperkt} disabled={bezig} style={{ ...primair, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', minHeight: 44, marginTop: 4 }}>
            Onbeperkt, geen einddatum
          </button>
        )}
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
