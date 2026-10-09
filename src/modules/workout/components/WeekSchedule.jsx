// src/modules/workout/components/WeekSchedule.jsx
import useIsMobile from '../../../hooks/useIsMobile'
import { AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Lock } from 'lucide-react'
import WeekGrid from './week-schedule/WeekGrid'
import WorkoutServiceNew from '../services/WorkoutServiceNew'
import { rustWaarschuwingen, waarschuwingTekst, ROOD } from '../utils/rustWaarschuwing'
import ActionButtons from './week-schedule/ActionButtons'
import CardioService, { normaliseerSoort } from '../services/CardioService'
import TrainingToevoegen from './TrainingToevoegen'
import { ontleedPlanKey } from '../utils/planKey'
import { voegTrainingToe, verwijderTrainingVanDag } from '../utils/extraTrainingen'
import RealiteitBlad from '../../client-agenda/RealiteitBlad'
import CardioGedaanBlad from './CardioGedaanBlad'
import ExerciseLogModal from './todays-workout/components/ExerciseLogModal'
import StappenService, { STANDAARD_DOEL } from '../../steps/StappenService'
import { STAPPEN_EVENT } from '../../steps/stappenSync'
import StappenInzichtModal from '../../steps/StappenInzichtModal'
import { Footprints, BarChart3 } from 'lucide-react'

// Bereken de maandag van de huidige week (lokale tijd).
function getThisMonday() {
  const d = new Date()
  const day = d.getDay() // 0=zo, 1=ma, ...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function WeekSchedule({
  weekSchedule, schema, swapMode, selectedWorkout,
  completedWorkouts = [], todayIndex, onDayClick,
  clientId, db, workoutService, onScheduleUpdate, onSwitchPlan,
  weekOffset = 0, onWeekOffsetChange,
  // Volledige klant voor het logscherm van een afgeronde oefening.
  client = null,
  // Blok onder de weekstrip (de cardio-sectie). Als slot doorgegeven zodat
  // WeekSchedule zelf niets van cardio hoeft te weten en de volgorde op één
  // plek staat. Stond eerst tussen de dagen en de weekbalk in, maar dan raakt
  // die balk los van de dagen die hij bedient.
  tussenBlok = null,
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState({})
  // Stappen van de getoonde week, in de weekstrip zelf (was een losse strook).
  const [stappenWeek, setStappenWeek] = useState([])
  const [stappenDoel, setStappenDoel] = useState(STANDAARD_DOEL)
  const [stappenInzicht, setStappenInzicht] = useState(false)
  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    const laad = async () => {
      const anker = new Date(getoondeMaandag)
      const [dagen, doel] = await Promise.all([StappenService.haalWeek(db, clientId, anker), StappenService.haalDoel(db, clientId)])
      if (weg) return
      setStappenWeek(dagen || []); setStappenDoel(doel || STANDAARD_DOEL)
    }
    laad()
    window.addEventListener(STAPPEN_EVENT, laad)
    return () => { weg = true; window.removeEventListener(STAPPEN_EVENT, laad) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, db, weekOffset])
  const stappenPerDag = stappenWeek.length === 7 ? stappenWeek.map(d => ({ steps: d.steps, gehaald: (d.steps || 0) >= stappenDoel, toekomst: d.toekomst, isVandaag: d.isVandaag })) : null
  const stappenTotaal = stappenWeek.filter(d => !d.toekomst).reduce((t, d) => t + (d.steps || 0), 0)
  const stappenDagenGehaald = stappenWeek.filter(d => !d.toekomst && (d.steps || 0) >= stappenDoel).length
  // Andere plannen van de klant waar een dag van is ingepland (plan_<id>__<dag>).
  const [anderePlannen, setAnderePlannen] = useState({})
  // De indeling van de week ervoor en erna. Nodig voor de rust-waarschuwing:
  // zondag botst niet met de dinsdag ervóór maar met de dinsdag erna, en die
  // staat in de week hierna.
  const [buurWeken, setBuurWeken] = useState({})
  // Het vaste rooster (clients.workout_schedule), om te weten of een training
  // 'permanent' in het plan staat of alleen in deze week.
  const [vastRooster, setVastRooster] = useState({})
  // Vraag na een tik op de prullenbak: { soort, titel, permanent, item }
  const [verwijderVraag, setVerwijderVraag] = useState(null)

  // Maandag van de getoonde week — nodig om de planning van die week te
  // laden en te bewaren, dus hier en niet pas in de render.
  const getoondeMaandag = (() => {
    const d = getThisMonday(); d.setDate(d.getDate() + weekOffset * 7); return d
  })()
  const weekSleutel = WorkoutServiceNew.datumSleutel(getoondeMaandag)
  const isHuidigeWeek = weekOffset === 0
  const isToekomst = weekOffset > 0
  const kanPlannen = isHuidigeWeek || isToekomst

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  // Cardio in dezelfde dagkaart als de training: de blokken 'Cardio · Sport'
  // uit de agenda (per weekdag, dus voor elke week gelijk) en de logs van de
  // getoonde week om te zien wat al gedaan is.
  const [cardioBlokken, setCardioBlokken] = useState([])
  const [cardioLogs, setCardioLogs] = useState([])
  // Trainingstijd per weekdag: het trainingsblok in de agenda van die dag,
  // anders de vaste trainingstijd van de klant.
  const [trainingBlokken, setTrainingBlokken] = useState([])
  const [vasteTrainingstijd, setVasteTrainingstijd] = useState(null)
  const [cardioVersie, setCardioVersie] = useState(0)
  // Gedane trainingen van de getoonde week: een sessie in workout_sessions
  // met minstens één gelogde set. De oude bron (localStorage) werd nooit
  // gevuld, waardoor 'Gedaan' nooit verscheen.
  const [gedaneDagen, setGedaneDagen] = useState([]) // [{ workout_day, workout_date, sessie }]
  // Geopende afgeronde sessie (tik op een 'Gedaan'-tegel): blok voor RealiteitBlad.
  const [sessieBlad, setSessieBlad] = useState(null)
  // Geopende gedane cardio (tik op een groene cardiotegel): { log, soort, gepland }
  const [cardioBlad, setCardioBlad] = useState(null)
  // Logscherm voor één oefening op een afgeronde dag: { exercise, datum }.
  // Het sessieblad gaat zolang dicht (zelfde laag) en komt daarna terug.
  const [oefeningLog, setOefeningLog] = useState(null)
  const oefeningVan = (naam, ex) => {
    for (const dag of Object.values(schema?.week_structure || {})) {
      const hit = (dag?.exercises || []).find(e => String(e?.name || '').trim().toLowerCase() === String(naam).trim().toLowerCase())
      if (hit) return hit
    }
    const sets = Array.isArray(ex?.sets) ? ex.sets : []
    return { name: naam, sets: sets.length || 3, reps: sets[0]?.reps || 10 }
  }
  const [sessieVersie, setSessieVersie] = useState(0)
  useEffect(() => {
    const bump = () => setSessieVersie(v => v + 1)
    window.addEventListener('myarc:workout-changed', bump)
    return () => window.removeEventListener('myarc:workout-changed', bump)
  }, [])
  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    const maandag = (() => { const d = getThisMonday(); d.setDate(d.getDate() + weekOffset * 7); return d })()
    const zondag = new Date(maandag); zondag.setDate(zondag.getDate() + 6)
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    ;(async () => {
      const { data: sessies } = await db.supabase.from('workout_sessions').select('id, workout_date, day_name, day_display_name, duration_minutes, is_completed, created_at')
        .eq('client_id', clientId).gte('workout_date', iso(maandag)).lte('workout_date', iso(zondag))
        .then(r => r, () => ({ data: [] }))
      const ids = (sessies || []).map(x => x.id)
      let metSets = new Set()
      const telSets = {}, laatsteSet = {}, oefPerSessie = {}
      if (ids.length) {
        const { data: sets } = await db.supabase.from('workout_progress').select('session_id, created_at, exercise_name').in('session_id', ids)
          .then(r => r, () => ({ data: [] }))
        metSets = new Set((sets || []).map(x => x.session_id))
        ;(sets || []).forEach(x => {
          telSets[x.session_id] = (telSets[x.session_id] || 0) + 1
          laatsteSet[x.session_id] = Math.max(laatsteSet[x.session_id] || 0, new Date(x.created_at).getTime() || 0)
          if (x.exercise_name) (oefPerSessie[x.session_id] = oefPerSessie[x.session_id] || new Set()).add(String(x.exercise_name).trim().toLowerCase())
        })
      }
      // Alle plannen van de klant (ook het vorige, na een wissel): een sessie
      // zonder eigen naam ("Quick Log") krijgt de naam van de dag waarvan de
      // oefeningen het best overeenkomen, bv. 'Push'.
      const { plans: allePlannen } = db.getClientWorkoutPlans ? await db.getClientWorkoutPlans(clientId).then(r => r, () => ({ plans: [] })) : { plans: [] }
      const naamUitOefeningen = (oef) => {
        if (!oef || oef.size === 0) return null
        let beste = null, besteScore = 0
        ;[...(allePlannen || []), ...(schema ? [schema] : [])].forEach(pl => {
          Object.values(pl?.week_structure || {}).forEach(dag => {
            const namen = new Set((dag?.exercises || []).map(e => String(e?.name || '').trim().toLowerCase()).filter(Boolean))
            if (!namen.size) return
            let gelijk = 0; oef.forEach(n => { if (namen.has(n)) gelijk++ })
            const score = gelijk / Math.min(namen.size, oef.size)
            if (score > besteScore) { besteScore = score; beste = dag?.name || dag?.focus || null }
          })
        })
        return besteScore >= 0.5 ? beste : null
      }
      if (weg) return
      const dagen = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const uit = []
      ;(sessies || []).filter(x => metSets.has(x.id)).forEach(x => {
        const d = new Date(String(x.workout_date).slice(0, 10) + 'T12:00:00')
        const idx = (d.getDay() + 6) % 7
        if (!uit.some(u => u.workout_day === dagen[idx])) {
          // Begin = aanmaak van de sessie, eind = laatste set + 5 min (max 2 uur),
          // zelfde rekenwijze als de Realiteit-agenda van de coach.
          const beginTs = new Date(x.created_at).getTime()
          const b = new Date(beginTs); const start = b.getHours() * 60 + b.getMinutes()
          let eind = laatsteSet[x.id] ? (() => { const e = new Date(laatsteSet[x.id]); return e.getHours() * 60 + e.getMinutes() + 5 })() : start + (Number(x.duration_minutes) || 60)
          eind = Math.min(eind, start + 120, 24 * 60); if (eind <= start) eind = Math.min(start + 45, 24 * 60)
          uit.push({
            workout_day: dagen[idx], workout_date: x.workout_date,
            // Wat er toen écht gedaan is. Wordt in het rooster vergeleken met
            // wat er nu op die dag staat: na een planwissel blijft de gedane
            // training zichtbaar en krijgt de nieuwe dag niet onterecht 'Gedaan'.
            naam: (x.day_display_name && !/^quick log/i.test(x.day_display_name)) ? x.day_display_name : naamUitOefeningen(oefPerSessie[x.id]),
            dagSleutel: x.day_name || null,
            oefeningen: oefPerSessie[x.id] ? [...oefPerSessie[x.id]] : [],
            blok: {
              id: `gedaan-${x.id}`, day: dagen[idx].toLowerCase(), type: 'training', label: 'Training',
              // Naam van de training: wat de sessie zelf zegt, anders de dag
              // uit het rooster (oude sessies heten 'Wednesday' of 'Quick Log').
              sublabel: (x.day_display_name && !/^quick log/i.test(x.day_display_name)) ? x.day_display_name
                : (getWorkoutData(tempSchedule[dagen[idx]])?.name || getWorkoutData(tempSchedule[dagen[idx]])?.focus || 'Training'),
              start, end: eind, color: '#fff', source: 'realiteit', editable: false,
              meta: { echt: true, sessionId: x.id, exercise_count: telSets[x.id] || null, estimated_time: `${eind - start} min`, afgerond: !!x.is_completed, datum: x.workout_date },
            },
          })
        }
      })
      setGedaneDagen(uit)
    })()
    return () => { weg = true }
  }, [clientId, db, weekOffset, sessieVersie])
  useEffect(() => {
    const bump = () => setCardioVersie(v => v + 1)
    window.addEventListener('myarc:cardio-changed', bump)
    return () => window.removeEventListener('myarc:cardio-changed', bump)
  }, [])
  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    const maandag = (() => { const d = getThisMonday(); d.setDate(d.getDate() + weekOffset * 7); return d })()
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    Promise.all([
      db.supabase.from('client_agenda_blocks').select('id, day, label, start_time, end_time, week_start, skip_weeks')
        .eq('client_id', clientId).eq('type', 'custom').ilike('label', 'Cardio ·%')
        // Vaste blokken (week_start leeg) elke week; eenmalige alleen in hun week.
        .or(`week_start.is.null,week_start.eq.${iso(maandag)}`)
        .then(r => r, () => ({ data: [] })),
      CardioService.getLogs(clientId, iso(maandag), db),
      db.supabase.from('client_agenda_blocks').select('day, start_time').eq('client_id', clientId).eq('type', 'training')
        .then(r => r, () => ({ data: [] })),
      db.supabase.from('clients').select('training_time').eq('id', clientId).maybeSingle()
        .then(r => r, () => ({ data: null })),
    ]).then(([b, logs, t, c]) => {
      if (weg) return
      // Vaste blokken die deze week zijn weggehaald (skip_weeks) niet tonen.
      setCardioBlokken((b?.data || []).filter(x => !(x.skip_weeks || []).includes(iso(maandag))))
      setTrainingBlokken(t?.data || [])
      setVasteTrainingstijd(c?.data?.training_time ? String(c.data.training_time).slice(0, 5) : null)
      const eind = new Date(maandag); eind.setDate(eind.getDate() + 6)
      setCardioLogs((logs || []).filter(l => String(l.logged_date).slice(0, 10) <= iso(eind)))
    })
    return () => { weg = true }
  }, [clientId, db, weekOffset, cardioVersie])
  const hasValidSchema = schema && schema.week_structure && typeof schema.week_structure === 'object'

  useEffect(() => { loadSavedSchedule() }, [clientId, weekSleutel])

  useEffect(() => {
    // Alleen de huidige week volgt de planning van de pagina; een vooruit
    // geplande week heeft zijn eigen indeling en mag daar niet door
    // overschreven worden.
    // Alleen een gevulde indeling overnemen, en niet terwijl er net een
    // wijziging onderweg is: anders zet een oude stand van de pagina de
    // zojuist verschoven dag terug.
    if (!loading && !saving && isHuidigeWeek && weekSchedule && Object.keys(weekSchedule).length > 0) {
      setTempSchedule(weekSchedule)
      loadCustomWorkoutsForSchedule(weekSchedule)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekSchedule, loading, isHuidigeWeek])

  const loadAnderePlannen = async (schedule) => {
    if (!db?.supabase || !schedule) return
    const ids = [...new Set(Object.values(schedule).map(ontleedPlanKey).filter(Boolean).map(k => k.schemaId).filter(id => id && id !== schema?.id))]
    if (ids.length === 0) return
    try {
      const { data } = await db.supabase.from('workout_schemas').select('id, name, week_structure').in('id', ids)
      const map = {}
      ;(data || []).forEach(p => { map[p.id] = p })
      setAnderePlannen(prev => ({ ...prev, ...map }))
    } catch { /* leeg */ }
  }

  const loadCustomWorkoutsForSchedule = async (schedule) => {
    loadAnderePlannen(schedule)
    if (!workoutService || !schedule) return
    const ids = Object.values(schedule).filter(v => v?.startsWith('custom_')).map(v => v.replace('custom_', ''))
    if (ids.length === 0) return
    try {
      const all = await workoutService.getCustomWorkouts(clientId)
      const map = {}
      all.forEach(w => { map[w.id] = w })
      setCustomWorkouts(map)
    } catch {}
  }

  // De indeling van de week ervoor en erna. Die hebben we nodig voor de
  // rust-waarschuwing: zondag botst met de dinsdag erna, niet met die ervoor.
  //
  // Let op de terugval op `vast`: een week zonder eigen planning ís de vaste
  // indeling. Verschuif je dus iets in de huidige week, dan verandert daarmee
  // ook wat de buurweken laten zien — en moet dit opnieuw geladen worden.
  // Gebeurde dat niet, dan bleef de waarschuwing staan tegen de oude positie.
  const laadBuurWeken = async (vastMee) => {
    const vast = vastMee ?? await db.getClientWorkoutSchedule(clientId)
    const buur = {}
    await Promise.all([-1, 1].map(async (stap) => {
      const d = new Date(getoondeMaandag)
      d.setDate(d.getDate() + stap * 7)
      const sleutel = WorkoutServiceNew.datumSleutel(d)
      // Een komende buurweek erft van de laatst geplande week ervoor; de
      // week ervoor (verleden) is altijd de vaste indeling.
      buur[String(stap)] = stap > 0
        ? await WorkoutServiceNew.getPlanningVoorWeek(clientId, sleutel, vast, db)
        : ((await WorkoutServiceNew.getWeekPlanning(clientId, sleutel, db)) || vast || null)
    }))
    setBuurWeken(buur)
  }

  const loadSavedSchedule = async () => {
    if (!clientId || !db) return
    setLoading(true)
    try {
      // Is de vooruit geplande week inmiddels begonnen? Dan wordt die de
      // nieuwe vaste indeling, zodat alles wat clients.workout_schedule leest
      // (de workout van vandaag, de challenge-telling) meteen klopt.
      if (isHuidigeWeek) {
        const gepland = await WorkoutServiceNew.promoveerWeekPlanning(clientId, weekSleutel, db)
        if (gepland && Object.keys(gepland).length > 0) {
          await db.updateClientWorkoutSchedule(clientId, gepland)
          setTempSchedule(gepland)
          await loadCustomWorkoutsForSchedule(gepland)
          if (onScheduleUpdate) onScheduleUpdate(gepland)
          return
        }
      }

      const vast = await db.getClientWorkoutSchedule(clientId)
      setVastRooster(vast || {})
      await laadBuurWeken(vast)
      // Een komende week begint bij wat er het laatst gepland is (de week
      // ervoor met eigen planning, anders de vaste indeling) en wijkt
      // daarvan af zodra de klant hem verschuift.
      const saved = isHuidigeWeek ? vast : await WorkoutServiceNew.getPlanningVoorWeek(clientId, weekSleutel, vast, db)
      if (saved && Object.keys(saved).length > 0) {
        setTempSchedule(saved)
        await loadCustomWorkoutsForSchedule(saved)
        if (isHuidigeWeek && onScheduleUpdate) onScheduleUpdate(saved)
      } else {
        setTempSchedule({})
      }
    } catch (e) { console.error('❌ Load schedule failed:', e) }
    finally { setLoading(false) }
  }

  const handleAutoSave = async (newSchedule) => {
    if (!clientId || !db) return
    // Meteen verschuiven, niet pas als de server antwoordt. Anders staat het
    // tegeltje na de tik nog een halve seconde op zijn oude plek en lijkt de
    // ui te blijven hangen. Mislukt het opslaan, dan zetten we het terug.
    const vorige = tempSchedule
    setTempSchedule(newSchedule)
    setSaving(true)
    try {
      if (isToekomst) {
        // Een komende week apart bewaren: deze week blijft zoals hij was.
        const gelukt = await WorkoutServiceNew.saveWeekPlanning(clientId, weekSleutel, newSchedule, db)
        if (!gelukt) throw new Error('niet opgeslagen')
      } else {
        await db.updateClientWorkoutSchedule(clientId, newSchedule)
        setVastRooster(newSchedule)
        if (onScheduleUpdate) onScheduleUpdate(newSchedule)
      }
      setHasChanges(false)
      // De buurweken erbij halen: bij een week zonder eigen planning is dit
      // net dezelfde indeling die we zojuist hebben gewijzigd, en zonder deze
      // stap waarschuwt de grafiek nog tegen de oude positie.
      await laadBuurWeken(isToekomst ? undefined : newSchedule)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
    } catch {
      setTempSchedule(vorige)
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100])
      alert('⚠️ Opslaan mislukt.')
    } finally { setSaving(false) }
  }

  // Verschuif workout van `day` één positie in `direction` (-1 = vorige dag,
  // +1 = volgende dag). Bezet → swap; leeg → move.
  // Na een verschuiving met de pijltjes: zes seconden 'Ongedaan maken'. Een
  // tik op een pijltje is klein en snel; zo is een misser meteen terug te draaien.
  const [ongedaan, setOngedaan] = useState(null) // { vorige, dag }
  useEffect(() => {
    if (!ongedaan) return
    const t = setTimeout(() => setOngedaan(null), 6000)
    return () => clearTimeout(t)
  }, [ongedaan])
  const handleShift = (day, direction) => {
    const sourceIdx = weekDays.indexOf(day)
    const targetIdx = sourceIdx + direction
    if (sourceIdx < 0 || targetIdx < 0 || targetIdx >= weekDays.length) return
    const sourceWorkout = tempSchedule[day]
    if (!sourceWorkout) return
    const targetDay = weekDays[targetIdx]
    const targetWorkout = tempSchedule[targetDay]
    const next = { ...tempSchedule }
    if (targetWorkout) {
      next[targetDay] = sourceWorkout
      next[day] = targetWorkout
    } else {
      next[targetDay] = sourceWorkout
      delete next[day]
    }
    const w = getWorkoutData(sourceWorkout)
    setOngedaan({ vorige: tempSchedule, naam: w?.name || w?.focus || 'Training', naar: weekDaysDutch[targetIdx] })
    handleAutoSave(next)
  }

  // ── Training toevoegen (knop onder de week) ──
  const [toevoegenOpen, setToevoegenOpen] = useState(false)
  const volgendeWeekSleutel = (() => { const d = new Date(getoondeMaandag); d.setDate(d.getDate() + 7); return WorkoutServiceNew.datumSleutel(d) })()

  // Gym: 'standaard' = het vaste rooster (en de getoonde week als die een
  // eigen planning heeft). 'eenmalig' in een komende week = alleen die week.
  // 'eenmalig' in deze week: het vaste rooster nu aanpassen (zo klopt de
  // workout van vandaag) en de oude indeling klaarzetten als planning voor
  // volgende week, zodat het daarna vanzelf terugspringt — tenzij volgende
  // week al een eigen planning heeft, dan blijft die.
  // 'Standaard' moet ook landen in weken die al vooruit gepland staan (die
  // hebben een eigen rij en volgen de vaste indeling niet). Zonder dit
  // stond 'test' standaard in het plan, maar niet in volgende week (ks10k,
  // 9 okt 2026).
  const zetInToekomstWeken = async (vanafNa, day, workoutKey, extra) => {
    const { data: weken } = await db.supabase.from('client_week_schedules')
      .select('week_start, schedule').eq('client_id', clientId).gt('week_start', vanafNa)
      .then(r => r, () => ({ data: [] }))
    for (const w of weken || []) {
      const sch = w.schedule || {}
      const nieuw = extra ? voegTrainingToe(sch, day, workoutKey) : { ...sch, [day]: workoutKey }
      await WorkoutServiceNew.saveWeekPlanning(clientId, w.week_start, nieuw, db)
    }
  }

  const bewaarGym = async ({ workoutKey, day, bereik, extra = false }) => {
    // `extra`: naast de training die er al staat (tweede training op een
    // dag), anders ervoor in de plaats.
    const next = extra ? voegTrainingToe(tempSchedule, day, workoutKey) : { ...tempSchedule, [day]: workoutKey }
    if (isToekomst) {
      const ok = await WorkoutServiceNew.saveWeekPlanning(clientId, weekSleutel, next, db)
      if (!ok) throw new Error('niet opgeslagen')
      if (bereik === 'standaard') {
        const vast = (await db.getClientWorkoutSchedule(clientId)) || {}
        await db.updateClientWorkoutSchedule(clientId, extra ? voegTrainingToe(vast, day, workoutKey) : { ...vast, [day]: workoutKey })
        await zetInToekomstWeken(weekSleutel, day, workoutKey, extra)
      }
      setTempSchedule(next)
      await loadCustomWorkoutsForSchedule(next)
      await laadBuurWeken()
      return
    }
    if (bereik === 'eenmalig') {
      const eigenVolgende = await WorkoutServiceNew.getWeekPlanning(clientId, volgendeWeekSleutel, db)
      if (!eigenVolgende) await WorkoutServiceNew.saveWeekPlanning(clientId, volgendeWeekSleutel, tempSchedule, db)
    }
    await handleAutoSave(next)
    if (bereik === 'standaard') await zetInToekomstWeken(weekSleutel, day, workoutKey, extra)
    await loadCustomWorkoutsForSchedule(next)
    await laadBuurWeken()
  }

  // Prullenbak op een trainingstegel: alleen deze week weg, zelfde weg als
  // 'eenmalig' toevoegen maar dan zonder die dag.
  const verwijderTraining = async (day, rosterKey = null) => {
    // rosterKey = 'Thursday#2' voor een tweede training; zonder = de hoofdtraining.
    const next = verwijderTrainingVanDag(tempSchedule, day, rosterKey)
    if (isToekomst) {
      const ok = await WorkoutServiceNew.saveWeekPlanning(clientId, weekSleutel, next, db)
      if (!ok) { alert('⚠️ Weghalen mislukt.'); return }
      setTempSchedule(next)
      await laadBuurWeken()
      return
    }
    const eigenVolgende = await WorkoutServiceNew.getWeekPlanning(clientId, volgendeWeekSleutel, db)
    if (!eigenVolgende) await WorkoutServiceNew.saveWeekPlanning(clientId, volgendeWeekSleutel, tempSchedule, db)
    await handleAutoSave(next)
  }
  // Eigen training voorgoed uit het plan: uit de vaste indeling, uit deze
  // week, en uit elke week die al vooruit gepland staat.
  const verwijderEigenTrainingVoorgoed = async (day, rosterKey, key) => {
    try {
      const vast = (await db.getClientWorkoutSchedule(clientId)) || {}
      const vastNieuw = Object.fromEntries(Object.entries(vast).filter(([, v]) => v !== key))
      await db.updateClientWorkoutSchedule(clientId, vastNieuw)
      const { data: weken } = await db.supabase.from('client_week_schedules')
        .select('week_start, schedule').eq('client_id', clientId).gte('week_start', weekSleutel)
        .then(r => r, () => ({ data: [] }))
      for (const w of weken || []) {
        const sch = w.schedule || {}
        if (!Object.values(sch).includes(key)) continue
        await WorkoutServiceNew.saveWeekPlanning(clientId, w.week_start, Object.fromEntries(Object.entries(sch).filter(([, v]) => v !== key)), db)
      }
    } catch (e) { console.error('eigen training voorgoed weghalen mislukt:', e); alert('⚠️ Weghalen mislukt.'); return }
    await verwijderTraining(day, rosterKey)
    setVastRooster(prev => Object.fromEntries(Object.entries(prev || {}).filter(([, v]) => v !== key)))
  }

  // Vast cardio één week overslaan (skip_weeks); het plan blijft staan.
  const verwijderCardioDezeWeek = async (c) => {
    const { error } = await db.supabase.from('client_agenda_blocks')
      .update({ skip_weeks: [...(c.skipWeeks || []), weekSleutel], updated_at: new Date().toISOString() }).eq('id', c.id)
    if (error) { console.error('cardio overslaan mislukt:', error); alert('⚠️ Weghalen mislukt.'); return }
    setCardioVersie(v => v + 1)
    window.dispatchEvent(new CustomEvent('myarc:cardio-changed'))
  }
  // rosterKey = 'Thursday#2' voor een tweede training op die dag.
  const vraagTraining = (day, rosterKey = null) => {
    const key = tempSchedule[rosterKey || day]
    const w = getWorkoutData(key)
    // Eigen training (custom_…): die mag de klant wél voorgoed uit zijn
    // plan halen; dagen uit het plan van de coach niet.
    setVerwijderVraag({ soort: 'training', titel: w?.name || w?.focus || 'Training', permanent: !!key && vastRooster[rosterKey || day] === key, item: day, rosterKey, eigen: String(key || '').startsWith('custom_'), key })
  }
  const vraagCardio = (c) => setVerwijderVraag({ soort: 'cardio', titel: c.soort, permanent: !c.eenmalig, item: c })
  const voerUit = async (hoe) => {
    const v = verwijderVraag
    setVerwijderVraag(null)
    if (!v) return
    if (v.soort === 'training') {
      // Voorgoed uit het plan is voor de coach, behalve bij een eigen
      // training: die haalt de klant zelf uit de vaste indeling én uit de
      // weken die al vooruit gepland staan.
      if (hoe === 'voorgoed' && v.eigen) await verwijderEigenTrainingVoorgoed(v.item, v.rosterKey || null, v.key)
      else await verwijderTraining(v.item, v.rosterKey || null)
    } else {
      if (hoe === 'voorgoed' || !v.permanent) await verwijderCardio(v.item)
      else await verwijderCardioDezeWeek(v.item)
    }
  }

  // Cardio gaat voorgoed weg: het blok uit de agenda, en de planregel van
  // die sport telt een keer minder (of gaat uit als er niets overblijft).
  const verwijderCardio = async (c) => {
    if (!c?.id || !db?.supabase) return
    const { error } = await db.supabase.from('client_agenda_blocks').delete().eq('id', c.id)
    if (error) { console.error('cardio weghalen mislukt:', error); alert('⚠️ Weghalen mislukt.'); return }
    if (!c.eenmalig) {
      const label = `Cardio · ${c.soort}`
      const plan = await CardioService.getPlan(clientId, db)
      const regel = plan.find(p => normaliseerSoort(p.cardio_type) === normaliseerSoort(c.soort))
      if (regel) {
        const { data: over } = await db.supabase.from('client_agenda_blocks').select('id')
          .eq('client_id', clientId).eq('type', 'custom').eq('label', label).is('week_start', null)
          .then(r => r, () => ({ data: null }))
        const keer = (over || []).length
        if (keer === 0) await CardioService.deactivatePlanItem(regel.id, db)
        else await CardioService.savePlanItem({ ...regel, times_per_week: keer }, db)
      }
    }
    setCardioVersie(v => v + 1)
    window.dispatchEvent(new CustomEvent('myarc:cardio-changed'))
  }

  // Cardio: blokken in de agenda op de gekozen dagen. Standaard = vast blok
  // (elke week) én een regel in het cardioplan; eenmalig = blok met
  // week_start, alleen zichtbaar in deze week.
  const bewaarCardio = async ({ soort, duur, tijd, dagen, bereik }) => {
    await CardioService.planBlokken({ clientId, soort, duur, tijd, dagen, bereik, weekSleutel }, db)
    setCardioVersie(v => v + 1)
  }

  const handleSwapClick = (day, workoutKey) => {
    if (!hasValidSchema) return
    if (!localSwapMode) {
      setLocalSwapMode(true); setSelectedForSwap({ day, workoutKey })
    } else {
      if (selectedForSwap) {
        const s = { ...tempSchedule }
        if (selectedForSwap.workoutKey && workoutKey) { s[day] = selectedForSwap.workoutKey; s[selectedForSwap.day] = workoutKey }
        else if (selectedForSwap.workoutKey && !workoutKey) { s[day] = selectedForSwap.workoutKey; delete s[selectedForSwap.day] }
        else if (!selectedForSwap.workoutKey && workoutKey) { s[selectedForSwap.day] = workoutKey; delete s[day] }
        handleAutoSave(s)
      }
      setLocalSwapMode(false); setSelectedForSwap(null)
    }
  }

  const handleCancel = () => {
    setTempSchedule(weekSchedule || {}); setHasChanges(false)
    setLocalSwapMode(false); setSelectedForSwap(null)
  }

  const getWorkoutData = (workoutKey) => {
    if (!workoutKey) return null
    if (workoutKey.startsWith('custom_')) return customWorkouts[workoutKey.replace('custom_', '')] || null
    const activities = {
      swimming: { name: 'Zwemmen', focus: 'Cardio', geschatteTijd: '60 min', isActivity: true },
      cardio: { name: 'Cardio', focus: 'Cardio', geschatteTijd: '45 min', isActivity: true },
      hiking: { name: 'Wandelen', focus: 'Cardio', geschatteTijd: '90 min', isActivity: true },
      cycling: { name: 'Fietsen', focus: 'Cardio', geschatteTijd: '60 min', isActivity: true },
      running: { name: 'Hardlopen', focus: 'Cardio', geschatteTijd: '45 min', isActivity: true }
    }
    if (activities[workoutKey]) return activities[workoutKey]
    if (schema?.week_structure?.[workoutKey]) return schema.week_structure[workoutKey]
    const pk = ontleedPlanKey(workoutKey)
    if (pk) {
      const plan = pk.schemaId === schema?.id ? schema : anderePlannen[pk.schemaId]
      const w = plan?.week_structure?.[pk.dagKey]
      return w ? { ...w, uitPlan: plan?.name || null } : null
    }
    return null
  }

  // Wordt dezelfde spiergroep te dicht op elkaar getraind? Rood bij twee dagen
  // achter elkaar, oranje bij één dag ertussen. Op spiergroep en niet op de
  // workout zelf (de tweede push-dag heet "Push (Copy)" en heeft een eigen
  // sleutel), en op echte datums over drie weken heen — zondag botst met de
  // dinsdag erna, niet met die ervoor.
  const { perDag: rustPerDag, meldingen: rustMeldingen } = rustWaarschuwingen({
    weken: { '-1': buurWeken['-1'], '0': tempSchedule, '1': buurWeken['1'] },
    weekDays,
    dagDataVan: getWorkoutData,
    maandag: getoondeMaandag,
  })

  // Cardio per dagindex voor de getoonde week: voor de dagkaarten en voor
  // de dagkiezer in 'Training toevoegen'.
  const cardioPerDagVan = (dayDates) => {
    const sleutels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const uit = {}
    sleutels.forEach((k, i) => {
      const datum = dayDates?.[i] ? iso(dayDates[i]) : null
      const lijst = cardioBlokken.filter(b => b.day === k)
        .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
        .map(b => {
          const soort = String(b.label).replace(/^Cardio\s*·\s*/, '')
          const [h, m] = String(b.start_time || '').split(':').map(Number)
          const [eh, em] = String(b.end_time || '').split(':').map(Number)
          const duur = Number.isFinite(h) && Number.isFinite(eh) ? Math.max(0, (eh * 60 + em) - (h * 60 + m)) : null
          const zelfdeSoort = (l) => normaliseerSoort(l.cardio_type) === normaliseerSoort(soort)
          const dagVanLog = (l) => { const d = new Date(String(l.logged_date).slice(0, 10) + 'T12:00:00'); return sleutels[(d.getDay() + 6) % 7] }
          // Gedaan: een log op deze dag, of (oudere logs, vóór de datumkoppeling)
          // een log van deze sport in dezelfde week op een dag zonder eigen blok.
          const log = !datum ? null : cardioLogs.find(l => zelfdeSoort(l) && (
            String(l.logged_date).slice(0, 10) === datum ||
            !cardioBlokken.some(b2 => b2.day === dagVanLog(l) && normaliseerSoort(String(b2.label).replace(/^Cardio\s*·\s*/, '')) === normaliseerSoort(soort))
          )) || null
          const gedaan = !!log
          return { id: b.id, day: b.day, soort, tijd: String(b.start_time || '').slice(0, 5), duur, gedaan, log, eenmalig: !!b.week_start, skipWeeks: b.skip_weeks || [] }
        })
      if (lijst.length) uit[i] = lijst
    })
    return uit
  }

  if (!hasValidSchema) {
    return (
      <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 1.25rem', textAlign: 'center' }}>
        <AlertCircle size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: '0.5rem' }} />
        <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.85rem' }}>Geen workout schema beschikbaar</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 0, marginBottom: '1rem', position: 'relative' }}>

      {/* Opslaan-indicator zweeft rechtsboven, buiten de flow: als hij in de
          flow stond, schoof het hele rooster omlaag en weer omhoog bij elke
          verschuiving van een dag (9 okt 2026). */}
      {saving && (
        <div style={{
          position: 'absolute', top: -14, right: isMobile ? 16 : 20, zIndex: 3, pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
          gap: '0.3rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600'
        }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          Opslaan
        </div>
      )}

      {/* Swap mode banner */}
      {localSwapMode && (
        <div style={{ margin: isMobile ? '0 0.75rem 0.625rem' : '0 1rem 0.75rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
          {selectedForSwap
            ? `Kies een dag om te wisselen met ${weekDaysDutch[weekDays.indexOf(selectedForSwap.day)]}`
            : 'Selecteer een workout om te verplaatsen'}
        </div>
      )}

      {/* Titelrij: plannaam met het wissel-icoon er direct achter, rechts
          de knop om een training toe te voegen. Geen label erboven. */}
      <div style={{
        padding: isMobile ? '0.5rem 1rem 0.875rem' : '0.5rem 1.25rem 1rem',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            minWidth: 0, fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {schema?.name || 'Plan'}
          </div>
          {onSwitchPlan && (
            <button onClick={onSwitchPlan} aria-label="Wissel van plan" style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: '50%', padding: 0,
              background: 'transparent', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <RefreshCw size={isMobile ? 17 : 19} strokeWidth={2.8} />
            </button>
          )}
        </div>
        {kanPlannen && (
          <button onClick={() => setToevoegenOpen(true)} style={{
            flexShrink: 0, minHeight: isMobile ? 36 : 40, padding: isMobile ? '0 0.8rem' : '0 0.95rem',
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fff', border: '1px solid #fff', borderRadius: 999, color: '#0a0a0a',
            fontSize: isMobile ? '0.78rem' : '0.84rem', fontWeight: 900, letterSpacing: '-0.01em', fontFamily: 'inherit',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Plus size={16} strokeWidth={3} /> Training
          </button>
        )}
      </div>

      {/* Weeknavigatie — vorige/volgende week */}
      {(() => {
        const monday = getoondeMaandag
        const fmt = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
        const isCurrentWeek = isHuidigeWeek
        const dayDates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday); d.setDate(d.getDate() + i); return d
        })
        const cardioPerDag = cardioPerDagVan(dayDates)
        return (
          <>
            {/* WeekGrid: tegen de schermrand aan, zodat de kaarten breed zijn. */}
            <div style={{ padding: isMobile ? '0 0.4rem' : '0 1rem' }}>
              <WeekGrid
                stappenPerDag={stappenPerDag} stappenDoel={stappenDoel}
                cardioPerDag={cardioPerDag}
                onCardioShift={async (c, dir) => {
                  // Cardio-blok een dag opzij in de agenda, los van de training.
                  const sleutels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                  const i = sleutels.indexOf(c.day)
                  const j = i + dir
                  if (i < 0 || j < 0 || j > 6 || !db?.supabase) return
                  const { error } = await db.supabase.from('client_agenda_blocks').update({ day: sleutels[j], updated_at: new Date().toISOString() }).eq('id', c.id)
                  if (error) { console.error('cardio verschuiven mislukt:', error); return }
                  setCardioVersie(v => v + 1)
                }}
                onOpenGedaan={(day) => { const g = gedaneDagen.find(u => u.workout_day === day); if (g?.blok) setSessieBlad(g.blok) }}
                onOpenCardioGedaan={(c) => c?.log && setCardioBlad({ log: c.log, soort: c.soort, gepland: c.duur })}
                onRemoveTraining={vraagTraining}
                onRemoveCardio={vraagCardio}
                onPrevWeek={() => onWeekOffsetChange && onWeekOffsetChange(weekOffset - 1)}
                onNextWeek={() => onWeekOffsetChange && onWeekOffsetChange(weekOffset + 1)}
                trainingTijdPerDag={(() => {
                  const sleutels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                  const uit = {}
                  sleutels.forEach((k, i) => {
                    const blok = trainingBlokken.find(b => b.day === k)
                    const tijd = blok?.start_time ? String(blok.start_time).slice(0, 5) : vasteTrainingstijd
                    if (tijd) uit[i] = tijd
                  })
                  return uit
                })()}
                tempSchedule={tempSchedule} weekDays={weekDays} todayIndex={todayIndex}
                completedWorkouts={[...gedaneDagen, ...(isHuidigeWeek && Array.isArray(completedWorkouts) ? completedWorkouts : [])]} selectedWorkout={selectedWorkout}
                selectedForSwap={selectedForSwap} swapMode={swapMode} localSwapMode={localSwapMode}
                getWorkoutData={getWorkoutData} onDayClick={onDayClick} onSwapClick={handleSwapClick}
                onShift={handleShift}
                isMobile={isMobile}
                dayDates={dayDates}
                kanPlannen={kanPlannen}
                kanOpenen={isCurrentWeek}
                gedimd={weekOffset < 0}
                rustPerDag={rustPerDag}
              />
            </div>

            {/* Ongedaan maken als zwevende pil onderin beeld, niet in de flow:
                in de flow duwde hij alles onder het rooster zes seconden omlaag. */}
            {ongedaan && (
              <div style={{
                position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 96,
                bottom: `calc(${isMobile ? 96 : 102}px + env(safe-area-inset-bottom, 0px))`,
                maxWidth: 'min(92vw, 420px)', padding: '0.45rem 0.5rem 0.45rem 0.9rem', borderRadius: 999,
                background: 'rgba(20,20,20,0.96)', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '0.74rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ongedaan.naam} naar {ongedaan.naar} verschoven
                </div>
                <button onClick={() => { const v = ongedaan.vorige; setOngedaan(null); handleAutoSave(v) }} style={{
                  flexShrink: 0, minHeight: 32, padding: '0 0.75rem', borderRadius: 999, background: '#fff', border: '1px solid #fff', color: '#0a0a0a',
                  fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>Ongedaan maken</button>
              </div>
            )}

            {rustMeldingen.length > 0 && (
              <div style={{
                padding: isMobile ? '0 0.75rem 0.35rem' : '0 1rem 0.5rem',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {rustMeldingen.map(m => (
                  <div key={m.niveau} style={{
                    fontSize: isMobile ? '0.68rem' : '0.72rem',
                    fontWeight: 800, lineHeight: 1.3,
                    color: m.niveau === ROOD ? '#ef4444' : '#f59e0b',
                  }}>
                    {waarschuwingTekst(m)}
                  </div>
                ))}
              </div>
            )}
            {/* Zeg erbij dat je vooruit plant: de wijziging geldt voor die week
                en gaat pas in als die week begint. */}
            {isToekomst && (
              <div style={{
                padding: isMobile ? '0 0.75rem 0.25rem' : '0 1rem 0.375rem',
                textAlign: 'center',
                fontSize: isMobile ? '0.66rem' : '0.7rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
              }}>
                Je plant vooruit. Dit geldt vanaf {fmt(monday)}
              </div>
            )}

            <TrainingToevoegen
              open={toevoegenOpen} onClose={() => setToevoegenOpen(false)} isMobile={isMobile}
              schema={schema} workoutService={workoutService} clientId={clientId} db={db}
              tempSchedule={tempSchedule} getWorkoutData={getWorkoutData} dayDates={dayDates}
              isHuidigeWeek={isHuidigeWeek} cardioPerDag={cardioPerDag}
              onBewaarGym={bewaarGym} onBewaarCardio={bewaarCardio}
            />

            {tussenBlok}
            {/* Stappen van de week, direct onder het rooster; de cijfers per dag
                staan in de tegels. De knop opent de lange lijn (30 & 90 dagen). */}
            {stappenPerDag && (
              <div style={{
                padding: isMobile ? '0.1rem 1rem 0.5rem' : '0.2rem 1.25rem 0.6rem',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)',
              }}>
                <Footprints size={isMobile ? 15 : 16} strokeWidth={2.4} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.55)' }} />
                <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: '#fff', fontWeight: 900 }}>{stappenTotaal.toLocaleString('nl-NL')}</span> stappen
                  {stappenDagenGehaald > 0 && <span style={{ color: '#10b981' }}> · {stappenDagenGehaald}× doel</span>}
                  <span> · doel {stappenDoel.toLocaleString('nl-NL')} per dag</span>
                </span>
                <button onClick={() => setStappenInzicht(true)} aria-label="Stappen over 30 en 90 dagen" style={{
                  marginLeft: 'auto', flexShrink: 0, width: 30, height: 30, borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <BarChart3 size={14} strokeWidth={2.4} />
                </button>
              </div>
            )}
            <StappenInzichtModal isOpen={stappenInzicht} onClose={() => setStappenInzicht(false)} client={client} db={db} isMobile={isMobile} gewichtKg={Number(client?.current_weight) || null} doel={stappenDoel} />
          </>
        )
      })()}

      {localSwapMode && (
        <div style={{ padding: isMobile ? '0 1rem' : '0 1.25rem' }}>
          <ActionButtons hasChanges={hasChanges} saving={saving} onSave={() => handleAutoSave(tempSchedule)} onCancel={handleCancel} isMobile={isMobile} />
        </div>
      )}

      {/* WeekList ("Schema" expanded card list) removed — duplicates the
          WeekGrid above; tile tap already opens the workout details. */}

      {/* Afgeronde sessie: oefeningen met hun sets, zelfde blad als de
          Realiteit-agenda van de coach. */}
      <RealiteitBlad blok={oefeningLog ? null : sessieBlad} db={db} isMobile={isMobile} onClose={() => setSessieBlad(null)}
        onOefening={(ex) => setOefeningLog({ exercise: oefeningVan(ex.exercise_name, ex), datum: sessieBlad?.meta?.datum || null })} />
      {oefeningLog && (
        <ExerciseLogModal db={db} client={client || { id: clientId }} exercise={oefeningLog.exercise} datum={oefeningLog.datum} isMobile={isMobile}
          onClose={() => { setOefeningLog(null); setSessieVersie(v => v + 1) }} />
      )}
      {cardioBlad && (
        <CardioGedaanBlad log={cardioBlad.log} soort={cardioBlad.soort} gepland={cardioBlad.gepland} db={db} isMobile={isMobile}
          onClose={() => setCardioBlad(null)}
          onVerwijderd={() => { setCardioVersie(v => v + 1); window.dispatchEvent(new CustomEvent('myarc:cardio-changed')) }} />
      )}

      {verwijderVraag && createPortal(
        <div onClick={() => setVerwijderVraag(null)} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '1.2rem 1rem 1.1rem' : '1.4rem 1.3rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', textAlign: 'center' }}>
            <Trash2 size={22} color="#fff" strokeWidth={2.6} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{verwijderVraag.titel} weghalen?</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.4 }}>
              {verwijderVraag.permanent
                ? (verwijderVraag.soort === 'training' ? 'Staat vast in je plan.' : 'Staat elke week in je plan.')
                : 'Staat alleen deze week ingepland.'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {verwijderVraag.permanent ? (
                <>
                  <button onClick={() => voerUit('deze_week')} style={vraagKnop(true)}>Alleen deze week</button>
                  {verwijderVraag.soort === 'training' && !verwijderVraag.eigen ? (
                    // Het plan is van de coach: een trainingsdag haal je er niet
                    // zelf uit. De knop staat er wel, maar op slot, met de reden.
                    <div style={{ ...vraagKnop(false), minHeight: 0, padding: '0.7rem 0.9rem', cursor: 'default', opacity: 0.55, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                      <Lock size={16} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                      <div>
                        <div>Voorgoed uit mijn plan</div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, opacity: 0.75, marginTop: 2 }}>Kan je niet zomaar doen, neem contact op met je coach.</div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => voerUit('voorgoed')} style={vraagKnop(false)}>Voorgoed uit mijn plan</button>
                  )}
                </>
              ) : (
                <button onClick={() => voerUit('voorgoed')} style={vraagKnop(true)}>Ja, weghalen</button>
              )}
              <button onClick={() => setVerwijderVraag(null)} style={{ ...vraagKnop(false), border: 'none', color: 'rgba(255,255,255,0.5)' }}>Nee, laat staan</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  )
}

// Knoppen in het vraag-venster: één witte, de rest kaal met rand.
const vraagKnop = (primair) => ({
  width: '100%', minHeight: 48, borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer',
  fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.01em',
  background: primair ? '#fff' : 'transparent', color: primair ? '#0a0a0a' : '#fff',
  border: `1px solid ${primair ? '#fff' : 'rgba(255,255,255,0.2)'}`,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
