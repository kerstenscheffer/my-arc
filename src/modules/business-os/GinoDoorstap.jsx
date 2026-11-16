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

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, Loader2, FileDown, ChevronDown, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { meldFout } from '../../ui/PaginaVangnet'
import { colors } from '../../ui/tokens'
import TrajectModal from '../coach-command-center/components/TrajectModal'
import { computePeriod, hervatTraject } from '../coach-command-center/components/trajectPeriode'
import { haalVerlengen, EINDCALL_NODIG } from './verlengenData'
import { EisenLijst } from '../challenge-monitor/ChallengeEisenRegel'
import { haalEisen, haalInstellingen, zetInstelling, borgOordeel } from '../challenge-monitor/challengeCoach'
import { rekenGeld } from './challengeGeld'
import { maakChallengePdf } from './challengePdf'

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
const watNu = (r) => {
  if (r.status === 'betaald') return { groep: 'klaar', tekst: 'Door, betaald' }
  if (r.status === 'nee') return { groep: 'klaar', tekst: 'Gestopt' }
  if (r.status === 'ja_mondeling') return { groep: 'actie', tekst: 'Betaling ophalen' }
  if (r.eindcallNodig) return { groep: 'actie', tekst: 'Eindcall plannen' }
  if (r.status === 'denkt_na') return { groep: 'actie', tekst: 'Opvolgen: denkt na' }
  if (gesprekNodig(r)) return { groep: 'actie', tekst: 'Doorstapgesprek voeren' }
  if (!r.status && !r.gepauzeerd && !r.onbeperkt && r.dagen != null && r.dagen < 0) return { groep: 'actie', tekst: 'Traject voorbij: beslissen' }
  if (r.gepauzeerd) return { groep: 'loopt', tekst: 'Op pauze' }
  if (r.status === 'call') return { groep: 'loopt', tekst: 'Call ingepland' }
  return { groep: 'loopt', tekst: '' }
}
const dagenTekst = (r) => (r.onbeperkt ? 'Onbeperkt' : r.dagen == null ? null : r.dagen < 0 ? `${-r.dagen} ${r.dagen === -1 ? 'dag' : 'dagen'} voorbij` : r.dagen === 0 ? 'Eindigt vandaag' : `Nog ${r.dagen} ${r.dagen === 1 ? 'dag' : 'dagen'}`)
const GROEPEN = [['actie', 'Actie nodig'], ['loopt', 'Loopt'], ['klaar', 'Afgerond']]

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
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, width: 270, maxWidth: '86vw', maxHeight: 280, overflowY: 'auto', padding: '6px 10px',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
        }}>
          {sub && <div style={{ padding: '2px 0 4px', fontSize: '0.72rem', fontWeight: 700, color: colors.textSecondary }}>{sub}</div>}
          {regels.length === 0 && <div style={{ padding: '4px 0', fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary }}>{leeg}</div>}
          {regels.map((x, i) => (
            <div key={x.id || i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0', fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.naam}</span>
              {x.sub && <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: colors.textSecondary }}>{x.sub}</span>}
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
  const [bevestig, setBevestig] = useState(null) // client_id die 'Zeker?' toont (4 s)
  const bevestigKlok = useRef(null)
  const [rijFout, setRijFout] = useState({}) // client_id → fout, rood onder de naam
  const [traject, setTraject] = useState(null) // { client, rij, sinds }
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
  const [soortFilter, setSoortFilter] = useState(leesFilter)
  const [looptijd, setLooptijd] = useState(null) // { id, start, weken } terwijl je hem aanpast
  const [klaarOpen, setKlaarOpen] = useState(false) // de groep Afgerond staat standaard dicht
  const [pdfBezig, setPdfBezig] = useState(false)
  const [zoek, setZoek] = useState('')

  const laad = useCallback(async () => {
    const [ds, kl, au, bg, ch, vl] = await Promise.all([
      supabase.from('client_doorstap').select('client_id, coach_id, status, pakket, gezet_at')
        .order('gezet_at', { ascending: false }).order('id', { ascending: false })
        .then(r => r, e => ({ error: e })),
      supabase.from('clients').select('id, first_name, last_name, email, coach_id, coaching_onbeperkt, coaching_start_date, coaching_total_weeks, coaching_paused_days_total, coaching_status, coaching_paused_at').eq('status', 'active').order('first_name')
        .then(r => r, e => ({ error: e })),
      supabase.auth.getUser(),
      supabase.from('lead_movements').select('id, lead_name, order_value')
        .eq('sale_kind', 'challenge').eq('challenge_status', 'open').eq('payment_received', true).is('reverted_at', null)
        .order('lead_name')
        .then(r => r, e => ({ error: e })),
      supabase.from('lead_movements').select('id, lead_name, moved_at, order_value, challenge_status, payment_received, borg_movement_id, sale_kind')
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
    setInstellingen(await haalInstellingen().catch(() => new Map()))
    // Gestopt telt ook wie niet meer actief is, dus los van de klantenlijst hierboven.
    const { data: geeindigd } = await supabase.from('clients').select('id, first_name, last_name, email')
      .eq('coaching_status', 'ended').eq('coaching_total_weeks', CHALLENGE_WEKEN)
      .then(x => x, () => ({ data: [] }))
    setGestopt((geeindigd || []).filter(c => !isTest(c) && !['ja_mondeling', 'betaald'].includes(laatste.get(c.id)?.status)))

    // Verlengingen van deze klanten: het bedrag dat nog moet komen, of al betaald is.
    const ids = alle.map(c => c.id)
    const { data: sales, error: saleFout } = ids.length
      ? await supabase.from('lead_movements').select('id, client_id, order_value, borg_movement_id, payment_received')
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
          // Geen vlag op de klant: challenge = traject van 6 weken, of al een doorstap-stand.
          challenge: c.coaching_total_weeks === CHALLENGE_WEKEN || !!stand?.status, onbeperkt: !!c.coaching_onbeperkt,
          client_id: c.id, coach_id: stand?.coach_id || c.coach_id, status: stand?.status || null, pakket: stand?.pakket || null, gezet_at: stand?.gezet_at || null,
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
  const openTraject = async (r) => {
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
      .then(x => x, e => ({ error: e }))
    if (error) { setFout(error.message || 'Klant laden mislukt'); return }
    setTraject({ client, rij: r, sinds: new Date().toISOString() })
  }

  const zetStatus = async (clientId, klantCoach, status, pakket = null) => {
    const { error } = await supabase.from('client_doorstap').insert({
      client_id: clientId, coach_id: klantCoach || coachId, status: status || null, pakket, gezet_door: coachId,
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

  const wijzig = async (clientId, klantCoach, status, pakket) => {
    setBezig(clientId); setFout(null); rijFoutWeg(clientId)
    try {
      await zetStatus(clientId, klantCoach, status, pakket)
      await laad()
    } catch (e) { rijMislukt(clientId, e, 'Stand opslaan mislukt') }
    setBezig(null)
  }

  useEffect(() => () => clearTimeout(bevestigKlok.current), [])

  // Klik 1 = 'Zeker?' (4 seconden), klik 2 binnen die tijd = opslaan. Bewust een klok en
  // geen onBlur: Safari geeft een knop bij klikken geen focus, dus daar klopte dat niet.
  const betaald = async (r) => {
    if (bezig === r.client_id) return
    if (bevestig !== r.client_id) {
      clearTimeout(bevestigKlok.current)
      setBevestig(r.client_id)
      bevestigKlok.current = setTimeout(() => setBevestig(b => (b === r.client_id ? null : b)), 4000)
      return
    }
    clearTimeout(bevestigKlok.current)
    setBevestig(null); setFout(null); rijFoutWeg(r.client_id)
    if (!r.sale) {
      // Verlenging staat al op betaald, alleen de stand niet (vorige keer halverwege mislukt):
      // dan alleen de stand. Anders zou TrajectModal de omzet een tweede keer boeken.
      if (r.betaaldeSale) { await wijzig(r.client_id, r.coach_id, 'betaald', r.pakket); return }
      setBezig(r.client_id)
      const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
        .then(x => x, e => ({ error: e }))
      setBezig(null)
      if (error) { rijMislukt(r.client_id, error, 'Klant laden mislukt'); return }
      setTraject({ client, rij: r, sinds: new Date().toISOString() })
      return
    }
    setBezig(r.client_id)
    try {
      const borg = r.sale.borg_movement_id || borgKeuze[r.client_id] || null
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

  // TrajectModal dicht: alleen op betaald als er echt een verlenging is geboekt.
  const trajectDicht = async () => {
    const t = traject
    setTraject(null)
    const { data } = await supabase.from('lead_movements').select('id')
      .eq('client_id', t.rij.client_id).eq('outcome_type', 'verlenging').eq('payment_received', true)
      .gte('moved_at', t.sinds).limit(1)
      .then(x => x, () => ({ data: [] }))
    if (!data?.length) { await laad(); return }
    await wijzig(t.rij.client_id, t.rij.coach_id, 'betaald', t.rij.pakket)
    const borg = borgKeuze[t.rij.client_id]
    if (borg) {
      const { error } = await supabase.from('lead_movements').update({ borg_movement_id: borg }).eq('id', data[0].id)
        .then(x => x, e => ({ error: e }))
      if (error) rijMislukt(t.rij.client_id, error, 'Borg koppelen mislukt')
      else await laad()
    }
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
  const zeiJa = zichtbaar.filter(r => r.status === 'betaald' && telt(r.client_id)).length
  const gesprekken = zichtbaar.filter(gesprekNodig).length
  const kiesSoort = (f) => {
    setSoortFilter(f); setOpenGetal(null)
    try { localStorage.setItem(FILTER_KEY, f) } catch { /* privémodus */ }
  }
  const metDatum = (l, tekst) => l.map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: tekst(x) }))
  const eindTekst = (x) => (x.onbeperkt ? 'Onbeperkt' : dagKort(x.eind))
  // Door tegen echt gestopt. Wie nog nadenkt of nog een gesprek moet hebben heeft nog niet
  // besloten en telt niet mee. Gestopt = zei nee, of de challenge is beëindigd.
  const nee = zichtbaar.filter(x => x.status === 'nee' && telt(x.client_id))
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
    ...zichtbaar.filter(x => x.status === 'betaald' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Door, betaald' })),
    ...terugRegels,
    ...nee.filter(x => !geldTerug(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: gestopt, geen refund' })),
    ...beeindigd.filter(c => !geldTerug(c.id)).map(c => ({ id: c.id, naam: naamVan(c), sub: 'Telt niet: gestopt, geen refund' })),
    ...zichtbaar.filter(x => x.status === 'ja_mondeling' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: nog niet betaald' })),
    ...zichtbaar.filter(x => x.status === 'denkt_na' && telt(x.client_id)).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: denkt na' })),
    ...zichtbaar.filter(gesprekNodig).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Telt niet: gesprek' })),
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
  const klein = { fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textSecondary }
  const dun = { background: 'transparent', border: 'none', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none', maxWidth: '100%' }

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
        .gd-draai { animation: gd-draai 0.8s linear infinite }`}</style>
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
          {GROEPEN.map(([groep, groepLabel]) => {
            // Actie nodig op belang (wie het eerst iets van je nodig heeft), de rest op einddatum.
            const inGroep = getoond.filter(x => watNu(x).groep === groep)
            const lijst = groep === 'actie' ? [...inGroep].sort((a, b) => volgorde(a) - volgorde(b) || (a.dagen ?? 999) - (b.dagen ?? 999)) : inGroep
            if (!lijst.length) return null
            const dicht = groep === 'klaar' && !klaarOpen && !zoekTerm
            return (
              <div key={groep} style={{ marginBottom: 12 }}>
                <button type="button" onClick={groep === 'klaar' ? () => setKlaarOpen(o => !o) : undefined} aria-expanded={groep === 'klaar' ? klaarOpen : undefined}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 7, padding: '2px 0 6px', background: 'none', border: 'none', fontFamily: 'inherit', cursor: groep === 'klaar' ? 'pointer' : 'default', color: colors.textPrimary }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.02em', color: colors.textPrimary }}>{groepLabel}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary }}>{lijst.length}{groep === 'klaar' ? (klaarOpen ? ' · verbergen' : ' · tonen') : ''}</span>
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(400px, 1fr))', gap: 7, alignItems: 'start' }}>
                {!dicht && lijst.map((r) => {
            const nodig = gesprekNodig(r)
            const nu = watNu(r)
            const bedrag = r.sale?.order_value ?? r.betaaldeSale?.order_value
            const e = eisen[r.client_id]
            const eindKleur = r.dagen != null && r.dagen < 0 ? colors.danger : colors.textSecondary
            const open = looptijd?.id === r.client_id || openEisen === r.client_id || rijFout[r.client_id] || (r.status === 'ja_mondeling' && !r.sale?.borg_movement_id)
            return (
              <div key={r.client_id} style={{ minWidth: 0, opacity: nu.groep === 'klaar' ? 0.6 : 1, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden', fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
                <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
                  {/* Tegel: de week van het traject. Klik = start en aantal weken aanpassen. */}
                  <button type="button" title="Klik: start en aantal weken aanpassen" disabled={r.onbeperkt}
                    onClick={() => setLooptijd(o => (o?.id === r.client_id ? null : { id: r.client_id, start: r.klant.coaching_start_date || '', weken: r.klant.coaching_total_weeks || 6 }))}
                    style={{ width: isMobile ? 60 : 68, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 0', background: 'rgba(255,255,255,0.05)', border: 'none', color: colors.textPrimary, fontFamily: 'inherit', cursor: r.onbeperkt ? 'default' : 'pointer' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{r.onbeperkt ? '∞' : r.week ? `${r.week}/${r.weken}` : '—'}</span>
                    <span style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textSecondary }}>{r.gepauzeerd ? 'Pauze' : 'Week'}</span>
                    <WeekBalk week={r.week} weken={r.weken} />
                  </button>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.8rem' }}>
                    {/* Naam, stand, bedrag, vinkje */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span title={r.pakket || undefined} style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.9rem' : '0.96rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naamVan(r.klant)}</span>
                      {bedrag ? <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{euro(bedrag)}</span> : null}
                      {r.status === 'betaald' ? (
                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: G, fontSize: '0.75rem', fontWeight: 900 }}>
                          <Check size={12} strokeWidth={3.2} /> Betaald
                        </span>
                      ) : (() => {
                        // De stand als witte knop, zo breed als het woord. De select ligt er onzichtbaar overheen.
                        const leeg = !r.status && !nodig
                        const label = STATUS_KEUZE.find(([id]) => id === r.status)?.[1] || (nodig ? 'Gesprek' : r.gepauzeerd ? 'Pauze' : 'Stand')
                        return (
                          <span style={{ position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, height: 24, padding: '0 7px 0 10px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 900, whiteSpace: 'nowrap',
                            background: leeg ? 'transparent' : colors.textPrimary, color: leeg ? colors.textSecondary : colors.bg, border: leeg ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', opacity: bezig === r.client_id ? 0.5 : 1 }}>
                            {label}
                            <ChevronDown size={12} strokeWidth={3} />
                            <select className="gd-stand" aria-label={`Stand ${naamVan(r.klant)}`} title="Stand kiezen" value={r.status || ''} disabled={bezig === r.client_id}
                              onChange={ev => (ev.target.value === 'hervat' ? hervat(r) : wijzig(r.client_id, r.coach_id, ev.target.value, r.pakket))}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                              <option value="">{nodig ? 'Gesprek' : r.gepauzeerd ? 'Pauze' : 'Stand'}</option>
                              {STATUS_KEUZE.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
                              {r.gepauzeerd && <option value="hervat">Pauze eraf</option>}
                            </select>
                          </span>
                        )
                      })()}
                      {r.status === 'ja_mondeling' && (() => {
                        const zeker = bevestig === r.client_id
                        const laadt = bezig === r.client_id
                        return (
                          <button type="button" disabled={laadt} onClick={() => betaald(r)}
                            title={zeker ? 'Nog een keer klikken: betaald' : 'Betaald'} aria-label={zeker ? 'Zeker? Klik nog een keer: betaald' : 'Betaald'}
                            style={{
                              flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 24, minWidth: 24, padding: zeker || laadt ? '0 8px' : 0, borderRadius: 7, border: 'none', cursor: laadt ? 'default' : 'pointer',
                              background: zeker || laadt ? G : 'transparent', color: zeker || laadt ? colors.bg : colors.textPrimary, boxShadow: zeker || laadt ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.35)', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}>
                            {(zeker || laadt) && <span aria-live="polite">{laadt ? 'Bezig' : 'Zeker?'}</span>}
                            {laadt ? <Loader2 size={13} strokeWidth={3.2} className="gd-draai" /> : <Check size={13} strokeWidth={3.2} />}
                          </button>
                        )
                      })()}
                    </div>

                    {/* Cijferregel zoals op de maaltijdkaart: waarde, klein label erachter. */}
                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: isMobile ? '2px 10px' : '2px 14px', minWidth: 0 }}>
                      {/* Wat nu: jouw volgende stap, vooraan en in gewone taal. */}
                      {nu.tekst && (
                        <span style={{ whiteSpace: 'nowrap', fontWeight: 900, color: nu.groep === 'klaar' ? colors.textSecondary : colors.textPrimary }}>
                          {nu.groep === 'actie' ? '→ ' : ''}{nu.tekst}
                        </span>
                      )}
                      {/* Dagen in plaats van datums; de datums staan in de tooltip. */}
                      <button type="button" onClick={() => openTraject(r)} title={`${dagKort(r.start)} – ${dagKort(r.eind)}. Klik: looptijd of verlenging aanpassen`}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap', color: eindKleur }}>
                        {dagenTekst(r) || <><span style={{ color: colors.textSecondary }}>{dagKort(r.start)} – </span>{dagKort(r.eind)}</>}
                      </button>
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
                        <span title={r.eindcallNodig ? (r.volgendeCall ? `Te laat: uiterlijk 3 dagen voor het einde. ${r.volgendeCall.titel || ''}` : 'Geen eindcall ingepland') : (r.volgendeCall?.titel || '')}
                          style={{ whiteSpace: 'nowrap', color: r.eindcallNodig ? colors.danger : colors.textSecondary }}>
                          {r.volgendeCall ? `${callKort(r.volgendeCall.start)}${r.naamChecken ? ' ?' : ''}` : 'Geen'}
                          <span style={klein}> eindcall</span>
                        </span>
                      )}
                    </div>
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
                    {openEisen === r.client_id && <div style={{ padding: '0 0 6px' }}><EisenLijst eisen={e} instelling={instellingen.get(r.client_id)} onZet={(v) => zetKeuze(r.client_id, v)} /></div>}
                    {r.status === 'ja_mondeling' && !r.sale?.borg_movement_id && (
                      <select className="gd-stand" aria-label={`Borg van ${naamVan(r.klant)}`} value={borgKeuze[r.client_id] || ''} style={{ ...dun, fontSize: '0.75rem', color: colors.textSecondary }}
                        onChange={ev => setBorgKeuze(k => ({ ...k, [r.client_id]: ev.target.value }))}>
                        <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>Geen borg gekoppeld</option>
                        {borgen.filter(b => b.id === borgKeuze[r.client_id] || !bezet.has(b.id)).map(b => (
                          <option key={b.id} value={b.id} style={{ background: '#0a0a0a', color: '#fff' }}>Borg {b.lead_name} {euro(b.order_value)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )
                })}
                </div>
              </div>
            )
          })}
          {zoekTerm && !getoond.length && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Niemand gevonden met "{zoek.trim()}".</div>}
        </div>
      )}

      {traject && (
        <TrajectModal open modus="verleng" client={traject.client} coachId={coachId} onClose={trajectDicht} />
      )}
    </div>
  )
}
