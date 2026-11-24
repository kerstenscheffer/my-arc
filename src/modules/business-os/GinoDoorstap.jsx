// src/modules/business-os/GinoDoorstap.jsx
//
// Doorstap afhandelen bovenaan het Klanten-tabje (3 nov 2026): wie ja zei maar
// nog niet betaalde, en wie nadenkt. Zelfde tabel als DoorstapKeuze
// (client_doorstap, nieuwe rij per wijziging, de laatste telt).
//
// Betaald: staat er al een onbetaalde verlenging, dan wordt die afgevinkt. Zo
// niet, dan boekt TrajectModal hem; zelf boeken zou de omzet dubbel tellen.
// Sinds 5 nov ook het overzicht: elke challenge-klant op één regel, en bovenaan wat de
// challenge echt oplevert. Challenge-klant = actief met een traject van 6 weken, of met een
// doorstap-stand. De sale hangt niet aan de klant (client_id is leeg), dus de euro's bovenaan
// komen rechtstreeks uit de sales en verlengingen.
// De borg telt pas als winst zodra de verlenging betaald is: de trigger uit
// borg-na-doorstap.sql zet hem dan op behouden. Er gaat niets naar de klant of Marcel.

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { Loader2, FileDown, Search, X, MessageCircle, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { meldFout } from '../../ui/PaginaVangnet'
import { colors } from '../../ui/tokens'
import TrajectModal from '../coach-command-center/components/TrajectModal'
import AfhandelModal from './AfhandelModal'
import { borgAfronden } from './borgAfronden'
import { computePeriod, hervatTraject } from '../coach-command-center/components/trajectPeriode'
import { haalVerlengen, EINDCALL_NODIG } from './verlengenData'
import { EisenLijst } from '../challenge-monitor/ChallengeEisenRegel'
import { haalEisen, haalInstellingen, zetInstelling, borgOordeel } from '../challenge-monitor/challengeCoach'
import { rekenGeld } from './challengeGeld'
import { maakChallengePdf } from './challengePdf'
import { waNummer, kopieer } from './berichtTekst'

const STATUS_KEUZE = [
  ['ja_mondeling', 'Ja'],
  ['denkt_na', 'Denkt na'],
  // Gezet in het lead-systeem (Einde traject), met een datum erbij.
  ['call', 'Call ingepland'],
  ['nee', 'Nee'],
]
const CHALLENGE_WEKEN = 6
const SOORT_FILTERS = [['challenge', 'Challenge'], ['coaching', 'Coaching'], ['alles', 'Alles']]
const FILTER_KEY = 'myarc.doorstap.filter'
const leesFilter = () => { try { const f = localStorage.getItem(FILTER_KEY); return SOORT_FILTERS.some(([k]) => k === f) ? f : 'challenge' } catch { return 'challenge' } }
const GESPREK_VANAF_WEEK = 5

const naamVan = (c) => [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Klant'
const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`

// Bovenaan wat nu telt: eerst wie iets van jou nodig heeft.
const gesprekNodig = (r) => !r.status && !r.gepauzeerd && !r.onbeperkt && (r.challenge ? (r.week || 0) >= GESPREK_VANAF_WEEK : r.dagen != null && r.dagen <= 14)
const volgorde = (r) => (r.eindcallNodig ? 0 : r.status === 'ja_mondeling' ? 1 : r.status === 'denkt_na' ? 2 : gesprekNodig(r) ? 3 : !r.status ? 4 : r.status === 'betaald' ? 5 : 6)
// Wat moet de coach nu doen bij deze klant, en in welke groep hoort de kaart
// (16 nov 2026)? 'actie' = jij bent aan zet, 'loopt' = niets te doen, 'klaar'
// = afgerond. De volgorde van de regels is de volgorde van belang.
const vandaagIsoNL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const plusDagenIso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' }) }
const watNu = (r) => {
  // Door en betaald = gewoon een lopend traject (24 nov 2026, Kersten). Afgerond is alleen wie stopt.
  if (r.status === 'nee') return { groep: 'klaar', tekst: 'Gestopt' }
  if (r.status === 'betaald') return { groep: 'loopt', tekst: '' }
  // Kanban (24 nov 2026): door maar nog niet betaald is een eigen kolom.
  // Sluimer (24 nov 2026, Kersten): actie gedaan (appje gestuurd, even laten rusten) = uit Actie nodig
  // tot de datum. Een geplande call in de agenda telt ook als gedaan: dan wacht je op die call.
  const slaapt = r.sluimer_tot && r.sluimer_tot >= vandaagIsoNL()
  const wacht = slaapt ? `Wacht tot ${dagKort(r.sluimer_tot)}` : null
  if (r.status === 'ja_mondeling' && r.sale) return { groep: 'betaling', tekst: slaapt ? `Herinnerd · ${wacht.toLowerCase()}` : 'Betaling ophalen', bericht: 'betaling', slaapt }
  if (slaapt) return { groep: 'loopt', tekst: wacht, slaapt }
  if (r.status === 'ja_mondeling') return { groep: 'actie', tekst: 'Traject boeken' }
  if (r.volgendeCall && !r.gepauzeerd) return { groep: 'loopt', tekst: `Call ${dagKort(r.volgendeCall.start)}` }
  if (r.eindcallNodig) return { groep: 'actie', tekst: 'Eindcall plannen', bericht: 'eindcall' }
  if (r.status === 'denkt_na') return { groep: 'actie', tekst: 'Opvolgen: denkt na', bericht: 'denkt_na' }
  if (gesprekNodig(r)) return { groep: 'actie', tekst: 'Doorstapgesprek voeren', bericht: 'eindcall' }
  if (!r.status && !r.gepauzeerd && !r.onbeperkt && r.dagen != null && r.dagen < 0) return { groep: 'actie', tekst: 'Traject voorbij: beslissen', bericht: 'eindcall' }
  if (r.gepauzeerd) return { groep: 'loopt', tekst: 'Op pauze' }
  if (r.status === 'call') return { groep: 'loopt', tekst: 'Call ingepland' }
  return { groep: 'loopt', tekst: '' }
}

// Voorstel voor een WhatsApp-bericht bij de actie. Kersten past aan en verstuurt zelf.
const voornaamVan = (c) => String(c?.first_name || '').trim().split(/\s+/)[0] || ''
const geldKort = (v) => `€${Math.round(Number(v) || 0).toLocaleString('nl-NL')}`
function berichtVoorstel(r, soort) {
  const naam = voornaamVan(r.klant)
  const hoi = `Hoi ${naam}!`
  if (soort === 'betaling') {
    const s = r.sale || {}
    const maanden = Math.max(1, Number(s.duration_months) || 1)
    const bedrag = s.payment_type === 'monthly' ? `${maanden} termijnen van ${geldKort(Number(s.order_value) / maanden)}` : geldKort(s.order_value)
    const wanneer = s.payment_due_date ? ` vóór ${dagKort(s.payment_due_date)}` : ''
    const link = s.betaal_link ? `\n\nBetalen kan hier: ${s.betaal_link}` : ''
    return `${hoi} Super dat je doorgaat!\n\nWil je ${s.payment_type === 'monthly' ? 'de eerste van de ' : ''}${bedrag}${wanneer} overmaken? Dan staat alles voor je klaar en gaan we gewoon door.${link}\n\nLaat even weten als je ergens vragen over hebt!`
  }
  if (soort === 'denkt_na') return `${hoi} Ik was benieuwd of je al hebt kunnen nadenken over doorgaan na je traject. Heb je nog vragen waar ik je mee kan helpen?`
  const einde = r.dagen != null && r.dagen < 0 ? 'is net afgelopen' : `loopt ${r.eind ? `op ${dagKort(r.eind)} ` : 'bijna '}af`
  return `${hoi} Je traject ${einde}. Zullen we een korte call plannen om je resultaten door te nemen en te kijken hoe we verder gaan? Wanneer past het jou?`
}
const dagenTekst = (r) => (r.onbeperkt ? 'Onbeperkt' : r.dagen == null ? null : r.dagen < 0 ? `${-r.dagen} ${r.dagen === -1 ? 'dag' : 'dagen'} voorbij` : r.dagen === 0 ? 'Eindigt vandaag' : `Nog ${r.dagen} ${r.dagen === 1 ? 'dag' : 'dagen'}`)
// Kort voor op de kaart: '11 d voorbij', 'nog 2 d'. De volle tekst staat in de pdf en de tooltip.
const dagenKort = (r) => (r.onbeperkt ? 'Onbeperkt' : r.dagen == null ? null : r.dagen < 0 ? `${-r.dagen} d voorbij` : r.dagen === 0 ? 'Vandaag' : `Nog ${r.dagen} d`)
// Tijd-label (24 nov 2026, Kersten): hoe dichter bij het einde of erover, hoe roder.
// Meer dan 21 dagen = rustig grijs. Van 21 naar 0 dagen loopt de kleur van geel-oranje naar rood;
// voorbij het einde is het vol rood. Op pauze grijs: de klok staat stil.
function tijdKleur(r) {
  if (r.gepauzeerd || r.dagen == null) return { bg: 'rgba(255,255,255,0.14)', fg: '#fff' }
  if (r.dagen < 0) return { bg: 'hsl(0, 85%, 52%)', fg: '#fff' }
  if (r.dagen > 21) return { bg: 'rgba(255,255,255,0.14)', fg: '#fff' }
  const t = r.dagen / 21                       // 1 = ver weg, 0 = vandaag
  const tint = Math.round(4 + t * 40)          // 44 (geel-oranje) → 4 (rood)
  return { bg: `hsl(${tint}, 90%, 52%)`, fg: tint > 30 ? '#0a0a0a' : '#fff' }
}
const tijdTekst = (r) => (r.gepauzeerd ? 'Pauze' : dagenKort(r))

const GROEPEN = [['actie', 'Actie nodig'], ['betaling', 'Door, nog niet betaald'], ['loopt', 'Loopt'], ['klaar', 'Gestopt']]

const dagKort = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') : '—')
const callKort = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).replace(/\./g, '')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })}`
}

// Een getal bovenaan. Klik = eronder een klein lijstje met wie erachter zit.
function Getal({ label, waarde, sub, kleur, regels, open, onKlik, leeg = 'Niemand' }) {
  // Minder op het scherm: de toelichting zit in de hover en bovenaan het lijstje.
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button type="button" aria-expanded={open} onClick={onKlik} title={sub || undefined} style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: kleur || colors.textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, whiteSpace: 'nowrap' }}>{waarde}</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textPrimary, marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, width: 380, maxWidth: '92vw', maxHeight: 280, overflowY: 'auto', padding: '6px 10px',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
        }}>
          {sub && <div style={{ padding: '2px 0 4px', fontSize: '0.72rem', fontWeight: 700, color: colors.textSecondary }}>{sub}</div>}
          {regels.length === 0 && <div style={{ padding: '4px 0', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary }}>{leeg}</div>}
          {regels.map((x, i) => (
            <div key={x.id || i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0', fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
              {/* Naam gaat voor: de toelichting krimpt eerst (24 nov 2026, namen waren onleesbaar). */}
              <span title={x.naam} style={{ flex: '1 0 auto', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.naam}</span>
              {x.sub && <span title={x.sub} style={{ flex: '0 1 auto', minWidth: 0, marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', fontWeight: 700, color: colors.textSecondary }}>{x.sub}</span>}
              {x.bedrag != null && <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{euro(x.bedrag)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WeekBalk({ week, weken }) {
  if (!week || !weken) return null
  const aantal = Math.min(weken, 6)
  const vol = Math.round((week / weken) * aantal)
  return (
    <span title={`Week ${week} van ${weken}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{ display: 'inline-flex', gap: 2 }}>
        {Array.from({ length: aantal }, (_, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: 1, background: i < vol ? colors.textPrimary : 'rgba(255,255,255,0.16)' }} />
        ))}
      </span>
    </span>
  )
}

export default function GinoDoorstap({ isMobile = false }) {
  const [rijen, setRijen] = useState(null)
  const [fout, setFout] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [rijFout, setRijFout] = useState({}) // client_id → fout, rood onder de naam
  const [traject, setTraject] = useState(null) // { client, rij, betaald, borgId }
  const [borgen, setBorgen] = useState([]) // open challenge-sales die al betaald zijn
  const [borgKeuze, setBorgKeuze] = useState({}) // client_id → gekozen borg
  const [coachId, setCoachId] = useState(null)
  const [saleRijen, setSaleRijen] = useState(null)
  const [eisen, setEisen] = useState({}) // client_id → stand van de zes eisen
  const [openEisen, setOpenEisen] = useState(null)
  const [openGetal, setOpenGetal] = useState(null)
  const [eindOplopend, setEindOplopend] = useState(() => { try { return localStorage.getItem('myarc.doorstap.sorteer') !== 'af' } catch { return true } })
  const [instellingen, setInstellingen] = useState(() => new Map())
  const [gestopt, setGestopt] = useState([]) // challenge-klanten van wie het traject is beëindigd
  const [gestoptRijen, setGestoptRijen] = useState([]) // dezelfden als kaart, voor de kolom Gestopt
  const [soortFilter, setSoortFilter] = useState(leesFilter)
  const [looptijd, setLooptijd] = useState(null) // { id, start, weken } terwijl je hem aanpast
  const [klaarOpen, setKlaarOpen] = useState(false) // de groep Afgerond staat standaard dicht
  const [pdfBezig, setPdfBezig] = useState(false)
  const [zoek, setZoek] = useState('')
  const [afhandel, setAfhandel] = useState(null) // client_id waar het Afhandelen-venster voor open staat
  const [bericht, setBericht] = useState(null)   // { id, tekst, fout } voorstel-bericht dat openstaat
  // Kanban precies zo hoog als er onder in het scherm ruimte is (24 nov 2026: met een vaste schatting
  // viel de onderste kaart achter de rand). Gemeten tegen de scrollvlak eromheen (.gk-scroll).
  const kanbanRef = useRef(null)
  const [kanbanHoogte, setKanbanHoogte] = useState(null)
  useLayoutEffect(() => {
    const meet = () => {
      const el = kanbanRef.current
      if (!el) return
      const ouder = el.closest('.gk-scroll')
      const eigen = el.getBoundingClientRect()
      const vlak = ouder ? ouder.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
      const vanafBoven = eigen.top - vlak.top + (ouder ? ouder.scrollTop : 0)
      const hoogte = (ouder ? ouder.clientHeight : window.innerHeight) - vanafBoven - 8
      setKanbanHoogte(h => { const n = Math.max(320, Math.floor(hoogte)); return h === n ? h : n })
    }
    meet()
    window.addEventListener('resize', meet)
    const ro = typeof ResizeObserver !== 'undefined' && kanbanRef.current?.closest('.gk-scroll') ? new ResizeObserver(meet) : null
    if (ro) ro.observe(kanbanRef.current.closest('.gk-scroll'))
    return () => { window.removeEventListener('resize', meet); ro?.disconnect() }
  })

  // De borg die al aan de klant hangt (challenge-sale, open en betaald). Dan hoef je hem niet te kiezen.
  const bekendeBorg = (clientId) => { const id = instellingen.get(clientId)?.sale_id; return id && borgen.some(b => b.id === id) ? id : null }
  // Voor boekVerlenging: gekozen of bekende borg; undefined = laat hem zelf de gekoppelde challenge-sale zoeken.
  const borgVoor = (clientId) => borgKeuze[clientId] || bekendeBorg(clientId) || undefined

  const laad = useCallback(async () => {
    const [ds, kl, au, bg, ch, vl] = await Promise.all([
      supabase.from('client_doorstap').select('client_id, coach_id, status, pakket, gezet_at, call_datum, sluimer_tot')
        .order('gezet_at', { ascending: false }).order('id', { ascending: false })
        .then(r => r, e => ({ error: e })),
      supabase.from('clients').select('id, first_name, last_name, email, coach_id, coaching_onbeperkt, coaching_start_date, coaching_total_weeks, coaching_paused_days_total, coaching_status, coaching_paused_at, phone').eq('status', 'active').order('first_name')
        .then(r => r, e => ({ error: e })),
      supabase.auth.getUser(),
      supabase.from('lead_movements').select('id, lead_name, order_value')
        .eq('sale_kind', 'challenge').eq('challenge_status', 'open').eq('payment_received', true).is('reverted_at', null)
        .order('lead_name')
        .then(r => r, e => ({ error: e })),
      supabase.from('lead_movements').select('id, lead_name, moved_at, order_value, challenge_status, payment_received, borg_movement_id, sale_kind, client_id')
        .or('sale_kind.eq.challenge,borg_movement_id.not.is.null').is('reverted_at', null)
        .then(r => r, e => ({ error: e })),
      // Einddatum en eindcall: dezelfde regels als het overzicht Verlengen. Lukt de agenda niet,
      // dan een streepje en geen onterechte melding.
      haalVerlengen(supabase).then(l => l, () => null),
    ])
    if (ds.error || kl.error || bg.error) { setFout((ds.error || kl.error || bg.error).message || 'Laden mislukt'); setRijen([]); return }
    setCoachId(au?.data?.user?.id || null)

    const laatste = new Map()
    ;(ds.data || []).forEach(r => { if (!laatste.has(r.client_id)) laatste.set(r.client_id, r) })
    // Iedereen in het overzicht: wie een stand heeft, of een traject van 6 weken loopt.
    // Iedereen met een traject of een stand. Een afgelopen traject (app op slot) hoeft er niet
    // meer tussen, tenzij er een stand is. Testaccounts nooit.
    const isTest = (c) => { const e = String(c.email || '').toLowerCase(); return e.includes('test') || e === 'ks10k@gmail.com' || e === 'review@gmail.com' }
    const alle = (kl.data || []).filter(c => !isTest(c) && (laatste.get(c.id)?.status
      || (c.coaching_status !== 'ended' && ((c.coaching_start_date && c.coaching_total_weeks) || c.coaching_onbeperkt))))
    if (!ch.error) setSaleRijen(ch.data || [])
    const inst = await haalInstellingen().catch(() => new Map())
    setInstellingen(inst)
    // Challenge-klant = er hangt een challenge-borg aan hem (instelling of client_id), of hij loopt
    // nu een traject van 6 weken. Een doorstap-stand alleen maakt het geen challenge (24 nov 2026:
    // Elijah, 12 weken coaching, stond met eisen in de challenge-lijst).
    const metBorg = new Set((ch.data || []).filter(x => x.sale_kind === 'challenge' && x.client_id).map(x => x.client_id))
    for (const [id, i] of inst) if (i.sale_id) metBorg.add(id)
    // Gestopt telt ook wie niet meer actief is, dus los van de klantenlijst hierboven.
    // Traject beëindigd, of het account staat niet meer op actief terwijl coaching_status
    // nog op active bleef hangen (18 nov 2026: zo vielen twee refunds uit beide lijsten).
    const { data: geeindigd } = await supabase.from('clients').select('id, first_name, last_name, email, coach_id, coaching_start_date, coaching_total_weeks, coaching_paused_days_total, coaching_status, phone, niet_betalend')
      .eq('coaching_total_weeks', CHALLENGE_WEKEN).or('coaching_status.eq.ended,status.neq.active,status.is.null')
      .then(x => x, () => ({ data: [] }))
    // Nooit betaald (clients.niet_betalend, vinkje in Coach Inzicht) hoort hier niet: Tygo, Thom, Romeo (24 nov 2026).
    const gestoptLijst = (geeindigd || []).filter(c => !isTest(c) && !c.niet_betalend && !['ja_mondeling', 'betaald'].includes(laatste.get(c.id)?.status))
    setGestopt(gestoptLijst)
    // Kaarten voor de kolom Gestopt (24 nov 2026: Oscar, Erwin e.a. stonden er niet in, want hun account
    // staat niet meer op actief). Alleen tonen; stats rekenen ze al mee via gestopt.
    setGestoptRijen(gestoptLijst.map(c => {
      const stand = laatste.get(c.id) || null
      const p = computePeriod(c)
      return {
        gestopt: true, vanChallenge: true, challenge: false, onbeperkt: false, // challenge false: geen eisen meer laden
        client_id: c.id, coach_id: stand?.coach_id || c.coach_id, status: 'nee', pakket: stand?.pakket || null, gezet_at: stand?.gezet_at || null, call_datum: null,
        klant: c, sale: null, betaaldeSale: null,
        week: p ? Math.min(p.weeksDone + 1, p.weeksTotal) : null, weken: p?.weeksTotal || null,
        start: c.coaching_start_date || null, eind: p?.endDate || null, dagen: null, gepauzeerd: false, eindcallNodig: false,
      }
    }))

    // Verlengingen van deze klanten: het bedrag dat nog moet komen, of al betaald is.
    const ids = alle.map(c => c.id)
    const { data: sales, error: saleFout } = ids.length
      ? await supabase.from('lead_movements').select('id, client_id, order_value, borg_movement_id, payment_received, payment_due_date, start_op, payment_type, duration_months, betaal_link')
        .in('client_id', ids).eq('outcome_type', 'verlenging').is('reverted_at', null)
        .order('moved_at', { ascending: false })
        .then(r => r, e => ({ error: e }))
      : { data: [] }
    if (saleFout) { setFout(saleFout.message || 'Laden mislukt'); setRijen([]); return }

    setFout(null)
    setBorgen(bg.data || [])
    const verlengen = new Map((vl || []).map(v => [v.id, v]))
    setRijen(alle
      .map((c) => {
        const stand = laatste.get(c.id) || null
        const eigen = (sales || []).filter(x => x.client_id === c.id)
        const periode = computePeriod(c)
        return {
                  // vanChallenge = kwam via de challenge binnen (telt mee in doorstap en geld). challenge = staat nog
          // in de challenge-fase: wie door is en betaald heeft hoort bij Coaching (24 nov 2026, Kersten).
          vanChallenge: c.coaching_total_weeks === CHALLENGE_WEKEN || metBorg.has(c.id) || eigen.some(x => x.borg_movement_id),
          challenge: (c.coaching_total_weeks === CHALLENGE_WEKEN || metBorg.has(c.id) || eigen.some(x => x.borg_movement_id)) && stand?.status !== 'betaald',
          onbeperkt: !!c.coaching_onbeperkt,
          client_id: c.id, coach_id: stand?.coach_id || c.coach_id, status: stand?.status || null, pakket: stand?.pakket || null, gezet_at: stand?.gezet_at || null, call_datum: stand?.call_datum || null, sluimer_tot: stand?.sluimer_tot || null,
          klant: c, sale: eigen.find(x => !x.payment_received) || null, betaaldeSale: eigen.find(x => x.payment_received) || null,
          week: periode ? Math.min(periode.weeksDone + 1, periode.weeksTotal) : null, weken: periode?.weeksTotal || null,
          ...(() => {
            const v = verlengen.get(c.id)
            return { start: v?.start || c.coaching_start_date || null, eind: v?.eind || null, dagen: v?.dagen ?? null, volgendeCall: v?.volgendeCall || null, naamChecken: !!v?.naamChecken, eindcallNodig: v?.actie === EINDCALL_NODIG && c.coaching_status !== 'paused', gepauzeerd: c.coaching_status === 'paused', agendaBekend: !!vl }
          })(),
        }
      })
      .sort((a, b) => volgorde(a) - volgorde(b) || (b.week || 0) - (a.week || 0) || naamVan(a.klant).localeCompare(naamVan(b.klant))))
  }, [])

  useEffect(() => { laad() }, [laad])

  // De eisen per klant, vier tegelijk. Alleen lezen: er komt geen rij in challenge_assignments,
  // want die zet de trofee bij de klant aan.
  useEffect(() => {
    if (!rijen?.length) return undefined
    let weg = false
    const wachtrij = rijen.filter(r => r.challenge).map(r => r.klant).filter(c => c && eisen[c.id] === undefined)
    const werker = async () => {
      while (wachtrij.length && !weg) {
        const c = wachtrij.shift()
        const e = await haalEisen(c).catch(() => null)
        if (!weg) setEisen(o => ({ ...o, [c.id]: e }))
      }
    }
    for (let i = 0; i < 4; i++) werker()
    return () => { weg = true }
  }, [rijen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Een fout traject rechtzetten: start en aantal weken, verder niets. Geen sale en geen melding.
  // Verlenging met betaling gaat via Einde. Wordt het einde korter, dan kan de nachtronde de
  // klant op slot zetten; langer haalt een automatisch slot er vanzelf af (trigger).
  const bewaarLooptijd = async () => {
    const weken = Number(looptijd?.weken)
    if (!looptijd?.start || !Number.isInteger(weken) || weken < 1 || weken > 104) { setFout('Vul een startdatum en 1 tot 104 weken in'); return }
    setBezig(looptijd.id); setFout(null)
    // Zelfde als Coach Inzicht: het doel in Doelen en de plan-lijn in de gewichtgrafiek lopen mee.
    const goalDeadline = new Date(new Date(`${looptijd.start}T00:00:00`).getTime() + weken * 7 * 864e5).toLocaleDateString('sv-SE')
    const { data, error } = await supabase.from('clients')
      .update({ coaching_start_date: looptijd.start, coaching_total_weeks: weken, coaching_onbeperkt: false, goal_deadline: goalDeadline })
      .eq('id', looptijd.id).select('id').then(x => x, e => ({ error: e }))
    if (error || !data?.length) setFout(error?.message || 'Opslaan mislukt (geen rechten op deze klant?)')
    else {
      setEisen(o => { const n = { ...o }; delete n[looptijd.id]; return n })
      setLooptijd(null)
      await laad()
    }
    setBezig(null)
  }

  // Zeker = uitbetaling (besluit Kersten, 5 nov 2026). Is de challenge voorbij en de klant niet
  // geschikt, dan is de borg van ons en gaat hij op behouden. De trigger lead_movement_telt_mee
  // zet hem dan in de lopende uitbetaalperiode. Eenmalig per sale, alleen als hij al betaald is.
  useEffect(() => {
    if (!saleRijen || !instellingen.size) return
    const teDoen = []
    for (const [clientId, i] of instellingen) {
      const e = eisen[clientId]
      const sale = i.sale_id && saleRijen.find(x => x.id === i.sale_id)
      if (e?.voorbij && sale?.challenge_status === 'open' && sale.payment_received && borgOordeel(e, i)?.geschikt === false) teDoen.push(sale.id)
    }
    if (!teDoen.length) return
    supabase.from('lead_movements').update({ challenge_status: 'behouden' }).in('id', teDoen).eq('challenge_status', 'open')
      .select('id').then(({ error }) => {
        if (error) setFout(error.message || 'Borg bijwerken mislukt')
        else setSaleRijen(l => l.map(x => (teDoen.includes(x.id) ? { ...x, challenge_status: 'behouden' } : x)))
      }, e => setFout(e.message || 'Borg bijwerken mislukt'))
  }, [saleRijen, instellingen, eisen])

  // Einde aanklikken: looptijd of verlenging aanpassen, hetzelfde venster als in Coach Inzicht.
  const openTraject = async (r, borgOmzetten = null) => {
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
      .then(x => x, e => ({ error: e }))
    if (error) { setFout(error.message || 'Klant laden mislukt'); return }
    setTraject({ client, rij: r, betaald: true, borgId: borgVoor(r.client_id), borgOmzetten })
  }

  const zetStatus = async (clientId, klantCoach, status, pakket = null, extra = {}) => {
    const { error } = await supabase.from('client_doorstap').insert({
      client_id: clientId, coach_id: klantCoach || coachId, status: status || null, pakket, gezet_door: coachId, ...extra,
    }).then(r => r, e => ({ error: e }))
    if (error) throw error
  }

  // Pauze eraf. Staat als keuze in de Stand-dropdown, alleen bij wie op pauze staat.
  const hervat = async (r) => {
    setBezig(r.client_id); setFout(null)
    try {
      await hervatTraject(supabase, r.klant)
      setEisen(o => { const n = { ...o }; delete n[r.client_id]; return n })
      await laad()
    } catch (e) { setFout(e.message || 'Hervatten mislukt') }
    setBezig(null)
  }

  const zetKeuze = async (clientId, velden) => {
    setFout(null)
    try {
      await zetInstelling(clientId, velden)
      const nieuw = await haalInstellingen()
      setInstellingen(nieuw)
      // Toch geschikt: de borg kan terug, dus uit de uitbetaling. Niet als die maand al is
      // uitbetaald, en niet als de verlenging betaald is: dan is de borg sowieso van ons.
      const saleId = nieuw.get(clientId)?.sale_id
      const sale = saleId && saleRijen?.find(x => x.id === saleId)
      const verlengingBetaald = saleRijen?.some(x => x.borg_movement_id === saleId && x.payment_received)
      if (velden.borg_geschikt === true && sale?.challenge_status === 'behouden' && !verlengingBetaald) {
        const { data: rij } = await supabase.from('lead_movements').select('telt_mee_vanaf').eq('id', saleId).single()
        const { data: dicht } = rij?.telt_mee_vanaf
          ? await supabase.from('partner_payouts').select('id').eq('period', rij.telt_mee_vanaf).not('paid_at', 'is', null).limit(1)
          : { data: [] }
        if (dicht?.length) setFout('Die maand is al aan Marcel uitbetaald, dus de borg blijft daar staan. Regel dit met de volgende uitbetaling.')
        else {
          const { error } = await supabase.from('lead_movements').update({ challenge_status: 'open', telt_mee_vanaf: null }).eq('id', saleId)
          if (error) throw error
          setSaleRijen(l => l.map(x => (x.id === saleId ? { ...x, challenge_status: 'open' } : x)))
        }
      }
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
  }

  // Fout op de rij zelf (rood onder de naam) en in app_fouten. Bovenaan zag je hem vaak niet.
  const rijMislukt = (clientId, e, wat) => {
    const tekst = e?.message || wat
    setRijFout(o => ({ ...o, [clientId]: tekst }))
    const naam = rijen?.find(x => x.client_id === clientId)?.klant
    const melding = new Error(`${wat}${naam ? ` (${naamVan(naam)})` : ''}: ${tekst}${e?.code ? ` [${e.code}]` : ''}`)
    if (e?.stack) melding.stack = e.stack
    meldFout(melding, null, 'coach:business-os-doorstap')
  }
  const rijFoutWeg = (clientId) => setRijFout(o => { if (!o[clientId]) return o; const n = { ...o }; delete n[clientId]; return n })

  const wijzig = async (clientId, klantCoach, status, pakket, extra = {}) => {
    setBezig(clientId); setFout(null); rijFoutWeg(clientId)
    let ok = false
    try {
      await zetStatus(clientId, klantCoach, status, pakket, extra)
      await laad()
      ok = true
    } catch (e) { rijMislukt(clientId, e, 'Stand opslaan mislukt') }
    setBezig(null)
    return ok
  }

  // De borg afronden bij wie stopt (16 nov 2026): terugbetaald of behouden. Dezelfde ene
  // kolom als het lead-systeem (setChallengeStatus). Gekozen in het Afhandelen-venster.
  // Terugbetaald valt uit omzet en uitbetaling; behouden telt vanaf nu mee (trigger).
  // Omzetten kan ook achteraf, in beide richtingen (18 nov 2026). Niets zet een gekozen
  // terugbetaald terug: de automatische stap hierboven en de trigger borg-na-doorstap
  // pakken alleen een borg die nog open staat. Geeft true als het gelukt is.
  const zetBorg = async (r, sale, status) => {
    rijFoutWeg(r.client_id)
    const uit = await borgAfronden(sale, status)
    if (!uit.ok) { rijMislukt(r.client_id, uit.error, 'Borg afronden mislukt'); return false }
    if (uit.alUitbetaald) setFout('Deze borg is al aan Marcel uitbetaald. Verreken dat met de volgende uitbetaling.')
    return true
  }

  // Betaling binnen (keuze in het Afhandelen-venster).
  const betaald = async (r) => {
    if (bezig === r.client_id) return
    setFout(null); rijFoutWeg(r.client_id)
    if (!r.sale) {
      // Verlenging staat al op betaald, alleen de stand niet (vorige keer halverwege mislukt):
      // dan alleen de stand. Anders zou TrajectModal de omzet een tweede keer boeken.
      if (r.betaaldeSale) { await wijzig(r.client_id, r.coach_id, 'betaald', r.pakket); return }
      setBezig(r.client_id)
      const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
        .then(x => x, e => ({ error: e }))
      setBezig(null)
      if (error) { rijMislukt(r.client_id, error, 'Klant laden mislukt'); return }
        setTraject({ client, rij: r, betaald: true, borgId: borgVoor(r.client_id) })
      return
    }
    setBezig(r.client_id)
    try {
      const borg = r.sale.borg_movement_id || borgKeuze[r.client_id] || bekendeBorg(r.client_id)
      const { data, error } = await supabase.from('lead_movements').update({ payment_received: true, borg_movement_id: borg })
        .eq('id', r.sale.id).select('id').then(x => x, e => ({ error: e }))
      if (error) throw error
      if (!data?.length) throw new Error('Betaling niet opgeslagen (geen rechten op deze rij?)')
      // Zelfde vorm als na laden: de sale is nu de betaalde.
      setRijen(l => l.map(x => (x.client_id === r.client_id ? { ...x, sale: null, betaaldeSale: { ...r.sale, payment_received: true, borg_movement_id: borg } } : x)))
      await zetStatus(r.client_id, r.coach_id, 'betaald', r.pakket)
      setRijen(l => l.map(x => (x.client_id === r.client_id ? { ...x, status: 'betaald' } : x)))
      await laad()
    } catch (e) { rijMislukt(r.client_id, e, 'Betaald opslaan mislukt') }
    setBezig(null)
  }

  // TrajectModal dicht. Stand, omzetregel en borg zet boekVerlenging zelf (zelfde route als
  // Einde traject en Coach Inzicht).
  const trajectDicht = async () => {
    setTraject(null)
    await laad()
  }


  if (rijen === null) return null
  const ja = rijen.filter(r => r.status === 'ja_mondeling')
  // Een borg hoort bij één klant: wat al gekoppeld of gekozen is, kan een ander niet kiezen.
  const bezet = new Set([...ja.map(r => r.sale?.borg_movement_id), ...Object.values(borgKeuze)].filter(Boolean))
  // Op einddatum. Onbeperkt en wie geen einde heeft staan altijd onderaan.
  const eindWaarde = (x) => (x.eind ? new Date(`${x.eind}T12:00:00`).getTime() : null)
  const zichtbaar = rijen.filter(r => soortFilter === 'alles' || (soortFilter === 'challenge' ? r.challenge : !r.challenge))
    .sort((a, b) => {
      const ea = eindWaarde(a), eb = eindWaarde(b)
      if (ea == null || eb == null) return (ea == null) - (eb == null) || naamVan(a.klant).localeCompare(naamVan(b.klant))
      return (eindOplopend ? ea - eb : eb - ea) || naamVan(a.klant).localeCompare(naamVan(b.klant))
    })
  const wisselSorteer = () => {
    const nieuw = !eindOplopend
    setEindOplopend(nieuw)
    try { localStorage.setItem('myarc.doorstap.sorteer', nieuw ? 'op' : 'af') } catch { /* privémodus */ }
  }
  const metEisen = soortFilter !== 'coaching'
  const zoekTerm = zoek.trim().toLowerCase()
  const getoond = zoekTerm ? zichtbaar.filter(r => naamVan(r.klant).toLowerCase().includes(zoekTerm)) : zichtbaar
  // Door = echt betaald. Een mondeling ja telt pas als het geld binnen is.
  const telt = (id) => !instellingen.get(id)?.telt_niet_mee
  // Doorstap rekent over iedereen die via de challenge kwam, ook wie al door is en nu bij Coaching staat.
  const statRijen = rijen.filter(r => soortFilter === 'alles' || (soortFilter === 'challenge' ? r.vanChallenge : !r.vanChallenge))
  const zeiJa = statRijen.filter(r => r.status === 'betaald' && telt(r.client_id)).length
  const gesprekken = statRijen.filter(gesprekNodig).length
  const kiesSoort = (f) => {
    setSoortFilter(f); setOpenGetal(null)
    try { localStorage.setItem(FILTER_KEY, f) } catch { /* privémodus */ }
  }
  const metDatum = (l, tekst) => l.map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: tekst(x) }))
  const eindTekst = (x) => (x.onbeperkt ? 'Onbeperkt' : dagKort(x.eind))
  // Door tegen echt gestopt. Wie nog nadenkt of nog een gesprek moet hebben heeft nog niet
  // besloten en telt niet mee. Gestopt = zei nee, of de challenge is beëindigd.
  const nee = statRijen.filter(x => x.status === 'nee' && telt(x.client_id))
  const beeindigd = soortFilter === 'coaching' ? [] : gestopt.filter(c => telt(c.id) && !nee.some(x => x.client_id === c.id))
  // Alleen geld telt (16 nov 2026, Kersten): door = verlenging betaald, gestopt = borg
  // echt terugbetaald. Wie nee zei of stopte zonder geregistreerde refund telt nog niet mee.
  const saleVanKlant = new Map()
  for (const [clientId, i] of instellingen) if (i.sale_id) saleVanKlant.set(clientId, i.sale_id)
  const terugIds = new Set((saleRijen || []).filter(x => x.sale_kind === 'challenge' && x.challenge_status === 'terugbetaald').map(x => x.id))
  const geldTerug = (clientId) => terugIds.has(saleVanKlant.get(clientId))
  const gekoppeldeSales = new Set(saleVanKlant.values())
  const naamSale = (x) => { const w = String(x.lead_name || 'Onbekend').trim().split(/\s+/); return w.length === 2 && w[0] === w[1] ? w[0] : w.join(' ') }
  const terugRegels = soortFilter === 'coaching' ? [] : [
    ...nee.filter(x => geldTerug(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Geld terug' })),
    ...beeindigd.filter(c => geldTerug(c.id)).map(c => ({ id: c.id, naam: naamVan(c), sub: 'Geld terug' })),
    // Refund op een sale die aan geen klant hangt: telt ook, het geld is terug.
    ...(saleRijen || []).filter(x => terugIds.has(x.id) && !gekoppeldeSales.has(x.id)).map(x => ({ id: x.id, naam: naamSale(x), sub: 'Geld terug' })),
  ]
  const aantalGestopt = terugRegels.length
  const beslist = zeiJa + aantalGestopt
  const doorstapRegels = [
    ...statRijen.filter(x => x.status === 'betaald' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Door, betaald' })),
    ...terugRegels,
    ...nee.filter(x => !geldTerug(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: gestopt, geen refund' })),
    ...beeindigd.filter(c => !geldTerug(c.id)).map(c => ({ id: c.id, naam: naamVan(c), sub: 'Telt niet: gestopt, geen refund' })),
    ...statRijen.filter(x => x.status === 'ja_mondeling' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: nog niet betaald' })),
    ...statRijen.filter(x => x.status === 'denkt_na' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: denkt na' })),
    ...statRijen.filter(gesprekNodig).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: gesprek' })),
  ]
  const doorstapGetal = {
    id: 'doorstap', label: 'Doorstap', waarde: beslist ? `${Math.round((zeiJa / beslist) * 100)}%` : '—',
    sub: `${zeiJa} betaald · ${aantalGestopt} geld terug${gesprekken ? ` · ${gesprekken} gesprek open` : ''}`, regels: doorstapRegels,
  }
  // Coaching: geen borg, dus hier telt wie er loopt, wie bijna klaar is en wat er nog open staat.
  const openBedrag = zichtbaar.filter(x => x.sale)
  const coachingGetallen = [
    { id: 'lopend', label: 'Lopend', waarde: String(zichtbaar.length), sub: `${zichtbaar.filter(x => x.gepauzeerd).length} op pauze`, regels: metDatum(zichtbaar, eindTekst) },
    (() => { const l = zichtbaar.filter(x => x.dagen != null && x.dagen >= 0 && x.dagen <= 30); return { id: 'eindigt', label: '< 30 dagen', waarde: String(l.length), kleur: '#f59e0b', regels: metDatum(l, eindTekst) } })(),
    (() => { const l = zichtbaar.filter(x => x.dagen != null && x.dagen < 0 && !x.gepauzeerd); return { id: 'verlopen', label: 'Voorbij', waarde: String(l.length), kleur: l.length ? colors.danger : undefined, regels: metDatum(l, eindTekst) } })(),
    (() => { const l = zichtbaar.filter(x => x.eindcallNodig); return { id: 'eindcall', label: 'Eindcall', waarde: String(l.length), kleur: l.length ? colors.danger : undefined, regels: metDatum(l, eindTekst) } })(),
    { id: 'open', label: 'Open', waarde: euro(openBedrag.reduce((t, x) => t + (Number(x.sale.order_value) || 0), 0)), regels: openBedrag.map(x => ({ id: x.client_id, naam: naamVan(x.klant), bedrag: Number(x.sale.order_value) || 0 })) },
    doorstapGetal,
  ]
  const G = '#10b981'
  // Sale ↔ klant via de koppeling in client_challenge_instelling.
  const klantVanSale = new Map()
  for (const [clientId, i] of instellingen) if (i.sale_id) klantVanSale.set(i.sale_id, clientId)
  const rijVan = new Map(rijen.map(x => [x.client_id, x]))
  const geld = saleRijen && rekenGeld(saleRijen, {
    klantVan: (saleId) => { const x = rijVan.get(klantVanSale.get(saleId)); return x ? naamVan(x.klant) : null },
    nietGeschikt: (saleId) => {
      const id = klantVanSale.get(saleId)
      const e = id && eisen[id]
      return !!e?.voorbij && borgOordeel(e, instellingen.get(id))?.geschikt === false
    },
  })
  // Klein label achter een cijfer op de kaart, zoals KCAL / E / K / V op een maaltijdkaart.
  // Sluimer: zelfde stand, pakket en calldatum, plus sluimer_tot. tot = null maakt hem weer wakker.
  const sluimer = async (r, tot, notitie = null) => {
    setBezig(r.client_id); setFout(null); rijFoutWeg(r.client_id)
    const { error } = await supabase.from('client_doorstap').insert({
      client_id: r.client_id, coach_id: r.coach_id || coachId, status: r.status || null, pakket: r.pakket || null,
      call_datum: r.call_datum || null, sluimer_tot: tot, notitie, gezet_door: coachId,
    }).then(x => x, e => ({ error: e }))
    if (error) rijMislukt(r.client_id, error, 'Sluimer opslaan mislukt')
    else await laad()
    setBezig(null)
    return !error
  }

  // Bericht naar het klembord en WhatsApp open bij de klant, met de tekst al ingevuld. Het venster
  // gaat meteen open (anders blokkeert de browser het). Versturen doet Kersten zelf.
  const naarWhatsApp = async (r, tekst) => {
    const nr = waNummer(r.klant?.phone)
    const venster = nr ? window.open('', '_blank') : null
    const ok = await kopieer(tekst)
    if (!nr) { setBericht(b => ({ ...b, fout: ok ? 'Geen telefoonnummer bekend. Het bericht staat in je klembord.' : 'Geen telefoonnummer bekend.' })); return }
    const url = `https://wa.me/${nr}?text=${encodeURIComponent(tekst)}`
    if (venster) venster.location.href = url; else window.location.href = url
    setBericht(null)
    // Appje gestuurd = actie gedaan: drie dagen uit Actie nodig, dan komt hij terug als er niets veranderde.
    if (r.gestopt) return
    await sluimer(r, plusDagenIso(3), `Appje gestuurd: ${watNu(r).tekst || 'bericht'}`)
  }

  // Afhandelen-venster: de rij, de borg van die klant en "stopt" (stand nee + borg).
  const afhandelRij = afhandel ? [...(rijen || []), ...gestoptRijen].find(x => x.client_id === afhandel) || null : null
  const borgVan = (r) => {
    const id = instellingen.get(r.client_id)?.sale_id || r.sale?.borg_movement_id || r.betaaldeSale?.borg_movement_id || borgKeuze[r.client_id]
    return id ? (saleRijen || []).find(x => x.sale_kind === 'challenge' && x.id === id) || null : null
  }
  // Stopt: stand op nee (de nachtregel zet de app na het einde op slot) en de borg afronden.
  const stopt = async (r, borg, borgStatus) => {
    setBezig(r.client_id); setFout(null); rijFoutWeg(r.client_id)
    try {
      if (r.status !== 'nee') await zetStatus(r.client_id, r.coach_id, 'nee', r.pakket)
      const ok = borg && borgStatus ? await zetBorg(r, borg, borgStatus) : true
      await laad()
      if (ok) setAfhandel(null)
    } catch (e) { rijMislukt(r.client_id, e, 'Stopt opslaan mislukt') }
    setBezig(null)
  }

  const klein = { fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textSecondary }

  // Pdf om te delen: dezelfde cijfers en klanten als op het scherm, in dezelfde groepen.
  const exporteer = async () => {
    if (pdfBezig) return
    setPdfBezig(true); setFout(null)
    try {
      const soort = SOORT_FILTERS.find(([k]) => k === soortFilter)?.[1] || 'Challenge'
      const vandaag = new Date()
      const standTekst = (r) => (r.status === 'betaald' ? 'Betaald' : STATUS_KEUZE.find(([id]) => id === r.status)?.[1] || (gesprekNodig(r) ? 'Gesprek' : r.gepauzeerd ? 'Pauze' : ''))
      const eisenTekst = (r) => {
        const e = eisen[r.client_id]
        if (!r.challenge || !e) return ''
        const o = borgOordeel(e, instellingen.get(r.client_id))
        const ok = r.gepauzeerd ? null : (o ? o.geschikt : e.prognose?.ok)
        return `${e.behaald}/${e.totaal}${ok == null ? '' : ok ? ' ok' : ' niet'}`
      }
      const rij = (r) => {
        const bedrag = r.sale?.order_value ?? r.betaaldeSale?.order_value
        return [
          naamVan(r.klant),
          r.onbeperkt ? '' : r.week ? `${r.week}/${r.weken}` : '',
          r.onbeperkt ? 'Onbeperkt' : `${dagKort(r.start)} – ${dagKort(r.eind)}${dagenTekst(r) ? ` (${dagenTekst(r).toLowerCase()})` : ''}`,
          eisenTekst(r),
          r.volgendeCall ? callKort(r.volgendeCall.start) : r.eindcallNodig ? 'Geen' : '',
          standTekst(r),
          bedrag ? euro(bedrag).replace('€', '€ ') : '',
          watNu(r).tekst,
        ]
      }
      const getallen = soortFilter === 'challenge' && geld ? [
        { label: 'Verkocht', waarde: euro(geld.verkocht), sub: `${geld.aantal} challenges` },
        { label: 'Zeker', waarde: euro(geld.zeker) },
        { label: 'Toegezegd', waarde: euro(geld.toegezegd) },
        { label: 'Onzeker', waarde: euro(geld.onzeker), sub: `${geld.onzekerAantal} borgen` },
        { label: 'Refunds', waarde: euro(geld.refund) },
        { label: doorstapGetal.label, waarde: doorstapGetal.waarde, sub: doorstapGetal.sub },
      ] : coachingGetallen.map(g => ({ label: g.label, waarde: g.waarde, sub: g.sub }))
      await maakChallengePdf({
        kop: {
          titel: `${soort}-overzicht`,
          sub: `Stand van ${vandaag.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${zichtbaar.length} klanten`,
          bestand: `myarc-${soort.toLowerCase()}-overzicht-${vandaag.toLocaleDateString('sv-SE')}`,
        },
        getallen,
        groepen: GROEPEN.map(([groep, naam]) => ({ naam, rijen: zichtbaar.filter(x => watNu(x).groep === groep).map(rij) })),
        lijsten: soortFilter === 'challenge' && geld ? [
          { naam: 'Zeker', totaal: geld.zeker, regels: geld.lijsten.zeker },
          { naam: 'Toegezegd', totaal: geld.toegezegd, regels: geld.lijsten.toegezegd },
          { naam: 'Onzeker', totaal: geld.onzeker, regels: geld.lijsten.onzeker },
          { naam: 'Refunds', totaal: geld.refund, regels: geld.lijsten.refund },
        ] : [],
      })
    } catch (e) {
      setFout(`Pdf maken mislukt: ${e.message || 'onbekende fout'}`)
      meldFout(e, null, 'coach:business-os-doorstap-pdf')
    }
    setPdfBezig(false)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* CoachHub zet elke select op 16px (tegen inzoomen op de iPhone). Op de computer hoeft dat niet. */}
      <style>{`@media (min-width: 769px) { select.gd-stand, input.gd-stand { font-size: 0.78rem !important } }
        @keyframes gd-draai { to { transform: rotate(360deg) } }
        .gd-draai { animation: gd-draai 0.8s linear infinite }
        .gd-balk > :first-child { border-left: none !important }
        .gd-balk > :hover { color: #fff !important }`}</style>
      {/* Filter, zoekbalk en cijfers blijven boven staan; alleen de kaarten scrollen eronderdoor. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: colors.bg, paddingTop: 4, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ paddingBottom: 8 }}>
        <select className="gd-stand" aria-label="Soort traject" value={soortFilter} onChange={e => kiesSoort(e.target.value)} style={{
          height: 26, padding: 0, background: 'transparent', border: 'none', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', outline: 'none',
        }}>
          {SOORT_FILTERS.map(([k, l]) => <option key={k} value={k} style={{ background: '#0a0a0a', color: '#fff' }}>{l}</option>)}
        </select>
        {/* Het overzicht als pdf om te delen. */}
        <button type="button" onClick={exporteer} disabled={pdfBezig || !zichtbaar.length} title="Dit overzicht als pdf opslaan" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, marginLeft: 14, padding: '0 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.25)',
          background: 'transparent', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 900, cursor: pdfBezig ? 'default' : 'pointer', opacity: pdfBezig || !zichtbaar.length ? 0.5 : 1,
        }}>
          {pdfBezig ? <Loader2 size={13} strokeWidth={3} className="gd-draai" /> : <FileDown size={14} strokeWidth={2.6} />} {pdfBezig ? 'Bezig' : 'Pdf'}
        </button>
        {/* Zoeken op naam: filtert alleen de kaarten, de cijfers bovenaan blijven van iedereen. */}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, marginLeft: 10, padding: '0 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.25)', verticalAlign: 'top' }}>
          <Search size={13} strokeWidth={2.8} color={colors.textSecondary} />
          <input className="gd-stand" type="search" value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek klant" aria-label="Zoek klant"
            style={{ width: isMobile ? 110 : 170, height: 24, padding: 0, background: 'transparent', border: 'none', outline: 'none', color: colors.textPrimary, fontFamily: 'inherit', fontWeight: 800, WebkitAppearance: 'none' }} />
          {zoek && (
            <button type="button" onClick={() => setZoek('')} aria-label="Zoekveld leegmaken" style={{ display: 'inline-flex', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}>
              <X size={13} strokeWidth={3} />
            </button>
          )}
        </label>
      </div>
      {soortFilter === 'challenge' ? geld && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: isMobile ? '10px 8px' : '12px 18px', paddingBottom: 14 }}>
          {[
            { id: 'verkocht', label: 'Verkocht', waarde: euro(geld.verkocht), sub: `${geld.aantal} challenges`, regels: geld.lijsten.verkocht },
            { id: 'zeker', label: 'Zeker', waarde: euro(geld.zeker), kleur: G, regels: geld.lijsten.zeker },
            { id: 'toegezegd', label: 'Toegezegd', waarde: euro(geld.toegezegd), regels: geld.lijsten.toegezegd },
            { id: 'onzeker', label: 'Onzeker', waarde: euro(geld.onzeker), sub: `${geld.onzekerAantal} borgen`, regels: geld.lijsten.onzeker },
            { id: 'refund', label: 'Refunds', waarde: euro(geld.refund), regels: geld.lijsten.refund, leeg: 'Nog geen refunds geregistreerd' },
            doorstapGetal,
          ].map(k => <Getal key={k.id} {...k} open={openGetal === k.id} onKlik={() => setOpenGetal(o => (o === k.id ? null : k.id))} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(120px, 1fr))', gap: isMobile ? '10px 8px' : '12px 18px', paddingBottom: 14 }}>
          {coachingGetallen.map(k => <Getal key={k.id} {...k} open={openGetal === k.id} onKlik={() => setOpenGetal(o => (o === k.id ? null : k.id))} />)}
        </div>
      )}
      </div>

      {fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}
      {zichtbaar.length === 0 && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Niemand in deze lijst.</div>}

      {/* Eén kaart per klant, in de vorm van een maaltijdkaart (16 nov 2026,
          Kersten): links een tegel met de week, rechts de naam met de stand,
          het bedrag en het vinkje, en eronder traject, eisen en eindcall als
          cijfers met een klein label. Alles wat je kon aanklikken kan nog. */}
      {zichtbaar.length > 0 && (
        <div>
          <button type="button" onClick={wisselSorteer} title={eindOplopend ? 'Eerstvolgend einde bovenaan. Klik: omdraaien' : 'Laatste einde bovenaan. Klik: omdraaien'}
            style={{ padding: '0 0 6px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary }}>
Binnen een groep op einddatum {eindOplopend ? '↑' : '↓'}
          </button>
          {/* Kanban (24 nov 2026, Kersten): vier kolommen, zodat altijd helder is waar actie nodig is.
              Actie nodig: wie het dichtst bij het einde zit bovenaan. Door, nog niet betaald: vroegste
              betaaldatum bovenaan. Loopt: begin of midden traject. Afgerond staat standaard dicht. */}
          <style>{'.gd-kolom{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.18) transparent}.gd-kolom::-webkit-scrollbar{width:6px}.gd-kolom::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:3px}'}</style>
          <div style={{
            // Volle breedte; Afgerond is smal zolang hij dicht staat.
            display: 'grid', gap: isMobile ? 10 : 14,
            ...(isMobile
              ? { gridAutoFlow: 'column', gridAutoColumns: '86%' }
              : { gridTemplateColumns: `repeat(3, minmax(320px, 1fr)) ${!klaarOpen && !zoekTerm ? '180px' : 'minmax(320px, 1fr)'}` }),
            overflowX: 'auto', scrollSnapType: isMobile ? 'x mandatory' : undefined, WebkitOverflowScrolling: 'touch', alignItems: 'stretch', paddingBottom: 6,
            height: kanbanHoogte || undefined, boxSizing: 'border-box',
          }} ref={kanbanRef}>
          {GROEPEN.map(([groep, groepLabel]) => {
            const extra = groep === 'klaar' && soortFilter !== 'coaching'
              ? gestoptRijen.filter(g => !rijen.some(x => x.client_id === g.client_id) && (!zoekTerm || naamVan(g.klant).toLowerCase().includes(zoekTerm)))
              : []
            const inGroep = [...getoond.filter(x => watNu(x).groep === groep), ...extra]
            const dag = (x) => (x.dagen ?? 9999)
            const betaalDag = (x) => String(x.sale?.payment_due_date || x.sale?.start_op || '9999')
            const lijst = groep === 'actie' ? [...inGroep].sort((a, b) => dag(a) - dag(b) || volgorde(a) - volgorde(b))
              : groep === 'betaling' ? [...inGroep].sort((a, b) => betaalDag(a).localeCompare(betaalDag(b)))
                : inGroep
            const dicht = groep === 'klaar' && !klaarOpen && !zoekTerm
            return (
              <div key={groep} style={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', alignSelf: dicht ? 'start' : 'stretch', scrollSnapAlign: 'start', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 8 }}>
                <button type="button" onClick={groep === 'klaar' ? () => setKlaarOpen(o => !o) : undefined} aria-expanded={groep === 'klaar' ? klaarOpen : undefined}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 7, width: '100%', padding: '2px 4px 8px', background: 'none', border: 'none', fontFamily: 'inherit', cursor: groep === 'klaar' ? 'pointer' : 'default', color: colors.textPrimary, textAlign: 'left' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.02em', color: colors.textPrimary }}>{groepLabel}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary }}>{lijst.length}{groep === 'klaar' ? (klaarOpen ? ' · verbergen' : ' · tonen') : ''}</span>
                </button>
                {!lijst.length && <div style={{ padding: '4px 4px 6px', fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary }}>{groep === 'actie' ? 'Niets te doen' : 'Niemand'}</div>}
                {/* Kolom staat vast, de kaarten scrollen erbinnen (24 nov 2026). Ruimte boven voor de labels die
                    half over de rand van de eerste kaart steken. */}
                <div className="gd-kolom" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 2px 4px', flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
                {!dicht && lijst.map((r) => {
            const nodig = gesprekNodig(r)
            const nu = watNu(r)
            const bedrag = r.sale?.order_value ?? r.betaaldeSale?.order_value
            const e = eisen[r.client_id]
            // De borg van wie stopt: de challenge-sale die aan deze klant hangt.
            const borgId = instellingen.get(r.client_id)?.sale_id || r.sale?.borg_movement_id || r.betaaldeSale?.borg_movement_id
            const borgSale = borgId ? (saleRijen || []).find(x => x.sale_kind === 'challenge' && x.id === borgId) : null
            const open = looptijd?.id === r.client_id || openEisen === r.client_id || rijFout[r.client_id] || bericht?.id === r.client_id
            return (
              <div key={r.client_id} style={{ position: 'relative', minWidth: 0, opacity: nu.groep === 'klaar' ? 0.6 : 1, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
                {/* Nog niet betaald: oranje label rechtsboven, half over de rand (24 nov 2026, Kersten).
                    Alleen met een geboekte verlenging (r.sale); Ja zonder traject krijgt hem niet. */}
                {r.sale && r.status !== 'betaald' && (
                  <span title={r.pakket || 'Ja gezegd, nog niet betaald'} style={{ position: 'absolute', top: -10, right: 12, zIndex: 1, display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 999, background: '#f59e0b', color: '#0a0a0a', fontSize: '0.66rem', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Nog niet betaald</span>
                )}
                {/* Tijd: linksboven half over de rand, kleur naar hoe dicht bij het einde. Klik = looptijd/verlenging. */}
                {!r.onbeperkt && tijdTekst(r) && (() => {
                  const k = tijdKleur(r)
                  return (
                    <button type="button" onClick={() => openTraject(r)} title={`${dagKort(r.start)} – ${dagKort(r.eind)}. Klik: looptijd of verlenging aanpassen`}
                      style={{ position: 'absolute', top: -10, left: 12, zIndex: 1, display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 999, border: 'none', background: k.bg, color: k.fg, fontFamily: 'inherit', fontSize: '0.66rem', fontWeight: 900, whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                      {tijdTekst(r)}
                    </button>
                  )
                })()}
                <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
                  {/* Tegel: de week van het traject. Klik = start en aantal weken aanpassen. */}
                  <button type="button" title="Klik: start en aantal weken aanpassen" disabled={r.onbeperkt}
                    onClick={() => setLooptijd(o => (o?.id === r.client_id ? null : { id: r.client_id, start: r.klant.coaching_start_date || '', weken: r.klant.coaching_total_weeks || 6 }))}
                    style={{ width: isMobile ? 60 : 68, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 0', background: 'rgba(255,255,255,0.05)', border: 'none', borderTopLeftRadius: 11, borderBottomLeftRadius: open ? 0 : 11, color: colors.textPrimary, fontFamily: 'inherit', cursor: r.onbeperkt ? 'default' : 'pointer' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.onbeperkt ? '∞' : r.week ? `${r.week}/${r.weken}` : '—'}</span>
                    <span style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textSecondary }}>{r.gepauzeerd ? 'Pauze' : 'Week'}</span>
                    <WeekBalk week={r.week} weken={r.weken} />
                  </button>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.8rem' }}>
                    {/* Naam, bedrag en de stand als woord. De knoppen staan in de balk eronder. */}
                    {/* Naam op een eigen regel (24 nov 2026: in de kanban-kolom vielen namen weg achter de labels). */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                      <span title={r.pakket || undefined} style={{ flex: '0 1 auto', minWidth: 0, fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naamVan(r.klant)}</span>
                      {/* Wit label direct achter de naam zodra er geld verrekend is: betaald, borg behouden of terugbetaald. */}
                      {(() => {
                        const geldLabel = r.status === 'betaald' ? 'Betaald' : borgSale?.challenge_status === 'behouden' ? 'Behouden' : borgSale?.challenge_status === 'terugbetaald' ? 'Terugbetaald' : null
                        return geldLabel && (
                          <span style={{ flexShrink: 0, alignSelf: 'center', display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 6, background: colors.textPrimary, color: colors.bg, fontSize: '0.68rem', fontWeight: 900 }}>{geldLabel}</span>
                        )
                      })()}
                      {/* Rechts: de stand als woord (Ja, Denkt na, Gesprek, Pauze) of het bedrag. */}
                      {r.status !== 'betaald' && !r.sale && (STATUS_KEUZE.find(([id]) => id === r.status)?.[1] || nodig || r.gepauzeerd) && (
                        <span style={{ flexShrink: 0, marginLeft: 'auto', color: r.status ? colors.textPrimary : colors.textSecondary }}>
                          {STATUS_KEUZE.find(([id]) => id === r.status)?.[1] || (nodig ? 'Gesprek' : 'Pauze')}
                        </span>
                      )}
                      {bedrag ? <span style={{ flexShrink: 0, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontWeight: 900, color: colors.textPrimary }}>{euro(bedrag)}</span> : null}
                    </div>

                    {/* Cijferregel zoals op de maaltijdkaart: waarde, klein label erachter. */}
                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: isMobile ? '2px 9px' : '2px 11px', minWidth: 0 }}>
                      {/* Wat nu: jouw volgende stap, vooraan en in gewone taal. */}
                      {nu.tekst && (nu.bericht || nu.tekst === 'Traject boeken' ? (
                        // Klik: voorstel-bericht (kopiëren + WhatsApp), of bij Traject boeken het Afhandelen-venster.
                        <button type="button" title={nu.bericht ? 'Voorstel-bericht, kopiëren en WhatsApp openen' : 'Afhandelen'}
                          onClick={() => (nu.bericht
                            ? setBericht(b => (b?.id === r.client_id ? null : { id: r.client_id, tekst: berichtVoorstel(r, nu.bericht), fout: null }))
                            : setAfhandel(r.client_id))}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 900, whiteSpace: 'nowrap', color: colors.textPrimary, textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: 'rgba(255,255,255,0.3)' }}>
                          {nu.bericht ? <MessageCircle size={13} strokeWidth={2.6} /> : <ChevronRight size={13} strokeWidth={2.8} />}{nu.tekst}
                        </button>
                      ) : (
                        <span style={{ whiteSpace: 'nowrap', fontWeight: 900, color: nu.groep === 'klaar' ? colors.textSecondary : colors.textPrimary }}>
                          {nu.groep === 'actie' ? '→ ' : ''}{nu.tekst}
                        </span>
                      ))}
                      {metEisen && r.challenge && (
                        <button type="button" onClick={() => setOpenEisen(o => (o === r.client_id ? null : r.client_id))} title="De zes challenge-eisen"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: colors.textSecondary }}>
                          {e ? `${e.behaald}/${e.totaal}` : '…'}
                          {(() => {
                            // Handmatig of na afloop telt het oordeel, daarvoor de schatting. Op pauze staat de klok stil: geen teken.
                            if (!e || r.gepauzeerd) return null
                            const o = borgOordeel(e, instellingen.get(r.client_id))
                            const ok = o ? o.geschikt : e.prognose?.ok
                            if (ok == null) return null
                            return <span title={o ? o.tekst : ok ? 'Lijkt het te halen' : (e.prognose.kanNog ? 'Loopt achter op schema' : 'Kan het niet meer halen')} style={{ color: ok ? G : colors.danger }}> {ok ? '✓' : '✕'}</span>
                          })()}
                          <span style={klein}> eisen</span>
                        </button>
                      )}
                      {(r.volgendeCall || r.eindcallNodig) && (
                        <span title={`${r.volgendeCall ? `Eindcall ${callKort(r.volgendeCall.start)}. ` : ''}${r.eindcallNodig ? (r.volgendeCall ? `Te laat: uiterlijk 3 dagen voor het einde. ${r.volgendeCall.titel || ''}` : 'Geen eindcall ingepland') : (r.volgendeCall?.titel || '')}`}
                          style={{ whiteSpace: 'nowrap', color: r.eindcallNodig ? colors.danger : colors.textSecondary }}>
                          {r.volgendeCall ? `${dagKort(r.volgendeCall.start)}${r.naamChecken ? ' ?' : ''}` : 'Geen'}
                          <span style={klein}> call</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Eén knop (24 nov 2026, Kersten): wat doet hij? Alles staat in het venster. */}
                  <button type="button" disabled={bezig === r.client_id} onClick={() => { rijFoutWeg(r.client_id); setAfhandel(r.client_id) }}
                    style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', color: nu.groep === 'actie' ? colors.textPrimary : colors.textSecondary, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', opacity: bezig === r.client_id ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    {bezig === r.client_id ? <Loader2 size={14} strokeWidth={2.6} className="gd-draai" /> : null}
                    Afhandelen
                  </button>
                  </div>
                </div>

                {/* Wat openklapt: foutmelding, looptijd, de eisen, de borg. */}
                {open && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '6px 0.6rem' : '6px 0.8rem' }}>
                    {rijFout[r.client_id] && (
                      <div role="alert" style={{ padding: '0 0 5px', fontSize: '0.75rem', fontWeight: 800, color: colors.danger }}>{rijFout[r.client_id]}</div>
                    )}
                    {looptijd?.id === r.client_id && (() => {
                      const w = Number(looptijd.weken)
                      const nieuwEind = looptijd.start && w >= 1 ? new Date(new Date(`${looptijd.start}T12:00:00`).getTime() + (w * 7 + (Number(r.klant.coaching_paused_days_total) || 0)) * 864e5).toLocaleDateString('sv-SE') : null
                      const invoer = { height: 26, padding: '0 6px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: colors.textPrimary, fontFamily: 'inherit', fontWeight: 800 }
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0 0 6px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Start
                            <input className="gd-stand" type="date" value={looptijd.start} onChange={ev => setLooptijd(o => ({ ...o, start: ev.target.value }))} style={invoer} />
                          </label>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Weken
                            <input className="gd-stand" type="number" min="1" max="104" value={looptijd.weken} onChange={ev => setLooptijd(o => ({ ...o, weken: ev.target.value }))} style={{ ...invoer, width: 58 }} />
                          </label>
                          <span style={{ color: colors.textSecondary }}>Einde {dagKort(nieuwEind)}</span>
                          <button type="button" disabled={bezig === r.client_id} onClick={bewaarLooptijd} style={{ height: 26, padding: '0 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: colors.textPrimary, color: colors.bg, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 900 }}>Opslaan</button>
                          <button type="button" onClick={() => setLooptijd(null)} style={{ height: 26, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 800 }}>Annuleer</button>
                        </div>
                      )
                    })()}
                    {bericht?.id === r.client_id && (
                      <div style={{ padding: '2px 0 6px' }}>
                        <textarea value={bericht.tekst} onChange={ev => setBericht(b => ({ ...b, tekst: ev.target.value }))} rows={5} aria-label={`Bericht aan ${naamVan(r.klant)}`}
                          style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.45, padding: '0.5rem 0.6rem', outline: 'none' }} />
                        {bericht.fout && <div role="alert" style={{ marginTop: 4, fontSize: '0.74rem', fontWeight: 800, color: colors.danger }}>{bericht.fout}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button type="button" onClick={() => naarWhatsApp(r, bericht.tekst)} disabled={!bericht.tekst.trim()}
                            style={{ flex: 1, minHeight: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 9, border: 'none', cursor: 'pointer', background: colors.textPrimary, color: colors.bg, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900 }}>
                            <MessageCircle size={14} strokeWidth={2.6} /> Kopieer en open WhatsApp
                          </button>
                          <button type="button" onClick={() => setBericht(null)} style={{ minHeight: 34, padding: '0 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: colors.textSecondary, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>Sluit</button>
                        </div>
                      </div>
                    )}
                    {openEisen === r.client_id && <div style={{ padding: '0 0 6px' }}><EisenLijst eisen={e} instelling={instellingen.get(r.client_id)} onZet={(v) => zetKeuze(r.client_id, v)} /></div>}
                  </div>
                )}
              </div>
            )
                })}
                </div>
              </div>
            )
          })}
          </div>
          {zoekTerm && !getoond.length && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Niemand gevonden met "{zoek.trim()}".</div>}
        </div>
      )}

      {afhandelRij && (
        <AfhandelModal
          r={afhandelRij}
          // Betaald mét geboekte verlenging: stand niet meer wijzigen, anders blijft die boeking als wees in de omzet.
          vast={afhandelRij.status === 'betaald' && !!afhandelRij.betaaldeSale}
          naam={naamVan(afhandelRij.klant)}
          borgSale={borgVan(afhandelRij)}
          borgKandidaten={borgen.filter(b => b.id === borgKeuze[afhandelRij.client_id] || !bezet.has(b.id))}
          gekozenBorg={borgKeuze[afhandelRij.client_id] || ''}
          onKiesBorg={(id) => setBorgKeuze(k => ({ ...k, [afhandelRij.client_id]: id }))}
          bezig={bezig === afhandelRij.client_id}
          fout={rijFout[afhandelRij.client_id]}
          onClose={() => setAfhandel(null)}
          onBetaald={async () => { await betaald(afhandelRij); setAfhandel(null) }}
          onBetaalLink={async (link) => {
            const r = afhandelRij
            const waarde = link.trim() || null
            const { error } = await supabase.from('lead_movements').update({ betaal_link: waarde }).eq('id', r.sale.id).then(x => x, e => ({ error: e }))
            if (error) { rijMislukt(r.client_id, error, 'Betaallink opslaan mislukt'); return false }
            setRijen(l => l.map(x => (x.client_id === r.client_id && x.sale ? { ...x, sale: { ...x.sale, betaal_link: waarde } } : x)))
            return true
          }}
          onVerleng={() => { const r = afhandelRij; setAfhandel(null); openTraject(r) }}
          onBorgOmzetten={(borg) => { const r = afhandelRij; setAfhandel(null); openTraject(r, borg) }}
          onStatus={async (status, extra) => { if (await wijzig(afhandelRij.client_id, afhandelRij.coach_id, status, afhandelRij.pakket, extra)) setAfhandel(null) }}
          onStopt={(borg, borgStatus) => stopt(afhandelRij, borg, borgStatus)}
          onHervat={async () => { const r = afhandelRij; setAfhandel(null); await hervat(r) }}
          onSluimer={async (tot) => { const r = afhandelRij; if (await sluimer(r, tot, tot ? 'Even laten rusten' : 'Weer wakker')) setAfhandel(null) }}
        />
      )}

      {traject && (
        <TrajectModal open modus="verleng" client={traject.client} coachId={coachId}
          betaald={traject.betaald !== false} borgId={traject.borgId} borgOmzetten={traject.borgOmzetten || null}
          onClose={trajectDicht} />
      )}
    </div>
  )
}
