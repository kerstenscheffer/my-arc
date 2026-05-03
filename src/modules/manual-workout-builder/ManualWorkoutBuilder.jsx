// src/modules/manual-workout-builder/ManualWorkoutBuilder.jsx
import { useState, useEffect } from 'react'
import DayBuilder from './components/DayBuilder'
import ExerciseSelector from './components/ExerciseSelector'
import TemplateManager from './components/TemplateManager'
import ClientAssigner from './components/ClientAssigner'
import { Activity, Plus, Save, Users, FileText, ChevronDown } from 'lucide-react'
import PDFExportButton from './components/PDFExportButton'

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
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState([])
  const [clientSchemas, setClientSchemas] = useState([])
  const [selectedSchemaId, setSelectedSchemaId] = useState(null)
  const [showSchemaPicker, setShowSchemaPicker] = useState(false)

  useEffect(() => { loadTemplates() }, [])

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

  const addDay = () => {
    const newDay = { id: Date.now(), name: '', focus: '', exercises: [], geschatteTijd: '60 minutes' }
    setWorkoutPlan(prev => ({ ...prev, days: [...prev.days, newDay], days_per_week: prev.days.length + 1 }))
    setActiveDay(newDay.id)
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
        exercises: day.exercises.map(ex => ({
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

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ background: 'rgba(17,17,17,0.8)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Activity size={24} color="#10b981" />
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Manual Workout Builder
          </h1>
          {selectedClient && (
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
              {clientName}
            </span>
          )}

          {/* Schema picker */}
          {clientSchemas.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSchemaPicker(!showSchemaPicker)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {activeSchema?._label || activeSchema?.name || 'Schema kiezen'}
                <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: showSchemaPicker ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {showSchemaPicker && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {clientSchemas.map((s, i) => (
                    <button key={s.id} onClick={() => loadSchemaIntoBuilder(s)}
                      style={{ width: '100%', padding: '0.75rem 1rem', background: selectedSchemaId === s.id ? 'rgba(255,215,0,0.08)' : 'transparent', border: 'none', borderBottom: i < clientSchemas.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: selectedSchemaId === s.id ? '#FFD700' : '#fff', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                      <div>{s._label || s.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>
                        {s.is_client_edited ? 'Aangepast door client' : 'Origineel coachplan'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
          <input type="text" placeholder="Workout naam... *" value={workoutPlan.name} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, name: e.target.value }))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }} />
          <input type="text" placeholder="Beschrijving..." value={workoutPlan.description} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, description: e.target.value }))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Primary Goal *</label>
            <select value={workoutPlan.primary_goal} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, primary_goal: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', cursor: 'pointer', minHeight: '44px' }}>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="fat_loss">Fat Loss</option>
              <option value="strength">Strength</option>
              <option value="endurance">Endurance</option>
              <option value="maintenance">Maintenance</option>
              <option value="recomp">Body Recomposition</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Experience Level *</label>
            <select value={workoutPlan.experience_level} onChange={(e) => setWorkoutPlan(prev => ({ ...prev, experience_level: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: isMobile ? '0.9rem' : '1rem', cursor: 'pointer', minHeight: '44px' }}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Days Per Week</label>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#10b981', fontSize: isMobile ? '0.9rem' : '1rem', minHeight: '44px', display: 'flex', alignItems: 'center', fontWeight: '600' }}>
              {workoutPlan.days.length} dagen
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowTemplateManager(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#8b5cf6', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>
            <FileText size={16} /> Templates
          </button>
          <button onClick={saveAsTemplate} disabled={saving || workoutPlan.days.length === 0 || !workoutPlan.name} style={{ padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: saving || !workoutPlan.name ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: workoutPlan.days.length === 0 || !workoutPlan.name ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>
            <Save size={16} /> {saving ? 'Opslaan...' : 'Save Template'}
          </button>

          {selectedSchemaId && (
            <button onClick={saveToClientSchema} disabled={saving} style={{ padding: '0.5rem 1rem', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>
              <Save size={16} /> {saving ? 'Opslaan...' : 'Opslaan in client plan'}
            </button>
          )}

          <button onClick={() => setShowClientAssigner(true)} disabled={workoutPlan.days.length === 0} style={{ padding: '0.5rem 1rem', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#3b82f6', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: workoutPlan.days.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: workoutPlan.days.length === 0 ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}>
            <Users size={16} /> Assign to Clients
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {workoutPlan.days.map((day, index) => (
          <DayBuilder key={day.id} day={day} dayNumber={index + 1} isActive={activeDay === day.id}
            onActivate={() => setActiveDay(day.id)} onUpdate={(updates) => updateDay(day.id, updates)}
            onDelete={() => deleteDay(day.id)} onDuplicate={() => duplicateDay(day.id)}
            onAddExercise={() => { setActiveDay(day.id); setShowExerciseSelector(true) }}
            onUpdateExercise={(exerciseId, updates) => updateExercise(day.id, exerciseId, updates)}
            onDeleteExercise={(exerciseId) => deleteExercise(day.id, exerciseId)} isMobile={isMobile} />
        ))}
        <button onClick={addDay} style={{ background: 'rgba(16,185,129,0.1)', border: '2px dashed rgba(16,185,129,0.3)', borderRadius: '16px', padding: isMobile ? '2rem' : '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', minHeight: isMobile ? '150px' : '200px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)' }}>
          <Plus size={32} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>Nieuwe Dag Toevoegen</span>
        </button>
      </div>

      {showExerciseSelector && <ExerciseSelector onSelect={addExercise} onClose={() => setShowExerciseSelector(false)} isMobile={isMobile} db={db} selectedClient={selectedClient} />}
      {showTemplateManager && <TemplateManager templates={templates} onLoad={loadTemplate} onClose={() => setShowTemplateManager(false)} isMobile={isMobile} />}
      {showClientAssigner && <ClientAssigner clients={clients} workoutPlan={workoutPlan} db={db} initialClient={selectedClient || null} onClose={() => setShowClientAssigner(false)} isMobile={isMobile} />}

      <PDFExportButton workoutPlan={workoutPlan} db={db} isMobile={isMobile} />
    </div>
  )
}
