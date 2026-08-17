// src/modules/manual-workout-builder/ManualWorkoutBuilder.jsx
import { useState, useEffect } from 'react'
import DayBuilder from './components/DayBuilder'
import ExerciseSelector from './components/ExerciseSelector'
import TemplateManager from './components/TemplateManager'
import DayTemplatePickerModal from './components/DayTemplatePickerModal'
import ClientAssigner from './components/ClientAssigner'
import ClientPlanManagerModal from './components/ClientPlanManagerModal'
import { Activity, Plus, Save, Users, FileText, ChevronDown, Video } from 'lucide-react'
import PDFExportButton from './components/PDFExportButton'
import ExerciseLibraryModal from './components/ExerciseLibraryModal'

export default function ManualWorkoutBuilder({ db, clients, selectedClient }) {
  const isMobile = window.innerWidth <= 768

  const [workoutPlan, setWorkoutPlan] = useState({
    name: '', description: '', primary_goal: 'muscle_gain',
    experience_level: 'intermediate', split_type: 'custom',
    days_per_week: 0, equipment: [], days: []
  })
  const [activeDay, setActiveDay] = useState(null)
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

  useEffect(() => { loadTemplates(); loadDayTemplates() }, [])

  useEffect(() => {
    if (!selectedClient) return
    loadClientSchemas()
  }, [selectedClient?.id])

  const loadClientSchemas = async () => {
    try {
      const schemas = await db.getClientSchemas(selectedClient.id)
      setClientSchemas(schemas || [])
      if (schemas?.length > 0) loadSchemaIntoBuilder(schemas[0])
    } catch (e) {
      console.error('❌ getClientSchemas failed, falling back:', e)
      try {
        const schema = await db.getClientSchema(selectedClient.id)
        if (schema) loadSchemaIntoBuilder(schema)
      } catch {}
    }
    setShowClientAssigner(true)
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
    setWorkoutPlan({
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

  const loadTemplate = (template) => {
    const days = []
    if (template.week_structure) {
      Object.entries(template.week_structure)
        .sort((a, b) => parseInt(a[0].replace('dag', '')) - parseInt(b[0].replace('dag', '')))
        .forEach(([, day], index) => {
          days.push({ id: Date.now() + index, name: day.name || `DAG ${index + 1}`, focus: day.focus || '', geschatteTijd: day.geschatteTijd || '60 minutes', exercises: (day.exercises || []).map((ex, i) => ({ ...ex, id: Date.now() + index + i + Math.random() })) })
        })
    }
    setWorkoutPlan({ name: template.name + ' (Copy)', description: template.description || '', primary_goal: template.primary_goal || 'muscle_gain', experience_level: template.experience_level || 'intermediate', split_type: template.split_type || 'custom', days_per_week: days.length, equipment: template.equipment || [], days })
    setShowTemplateManager(false)
  }

  const activeSchema = clientSchemas.find(s => s.id === selectedSchemaId)
  const clientName = selectedClient ? `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() : ''

  // Compacte stijl-tokens voor de header (leadsysteem-stijl, geen dikke velden).
  const cInput = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.45rem 0.6rem', color: '#fff', fontSize: '0.82rem', minHeight: 36, outline: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const cSelect = { ...cInput, cursor: 'pointer', flex: 1, minWidth: 116 }
  const cBtn = (accent) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', minHeight: 36, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: accent ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${accent ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`, color: accent ? '#FFD700' : 'rgba(255,255,255,0.8)' })

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ background: '#141414', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: isMobile ? '0.8rem' : '1rem', marginBottom: '1rem' }}>

        {/* Regel 1: compacte titel + client + schema · bibliotheek rechts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <Activity size={16} color="#FFD700" />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Workout Builder</span>
          {selectedClient && (
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 5, padding: '0.15rem 0.45rem' }}>{clientName}</span>
          )}
          {clientSchemas.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSchemaPicker(!showSchemaPicker)} style={{ ...cBtn(false), fontSize: '0.72rem' }}>
                {activeSchema?._label || activeSchema?.name || 'Schema'}
                <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: showSchemaPicker ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {showSchemaPicker && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {clientSchemas.map((s, i) => (
                    <button key={s.id} onClick={() => loadSchemaIntoBuilder(s)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', background: selectedSchemaId === s.id ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', borderBottom: i < clientSchemas.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: selectedSchemaId === s.id ? '#FFD700' : '#fff', fontSize: '0.76rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                      <div>{s._label || s.name}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>
                        {s.is_client_edited ? 'Aangepast door client' : 'Origineel coachplan'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowExerciseLibrary(true)} title="Bibliotheek · video's koppelen" style={cBtn(false)}>
            <Video size={13} /> Video's
          </button>
        </div>

        {/* Regel 2: naam + beschrijving */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <input type="text" placeholder="Workout naam *" value={workoutPlan.name} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))} style={{ ...cInput, flex: 2, minWidth: 140 }} />
          <input type="text" placeholder="Beschrijving (optioneel)" value={workoutPlan.description} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, description: e.target.value }))} style={{ ...cInput, flex: 3, minWidth: 140 }} />
        </div>

        {/* Regel 3: doel + niveau + dagen (compact, geen losse labels) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <select value={workoutPlan.primary_goal} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, primary_goal: e.target.value }))} style={cSelect}>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="fat_loss">Fat Loss</option>
            <option value="strength">Strength</option>
            <option value="endurance">Endurance</option>
            <option value="maintenance">Maintenance</option>
            <option value="recomp">Body Recomposition</option>
          </select>
          <select value={workoutPlan.experience_level} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, experience_level: e.target.value }))} style={cSelect}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <span style={{ ...cInput, display: 'flex', alignItems: 'center', color: '#FFD700', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {workoutPlan.days.length} dagen
          </span>
        </div>

        {/* Regel 4: acties (compact) */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowTemplateManager(true)} style={cBtn(false)}>
            <FileText size={14} /> Templates
          </button>
          <button onClick={saveAsTemplate} disabled={saving || workoutPlan.days.length === 0 || !workoutPlan.name} style={{ ...cBtn(true), cursor: saving || !workoutPlan.name ? 'not-allowed' : 'pointer', opacity: workoutPlan.days.length === 0 || !workoutPlan.name ? 0.5 : 1 }}>
            <Save size={14} /> {saving ? 'Opslaan…' : 'Save Template'}
          </button>
          {selectedSchemaId && (
            <button onClick={saveToClientSchema} disabled={saving} style={{ ...cBtn(true), cursor: saving ? 'not-allowed' : 'pointer' }}>
              <Save size={14} /> {saving ? 'Opslaan…' : 'Opslaan in client plan'}
            </button>
          )}
          <button onClick={() => setShowClientAssigner(true)} disabled={workoutPlan.days.length === 0} style={{ ...cBtn(false), cursor: workoutPlan.days.length === 0 ? 'not-allowed' : 'pointer', opacity: workoutPlan.days.length === 0 ? 0.5 : 1 }}>
            <Users size={14} /> Huidig plan toewijzen
          </button>
          <button onClick={() => setShowPlanManager(true)} style={cBtn(true)}>
            <Users size={14} /> Plannen toewijzen
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {workoutPlan.days.map((day, index) => (
          <DayBuilder key={day.id} day={day} dayNumber={index + 1} isActive={activeDay === day.id}
            onActivate={() => setActiveDay(day.id)} onUpdate={(updates) => updateDay(day.id, updates)}
            onDelete={() => deleteDay(day.id)} onDuplicate={() => duplicateDay(day.id)}
            onSaveTemplate={() => saveDayAsTemplate(day)}
            onAddExercise={() => { setActiveDay(day.id); setShowExerciseSelector(true) }}
            onAddCardio={() => addCardioToDay(day.id)}
            onUpdateExercise={(exerciseId, updates) => updateExercise(day.id, exerciseId, updates)}
            onDeleteExercise={(exerciseId) => deleteExercise(day.id, exerciseId)} isMobile={isMobile}
            db={db} client={selectedClient} />
        ))}
        <button onClick={() => setShowDayPicker(true)} style={{ background: 'rgba(212,175,55,0.07)', border: '2px dashed rgba(212,175,55,0.3)', borderRadius: '16px', padding: isMobile ? '2rem' : '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: isMobile ? '150px' : '200px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.15)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.07)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}>
          <Plus size={32} color="#FFD700" />
          <span style={{ color: '#FFD700', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>Nieuwe Dag Toevoegen</span>
        </button>
      </div>

      {showExerciseSelector && <ExerciseSelector onSelect={addExercise} onClose={() => setShowExerciseSelector(false)} isMobile={isMobile} db={db} selectedClient={selectedClient} />}
      {showTemplateManager && <TemplateManager templates={templates} onLoad={loadTemplate} onClose={() => setShowTemplateManager(false)} isMobile={isMobile} />}
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
      {showClientAssigner && <ClientAssigner clients={clients} workoutPlan={workoutPlan} db={db} initialClient={selectedClient || null} onClose={() => setShowClientAssigner(false)} isMobile={isMobile} />}
      {showPlanManager && <ClientPlanManagerModal clients={clients} templates={templates} db={db} isMobile={isMobile} onClose={() => setShowPlanManager(false)} />}

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
