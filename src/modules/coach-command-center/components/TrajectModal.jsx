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
// borgOmzetten = challenge-sale { id, order_value, challenge_status }: de borg wordt de betaling
// van het gekozen aanbod (alleen aanbod + start, geen prijsvragen, geen nieuwe omzet).
export default function TrajectModal({ open, modus = 'verleng', client, coachId, onClose, onClientUpdate, voorstel = null, betaald = true, borgId, borgOmzetten = null, onGeboekt = null }) {
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
  const [betaalLink, setBetaalLink] = useState('')
  // Aanbod uit Business OS → Aanbod (producten + tiers met prijs). keuzeAanbod = gekozen optie of null (zelf invullen).
  const [opties, setOpties] = useState([])
  const [keuzeAanbod, setKeuzeAanbod] = useState(null)
  const [eigenPrijs, setEigenPrijs] = useState(false)
  // Financiën (24 nov 2026, Patrick: 6 x €125 met borg verrekend en 20% korting bij vooruit).
  // Volgorde: korting over het volle traject, daarna de borg eraf (afwijkend van de Aanbod-rekenaar).
  const [borgSale, setBorgSale] = useState(null)        // betaalde challenge-borg van deze klant
  const [borgVerrekenen, setBorgVerrekenen] = useState(false)
  const [kortingPct, setKortingPct] = useState(0)
  const [standaardKorting, setStandaardKorting] = useState(20) // vooruitPct uit Aanbod
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
    setBorgSale(null); setBorgVerrekenen(false); setKortingPct(0)
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
    if (!voorstel) laadAanbod().then(a => {
      if (weg || a.fout) return
      setOpties(aanbodOpties(a.gegevens))
      if (a.gegevens?.vooruitPct != null) setStandaardKorting(a.gegevens.vooruitPct)
    }).catch(() => {})
    // De borg die verrekend kan worden: meegegeven (borgId) of de gekoppelde challenge-sale.
    if (!borgOmzetten) {
      const q = supabase.from('lead_movements').select('id, order_value, challenge_status, payment_received')
        .eq('sale_kind', 'challenge').eq('payment_received', true).in('challenge_status', ['open', 'behouden']).is('reverted_at', null)
      ;(borgId ? q.eq('id', borgId) : q.eq('client_id', client.id)).order('moved_at', { ascending: false }).limit(1)
        .then(async ({ data }) => {
          if (weg) return
          if (data?.[0]) { setBorgSale(data[0]); return }
          if (borgId) return
          // Nog niet gekoppeld (meestal: de sale hangt aan de Instagram-naam). Precies één losse
          // borg met de voornaam (of voor+achternaam aan elkaar) erin = deze klant. Staat standaard
          // uit; kiest de coach hem, dan wordt hij bij het boeken gekoppeld.
          const voor = String(client.first_name || '').trim().toLowerCase()
          if (voor.length < 3) return
          const { data: los } = await supabase.from('lead_movements').select('id, order_value, challenge_status, payment_received, lead_name')
            .eq('sale_kind', 'challenge').eq('payment_received', true).in('challenge_status', ['open', 'behouden'])
            .is('reverted_at', null).is('client_id', null).ilike('lead_name', `%${voor}%`).limit(3)
            .then(r => r, () => ({ data: [] }))
          const plat = (t) => String(t || '').toLowerCase().replace(/[^a-z]/g, '')
          const achter = plat(client.last_name)
          const zeker = (los || []).filter(m => !achter || plat(m.lead_name).includes(plat(voor) + achter) || plat(m.lead_name).includes(achter))
          const kies = zeker.length === 1 ? zeker[0] : (los || []).length === 1 ? los[0] : null
          if (!weg && kies) setBorgSale(kies)
        }, () => {})
    }
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
  const STAPPEN = isStart ? ['start', 'duur', 'betaling'] : borgOmzetten ? ['aanbod', 'duur'] : (voorstel ? ['duur', 'betaling', 'prijs'] : ['aanbod', 'duur', 'betaling', 'prijs'])
  const stappen = STAPPEN.length
  // Prijs uit het aanbod bij een betaalwijze. Ontbreekt die vorm, dan afgeleid: ineens = maanden × per
  // maand (korting gaat er apart af), per maand = ineens / maanden.
  const prijsVan = (o, b, mnd = o.maanden) => (b === 'monthly'
    ? (o.perMaand || Math.round((o.vooruit || 0) / Math.max(1, mnd)))
    : (o.vooruit || (o.perMaand || 0) * mnd))
  // Korting bij vooruit alleen als het aanbod geen eigen ineens-prijs heeft (daar zit hij al in).
  const kortingVoor = (o, b) => (b === 'prepaid' && o && !o.vooruit ? (standaardKorting || 0) : 0)
  const kiesAanbod = (o) => {
    setKeuzeAanbod(o); setEigenPrijs(false); setMaanden(o.maanden)
    const b = o.vooruit && o.perMaand ? betaling : o.perMaand ? 'monthly' : 'prepaid'
    setBetaling(b); setKortingPct(kortingVoor(o, b))
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
  // Bedragen: basis (aanbod of eigen prijs) → min borg → min korting (alleen ineens).
  const effPrijs = keuzeAanbod && !eigenPrijs ? prijsVan(keuzeAanbod, betaling, maanden) : prijs
  const basisTotaal = betaling === 'monthly' ? effPrijs * maanden : effPrijs
  // Korting over het volle traject, daarna de borg eraf (24 nov 2026, Kersten bij Patrick:
  // 6 x €125 = €750, 20% = €150 korting, min borg €297 = €303).
  const kortingAf = betaling === 'prepaid' ? Math.round(basisTotaal * (Number(kortingPct) || 0) / 100) : 0
  const naKorting = basisTotaal - kortingAf
  const borgAf = borgVerrekenen && borgSale ? Math.min(naKorting, Math.round(Number(borgSale.order_value) || 0)) : 0
  const totaalBedrag = naKorting - borgAf
  const perTermijn = betaling === 'monthly' ? Math.round((totaalBedrag / Math.max(1, maanden)) * 100) / 100 : null
  const afspraak = [
    borgAf ? `borg €${borgAf} verrekend` : null,
    kortingAf ? `${kortingPct}% korting vooruit` : null,
  ].filter(Boolean).reverse().join(', ')
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
        betaalLink: isBetaald ? null : betaalLink,
        vorige,
        borgId,
        aanbod: keuzeAanbod?.naam || null,
        borgOmzetten,
        totaal: totaalBedrag,
        prijsTekst: betaling === 'monthly'
          ? `${maanden}x €${Math.round(perTermijn)}${afspraak ? ` (${afspraak})` : ''}`
          : `€${totaalBedrag}${afspraak ? ` (€${basisTotaal}, ${afspraak})` : ''}`,
        borgVerrekend: borgAf ? borgSale : null,
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
      <button key={id} onClick={() => { setBetaling(id); if (keuzeAanbod && !eigenPrijs) setKortingPct(kortingVoor(keuzeAanbod, id)) }} style={{
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
  // Wat hij betaalt: totaal, borg eraf, korting eraf, te betalen. In de betaalstap en de prijsstap.
  const somBlok = (
              <div style={{ margin: '0 auto 14px', maxWidth: 280, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Totaal</span><span>{euro(basisTotaal)}</span></div>
                {kortingAf > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{kortingPct}% korting vooruit</span><span>−{euro(kortingAf)}</span></div>}
                {borgAf > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Borg verrekend</span><span>−{euro(borgAf)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 900, borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 4, paddingTop: 4 }}>
                  <span>{betaling === 'monthly' ? `Hij betaalt ${maanden} × ${euro(perTermijn)}` : 'Hij betaalt'}</span><span>{euro(totaalBedrag)}</span>
                </div>
              </div>
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
              {isStart ? 'Looptijd instellen' : borgOmzetten ? 'Borg omzetten' : 'Verlengen'} · stap {stap} van {stappen}
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
            {borgOmzetten && onder(`Zijn borg van ${euro(Number(borgOmzetten.order_value) || 0)} is de betaling. Er komt geen nieuwe omzet bij.`)}
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
            {keuze('prepaid', 'In één keer', keuzeAanbod && !eigenPrijs
              ? (keuzeAanbod.vooruit ? euro(keuzeAanbod.vooruit) : `${maanden} × ${euro(keuzeAanbod.perMaand)} = ${euro(prijsVan(keuzeAanbod, 'prepaid', maanden))}, korting kan`)
              : 'Prepaid, alles vooraf')}
            {keuze('monthly', 'Maandelijks', keuzeAanbod && !eigenPrijs ? `${maanden} × ${euro(prijsVan(keuzeAanbod, 'monthly', maanden))}` : 'Elke maand een termijn')}
            {borgSale && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {pil(borgVerrekenen, () => setBorgVerrekenen(v => !v), `${borgVerrekenen ? '✓ ' : ''}Borg ${euro(Number(borgSale.order_value) || 0)} verrekenen`)}
              </div>
            )}
            {betaling === 'prepaid' && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, marginTop: 6, padding: '0 0.25rem', fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                Korting bij vooruit
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <input value={kortingPct} inputMode="numeric" aria-label="Korting bij vooruitbetalen in procent"
                    onChange={(e) => setKortingPct(Math.min(100, Number(e.target.value.replace(/\D/g, '').slice(0, 3)) || 0))}
                    onFocus={(e) => e.target.select()}
                    style={{ width: 48, minHeight: 36, textAlign: 'right', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 900, outline: 'none' }} />
                  %
                </span>
              </label>
            )}
            <div style={{ marginTop: 10 }}>{somBlok}</div>
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
                  {betaling === 'monthly' ? `${maanden} × ${euro(effPrijs)}` : euro(effPrijs)}
                </div>
                <button type="button" onClick={() => { setPrijs(effPrijs); setEigenPrijs(true) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}>
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
            {(borgAf > 0 || kortingAf > 0) ? somBlok : onder(betaling === 'monthly'
              ? `${maanden} × ${euro(effPrijs)} = ${euro(totaalBedrag)} omzet`
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
                <input type="url" value={betaalLink} onChange={(e) => setBetaalLink(e.target.value)} placeholder="Betaallink (https://…)"
                  aria-label="Betaallink" style={{ ...datumVeld, marginTop: 8 }} />
                {onder('De klant ziet deze link in de app, met een herinnering tot je de betaling afvinkt.')}
              </>
            )}
          </>
        )}

        {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{fout}</div>}

        {laatste
          ? (
            <button onClick={bewaar} disabled={bezig || !startGeldig} style={{ ...primair, opacity: bezig || !startGeldig ? 0.5 : 1 }}>
              <Check size={16} strokeWidth={3} />
              {bezig ? 'Opslaan…' : isStart ? 'Looptijd opslaan' : borgOmzetten ? `Omzetten · borg ${euro(Number(borgOmzetten.order_value) || 0)}` : `${isBetaald ? 'Verlengen' : 'Boeken, nog niet betaald'} · ${euro(totaalBedrag)}`}
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
