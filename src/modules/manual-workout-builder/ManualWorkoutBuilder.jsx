// src/modules/manual-workout-builder/ManualWorkoutBuilder.jsx
import { useState, useEffect } from 'react'
import { voorstelPlan } from './dagTitel'
import { createPortal } from 'react-dom'
import useHistoryState from './hooks/useHistoryState'
import { Undo2, Redo2 } from 'lucide-react'
import DayBuilder from './components/DayBuilder'
import ExerciseSelector from './components/ExerciseSelector'
import TemplateManager from './components/TemplateManager'
import DayTemplatePickerModal from './components/DayTemplatePickerModal'
// Dezelfde wizard die de klant op zijn workout-pagina gebruikt om te kiezen
// welke training op welke dag valt. Hergebruikt i.p.v. nagebouwd: twee
// versies van hetzelfde scherm lopen gegarandeerd uit elkaar.
import WeekPlanner from '../workout/components/planning/WeekPlanner'
import WorkoutService from '../../services/WorkoutService'
import CardioPlanModal from './components/CardioPlanModal'
// Dezelfde weekagenda als in de maaltijd-analyzer: trainingen, cardio en
// de rest van de week van de klant, zodat je ziet waar je iets inplant.
import ClientAgendaView from '../client-agenda/ClientAgendaView'
// Het weekrooster met dagtegels zoals de klant het ziet; de uren-agenda
// blijft er als tweede weergave naast.
import KlantWeekrooster from './components/KlantWeekrooster'
// Hetzelfde wisselvenster als op de workout-pagina van de klant (eigen
// plannen + standaardplannen), zodat de coach en de klant hetzelfde zien.
import PlanSwitchModal from '../workout/components/PlanSwitchModal'
import PlanToevoegenModal from './components/PlanToevoegenModal'
import KlantCardioOverzicht from './components/KlantCardioOverzicht'
import { Plus, Save, Users, FileText, ChevronDown, Video, Trash2, Search, X, AlertTriangle, CalendarDays, Heart, Calendar, RefreshCw } from 'lucide-react'
import PDFExportButton from './components/PDFExportButton'
import ExerciseLibraryModal from './components/ExerciseLibraryModal'

export default function ManualWorkoutBuilder({ db, clients, selectedClient }) {
  const isMobile = window.innerWidth <= 768

  const [workoutPlan, setWorkoutPlan, history] = useHistoryState({
    name: '', description: '', primary_goal: 'muscle_gain',
    experience_level: 'intermediate', split_type: 'custom',
    days_per_week: 0, equipment: [], days: []
  })
  const [activeDay, setActiveDay] = useState(null)
  // Het rechterpaneel toont één dag tegelijk, dus er moet er altijd één
  // gekozen zijn. Valt de selectie weg (dag verwijderd, ander plan geladen),
  // dan pakken we de eerste.
  const [instellingenOpen, setInstellingenOpen] = useState(false)
  const [intakeOpen, setIntakeOpen] = useState(true)
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showAgenda, setShowAgenda] = useState(false)
  // Weekagenda van de klant in het hoofdvlak (aan/uit) en een teller om hem
  // te laten herladen na cardio-wijzigingen.
  const [showWeekAgenda, setShowWeekAgenda] = useState(false)
  const [showPlanSwitch, setShowPlanSwitch] = useState(false)
  const [showPlanToevoegen, setShowPlanToevoegen] = useState(false)
  // Titel in de kopbalk aanpassen: null = niet aan het bewerken.
  const [titelBewerk, setTitelBewerk] = useState(null)
  const [agendaWeergave, setAgendaWeergave] = useState('rooster') // 'rooster' | 'uren'
  const [agendaKey, setAgendaKey] = useState(0)
  useEffect(() => {
    const bump = () => setAgendaKey(k => k + 1)
    window.addEventListener('myarc:cardio-changed', bump)
    return () => window.removeEventListener('myarc:cardio-changed', bump)
  }, [])
  const [workoutService] = useState(() => new WorkoutService(db.supabase))
  const [showCardio, setShowCardio] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState([])
  const [dayTemplates, setDayTemplates] = useState([])
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [clientSchemas, setClientSchemas] = useState([])
  const [selectedSchemaId, setSelectedSchemaId] = useState(null)
  // Titel-venster voor "opslaan als template". null = dicht; anders de
  // ingetikte naam. Een template krijgt zijn eigen naam: die van het plan waar
  // je in zit is vaak klantspecifiek ("PPL Erwin 23/03") en dat wil je niet
  // terugzien in je sjabloonlijst.
  const [templateNaam, setTemplateNaam] = useState(null)
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [localClient, setLocalClient] = useState(null)
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [trainingInfo, setTrainingInfo] = useState(null)

  const effectiveClient = localClient || selectedClient

  useEffect(() => { loadTemplates(); loadDayTemplates() }, [])

  // Toetsenbord: Cmd/Ctrl+Z = ongedaan maken, Cmd/Ctrl+Shift+Z = opnieuw.
  // Niet actief terwijl je in een tekstveld typt (dan hoort Z gewoon een Z).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        const tag = (e.target?.tagName || '').toLowerCase()
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return
        e.preventDefault()
        if (e.shiftKey) history.redo(); else history.undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history.undo, history.redo])

  useEffect(() => {
    if (!selectedClient) return
    loadClientSchemas(selectedClient)
    // Ook de intake ophalen. Dat gebeurde alleen bij het kiezen van een klant
    // ín de builder; kwam je hier binnen met een klant al geselecteerd vanuit
    // CoachHub, dan bleef het intake-paneel leeg.
    loadTrainingInfo(selectedClient.id)
  }, [selectedClient?.id])

  const loadClientSchemas = async (client) => {
    if (!client) return
    try {
      const schemas = await db.getClientSchemas(client.id)
      setClientSchemas(schemas || [])
      // Het actieve plan van de klant voorop; anders het nieuwste.
      const actief = (schemas || []).find(x => x.id === client.assigned_schema_id) || schemas?.[0]
      if (actief) loadSchemaIntoBuilder(actief)
    } catch (e) {
      console.error('❌ getClientSchemas failed, falling back:', e)
      try {
        const schema = await db.getClientSchema(client.id)
        if (schema) loadSchemaIntoBuilder(schema)
      } catch {}
    }
  }

  // Het plan dat nu in de builder staat: wat de coach ziet en de klant draait.
  const huidigPlan = clientSchemas.find(x => x.id === selectedSchemaId) || null

  // Na wisselen of verwijderen: klant opnieuw ophalen (assigned_schema_id is
  // veranderd) en de plannen opnieuw laden, zonder het toewijsvenster.
  const herlaadKlant = async () => {
    if (!effectiveClient?.id) return
    try {
      // Niet via db.getClient: die geeft de gecachte klant terug, met het
      // oude assigned_schema_id, waardoor het rooster "Nog geen plan" bleef
      // tonen na wisselen (8 okt 2026). Cache leegmaken en vers ophalen.
      db.clearCache?.('client')
      const { data: vers } = await db.supabase.from('clients').select('*').eq('id', effectiveClient.id).single()
        .then(r => r, () => ({ data: null }))
      if (vers) setLocalClient(vers)
      await loadClientSchemas(vers || effectiveClient)
    } catch (e) { console.error('klant herladen mislukt:', e) }
    setAgendaKey(k => k + 1)
  }

  const verwijderHuidigPlan = async () => {
    if (!huidigPlan || !effectiveClient?.id) return
    if (!window.confirm(`"${huidigPlan.name || 'Dit plan'}" verwijderen voor ${effectiveClient.first_name || 'deze klant'}? Sjablonen blijven staan.`)) return
    const r = await db.removeClientPlan(effectiveClient.id, huidigPlan.id)
    if (!r?.success) { alert('Verwijderen mislukt.'); return }
    setSelectedSchemaId(null)
    setWorkoutPlan({ name: '', description: '', primary_goal: 'muscle_gain', experience_level: 'intermediate', split_type: '', days_per_week: 3, equipment: [], days: [] })
    await herlaadKlant()
  }

  // Nieuw plan voor deze klant bouwen: builder leeg, klant blijft staan.
  // Opslaan bewaart het dan als extra plan (zie handleSavePlan).
  const nieuwPlanVoorKlant = () => {
    history.reset({ name: '', description: '', primary_goal: 'muscle_gain', experience_level: 'intermediate', split_type: 'custom', days_per_week: 0, equipment: [], days: [] })
    setSelectedSchemaId(null)
    setActiveDay(null)
  }

  // Titel uit de kopbalk bewaren: in de builder, en meteen in de database
  // als het een bestaand plan is, zodat je niet eerst op Opslaan hoeft.
  const bewaarTitel = async () => {
    const nieuw = (titelBewerk ?? '').trim()
    setTitelBewerk(null)
    if (!nieuw || nieuw === (workoutPlan.name || '')) return
    setWorkoutPlan(prev => ({ ...prev, name: nieuw }))
    if (!selectedSchemaId) return
    const { error } = await db.supabase.from('workout_schemas').update({ name: nieuw, updated_at: new Date().toISOString() }).eq('id', selectedSchemaId)
    if (error) { console.error('titel opslaan mislukt:', error); return }
    setClientSchemas(prev => prev.map(x => x.id === selectedSchemaId ? { ...x, name: nieuw } : x))
    setAgendaKey(k => k + 1)
  }

  const loadTrainingInfo = async (clientId) => {
    try {
      // Alles wat voor het bouwen van een schema uitmaakt. De velden liggen
      // verspreid over `clients` omdat ze uit verschillende intake-versies
      // komen; hieronder worden ze samengevoegd tot één beeld. Niet alles is
      // bij elke klant ingevuld — lege velden vallen weg in de weergave.
      const { data: cd } = await db.supabase.from('clients')
        .select([
          'preferred_training_days', 'primary_goal', 'work_schedule',
          'first_name', 'last_name',
          'experience', 'training_experience',
          'injuries', 'gym_name', 'workout_type',
          'days_per_week', 'workout_days_per_week', 'training_days',
          'minutes_per_session', 'training_time', 'workout_schedule',
        ].join(', '))
        .eq('id', clientId).single()
      let intakeDays = []
      try {
        const { data: np } = await db.supabase.from('nutrition_preferences')
          .select('training').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1)
        intakeDays = np?.[0]?.training?.training_days || []
      } catch {}
      setTrainingInfo({ ...cd, intakeDays })
    } catch (e) {
      console.error('loadTrainingInfo:', e)
    }
  }

  const handleSelectLocalClient = async (client) => {
    setLocalClient(client)
    setShowClientPicker(false)
    setClientSearch('')
    await loadClientSchemas(client)
    await loadTrainingInfo(client.id)
  }

  const loadSchemaIntoBuilder = (schema) => {
    if (!schema?.week_structure) return
    const days = Object.entries(schema.week_structure)
      .sort((a, b) => parseInt(a[0].replace('dag', '')) - parseInt(b[0].replace('dag', '')))
      .map(([, day], index) => ({
        id: Date.now() + index,
        name: day.name || `DAG ${index + 1}`,
        focus: day.focus || '',
        geschatteTijd: day.geschatteTijd || '60 minutes',
        exercises: (day.exercises || []).map((ex, i) => ({ ...ex, id: Date.now() + index + i + Math.random() }))
      }))
    history.reset({
      name: schema.name || '', description: schema.description || '',
      primary_goal: schema.primary_goal || 'muscle_gain',
      experience_level: schema.experience_level || 'intermediate',
      split_type: schema.split_type || 'custom',
      days_per_week: days.length, equipment: schema.equipment || [], days,
      _schemaId: schema.id
    })
    setSelectedSchemaId(schema.id)
  }

  const loadTemplates = async () => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const schemas = await db.getWorkoutSchemas(user.id)
      setTemplates(schemas.filter(s => s.is_template && !s.is_ai_generated))
    } catch (e) { console.error('Error loading templates:', e) }
  }

  // ── Dag-templates (bv. "Push dag") — coach-scoped, herbruikbaar in elk plan ──
  const loadDayTemplates = async () => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const { data, error } = await db.supabase
        .from('workout_day_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setDayTemplates(data || [])
    } catch (e) { console.error('loadDayTemplates:', e) }
  }

  const saveDayAsTemplate = async (day) => {
    const name = (window.prompt('Naam voor deze dag-template (bv. "Push dag"):', day?.name || '') || '').trim()
    if (!name) return
    try {
      const user = await db.getCurrentUser()
      if (!user) { alert('Je moet ingelogd zijn'); return }
      // client-only id per oefening strippen; de rest bewaren we volledig.
      const exercises = (day.exercises || []).map(({ id, ...ex }) => ex)
      const { error } = await db.supabase.from('workout_day_templates').insert({
        user_id: user.id, name,
        focus: day.focus || '',
        geschatte_tijd: day.geschatteTijd || '60 minutes',
        exercises,
      })
      if (error) throw error
      await loadDayTemplates()
      alert('✅ Dag-template opgeslagen!')
    } catch (e) { alert('❌ Opslaan mislukt: ' + (e.message || e)) }
  }

  const deleteDayTemplate = async (tpl) => {
    if (!confirm(`Dag-template "${tpl.name}" verwijderen?`)) return
    try {
      const { error } = await db.supabase.from('workout_day_templates').delete().eq('id', tpl.id)
      if (error) throw error
      setDayTemplates(prev => prev.filter(t => t.id !== tpl.id))
    } catch (e) { alert('❌ Verwijderen mislukt: ' + (e.message || e)) }
  }

  const addEmptyDay = () => {
    const newDay = { id: Date.now(), name: '', focus: '', exercises: [], geschatteTijd: '60 minutes' }
    setWorkoutPlan(prev => ({ ...prev, days: [...prev.days, newDay], days_per_week: prev.days.length + 1 }))
    setActiveDay(newDay.id)
    setShowDayPicker(false)
  }

  const addDayFromTemplate = (tpl) => {
    const base = Date.now()
    const newDay = {
      id: base,
      name: tpl.name || '',
      focus: tpl.focus || '',
      geschatteTijd: tpl.geschatte_tijd || '60 minutes',
      exercises: (tpl.exercises || []).map((ex, i) => ({ ...ex, id: base + i + 1 + Math.random() })),
    }
    setWorkoutPlan(prev => ({ ...prev, days: [...prev.days, newDay], days_per_week: prev.days.length + 1 }))
    setActiveDay(newDay.id)
    setShowDayPicker(false)
  }

  const updateDay = (dayId, updates) => {
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.map(d => d.id === dayId ? { ...d, ...updates } : d) }))
  }

  const deleteDay = (dayId) => {
    if (!confirm('Weet je zeker dat je deze dag wilt verwijderen?')) return
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.filter(d => d.id !== dayId), days_per_week: Math.max(0, prev.days.length - 1) }))
    if (activeDay === dayId) setActiveDay(null)
  }

  // Een gedupliceerde dag krijgt een nummer, geen "(Copy)". De klant ziet deze
  // naam in zijn weekschema staan: "Push 2" is een tweede push-dag, "Push
  // (Copy)" is een kijkje in de keuken van de coach.
  const volgendeDagNaam = (basis) => {
    // "Push 2" bestaat al? Dan 3. De basis is de naam zonder eventueel nummer,
    // zodat je van "Push 2" geen "Push 2 2" maakt.
    const kaal = String(basis || 'Dag').replace(/\s+\d+$/, '').trim()
    const bestaand = new Set(workoutPlan.days.map(d => String(d.name || '').trim()))
    let n = 2
    while (bestaand.has(`${kaal} ${n}`)) n++
    return `${kaal} ${n}`
  }

  const duplicateDay = (dayId) => {
    const dayToCopy = workoutPlan.days.find(d => d.id === dayId)
    if (!dayToCopy) return
    const newDay = { ...dayToCopy, id: Date.now(), name: volgendeDagNaam(dayToCopy.name), exercises: dayToCopy.exercises.map(ex => ({ ...ex, id: Date.now() + Math.random() })) }
    setWorkoutPlan(prev => ({ ...prev, days: [...prev.days, newDay], days_per_week: prev.days.length + 1 }))
  }

  const addExercise = (exercise) => {
    if (!activeDay) return
    const newExercise = {
      id: Date.now(), name: exercise.name, sets: Number(exercise.sets) || 2, reps: exercise.reps || '8-12',
      rust: exercise.rest || exercise.rust || '2 min', rpe: '7-8', equipment: exercise.equipment || '',
      primairSpieren: exercise.primairSpieren || exercise.muscle || '', notes: '',
      type: exercise.type || 'compound', stretch: false, priority: 1, goalPriority: false,
      _isCustom: exercise._isCustom || false
    }
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.map(d => d.id === activeDay ? { ...d, exercises: [...d.exercises, newExercise] } : d) }))
    if (newExercise.equipment && !workoutPlan.equipment.includes(newExercise.equipment)) {
      setWorkoutPlan(prev => ({ ...prev, equipment: [...prev.equipment, newExercise.equipment] }))
    }
    setShowExerciseSelector(false)
  }

  // Cardio zit niet meer ín een trainingsdag maar los bij de klant (zie
  // CardioPlanModal). buildWeekStructure schrijft bestaande cardio-items nog
  // wel weg, zodat oudere schema's die ze al hebben niet stilletjes leeglopen.

  const updateExercise = (dayId, exerciseId, updates) => {
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex) } : d) }))
  }

  const deleteExercise = (dayId, exerciseId) => {
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(ex => ex.id !== exerciseId) } : d) }))
  }

  const buildWeekStructure = () => {
    const ws = {}
    workoutPlan.days.forEach((day, index) => {
      ws[`dag${index + 1}`] = {
        name: day.name, focus: day.focus, geschatteTijd: day.geschatteTijd,
        exercises: day.exercises.map(ex => ex.type === 'cardio' ? ({
          name: ex.name, type: 'cardio',
          duration: ex.duration || '', distance: ex.distance || '', intensity: ex.intensity || '',
          notes: ex.notes || ''
        }) : ({
          name: ex.name, sets: parseInt(ex.sets) || 2, reps: ex.reps, rust: ex.rust, rpe: ex.rpe,
          equipment: ex.equipment, primairSpieren: ex.primairSpieren, notes: ex.notes || '',
          type: ex.type || 'compound', stretch: ex.stretch || false, priority: ex.priority || 1, goalPriority: ex.goalPriority || false
        }))
      }
    })
    return ws
  }

  // `naam` komt uit het titel-venster. Het plan in beeld verandert hier niet
  // van naam: je slaat een kopie op als sjabloon en werkt daarna gewoon verder
  // in het plan waar je mee bezig was.
  const saveAsTemplate = async (naam) => {
    const titel = String(naam ?? workoutPlan.name ?? '').trim()
    if (!titel) { alert('Geef de template een naam'); return }
    if (workoutPlan.days.length === 0) { alert('Voeg minimaal één dag toe'); return }
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) { alert('Je moet ingelogd zijn'); return }
      const { error } = await db.supabase.from('workout_schemas').insert({
        name: titel, description: workoutPlan.description || '', user_id: user.id,
        primary_goal: workoutPlan.primary_goal, experience_level: workoutPlan.experience_level,
        split_type: workoutPlan.split_type, days_per_week: workoutPlan.days.length, time_per_session: 60,
        week_structure: buildWeekStructure(), equipment: workoutPlan.equipment.slice(0, 10),
        is_template: true, is_ai_generated: false, is_public: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
      if (error) throw error
      setTemplateNaam(null)
      alert('✅ Template opgeslagen!')
      await loadTemplates()
    } catch (e) { alert('❌ Fout bij opslaan: ' + e.message) }
    finally { setSaving(false) }
  }

  // Opslaan bij de klant: een bestaand plan bijwerken, of -- als de klant er nog
  // geen heeft -- zijn eerste maken.
  //
  // Dat tweede kon niet. De knop eiste een geopend schema, dus voor een nieuwe
  // klant zonder plan was hij altijd grijs en was de enige uitweg: template
  // opslaan en hem elders toewijzen. Precies bij de klant waar je het vaakst
  // een plan voor bouwt.
  const saveToClientSchema = async () => {
    // Geen naam getypt: pak het voorstel ("3× PPL") in plaats van blokkeren.
    const planNaam = workoutPlan.name || voorstelPlan(workoutPlan.days)
    if (!planNaam) { alert('Geef het plan een naam'); return }
    if (!workoutPlan.name) setWorkoutPlan(prev => ({ ...prev, name: planNaam }))
    if (workoutPlan.days.length === 0) { alert('Voeg minimaal één dag toe'); return }

    if (selectedSchemaId) {
      if (!confirm('Weet je zeker dat je dit client plan wilt overschrijven?')) return
      setSaving(true)
      try {
        const { error } = await db.supabase.from('workout_schemas').update({
          name: planNaam, description: workoutPlan.description || '',
          week_structure: buildWeekStructure(), days_per_week: workoutPlan.days.length,
          updated_at: new Date().toISOString()
        }).eq('id', selectedSchemaId)
        if (error) throw error
        alert('✅ Client plan opgeslagen!')
      } catch (e) { alert('❌ Fout bij opslaan: ' + e.message) }
      finally { setSaving(false) }
      return
    }

    const klant = effectiveClient
    if (!klant?.id) { alert('Kies eerst een klant'); return }
    const naam = `${klant.first_name || 'de klant'}`
    // Heeft de klant al plannen, dan is dit een extra plan: het huidige
    // blijft actief, wisselen doe je met de wisselknop in de kopbalk.
    const extra = clientSchemas.length > 0
    if (!confirm(extra
      ? `Als extra plan voor ${naam} opslaan? Het huidige plan blijft actief.`
      : `${naam} heeft nog geen plan. Dit plan als zijn eerste instellen?`)) return

    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) { alert('Je moet ingelogd zijn'); return }
      const { data, error } = await db.supabase.from('workout_schemas').insert({
        name: planNaam, description: workoutPlan.description || '',
        user_id: user.id, client_id: klant.id, client_name: `${klant.first_name || ''} ${klant.last_name || ''}`.trim() || null,
        primary_goal: workoutPlan.primary_goal, experience_level: workoutPlan.experience_level,
        split_type: workoutPlan.split_type, days_per_week: workoutPlan.days.length, time_per_session: 60,
        week_structure: buildWeekStructure(), equipment: workoutPlan.equipment.slice(0, 10),
        is_template: false, is_ai_generated: false, is_public: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).select('id').single()
      if (error) throw error

      // Zijn eerste plan is meteen het actieve; anders staat het klaar maar
      // ziet de klant nog niets.
      if (!extra) {
        const { error: kFout } = await db.supabase.from('clients')
          .update({ assigned_schema_id: data.id, schema_assigned_at: new Date().toISOString() })
          .eq('id', klant.id)
        if (kFout) throw kFout
      }

      await herlaadKlant()
      const nieuw = (await db.getClientSchemas(klant.id).then(r => r, () => [])) || []
      if (nieuw.find(x => x.id === data.id)) { setClientSchemas(nieuw); loadSchemaIntoBuilder(nieuw.find(x => x.id === data.id)) }
      alert(extra ? '✅ Extra plan opgeslagen (niet actief).' : '✅ Plan aangemaakt en toegewezen!')
    } catch (e) { alert('❌ Fout bij opslaan: ' + e.message) }
    finally { setSaving(false) }
  }

  // Leegmaken: reset het hele plan naar leeg om vers te beginnen. Met bevestiging.
  // Gebruikt history.reset zodat ook de undo-stack gewist wordt — anders brengt
  // Ctrl+Z het oude plan terug en voelt het alsof je niet echt opnieuw bent begonnen.
  const clearPlan = () => {
    if (workoutPlan.days.length === 0 && !workoutPlan.name) return
    if (!confirm('Hele plan leegmaken? Alle dagen en oefeningen worden gewist.')) return
    history.reset({
      name: '', description: '', primary_goal: 'muscle_gain',
      experience_level: 'intermediate', split_type: 'custom',
      days_per_week: 0, equipment: [], days: []
    })
    setSelectedSchemaId(null)
    setLocalClient(null)
    setActiveDay(null)
  }

  const loadTemplate = (template) => {
    const days = []
    if (template.week_structure) {
      Object.entries(template.week_structure)
        .sort((a, b) => parseInt(a[0].replace('dag', '')) - parseInt(b[0].replace('dag', '')))
        .forEach(([, day], index) => {
          days.push({ id: Date.now() + index, name: day.name || `DAG ${index + 1}`, focus: day.focus || '', geschatteTijd: day.geschatteTijd || '60 minutes', exercises: (day.exercises || []).map((ex, i) => ({ ...ex, id: Date.now() + index + i + Math.random() })) })
        })
    }
    // Geen ' (Copy)' achter de naam: dit schema belandt één op één in de app van
    // de klant, en daar hoort geen werkaantekening van de coach in.
    history.reset({ name: template.name, description: template.description || '', primary_goal: template.primary_goal || 'muscle_gain', experience_level: template.experience_level || 'intermediate', split_type: template.split_type || 'custom', days_per_week: days.length, equipment: template.equipment || [], days })
    setShowTemplateManager(false)
  }

  const clientName = effectiveClient ? `${effectiveClient.first_name || ''} ${effectiveClient.last_name || ''}`.trim() : ''

  const DAY_ABBR = { maandag: 'Ma', dinsdag: 'Di', woensdag: 'Wo', donderdag: 'Do', vrijdag: 'Vr', zaterdag: 'Za', zondag: 'Zo' }
  const GOAL_LABELS = { afvallen: 'Afvallen', fat_loss: 'Afvallen', weight_loss: 'Afvallen', spieren: 'Spieropbouw', muscle_gain: 'Spieropbouw', recomp: 'Recomp', body_recomposition: 'Recomp', fitness: 'Fitter worden', general_fitness: 'Fitter worden' }
  const filteredClients = (clients || []).filter(c => {
    const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    return name.includes(clientSearch.toLowerCase())
  })

  useEffect(() => {
    const dagen = workoutPlan.days || []
    if (!dagen.length) { if (activeDay !== null) setActiveDay(null); return }
    if (!dagen.some(d => d.id === activeDay)) setActiveDay(dagen[0].id)
  }, [workoutPlan.days, activeDay])

  // Compacte stijl-tokens voor de header (leadsysteem-stijl, geen dikke velden).
  const cInput = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.82rem', minHeight: 36, outline: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const cSelect = { ...cInput, cursor: 'pointer', flex: 1, minWidth: 116 }

  // ── Intake, vertaald naar wat je nodig hebt om een schema te bouwen ────
  // Dezelfde gedachte als het klantpaneel in de Plan Analyzer bij voeding:
  // de antwoorden uit de intake staan ernaast terwijl je bouwt, zodat je niet
  // eerst naar het klantdossier hoeft. De velden komen uit verschillende
  // intake-versies en zijn lang niet allemaal gevuld; wat leeg is valt weg.
  const intake = (() => {
    if (!trainingInfo) return null
    const t = trainingInfo
    const eersteGetal = (...vals) => vals.map(v => parseInt(v, 10)).find(n => Number.isFinite(n) && n > 0) || null
    const tekst = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)

    const dagenPerWeek = eersteGetal(t.workout_days_per_week, t.days_per_week, t.training_days)
    const voorkeurDagen = Array.isArray(t.preferred_training_days) ? t.preferred_training_days : []
    // Werkdagen komen als object {ma: ..., di: ...}; alleen de dagen waar echt
    // iets staat zijn werkdagen.
    const werkdagen = t.work_schedule && typeof t.work_schedule === 'object'
      ? Object.entries(t.work_schedule).filter(([, v]) => v).map(([k]) => k)
      : []

    const regels = [
      { label: 'Ervaring',   waarde: tekst(t.training_experience) || tekst(t.experience) },
      { label: 'Doel',       waarde: GOAL_LABELS[t.primary_goal] || tekst(t.primary_goal) },
      { label: 'Dagen/week', waarde: dagenPerWeek ? `${dagenPerWeek}×` : null },
      { label: 'Duur',       waarde: t.minutes_per_session ? `${t.minutes_per_session} min` : null },
      { label: 'Voorkeur',   waarde: voorkeurDagen.length ? voorkeurDagen.map(d => DAY_ABBR[d] || d).join(' ') : null },
      { label: 'Intake-dagen', waarde: t.intakeDays?.length ? t.intakeDays.map(d => DAY_ABBR[d] || d).join(' ') : null },
      { label: 'Tijd',       waarde: t.training_time ? String(t.training_time).slice(0, 5) : null },
      { label: 'Werkdagen',  waarde: werkdagen.length ? werkdagen.map(d => DAY_ABBR[d] || d.slice(0, 2)).join(' ') : null },
      { label: 'Gym',        waarde: tekst(t.gym_name) },
      { label: 'Type',       waarde: tekst(t.workout_type) },
    ].filter(r => r.waarde)

    return { regels, blessures: tekst(t.injuries), dagenPerWeek }
  })()

  // Zet het aantal dagen uit de intake om in lege dagen in het plan. Alleen
  // aanvullen, nooit verwijderen — anders gooi je werk weg met één klik.
  const neemDagenOver = () => {
    const doel = intake?.dagenPerWeek
    if (!doel) return
    const tekort = doel - workoutPlan.days.length
    if (tekort <= 0) return
    // In één keer toevoegen. addEmptyDay() in een lus zou dat niet kunnen:
    // die gebruikt Date.now() als id, en binnen dezelfde milliseconde krijg je
    // dan dagen met hetzelfde id — React verwart ze en bewerkingen landen op
    // de verkeerde dag.
    const basis = Date.now()
    const nieuweDagen = Array.from({ length: tekort }, (_, i) => ({
      id: basis + i, name: '', focus: '', exercises: [], geschatteTijd: '60 minutes',
    }))
    setWorkoutPlan(prev => ({
      ...prev,
      days: [...prev.days, ...nieuweDagen],
      days_per_week: prev.days.length + tekort,
    }))
    setActiveDay(nieuweDagen[0].id)
  }

  // Zijpaneel-knop: plat, volle breedte, geen vakje eromheen.
  const zijKnop = (extra = {}) => ({
    display: 'flex', alignItems: 'center', gap: 7,
    width: '100%', padding: '0.3rem 0',
    background: 'none', border: 'none', fontFamily: 'inherit',
    fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer', textAlign: 'left',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    ...extra,
  })

  const actieveDag = workoutPlan.days.find(d => d.id === activeDay) || null
  const actieveIndex = workoutPlan.days.findIndex(d => d.id === activeDay)

  return (
    /* ══ 3/7-indeling — links sturen, rechts werken ══════════════════════
       Was één brede kopkaart met vier regels velden en tien knoppen op een
       rij, met daaronder een raster van dagkaarten van 350px. Bij zes dagen
       stond je te scrollen tussen even brede kolommen zonder te weten waar je
       was. Nu links het plan en de dagenlijst, rechts de dag waar je aan
       werkt over de volle breedte — zelfde patroon als de Plan Analyzer en
       het inzichtscherm. */
    <div style={{
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'stretch',
      height: isMobile ? 'auto' : 'calc(100vh - 120px)',
      overflow: 'hidden',
    }}>

      {/* ══════════════ LINKS (3) ══════════════ */}
      <div style={{
        flex: isMobile ? 'none' : '3 1 0',
        minWidth: 0,
        maxWidth: isMobile ? '100%' : 420,
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
        borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: isMobile ? '0.6rem 0.75rem' : '0.75rem 0.85rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>

        {/* Klant + schema */}
        {/* Linksboven blijft leeg: daar zweeft de Terug-knop van CoachHub. */}
        <div style={{ minHeight: 34 }} />

        {clientSchemas.length > 1 && (
          <select value={selectedSchemaId || ''} onChange={(e) => {
            const s = clientSchemas.find(x => x.id === e.target.value)
            if (s) loadSchemaIntoBuilder(s)
          }} style={cSelect}>
            {clientSchemas.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#0a0a0a' }}>
                {s._label || s.name}{s.is_client_edited ? ' · door client aangepast' : ''}
              </option>
            ))}
          </select>
        )}

        {/* ── Intake — de antwoorden van de klant, naast je werk ──────── */}
        {intake && (intake.regels.length > 0 || intake.blessures) && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.35rem' }}>
            <button onClick={() => setIntakeOpen(v => !v)} style={zijKnop({ color: '#fff', fontWeight: 900 })}>
              <ChevronDown size={14} style={{ transform: intakeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              Intake
              {intake.blessures && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b' }}>
                  <AlertTriangle size={12} /> blessure
                </span>
              )}
            </button>

            {intakeOpen && (
              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Blessures bovenaan en in amber: dat is een beperking op wat
                    je in het schema mag zetten, geen achtergrondinformatie. */}
                {intake.blessures && (
                  <div style={{
                    display: 'flex', gap: 6, alignItems: 'flex-start',
                    padding: '0.4rem 0', marginBottom: 2,
                    fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1.35,
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{intake.blessures}</span>
                  </div>
                )}

                {intake.regels.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: '0.8rem' }}>
                    <span style={{ flexShrink: 0, minWidth: 88, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{r.label}</span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: '#fff' }}>{r.waarde}</span>
                  </div>
                ))}

                {/* Eén actie: het aantal dagen uit de intake overnemen. Vult
                    alleen aan tot dat aantal; bestaande dagen blijven staan. */}
                {intake.dagenPerWeek > workoutPlan.days.length && (
                  <button onClick={neemDagenOver} style={zijKnop({ marginTop: 4, color: '#fff', fontWeight: 900 })}>
                    <Plus size={13} strokeWidth={2.8} />
                    Vul aan naar {intake.dagenPerWeek} dagen
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Dagen — dit is de navigatie ─────────────────────────────── */}
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {workoutPlan.days.length} {workoutPlan.days.length === 1 ? 'dag' : 'dagen'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {workoutPlan.days.map((day, index) => {
              const aan = day.id === activeDay
              const aantal = (day.exercises || []).length
              return (
                <button key={day.id} onClick={() => setActiveDay(day.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '0.3rem 0.5rem', borderRadius: 7,
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: `1px solid ${aan ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                    color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span style={{
                    flexShrink: 0, minWidth: 20, height: 20, borderRadius: 5,
                    background: aan ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: aan ? '#000' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.72rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{index + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: aan ? 900 : 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {day.name || `Dag ${index + 1}`}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {aantal}
                  </span>
                </button>
              )
            })}
            <button onClick={() => setShowDayPicker(true)} style={zijKnop({ padding: '0.3rem 0.5rem', color: '#fff', fontWeight: 900 })}>
              <Plus size={14} strokeWidth={2.8} /> Nieuwe dag
            </button>
          </div>
        </div>

        {/* ── Planinstellingen — dichtgeklapt; je stelt ze één keer in ─── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.35rem' }}>
          <button onClick={() => setInstellingenOpen(v => !v)} style={zijKnop({ color: '#fff', fontWeight: 900 })}>
            <ChevronDown size={14} style={{ transform: instellingenOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            Planinstellingen
          </button>
          {instellingenOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.4rem' }}>
              <input type="text" placeholder="Workout naam *" value={workoutPlan.name}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))} style={cInput}  placeholder={voorstelPlan(workoutPlan.days) || 'Naam van het plan'}/>
              <input type="text" placeholder="Beschrijving" value={workoutPlan.description}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, description: e.target.value }))} style={cInput} />
              <select value={workoutPlan.primary_goal} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, primary_goal: e.target.value }))} style={{ ...cSelect, flex: 'none' }}>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="fat_loss">Fat Loss</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="maintenance">Maintenance</option>
                <option value="recomp">Body Recomposition</option>
              </select>
              <select value={workoutPlan.experience_level} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, experience_level: e.target.value }))} style={{ ...cSelect, flex: 'none' }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Acties — onder elkaar i.p.v. tien knoppen op een rij ─────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Trainingsweek — de zeven dagen naast elkaar, per dag bladeren
              met pijltjes. Was een wizard van vier stappen; bij het plannen
              van een week wil je juist alles tegelijk zien, want je kijkt
              naar de spreiding en niet naar één dag.
              Vereist een klant én een opgeslagen schema: de dagen worden
              gekoppeld aan week_structure-sleutels van dat schema. */}
          <button onClick={() => setShowAgenda(true)}
            disabled={!effectiveClient || !selectedSchemaId}
            title={!effectiveClient ? 'Kies eerst een klant' : !selectedSchemaId ? 'Kies eerst een opgeslagen plan van deze klant' : 'De week van deze klant plannen'}
            style={zijKnop({ opacity: (!effectiveClient || !selectedSchemaId) ? 0.35 : 1, cursor: (!effectiveClient || !selectedSchemaId) ? 'not-allowed' : 'pointer' })}>
            <CalendarDays size={14} /> Trainingsweek
          </button>
          {/* Weekagenda van de klant: wat er al staat (trainingen, cardio,
              werk) voordat je iets inplant. */}
          <button onClick={() => setShowWeekAgenda(v => !v)}
            disabled={!effectiveClient}
            title={!effectiveClient ? 'Kies eerst een klant' : 'De week van deze klant'}
            style={zijKnop({ opacity: effectiveClient ? 1 : 0.35, cursor: effectiveClient ? 'pointer' : 'not-allowed', background: showWeekAgenda && effectiveClient ? 'rgba(255,255,255,0.1)' : 'none' })}>
            <Calendar size={14} /> Agenda
          </button>
          {/* Cardio hangt aan de klant, niet aan het schema: wandelen of
              fietsen wil je juist op de dagen dat er geen training staat. */}
          <button onClick={() => setShowCardio(true)}
            disabled={!effectiveClient}
            title={!effectiveClient ? 'Kies eerst een klant' : 'Cardio voor deze klant'}
            style={zijKnop({ opacity: effectiveClient ? 1 : 0.35, cursor: effectiveClient ? 'pointer' : 'not-allowed' })}>
            <Heart size={14} /> Cardio
          </button>
          <button onClick={() => setShowTemplateManager(true)} style={zijKnop()}>
            <FileText size={14} /> Templates
          </button>
          <button onClick={() => setShowExerciseLibrary(true)} style={zijKnop()}>
            <Video size={14} /> Video's
          </button>
          <button onClick={clearPlan} disabled={workoutPlan.days.length === 0 && !workoutPlan.name}
            style={zijKnop({ color: '#ef4444', opacity: (workoutPlan.days.length === 0 && !workoutPlan.name) ? 0.35 : 1 })}>
            <Trash2 size={14} /> Leegmaken
          </button>

          <div style={{ display: 'flex', gap: 6, marginTop: '0.25rem' }}>
            <button onClick={history.undo} disabled={!history.canUndo} title="Ongedaan maken"
              style={{ ...zijKnop({ width: 'auto', padding: '0.4rem 0.55rem' }), opacity: history.canUndo ? 1 : 0.3 }}>
              <Undo2 size={15} />
            </button>
            <button onClick={history.redo} disabled={!history.canRedo} title="Opnieuw"
              style={{ ...zijKnop({ width: 'auto', padding: '0.4rem 0.55rem' }), opacity: history.canRedo ? 1 : 0.3 }}>
              <Redo2 size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* ══════════════ RECHTS (7) ══════════════ */}
      <div style={{
        flex: isMobile ? 'none' : '7 1 0',
        minWidth: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: isMobile ? '0.75rem' : '1rem',
      }}>
        {/* ── Kopbalk, centraal: klant (tik = andere klant), plan, wissel,
            verwijder, plus (extra plan). Alles wat over "wie en welk plan"
            gaat staat hier; de zijbalk is voor het bouwen zelf. ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: isMobile ? '0.25rem 0 0.9rem' : '0.4rem 0 1.1rem' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowClientPicker(v => !v)} style={{ background: 'none', border: 'none', padding: '2px 6px', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Users size={12} /> {clientName || 'Kies een klant'} <ChevronDown size={12} strokeWidth={2.8} />
            </button>
            {showClientPicker && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', width: 280, maxHeight: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Search size={12} color="rgba(255,255,255,0.4)" />
                  <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Zoek klant…" style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, flex: 1, fontFamily: 'inherit' }} />
                  {clientSearch && <button onClick={() => setClientSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.4)' }}><X size={12} /></button>}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredClients.length === 0 && <div style={{ padding: '0.6rem 0.85rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Geen klanten gevonden</div>}
                  {filteredClients.map((c, i) => (
                    <button key={c.id} onClick={() => handleSelectLocalClient(c)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', borderBottom: i < filteredClients.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: '#fff', fontSize: '0.85rem', fontWeight: effectiveClient?.id === c.id ? 900 : 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', touchAction: 'manipulation' }}>
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {effectiveClient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, maxWidth: '100%' }}>
              {titelBewerk !== null ? (
                <input autoFocus value={titelBewerk} onChange={e => setTitelBewerk(e.target.value)} onBlur={bewaarTitel}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setTitelBewerk(null) }}
                  placeholder={voorstelPlan(workoutPlan.days) || 'Naam van het plan'}
                  style={{ minWidth: 0, width: isMobile ? 220 : 320, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '0.1rem 0.5rem', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
              ) : (
                <button onClick={() => setTitelBewerk(workoutPlan.name || huidigPlan?.name || '')} title="Klik om de naam aan te passen" style={{ minWidth: 0, background: 'none', border: 'none', padding: '0.1rem 0.5rem', borderRadius: 8, fontFamily: 'inherit', cursor: 'text', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: (workoutPlan.name || huidigPlan?.name) ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  {workoutPlan.name || huidigPlan?.name || (workoutPlan.days.length > 0 ? 'Naam van het plan…' : 'Nog geen plan')}
                </button>
              )}
              <button onClick={() => setShowPlanSwitch(true)} title="Wissel van plan (zelfde als bij de klant)" aria-label="Wissel van plan" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><RefreshCw size={15} strokeWidth={2.6} /></button>
              <button onClick={() => setShowPlanToevoegen(true)} title="Extra plan toevoegen" aria-label="Extra plan toevoegen" style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Plus size={16} strokeWidth={2.8} /></button>
              <button onClick={verwijderHuidigPlan} disabled={!huidigPlan} title="Dit plan verwijderen voor deze klant" aria-label="Plan verwijderen" style={{ ...{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: huidigPlan ? 'pointer' : 'not-allowed', opacity: huidigPlan ? 1 : 0.4 }}><Trash2 size={15} strokeWidth={2.6} /></button>
            </div>
          )}

          {/* Opslaan hoort bij "welk plan": twee losse knoppen, geen schakelaar
              die van betekenis verandert. Hier onder de titel, niet meer in
              de zijbalk tussen de bouwknoppen. */}
          {(() => {
            const geenDoel = !selectedSchemaId && !effectiveClient?.id
            const leeg = workoutPlan.days.length === 0
            const knop = (vol) => ({
              minHeight: 38, padding: '0 0.95rem', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff',
              border: vol ? 'none' : '1px solid rgba(255,255,255,0.25)',
              fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', whiteSpace: 'nowrap',
              cursor: saving ? 'wait' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            })
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={saveToClientSchema} disabled={saving || geenDoel || leeg}
                  title={geenDoel ? 'Kies eerst een klant' : undefined}
                  style={{ ...knop(true), opacity: (geenDoel || leeg) ? 0.45 : 1, cursor: geenDoel ? 'not-allowed' : undefined }}>
                  <Save size={14} strokeWidth={2.6} />
                  {saving ? 'Opslaan…' : selectedSchemaId ? 'Opslaan in klantplan' : effectiveClient?.id ? (clientSchemas.length > 0 ? 'Opslaan als extra plan' : `Eerste plan voor ${effectiveClient.first_name || 'klant'}`) : 'Opslaan in klantplan'}
                </button>
                <button onClick={() => setTemplateNaam(workoutPlan.name || '')} disabled={saving || leeg}
                  style={{ ...knop(false), opacity: leeg ? 0.45 : 1 }}>
                  <Save size={14} strokeWidth={2.6} /> Opslaan als template
                </button>
              </div>
            )
          })()}
          {!selectedSchemaId && (
            <div style={{ marginTop: 6, fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, maxWidth: 420 }}>
              {effectiveClient?.id
                ? (clientSchemas.length > 0
                  ? `Nieuw plan voor ${effectiveClient.first_name || 'deze klant'}. Opslaan zet het naast het huidige plan; actief maken doe je met de wisselknop.`
                  : `${effectiveClient.first_name || 'Deze klant'} heeft nog geen plan. Opslaan maakt het aan en zet het meteen actief.`)
                : 'Geen klant gekozen. Je wijzigingen gaan nergens heen tot je ze als template opslaat.'}
            </div>
          )}
        </div>
        {/* Cardio is ook een workout: altijd zichtbaar als de klant het heeft,
            ook (juist) zonder krachtplan. */}
        {effectiveClient && (
          <KlantCardioOverzicht client={effectiveClient} db={db} isMobile={isMobile} refreshKey={agendaKey} onOpen={() => setShowCardio(true)} />
        )}
        {showWeekAgenda && effectiveClient && (
          <div style={{ margin: isMobile ? '0.5rem' : '0.75rem 1rem 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap' }}>
                  Week van {effectiveClient.first_name || 'de klant'}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ id: 'rooster', label: 'Weekrooster' }, { id: 'uren', label: 'Agenda' }].map(w => (
                    <button key={w.id} onClick={() => setAgendaWeergave(w.id)} style={{
                      padding: '0.3rem 0.65rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                      background: agendaWeergave === w.id ? '#fff' : 'rgba(255,255,255,0.06)', color: agendaWeergave === w.id ? '#000' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${agendaWeergave === w.id ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    }}>{w.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowWeekAgenda(false)} aria-label="Agenda sluiten" style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} strokeWidth={2.6} />
              </button>
            </div>
            {agendaWeergave === 'rooster' ? (
              <div key={`rooster-${agendaKey}`} style={{ padding: isMobile ? '0.25rem 0 0.5rem' : '0.5rem 0 0.75rem' }}>
                <KlantWeekrooster client={effectiveClient} db={db} isMobile={isMobile} refreshKey={agendaKey} onSwitchPlan={() => setShowPlanSwitch(true)} />
              </div>
            ) : (
              <div style={{ height: isMobile ? 460 : 560, overflow: 'auto' }}>
                <ClientAgendaView client={effectiveClient} db={db} isMobile={isMobile} viewerRole="coach" refreshKey={agendaKey} />
              </div>
            )}
          </div>
        )}
        {actieveDag ? (
          <DayBuilder
            key={actieveDag.id} day={actieveDag} dayNumber={actieveIndex + 1} isActive
            onActivate={() => setActiveDay(actieveDag.id)}
            onUpdate={(updates) => updateDay(actieveDag.id, updates)}
            onDelete={() => deleteDay(actieveDag.id)}
            onDuplicate={() => duplicateDay(actieveDag.id)}
            onSaveTemplate={() => saveDayAsTemplate(actieveDag)}
            onAddExercise={() => { setActiveDay(actieveDag.id); setShowExerciseSelector(true) }}
            onUpdateExercise={(exerciseId, updates) => updateExercise(actieveDag.id, exerciseId, updates)}
            onDeleteExercise={(exerciseId) => deleteExercise(actieveDag.id, exerciseId)}
            isMobile={isMobile} db={db} client={effectiveClient}
          />
        ) : (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>Nog geen trainingsdagen</div>
            <button onClick={() => setShowDayPicker(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem',
              borderRadius: 8, border: 'none', background: '#fff', color: '#0a0a0a',
              fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <Plus size={15} strokeWidth={2.8} /> Eerste dag toevoegen
            </button>
          </div>
        )}
      </div>


      {showExerciseSelector && <ExerciseSelector onSelect={addExercise} onClose={() => setShowExerciseSelector(false)} isMobile={isMobile} db={db} selectedClient={effectiveClient} />}
      {/* Titel-venster voor een nieuwe template. Bewust een eigen naam: het plan
          in beeld heet vaak iets klantspecifieks, en dat wil je niet terugzien
          in je sjabloonlijst. Het plan zelf houdt zijn naam. */}
      {templateNaam !== null && createPortal(
        <div
          onClick={() => setTemplateNaam(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483200,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 420, background: '#0f0f0f',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
            padding: '1.1rem 1.2rem',
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              Opslaan als template
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              {workoutPlan.days.length} {workoutPlan.days.length === 1 ? 'dag' : 'dagen'} · komt in je sjabloonlijst, niet bij een klant
            </div>
            <input
              autoFocus
              value={templateNaam}
              onChange={(e) => setTemplateNaam(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && templateNaam.trim()) saveAsTemplate(templateNaam) }}
              placeholder="Bijvoorbeeld: PPL 5x — beginners"
              style={{
                width: '100%', minHeight: 44, padding: '0 0.75rem', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, color: '#fff', fontSize: '0.95rem', fontWeight: 800,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => saveAsTemplate(templateNaam)}
                disabled={saving || !String(templateNaam).trim()}
                style={{
                  flex: 1, minHeight: 42, borderRadius: 10, border: 'none',
                  background: '#fff', color: '#0a0a0a',
                  fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: String(templateNaam).trim() ? 1 : 0.45,
                }}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
              <button
                onClick={() => setTemplateNaam(null)}
                style={{
                  minWidth: 96, minHeight: 42, borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showTemplateManager && <TemplateManager templates={templates} onLoad={loadTemplate} onClose={() => setShowTemplateManager(false)} isMobile={isMobile} db={db} onChange={loadTemplates} />}
      {showDayPicker && (
        <DayTemplatePickerModal
          templates={dayTemplates}
          onPickEmpty={addEmptyDay}
          onPickTemplate={addDayFromTemplate}
          onDeleteTemplate={deleteDayTemplate}
          onClose={() => setShowDayPicker(false)}
          isMobile={isMobile}
        />
      )}
      {showAgenda && effectiveClient && (
        <WeekPlanner
          workoutService={workoutService}
          clientId={effectiveClient.id}
          clientNaam={`${effectiveClient.first_name || ''} ${effectiveClient.last_name || ''}`.trim()}
          schema={{ week_structure: buildWeekStructure() }}
          voorkeurDagen={effectiveClient?.preferred_training_days || []}
          // Bewust niet sluiten na opslaan: je plant een week in meerdere
          // zetten en wil daarna zien wat er staat. Het venster meldt zelf
          // dat alles bewaard is; sluiten doe je met het kruisje.
          onClose={() => setShowAgenda(false)}
        />
      )}

      {showCardio && effectiveClient && (
        <CardioPlanModal client={effectiveClient} db={db} isMobile={isMobile} onClose={() => { setShowCardio(false); setAgendaKey(k => k + 1) }} />
      )}

      {showPlanToevoegen && effectiveClient && (
        <PlanToevoegenModal client={effectiveClient} templates={templates} db={db} isMobile={isMobile}
          onClose={() => setShowPlanToevoegen(false)}
          onNieuw={nieuwPlanVoorKlant}
          onToegevoegd={() => herlaadKlant()} />
      )}
      {showPlanSwitch && effectiveClient && (
        <PlanSwitchModal client={effectiveClient} db={db} isMobile={isMobile} viewerRole="coach"
          onClose={() => setShowPlanSwitch(false)}
          onActivated={async () => { setShowPlanSwitch(false); await herlaadKlant() }} />
      )}

      <ExerciseLibraryModal
        isOpen={showExerciseLibrary}
        onClose={() => setShowExerciseLibrary(false)}
        db={db}
        isMobile={isMobile}
      />

      <PDFExportButton workoutPlan={workoutPlan} db={db} isMobile={isMobile} />
    </div>
  )
}
