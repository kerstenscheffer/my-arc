// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WorkoutColumn.jsx
// Training drill-down: Sessions → Exercises → Progress
// Props: { workoutData, exerciseProgress, isMobile, onNavigateWorkout, client, onClose }
// ============================================
import React, { useState, useMemo, useEffect } from 'react'
import { Dumbbell, TrendingDown, TrendingUp, ChevronRight, ArrowLeft, ExternalLink, BarChart3, MessageSquare, Zap, ThumbsUp, Moon, Thermometer, ArrowLeftRight, Plus, Trash2, SkipForward, Footprints, Layers, HeartPulse, History, Sparkles } from 'lucide-react'
import WorkoutOverviewChart from './WorkoutOverviewChart'
import CardioInsightBlock from './CardioInsightBlock'
import StappenInsight from './StappenInsight'
import TrainingWeekInzicht from './TrainingWeekInzicht'
import { leesFeedbackVanDag, GEVOEL, spierWoord } from '../../../workout/bouwfase/bouwfaseData'
import { rirLabel, POMP, WERKDRUK, spierpijnVan } from '../../../workout/bouwfase/rir'
import { spierVan } from '../../../manual-workout-builder/spierGroepen'
import ExerciseProgressChart from '../../../workout/components/todays-workout/components/ExerciseProgressChart'
import { workoutFoto } from '../../../../client/components/workoutFoto'
import useOefeningFotos from '../../../workout/utils/useOefeningFotos'
// Hetzelfde krachtblad als de klant op zijn workout-pagina opent: per
// oefening de stand op 8 reps tegen de band van de fase, met grafiek.
import KrachtBlad from '../../../workout/components/KrachtBlad'
import { KolomKopInhoud } from './KolomKop'
import { kopKnopStijl, kopInfoStijl } from './kolomKopStijl'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import KlantPlanTerugzetten from './KlantPlanTerugzetten'
import InklapKop, { useInklap } from './InklapKop'
import BouwfaseInzicht from './BouwfaseInzicht'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }
// Wanneer de klant de training opsloeg (completed_at wordt bij het opslaan
// gezet), in lokale tijd. Met de duur erbij als die gemeten is.
const logTijd = (w) => {
  if (!w?.completed_at) return null
  const t = new Date(w.completed_at)
  if (Number.isNaN(t.getTime())) return null
  return t.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

// Hoe lang duurde de training? De sessie ontstaat bij de eerste gelogde
// oefening en elke oefening krijgt een eigen rij met tijdstip, dus van de
// sessie tot de laatste oefening is de echte duur (zonder die laatste
// oefening zelf). De timer in de app (duration_minutes) gebruikt maar een
// kwart van de klanten en blijft vaak doorlopen (153 min bij 55 min
// loggen), dus die is alleen de terugval als alles in één keer is ingevuld.
function useSessieDuur(db, sessie) {
  const [laatste, setLaatste] = useState(null)
  useEffect(() => {
    let weg = false
    setLaatste(null)
    if (!sessie?.id || !db?.supabase) return undefined
    db.supabase.from('workout_progress').select('created_at').eq('session_id', sessie.id)
      .then(({ data }) => {
        if (weg) return
        const max = (data || []).reduce((m, r) => Math.max(m, new Date(r.created_at).getTime() || 0), 0)
        setLaatste(max || null)
      }, () => {})
    return () => { weg = true }
  }, [db, sessie?.id])

  const start = sessie?.completed_at ? new Date(sessie.completed_at).getTime() : null
  const timer = Number(sessie?.duration_minutes) > 0 ? Number(sessie.duration_minutes) : null
  const spreiding = start && laatste ? Math.round((laatste - start) / 60000) : null
  const minuten = spreiding != null && spreiding >= 5 ? spreiding : timer
  const tijd = (ms) => new Date(ms).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return {
    van: start ? tijd(start) : null,
    tot: spreiding != null && spreiding >= 5 ? tijd(laatste) : null,
    minuten,
  }
}

const minTekst = (m) => (m >= 60 ? `${Math.floor(m / 60)}u ${String(m % 60).padStart(2, '0')}` : `${m} min`)
const WEEKDAG_NL = { monday: 'maandag', tuesday: 'dinsdag', wednesday: 'woensdag', thursday: 'donderdag', friday: 'vrijdag', saturday: 'zaterdag', sunday: 'zondag' }

// Mirror of the feelings list in LogModal — client picks one of these +
// optional free-text note. They get stored together in workout_sessions.notes
// as "feeling|note" (separator-delimited).
const FEELINGS_MAP = {
  sterk:   { icon: Zap,           label: 'Sterk',   color: '#10b981' },
  normaal: { icon: ThumbsUp,      label: 'Normaal', color: '#fff' },
  moe:     { icon: Moon,          label: 'Moe',     color: '#f59e0b' },
  zwak:    { icon: TrendingDown,  label: 'Zwak',    color: '#f97316' },
  ziek:    { icon: Thermometer,   label: 'Ziek',    color: '#ef4444' },
}

const parseSessionNote = (raw) => {
  if (!raw || typeof raw !== 'string') return { feeling: null, note: null }
  const idx = raw.indexOf('|')
  if (idx === -1) return { feeling: null, note: raw.trim() || null }
  const feeling = raw.slice(0, idx).trim()
  const note    = raw.slice(idx + 1).trim()
  return {
    feeling: FEELINGS_MAP[feeling] ? feeling : null,
    note: note || null,
  }
}

// Eén set als cijferpaar, zelfde vorm als de macro's op de maaltijdkaart:
// dik getal, klein grijs label.
const SetDisplay = ({ s }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, whiteSpace: 'nowrap' }}>
    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>
      {s.weight || 0}<span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>kg</span>×{s.reps || 0}
    </span>
    {s.partials ? <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>+{s.partials}p</span> : null}
    {s.dropsets?.length > 0 ? s.dropsets.map((ds, di) => <span key={di} style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>D{ds.weight}×{ds.reps}</span>) : null}
  </span>
)

// Kaartstijl van de workout-pagina van de klant.
const KAART = {
  margin: '0 0.9rem 0.45rem',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 12, overflow: 'hidden', position: 'relative',
}
const SECTIEKOP = { padding: '0.3rem 0.9rem 0.45rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }

// Wat de klant zelf aan zijn plan veranderde (client_plan_changes): wissels,
// toevoegingen, weghalen, overslaan. Met "door klant" erbij, zodat je ziet dat
// het niet jouw plan meer is zoals jij het maakte (Kersten, 13 okt 2026).
const SOORT = {
  wissel_week: { icoon: ArrowLeftRight, tekst: (r) => `${r.was || '?'} → ${r.oefening || '?'}`, sub: 'gewisseld voor deze week' },
  wissel_dag: { icoon: ArrowLeftRight, tekst: (r) => `${r.was || '?'} → ${r.oefening || '?'}`, sub: 'gewisseld voor één dag' },
  wissel_permanent: { icoon: ArrowLeftRight, tekst: (r) => `${r.was || '?'} → ${r.oefening || '?'}`, sub: 'permanent gewisseld' },
  toegevoegd: { icoon: Plus, tekst: (r) => r.oefening || 'Oefening', sub: 'permanent in plan gezet' },
  toegevoegd_week: { icoon: Plus, tekst: (r) => r.oefening || 'Oefening', sub: 'toegevoegd' },
  verwijderd: { icoon: Trash2, tekst: (r) => r.oefening || 'Oefening', sub: 'uit plan gehaald' },
  overgeslagen: { icoon: SkipForward, tekst: (r) => r.oefening || 'Oefening', sub: 'overgeslagen deze week' },
}

function PlanWijzigingen({ db, client, isMobile, altijdOpen = false }) {
  const [rijen, setRijen] = useState([])
  const [alles, setAlles] = useState(false)
  const [openKeuze, wissel] = useInklap('plan_wijzigingen')
  const open = altijdOpen || openKeuze
  useEffect(() => {
    if (!client?.id || !db?.supabase) { setRijen([]); return }
    db.supabase.from('client_plan_changes')
      .select('id, day_key, dag_naam, soort, oefening, was, door, reden, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => setRijen(data || []), () => setRijen([]))
  }, [client?.id, db])
  if (!rijen.length) return null
  const zichtbaar = alles ? rijen : rijen.slice(0, 5)
  return (
    <div style={{ marginBottom: '0.4rem' }}>
      {!altijdOpen && <InklapKop titel="Aangepast in plan" aantal={rijen.length} open={open} onWissel={wissel} />}
      {open && zichtbaar.map(r => {
        const m = SOORT[r.soort] || SOORT.toegevoegd
        const Icoon = m.icoon
        const datum = new Date(r.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '0.45rem 0.9rem' : '0.5rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <Icoon size={14} strokeWidth={2.6} color="#fff" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.tekst(r)}</div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.reden && <b style={{ color: '#fff', fontWeight: 900 }}>{r.reden} · </b>}{m.sub}{r.dag_naam ? ` · ${r.dag_naam}` : ''} · {datum}
              </div>
            </div>
            <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 900, color: r.door === 'coach' ? 'rgba(255,255,255,0.5)' : '#fff', border: `1px solid ${r.door === 'coach' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)'}`, borderRadius: 999, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              door {r.door === 'coach' ? 'coach' : 'klant'}
            </span>
          </div>
        )
      })}
      {open && rijen.length > 5 && (
        <button onClick={() => setAlles(v => !v)} style={{ background: 'none', border: 'none', padding: '0.4rem 0.9rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          {alles ? 'Minder tonen' : `Alle ${rijen.length} tonen`}
        </button>
      )}
    </div>
  )
}

// alleenSessies: alleen de gelogde sessies (pop-up in de workout-builder).
export default function WorkoutColumn({ db, workoutData, exerciseProgress = {}, isMobile, onNavigateWorkout, client, onClose, alleenSessies = false, voeding = null }) {
  const [view, setView] = useState('sessions')
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [swappedExercises, setSwappedExercises] = useState([])
  const [krachtOpen, setKrachtOpen] = useState(false)
  // Spiergroep per oefening uit het plan, om herstelantwoorden bij de juiste kaart te zetten.
  const spierPerOefening = useMemo(() => {
    const uit = {}
    Object.values(workoutData?.schema?.week_structure || {}).forEach(dag => {
      (Array.isArray(dag?.exercises) ? dag.exercises : []).forEach(e => {
        const g = e?.name ? spierVan(e) : null
        if (g && g !== 'onbekend') uit[String(e.name).trim().toLowerCase()] = g
      })
    })
    return uit
  }, [workoutData?.schema?.week_structure])
  // Bijzaken achter een icoon in de kop (13 nov 2026, Kersten): 'stappen' |
  // 'bouwfase' | 'cardio' | 'aangepast' | null. In beeld blijven de week en de sessies.
  const [venster, setVenster] = useState(null)
  const workouts = workoutData?.workouts || []

  // Wissels van de klant in dít plan. Eerder telde dit alle overrides van
  // de klant ooit, over alle plannen en weken heen, en stond het als los
  // tekstblok boven de sessies: niet te herleiden tot een training. Nu
  // hangt elke wissel aan plan + dag + week, zodat de kaart van die
  // training een stip krijgt en de oefening erin "was: X" (8 okt 2026).
  useEffect(() => {
    if (!client?.id || !db?.supabase) { setSwappedExercises([]); return }
    const schemaId = workoutData?.schema?.id
    let q = db.supabase
      .from('client_exercise_overrides')
      .select('schema_id, week_start, day_key, exercise_index, exercise_data, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (schemaId) q = q.eq('schema_id', schemaId)
    q.then(({ data }) => {
      const swaps = (data || []).filter(r => r.exercise_data?._originalName && r.exercise_data.name !== r.exercise_data._originalName)
      setSwappedExercises(swaps)
    }, () => setSwappedExercises([]))
  }, [client?.id, workoutData?.schema?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Concept-trainingsplan uit de intake (edge function workout-bouwer). Staat
  // los van de plannen van de klant tot de coach het goedkeurt.
  const [concept, setConcept] = useState(null)
  const [conceptBezig, setConceptBezig] = useState(false)
  useEffect(() => {
    setConcept(null)
    if (!client?.id || !db?.supabase) return
    let leeft = true
    db.supabase.from('workout_schemas').select('id, name, generation_options')
      .is('client_id', null).eq('generation_options->>concept_voor', client.id).eq('generation_options->>status', 'concept')
      .order('created_at', { ascending: false }).limit(1)
      .then(r => { if (leeft) setConcept(r?.data?.[0] || null) }, () => null)
    return () => { leeft = false }
  }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const openConcept = (id) => {
    try { sessionStorage.setItem('myarc_open_schema', JSON.stringify({ clientId: client.id, schemaId: id })) } catch { /* de builder opent dan het actieve plan */ }
    onNavigateWorkout?.(client.id, id)
    // Stond de builder al open op deze klant, dan wisselt er niets: zelf seinen.
    setTimeout(() => window.dispatchEvent(new CustomEvent('myarc:open-schema', { detail: { clientId: client.id, schemaId: id } })), 300)
    if (onClose) onClose()
  }
  const maakConcept = async () => {
    if (conceptBezig || !client?.id) return
    setConceptBezig(true)
    try {
      const { data, error } = await db.supabase.functions.invoke('workout-bouwer', { body: { client_id: client.id } })
      if (error || data?.error || !data?.schema_id) throw new Error(data?.error || data?.overgeslagen || error?.message || 'mislukt')
      openConcept(data.schema_id)
    } catch (e) { alert('Concept maken mislukt: ' + (e?.message || e)) }
    finally { setConceptBezig(false) }
  }

  // Maandag van een datum, als JJJJ-MM-DD: de week waar een override bij hoort.
  const maandagVan = (datum) => {
    const d = new Date(`${String(datum).slice(0, 10)}T12:00:00`)
    if (Number.isNaN(d.getTime())) return null
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Per-session count of exercise-level notes (from workout_progress.notes).
  // Lets us show a "💬 3" indicator on session rows without drilling in.
  const exerciseNotesBySession = useMemo(() => {
    const counts = {}
    Object.values(exerciseProgress).forEach(entries => {
      entries.forEach(e => {
        if (e.notes && e.sessionId) {
          counts[e.sessionId] = (counts[e.sessionId] || 0) + 1
        }
      })
    })
    return counts
  }, [exerciseProgress])

  // Naam van de training (Push, Full body) voor een sessie. De sessie zelf
  // bewaart alleen de weekdag; exercises_completed is vaak leeg omdat de
  // oefeningen als losse voortgangslogs binnenkomen (exerciseProgress).
  // Daarom hier, en niet in de service. Drie aanwijzingen, in volgorde:
  //   1. overlap tussen de gelogde oefeningen en de dagen van het schema;
  //   2. heeft het schema overal dezelfde naam (2× "Full body"), dan die;
  //   3. het weekrooster van de klant (Monday → dag1).
  const schemaDagen = useMemo(() => {
    const ws = workoutData?.schema?.week_structure
    if (!ws || typeof ws !== 'object') return []
    return Object.entries(ws)
      .filter(([, d]) => d && typeof d === 'object')
      .map(([key, d]) => ({
        key, naam: String(d.name || d.focus || '').trim(),
        lijst: Array.isArray(d.exercises) ? d.exercises : [],
        oefeningen: new Set((Array.isArray(d.exercises) ? d.exercises : []).map(e => String(e?.name || '').trim().toLowerCase()).filter(Boolean)),
      }))
  }, [workoutData?.schema])
  // De dag van het plan die bij een sessie hoort (zelfde drie aanwijzingen
  // als naamVoorSessie hieronder; die geeft alleen de naam terug).
  const dagVoorSessie = (w) => {
    if (schemaDagen.length === 0) return null
    const gelogd = new Set([
      ...Object.entries(exerciseProgress).filter(([, entries]) => entries.some(e => e.sessionId === w.id)).map(([n]) => n),
      ...(Array.isArray(w.exercises_completed) ? w.exercises_completed.map(e => e?.name) : []),
    ].map(n => String(n || '').trim().toLowerCase()).filter(Boolean))
    let beste = null, besteScore = 0
    schemaDagen.forEach(d => {
      let gedeeld = 0
      gelogd.forEach(n => { if (d.oefeningen.has(n)) gedeeld++ })
      if (gedeeld > besteScore) { besteScore = gedeeld; beste = d }
    })
    if (beste && (besteScore >= 2 || besteScore / Math.max(1, gelogd.size) >= 0.5)) return beste
    const schedule = workoutData?.schedule
    if (schedule && w.day_name) {
      const sleutel = Object.keys(schedule).find(k => k.toLowerCase() === String(w.day_name).toLowerCase())
      const dag = sleutel ? schemaDagen.find(d => d.key === schedule[sleutel]) : null
      if (dag) return dag
    }
    if ((w.workout_naam || '').trim()) {
      const opNaam = schemaDagen.find(d => d.naam.toLowerCase() === w.workout_naam.trim().toLowerCase())
      if (opNaam) return opNaam
    }
    return beste
  }
  // Wissels die bij deze sessie horen: de weekoverrides van die dag in de
  // week van de sessie, plus permanente wissels in het plan van vóór de
  // sessie. Geeft { nieuweNaam(lowercase) -> origineleNaam }.
  const wisselsVoorSessie = (w) => {
    const dag = dagVoorSessie(w)
    if (!dag) return {}
    const uit = {}
    const week = maandagVan(w.workout_date)
    swappedExercises.forEach(r => {
      // 'dag1@thursday' is een wissel voor één dag van training dag1.
      if (String(r.day_key).split('@')[0] !== dag.key) return
      if (week && r.week_start && String(r.week_start).slice(0, 10) !== week) return
      uit[String(r.exercise_data.name || '').trim().toLowerCase()] = r.exercise_data._originalName
    })
    dag.lijst.forEach(e => {
      if (!e?._originalName || e._originalName === e.name) return
      if (e._swappedAt && w.workout_date && String(e._swappedAt).slice(0, 10) > String(w.workout_date).slice(0, 10)) return
      uit[String(e.name || '').trim().toLowerCase()] = e._originalName
    })
    return uit
  }
  const naamVoorSessie = (w) => {
    const bewaard = (w.workout_naam || '').trim()
    if (schemaDagen.length === 0) return bewaard || null
    const gelogd = new Set([
      ...Object.entries(exerciseProgress).filter(([, entries]) => entries.some(e => e.sessionId === w.id)).map(([n]) => n),
      ...(Array.isArray(w.exercises_completed) ? w.exercises_completed.map(e => e?.name) : []),
    ].map(n => String(n || '').trim().toLowerCase()).filter(Boolean))
    const score = (d) => { let g = 0; gelogd.forEach(n => { if (d.oefeningen.has(n)) g++ }); return g }
    let beste = null, besteScore = 0
    schemaDagen.forEach(d => {
      const gedeeld = score(d)
      if (gedeeld > besteScore) { besteScore = gedeeld; beste = d }
    })
    const sterk = beste?.naam && (besteScore >= 2 || besteScore / Math.max(1, gelogd.size) >= 0.5)
    if (bewaard) {
      // De app noemt een sessie naar het rooster van die weekdag, niet naar
      // wat er getraind is. Elijah deed op woensdag zijn Pull-dag en de sessie
      // heette "Legs" (5 nov 2026). Is de bewaarde naam een dag uit dit plan
      // en past een andere dag beter bij de gelogde oefeningen, dan wint die.
      // Een naam uit een ander (oud) plan blijft staan.
      const bewaardeDag = schemaDagen.find(d => d.naam.toLowerCase() === bewaard.toLowerCase())
      // Zelfde regel als corrigeerSessieNaam in de app: alleen omzetten als
      // minder dan de helft van de oefeningen uit de bewaarde dag komt.
      if (sterk && bewaardeDag && score(bewaardeDag) * 2 < gelogd.size && besteScore > score(bewaardeDag)) return beste.naam
      return bewaard
    }
    if (sterk) return beste.naam
    const namen = [...new Set(schemaDagen.map(d => d.naam).filter(Boolean))]
    if (namen.length === 1) return namen[0]
    const schedule = workoutData?.schedule
    if (schedule && w.day_name) {
      const sleutel = Object.keys(schedule).find(k => k.toLowerCase() === String(w.day_name).toLowerCase())
      const dag = sleutel ? schemaDagen.find(d => d.key === schedule[sleutel]) : null
      if (dag?.naam) return dag.naam
    }
    return beste?.naam || null
  }

  const getSessionExercises = () => {
    if (!selectedSession) return []
    const exercises = []
    Object.entries(exerciseProgress).forEach(([name, entries]) => {
      const match = entries.find(e => e.sessionId === selectedSession.id)
      if (match) exercises.push({ name, ...match })
    })
    if (exercises.length === 0 && selectedSession.exercises_completed) {
      return selectedSession.exercises_completed.map(e => ({ name: e.name, sets: [], bestWeight: 0, bestReps: 0, totalSets: e.sets || 0 }))
    }
    return exercises.sort((a, b) => String(a.gelogdOp || '').localeCompare(String(b.gelogdOp || '')))
  }

  const getExerciseHistory = () => {
    if (!selectedExercise) return []
    return (exerciseProgress[selectedExercise] || []).sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // ── OVERVIEW (multi-exercise chart) ──
  if (view === 'overview') {
    return (
      <WorkoutOverviewChart
        db={db}
        client={client}
        exerciseProgress={exerciseProgress}
        isMobile={isMobile}
        onBack={() => setView('sessions')}
      />
    )
  }

  // ── SESSIONS ──
  // In Coach Inzicht blijft dit scherm staan; een sessie opent in een pop-up
  // eroverheen (13 nov 2026, Kersten). Alleen de sessie-pop-up van de workout-
  // builder (alleenSessies) wisselt nog het hele vlak.
  if (view === 'sessions' || !alleenSessies) {
    const sluitDetail = () => { setView('sessions'); setSelectedSession(null); setSelectedExercise(null) }
    const detail = alleenSessies ? null
      : view === 'exercises' && selectedSession ? (
        <SessieOefeningen
          db={db} isMobile={isMobile} selectedSession={selectedSession}
          exs={getSessionExercises()}
          onBack={sluitDetail}
          onKies={(naam) => { setSelectedExercise(naam); setView('progress') }}
        />
      ) : view === 'progress' && selectedExercise ? (
        <ProgressView db={db} client={client} isMobile={isMobile} selectedExercise={selectedExercise} entries={getExerciseHistory()} onBack={() => setView(selectedSession ? 'exercises' : 'sessions')} />
      ) : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* In de kolomkop: plan, voortgang en knoppen (zie KolomKop). */}
        {/* Gecombineerde week: geen kopbalk; dezelfde knoppen zitten dan in de week zelf. */}
        {!alleenSessies && !voeding && <KolomKopInhoud>
          <span title={workoutData?.schema ? `${workoutData.schema.name || 'Workout Plan'} · ${workoutData.schema.days_per_week || '-'}d/week · ${workoutData.schema.experience_level || '-'}` : 'Geen schema'}
            style={{ ...kopInfoStijl, flex: 1 }}>
            {workoutData?.schema ? (
              <>
                <span style={{ color: '#fff', fontWeight: 800 }}>{workoutData.schema.name || 'Workout Plan'}</span>
                {' · '}{workoutData.schema.days_per_week || '-'}d/wk · {workoutData.schema.experience_level || '-'}
              </>
            ) : 'Geen schema'}
          </span>
          {workoutData?.totalWorkouts > 0 && (
            <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{workoutData.completedWorkouts}/{workoutData.totalWorkouts}</span>
          )}
          {[
            ['stappen', 'Stappendoel', Footprints],
            ['bouwfase', 'Bouwfase en herstel per spiergroep', Layers],
            ['cardio', 'Cardio die de klant logde', HeartPulse],
            ['aangepast', 'Door de klant aangepast in het plan', History],
          ].map(([id, titel, Icoon]) => (
            <button key={id} onClick={() => setVenster(id)} title={titel} aria-label={titel}
              style={{ ...kopKnopStijl, width: 28, padding: 0, justifyContent: 'center' }}>
              {React.createElement(Icoon, { size: 15 })}
            </button>
          ))}
          <button
            onClick={() => setKrachtOpen(true)}
            title="Kracht: per oefening de stand tegen de band van de fase, zoals de klant het ziet"
            style={kopKnopStijl}
          >
            <BarChart3 size={12} /> Kracht
          </button>
          {onNavigateWorkout && client?.id && (
            <button onClick={() => (concept ? openConcept(concept.id) : maakConcept())} disabled={conceptBezig}
              title={concept ? 'Conceptplan uit de intake openen in de builder, met de brief erbij' : 'Conceptplan laten maken uit de intake'}
              style={{ ...kopKnopStijl, ...(concept ? { color: '#10b981', borderColor: 'rgba(16,185,129,0.5)' } : {}) }}>
              <Sparkles size={11} /> {conceptBezig ? 'Bezig…' : concept ? 'Concept klaar' : 'Maak concept'}
            </button>
          )}
          {onNavigateWorkout && (
            <button onClick={() => { onNavigateWorkout(client?.id, workoutData?.schema?.id || null); if (onClose) onClose() }}
              title={workoutData?.schema ? 'Plan openen in de builder' : 'Nieuw plan maken'} style={kopKnopStijl}>
              <ExternalLink size={11} /> {workoutData?.schema ? 'Plan' : 'Nieuw plan'}
            </button>
          )}
        </KolomKopInhoud>}
        {/* Modal boven het inzichtpaneel; zIndex hoger dan dat paneel. */}
        <BladModal open={krachtOpen} titel="Kracht" onClose={() => setKrachtOpen(false)} zIndex={12000}>
          <KrachtBlad db={db} client={client} isMobile={isMobile} />
        </BladModal>

        {/* De vensters achter de iconen in de kop. Een blok dat niets te
            tonen heeft geeft niets terug; dan zegt het venster dat zelf. */}
        <style>{`.ci-venster:empty::after{content:'Nog niets om te tonen.';display:block;padding:1.5rem 1rem;font-size:0.82rem;font-weight:700;color:rgba(255,255,255,0.45)}`}</style>
        <BladModal open={venster === 'stappen'} titel="Stappendoel" onClose={() => setVenster(null)} zIndex={12000}>
          <div className="ci-venster"><StappenInsight db={db} client={client} isMobile={isMobile} alleenDoel /></div>
        </BladModal>
        <BladModal open={venster === 'bouwfase'} titel="Bouwfase" onClose={() => setVenster(null)} zIndex={12000}>
          <div className="ci-venster"><BouwfaseInzicht db={db} client={client} isMobile={isMobile} altijdOpen /></div>
        </BladModal>
        <BladModal open={venster === 'cardio'} titel="Cardio" onClose={() => setVenster(null)} zIndex={12000}>
          <div className="ci-venster"><CardioInsightBlock db={db} client={client} isMobile={isMobile} /></div>
        </BladModal>
        <BladModal open={venster === 'aangepast'} titel="Aangepast door klant" onClose={() => setVenster(null)} zIndex={12000}>
          {/* Wat de klant zelf veranderde, en de blijvende wijzigingen met terugzetten. */}
          <div className="ci-venster"><PlanWijzigingen db={db} client={client} isMobile={isMobile} altijdOpen /><KlantPlanTerugzetten db={db} client={client} soort="workout" isMobile={isMobile} altijdOpen /></div>
        </BladModal>

        <div style={voeding ? { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' } : { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* De agenda van de klant zoals hij die zelf ziet: trainingen, cardio
              en stappen per dag, met pijlen naar eerdere weken. */}
          {!alleenSessies && <>
          {/* Eigen coach-weergave, los van het rooster op de klantpagina. */}
          <TrainingWeekInzicht
            client={client} db={db} isMobile={isMobile}
            voeding={voeding}
            acties={{
              stappen: () => setVenster('stappen'),
              bouwfase: () => setVenster('bouwfase'),
              cardio: () => setVenster('cardio'),
              aangepast: () => setVenster('aangepast'),
              kracht: () => setKrachtOpen(true),
              plan: onNavigateWorkout ? () => { onNavigateWorkout(client?.id, workoutData?.schema?.id || null); if (onClose) onClose() } : null,
              planNaam: workoutData?.schema?.name || null,
              voortgang: workoutData?.totalWorkouts > 0 ? `${workoutData.completedWorkouts}/${workoutData.totalWorkouts}` : null,
            }}
            workouts={workouts}
            naamVoorSessie={naamVoorSessie}
            tijdVan={logTijd}
            toonSessie={(w) => {
              const sessie = { ...w, client_id: w.client_id || client?.id || null, workout_naam: naamVoorSessie(w) || w.workout_naam || null, _wissels: wisselsVoorSessie(w) }
              const exs = []
              Object.entries(exerciseProgress).forEach(([name, entries]) => {
                const match = entries.find(e => e.sessionId === w.id)
                if (match) exs.push({ name, ...match })
              })
              // In de volgorde waarin de klant ze logde (eerste set van elke oefening).
              exs.sort((a, b) => String(a.gelogdOp || '').localeCompare(String(b.gelogdOp || '')))
              const lijst = exs.length === 0 && Array.isArray(w.exercises_completed)
                ? w.exercises_completed.map(e => ({ name: e.name, sets: [], bestWeight: 0, bestReps: 0, totalSets: e.sets || 0 }))
                : exs
              return (
                <SessieOefeningen ingebed db={db} isMobile={isMobile} selectedSession={sessie} exs={lijst}
                  historie={(naam) => exerciseProgress[naam] || []}
                  spierVanNaam={(naam) => spierPerOefening[String(naam || '').trim().toLowerCase()] || null}
                  onBack={() => {}}
                  onKies={(naam) => { setSelectedSession(sessie); setSelectedExercise(naam); setView('progress') }} />
              )
            }}
            sessieTelling={(w) => {
              const eigen = Object.values(exerciseProgress).map(entries => entries.find(e => e.sessionId === w.id)).filter(Boolean)
              const parsed = parseSessionNote(w.notes)
              return {
                oefeningen: eigen.length || (Array.isArray(w.exercises_completed) ? w.exercises_completed.length : 0),
                sets: eigen.reduce((t, e) => t + ((Array.isArray(e.sets) ? e.sets.length : 0) || Number(e.totalSets) || 0), 0),
                notities: (exerciseNotesBySession[w.id] || 0) + (parsed.note ? 1 : 0),
                wissels: Object.keys(wisselsVoorSessie(w)).length,
              }
            }}
          />
          </>}
          {alleenSessies && workouts.length > 0 && <div style={{ ...SECTIEKOP, paddingTop: '0.6rem' }}>Sessies</div>}
          {!alleenSessies ? null : workouts.length > 0 ? workouts.slice(0, 60).map((w, idx) => {
            const parsed = parseSessionNote(w.notes)
            const feelingCfg = parsed.feeling ? FEELINGS_MAP[parsed.feeling] : null
            const FeelingIcon = feelingCfg?.icon
            const exerciseNotesCount = exerciseNotesBySession[w.id] || 0
            const aantalOef = Object.values(exerciseProgress).filter(entries => entries.some(e => e.sessionId === w.id)).length
              || (Array.isArray(w.exercises_completed) ? w.exercises_completed.length : 0)
            // Naam van de training uit het schema (Push, Legs); zonder match
            // de weekdag in het Nederlands.
            const weekdag = WEEKDAG_NL[String(w.day_name || '').toLowerCase()] || w.day_name || ''
            const trainingNaam = naamVoorSessie(w)
            const naam = trainingNaam || weekdag || 'Training'
            const hoogte = isMobile ? 74 : 82
            const wissels = wisselsVoorSessie(w)
            const aantalWissels = Object.keys(wissels).length
            return (
              <button
                key={`${w.workout_date}-${idx}`}
                onClick={() => { setSelectedSession({ ...w, workout_naam: trainingNaam || w.workout_naam || null, _wissels: wissels }); setView('exercises') }}
                style={{
                  ...KAART, display: 'block', width: 'calc(100% - 1.8rem)', height: hoogte,
                  padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Foto als achtergrond met donker verloop, zoals de trainingskaart van de klant. */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${workoutFoto(naam)})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: w.is_completed ? 0.85 : 1,
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.85) 100%)',
                }} />
                {/* Oranje stip rechtsboven: in deze training is een oefening
                    gewisseld. Welke, staat in het detail bij de oefening. */}
                {aantalWissels > 0 && (
                  <span title={`${aantalWissels} oefening${aantalWissels === 1 ? '' : 'en'} gewisseld`} style={{
                    position: 'absolute', top: 7, right: 7, zIndex: 2,
                    minWidth: 14, height: 14, padding: '0 4px', borderRadius: 999,
                    background: '#f59e0b', border: '2px solid rgba(0,0,0,0.6)', boxSizing: 'content-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.58rem', fontWeight: 900, color: '#000', lineHeight: 1,
                  }}>{aantalWissels > 1 ? aantalWissels : ''}</span>
                )}
                <div style={{
                  position: 'relative', height: '100%',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      flex: 1, minWidth: 0,
                      fontSize: isMobile ? '0.95rem' : '1.02rem', fontWeight: 900, color: '#fff',
                      letterSpacing: '-0.02em', lineHeight: 1.15,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                    }}>
                      {naam}
                    </span>
                    {feelingCfg && (
                      <span title={`Voelde zich ${feelingCfg.label.toLowerCase()}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
                        fontSize: '0.62rem', fontWeight: 900, color: feelingCfg.color,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                      }}>
                        <FeelingIcon size={11} strokeWidth={2.6} />{feelingCfg.label}
                      </span>
                    )}
                    {(parsed.note || exerciseNotesCount > 0) && (
                      <span title={`${exerciseNotesCount + (parsed.note ? 1 : 0)} notitie(s)`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                        <MessageSquare size={11} strokeWidth={2.6} />{exerciseNotesCount + (parsed.note ? 1 : 0)}
                      </span>
                    )}
                    <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                      {formatDate(w.workout_date)}{logTijd(w) ? ` · ${logTijd(w)}` : ''}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 800,
                    color: w.is_completed ? '#22c55e' : 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 2,
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {w.is_completed ? 'Voltooid' : 'Training'}{trainingNaam && weekdag ? ` · ${weekdag}` : ''}{aantalOef > 0 ? ` · ${aantalOef} oefeningen` : ''}
                  </span>
                </div>
              </button>
            )
          }) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Nog geen trainingen gelogd</div>}
        </div>
        {/* De gekozen sessie (en van daaruit de progressie per oefening) als pop-up. */}
        {detail && (
          <div onClick={sluitDetail} style={{
            position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0.5rem' : '1.5rem',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width: '100%', maxWidth: 620, height: isMobile ? '92vh' : '85vh', overflow: 'hidden',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16,
            }}>
              {detail}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── EXERCISES ──
  if (view === 'exercises' && selectedSession) {
    return (
      <SessieOefeningen
        db={db} isMobile={isMobile} selectedSession={selectedSession}
        exs={getSessionExercises()}
        onBack={() => { setView('sessions'); setSelectedSession(null) }}
        onKies={(naam) => { setSelectedExercise(naam); setView('progress') }}
      />
    )
  }

  // ── PROGRESS ──
  if (view === 'progress' && selectedExercise) {
    return <ProgressView db={db} client={client} isMobile={isMobile} selectedExercise={selectedExercise} entries={getExerciseHistory()} onBack={() => setView('exercises')} />
  }
  return null
}

// `ingebed`: alleen de notitie en de oefeningkaarten, zonder kop of eigen
// scrollvlak (voor de kaart Training in Coach Inzicht).
// `historie(naam)`: eerdere sessies van die oefening; dan staat in de kaart een
// kleine tabel met de sets per datum in plaats van alleen deze sessie.
function SessieOefeningen({ db, isMobile, selectedSession, exs, onBack, onKies, ingebed = false, historie = null, spierVanNaam = null }) {
  // De herstel- en gevoelsvragen van die dag (training_feedback), alleen in de
  // ingebedde kaarten: per oefening onder de titel, per spiergroep erboven.
  const [feedback, setFeedback] = useState(null)
  const fbKlant = selectedSession?.client_id || null
  const fbDag = String(selectedSession?.workout_date || '').slice(0, 10)
  useEffect(() => {
    if (!ingebed || !db?.supabase || !fbKlant || !fbDag) return
    let weg = false
    leesFeedbackVanDag(db.supabase, fbKlant, fbDag).then(f => { if (!weg) setFeedback(f) }, () => {})
    return () => { weg = true }
  }, [ingebed, db, fbKlant, fbDag])
  // Bij welke spiergroep hoort een oefening: wat de klant erbij invulde, anders het plan.
  const groepVan = (ex) => feedback?.oefening?.[String(ex?.name || '').trim().toLowerCase()]?.spiergroep || spierVanNaam?.(ex?.name) || null
  const herstelGroepen = feedback ? [...new Set([...Object.keys(feedback.herstel || {}), ...Object.keys(feedback.spier || {})])] : []
  // Eén regel voor een spiergroep: herstel (spierpijn), pomp en werkdruk.
  const herstelRegel = (g) => {
    const KORT = ['geen spierpijn', 'spierpijn al weg', 'spierpijn net op tijd weg', 'nog spierpijn']
    const KLEUR = ['#10b981', '#10b981', '#f59e0b', '#ef4444']
    const sp = spierpijnVan(feedback?.herstel?.[g])
    const sr = feedback?.spier?.[g]
    const pomp = POMP.find(x => x.id === sr?.pomp)?.label
    const druk = WERKDRUK.find(x => x.id === sr?.werkdruk)
    const opm = feedback?.herstel?.[g]?.opmerking || sr?.opmerking
    const naam = spierWoord(g) || g
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.35 }}>
        <b style={{ color: '#fff', fontWeight: 900 }}>{naam.charAt(0).toUpperCase() + naam.slice(1)}</b>
        {sp != null && <span style={{ fontWeight: 900, color: KLEUR[sp] }}> · {KORT[sp]}</span>}
        {pomp && <span> · pomp {pomp.toLowerCase()}</span>}
        {druk && <span style={{ color: druk.id >= 3 ? '#ef4444' : undefined }}> · werkdruk {druk.label.toLowerCase()}</span>}
        {opm && <span style={{ fontStyle: 'italic' }}> · {opm}</span>}
      </span>
    )
  }
  const fotoVan = useOefeningFotos(db, exs.map(e => e.name).filter(Boolean))
  const photoSize = isMobile ? 62 : 72
  const duur = useSessieDuur(db, selectedSession)
  {
    const parsed = parseSessionNote(selectedSession.notes)
    const feelingCfg = parsed.feeling ? FEELINGS_MAP[parsed.feeling] : null
    const FeelingIcon = feelingCfg?.icon
    return (
      <div style={ingebed ? {} : { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: ingebed ? 'none' : 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={onBack} aria-label="Terug" style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, minWidth: 28, minHeight: 28, touchAction: 'manipulation' }}><ArrowLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{(selectedSession.workout_naam || '').trim() || WEEKDAG_NL[String(selectedSession.day_name || '').toLowerCase()] || selectedSession.day_name || 'Training'}</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            {formatDate(selectedSession.workout_date)}
            {duur.van ? ` · ${duur.van}${duur.tot ? `–${duur.tot}` : ''}` : ''}
          </span>
          {duur.minuten > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {minTekst(duur.minuten)}
            </span>
          )}
        </div>

        {/* Client-notitie blok — toon feeling-pill + note tekst zoals de client
            ze invulde in LogModal. Geeft de coach context bij deze sessie. */}
        {(parsed.note || feelingCfg) && (
          <div style={{
            padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: feelingCfg ? `${feelingCfg.color}08` : 'rgba(255,255,255,0.02)',
            ...(ingebed ? { borderRadius: 12, borderBottom: 'none', marginBottom: '0.45rem' } : {}),
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              marginBottom: parsed.note ? '0.35rem' : 0,
            }}>
              <MessageSquare size={11} color="rgba(255,255,255,0.35)" strokeWidth={2.2} />
              <span style={{
                fontSize: '0.72rem', fontWeight: '700',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '-0.01em',
              }}>
                Notitie van client
              </span>
              {feelingCfg && (
                <span style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  padding: '0.15rem 0.4rem',
                  background: `${feelingCfg.color}1a`,
                  border: `1px solid ${feelingCfg.color}55`,
                  borderRadius: '4px',
                  color: feelingCfg.color,
                  fontSize: '0.72rem', fontWeight: '800',
                  letterSpacing: '-0.01em',
                }}>
                  <FeelingIcon size={10} strokeWidth={2.5} />
                  {feelingCfg.label}
                </span>
              )}
            </div>
            {parsed.note && (
              <div style={{
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: '500',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {parsed.note}
              </div>
            )}
          </div>
        )}

        <div style={ingebed ? {} : { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '0.5rem' }}>
          {/* Herstel per spiergroep hoort bij de eerste oefening van die spiergroep
              (zie de kaart). Hier alleen wat bij geen oefening past, en de
              toelichting op de workout; het cijfer staat in de kopregel. */}
          {ingebed && feedback && (() => {
            const rest = herstelGroepen.filter(g => !exs.some(e => groepVan(e) === g))
            const w = feedback.workout
            if (!rest.length && !w?.opmerking) return null
            return (
              <div style={{ margin: '0 0 0.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {w?.opmerking && <div style={{ fontSize: '0.74rem', fontWeight: 700, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>{w.opmerking}</div>}
                {rest.map(g => <div key={g}>{herstelRegel(g)}</div>)}
              </div>
            )
          })()}
          {exs.length > 0 ? exs.map((ex, idx) => (
            <div key={idx} style={{ ...KAART, ...(ingebed ? { margin: '0 0 0.45rem' } : {}), display: 'flex', alignItems: 'stretch' }}>
              {/* Foto links met het nummer linksboven, zoals de oefeningkaart van de klant. */}
              <div style={{ width: photoSize, alignSelf: 'stretch', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: fotoVan(ex.name), backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                <div style={{
                  position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 3,
                  background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                }}>
                  <span style={{ fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{idx + 1}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ex.name}
                  </span>
                  {ex.attachment_used && (
                    <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {String(ex.attachment_used).replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                {/* Herstel van de spiergroep: bij de eerste oefening van die groep. */}
                {ingebed && (() => {
                  const g = groepVan(ex)
                  if (!g || !herstelGroepen.includes(g) || exs.findIndex(e => groepVan(e) === g) !== idx) return null
                  return <div style={{ marginTop: 2 }}>{herstelRegel(g)}</div>
                })()}
                {/* Wat de klant na deze oefening invulde: cijfer, uitvoering, herhalingen over, pomp. */}
                {ingebed && (() => {
                  const f = feedback?.oefening?.[String(ex.name || '').trim().toLowerCase()]
                  if (!f) return null
                  const gevoel = f.gevoel && f.gevoel !== 'goed' ? GEVOEL.find(x => x.id === f.gevoel)?.label : null
                  const pomp = POMP.find(x => x.id === f.pomp)?.label
                  const delen = [
                    f.score != null ? <span key="s" style={{ fontWeight: 900, color: f.score >= 7 ? '#10b981' : f.score >= 5 ? '#f59e0b' : '#ef4444' }}>{f.score}/10</span> : null,
                    f.rir != null ? <span key="r" style={{ color: '#fff', fontWeight: 900 }}>{rirLabel(f.rir)} over</span> : null,
                    gevoel ? <span key="g" style={{ fontWeight: 900, color: f.gevoel === 'pijn' ? '#ef4444' : '#f59e0b' }}>{gevoel}</span> : null,
                    pomp ? <span key="p">pomp {pomp.toLowerCase()}</span> : null,
                  ].filter(Boolean)
                  if (!delen.length && !f.opmerking) return null
                  return (
                    <div style={{ marginTop: 2, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.35 }}>
                      {delen.map((d, n) => <React.Fragment key={n}>{n > 0 && ' · '}{d}</React.Fragment>)}
                      {f.opmerking && <span style={{ fontStyle: 'italic' }}>{delen.length ? ' · ' : ''}{f.opmerking}</span>}
                    </div>
                  )
                })()}
                {selectedSession._wissels?.[String(ex.name || '').trim().toLowerCase()] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b' }}>
                    <ArrowLeftRight size={11} strokeWidth={2.6} />
                    Gewisseld door klant · was {selectedSession._wissels[String(ex.name || '').trim().toLowerCase()]}
                  </div>
                )}
                {historie && ex.sets?.length > 0 ? null : ex.sets?.length > 0 ? (
                  <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', marginTop: 3, flexWrap: 'wrap' }}>
                    {ex.sets.map((st, si) => <SetDisplay key={si} s={st} />)}
                  </div>
                ) : ex.totalSets > 0 ? (
                  <div style={{ marginTop: 3, fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{ex.totalSets} sets</div>
                ) : null}
                {ex.notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 5, paddingLeft: 7, borderLeft: '2px solid rgba(255,255,255,0.4)' }}>
                    <MessageSquare size={10} color="rgba(255,255,255,0.6)" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ex.notes}</span>
                  </div>
                )}
              </div>
              {/* Rechts van de titel: de sets per datum, deze sessie vooraan. Vier
                  datums tegelijk in beeld, de rest door te schuiven. */}
              {historie && ex.sets?.length > 0 && (() => {
                const dezeDag = String(selectedSession.workout_date || '').slice(0, 10)
                const eerder = (historie(ex.name) || [])
                  .filter(e => e.sessionId !== selectedSession.id && String(e.date || '').slice(0, 10) <= dezeDag && e.sets?.length > 0)
                  .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 11)
                const kolommen = [{ ...ex, date: selectedSession.workout_date, nu: true }, ...eerder]
                const rijen = Math.max(...kolommen.map(k => k.sets.length))
                const kg = (n) => String(Math.round((Number(n) || 0) * 10) / 10).replace('.', ',')
                const datum = (d) => { const x = new Date(`${String(d || '').slice(0, 10)}T00:00:00`); return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') }
                const KOL = 66, LABEL = 20
                return (
                  <div style={{ flexShrink: 0, alignSelf: 'center', display: 'flex', width: LABEL + KOL * Math.min(4, kolommen.length), margin: '0.35rem 0.4rem 0.35rem 0', fontSize: '0.66rem', fontWeight: 800, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>
                    <div style={{ width: LABEL, flexShrink: 0 }}>
                      <div style={{ fontSize: '0.56rem' }}>&nbsp;</div>
                      {Array.from({ length: rijen }, (_, ri) => <div key={ri} style={{ fontSize: '0.54rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', lineHeight: `${0.66 * 1.4}rem` }}>S{ri + 1}</div>)}
                    </div>
                    <div className="ci-sets-baan" style={{ flex: 1, minWidth: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <style>{'.ci-sets-baan::-webkit-scrollbar{display:none}'}</style>
                      {kolommen.map((k, ki) => (
                        <div key={ki} style={{ flex: `0 0 ${KOL}px`, scrollSnapAlign: 'start', whiteSpace: 'nowrap', color: k.nu ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                          <div style={{ fontSize: '0.56rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: k.nu ? '#fff' : 'rgba(255,255,255,0.4)' }}>{datum(k.date)}</div>
                          {Array.from({ length: rijen }, (_, ri) => {
                            const st = k.sets[ri]
                            return <div key={ri}>{st ? <>{kg(st.weight)}<span style={{ fontSize: '0.8em', opacity: 0.6 }}>kg</span>×{st.reps || 0}</> : <span style={{ opacity: 0.4 }}>–</span>}</div>
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {/* Rechts: beste gewicht als vaste waarde, en de knop naar de progressie. */}
              <button
                onClick={() => onKies(ex.name)}
                title="Progressie van deze oefening" aria-label="Progressie van deze oefening"
                style={{
                  flexShrink: 0, alignSelf: 'stretch', minWidth: 56,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  padding: '0 0.6rem', background: 'transparent', border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {ex.bestWeight > 0 && (
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', fontVariantNumeric: 'tabular-nums' }}>
                    {ex.bestWeight}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg</span>
                  </span>
                )}
                <TrendingUp size={14} color="rgba(255,255,255,0.55)" strokeWidth={2.4} />
              </button>
            </div>
          )) : <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Geen oefeningen gelogd in deze sessie</div>}
        </div>
      </div>
    )
  }
}

function ProgressView({ db, client, isMobile, selectedExercise, entries, onBack }) {
  {
    const first = entries.length > 0 ? entries[entries.length - 1] : null
    const latest = entries[0] || null
    const wDiff = (first && latest && entries.length >= 2) ? latest.bestWeight - first.bestWeight : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={onBack} aria-label="Terug" style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, minWidth: 28, minHeight: 28, touchAction: 'manipulation' }}><ArrowLeft size={16} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedExercise}</span>
        </div>
        {latest && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {[{ label: 'BESTE', val: `${latest.bestWeight}kg`, color: '#fff' }, { label: 'REPS', val: `×${latest.bestReps}`, color: '#fff' }, { label: 'SESSIES', val: entries.length, color: '#fff' }, ...(wDiff !== null && wDiff !== 0 ? [{ label: 'TREND', val: `${wDiff > 0 ? '+' : ''}${wDiff}kg`, color: wDiff > 0 ? '#10b981' : '#ef4444' }] : [])].map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}
        {/* Dezelfde krachtgrafiek als de klant in zijn log-modal ziet: 8RM-schatting,
            doellijn per fase (cut/build) en de band van wat goed is. De oude
            balkjes lieten alleen het beste gewicht zien, zonder reps of fase —
            en de coach kijkt juist naar of iemand op tempo zit. */}
        {entries.length > 1 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
            <ExerciseProgressChart db={db} client={client} exerciseName={selectedExercise} isMobile={isMobile} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {entries.map((e, idx) => (
            <div key={idx} style={{ padding: isMobile ? '0.55rem 0.9rem' : '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.55)' }}>{formatDate(e.date)}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{e.bestWeight}<span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg</span> <span style={{ fontWeight: 700, fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)' }}>×{e.bestReps}</span></span>
              </div>
              {e.sets?.length > 0 && <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', flexWrap: 'wrap' }}>{e.sets.map((st, si) => <SetDisplay key={si} s={st} />)}</div>}
            </div>
          ))}
          {entries.length === 0 && <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700 }}>Nog geen progressie voor deze oefening</div>}
        </div>
      </div>
    )
  }
}
