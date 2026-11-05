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

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import TrajectModal from '../coach-command-center/components/TrajectModal'
import { computePeriod } from '../coach-command-center/components/trajectPeriode'
import { haalVerlengen, EINDCALL_NODIG } from './verlengenData'
import { EisenLijst } from '../challenge-monitor/ChallengeEisenRegel'
import { haalEisen } from '../challenge-monitor/challengeCoach'

const STATUS_KEUZE = [
  ['ja_mondeling', 'Ja'],
  ['denkt_na', 'Denkt na'],
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
const dagKort = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') : '—')
const callKort = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).replace(/\./g, '')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })}`
}

const metVerlengingLoos = (l, regel) => l.map(c => regel(c)).sort((a, b) => a.naam.localeCompare(b.naam))

// Wat de challenge oplevert. De borg telt pas als winst als de verlenging betaald is.
function rekenGeld(rijen) {
  const n = (x) => Number(x) || 0
  const challenges = rijen.filter(r => r.sale_kind === 'challenge' && n(r.order_value) > 0 && r.challenge_status !== 'uitgesteld')
  const verlengingen = rijen.filter(r => r.borg_movement_id && n(r.order_value) > 0)
  const borgVan = new Map(verlengingen.map(v => [v.borg_movement_id, v]))
  const som = (l) => l.reduce((t, r) => t + n(r.order_value), 0)
  const betaaldV = verlengingen.filter(v => v.payment_received)
  const openV = verlengingen.filter(v => !v.payment_received)
  const levend = challenges.filter(c => c.challenge_status !== 'terugbetaald')
  const zekerB = levend.filter(c => c.challenge_status === 'behouden' || borgVan.get(c.id)?.payment_received)
  const toegezegdB = levend.filter(c => !zekerB.includes(c) && borgVan.has(c.id))
  const onzekerB = levend.filter(c => !zekerB.includes(c) && !borgVan.has(c.id))
  // Sales staan op Instagram-naam, soms dubbel ("jan_de_vries jan_de_vries").
  const naam = (r) => {
    const w = String(r.lead_name || 'Onbekend').trim().split(/\s+/)
    return w.length === 2 && w[0] === w[1] ? w[0] : w.join(' ')
  }
  const regel = (r, extra = null) => ({ id: r.id, naam: naam(r), bedrag: n(r.order_value) + (extra ? n(extra.order_value) : 0), sub: dagKort(r.moved_at) })
  // De verlenging van wie de borg hoort: borg + verlenging op één regel.
  const metVerlenging = (l) => l.map(c => regel(c, borgVan.get(c.id))).sort((a, b) => a.naam.localeCompare(b.naam))
  const koppelbaar = new Set(challenges.map(c => c.id))
  const los = (l) => l.filter(v => !koppelbaar.has(v.borg_movement_id)).map(v => regel(v))
  return {
    lijsten: {
      verkocht: metVerlengingLoos(levend, regel),
      zeker: [...metVerlenging(zekerB), ...los(betaaldV)],
      toegezegd: [...metVerlenging(toegezegdB), ...los(openV)],
      onzeker: metVerlengingLoos(onzekerB, regel),
      refund: metVerlengingLoos(challenges.filter(c => c.challenge_status === 'terugbetaald'), regel),
    },
    aantal: levend.length,
    verkocht: som(levend),
    zeker: som(zekerB) + som(betaaldV),
    toegezegd: som(toegezegdB) + som(openV),
    onzeker: som(onzekerB),
    onzekerAantal: onzekerB.length,
    refund: som(challenges.filter(c => c.challenge_status === 'terugbetaald')),
  }
}

// Een getal bovenaan. Klik = eronder een klein lijstje met wie erachter zit.
function Getal({ label, waarde, sub, kleur, regels, open, onKlik, leeg = 'Niemand' }) {
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button type="button" aria-expanded={open} onClick={onKlik} style={{ display: 'block', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: kleur || colors.textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, whiteSpace: 'nowrap' }}>{waarde}</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textPrimary, marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, marginTop: 1, whiteSpace: 'nowrap' }}>{sub}</div>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, width: 270, maxWidth: '86vw', maxHeight: 280, overflowY: 'auto', padding: '6px 10px',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
        }}>
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
  if (!week || !weken) return <span style={{ color: colors.textSecondary }}>—</span>
  const aantal = Math.min(weken, 6)
  const vol = Math.round((week / weken) * aantal)
  return (
    <span title={`Week ${week} van ${weken}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{ display: 'inline-flex', gap: 2 }}>
        {Array.from({ length: aantal }, (_, i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i < vol ? colors.textPrimary : 'rgba(255,255,255,0.16)' }} />
        ))}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{week}/{weken}</span>
    </span>
  )
}

export default function GinoDoorstap() {
  const [rijen, setRijen] = useState(null)
  const [fout, setFout] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [bevestig, setBevestig] = useState(null)
  const [traject, setTraject] = useState(null) // { client, rij, sinds }
  const [borgen, setBorgen] = useState([]) // open challenge-sales die al betaald zijn
  const [borgKeuze, setBorgKeuze] = useState({}) // client_id → gekozen borg
  const [coachId, setCoachId] = useState(null)
  const [geld, setGeld] = useState(null)
  const [eisen, setEisen] = useState({}) // client_id → stand van de zes eisen
  const [openEisen, setOpenEisen] = useState(null)
  const [openGetal, setOpenGetal] = useState(null)
  const [soortFilter, setSoortFilter] = useState(leesFilter)
  const [looptijd, setLooptijd] = useState(null) // { id, start, weken } terwijl je hem aanpast

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
    if (!ch.error) setGeld(rekenGeld(ch.data || []))

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

  const wijzig = async (clientId, klantCoach, status, pakket) => {
    setBezig(clientId); setFout(null)
    try {
      await zetStatus(clientId, klantCoach, status, pakket)
      await laad()
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
    setBezig(null)
  }

  const betaald = async (r) => {
    if (bevestig !== r.client_id) { setBevestig(r.client_id); return }
    setBevestig(null); setFout(null)
    if (!r.sale) {
      const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
        .then(x => x, e => ({ error: e }))
      if (error) { setFout(error.message || 'Klant laden mislukt'); return }
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
      await zetStatus(r.client_id, r.coach_id, 'betaald', r.pakket)
      await laad()
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
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
    const borg = borgKeuze[t.rij.client_id]
    if (borg) {
      const { error } = await supabase.from('lead_movements').update({ borg_movement_id: borg }).eq('id', data[0].id)
        .then(x => x, e => ({ error: e }))
      if (error) setFout(error.message || 'Borg koppelen mislukt')
    }
    await wijzig(t.rij.client_id, t.rij.coach_id, 'betaald', t.rij.pakket)
  }

  if (rijen === null) return null
  const ja = rijen.filter(r => r.status === 'ja_mondeling')
  // Een borg hoort bij één klant: wat al gekoppeld of gekozen is, kan een ander niet kiezen.
  const bezet = new Set([...ja.map(r => r.sale?.borg_movement_id), ...Object.values(borgKeuze)].filter(Boolean))
  const zichtbaar = rijen.filter(r => soortFilter === 'alles' || (soortFilter === 'challenge' ? r.challenge : !r.challenge))
  const metEisen = soortFilter !== 'coaching'
  const metStand = zichtbaar.filter(r => r.status)
  const zeiJa = zichtbaar.filter(r => r.status === 'ja_mondeling' || r.status === 'betaald').length
  const gesprekken = zichtbaar.filter(gesprekNodig).length
  const kiesSoort = (f) => {
    setSoortFilter(f); setOpenGetal(null)
    try { localStorage.setItem(FILTER_KEY, f) } catch { /* privémodus */ }
  }
  const metDatum = (l, tekst) => l.map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: tekst(x) }))
  const eindTekst = (x) => (x.onbeperkt ? 'Onbeperkt' : dagKort(x.eind))
  const doorstapRegels = [
    ...metStand.map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: { ja_mondeling: 'Ja', betaald: 'Betaald', denkt_na: 'Denkt na', nee: 'Nee' }[x.status] || x.status })),
    ...zichtbaar.filter(gesprekNodig).map(x => ({ id: x.client_id, naam: naamVan(x.klant), sub: 'Gesprek nodig' })),
  ]
  const doorstapGetal = {
    id: 'doorstap', label: 'Doorstap', waarde: metStand.length ? `${Math.round((zeiJa / metStand.length) * 100)}%` : '—',
    sub: `${zeiJa} van ${metStand.length} ja${gesprekken ? ` · ${gesprekken} gesprek open` : ''}`, regels: doorstapRegels,
  }
  // Coaching: geen borg, dus hier telt wie er loopt, wie bijna klaar is en wat er nog open staat.
  const openBedrag = zichtbaar.filter(x => x.sale)
  const coachingGetallen = [
    { id: 'lopend', label: 'Lopend', waarde: String(zichtbaar.length), sub: `${zichtbaar.filter(x => x.gepauzeerd).length} op pauze`, regels: metDatum(zichtbaar, eindTekst) },
    (() => { const l = zichtbaar.filter(x => x.dagen != null && x.dagen >= 0 && x.dagen <= 30); return { id: 'eindigt', label: 'Eindigt binnen 30 dagen', waarde: String(l.length), kleur: '#f59e0b', regels: metDatum(l, eindTekst) } })(),
    (() => { const l = zichtbaar.filter(x => x.dagen != null && x.dagen < 0 && !x.gepauzeerd); return { id: 'verlopen', label: 'Einde voorbij', waarde: String(l.length), kleur: l.length ? colors.danger : undefined, regels: metDatum(l, eindTekst) } })(),
    (() => { const l = zichtbaar.filter(x => x.eindcallNodig); return { id: 'eindcall', label: 'Eindcall nodig', waarde: String(l.length), kleur: l.length ? colors.danger : undefined, regels: metDatum(l, eindTekst) } })(),
    { id: 'open', label: 'Verlenging open', waarde: euro(openBedrag.reduce((t, x) => t + (Number(x.sale.order_value) || 0), 0)), regels: openBedrag.map(x => ({ id: x.client_id, naam: naamVan(x.klant), bedrag: Number(x.sale.order_value) || 0 })) },
    doorstapGetal,
  ]
  const G = '#10b981'
  const lijn = '1px solid rgba(255,255,255,0.1)'
  const kolommen = metEisen ? '148px 48px 48px 92px 44px 138px 112px 46px 62px' : '148px 48px 62px 92px 138px 112px 46px 62px'
  const dun = { background: 'transparent', border: 'none', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none', maxWidth: '100%' }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* CoachHub zet elke select op 16px (tegen inzoomen op de iPhone). Op de computer hoeft dat niet. */}
      <style>{`@media (min-width: 769px) { select.gd-stand, input.gd-stand { font-size: 0.78rem !important } }`}</style>
      <div style={{ paddingBottom: 12 }}>
        <select className="gd-stand" aria-label="Soort traject" value={soortFilter} onChange={e => kiesSoort(e.target.value)} style={{
          height: 30, padding: '0 8px', borderRadius: 8, background: 'transparent', border: '1.5px solid #fff', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none',
        }}>
          {SOORT_FILTERS.map(([k, l]) => <option key={k} value={k} style={{ background: '#0a0a0a', color: '#fff' }}>{l} ({rijen.filter(x => k === 'alles' || (k === 'challenge' ? x.challenge : !x.challenge)).length})</option>)}
        </select>
      </div>
      {soortFilter === 'challenge' ? geld && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px 18px', paddingBottom: 14 }}>
          {[
            { id: 'verkocht', label: 'Verkocht', waarde: euro(geld.verkocht), sub: `${geld.aantal} challenges`, regels: geld.lijsten.verkocht },
            { id: 'zeker', label: 'Zeker verdiend', waarde: euro(geld.zeker), kleur: G, regels: geld.lijsten.zeker },
            { id: 'toegezegd', label: 'Toegezegd', waarde: euro(geld.toegezegd), regels: geld.lijsten.toegezegd },
            { id: 'onzeker', label: 'Nog onzeker', waarde: euro(geld.onzeker), sub: `${geld.onzekerAantal} borgen`, kleur: '#f59e0b', regels: geld.lijsten.onzeker },
            { id: 'refund', label: 'Refunds', waarde: euro(geld.refund), regels: geld.lijsten.refund, leeg: 'Nog geen refunds geregistreerd' },
            doorstapGetal,
          ].map(k => <Getal key={k.id} {...k} open={openGetal === k.id} onKlik={() => setOpenGetal(o => (o === k.id ? null : k.id))} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px 18px', paddingBottom: 14 }}>
          {coachingGetallen.map(k => <Getal key={k.id} {...k} open={openGetal === k.id} onKlik={() => setOpenGetal(o => (o === k.id ? null : k.id))} />)}
        </div>
      )}

      {fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}
      {zichtbaar.length === 0 && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Niemand in deze lijst.</div>}

      {zichtbaar.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ width: 'max-content' }}>
            <div style={{ display: 'grid', gridTemplateColumns: kolommen, gap: 8, padding: '0 0 4px', fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary }}>
              <span>Klant</span><span>Start</span><span>Einde</span><span>Week</span>{metEisen && <span>Eisen</span>}<span>Eindcall</span><span>Stand</span><span style={{ textAlign: 'right' }}>Verl.</span><span />
            </div>
            {zichtbaar.map((r) => {
              const nodig = gesprekNodig(r)
              const bedrag = r.sale?.order_value ?? r.betaaldeSale?.order_value
              return (
                <div key={r.client_id} style={{ borderTop: lijn }}>
                  <div style={{ display: 'grid', gridTemplateColumns: kolommen, gap: 8, alignItems: 'center', minHeight: 28, fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
                    <span title={r.pakket || undefined} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naamVan(r.klant)}</span>
                    <span style={{ whiteSpace: 'nowrap', color: colors.textSecondary }}>{dagKort(r.start)}</span>
                    <button type="button" onClick={() => openTraject(r)} title={`${r.dagen != null ? (r.dagen < 0 ? `${-r.dagen} dagen voorbij` : `Nog ${r.dagen} dagen`) : ''}. Klik: looptijd of verlenging aanpassen`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', whiteSpace: 'nowrap', color: r.dagen == null ? colors.textSecondary : r.dagen < 0 ? colors.danger : r.dagen <= 7 ? '#f59e0b' : colors.textPrimary }}>{r.onbeperkt ? 'Onbeperkt' : dagKort(r.eind)}</button>
                    <button type="button" title="Klik: start en aantal weken aanpassen" disabled={r.onbeperkt} onClick={() => setLooptijd(o => (o?.id === r.client_id ? null : { id: r.client_id, start: r.klant.coaching_start_date || '', weken: r.klant.coaching_total_weeks || 6 }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left' }}>
                      <WeekBalk week={r.week} weken={r.weken} />
                    </button>
                    {metEisen && (r.challenge ? (
                    <button type="button" onClick={() => setOpenEisen(o => (o === r.client_id ? null : r.client_id))} title="De zes challenge-eisen" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', fontVariantNumeric: 'tabular-nums', color: eisen[r.client_id]?.alles ? G : colors.textPrimary }}>
                      {eisen[r.client_id] ? `${eisen[r.client_id].behaald}/${eisen[r.client_id].totaal}` : '…'}
                    </button>
                    ) : <span style={{ color: colors.textSecondary }}>—</span>)}
                    <span title={r.volgendeCall?.titel || undefined} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: r.eindcallNodig ? colors.danger : r.volgendeCall ? (r.naamChecken ? '#f59e0b' : G) : colors.textSecondary }}>
                      {r.volgendeCall && !r.eindcallNodig ? `${callKort(r.volgendeCall.start)}${r.naamChecken ? ' ?' : ''}` : r.eindcallNodig ? (r.volgendeCall ? `Niet op tijd${r.naamChecken ? ' ?' : ''}` : 'Niet ingepland') : r.gepauzeerd ? 'Pauze' : r.status === 'betaald' ? 'Hoeft niet' : r.agendaBekend ? 'Nog niet nodig' : '—'}
                    </span>
                    {r.status === 'betaald' ? (
                      <span style={{ color: G }}>Betaald</span>
                    ) : (
                      <select className="gd-stand" aria-label={`Stand ${naamVan(r.klant)}`} value={r.status || ''} disabled={bezig === r.client_id}
                        onChange={e => wijzig(r.client_id, r.coach_id, e.target.value, r.pakket)}
                        style={{ ...dun, color: r.status === 'ja_mondeling' ? G : r.status === 'nee' ? colors.danger : nodig ? '#f59e0b' : colors.textPrimary }}>
                        <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>{nodig ? 'Gesprek nodig' : r.gepauzeerd ? 'Pauze' : 'Loopt'}</option>
                        {STATUS_KEUZE.map(([id, label]) => <option key={id} value={id} style={{ background: '#0a0a0a', color: '#fff' }}>{label}</option>)}
                      </select>
                    )}
                    <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: bedrag ? colors.textPrimary : colors.textSecondary }}>{bedrag ? euro(bedrag) : '—'}</span>
                    <span style={{ textAlign: 'right' }}>
                      {r.status === 'ja_mondeling' && (
                        <button type="button" disabled={bezig === r.client_id} onClick={() => betaald(r)}
                          onBlur={() => setBevestig(b => (b === r.client_id ? null : b))}
                          style={{
                            minHeight: 22, padding: '0 8px', borderRadius: 7, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                            background: colors.textPrimary, color: colors.bg, fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit',
                          }}>
                          {bevestig === r.client_id ? 'Zeker?' : 'Betaald'}
                        </button>
                      )}
                    </span>
                  </div>
                  {looptijd?.id === r.client_id && (() => {
                    const w = Number(looptijd.weken)
                    const nieuwEind = looptijd.start && w >= 1 ? new Date(new Date(`${looptijd.start}T12:00:00`).getTime() + (w * 7 + (Number(r.klant.coaching_paused_days_total) || 0)) * 864e5).toLocaleDateString('sv-SE') : null
                    const invoer = { height: 26, padding: '0 6px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: colors.textPrimary, fontFamily: 'inherit', fontWeight: 800 }
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '0 0 6px', fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Start
                          <input className="gd-stand" type="date" value={looptijd.start} onChange={e => setLooptijd(o => ({ ...o, start: e.target.value }))} style={invoer} />
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Weken
                          <input className="gd-stand" type="number" min="1" max="104" value={looptijd.weken} onChange={e => setLooptijd(o => ({ ...o, weken: e.target.value }))} style={{ ...invoer, width: 58 }} />
                        </label>
                        <span style={{ color: colors.textSecondary }}>Einde {dagKort(nieuwEind)}</span>
                        <button type="button" disabled={bezig === r.client_id} onClick={bewaarLooptijd} style={{ height: 26, padding: '0 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: colors.textPrimary, color: colors.bg, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 900 }}>Opslaan</button>
                        <button type="button" onClick={() => setLooptijd(null)} style={{ height: 26, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 800 }}>Annuleer</button>
                      </div>
                    )
                  })()}
                  {openEisen === r.client_id && <div style={{ padding: '0 0 6px' }}><EisenLijst eisen={eisen[r.client_id]} /></div>}
                  {r.status === 'ja_mondeling' && !r.sale?.borg_movement_id && (
                    <div style={{ padding: '0 0 5px' }}>
                      <select className="gd-stand" aria-label={`Borg van ${naamVan(r.klant)}`} value={borgKeuze[r.client_id] || ''} style={{ ...dun, fontSize: '0.75rem', color: colors.textSecondary }}
                        onChange={e => setBorgKeuze(k => ({ ...k, [r.client_id]: e.target.value }))}>
                        <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>Geen borg gekoppeld</option>
                        {borgen.filter(b => b.id === borgKeuze[r.client_id] || !bezet.has(b.id)).map(b => (
                          <option key={b.id} value={b.id} style={{ background: '#0a0a0a', color: '#fff' }}>Borg {b.lead_name} {euro(b.order_value)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {traject && (
        <TrajectModal open modus="verleng" client={traject.client} coachId={coachId} onClose={trajectDicht} />
      )}
    </div>
  )
}
