// src/modules/coach-command-center/components/insight/TrainingWeekInzicht.jsx
//
// De kaart Training in Coach Inzicht, in dezelfde opbouw als de kaart Voeding
// (17 nov 2026, Kersten): dagenstrook, een tegel per dag met donkere foto,
// de cijfers van de gekozen dag, en een stapeltje 'gedaan' dat openklapt met
// rechts de weekcijfers.
//
// Eigen onderdeel van de coach. Het weekrooster op de workoutpagina van de
// klant (WeekSchedule) en in de Workout Builder (KlantWeekrooster) blijft wat
// het was: plannen en schuiven doe je daar, hier kijk je alleen.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SlaapInsight from './SlaapInsight'
import { ChevronLeft, ChevronRight, CircleCheck, Info, HeartPulse, MessageSquare, ArrowLeftRight, Footprints, Moon, ExternalLink, X, AlertTriangle, CalendarDays } from 'lucide-react'
import WorkoutServiceNew from '../../../workout/services/WorkoutServiceNew'
import CardioService from '../../../workout/services/CardioService'
import StappenService, { STANDAARD_DOEL } from '../../../steps/StappenService'
import { trainingenVanDag } from '../../../workout/utils/extraTrainingen'
import { getWorkoutImage } from '../../../workout/components/week-schedule/workoutImage'
import { cardioFoto } from '../../../workout/utils/workoutFoto'
import { kcalKleur } from '../../../meal-plan/utils/kcalKleur'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { ClientAgendaService, recurringIdFor, DAYS as AGENDA_DAGEN } from '../../../client-agenda/ClientAgendaService'
import { spierWoord } from '../../../workout/bouwfase/bouwfaseData'
import { spierpijnVan } from '../../../workout/bouwfase/rir'

const LIJN = 'rgba(255,255,255,0.08)'
const GROEN = '#10b981'
// Breedte van de balken rechts in een tegel (kcal, eiwit, water) in de gecombineerde week.
const BALKEN = 42
// Een kolom onder de agenda: scrolt zelf, zonder zichtbare balk.
const KOLOM_SCROLL = { minWidth: 0, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: '1rem' }
// Slaapdoel voor de paarse band bovenin de tegel.
const SLAAP_DOEL = 8
const PAARS = '#a855f7'
const DAG_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAG_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const ACTIVITEIT = { swimming: 'Zwemmen', cardio: 'Cardio', hiking: 'Wandelen', cycling: 'Fietsen', running: 'Hardlopen' }

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
const sleutel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const maandagVan = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
const plusDagen = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const kort = (x) => (x >= 10000 ? `${Math.round(x / 1000)}k` : x >= 1000 ? `${(x / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k` : String(x))

// Rood (ver van het doel) via oranje naar groen (op het doel), t van 0 tot 1.
const schaal = (t) => {
  const x = Math.max(0, Math.min(1, t))
  const van = x < 0.5 ? [239, 68, 68] : [245, 158, 11]
  const naar = x < 0.5 ? [245, 158, 11] : [16, 185, 129]
  const u = x < 0.5 ? x / 0.5 : (x - 0.5) / 0.5
  return `rgb(${van.map((v, i) => Math.round(v + (naar[i] - v) * u)).join(',')})`
}

// Label direct boven het getal, dunne balk er strak onder.
// `onKlik` + `hint`: het cijfer opent het venster dat erbij hoort (stappendoel,
// kracht, bouwfase, cardio); stond eerder als los icoon in de kop.
function Balk({ label, waarde, doel, eenheid = '', kleur = '#fff', onKlik = null, hint = '' }) {
  const pct = doel > 0 ? Math.min(100, (waarde / doel) * 100) : 0
  return (
    <div onClick={onKlik || undefined} title={onKlik ? hint : undefined} style={{ flex: 1, minWidth: 0, cursor: onKlik ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.1 }}>
        {label}{onKlik && <ChevronRight size={10} strokeWidth={3} />}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {fmt(waarde)}<span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{doel > 0 ? ` / ${fmt(doel)}${eenheid}` : eenheid}</span>
      </div>
      <div style={{ height: 3, marginTop: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// `workouts` = alle sessies van de klant (uit WorkoutColumn).
// `naamVoorSessie(w)` = naam van de training; `sessieTelling(w)` =
// { sets, oefeningen, notities, wissels }; `tijdVan(w)` = 'uu:mm' of null;
// `toonSessie(w)` geeft de oefeningkaarten van die sessie terug.
export default function TrainingWeekInzicht({ client, db, isMobile, workouts = [], naamVoorSessie, sessieTelling, toonSessie, tijdVan, voeding = null, acties = null }) {
  const clientId = client?.id
  const vandaagSleutel = sleutel(new Date())
  const [gekozen, setGekozen] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const maandag = maandagVan(gekozen)
  const weekSleutel = sleutel(maandag)

  const [schema, setSchema] = useState(null)
  const [vast, setVast] = useState(undefined) // vaste weekindeling; undefined = nog laden
  const [planning, setPlanning] = useState({}) // { weekSleutel: schedule }
  const [cardioBlokken, setCardioBlokken] = useState({}) // { weekSleutel: [blokken] }
  const [cardioLogs, setCardioLogs] = useState([])
  const [stappen, setStappen] = useState({}) // { weekSleutel: [7 dagen] }
  const [stappenDoel, setStappenDoel] = useState(STANDAARD_DOEL)
  const [gewicht, setGewicht] = useState({}) // { 'YYYY-MM-DD': kg } — de weging van die dag
  const [cijfer, setCijfer] = useState({}) // { 'YYYY-MM-DD': cijfer dat de klant de workout gaf }
  const [signalen, setSignalen] = useState({}) // { 'YYYY-MM-DD': [{ tekst, erg }] } — waar de coach naar moet kijken
  const [slaap, setSlaap] = useState({}) // { 'YYYY-MM-DD': uren } — de nacht die op die dag eindigt
  const [slaapVenster, setSlaapVenster] = useState(null) // dag (iso) waarvan de slaapband is aangeklikt

  // Eén keer per klant: plan, vaste indeling, stappendoel en de cardiologs
  // van het laatste halfjaar.
  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    const vanaf = sleutel(plusDagen(new Date(), -183))
    Promise.all([
      db.getClientSchema(clientId).then(r => r, () => null),
      db.getClientWorkoutSchedule(clientId).then(r => r, () => null),
      StappenService.haalDoel(db, clientId).then(r => r, () => STANDAARD_DOEL),
      CardioService.getLogs(clientId, vanaf, db).then(r => r, () => []),
    ]).then(([s, v, doel, logs]) => {
      if (weg) return
      setSchema(s || null); setVast(v || {}); setStappenDoel(doel || STANDAARD_DOEL); setCardioLogs(logs || [])
    })
    return () => { weg = true }
  }, [clientId, db])

  // Het stappendoel is net aangepast (stappenvenster): direct overnemen.
  useEffect(() => {
    const nieuw = (e) => { if (e.detail?.clientId === clientId && Number(e.detail.doel) > 0) setStappenDoel(Number(e.detail.doel)) }
    window.addEventListener('myarc:stappendoel', nieuw)
    return () => window.removeEventListener('myarc:stappendoel', nieuw)
  }, [clientId])

  // Per getoonde week: de planning van die week, de geplande cardio en de stappen.
  useEffect(() => {
    if (!clientId || !db?.supabase || vast === undefined) return
    let weg = false
    const ma = new Date(`${weekSleutel}T00:00:00`)
    const dezeWeek = weekSleutel === sleutel(maandagVan(new Date()))
    Promise.all([
      dezeWeek ? Promise.resolve(vast) : WorkoutServiceNew.getPlanningVoorWeek(clientId, weekSleutel, vast, db).then(r => r, () => vast),
      db.supabase.from('client_agenda_blocks').select('id, day, label, sublabel, start_time, end_time, week_start, skip_weeks')
        .eq('client_id', clientId).eq('type', 'custom').ilike('label', 'Cardio ·%')
        .or(`week_start.is.null,week_start.eq.${weekSleutel}`)
        .then(r => r, () => ({ data: [] })),
      StappenService.haalWeek(db, clientId, ma).then(r => r, () => []),
      db.supabase.from('sleep_logs').select('log_date, hours_slept')
        .eq('client_id', clientId).gte('log_date', weekSleutel).lte('log_date', sleutel(plusDagen(ma, 6)))
        .then(r => r, () => ({ data: [] })),
      db.supabase.from('weight_challenge_logs').select('date, weight, created_at')
        .eq('client_id', clientId).gte('date', weekSleutel).lte('date', sleutel(plusDagen(ma, 6)))
        .order('created_at', { ascending: true })
        .then(r => r, () => ({ data: [] })),
      db.supabase.from('training_feedback').select('datum, soort, oefening, spiergroep, score, gevoel, opmerking, spierpijn, werkdruk')
        .eq('client_id', clientId).gte('datum', weekSleutel).lte('datum', sleutel(plusDagen(ma, 6)))
        .then(r => r, () => ({ data: [] })),
    ]).then(([p, b, st, sl, gw, fb]) => {
      if (weg) return
      setPlanning(prev => ({ ...prev, [weekSleutel]: p || {} }))
      setCardioBlokken(prev => ({ ...prev, [weekSleutel]: (b?.data || []).filter(x => !(x.skip_weeks || []).includes(weekSleutel)) }))
      setStappen(prev => ({ ...prev, [weekSleutel]: st || [] }))
      setCijfer(prev => ({ ...prev, ...Object.fromEntries((fb?.data || []).filter(r => r.soort === 'workout' && r.score != null).map(r => [String(r.datum).slice(0, 10), Number(r.score)])) }))
      // Signalen per dag: laag cijfer, opmerking, slecht herstel, pijn of techniek
      // die brak, te veel werkdruk. `erg` = rood, anders oranje.
      const perDag = {}
      const meld = (r, tekst, erg = false) => { const k = String(r.datum).slice(0, 10); (perDag[k] = perDag[k] || []).push({ tekst, erg }) }
      const hoofd = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : '')
      ;(fb?.data || []).forEach(r => {
        const spier = hoofd(spierWoord(r.spiergroep) || r.spiergroep || '')
        if (r.soort === 'workout') {
          if (r.score != null && r.score <= 6) meld(r, `Workout ${r.score}/10`, r.score <= 4)
          if (r.opmerking) meld(r, `Opmerking: ${r.opmerking}`)
        } else if (r.soort === 'herstel') {
          const sp = spierpijnVan(r)
          if (sp != null && sp >= 2) meld(r, `${spier}: ${sp >= 3 ? 'nog spierpijn' : 'spierpijn net op tijd weg'}${r.opmerking ? ` · ${r.opmerking}` : ''}`, sp >= 3)
          else if (r.opmerking) meld(r, `${spier}: ${r.opmerking}`)
        } else if (r.soort === 'spier') {
          if (r.werkdruk != null && r.werkdruk >= 3) meld(r, `${spier}: werkdruk te veel${r.opmerking ? ` · ${r.opmerking}` : ''}`, true)
          else if (r.opmerking) meld(r, `${spier}: ${r.opmerking}`)
        } else if (r.soort === 'oefening') {
          const delen = [
            r.gevoel === 'pijn' ? 'pijntje' : r.gevoel === 'techniek' ? 'techniek brak' : null,
            r.score != null && r.score <= 5 ? `${r.score}/10` : null,
            r.opmerking || null,
          ].filter(Boolean)
          if (delen.length) meld(r, `${r.oefening}: ${delen.join(' · ')}`, r.gevoel === 'pijn' || (r.score != null && r.score <= 4))
        }
      })
      setSignalen(prev => {
        const nieuw = { ...prev }
        // Dagen van deze week zonder signalen leegmaken, anders blijft een oud signaal staan.
        for (let i = 0; i < 7; i++) delete nieuw[sleutel(plusDagen(ma, i))]
        return { ...nieuw, ...perDag }
      })
      // Meerdere wegingen op één dag: de laatste telt.
      setGewicht(prev => ({ ...prev, ...Object.fromEntries((gw?.data || []).filter(r => Number(r.weight) > 0).map(r => [String(r.date).slice(0, 10), Number(r.weight)])) }))
      setSlaap(prev => ({ ...prev, ...Object.fromEntries((sl?.data || []).map(r => [String(r.log_date).slice(0, 10), Number(r.hours_slept) || 0])) }))
    })
    return () => { weg = true }
  }, [clientId, db, weekSleutel, vast])

  const [dicht, setDicht] = useState(() => {
    try { return localStorage.getItem('ci_training_gedaan_dicht') === '1' } catch { return false }
  })
  const wissel = () => setDicht(d => {
    try { localStorage.setItem('ci_training_gedaan_dicht', d ? '0' : '1') } catch { /* privévenster */ }
    return !d
  })
  const [statInfo, setStatInfo] = useState(null)
  // ── Plannen in de agenda (gecombineerde week) ──
  // De geplande blokken komen uit de agenda van de klant zelf (zelfde bron als
  // zijn eigen rooster), zodat verplaatsen hier precies doet wat het daar doet.
  const agendaService = useMemo(() => (db?.supabase ? new ClientAgendaService(db.supabase) : null), [db])
  const [planWeek, setPlanWeek] = useState({}) // { weekSleutel: { blocksByDay, mealPlanId } }
  const [planVersie, setPlanVersie] = useState(0)
  useEffect(() => {
    if (!voeding || !agendaService || !clientId) return
    let weg = false
    agendaService.loadWeek(clientId, new Date(`${weekSleutel}T00:00:00`)).then(r => {
      if (!weg && r) setPlanWeek(prev => ({ ...prev, [weekSleutel]: { blocksByDay: r.blocksByDay || {}, mealPlanId: r.mealPlan?.id || null } }))
    }, () => {})
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!voeding, agendaService, clientId, weekSleutel, planVersie])
  // Shift-klik selecteert blokken; slepen verzet ze (alle geselecteerde samen).
  const [selectie, setSelectie] = useState(() => new Set())
  const [sleep, setSleep] = useState(null) // { ids, delta } tijdens het slepen en tot de vraag beantwoord is
  const [vraag, setVraag] = useState(null) // { ids, delta } → eenmalig of standaard?
  const [planBezig, setPlanBezig] = useState(false)
  const [planFout, setPlanFout] = useState(null)
  const regelIndex = useRef({}) // id → regel, voor de afhandeling na het slepen
  const gesleept = useRef(false) // de klik na een sleep of shift-klik niet als dagkeuze tellen
  const pxRef = useRef(1)
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setSelectie(new Set()); setSleep(null); setVraag(null) } }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])
  // Wat een verplaatsbaar blok erbij krijgt: de greep en hoe hij eruitziet als hij geselecteerd is of meebeweegt.
  const sleepProps = (r) => (r.blok?.editable ? { onPointerDown: (e) => beginSleep(e, r) } : {})
  const sleepStijl = (r) => {
    if (!r.blok?.editable) return {}
    const mee = sleep?.ids.includes(r.id)
    return {
      cursor: 'grab', touchAction: 'none', userSelect: 'none',
      outline: selectie.has(r.id) || mee ? '2px solid #fff' : 'none', outlineOffset: -2,
      zIndex: mee ? 5 : undefined, opacity: mee ? 0.95 : undefined,
    }
  }
  const beginSleep = (e, r) => {
    if (!r.blok?.editable || planBezig) return
    e.stopPropagation()
    if (e.shiftKey) {
      e.preventDefault(); gesleept.current = true
      setSelectie(prev => { const n = new Set(prev); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n })
      return
    }
    const ids = selectie.has(r.id) ? [...selectie] : [r.id]
    const startY = e.clientY
    let delta = 0
    const beweeg = (ev) => {
      const d = Math.round((ev.clientY - startY) / pxRef.current / 5) * 5
      if (d !== delta) { delta = d; setSleep({ ids, delta }) }
    }
    const los = () => {
      window.removeEventListener('pointermove', beweeg); window.removeEventListener('pointerup', los)
      if (delta !== 0) { gesleept.current = true; setVraag({ ids, delta }) } else setSleep(null)
    }
    window.addEventListener('pointermove', beweeg); window.addEventListener('pointerup', los)
  }
  // Eenmalig = alleen die datum (override); standaard = het vaste patroon.
  const voerVerplaatsingUit = async (standaard) => {
    if (!vraag || !agendaService) return
    setPlanBezig(true); setPlanFout(null)
    const mealPlanId = planWeek[weekSleutel]?.mealPlanId || null
    let mislukt = 0
    for (const id of vraag.ids) {
      const r = regelIndex.current[id]
      const b = r?.blok
      if (!b) continue
      const duur = Math.max(5, (b.end || 0) - (b.start || 0))
      const nieuw = Math.max(0, Math.min(24 * 60 - duur, (b.start || 0) + vraag.delta))
      try {
        if (standaard) await agendaService.shiftBlock({ block: { ...b, clientId }, newStartMin: nieuw, toDay: null, mealPlanId })
        else await agendaService.upsertOverride({ clientId, dateIso: r.dagK, recurringId: recurringIdFor(b), startMin: nieuw, endMin: nieuw + duur })
      } catch (err) { console.error('blok verplaatsen mislukt:', err); mislukt++ }
    }
    setPlanBezig(false); setVraag(null); setSleep(null); setSelectie(new Set())
    if (mislukt) { setPlanFout(`${mislukt} ${mislukt === 1 ? 'blok kon' : 'blokken konden'} niet verplaatst worden.`); setTimeout(() => setPlanFout(null), 5000) }
    setPlanVersie(v => v + 1)
    window.dispatchEvent(new CustomEvent('myarc:ci-agenda-herlaad'))
  }

  // Kalender om naar een andere maand te springen: { x, y, jaar, maand } terwijl hij open is.
  const [kalender, setKalender] = useState(null)

  // Agendaatje: standaard 06:00 tot 22:00 in beeld; met het muiswiel (of
  // vegen) schuif je naar de nacht ervoor of erna. Alle dagen schuiven samen.
  const VENSTER_MIN = 16 * 60
  const [asStart, setAsStart] = useState(6 * 60)
  const rijRef = useRef(null)
  const asRef = useRef(6 * 60)
  useEffect(() => {
    const el = rijRef.current
    if (!el || !voeding) return
    const max = 24 * 60 - VENSTER_MIN
    // De stand staat ook in een ref: de pagina tegenhouden moet tijdens de
    // gebeurtenis zelf, niet pas als React de state bijwerkt.
    const schuif = (dMin, e) => {
      const nieuw = Math.max(0, Math.min(max, asRef.current + dMin))
      if (nieuw === asRef.current) return // aan het eind: de pagina mag verder scrollen
      if (e.cancelable) e.preventDefault()
      asRef.current = nieuw
      setAsStart(nieuw)
    }
    const wiel = (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) schuif(e.deltaY * 1.2, e) }
    let vinger = null
    const start = (e) => { vinger = e.touches[0]?.clientY ?? null }
    const veeg = (e) => {
      const y = e.touches[0]?.clientY
      if (vinger == null || y == null) return
      schuif((vinger - y) * 2.2, e); vinger = y
    }
    el.addEventListener('wheel', wiel, { passive: false })
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', veeg, { passive: false })
    return () => { el.removeEventListener('wheel', wiel); el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', veeg) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!voeding])

  // Gecombineerde week: `voeding(gedeeld)` geeft de voeding van de gekozen dag
  // terug en meldt per dag kcal, eiwit en water, voor de balken in de tegels.
  const [voedingWeek, setVoedingWeek] = useState({ dagen: {}, doel: { kcal: 0, eiwit: 0 } })
  const meldWeek = useCallback((w) => setVoedingWeek(prev => ({ dagen: { ...prev.dagen, ...w.dagen }, doel: w.doel })), [])
  const gedeeld = useMemo(() => ({ gekozen, setGekozen, meldWeek }), [gekozen, meldWeek])

  // Naam en aantal sets/oefeningen van een geplande training.
  const planInfo = (key) => {
    if (!key) return null
    const dag = schema?.week_structure?.[key] || null
    const oefeningen = Array.isArray(dag?.exercises) ? dag.exercises : []
    return {
      key,
      naam: String(dag?.name || dag?.focus || ACTIVITEIT[key] || 'Training').trim(),
      isCardio: !!ACTIVITEIT[key],
      oefeningen: oefeningen.length,
      sets: oefeningen.reduce((t, e) => t + (parseInt(e?.sets, 10) || 0), 0),
    }
  }

  const week = useMemo(() => {
    const sch = planning[weekSleutel] || null
    const blokken = cardioBlokken[weekSleutel] || []
    const st = stappen[weekSleutel] || []
    return DAG_EN.map((dagNaam, i) => {
      const d = plusDagen(new Date(`${weekSleutel}T00:00:00`), i); const k = sleutel(d)
      const gepland = sch ? trainingenVanDag(sch, dagNaam).map(planInfo).filter(Boolean) : []
      const sessies = (workouts || []).filter(w => String(w.workout_date || '').slice(0, 10) === k)
      const cardioPlan = blokken.filter(b => String(b.day).toLowerCase() === dagNaam.toLowerCase()).map(b => {
        const [h, m] = String(b.start_time || '').split(':').map(Number)
        const [eh, em] = String(b.end_time || '').split(':').map(Number)
        return { id: b.id, min: Number.isFinite(h) ? h * 60 + (m || 0) : null, soort: String(b.label).replace(/^Cardio\s*·\s*/, ''), duur: Number.isFinite(h) && Number.isFinite(eh) ? Math.max(0, (eh * 60 + em) - (h * 60 + m)) : 0 }
      })
      const cardio = cardioLogs.filter(l => String(l.logged_date || '').slice(0, 10) === k)
      return { d, k, i, gepland, sessies, cardioPlan, cardio, stappen: st[i]?.steps || 0, toekomst: k > vandaagSleutel }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planning, cardioBlokken, stappen, weekSleutel, workouts, cardioLogs, schema, vandaagSleutel])

  const gekozenSleutel = sleutel(gekozen)
  const dag = week.find(w => w.k === gekozenSleutel) || week[0]
  const telling = (w) => sessieTelling?.(w) || { sets: 0, oefeningen: 0, notities: 0, wissels: 0 }
  const som = (lijst, f) => lijst.reduce((t, x) => t + (Number(f(x)) || 0), 0)

  // ── Cijfers van de gekozen dag ──
  const dagSets = som(dag.sessies, w => telling(w).sets)
  const dagOef = som(dag.sessies, w => telling(w).oefeningen)
  const planSets = som(dag.gepland, p => p.sets)
  const planOef = som(dag.gepland, p => p.oefeningen)
  const dagCardio = som(dag.cardio, c => c.duration_minutes)
  const planCardio = som(dag.cardioPlan, c => c.duur)
  const deelKleur = (waarde, doel) => (doel > 0 && waarde > 0 ? schaal((waarde / doel - 0.5) / 0.5) : '#fff')

  // ── Weekcijfers ──
  const geweest = week.filter(w => !w.toekomst)
  const geplandTotaal = som(week, w => w.gepland.filter(p => !p.isCardio).length)
  const geplandTotNu = som(geweest, w => w.gepland.filter(p => !p.isCardio).length)
  const gedaanTotaal = som(week, w => w.sessies.length)
  const stapDagen = geweest.filter(w => w.stappen > 0)
  const gemStappen = stapDagen.length ? som(stapDagen, w => w.stappen) / stapDagen.length : 0
  const stappenGehaald = geweest.filter(w => w.stappen >= stappenDoel).length
  const cardioMin = som(week, w => som(w.cardio, c => c.duration_minutes))
  const cardioPlanMin = som(week, w => som(w.cardioPlan, c => c.duur))
  const stats = [
    {
      id: 'trainingen', label: 'trainingen', waarde: `${gedaanTotaal}/${geplandTotaal}`,
      kleur: geplandTotNu ? schaal(gedaanTotaal / geplandTotNu) : '#fff',
      uitleg: geplandTotaal ? `Gepland ${geplandTotaal} deze week, waarvan ${geplandTotNu} tot en met vandaag. Gedaan: ${gedaanTotaal}.` : `Niets gepland deze week. Gedaan: ${gedaanTotaal}.`,
    },
    {
      id: 'stappen', label: 'gem. stappen', waarde: stapDagen.length ? kort(Math.round(gemStappen)) : '–',
      // De helft van het doel of minder is rood, het doel halen is groen.
      kleur: stapDagen.length ? schaal((gemStappen / Math.max(1, stappenDoel) - 0.5) / 0.5) : '#fff',
      uitleg: stapDagen.length ? `Doel ${fmt(stappenDoel)} per dag, werkelijk gemiddeld ${fmt(gemStappen)} over ${stapDagen.length} ${stapDagen.length === 1 ? 'dag' : 'dagen'} met stappen.` : `Doel ${fmt(stappenDoel)} per dag. Deze week nog geen stappen binnen.`,
    },
    {
      id: 'gehaald', label: 'stappen gehaald', waarde: `${stappenGehaald}/${geweest.length || 0}`,
      kleur: geweest.length ? schaal(stappenGehaald / geweest.length) : '#fff',
      uitleg: geweest.length ? `Doel: elke dag ${fmt(stappenDoel)} stappen. Gehaald op ${stappenGehaald} van de ${geweest.length} ${geweest.length === 1 ? 'dag' : 'dagen'} die al geweest zijn.` : 'Deze week moet nog beginnen.',
    },
    ...(cardioMin > 0 || cardioPlanMin > 0 ? [{
      id: 'cardio', label: 'cardio min', waarde: cardioPlanMin ? `${fmt(cardioMin)}/${fmt(cardioPlanMin)}` : fmt(cardioMin),
      kleur: cardioPlanMin ? schaal(cardioMin / cardioPlanMin) : GROEN,
      uitleg: cardioPlanMin ? `Gepland ${fmt(cardioPlanMin)} minuten cardio deze week, gedaan ${fmt(cardioMin)}.` : `Geen cardio gepland; wel ${fmt(cardioMin)} minuten gedaan.`,
    }] : []),
  ]
  const statOpen = stats.find(x => x.id === statInfo)

  // Agendaatje in de tegels (gecombineerde week): wat er op een dag staat, op tijd.
  const klok = (min) => (min == null ? '' : `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)
  const minVan = (ts) => { const t = ts ? new Date(ts) : null; return t && !Number.isNaN(t.getTime()) ? t.getHours() * 60 + t.getMinutes() : null }
  const regelsVan = (w, v) => {
    const nogTeDoen = w.toekomst || w.k === vandaagSleutel
    const agendaBlokken = planWeek[weekSleutel]?.blocksByDay?.[AGENDA_DAGEN[w.i]] || null
    const isCardioBlok = (b) => b.type === 'custom' && /^Cardio\s*·\s*/.test(String(b.label || ''))
    const regels = [
      ...w.sessies.map(x => { const t = telling(x); return { id: `s-${x.id}`, groot: true, min: minVan(x.completed_at || x.created_at), naam: naamVoorSessie?.(x) || 'Training', sub: t.sets > 0 ? `${t.sets} sets` : 'gedaan', gedaan: true, foto: getWorkoutImage({ name: naamVoorSessie?.(x) || 'Training' }) } }),
      ...(w.sessies.length ? [] : agendaBlokken
        ? agendaBlokken.filter(b => b.type === 'training').map(b => ({ id: `b-${w.k}-${b.id}`, blok: b, dagK: w.k, groot: true, min: b.start, naam: b.sublabel || b.label || 'Training', sub: nogTeDoen ? 'gepland' : 'niet gedaan', gedaan: false, gemist: !nogTeDoen, foto: getWorkoutImage({ name: b.sublabel || b.label || 'Training' }) }))
        : w.gepland.filter(pl => !pl.isCardio).map((pl, n) => ({ id: `p-${n}`, groot: true, min: null, naam: pl.naam, sub: nogTeDoen ? 'gepland' : 'niet gedaan', gedaan: false, gemist: !nogTeDoen, foto: getWorkoutImage({ name: pl.naam }) }))),
      ...w.cardio.map(c => ({ id: `c-${c.id}`, groot: true, cardio: true, min: minVan(c.created_at), naam: c.cardio_type || 'Cardio', sub: Number(c.duration_minutes) > 0 ? `${c.duration_minutes} min` : 'gedaan', gedaan: true, foto: cardioFoto(c.cardio_type) })),
      ...(w.cardio.length ? [] : agendaBlokken
        ? agendaBlokken.filter(isCardioBlok).map(b => { const soort = String(b.label).replace(/^Cardio\s*·\s*/, ''); return { id: `b-${w.k}-${b.id}`, blok: b, dagK: w.k, groot: true, cardio: true, min: b.start, naam: soort, sub: nogTeDoen ? `${b.end - b.start} min` : 'niet gedaan', gedaan: false, gemist: !nogTeDoen, foto: cardioFoto(soort) } })
        : w.cardioPlan.map(c => ({ id: `cp-${c.id}`, groot: true, cardio: true, min: c.min, naam: c.soort, sub: nogTeDoen ? (c.duur ? `${c.duur} min` : 'gepland') : 'niet gedaan', gedaan: false, gemist: !nogTeDoen, foto: cardioFoto(c.soort) }))),
      // Maaltijden: gelogd, of (dag zonder logs) wat er gepland staat in de agenda.
      ...(!v?.gelogd && agendaBlokken && nogTeDoen
        ? agendaBlokken.filter(b => b.type === 'meal' && !b.meta?.placeholder && (b.sublabel || Number(b.meta?.kcal) > 0)).map(b => ({ id: `b-${w.k}-${b.id}`, blok: b, dagK: w.k, groot: false, min: b.start, naam: b.sublabel || b.label || 'Maaltijd', kcal: Number(b.meta?.kcal) || 0, gelogd: false, foto: b.meta?.image_url || foodImageFallback(b.sublabel || b.label || 'Maaltijd', b.meta?.slot, 80) }))
        : (v?.items || []).map(m => ({ ...m, id: `m-${m.id}`, groot: false }))),
    ].sort((a, b) => (a.min ?? -1) - (b.min ?? -1))
    // De signalen van de dag horen bij de (eerste) gedane training.
    const eerste = regels.find(r => r.groot && !r.cardio && r.gedaan) || regels.find(r => r.groot && !r.cardio)
    if (eerste && signalen[w.k]?.length) eerste.signalen = signalen[w.k]
      return regels
  }
  const TEGEL_HOOGTE = 468, BAND = 38 // slaapband + stappenband
  const pxPerMin = (TEGEL_HOOGTE - BAND - 6) / VENSTER_MIN
  // Uurlabels om de twee uur, over de hele dag; wat buiten beeld valt wordt niet getekend.
  const asUren = Array.from({ length: 13 }, (_, i) => i * 120).filter(u => u >= asStart - 10 && u <= asStart + VENSTER_MIN)
  const AS_BREED = 30

  const pijl = {
    width: 18, height: 26, padding: 0, flexShrink: 0, background: 'transparent', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const gedaanAantal = dag.sessies.length + dag.cardio.length
  const sessieDelen = (w) => {
    const t = telling(w)
    return [tijdVan?.(w), t.sets > 0 ? `${t.sets} sets` : null, t.oefeningen > 0 ? `${t.oefeningen} oefeningen` : null, Number(w.duration_minutes) > 0 ? `${w.duration_minutes} min` : null].filter(Boolean)
  }
  const kopNaam = dag.sessies[0] ? (naamVoorSessie?.(dag.sessies[0]) || 'Training') : (dag.cardio[0]?.cardio_type || 'Cardio')
  const kopDelen = dag.sessies[0] ? sessieDelen(dag.sessies[0])
    : dag.cardio[0] ? [Number(dag.cardio[0].duration_minutes) > 0 ? `${dag.cardio[0].duration_minutes} min` : null].filter(Boolean) : []

  return (
    // Gecombineerde week: de agenda staat vast, alleen de twee lijsten eronder scrollen.
    <div style={{ padding: isMobile ? '0.4rem 1rem 1rem' : '0.4rem 1.25rem 1rem', ...(voeding ? { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', paddingBottom: 0, boxSizing: 'border-box' } : {}) }}>
      <style>{`@keyframes ciDeckUit { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }`}</style>

      {/* Dagenstrook: gekozen dag als witte pil, weekpijlen in het ma- en zo-vak. */}
      <div style={{ display: 'flex', gap: 6, margin: '0.8rem 0 5px', flexShrink: 0 }}>
        {/* Lege hoek boven de tijdas, zodat de dagen boven hun tegel staan. */}
        {voeding && <span style={{ width: AS_BREED, flexShrink: 0 }} />}
        {week.map((w, i) => {
          const aan = w.k === gekozenSleutel
          return (
            <div key={w.k} onClick={() => setGekozen(w.d)} style={{
              flex: 1, minWidth: 0, minHeight: 26, borderRadius: 7, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: aan ? '#fff' : 'transparent', color: aan ? '#000' : 'rgba(255,255,255,0.7)',
              fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              {i === 0 && <button onClick={(e) => { e.stopPropagation(); setGekozen(plusDagen(gekozen, -7)) }} aria-label="Vorige week" title="Vorige week" style={{ ...pijl, color: aan ? '#000' : '#fff' }}><ChevronLeft size={16} strokeWidth={3} /></button>}
              {i === 0 && (
                <button aria-label="Naar een andere maand" title="Naar een andere maand of week springen" aria-haspopup="dialog" aria-expanded={!!kalender}
                  onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setKalender(k => (k ? null : { x: r.left, y: r.bottom + 6, jaar: gekozen.getFullYear(), maand: gekozen.getMonth() })) }}
                  style={{ ...pijl, width: 22, color: aan ? '#000' : '#fff' }}>
                  <CalendarDays size={14} strokeWidth={2.6} />
                </button>
              )}
              <span style={{ flex: i === 0 || i === 6 ? 1 : 'none', minWidth: 0, textAlign: 'center', display: 'inline-flex', justifyContent: 'center', gap: 3 }}>
                {DAG_NL[i]}<span style={{ fontWeight: 800, opacity: aan ? 0.75 : 0.6, letterSpacing: 0 }}>{w.d.getDate()}</span>
                {/* De weging van die dag achter de datum. */}
                {gewicht[w.k] > 0 && (
                  <span style={{ marginLeft: 4, fontWeight: 900, letterSpacing: 0, textTransform: 'none', color: aan ? '#000' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {String(Math.round(gewicht[w.k] * 10) / 10).replace('.', ',')}<span style={{ fontWeight: 700, opacity: 0.6 }}> kg</span>
                  </span>
                )}
              </span>
              {i === 6 && <button onClick={(e) => { e.stopPropagation(); setGekozen(plusDagen(gekozen, 7)) }} aria-label="Volgende week" title="Volgende week" style={{ ...pijl, color: aan ? '#000' : '#fff' }}><ChevronRight size={16} strokeWidth={3} /></button>}
            </div>
          )
        })}
      </div>

      {/* Een tegel per dag: donkere foto van de training, naam en sets er dik
          overheen, de stappen als strook langs de rechterkant. */}
      <div ref={rijRef} style={{ height: voeding ? TEGEL_HOOGTE : 84, display: 'flex', gap: 6, overscrollBehavior: 'contain', flexShrink: 0 }}>
        {voeding && (
          <span style={{ position: 'relative', width: AS_BREED, flexShrink: 0 }}>
            {asUren.map(u => (
              <span key={u} style={{ position: 'absolute', right: 2, top: BAND + (u - asStart) * pxPerMin - 5, fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{klok(u)}</span>
            ))}
          </span>
        )}
        {week.map((w) => {
          const aan = w.k === gekozenSleutel
          const sessie = w.sessies[0] || null
          const plan = w.gepland[0] || null
          const cardio = w.cardio[0] || w.cardioPlan[0] || null
          const naam = sessie ? (naamVoorSessie?.(sessie) || 'Training') : plan ? plan.naam : cardio ? (cardio.cardio_type || cardio.soort) : null
          const isCardio = !sessie && (!plan || plan.isCardio) && !!cardio
          const foto = !naam ? null : isCardio ? cardioFoto(naam) : getWorkoutImage({ name: naam })
          const gedaan = w.sessies.length > 0 || (isCardio && w.cardio.length > 0)
          // Hoeveel er die dag nog meer staat dan wat de tegel noemt.
          const cardioN = Math.max(w.cardio.length, w.cardioPlan.length)
          const extra = Math.max(0, (isCardio ? cardioN : (w.sessies.length || w.gepland.length) + cardioN) - 1)
          const sets = som(w.sessies, x => telling(x).sets)
          const stapDeel = Math.min(1, w.stappen / Math.max(1, stappenDoel))
          const stapGroen = Math.min(1, w.stappen / 10000)
          const meng = (van, naar) => Math.round(van + (naar - van) * stapGroen)
          return (
            <button key={w.k} onClick={(e) => { if (gesleept.current || e.shiftKey) { gesleept.current = false; return } setGekozen(w.d) }}
              title={`${naam || 'Rust'}${gedaan ? ' · gedaan' : naam ? (w.toekomst ? ' · gepland' : ' · niet gedaan') : ''} · ${fmt(w.stappen)} / ${fmt(stappenDoel)} stappen${slaap[w.k] > 0 ? ` · ${String(Math.round(slaap[w.k] * 10) / 10).replace('.', ',')} uur slaap` : ''}${voeding && voedingWeek.dagen[w.k] ? ` · ${fmt(voedingWeek.dagen[w.k].kcal)} / ${fmt(voedingWeek.doel.kcal)} kcal · ${fmt(voedingWeek.dagen[w.k].eiwit)} / ${fmt(voedingWeek.doel.eiwit)} g eiwit · water ${(voedingWeek.dagen[w.k].waterMl / 1000).toFixed(1).replace('.', ',')} L` : ''}`}
              style={{
                position: 'relative', flex: 1, minWidth: 0, height: '100%', padding: 0, overflow: 'hidden', borderRadius: 8,
                // Gecombineerde week: bijna zwart met een haarlijn per twee uur, geen grijs vlak.
                background: voeding ? `repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${120 * pxPerMin}px) 0 ${BAND - (asStart % 120) * pxPerMin}px / 100% 200% no-repeat, #070707` : 'rgba(255,255,255,0.05)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                outline: aan ? '2px solid #fff' : 'none', outlineOffset: -2,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
              {foto && !voeding && <span style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: gedaan ? 0.45 : 0.2 }} />}
              {foto && !voeding && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.6) 100%)' }} />}
              {gedaan && !voeding && <span style={{ position: 'absolute', left: 0, right: 5, top: 0, height: 2, background: GROEN }} />}
              {gedaan && !voeding && <CircleCheck size={voeding ? 22 : 15} strokeWidth={2.6} color={GROEN} style={voeding
                ? { position: 'absolute', top: '50%', left: `calc(50% - ${BALKEN / 2}px)`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.8))' }
                : { position: 'absolute', top: 6, left: 6, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' }} />}
              {/* Gecombineerde week: stappen als band bovenin, kcal en eiwit
                  linksboven, en rechts de balken kcal, eiwit en water. */}
              {voeding && (() => {
                const v = voedingWeek.dagen[w.k] || null
                const vd = voedingWeek.doel
                const kcal = v ? (v.gelogd ? v.kcal : v.planKcal) : 0
                const eiwit = v ? (v.gelogd ? v.eiwit : v.planEiwit) : 0
                const echt = !!v?.gelogd
                const kKleur = echt ? kcalKleur(kcal, vd.kcal, '#fff') : 'rgba(255,255,255,0.45)'
                const eKleur = echt && vd.eiwit ? schaal((eiwit / vd.eiwit - 0.6) / 0.4) : 'rgba(255,255,255,0.45)'
                const deel = (x, doel) => (doel > 0 ? Math.min(1, x / doel) : 0)
                const balk = (rechts, breed, hoogte, kleur) => (
                  <span style={{ position: 'absolute', top: BAND, bottom: 0, right: rechts, width: breed, background: 'rgba(0,0,0,0.55)' }}>
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(hoogte * 100)}%`, background: kleur, opacity: echt || kleur === '#38bdf8' ? 1 : 0.6, transition: 'height 0.3s ease' }} />
                  </span>
                )
                return (
                  <>
                    {/* Slaap van de nacht ervoor: paarse band, vol bij acht uur. */}
                    {/* Klik = het slaapvenster: de nachten, bedtijden en wat de klant erbij schreef. */}
                    <span role="button" tabIndex={0} aria-label="Slaap bekijken" title="Slaap bekijken"
                      onClick={(e) => { e.stopPropagation(); setSlaapVenster(w.k) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSlaapVenster(w.k) } }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: 'rgba(0,0,0,0.55)', overflow: 'hidden', cursor: 'pointer', zIndex: 2 }}>
                      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(Math.min(1, (slaap[w.k] || 0) / SLAAP_DOEL) * 100)}%`, background: 'rgba(168,85,247,0.4)' }} />
                      <span style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: slaap[w.k] > 0 ? '#d8b4fe' : 'rgba(255,255,255,0.4)' }}>
                        <Moon size={10} strokeWidth={2.6} color={slaap[w.k] > 0 ? PAARS : 'currentColor'} />{slaap[w.k] > 0 ? `${String(Math.round(slaap[w.k] * 10) / 10).replace('.', ',')}u` : '·'}
                      </span>
                    </span>
                    {/* Klik = stappendoel instellen. Op de gekozen dag staat het doel erachter. */}
                    <span role={acties?.stappen ? 'button' : undefined} tabIndex={acties?.stappen ? 0 : undefined} aria-label="Stappendoel instellen" title={`${fmt(w.stappen)} / ${fmt(stappenDoel)} stappen${acties?.stappen ? ' · klik: doel instellen' : ''}`}
                      onClick={acties?.stappen ? (e) => { e.stopPropagation(); acties.stappen() } : undefined}
                      onKeyDown={acties?.stappen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); acties.stappen() } } : undefined}
                      style={{ position: 'absolute', top: 19, left: 0, right: 0, height: 18, background: 'rgba(0,0,0,0.55)', overflow: 'hidden', cursor: acties?.stappen ? 'pointer' : 'inherit', zIndex: 2 }}>
                      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(stapDeel * 100)}%`, background: `rgba(${meng(200, 16)},${meng(200, 185)},${meng(200, 129)},${(0.22 + 0.23 * stapGroen).toFixed(2)})` }} />
                      <span style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: w.stappen > 0 ? `rgb(${meng(255, 16)},${meng(255, 185)},${meng(255, 129)})` : 'rgba(255,255,255,0.4)' }}>
                        <Footprints size={10} strokeWidth={2.6} style={{ opacity: 0.8 }} />{w.stappen > 0 ? kort(w.stappen) : aan ? '0' : '·'}
                        {aan && stappenDoel > 0 && <span style={{ opacity: 0.6 }}> / {kort(stappenDoel)}</span>}
                      </span>
                    </span>
                    {/* Eén brede voedingsbalk: vult met de kcal tegen het doel, in de
                        kleur van de kcal; kcal en eiwit staan erin. */}
                    <span style={{ position: 'absolute', top: BAND, bottom: 0, right: 4, width: BALKEN - 4, background: 'rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(deel(kcal, vd.kcal) * 100)}%`, background: kKleur, opacity: echt ? 0.55 : 0.3, transition: 'height 0.3s ease' }} />
                      {kcal > 0 && (
                        <span style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(4, Math.round(deel(kcal, vd.kcal) * (TEGEL_HOOGTE - BAND)) - 30), textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '-0.03em', color: echt ? '#fff' : 'rgba(255,255,255,0.6)' }}>{fmt(kcal)}</span>
                          <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 900, color: echt ? eKleur : 'rgba(255,255,255,0.45)' }}>E{fmt(eiwit)}</span>
                        </span>
                      )}
                    </span>
                    {balk(0, 4, v ? deel(v.waterMl, v.waterDoel) : 0, '#38bdf8')}
                    {/* Het agendaatje van de dag: training, cardio en maaltijden
                        onder elkaar op tijd. */}
                    {(() => {
                      const regels = regelsVan(w, v)
                      if (!regels.length) return <span style={{ position: 'absolute', top: BAND, bottom: 0, left: 0, right: BALKEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rust</span>
                      // Elk ding op zijn tijd; wat zou overlappen schuift net onder het vorige.
                      let onder = -Infinity
                      pxRef.current = pxPerMin
                      const geplaatst = regels.map(r => {
                        regelIndex.current[r.id] = r
                        const hoogte = r.groot ? 50 : 24
                        const verzet = sleep?.ids.includes(r.id) ? sleep.delta : 0
                        const top = Math.max(((r.min ?? 6 * 60) + verzet - asStart) * pxPerMin, verzet ? -Infinity : onder) // zonder tijd: op 06:00
                        onder = top + hoogte + 2
                        return { ...r, top, hoogte }
                      })
                      return (
                        <span style={{ position: 'absolute', top: BAND, bottom: 0, left: 4, right: BALKEN + 4, overflow: 'hidden', textAlign: 'left' }}>
                          {geplaatst.map(r => r.groot ? (
                            <span key={r.id} {...sleepProps(r)} style={{ ...sleepStijl(r), position: 'absolute', left: 0, right: 0, top: r.top, height: 50, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', boxShadow: r.gedaan ? `inset 0 -2px 0 ${GROEN}` : 'none' }}>
                              <span style={{ position: 'absolute', inset: 0, backgroundImage: `url(${r.foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: r.gedaan ? 0.5 : 0.22 }} />
                              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />
                              {r.gedaan && <CircleCheck size={14} strokeWidth={2.6} color={GROEN} style={{ position: 'absolute', top: 4, right: 4, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' }} />}
                              {/* Iets om naar te kijken: gekleurde rand en een teller linksboven. */}
                              {r.signalen?.length > 0 && (
                                <>
                                  <span style={{ position: 'absolute', inset: 0, borderRadius: 6, border: `2px solid ${r.signalen.some(x => x.erg) ? '#ef4444' : '#f59e0b'}`, pointerEvents: 'none' }} />
                                  <span title={r.signalen.map(x => x.tekst).join('\n')} style={{ position: 'absolute', top: 3, left: 3, display: 'inline-flex', alignItems: 'center', gap: 2, height: 16, padding: '0 5px', borderRadius: 8, background: r.signalen.some(x => x.erg) ? '#ef4444' : '#f59e0b', color: '#000', fontSize: '0.6rem', fontWeight: 900, lineHeight: 1 }}>
                                    <AlertTriangle size={10} strokeWidth={3} />{r.signalen.length}
                                  </span>
                                </>
                              )}
                              <span style={{ position: 'absolute', left: 5, right: 5, bottom: 4, lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 900, letterSpacing: '-0.02em', color: r.gemist ? '#ef4444' : '#fff' }}>
                                  {r.cardio && <HeartPulse size={10} strokeWidth={2.8} style={{ flexShrink: 0 }} />}
                                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.naam}</span>
                                </span>
                                <span style={{ display: 'block', fontSize: '0.56rem', fontWeight: 900, color: r.gedaan ? GROEN : 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {[klok(r.min), r.sub].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </span>
                          ) : (
                            <span key={r.id} {...sleepProps(r)} title={`${klok(r.min)} ${r.naam} · ${fmt(r.kcal)} kcal${r.gelogd ? '' : ' (gepland)'}`} style={{ ...sleepStijl(r), position: 'absolute', left: 0, right: 0, top: r.top, height: 24, display: 'flex', alignItems: 'center', gap: 4, opacity: r.gelogd ? 1 : 0.5 }}>
                              <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 5, backgroundImage: `url(${r.foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
                                <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.naam}</span>
                                <span style={{ display: 'block', fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{[klok(r.min), `${fmt(r.kcal)} kcal`].filter(Boolean).join(' · ')}</span>
                              </span>
                            </span>
                          ))}
                        </span>
                      )
                    })()}
                  </>
                )
              })()}
              {voeding ? null : naam ? (
                <span style={{ position: 'absolute', left: 4, right: voeding ? BALKEN + 4 : 9, bottom: 4, textAlign: 'left', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', overflow: 'hidden' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', fontWeight: 900, letterSpacing: '-0.02em', color: gedaan || w.toekomst || w.k === vandaagSleutel ? '#fff' : '#ef4444', whiteSpace: 'nowrap' }}>
                    {isCardio && <HeartPulse size={11} strokeWidth={2.8} style={{ flexShrink: 0 }} />}
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                    {extra > 0 && <span style={{ flexShrink: 0, fontSize: '0.6rem', opacity: 0.75 }}>+{extra}</span>}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 900, color: gedaan ? GROEN : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {gedaan ? (isCardio ? `${fmt(som(w.cardio, c => c.duration_minutes))} min` : sets > 0 ? `${sets} sets` : 'gedaan') : w.toekomst || w.k === vandaagSleutel ? 'gepland' : 'niet gedaan'}
                  </span>
                </span>
              ) : (
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rust</span>
              )}
              {/* Stappen: strook langs de rechterkant, van onderen gevuld. */}
              <span style={{ display: voeding ? 'none' : 'block', position: 'absolute', top: 0, bottom: 0, right: 0, width: 5, background: 'rgba(0,0,0,0.55)' }}>
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(stapDeel * 100)}%`, background: `rgb(${meng(200, 16)},${meng(200, 185)},${meng(200, 129)})`, transition: 'height 0.3s ease' }} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Gecombineerde week: links training, rechts voeding van dezelfde dag. */}
      <div style={voeding ? { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)', gap: 32 } : undefined}>
      <div style={voeding ? KOLOM_SCROLL : undefined}>
      {/* Cijfers en kopregel blijven staan; de kaarten scrollen eronderdoor. */}
      <div style={voeding ? { position: 'sticky', top: 0, zIndex: 3, background: '#050505', paddingBottom: 6 } : undefined}>
      {/* De gekozen dag: stappen, sets, oefeningen en cardio tegen het plan. */}
      <div style={{ display: 'flex', gap: 14, marginTop: '0.8rem' }}>
        {/* Het trainingsplan openen in de Workout Builder. */}
        {voeding && acties?.plan && (
          <button onClick={acties.plan} title={`Trainingsplan openen in de Workout Builder${acties.planNaam ? ` (${acties.planNaam})` : ''}`} aria-label="Trainingsplan openen"
            style={{ flexShrink: 0, alignSelf: 'center', width: 30, height: 30, padding: 0, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ExternalLink size={14} strokeWidth={2.6} />
          </button>
        )}
        <Balk label="Stappen" waarde={dag.stappen} doel={stappenDoel} kleur={deelKleur(dag.stappen, stappenDoel)} onKlik={acties?.stappen} hint="Stappendoel instellen" />
        <Balk label="Sets" waarde={dagSets} doel={planSets} kleur={deelKleur(dagSets, planSets)} onKlik={acties?.kracht} hint="Kracht: per oefening de stand tegen de band van de fase" />
        <Balk label="Oefeningen" waarde={dagOef} doel={planOef} kleur={deelKleur(dagOef, planOef)} onKlik={acties?.bouwfase} hint="Bouwfase en herstel per spiergroep" />
        <Balk label="Cardio" waarde={dagCardio} doel={planCardio} eenheid=" min" kleur={planCardio ? deelKleur(dagCardio, planCardio) : dagCardio ? GROEN : '#fff'} onKlik={acties?.cardio} hint="Cardio die de klant logde" />
      </div>

      {/* Stapeltje 'gedaan' links, weekcijfers rechts. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0.7rem 0 0', minHeight: 44 }}>
        {gedaanAantal > 0 ? (
          <button onClick={wissel} aria-expanded={!dicht} aria-label={`${gedaanAantal} gedaan, ${dicht ? 'bekijken' : 'inklappen'}`}
            style={{ flex: '0 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
              {[...dag.sessies.map(w => getWorkoutImage({ name: naamVoorSessie?.(w) || 'Training' })), ...dag.cardio.map(c => cardioFoto(c.cardio_type))].slice(0, 8).map((foto, i) => (
                <span key={i} style={{
                  width: 28, height: 36, marginLeft: i ? -12 : 0, borderRadius: 6, flexShrink: 0,
                  border: '2px solid #0e0e0e', boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                  background: `url(${foto}) center/cover, #1c1c1c`,
                  transform: `rotate(${((i * 37) % 9) - 4}deg)`, zIndex: i,
                }} />
              ))}
            </span>
            {/* Naast het stapeltje: wat er gedaan is (eerste sessie, anders de cardio). */}
            <span style={{ minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 900, color: GROEN, letterSpacing: '-0.015em' }}>{kopNaam}</span>
              <span style={{ minWidth: 0, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {kopDelen.join(' · ')}{gedaanAantal > 1 ? ` · +${gedaanAantal - 1}` : ''}
              </span>
              {/* Het cijfer dat de klant de workout gaf. */}
              {dag.sessies[0] && cijfer[dag.k] != null && (
                <span title="Cijfer van de klant voor deze workout" style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: cijfer[dag.k] >= 7 ? GROEN : cijfer[dag.k] >= 5 ? '#f59e0b' : '#ef4444' }}>{cijfer[dag.k]}/10</span>
              )}
            </span>
            <ChevronRight size={15} strokeWidth={3} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, transform: dicht ? 'none' : 'rotate(90deg)', transition: 'transform 0.2s ease' }} />
          </button>
        ) : (
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
            {dag.toekomst ? 'Nog niet geweest' : dag.gepland.length || dag.cardioPlan.length ? (dag.k === vandaagSleutel ? 'Nog niets gedaan' : 'Niet gedaan') : 'Rustdag'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexShrink: 0 }}>
          {stats.map(x => (
            <button key={x.id} onClick={() => setStatInfo(v => (v === x.id ? null : x.id))} title={x.uitleg}
              style={{ padding: 0, background: 'none', border: 'none', textAlign: 'right', fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, fontSize: '0.84rem', fontWeight: 900, color: x.kleur, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {x.waarde}<Info size={10} strokeWidth={2.6} color={statInfo === x.id ? '#fff' : 'rgba(255,255,255,0.35)'} />
              </span>
              <span style={{ display: 'block', fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1, whiteSpace: 'nowrap' }}>{x.label}</span>
            </button>
          ))}
        </span>
      </div>
      {/* Waar je naar wil kijken op deze dag. */}
      {signalen[dag.k]?.length > 0 && (
        <div style={{ margin: '2px 0 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {signalen[dag.k].map((x, n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: '0.74rem', fontWeight: 800, color: x.erg ? '#ef4444' : '#f59e0b', lineHeight: 1.35 }}>
              <AlertTriangle size={11} strokeWidth={2.8} style={{ flexShrink: 0, alignSelf: 'center' }} />
              <span style={{ minWidth: 0 }}>{x.tekst}</span>
            </div>
          ))}
        </div>
      )}
      {statOpen && (
        <div style={{ marginTop: 2, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, textAlign: 'right' }}>
          {statOpen.uitleg}
          {statOpen.id === 'trainingen' && acties?.voortgang && <> In het hele plan: {acties.voortgang}.</>}
          {statOpen.id === 'trainingen' && acties?.aangepast && (
            <button onClick={acties.aangepast} style={{ marginLeft: 6, padding: 0, background: 'none', border: 'none', color: '#fff', fontSize: 'inherit', fontWeight: 900, fontFamily: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Aangepast door klant</button>
          )}
        </div>
      )}

      </div>
      {/* Uitgeklapt: de sessies en de cardio van de dag. Een sessie opent in
          het venster met de oefeningen en de progressie. */}
      {!dicht && dag.sessies.map((w, i) => {
        const naam = naamVoorSessie?.(w) || 'Training'
        const t = telling(w)
        const delen = sessieDelen(w)
        return (
          <div key={w.id || i} style={{ marginTop: i ? '0.6rem' : '0.3rem', animation: 'ciDeckUit 0.25s ease' }}>
            {/* Eén regel per sessie, daaronder direct de oefeningkaarten. */}
            <div style={{ display: i === 0 ? 'none' : 'flex', alignItems: 'baseline', gap: 8, margin: '0 0 0.4rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{naam}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{delen.join(' · ')}</span>
              {t.wissels > 0 && (
                <span title={`${t.wissels} oefening${t.wissels === 1 ? '' : 'en'} gewisseld`} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.74rem', fontWeight: 900, color: '#f59e0b' }}>
                  <ArrowLeftRight size={13} strokeWidth={2.6} />{t.wissels}
                </span>
              )}
            </div>
            {toonSessie?.(w)}
          </div>
        )
      })}
      {!dicht && dag.cardio.map((c, i) => {
        const delen = [Number(c.duration_minutes) > 0 ? `${c.duration_minutes} min` : null, c.distance_km ? `${String(c.distance_km).replace('.', ',')} km` : null, c.calories ? `${c.calories} kcal` : null].filter(Boolean)
        return (
          <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderTop: i || dag.sessies.length ? `1px solid ${LIJN}` : 'none', animation: 'ciDeckUit 0.25s ease' }}>
            <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${cardioFoto(c.cardio_type)})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cardio_type || 'Cardio'}</span>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                {delen.join(' · ')}<span style={{ marginLeft: delen.length ? 6 : 0, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#06b6d4' }}>{delen.length ? '· ' : ''}Cardio</span>
              </span>
            </span>
            {c.notes && <span title={c.notes} style={{ flexShrink: 0, display: 'inline-flex', color: '#fff' }}><MessageSquare size={13} strokeWidth={2.6} /></span>}
          </div>
        )
      })}
      </div>
      {voeding && <div style={{ ...KOLOM_SCROLL, paddingTop: '0.8rem' }}>{voeding(gedeeld)}</div>}
      </div>
      {/* Slaapvenster: veertien nachten, gemiddelden, horloge en wat de klant bij een nacht schreef. */}
      {slaapVenster && createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget) setSlaapVenster(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="dialog" aria-label="Slaap" style={{ width: '100%', maxWidth: 460, maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: '#0e0e0e', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 0.7rem 0.3rem 1rem' }}>
              <Moon size={15} color={PAARS} strokeWidth={2.4} />
              <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Slaap</span>
              <button onClick={() => setSlaapVenster(null)} aria-label="Sluiten" style={{ width: 30, height: 30, padding: 0, borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
              <SlaapInsight key={slaapVenster} db={db} client={client} isMobile={isMobile} startNacht={slaapVenster} lijstOpenStart paars />
            </div>
          </div>
        </div>, document.body)}
      {/* Na het slepen: eenmalig of standaard? */}
      {vraag && createPortal(
        <div onClick={() => { if (!planBezig) { setVraag(null); setSleep(null) } }} style={{ position: 'fixed', inset: 0, zIndex: 12600, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="dialog" aria-label="Verplaatsen" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: '1.1rem', borderRadius: 18, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {vraag.ids.length === 1 ? (regelIndex.current[vraag.ids[0]]?.naam || 'Blok') : `${vraag.ids.length} blokken`} {Math.abs(vraag.delta)} min {vraag.delta > 0 ? 'later' : 'eerder'}
            </div>
            <div style={{ margin: '4px 0 14px', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>De klant ziet de nieuwe tijd direct in zijn agenda.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => voerVerplaatsingUit(false)} disabled={planBezig} style={{ flex: 1, minHeight: 48, borderRadius: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 900, cursor: 'pointer', opacity: planBezig ? 0.6 : 1 }}>Eenmalig</button>
              <button onClick={() => voerVerplaatsingUit(true)} disabled={planBezig} style={{ flex: 1, minHeight: 48, borderRadius: 13, background: '#fff', border: '1px solid #fff', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 900, cursor: 'pointer', opacity: planBezig ? 0.6 : 1 }}>Standaard</button>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Eenmalig = alleen deze dag in deze week. Standaard = voortaan, elke week.</div>
          </div>
        </div>, document.body)}
      {planFout && createPortal(
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 12600, padding: '0.6rem 0.9rem', borderRadius: 12, background: '#ef4444', color: '#fff', fontSize: '0.8rem', fontWeight: 900 }}>{planFout}</div>, document.body)}
      {/* Kalender: kies een dag in welke maand dan ook; de week van die dag komt in beeld. */}
      {kalender && createPortal((() => {
        const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
        const eerste = new Date(kalender.jaar, kalender.maand, 1)
        const leeg = (eerste.getDay() + 6) % 7
        const dagen = new Date(kalender.jaar, kalender.maand + 1, 0).getDate()
        const cellen = [...Array(leeg).fill(null), ...Array.from({ length: dagen }, (_, n) => n + 1)]
        const verzet = (n) => setKalender(k => { const d = new Date(k.jaar, k.maand + n, 1); return { ...k, jaar: d.getFullYear(), maand: d.getMonth() } })
        const B = 252
        const knop = { width: 30, height: 30, padding: 0, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        return (
          <>
            <div onClick={() => setKalender(null)} style={{ position: 'fixed', inset: 0, zIndex: 12500 }} />
            <div role="dialog" aria-label="Kalender" style={{ position: 'fixed', left: Math.max(8, Math.min(kalender.x, window.innerWidth - B - 8)), top: kalender.y, width: B, zIndex: 12501, padding: 10, borderRadius: 14, background: '#111', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 18px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <button onClick={() => verzet(-1)} aria-label="Vorige maand" style={knop}><ChevronLeft size={16} strokeWidth={3} /></button>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.84rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>{MAANDEN[kalender.maand]} {kalender.jaar}</div>
                <button onClick={() => verzet(1)} aria-label="Volgende maand" style={knop}><ChevronRight size={16} strokeWidth={3} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {DAG_NL.map(d => <div key={d} style={{ fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', textAlign: 'center', textTransform: 'uppercase', padding: '2px 0' }}>{d}</div>)}
                {cellen.map((d, n) => {
                  if (!d) return <div key={`l${n}`} />
                  const datum = new Date(kalender.jaar, kalender.maand, d)
                  const k = sleutel(datum)
                  const inWeek = k >= weekSleutel && k <= sleutel(plusDagen(maandag, 6))
                  const aan = k === gekozenSleutel
                  return (
                    <button key={k} onClick={() => { setGekozen(datum); setKalender(null) }} style={{
                      height: 30, padding: 0, borderRadius: 8, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                      background: aan ? '#fff' : inWeek ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: aan ? '#000' : '#fff',
                      border: k === vandaagSleutel && !aan ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
                    }}>{d}</button>
                  )
                })}
              </div>
              <button onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setGekozen(d); setKalender(null) }}
                style={{ marginTop: 8, width: '100%', height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900, cursor: 'pointer' }}>
                Vandaag
              </button>
            </div>
          </>
        )
      })(), document.body)}
    </div>
  )
}
