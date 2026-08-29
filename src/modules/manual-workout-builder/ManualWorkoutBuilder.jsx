// src/modules/manual-workout-builder/ManualWorkoutBuilder.jsx
import { useState, useEffect } from 'react'
import useHistoryState from './hooks/useHistoryState'
import { Undo2, Redo2 } from 'lucide-react'
import DayBuilder from './components/DayBuilder'
import ExerciseSelector from './components/ExerciseSelector'
import TemplateManager from './components/TemplateManager'
import DayTemplatePickerModal from './components/DayTemplatePickerModal'
import ClientAssigner from './components/ClientAssigner'
import ClientPlanManagerModal from './components/ClientPlanManagerModal'
import { Activity, Plus, Save, Users, FileText, ChevronDown, Video, Trash2, Search, X, Calendar } from 'lucide-react'
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
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showClientAssigner, setShowClientAssigner] = useState(false)
  const [showPlanManager, setShowPlanManager] = useState(false)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState([])
  const [dayTemplates, setDayTemplates] = useState([])
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [clientSchemas, setClientSchemas] = useState([])
  const [selectedSchemaId, setSelectedSchemaId] = useState(null)
  const [showSchemaPicker, setShowSchemaPicker] = useState(false)
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
  }, [selectedClient?.id])

  const loadClientSchemas = async (client, openAssigner = true) => {
    if (!client) return
    try {
      const schemas = await db.getClientSchemas(client.id)
      setClientSchemas(schemas || [])
      if (schemas?.length > 0) loadSchemaIntoBuilder(schemas[0])
    } catch (e) {
      console.error('❌ getClientSchemas failed, falling back:', e)
      try {
        const schema = await db.getClientSchema(client.id)
        if (schema) loadSchemaIntoBuilder(schema)
      } catch {}
    }
    if (openAssigner) setShowClientAssigner(true)
  }

  const loadTrainingInfo = async (clientId) => {
    try {
      const { data: cd } = await db.supabase.from('clients')
        .select('preferred_training_days, primary_goal, work_schedule, first_name, last_name')
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
    await loadClientSchemas(client, false)
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
    setShowSchemaPicker(false)
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

  const duplicateDay = (dayId) => {
    const dayToCopy = workoutPlan.days.find(d => d.id === dayId)
    if (!dayToCopy) return
    const newDay = { ...dayToCopy, id: Date.now(), name: `${dayToCopy.name} (Copy)`, exercises: dayToCopy.exercises.map(ex => ({ ...ex, id: Date.now() + Math.random() })) }
    setWorkoutPlan(prev => ({ ...prev, days: [...prev.days, newDay], days_per_week: prev.days.length + 1 }))
  }

  const addExercise = (exercise) => {
    if (!activeDay) return
    const newExercise = {
      id: Date.now(), name: exercise.name, sets: exercise.sets || 3, reps: exercise.reps || '8-12',
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

  // Cardio-item toevoegen aan een dag. Rijdt mee in dezelfde exercises-array
  // als een gewoon item, maar met type:'cardio' + eigen velden (duur/afstand/
  // intensiteit). Coach verfijnt de waarden inline in de kaart.
  const addCardioToDay = (dayId) => {
    const newItem = {
      id: Date.now(), type: 'cardio', name: 'Hardlopen',
      duration: '20 min', distance: '', intensity: 'Matig', notes: '',
    }
    setWorkoutPlan(prev => ({ ...prev, days: prev.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, newItem] } : d) }))
    setActiveDay(dayId)
  }

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
          name: ex.name, sets: parseInt(ex.sets) || 3, reps: ex.reps, rust: ex.rust, rpe: ex.rpe,
          equipment: ex.equipment, primairSpieren: ex.primairSpieren, notes: ex.notes || '',
          type: ex.type || 'compound', stretch: ex.stretch || false, priority: ex.priority || 1, goalPriority: ex.goalPriority || false
        }))
      }
    })
    return ws
  }

  const saveAsTemplate = async () => {
    if (!workoutPlan.name) { alert('Geef je workout plan een naam'); return }
    if (workoutPlan.days.length === 0) { alert('Voeg minimaal één dag toe'); return }
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) { alert('Je moet ingelogd zijn'); return }
      const { error } = await db.supabase.from('workout_schemas').insert({
        name: workoutPlan.name, description: workoutPlan.description || '', user_id: user.id,
        primary_goal: workoutPlan.primary_goal, experience_level: workoutPlan.experience_level,
        split_type: workoutPlan.split_type, days_per_week: workoutPlan.days.length, time_per_session: 60,
        week_structure: buildWeekStructure(), equipment: workoutPlan.equipment.slice(0, 10),
        is_template: true, is_ai_generated: false, is_public: false,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      })
      if (error) throw error
      alert('✅ Template opgeslagen!')
      await loadTemplates()
    } catch (e) { alert('❌ Fout bij opslaan: ' + e.message) }
    finally { setSaving(false) }
  }

  const saveToClientSchema = async () => {
    if (!selectedSchemaId) { alert('Geen client schema geselecteerd'); return }
    if (!workoutPlan.name) { alert('Geef het plan een naam'); return }
    if (!confirm('Weet je zeker dat je dit client plan wilt overschrijven?')) return
    setSaving(true)
    try {
      const { error } = await db.supabase.from('workout_schemas').update({
        name: workoutPlan.name, description: workoutPlan.description || '',
        week_structure: buildWeekStructure(), days_per_week: workoutPlan.days.length,
        updated_at: new Date().toISOString()
      }).eq('id', selectedSchemaId)
      if (error) throw error
      alert('✅ Client plan opgeslagen!')
    } catch (e) { alert('❌ Fout bij opslaan: ' + e.message) }
    finally { setSaving(false) }
  }

  // Leegmaken: reset het hele plan naar leeg om vers te beginnen. Met bevestiging.
  const clearPlan = () => {
    if (workoutPlan.days.length === 0 && !workoutPlan.name) return
    if (!confirm('Hele plan leegmaken? Alle dagen en oefeningen worden gewist.')) return
    setWorkoutPlan({
      name: '', description: '', primary_goal: 'muscle_gain',
      experience_level: 'intermediate', split_type: 'custom',
      days_per_week: 0, equipment: [], days: []
    })
    setSelectedSchemaId(null)
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
    history.reset({ name: template.name + ' (Copy)', description: template.description || '', primary_goal: template.primary_goal || 'muscle_gain', experience_level: template.experience_level || 'intermediate', split_type: template.split_type || 'custom', days_per_week: days.length, equipment: template.equipment || [], days })
    setShowTemplateManager(false)
  }

  const activeSchema = clientSchemas.find(s => s.id === selectedSchemaId)
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
  const cBtn = (accent) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', minHeight: 36, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: accent ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${accent ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`, color: accent ? '#FFD700' : 'rgba(255,255,255,0.8)' })

  // Zijpaneel-knop: plat, volle breedte, geen vakje eromheen.
  const zijKnop = (extra = {}) => ({
    display: 'flex', alignItems: 'center', gap: 7,
    width: '100%', padding: '0.45rem 0',
    background: 'none', border: 'none', fontFamily: 'inherit',
    fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)',
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
        padding: isMobile ? '0.75rem' : '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.85rem',
      }}>

        {/* Klant + schema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            {clientName || 'Workout Builder'}
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowClientPicker(!showClientPicker)} style={zijKnop({ width: 'auto', padding: 0, fontSize: '0.78rem', color: '#fff' })}>
              <Users size={13} /> {effectiveClient ? 'Wissel' : 'Klant laden'}
            </button>
            {showClientPicker && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', minWidth: 240, maxHeight: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Search size={12} color="rgba(255,255,255,0.4)" />
                  <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Zoek klant…" style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.8rem', flex: 1, fontFamily: 'inherit' }} />
                  {clientSearch && <button onClick={() => setClientSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.4)' }}><X size={12} /></button>}
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredClients.length === 0 && <div style={{ padding: '0.6rem 0.85rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Geen klanten gevonden</div>}
                  {filteredClients.map((c, i) => (
                    <button key={c.id} onClick={() => handleSelectLocalClient(c)}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'transparent', border: 'none', borderBottom: i < filteredClients.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', color: '#fff', fontSize: '0.8rem', fontWeight: effectiveClient?.id === c.id ? 900 : 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', touchAction: 'manipulation' }}>
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* ── Dagen — dit is de navigatie ─────────────────────────────── */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
            {workoutPlan.days.length} {workoutPlan.days.length === 1 ? 'dag' : 'dagen'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {workoutPlan.days.map((day, index) => {
              const aan = day.id === activeDay
              const aantal = (day.exercises || []).length
              return (
                <button key={day.id} onClick={() => setActiveDay(day.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '0.5rem 0.6rem', borderRadius: 8,
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: `1px solid ${aan ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                    color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                  <span style={{
                    flexShrink: 0, minWidth: 22, height: 22, borderRadius: 6,
                    background: aan ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: aan ? '#000' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.72rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{index + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: aan ? 900 : 700, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {day.name || `Dag ${index + 1}`}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {aantal}
                  </span>
                </button>
              )
            })}
            <button onClick={() => setShowDayPicker(true)} style={zijKnop({ padding: '0.5rem 0.6rem', color: '#fff', fontWeight: 900 })}>
              <Plus size={14} strokeWidth={2.8} /> Nieuwe dag
            </button>
          </div>
        </div>

        {/* ── Planinstellingen — dichtgeklapt; je stelt ze één keer in ─── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.6rem' }}>
          <button onClick={() => setInstellingenOpen(v => !v)} style={zijKnop({ color: '#fff', fontWeight: 900 })}>
            <ChevronDown size={14} style={{ transform: instellingenOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            Planinstellingen
          </button>
          {instellingenOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.4rem' }}>
              <input type="text" placeholder="Workout naam *" value={workoutPlan.name}
                onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))} style={cInput} />
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

              {/* Intake-voorkeuren van de klant — alleen relevant bij het opzetten. */}
              {trainingInfo && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                  <Calendar size={12} style={{ flexShrink: 0 }} />
                  {trainingInfo.preferred_training_days?.length > 0 && (
                    <>Voorkeur: {trainingInfo.preferred_training_days.map(d => DAY_ABBR[d] || d).join(' ')}</>
                  )}
                  {trainingInfo.intakeDays?.length > 0 && (
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>· intake {trainingInfo.intakeDays.map(d => DAY_ABBR[d] || d).join(' ')}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Acties — onder elkaar i.p.v. tien knoppen op een rij ─────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button onClick={() => setShowPlanManager(true)} style={zijKnop({ color: '#fff', fontWeight: 900 })}>
            <Users size={14} /> Plannen toewijzen
          </button>
          <button onClick={() => setShowClientAssigner(true)} disabled={workoutPlan.days.length === 0}
            style={zijKnop({ opacity: workoutPlan.days.length === 0 ? 0.35 : 1, cursor: workoutPlan.days.length === 0 ? 'not-allowed' : 'pointer' })}>
            <Users size={14} /> Huidig plan toewijzen
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

          <div style={{ display: 'flex', gap: 6, marginTop: '0.5rem' }}>
            <button onClick={history.undo} disabled={!history.canUndo} title="Ongedaan maken"
              style={{ ...zijKnop({ width: 'auto', padding: '0.4rem 0.55rem' }), opacity: history.canUndo ? 1 : 0.3 }}>
              <Undo2 size={15} />
            </button>
            <button onClick={history.redo} disabled={!history.canRedo} title="Opnieuw"
              style={{ ...zijKnop({ width: 'auto', padding: '0.4rem 0.55rem' }), opacity: history.canRedo ? 1 : 0.3 }}>
              <Redo2 size={15} />
            </button>
          </div>

          {/* Eén primaire actie onderaan. */}
          <button onClick={selectedSchemaId ? saveToClientSchema : saveAsTemplate}
            disabled={saving || workoutPlan.days.length === 0 || (!selectedSchemaId && !workoutPlan.name)}
            style={{
              marginTop: '0.5rem', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '0.6rem', borderRadius: 8, border: 'none',
              background: '#fff', color: '#0a0a0a',
              fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: saving ? 'wait' : 'pointer',
              opacity: (workoutPlan.days.length === 0 || (!selectedSchemaId && !workoutPlan.name)) ? 0.45 : 1,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            <Save size={15} strokeWidth={2.6} />
            {saving ? 'Opslaan…' : selectedSchemaId ? 'Opslaan in client plan' : 'Opslaan als template'}
          </button>
        </div>
      </div>

      {/* ══════════════ RECHTS (7) ══════════════ */}
      <div style={{
        flex: isMobile ? 'none' : '7 1 0',
        minWidth: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: isMobile ? '0.75rem' : '1rem',
      }}>
        {actieveDag ? (
          <DayBuilder
            key={actieveDag.id} day={actieveDag} dayNumber={actieveIndex + 1} isActive
            onActivate={() => setActiveDay(actieveDag.id)}
            onUpdate={(updates) => updateDay(actieveDag.id, updates)}
            onDelete={() => deleteDay(actieveDag.id)}
            onDuplicate={() => duplicateDay(actieveDag.id)}
            onSaveTemplate={() => saveDayAsTemplate(actieveDag)}
            onAddExercise={() => { setActiveDay(actieveDag.id); setShowExerciseSelector(true) }}
            onAddCardio={() => addCardioToDay(actieveDag.id)}
            onUpdateExercise={(exerciseId, updates) => updateExercise(actieveDag.id, exerciseId, updates)}
            onDeleteExercise={(exerciseId) => deleteExercise(actieveDag.id, exerciseId)}
            isMobile={isMobile} db={db} client={effectiveClient}
          />
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>Nog geen dagen</div>
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
      {showClientAssigner && <ClientAssigner clients={clients} workoutPlan={workoutPlan} db={db} initialClient={effectiveClient || null} onClose={() => setShowClientAssigner(false)} isMobile={isMobile} />}
      {showPlanManager && <ClientPlanManagerModal clients={clients} templates={templates} db={db} isMobile={isMobile} onClose={() => setShowPlanManager(false)} onEditInBuilder={(schema) => { loadSchemaIntoBuilder(schema); setShowPlanManager(false) }} />}

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
