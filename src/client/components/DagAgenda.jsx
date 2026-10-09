// src/client/components/DagAgenda.jsx
//
// De dag van de klant, als agenda. Eigen scherm, los van ClientAgendaView.
//
// Waarom apart: die view is het gereedschap van de coach — slepen, bulk
// verzetten, blokken bijplannen, zeven kolommen naast elkaar. De klant leest
// één dag en doet er niets aan. Beide uit één component halen betekende dat
// elke verfraaiing aan de klant-kant langs het gereedschap van de coach moest,
// en andersom. De gedeelde kant zit in ClientAgendaService, en dat is precies
// de kant die hetzelfde moet blijven: dezelfde blokken, dezelfde tijden.
//
// Wat dit scherm doet dat de coach-view niet doet:
//   - het tijdvenster past zich aan de dag aan, in plaats van altijd 6:00-24:00
//   - de lopende tijd staat als lijn in het rooster
//   - blokken lezen als kaarten: bold wit, tijd rechts, kleur alleen als streep

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar, ChevronLeft, ChevronRight, ChevronRight as Pijl, Check, Play, List,
  CalendarClock, Maximize2, X, Utensils, Dumbbell, Moon, Briefcase, Pill, SlidersHorizontal, Scale,
} from 'lucide-react'
import {
  ClientAgendaService, DAYS, DAY_LABELS_NL_LONG, getMondayOf, dateForDay, toIsoDate,
} from '../../modules/client-agenda/ClientAgendaService'
import { resolveFoodImage, foodImageFallback } from '../../modules/meal-plan/foodImageFallback'
import { workoutFoto } from './workoutFoto'
import { verzetDag as verzetDagHelper } from './dagNavigatie'
import MacroBoxes from './MacroBoxes'
import BlokTijdSheet from './BlokTijdSheet'
import DagindelingModal from './DagindelingModal'
import { SlaapLogBlad } from '../../modules/progress/SlaapKnop'
import WorkoutServiceNew from '../../modules/workout/services/WorkoutServiceNew'
import { workoutCompletionPct } from '../../modules/workout/utils/exerciseCompletion'

const LIJN = 'rgba(255,255,255,0.07)'
const LIJN_ZACHT = 'rgba(255,255,255,0.04)'

// Hoogte van één uur. Google Agenda houdt op een telefoon ongeveer 48 pixels
// per uur aan; dat is de maat waar een dag in één blik op past. Wij zitten er
// iets boven omdat onze blokken kaarten zijn met een foto erin en geen kale
// balk met één regel tekst.
const UUR_HOOGTE = { mobiel: 64, desktop: 76 }

const ICOON = {
  meal: Utensils,
  training: Dumbbell,
  sleep: Moon,
  work: Briefcase,
  supplement: Pill,
  weging: Scale,
}

const TYPE_LABEL = {
  training: 'Training',
  sleep: 'Slaap',
  work: 'Werk',
  supplement: 'Supplementen',
  weging: 'Wegen',
}

const dagSleutelVan = (d) => DAYS[(d.getDay() + 6) % 7]
const tijd = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

// Overlappende blokken naast elkaar in plaats van op elkaar. Werk is de
// achtergrond van de dag en doet niet mee aan de kolomverdeling; zou het dat
// wel doen, dan wordt een werkdag een halve strook zodra er één maaltijd in
// valt. Zelfde regel als in de coach-view, want het is dezelfde werkelijkheid.
function verdeelInKolommen(blokken) {
  if (!blokken?.length) return []
  const achter = blokken.filter(b => b.type === 'work').map(b => ({ ...b, _achter: true }))
  const voor = blokken.filter(b => b.type !== 'work').map(b => ({ ...b }))
  if (!voor.length) return achter

  const gesorteerd = voor.sort((a, b) => (a.start - b.start) || (b.end - a.end))
  const uit = []
  let groep = []
  let groepEind = -Infinity

  const sluit = () => {
    if (!groep.length) return
    const kolomEind = []
    groep.forEach(b => {
      let k = kolomEind.findIndex(eind => eind <= b.start)
      if (k === -1) { k = kolomEind.length; kolomEind.push(b.end) }
      else kolomEind[k] = b.end
      b._kolom = k
    })
    groep.forEach(b => { b._kolommen = kolomEind.length })
    uit.push(...groep)
    groep = []
    groepEind = -Infinity
  }

  gesorteerd.forEach(b => {
    if (groep.length && b.start >= groepEind) sluit()
    groep.push(b)
    groepEind = Math.max(groepEind, b.end)
  })
  sluit()
  return [...achter, ...uit]
}

export default function DagAgenda({
  client, db, isMobile = false, hoogte, onOpen,
  // Van buitenaf gestuurd: staan de pijltjes elders op de pagina (bij de
  // begroeting), dan houdt die de dag bij en toont de agenda zijn eigen kop
  // niet. Zonder deze props stuurt hij zichzelf.
  dag: dagProp = null,
  weekAnker: weekAnkerProp = null,
  onVerzetDag = null,
  toonKop = true,
  // Op home staan de macro's niet in de agenda: die horen op de maaltijdpagina,
  // en twee plekken met hetzelfde getal is er één te veel.
  toonMacros = true,
}) {
  const service = useMemo(() => new ClientAgendaService(db?.supabase || db), [db])
  const [eigenWeekAnker, setEigenWeekAnker] = useState(() => getMondayOf(new Date()))
  const [eigenDag, setEigenDag] = useState(() => dagSleutelVan(new Date()))
  const gestuurd = !!dagProp && !!weekAnkerProp
  const weekAnker = gestuurd ? weekAnkerProp : eigenWeekAnker
  const dag = gestuurd ? dagProp : eigenDag
  const setWeekAnker = setEigenWeekAnker
  const setDag = setEigenDag
  const [data, setData] = useState(null)
  const [laden, setLaden] = useState(true)
  const [nu, setNu] = useState(() => new Date())
  // Wat er op de getoonde dag al is afgevinkt (sleutel = slot), plus de
  // dagtotalen. Beide uit consumed_meals: dat is wat de maaltijdpagina ook
  // optelt, dus de ringen hier en daar zeggen hetzelfde.
  const [gelogd, setGelogd] = useState({})
  const [verbruikt, setVerbruikt] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [doelen, setDoelen] = useState(null)
  // Twee manieren om dezelfde dag te lezen. De lijst is de standaard: die
  // beantwoordt "wat moet ik vandaag" zonder scrollen. Het rooster laat zien
  // hoe de dag verdeeld is, en dat is pas nuttig op een heel scherm.
  const [weergave, setWeergave] = useState('lijst')
  const [volledig, setVolledig] = useState(false)
  // Welk blok staat er in de tijd-sheet, en een teller om de week opnieuw op
  // te halen zodra er iets verzet is.
  const [bewerk, setBewerk] = useState(null)
  const [dagindeling, setDagindeling] = useState(false)
  const [versie, setVersie] = useState(0)
  const roosterRef = useRef(null)

  useEffect(() => {
    if (!client?.id) return
    let weg = false
    setLaden(true)
    service.loadWeek(client.id, weekAnker)
      .then(d => { if (!weg) setData(d) })
      .catch(e => console.error('Dagagenda laden mislukt:', e))
      .finally(() => { if (!weg) setLaden(false) })
    return () => { weg = true }
  }, [service, client?.id, weekAnker, versie])

  // Doelen staan op de klant en veranderen niet per dag.
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase
      .from('clients')
      .select('target_calories, target_protein, target_carbs, target_fat')
      .eq('id', client.id)
      .single()
      .then(({ data }) => {
        if (weg || !data) return
        setDoelen({
          calories: data.target_calories || 0,
          protein: data.target_protein || 0,
          carbs: data.target_carbs || 0,
          fat: data.target_fat || 0,
        })
      })
    return () => { weg = true }
  }, [db, client?.id])

  useEffect(() => {
    if (!volledig) return
    const opToets = (e) => { if (e.key === 'Escape') setVolledig(false) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [volledig])

  // De nu-lijn hoeft niet op de seconde te kloppen; elke minuut is genoeg.
  useEffect(() => {
    const t = setInterval(() => setNu(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const blokken = useMemo(
    () => verdeelInKolommen((data?.blocksByDay?.[dag] || [])),
    [data, dag]
  )
  // Voor de lijst: gewoon op tijd, zonder kolomverdeling.
  // Het ochtenddeel van de slaap (00:00 tot opstaan) staat op de opstatijd:
  // dat is het moment dat je er iets mee doet. Direct daarna een regel
  // 'Wegen', want daar hoort je weging bij.
  const lijstTijd = (b) => (b.type === 'sleep' && b.meta?.wrapHalf === 'early' ? b.end : b.start)
  const lijstBlokken = useMemo(() => {
    const lijst = [...(data?.blocksByDay?.[dag] || [])]
    const ochtend = lijst.find(b => b.type === 'sleep' && (b.meta?.wrapHalf === 'early' || b.start < 12 * 60))
    const opstaan = ochtend ? ochtend.end : 7 * 60
    // Wegen standaard tien minuten na het opstaan (eerst plassen, dan wegen).
    const wegen = Math.min(opstaan + 10, 24 * 60 - 5)
    lijst.push({ id: `weging-${dag}`, day: dag, type: 'weging', label: 'Wegen', start: wegen, end: wegen + 5, meta: { virtueel: true } })
    return lijst.sort((a, b) => (lijstTijd(a) - lijstTijd(b)) || (a.type === 'sleep' ? -1 : b.type === 'sleep' ? 1 : 0) || (a.end - b.end))
  }, [data, dag])

  // Het venster volgt de dag: begint bij het eerste blok (afgerond naar het
  // hele uur) en eindigt bij het laatste. Een vast raster van 6:00 tot 24:00
  // gaf op de meeste dagen uren leegte boven en onder.
  const { van, tot } = useMemo(() => {
    if (!blokken.length) return { van: 7 * 60, tot: 22 * 60 }
    const start = Math.min(...blokken.map(b => b.start))
    const eind = Math.max(...blokken.map(b => b.end))
    return {
      van: Math.max(0, Math.floor(start / 60) * 60 - 30),
      tot: Math.min(24 * 60, Math.ceil(eind / 60) * 60 + 30),
    }
  }, [blokken])

  const spanMin = Math.max(60, tot - van)
  const uurHoogte = isMobile ? UUR_HOOGTE.mobiel : UUR_HOOGTE.desktop
  const roosterHoogte = (spanMin / 60) * uurHoogte
  const pxVan = (min) => ((Math.max(van, Math.min(tot, min)) - van) / 60) * uurHoogte
  const uren = []
  for (let u = Math.ceil(van / 60); u <= Math.floor(tot / 60); u++) uren.push(u)

  const datum = dateForDay(weekAnker, dag)
  const isVandaag = datum && toIsoDate(datum) === toIsoDate(nu)

  // ── Slaap loggen vanuit het slaapblok ──
  // Het slaapblok loopt over middernacht en staat in twee helften op de dag:
  // het ochtenddeel is de nacht waaruit je vandaag wakker werd (log_date =
  // deze dag), het avonddeel de nacht die vanavond begint (log_date = morgen).
  // Zelfde tabel en hetzelfde blad als op de trackingpagina; de coach ziet
  // het in coach-insight.
  const [slaapLogs, setSlaapLogs] = useState({}) // { 'YYYY-MM-DD': { uren, kwaliteit } }
  const [slaapBlad, setSlaapBlad] = useState(null) // { datum, bed, op }
  const slaapDagIso = datum ? toIsoDate(datum) : null
  const morgenIso = datum ? toIsoDate(new Date(datum.getFullYear(), datum.getMonth(), datum.getDate() + 1)) : null
  useEffect(() => {
    if (!client?.id || !db?.supabase || !slaapDagIso) return
    let weg = false
    db.supabase.from('sleep_logs').select('log_date, hours_slept, quality')
      .eq('client_id', client.id).in('log_date', [slaapDagIso, morgenIso])
      .then(({ data }) => {
        if (weg) return
        const uit = {}
        ;(data || []).forEach(r => { uit[String(r.log_date).slice(0, 10)] = { uren: r.hours_slept, kwaliteit: r.quality } })
        setSlaapLogs(uit)
      }, () => { if (!weg) setSlaapLogs({}) })
    return () => { weg = true }
  }, [client?.id, db, slaapDagIso, morgenIso, versie])
  const [gewogenOp, setGewogenOp] = useState(null) // kg of null
  const [wegenBlad, setWegenBlad] = useState(false)
  useEffect(() => {
    if (!client?.id || !db?.supabase || !slaapDagIso) return
    let weg = false
    const laadWeging = () => db.supabase.from('weight_challenge_logs').select('weight').eq('client_id', client.id).eq('date', slaapDagIso).maybeSingle()
      .then(({ data }) => { if (!weg) setGewogenOp(data?.weight != null ? Number(data.weight) : null) }, () => {})
    laadWeging()
    window.addEventListener('myarc:gewicht-gelogd', laadWeging)
    return () => { weg = true; window.removeEventListener('myarc:gewicht-gelogd', laadWeging) }
  }, [client?.id, db, slaapDagIso, versie])
  // Training: zelfde percentage als de workoutpagina (sets gedaan / sets
  // gepland), over de oefeningen die deze week echt meetellen: met de
  // week-overrides erop en zonder overgeslagen oefeningen. Vanaf 50% telt hij
  // als gedaan. Eerst telden we tegen alle oefeningen uit het plan, en dan
  // kwam een training met overgeslagen oefeningen nooit op afgerond.
  const [trainingPct, setTrainingPct] = useState(0)
  useEffect(() => {
    if (!client?.id || !db?.supabase || !slaapDagIso) return
    let weg = false
    const laad = async () => {
      try {
        const [{ data: klant }, { data: sessies }] = await Promise.all([
          db.supabase.from('clients').select('assigned_schema_id, workout_schedule').eq('id', client.id).maybeSingle().then(r => r, () => ({ data: null })),
          db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).eq('workout_date', slaapDagIso).then(r => r, () => ({ data: [] })),
        ])
        const ids = (sessies || []).map(x => x.id)
        if (!ids.length || !klant?.assigned_schema_id) { if (!weg) setTrainingPct(0); return }
        const [{ data: logs }, { data: plan }] = await Promise.all([
          db.supabase.from('workout_progress').select('exercise_name, sets').in('session_id', ids).then(r => r, () => ({ data: [] })),
          db.supabase.from('workout_schemas').select('id, week_structure').eq('id', klant.assigned_schema_id).maybeSingle().then(r => r, () => ({ data: null })),
        ])
        if (!plan) { if (!weg) setTrainingPct(0); return }
        const metOverrides = await WorkoutServiceNew.getSchemaWithOverrides(client.id, plan, db)
        const weekdag = new Date(`${slaapDagIso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
        const sleutel = klant.workout_schedule?.[weekdag]
        const oefeningen = metOverrides?.week_structure?.[sleutel]?.exercises || []
        if (!weg) setTrainingPct(workoutCompletionPct(oefeningen, logs || []))
      } catch { if (!weg) setTrainingPct(0) }
    }
    laad()
    window.addEventListener('myarc:workout-changed', laad)
    return () => { weg = true; window.removeEventListener('myarc:workout-changed', laad) }
  }, [client?.id, db, slaapDagIso, versie])
  const trainingGedaan = (b) => b.type === 'training' && trainingPct >= 50

  // Supplementen afvinken: supplement_logs per supplement per dag, dezelfde
  // tabel en sleutel als de maaltijdpagina. Een blok (meerdere supplementen op
  // één moment) is gedaan als ze allemaal zijn afgevinkt; het vinkje zet ze
  // allemaal aan of allemaal uit.
  const [suppGelogd, setSuppGelogd] = useState(() => new Set())
  useEffect(() => {
    if (!client?.id || !db?.supabase || !slaapDagIso) return
    let weg = false
    db.supabase.from('supplement_logs').select('supplement_id').eq('client_id', client.id).eq('log_date', slaapDagIso)
      .then(({ data }) => { if (!weg) setSuppGelogd(new Set((data || []).map(r => r.supplement_id))) }, () => {})
    return () => { weg = true }
  }, [client?.id, db, slaapDagIso, versie])
  const suppIds = (b) => (b.meta?.items || []).map(x => x.id).filter(Boolean)
  const supplementGedaan = (b) => { const ids = suppIds(b); return ids.length > 0 && ids.every(id => suppGelogd.has(id)) }
  const wisselSupplementen = async (b) => {
    const ids = suppIds(b)
    if (!ids.length || !client?.id || !db?.supabase || !slaapDagIso) return
    const aan = !supplementGedaan(b)
    const vorige = suppGelogd
    setSuppGelogd(prev => { const n = new Set(prev); ids.forEach(id => (aan ? n.add(id) : n.delete(id))); return n })
    try {
      if (aan) {
        const ontbrekend = (b.meta?.items || []).filter(x => x.id && !vorige.has(x.id))
        if (ontbrekend.length) {
          const { error } = await db.supabase.from('supplement_logs').insert(ontbrekend.map(x => ({
            client_id: client.id, supplement_id: x.id, supplement_name: x.naam, log_date: slaapDagIso,
          })))
          if (error && error.code !== '23505') throw error
        }
      } else {
        const { error } = await db.supabase.from('supplement_logs').delete()
          .eq('client_id', client.id).eq('log_date', slaapDagIso).in('supplement_id', ids)
        if (error) throw error
      }
    } catch (e) {
      console.error('Supplementen afvinken mislukt:', e)
      setSuppGelogd(vorige)
    }
  }
  const wegenVan = (b) => (b.type === 'weging' && slaapDagIso ? {
    kan: slaapDagIso <= toIsoDate(nu),
    gelogd: gewogenOp,
    onLog: () => setWegenBlad(true),
  } : null)
  const minNaarTijd = (m) => (Number.isFinite(m) ? `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : null)
  const slaapVan = (b) => {
    if (b.type !== 'sleep' || !slaapDagIso) return null
    const nacht = b.meta?.wrapHalf === 'late' ? morgenIso : slaapDagIso
    return {
      datum: nacht,
      // Een nacht die nog niet voorbij is, kun je nog niet loggen.
      kan: nacht <= toIsoDate(nu),
      gelogd: slaapLogs[nacht] || null,
      onLog: () => setSlaapBlad({
        datum: nacht,
        bed: minNaarTijd(b.meta?.fullStart ?? b.start) || '23:00',
        op: minNaarTijd(b.meta?.fullEnd ?? b.end) || '07:00',
      }),
    }
  }


  const nuMin = nu.getHours() * 60 + nu.getMinutes()
  const toonNuLijn = isVandaag && nuMin >= van && nuMin <= tot

  // Bij binnenkomst meteen op het juiste moment staan: is het vandaag, dan
  // staat de nu-lijn een derde vanaf de bovenkant in beeld; anders begint de
  // dag bij het eerste blok. Zonder dit kijk je 's avonds naar je ontbijt.
  useEffect(() => {
    if (laden || weergave !== 'rooster') return
    const el = roosterRef.current
    if (!el) return
    const doel = toonNuLijn
      ? pxVan(nuMin) - el.clientHeight * 0.33
      : (blokken.length ? pxVan(Math.min(...blokken.map(b => b.start))) - 12 : 0)
    // Na het renderen van het rooster, anders is scrollHeight nog de oude.
    const id = requestAnimationFrame(() => {
      el.scrollTop = Math.max(0, doel)
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laden, dag, weekAnker, roosterHoogte, weergave, volledig])

  // Wat er op deze dag is gelogd. Eén query per dag; bij het afvinken werken
  // we de lijst hier lokaal bij, zodat de ringen meteen meebewegen.
  const dagIso = datum ? toIsoDate(datum) : null
  useEffect(() => {
    if (!client?.id || !db?.supabase || !dagIso) return
    let weg = false
    db.supabase
      .from('consumed_meals')
      .select('id, meal_id, meal_type, meal_name, calories, protein, carbs, fat, source')
      .eq('client_id', client.id)
      .gte('consumed_at', `${dagIso}T00:00:00`)
      .lt('consumed_at', `${dagIso}T23:59:59`)
      .then(({ data, error }) => {
        if (weg || error) return
        zetGelogd(data || [])
      })
    return () => { weg = true }
  }, [db, client?.id, dagIso])

  const zetGelogd = (rijen) => {
    const som = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const perSlot = {}
    rijen.forEach(r => {
      som.calories += Number(r.calories) || 0
      som.protein += parseFloat(r.protein) || 0
      som.carbs += parseFloat(r.carbs) || 0
      som.fat += parseFloat(r.fat) || 0
      // Een plan-maaltijd herkennen we aan het meal_id; is dat leeg, dan aan
      // het type (ontbijt, lunch). Losse logs vallen hierbuiten en tellen
      // alleen in de totalen mee.
      if (r.source === 'plan_check') perSlot[r.meal_id || `type:${r.meal_type}`] = r.id
    })
    setVerbruikt({
      calories: Math.round(som.calories), protein: Math.round(som.protein),
      carbs: Math.round(som.carbs), fat: Math.round(som.fat),
    })
    setGelogd(perSlot)
  }

  const sleutelVan = (blok) => blok.sourceId || `type:${String(blok.meta?.slot || '').replace(/\d+$/, '')}`

  // ── Dagvoortgang ── Wat er vandaag af te vinken valt en hoeveel daarvan
  // gedaan is: maaltijden, de nacht (als die voorbij is) en wegen. Een
  // training kan de agenda nog niet als gedaan herkennen; die telt niet mee.
  const voortgang = useMemo(() => {
    let totaal = 0, gedaan = 0
    lijstBlokken.forEach(b => {
      if (b.type === 'meal') { totaal++; if (gelogd[sleutelVan(b)]) gedaan++ }
      else if (b.type === 'sleep') { const z = slaapVan(b); if (z?.kan && z.datum === slaapDagIso) { totaal++; if (z.gelogd) gedaan++ } }
      else if (b.type === 'weging') { const w = wegenVan(b); if (w?.kan) { totaal++; if (w.gelogd != null) gedaan++ } }
      else if (b.type === 'training') { totaal++; if (trainingGedaan(b)) gedaan++ }
      else if (b.type === 'supplement' && suppIds(b).length) { totaal++; if (supplementGedaan(b)) gedaan++ }
    })
    return { totaal, gedaan, rond: totaal > 0 && gedaan === totaal }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lijstBlokken, gelogd, slaapLogs, gewogenOp, slaapDagIso, trainingPct, suppGelogd])
  // Confetti als je zelf de laatste afvinkt; één keer per dag.
  const [confetti, setConfetti] = useState(0)
  const vorigeRond = useRef(null)
  useEffect(() => {
    if (laden) return
    const was = vorigeRond.current
    vorigeRond.current = voortgang.rond
    if (was === false && voortgang.rond && Date.now() - (window.__arcLaatsteTik || 0) < 120000) {
      const k = `arc_dag_rond_${slaapDagIso}`
      let al = false
      try { al = !!localStorage.getItem(k); localStorage.setItem(k, '1') } catch { /* geen opslag */ }
      if (!al) {
        setConfetti(c => c + 1)
        if (navigator.vibrate) navigator.vibrate([20, 60, 20, 60, 40])
      }
    }
  }, [voortgang.rond, laden, slaapDagIso])
  useEffect(() => {
    if (!confetti) return
    const t = setTimeout(() => setConfetti(0), 2600)
    return () => clearTimeout(t)
  }, [confetti])

  // ── Deck van afgeronde dingen ──
  // Wat gedaan is, verdwijnt uit de lijst naar een stapeltje kaarten onder de
  // voortgangsbalk. Vink je zelf iets af, dan klapt de regel eerst in en
  // schiet hij omhoog (inklappen), daarna ligt hij op het deck.
  const isGedaan = (b) => {
    if (b.type === 'meal') return !!gelogd[sleutelVan(b)]
    if (b.type === 'sleep') { const z = slaapVan(b); return !!(z?.kan && z.gelogd) }
    if (b.type === 'weging') { const w = wegenVan(b); return !!(w?.kan && w.gelogd != null) }
    if (b.type === 'training') return trainingGedaan(b)
    if (b.type === 'supplement') return supplementGedaan(b)
    return false
  }
  const gedaanBlokken = lijstBlokken.filter(isGedaan)
  const gedaanIds = gedaanBlokken.map(b => b.id).join('|')
  const [inklappen, setInklappen] = useState({}) // id → true tijdens de animatie
  const [deckOpen, setDeckOpen] = useState(false)
  const [deckPop, setDeckPop] = useState(0)
  const vorigeGedaan = useRef(null)
  useEffect(() => {
    if (laden) return
    const nu = new Set(gedaanIds ? gedaanIds.split('|') : [])
    // Wat er gedaan was toen je home de vorige keer zag (deze sessie, deze
    // dag). Zo zie je ook het afronden van iets wat je elders logde, zoals je
    // training op de workoutpagina, als je terugkomt.
    const opslagSleutel = `arc_home_gedaan_${slaapDagIso}`
    let wasUitOpslag = null
    try { const r = sessionStorage.getItem(opslagSleutel); if (r != null) wasUitOpslag = new Set(r ? r.split('|') : []) } catch { /* geen opslag */ }
    try { sessionStorage.setItem(opslagSleutel, gedaanIds) } catch { /* geen opslag */ }
    const was = vorigeGedaan.current || wasUitOpslag
    const vanElders = !vorigeGedaan.current && !!wasUitOpslag
    vorigeGedaan.current = nu
    // Niet meer gedaan (teruggedraaid)? Dan meteen uit het inklappen halen,
    // anders blijft de regel ingeklapt en onzichtbaar in de lijst staan.
    setInklappen(prev => {
      const weg = Object.keys(prev).filter(id => !nu.has(id))
      if (!weg.length) return prev
      const n = { ...prev }; weg.forEach(id => { delete n[id] }); return n
    })
    if (!was) return
    const nieuw = [...nu].filter(id => !was.has(id))
    if (!nieuw.length) return
    setDeckPop(p => p + 1)
    if (!vanElders && Date.now() - (window.__arcLaatsteTik || 0) > 120000) return
    setInklappen(prev => { const n = { ...prev }; nieuw.forEach(id => { n[id] = true }); return n })
    // Bewust geen opruimen van deze timer bij een volgende run: anders bleef
    // een regel die je snel weer ontvinkte voor altijd ingeklapt staan.
    setTimeout(() => setInklappen(prev => { const n = { ...prev }; nieuw.forEach(id => { delete n[id] }); return n }), 560)
  }, [gedaanIds, laden, slaapDagIso])
  // Andere dag: opnieuw beginnen, geen animaties van de vorige dag.
  useEffect(() => { vorigeGedaan.current = null; setDeckOpen(false); setInklappen({}) }, [dag, weekAnker])

  // Afvinken vanuit de agenda schrijft dezelfde rij als de maaltijdpagina:
  // consumed_meals met source 'plan_check'. Anders zou het vinkje hier niet
  // meetellen in de macro's daar, en andersom.
  const wisselAfgerond = async (blok) => {
    if (!client?.id || !db?.supabase || !dagIso) return
    const sleutel = sleutelVan(blok)
    const bestaandeId = gelogd[sleutel]
    const macro = {
      calories: Math.round(Number(blok.meta?.kcal) || 0),
      protein: Math.round(Number(blok.meta?.protein) || 0),
      carbs: Math.round(Number(blok.meta?.carbs) || 0),
      fat: Math.round(Number(blok.meta?.fat) || 0),
    }

    if (bestaandeId) {
      setGelogd(prev => { const kopie = { ...prev }; delete kopie[sleutel]; return kopie })
      setVerbruikt(prev => ({
        calories: prev.calories - macro.calories, protein: prev.protein - macro.protein,
        carbs: prev.carbs - macro.carbs, fat: prev.fat - macro.fat,
      }))
      const { error } = await db.supabase.from('consumed_meals').delete().eq('id', bestaandeId)
      if (error) console.error('Afvinken ongedaan maken mislukt:', error)
      return
    }

    setGelogd(prev => ({ ...prev, [sleutel]: 'bezig' }))
    setVerbruikt(prev => ({
      calories: prev.calories + macro.calories, protein: prev.protein + macro.protein,
      carbs: prev.carbs + macro.carbs, fat: prev.fat + macro.fat,
    }))
    const nuIso = toIsoDate(new Date()) === dagIso ? new Date() : new Date(`${dagIso}T12:00:00`)
    const { data, error } = await db.supabase.from('consumed_meals').insert({
      client_id: client.id,
      meal_name: blok.sublabel || blok.label || 'Maaltijd',
      meal_id: blok.sourceId || null,
      meal_type: String(blok.meta?.slot || '').replace(/\d+$/, '') || null,
      ...macro,
      amount: 1,
      per_unit: 'portion',
      consumed_at: nuIso.toISOString(),
      source: 'plan_check',
      log_count: 1,
    }).select().single()
    if (error) {
      console.error('Afvinken mislukt:', error)
      setGelogd(prev => { const kopie = { ...prev }; delete kopie[sleutel]; return kopie })
      setVerbruikt(prev => ({
        calories: prev.calories - macro.calories, protein: prev.protein - macro.protein,
        carbs: prev.carbs - macro.carbs, fat: prev.fat - macro.fat,
      }))
      return
    }
    setGelogd(prev => ({ ...prev, [sleutel]: data.id }))
  }

  const verzet = (richting) => {
    if (onVerzetDag) { onVerzetDag(richting); return }
    const volgende = verzetDagHelper({ dag, weekAnker }, richting)
    setWeekAnker(volgende.weekAnker)
    setDag(volgende.dag)
  }

  const naarVandaag = () => {
    if (onVerzetDag) { onVerzetDag(0); return }
    setWeekAnker(getMondayOf(new Date()))
    setDag(dagSleutelVan(new Date()))
  }

  const inhoud = (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      // De lijst groeit mee met de dag; het rooster krijgt een vaste hoogte en
      // scrolt intern, anders wordt de pagina een tijdbalk van twee meter.
      height: volledig ? '100%' : (weergave === 'rooster' ? (hoogte || '100%') : 'auto'),
    }}>
      {/* Kop: pijltjes om de dag heen. Staan die elders op de pagina, dan
          slaat de agenda zijn eigen kop over. */}
      {toonKop && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        paddingBottom: isMobile ? 8 : 10,
      }}>
        <button onClick={() => verzet(-1)} aria-label="Vorige dag" style={pijlKnop}>
          <ChevronLeft size={18} strokeWidth={3} />
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {isVandaag ? 'Vandaag' : DAY_LABELS_NL_LONG[dag]}
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {datum ? datum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : ''}
          </div>
        </div>
        <button onClick={() => verzet(1)} aria-label="Volgende dag" style={pijlKnop}>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
      )}

      {/* De dagtotalen horen bij de dag die je bekijkt, dus staan ze onder de
          datum en niet los boven de agenda. */}
      {toonMacros && doelen && doelen.calories > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: isMobile ? 10 : 12 }}>
          <MacroBoxes kaal consumed={verbruikt} targets={doelen} />
        </div>
      )}

      {/* Kaal rijtje iconen rechts: wisselen tussen lijst en rooster, je
          dagindeling, en (alleen in het rooster) op het hele scherm. De grote
          schakelaar was drukker dan de dag eronder. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexShrink: 0,
        paddingBottom: isMobile ? 4 : 6,
      }}>
        <button
          onClick={() => setWeergave(weergave === 'lijst' ? 'rooster' : 'lijst')}
          title={weergave === 'lijst' ? 'Als rooster' : 'Als lijst'}
          aria-label={weergave === 'lijst' ? 'Als rooster' : 'Als lijst'}
          style={{ ...pijlKnop, width: 28, height: 28, color: 'rgba(255,255,255,0.6)' }}
        >
          {weergave === 'lijst' ? <CalendarClock size={16} strokeWidth={2.6} /> : <List size={16} strokeWidth={2.6} />}
        </button>
        <button
          onClick={() => setDagindeling(true)}
          title="Mijn dagindeling"
          aria-label="Mijn dagindeling"
          style={{ ...pijlKnop, width: 28, height: 28, color: 'rgba(255,255,255,0.6)' }}
        >
          <SlidersHorizontal size={15} strokeWidth={2.6} />
        </button>
        {(weergave === 'rooster' || volledig) && (
          <button
            onClick={() => setVolledig(v => !v)}
            title={volledig ? 'Sluiten' : 'Op het hele scherm'}
            aria-label={volledig ? 'Sluiten' : 'Op het hele scherm'}
            style={{ ...pijlKnop, width: 28, height: 28, color: 'rgba(255,255,255,0.6)' }}
          >
            {volledig ? <X size={17} strokeWidth={2.8} /> : <Maximize2 size={15} strokeWidth={2.6} />}
          </button>
        )}
      </div>

      {/* Dagvoortgang: hoeveel van wat er af te vinken valt, is gedaan. */}
      {voortgang.totaal > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: weergave === 'lijst' && gedaanBlokken.length > 0 ? 0 : (isMobile ? 10 : 12) }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: voortgang.rond ? '#10b981' : '#fff', letterSpacing: '-0.01em', transition: 'color 0.4s ease' }}>
              {voortgang.rond ? 'Dag rond' : `${voortgang.gedaan} van ${voortgang.totaal} gedaan`}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 900, color: voortgang.rond ? '#10b981' : 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((voortgang.gedaan / voortgang.totaal) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* Kleur loopt mee met de voortgang: van wit naar groen. */}
            {(() => {
              const t = voortgang.gedaan / voortgang.totaal
              const mix = (a, b) => Math.round(a + (b - a) * t)
              const kleur = `rgb(${mix(255, 16)}, ${mix(255, 185)}, ${mix(255, 129)})`
              return (
                <div style={{
                  width: `${t * 100}%`, height: '100%', borderRadius: 2,
                  background: kleur,
                  boxShadow: t > 0.5 ? `0 0 ${Math.round(t * 10)}px rgba(16,185,129,${(t * 0.5).toFixed(2)})` : 'none',
                  transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.6s ease, box-shadow 0.6s ease',
                }} />
              )
            })()}
          </div>
        </div>
      )}

      {/* Het deck: de fotootjes en icoontjes van wat gedaan is als kaartjes die
          iets scheef over elkaar liggen, strak onder de voortgangsbalk. Het
          nieuwste kaartje valt er bovenop. Tik om open te waaieren. */}
      {weergave === 'lijst' && gedaanBlokken.length > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: isMobile ? 10 : 12 }}>
          <style>{`
            @keyframes arcKaartErbij { 0% { transform: translateY(-16px) rotate(var(--r)) scale(1.25); opacity: 0 } 60% { transform: translateY(2px) rotate(var(--r)) scale(0.96); opacity: 1 } 100% { transform: translateY(0) rotate(var(--r)) scale(1) } }
            @keyframes arcDeckUit { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
          `}</style>
          <button
            onClick={() => setDeckOpen(o => !o)}
            aria-expanded={deckOpen}
            aria-label={`${gedaanBlokken.length} gedaan, ${deckOpen ? 'inklappen' : 'bekijken'}`}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 0',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
              {gedaanBlokken.map((b, i) => {
                const foto = b.type === 'meal'
                  ? (resolveFoodImage({ image_url: b.meta?.image_url, name: b.sublabel }) || foodImageFallback(b.sublabel, b.meta?.slot, 120))
                  : b.type === 'training' ? workoutFoto(b.sublabel || b.label || 'Training')
                  : null
                const Icoon = ICOON[b.type] || Check
                const rot = ((i * 37) % 9) - 4
                const laatste = i === gedaanBlokken.length - 1
                return (
                  <span key={b.id} style={{
                    '--r': `${rot}deg`,
                    width: 28, height: 36, marginLeft: i ? -12 : 0, borderRadius: 6, flexShrink: 0,
                    border: '2px solid #0a0a0a', boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                    background: foto ? `url(${foto}) center/cover` : '#1c1c1c',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `rotate(${rot}deg)`, zIndex: i,
                    animation: laatste && deckPop ? 'arcKaartErbij 0.5s cubic-bezier(0.3, 1.3, 0.5, 1)' : 'none',
                  }}>
                    {!foto && <Icoon size={13} strokeWidth={2.6} color="#10b981" />}
                  </span>
                )
              })}
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#10b981', whiteSpace: 'nowrap' }}>
              {gedaanBlokken.length} gedaan
            </span>
            <ChevronRight size={15} strokeWidth={3} color="rgba(255,255,255,0.4)" style={{ marginLeft: 'auto', transform: deckOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>
          {deckOpen && (
            <div style={{ marginTop: 8, animation: 'arcDeckUit 0.25s ease' }}>
              {gedaanBlokken.map(b => (
                <LijstRegel
                  key={`gedaan-${b.id}`}
                  blok={b}
                  isMobile={isMobile}
                  onOpen={onOpen}
                  afgerond
                  onAfronden={b.type === 'meal' ? () => wisselAfgerond(b) : (b.type === 'supplement' && suppIds(b).length ? () => wisselSupplementen(b) : null)}
                  onTijd={b.type === 'weging' ? null : () => setBewerk(b)}
                  bezig={false}
                  slaap={slaapVan(b)}
                  wegen={wegenVan(b)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confetti bij 'Dag rond': kort, over de lijst heen, niet aantikbaar. */}
      {confetti > 0 && createPortal(
        <div key={confetti} aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 2147482900, pointerEvents: 'none', overflow: 'hidden' }}>
          <style>{`
            @keyframes arcConfetti { 0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 1 } 100% { transform: translate3d(var(--dx), 105vh, 0) rotate(var(--rot)); opacity: 0.9 } }
            @keyframes arcDagRond { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0 } 20% { transform: translate(-50%,-50%) scale(1.08); opacity: 1 } 35% { transform: translate(-50%,-50%) scale(1) } 80% { opacity: 1 } 100% { opacity: 0 } }
          `}</style>
          {Array.from({ length: 70 }, (_, i) => {
            const kleur = ['#10b981', '#ffffff', '#facc15', '#34d399', '#e5e7eb'][i % 5]
            const links = (i * 37) % 100
            const vertraging = (i % 14) * 0.06
            const duur = 1.6 + ((i * 13) % 9) / 10
            return (
              <span key={i} style={{
                position: 'absolute', top: 0, left: `${links}%`,
                width: i % 3 === 0 ? 6 : 8, height: i % 3 === 0 ? 10 : 5, borderRadius: i % 4 === 0 ? '50%' : 1.5,
                background: kleur, '--dx': `${((i * 23) % 60) - 30}px`, '--rot': `${(i * 97) % 720}deg`,
                animation: `arcConfetti ${duur}s cubic-bezier(0.25, 0.6, 0.4, 1) ${vertraging}s forwards`,
              }} />
            )
          })}
          <div style={{
            position: 'absolute', left: '50%', top: '42%',
            padding: '0.8rem 1.2rem', borderRadius: 16, background: 'rgba(10,10,10,0.92)',
            border: '1px solid rgba(16,185,129,0.5)', color: '#fff', textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            animation: 'arcDagRond 2.4s ease forwards',
          }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Alles gedaan vandaag</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>Dag rond</div>
          </div>
        </div>,
        document.body
      )}

      {/* Lijst: wat er vandaag staat, van vroeg naar laat. Eén regel per
          blok, met de tijden rechts — zoals de dagweergave van een
          agenda-app. Beantwoordt "wat moet ik vandaag" zonder scrollen. */}
      {weergave === 'lijst' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: `1px solid ${LIJN_ZACHT}` }}>
          {laden && (
            <div style={{ padding: '1.2rem 0', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
              Dag laden…
            </div>
          )}
          {!laden && lijstBlokken.length === 0 && (
            <div style={{
              padding: '1.6rem 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)',
            }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Niets gepland op deze dag</span>
            </div>
          )}
          <style>{`
            @keyframes arcInklappen { 0% { max-height: 60px; opacity: 1; transform: translateY(0) scale(1) } 55% { opacity: 0.6; transform: translateY(-14px) scale(0.97) } 100% { max-height: 0; opacity: 0; transform: translateY(-34px) scale(0.92) } }
          `}</style>

          {/* Wat nog moet. Net afgevinkt? Dan klapt de regel eerst in en
              schiet hij omhoog naar het deck. */}
          {lijstBlokken.filter(b => !isGedaan(b) || inklappen[b.id]).map(b => (
            <div key={b.id} style={inklappen[b.id] ? { overflow: 'hidden', animation: 'arcInklappen 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards' } : undefined}>
              <LijstRegel
                blok={b}
                isMobile={isMobile}
                onOpen={onOpen}
                afgerond={(b.type === 'meal' && !!gelogd[sleutelVan(b)]) || (b.type === 'supplement' && supplementGedaan(b))}
                onAfronden={b.type === 'meal' ? () => wisselAfgerond(b) : (b.type === 'supplement' && suppIds(b).length ? () => wisselSupplementen(b) : null)}
                onTijd={b.type === 'weging' ? null : () => setBewerk(b)}
                bezig={toonNuLijn && nuMin >= b.start && nuMin < b.end}
                slaap={slaapVan(b)}
                wegen={wegenVan(b)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Rooster */}
      {weergave === 'rooster' && (
      <div
        ref={roosterRef}
        style={{
          flex: 1, minHeight: 0, position: 'relative',
          display: 'flex', overflowY: 'auto',
          borderTop: `1px solid ${LIJN}`,
        }}
      >
        {/* Tijdas */}
        <div style={{ width: isMobile ? 34 : 40, flexShrink: 0, position: 'relative', height: roosterHoogte }}>
          {uren.map(u => (
            <div key={u} style={{
              position: 'absolute', top: pxVan(u * 60), left: 0, right: 4,
              transform: 'translateY(-50%)',
              fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {String(u).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Dagkolom */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height: roosterHoogte }}>
          {uren.map(u => (
            <div key={u} style={{
              position: 'absolute', top: pxVan(u * 60), left: 0, right: 0,
              borderTop: `1px solid ${LIJN_ZACHT}`,
            }} />
          ))}

          {toonNuLijn && (
            <div style={{
              position: 'absolute', top: pxVan(nuMin), left: 0, right: 0,
              height: 0, borderTop: '1px solid rgba(255,255,255,0.5)', zIndex: 6,
            }}>
              <span style={{
                position: 'absolute', left: -3, top: -3,
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
              }} />
            </div>
          )}

          {laden && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40,
              fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            }}>
              Dag laden…
            </div>
          )}

          {!laden && blokken.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-start', gap: 6, paddingTop: 40,
              color: 'rgba(255,255,255,0.3)',
            }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Niets gepland op deze dag</span>
            </div>
          )}

          {blokken.map(b => (
            <Blok
              key={b.id}
              blok={b}
              isMobile={isMobile}
              pxVan={pxVan}
              uurHoogte={uurHoogte}
              onOpen={onOpen}
              afgerond={(b.type === 'meal' && !!gelogd[sleutelVan(b)]) || (b.type === 'supplement' && supplementGedaan(b))}
              onAfronden={b.type === 'meal' ? () => wisselAfgerond(b) : (b.type === 'supplement' && suppIds(b).length ? () => wisselSupplementen(b) : null)}
              onTijd={() => setBewerk(b)}
              slaap={slaapVan(b)}
            />
          ))}
        </div>
      </div>
      )}

      <SlaapLogBlad
        open={!!slaapBlad}
        onClose={() => setSlaapBlad(null)}
        client={client} db={db}
        datum={slaapBlad?.datum}
        voorBed={slaapBlad?.bed || null}
        voorOpstaan={slaapBlad?.op || null}
        onOpgeslagen={(r) => { if (r?.datum) setSlaapLogs(prev => ({ ...prev, [r.datum]: { uren: r.uren, kwaliteit: r.kwaliteit } })) }}
        onGewicht={(r) => { if (r?.datum === slaapDagIso) setGewogenOp(r.gewicht) }}
      />
      <SlaapLogBlad
        open={wegenBlad}
        onClose={() => setWegenBlad(false)}
        client={client} db={db}
        datum={slaapDagIso}
        alleenGewicht
        onGewicht={(r) => { if (r?.datum === slaapDagIso) setGewogenOp(r.gewicht) }}
      />

      {/* Tijd verzetten: dezelfde sheet vanuit de lijst en vanuit het rooster. */}
      {bewerk && dagIso && (
        <BlokTijdSheet
          blok={bewerk}
          client={client}
          service={service}
          dagIso={dagIso}
          mealPlanId={data?.mealPlan?.id || null}
          isMobile={isMobile}
          onSluit={() => setBewerk(null)}
          onKlaar={() => { setBewerk(null); setVersie(v => v + 1) }}
        />
      )}

      {dagindeling && (
        <DagindelingModal
          client={client}
          db={db}
          service={service}
          isMobile={isMobile}
          onSluit={() => setDagindeling(false)}
          onGewijzigd={() => setVersie(v => v + 1)}
        />
      )}

      {!isVandaag && (
        <button onClick={naarVandaag} style={{
          flexShrink: 0, marginTop: 8, minHeight: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
          color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          Terug naar vandaag
        </button>
      )}
    </div>
  )

  // Op het hele scherm: dezelfde inhoud, alleen zonder de pagina eromheen.
  // Handig voor het rooster, waar je de hele dag in één keer wil zien.
  if (volledig) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        background: '#0a0a0a',
        padding: isMobile
          ? 'calc(env(safe-area-inset-top, 0px) + 0.75rem) 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
          : '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column',
      }}>
        {inhoud}
      </div>,
      document.body
    )
  }

  return inhoud
}

// Eén blok. Maaltijden en trainingen krijgen hun eigen kaart — dezelfde vorm
// als op de maaltijd- en workout-pagina — zodat de agenda niet een rooster met
// tekstregels is maar hetzelfde spul op een tijdlijn. De rest (slaap, werk,
// supplementen) blijft een rustige regel: dat hoef je alleen te zien, niet te
// lezen.
function Blok({ blok, isMobile, pxVan, uurHoogte, onOpen, afgerond = false, onAfronden = null, onTijd = null, slaap = null }) {
  const top = pxVan(blok.start)
  // Ondergrens per soort. Een maaltijd duurt in het plan een kwartier; op
  // ware grootte is dat een streepje. Hij krijgt daarom de ruimte van een half
  // uur — genoeg voor de kaart, en niet zoveel dat hij het uur erna opslokt.
  // De tijd in de kaart blijft de echte begintijd.
  const minHoogte = blok.type === 'meal' ? uurHoogte / 2
    : blok.type === 'training' ? uurHoogte * 0.75
    : 26
  const hoogte = Math.max(minHoogte, pxVan(blok.end) - top)
  const achter = !!blok._achter
  const isMaaltijd = blok.type === 'meal'
  const isTraining = blok.type === 'training'
  const Icoon = ICOON[blok.type] || Calendar

  const soort = isMaaltijd ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || '')
  const naam = blok.sublabel || (isMaaltijd ? null : blok.label)
  // De kaarten zijn zelf geen knop: er zitten handelingen op (afronden,
  // starten, openen), en dan is "ergens op de kaart tikken" een gok.
  const klikbaar = false

  // Hoeveel past erin? De kaart met foto vanaf een halfuurhoogte, het
  // slot-label op de foto zodra daar plek voor is, de macro's pas als het blok
  // echt hoog is.
  const ruim = hoogte >= 30
  const slotOpFoto = hoogte >= 52
  const metMacros = hoogte >= 74

  const buiten = {
    position: 'absolute',
    top, height: hoogte,
    left: achter ? 0 : `calc(${((blok._kolom || 0) / (blok._kolommen || 1)) * 100}% + 4px)`,
    width: achter ? '100%' : `calc(${100 / (blok._kolommen || 1)}% - 8px)`,
    // Eén kleur voor alles: wit. De blokken verschilden per soort van kleur
    // (blauw voor slaap, groen voor eten, rood voor training) en daarmee las
    // een dag als een kleurenkaart in plaats van als een dag. Wat het is, zegt
    // het icoon en het label al.
    background: achter ? 'rgba(255,255,255,0.05)' : '#141414',
    border: `1px solid ${achter ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
    borderLeft: '3px solid rgba(255,255,255,0.85)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: achter ? 0 : 2,
    opacity: blok.meta?.placeholder ? 0.6 : (afgerond ? 0.72 : 1),
    cursor: klikbaar ? 'pointer' : 'default',
    textAlign: 'left',
    padding: 0,
    fontFamily: 'inherit',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  const titel = `${soort}${naam ? ` — ${naam}` : ''}\n${tijd(blok.start)}–${tijd(blok.end)}`
  const Wrapper = klikbaar ? 'button' : 'div'
  const wrapperProps = klikbaar ? { onClick: () => onOpen(blok) } : {}

  // ── Maaltijd: foto links, naam en macro's ernaast ──
  if (isMaaltijd && ruim) {
    const foto = resolveFoodImage({ image_url: blok.meta?.image_url, name: naam })
      || foodImageFallback(naam, blok.meta?.slot, 200)
    const macros = [
      { val: blok.meta?.kcal, label: 'kcal' },
      { val: blok.meta?.protein, label: 'E' },
      { val: blok.meta?.carbs, label: 'K' },
      { val: blok.meta?.fat, label: 'V' },
    ].filter(m => Number(m.val) > 0)
    return (
      <Wrapper {...wrapperProps} title={titel} style={{ ...buiten, display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          width: Math.min(92, Math.max(44, hoogte)), flexShrink: 0, alignSelf: 'stretch',
          background: foto ? `url(${foto}) center/cover` : 'rgba(255,255,255,0.05)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.75) 100%)',
          }} />
          {slotOpFoto && (
            <span style={{
              position: 'absolute', left: 6, right: 4, bottom: 4,
              fontSize: '0.56rem', fontWeight: 900, color: '#fff',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {soort}
            </span>
          )}
        </div>
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: metMacros ? (isMobile ? '6px 8px' : '8px 10px') : '3px 8px', gap: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 900,
              color: afgerond ? 'rgba(255,255,255,0.45)' : '#fff',
              textDecoration: afgerond ? 'line-through' : 'none',
              letterSpacing: '-0.015em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {naam || soort}
            </span>
            <TijdStempel blok={blok} onTijd={onTijd} />
            {onAfronden && (
              <button
                onClick={(e) => { e.stopPropagation(); onAfronden() }}
                title={afgerond ? 'Toch niet gegeten' : 'Afronden'}
                aria-label={afgerond ? 'Afvinken ongedaan maken' : 'Afronden'}
                style={{ ...kaartKnop, color: afgerond ? '#10b981' : '#fff' }}
              >
                <Check size={14} strokeWidth={3.2} />
              </button>
            )}
            {onOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                title="Open in je maaltijdplan"
                aria-label="Open in je maaltijdplan"
                style={kaartKnop}
              >
                <Pijl size={14} strokeWidth={3.2} />
              </button>
            )}
          </div>
          {metMacros && macros.length > 0 && (
            <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', overflow: 'hidden' }}>
              {macros.map(m => (
                <span key={m.label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{Math.round(m.val)}</span>
                  <span style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{m.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // ── Training: foto als achtergrond, naam eroverheen ──
  if (isTraining && ruim) {
    return (
      <Wrapper {...wrapperProps} title={titel} style={{ ...buiten, display: 'block', position: 'absolute' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${workoutFoto(naam || soort)})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.85) 100%)',
        }} />
        <div style={{
          position: 'relative', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: isMobile ? '6px 9px' : '8px 11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}>
              {naam || 'Training'}
            </span>
            <TijdStempel blok={blok} onTijd={onTijd} kleur="rgba(255,255,255,0.6)" />
            {onOpen && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                  title="Start je training"
                  aria-label="Start je training"
                  style={kaartKnop}
                >
                  <Play size={14} strokeWidth={3.2} fill="#fff" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                  title="Open je schema"
                  aria-label="Open je schema"
                  style={kaartKnop}
                >
                  <Pijl size={14} strokeWidth={3.2} />
                </button>
              </>
            )}
          </div>
          <span style={{
            fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            Training
          </span>
        </div>
      </Wrapper>
    )
  }

  // ── De rest: één rustige regel ──
  return (
    <Wrapper {...wrapperProps} title={titel} style={{
      ...buiten,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: isMobile ? '4px 8px' : '6px 10px',
    }}>
      <Icoon size={11} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: isMobile ? '0.74rem' : '0.8rem', fontWeight: 900, color: '#fff',
        letterSpacing: '-0.015em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {naam || soort}
      </span>
      {slaap && <SlaapActie slaap={slaap} compact />}
      <TijdStempel blok={blok} onTijd={onTijd} />
    </Wrapper>
  )
}

// De begintijd in het rooster, als knop. Zelfde afspraak als in de lijst:
// waar de tijd staat, kun je hem verzetten.
function TijdStempel({ blok, onTijd, kleur }) {
  if (!onTijd) {
    return <span style={kleur ? { ...tijdStempel, color: kleur } : tijdStempel}>{tijd(blok.start)}</span>
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onTijd() }}
      title="Tijd aanpassen"
      style={{
        ...tijdStempel,
        ...(kleur ? { color: kleur } : null),
        padding: 0, background: 'transparent', border: 'none', fontFamily: 'inherit',
        cursor: 'pointer', textDecoration: 'underline',
        textDecorationColor: 'rgba(255,255,255,0.25)', textUnderlineOffset: 3,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {tijd(blok.start)}
    </button>
  )
}

// Eén regel in de lijst: streep, naam, tijden rechts. Loopt het blok nu, dan
// is de streep vol wit in plaats van doorzichtig — dat is het enige verschil
// dat je nodig hebt om te zien waar je bent.
// Slaapblok: nog niet gelogd → witte knop 'Log' om het te stimuleren;
// gelogd → uren en cijfer in groen. Tik op het getal om het bij te werken.
const nl1 = (n) => String(Math.round(Number(n) * 10) / 10).replace('.', ',')
function SlaapActie({ slaap, compact = false }) {
  if (!slaap?.kan) return null
  const knop = {
    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
    background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: compact ? '0.62rem' : '0.74rem', fontWeight: 900, whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  if (slaap.gelogd) {
    return (
      <button onClick={(e) => { e.stopPropagation(); slaap.onLog() }} title="Slaap bijwerken" style={{ ...knop, color: '#10b981' }}>
        {slaap.gelogd.uren != null ? `${nl1(slaap.gelogd.uren)}u` : '✓'}{slaap.gelogd.kwaliteit != null ? ` · ${slaap.gelogd.kwaliteit}` : ''}
      </button>
    )
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); slaap.onLog() }} title="Slaap loggen" aria-label="Slaap loggen" style={{ ...knop, color: '#fff' }}>
      <Moon size={compact ? 11 : 14} strokeWidth={2.6} /> Log
    </button>
  )
}

// Eén actieknop voor de lijst: kaal icoon, vast formaat, grijs of groen.
// Springt hij van 'te doen' naar 'gedaan', dan viert hij dat even: het vinkje
// knalt op en veert terug, een groene ring loopt naar buiten, zes stipjes
// spatten weg en de telefoon tikt. Kort genoeg om niet te storen, genoeg om
// het afvinken fijn te maken.
const VIER_CSS = `
@keyframes arcVinkPop { 0% { transform: scale(0.6) } 45% { transform: scale(1.45) } 70% { transform: scale(0.9) } 100% { transform: scale(1) } }
@keyframes arcVinkRing { 0% { transform: scale(0.4); opacity: 0.9 } 100% { transform: scale(2.4); opacity: 0 } }
@keyframes arcVinkVonk { 0% { transform: rotate(var(--hoek)) translateY(0) scale(1); opacity: 1 } 100% { transform: rotate(var(--hoek)) translateY(-22px) scale(0.3); opacity: 0 } }
`
function ActieKnop({ gedaan, titel, onClick, icoon }) {
  const Icoon = icoon
  const vorige = useRef(gedaan)
  // Alleen vieren als je zelf op deze knop tikte (binnen twee minuten: slaap
  // en wegen lopen via een blad). Anders zou alles wat bij het laden al
  // gedaan blijkt, bij elk bezoek opknallen.
  const aangetikt = useRef(0)
  const [vier, setVier] = useState(0)
  useEffect(() => {
    if (gedaan && !vorige.current && Date.now() - aangetikt.current < 120000) {
      setVier(v => v + 1)
      if (navigator.vibrate) navigator.vibrate([12, 40, 18])
    }
    vorige.current = gedaan
  }, [gedaan])
  const bezigMetVieren = vier > 0
  return (
    <button
      onClick={(e) => { e.stopPropagation(); aangetikt.current = Date.now(); window.__arcLaatsteTik = Date.now(); onClick?.() }}
      title={titel} aria-label={titel}
      style={{
        ...kaartKnop, width: 30, height: 30, position: 'relative', overflow: 'visible',
        color: gedaan ? '#10b981' : 'rgba(255,255,255,0.6)',
      }}
    >
      <style>{VIER_CSS}</style>
      {bezigMetVieren && (
        <span key={`fx-${vier}`} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <span style={{
            position: 'absolute', inset: 2, borderRadius: '50%', border: '2px solid #10b981',
            animation: 'arcVinkRing 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }} />
          {[0, 60, 120, 180, 240, 300].map(h => (
            <span key={h} style={{
              position: 'absolute', left: '50%', top: '50%', width: 4, height: 4, marginLeft: -2, marginTop: -2,
              borderRadius: '50%', background: '#10b981', '--hoek': `${h}deg`,
              animation: 'arcVinkVonk 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }} />
          ))}
        </span>
      )}
      <span key={`ic-${vier}`} style={{ display: 'flex', animation: bezigMetVieren && gedaan ? 'arcVinkPop 0.45s cubic-bezier(0.3, 1.4, 0.5, 1)' : 'none' }}>
        <Icoon size={18} strokeWidth={2.8} />
      </span>
    </button>
  )
}

// Eén regel in de lijst. Vaste structuur: de tijd helemaal links in een
// vaste kolom, dan foto of icoon, de naam, en rechts hooguit één actie.
// Elke regel even hoog, met een dunne lijn ertussen. Loopt het blok nu, dan
// is de tijd vol wit en staat er een stipje voor; de rest is zachter.
// Maaltijd en training: tik op de regel opent.
const REGEL_HOOGTE = 54
function LijstRegel({ blok, isMobile, onOpen, afgerond, onAfronden, onTijd, bezig, slaap = null, wegen = null }) {
  const isMaaltijd = blok.type === 'meal'
  const isTraining = blok.type === 'training'
  const Icoon = ICOON[blok.type] || Calendar
  const soort = isMaaltijd ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || '')
  const naam = blok.sublabel || (isMaaltijd ? null : blok.label)
  const foto = isMaaltijd
    ? (resolveFoodImage({ image_url: blok.meta?.image_url, name: naam }) || foodImageFallback(naam, blok.meta?.slot, 200))
    : isTraining ? workoutFoto(naam || soort)
    : null
  const opent = onOpen && (isMaaltijd || isTraining)
  const fotoMaat = 58

  return (
    <div
      onClick={opent ? () => onOpen(blok) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        height: REGEL_HOOGTE, boxSizing: 'border-box',
        borderBottom: `1px solid ${LIJN_ZACHT}`,
        cursor: opent ? 'pointer' : 'default',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Tijd: vaste kolom helemaal links. Tikken verzet hem. */}
      <button
        onClick={(e) => { e.stopPropagation(); onTijd?.() }}
        disabled={!onTijd}
        title={onTijd ? 'Tijd aanpassen' : undefined}
        style={{
          flexShrink: 0, width: 42, padding: 0, textAlign: 'left',
          background: 'transparent', border: 'none', fontFamily: 'inherit',
          cursor: onTijd ? 'pointer' : 'default',
          fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: bezig ? '#fff' : 'rgba(255,255,255,0.55)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {tijd(blok.type === 'sleep' && blok.meta?.wrapHalf === 'early' ? blok.end : blok.start)}
      </button>

      {/* De foto vult de regel van lijn tot lijn: geen ronde hoeken, geen
          marge boven of onder. Regels zonder foto houden dezelfde breedte vrij,
          zodat de namen recht onder elkaar staan. */}
      <div style={{ flex: 1, minWidth: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, opacity: afgerond ? 0.45 : 1 }}>
        {foto ? (
          <span style={{
            width: fotoMaat, alignSelf: 'stretch', flexShrink: 0,
            background: `url(${foto}) center/cover`,
          }} />
        ) : (
          <span style={{ width: fotoMaat, alignSelf: 'stretch', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icoon size={15} color="rgba(255,255,255,0.45)" strokeWidth={2.4} />
          </span>
        )}
        {bezig && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
        <span style={{
          minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.015em',
        }}>
          {naam || soort}
        </span>
        {wegen?.gelogd != null && (
          <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
            {nl1(wegen.gelogd)} kg
          </span>
        )}
        {slaap?.gelogd?.uren != null && (
          <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
            {nl1(slaap.gelogd.uren)}u{slaap.gelogd.kwaliteit != null ? ` · ${slaap.gelogd.kwaliteit}` : ''}
          </span>
        )}
      </div>

      {/* Hooguit één actie, voor alles dezelfde vorm: een kaal icoon in een
          vast vak. Grijs = nog te doen, groen vinkje = gedaan. Maaltijd:
          vinkje. Training: play. Slaap: maantje, na loggen een groen vinkje
          (de uren staan dan zacht achter de naam). */}
      <div style={{ flexShrink: 0, width: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {wegen?.kan ? (
          <ActieKnop
            gedaan={wegen.gelogd != null}
            titel={wegen.gelogd != null ? 'Weging bijwerken' : 'Gewicht loggen'}
            onClick={wegen.onLog}
            icoon={wegen.gelogd != null ? Check : Scale}
          />
        ) : slaap?.kan ? (
          <ActieKnop
            gedaan={!!slaap.gelogd}
            titel={slaap.gelogd ? 'Slaap bijwerken' : 'Slaap loggen'}
            onClick={slaap.onLog}
            icoon={slaap.gelogd ? Check : Moon}
          />
        ) : onAfronden ? (
          <ActieKnop
            gedaan={afgerond}
            titel={afgerond ? 'Toch niet gegeten' : 'Afronden'}
            onClick={onAfronden}
            icoon={Check}
          />
        ) : isTraining && onOpen ? (
          <ActieKnop gedaan={false} titel="Open je schema" onClick={() => onOpen(blok)} icoon={Play} />
        ) : null}
      </div>
    </div>
  )
}

const kaartKnop = {
  width: 22, height: 22, padding: 0, flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const tijdStempel = {
  flexShrink: 0, fontSize: '0.58rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums',
}

// Kale iconen: een vakje eromheen maakte er drie knoppen van naast een kop
// die zelf al een kop is.
const pijlKnop = {
  width: 30, height: 30, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
