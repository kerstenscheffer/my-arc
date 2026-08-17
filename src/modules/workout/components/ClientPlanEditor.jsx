// src/modules/workout/components/ClientPlanEditor.jsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Plus, Search, Check, AlertCircle, Copy, Edit2, ChevronDown, ChevronUp, Moon } from 'lucide-react'
import ClientPlanEditorService from '../services/ClientPlanEditorService'

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEK_DAYS_NL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

// Standaard dag-koppeling op basis van index
const DEFAULT_DAY_MAPPING = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const getFallbackImage = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('chest') || n.includes('bench') || n.includes('borst') || n.includes('push')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=120&h=120&fit=crop&q=60'
  if (n.includes('back') || n.includes('row') || n.includes('rug') || n.includes('pull') || n.includes('lat')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=120&h=120&fit=crop&q=60'
  if (n.includes('leg') || n.includes('squat') || n.includes('been') || n.includes('quad') || n.includes('lunge')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=120&h=120&fit=crop&q=60'
  if (n.includes('shoulder') || n.includes('schouder') || n.includes('delt')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=120&h=120&fit=crop&q=60'
  if (n.includes('bicep') || n.includes('tricep') || n.includes('curl') || n.includes('arm')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=120&h=120&fit=crop&q=60'
  if (n.includes('core') || n.includes('ab') || n.includes('plank')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&h=120&fit=crop&q=60'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=120&fit=crop&q=60'
}

export default function ClientPlanEditor({ schema, client, db, weekSchedule: initialWeekSchedule, onClose, onSchemaSaved }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [localStructure, setLocalStructure] = useState(null)
  const [localWeekSchedule, setLocalWeekSchedule] = useState({})
  const [forkedSchemaId, setForkedSchemaId] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [expandedDay, setExpandedDay] = useState(null)
  const [editingDayName, setEditingDayName] = useState(null)
  const [dayNameValue, setDayNameValue] = useState('')
  const [showAddExercise, setShowAddExercise] = useState(null)
  const [copySheet, setCopySheet] = useState(null) // workoutKey om van te kopiëren
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const searchTimeout = useRef(null)
  const service = useRef(null)

  useEffect(() => {
    service.current = new ClientPlanEditorService(db.supabase)
    setTimeout(() => setVisible(true), 50)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    if (schema?.week_structure) {
      if (schema.is_client_edited) setForkedSchemaId(schema.id)
      setLocalStructure(JSON.parse(JSON.stringify(schema.week_structure)))
    }
    if (initialWeekSchedule) {
      setLocalWeekSchedule({ ...initialWeekSchedule })
    }
  }, [schema, initialWeekSchedule])

  // Search debounce
  useEffect(() => {
    if (!showAddExercise) { setSearchResults([]); return }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await service.current.searchExercises(searchQuery, client?.id)
        setSearchResults(results)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
  }, [searchQuery, showAddExercise])

  const mutate = (fn) => {
    setLocalStructure(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next })
    setIsDirty(true)
  }

  const getOrForkSchema = async () => {
    if (forkedSchemaId) return forkedSchemaId
    const forked = await service.current.forkSchema(schema, client.id)
    await service.current.assignSchemaToClient(client.id, forked.id)
    setForkedSchemaId(forked.id)
    // Update schema prop direct zodat heropenen geen nieuwe fork maakt
    if (onSchemaSaved) schema.id = forked.id // hint voor parent
    return forked.id
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const schemaId = await getOrForkSchema()
      await service.current.saveForkedSchema(schemaId, localStructure)
      // Sla ook het weekschedule op
      await db.updateClientWorkoutSchedule(client.id, localWeekSchedule)
      setSaveSuccess(true); setIsDirty(false)
      if (onSchemaSaved) onSchemaSaved(schemaId, localStructure, localWeekSchedule)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {
      console.error(e)
      setError('Opslaan mislukt. Probeer opnieuw.')
    } finally { setSaving(false) }
  }

  // ── Nieuwe dag aanmaken ──
  const addNewDay = () => {
    const existingKeys = Object.keys(localStructure || {})
    const newKey = `dag${existingKeys.length + 1}`
    const newName = `Dag ${existingKeys.length + 1}`

    // Voeg toe aan structure
    mutate(s => {
      s[newKey] = { name: newName, focus: '', exercises: [] }
    })

    // Koppel aan eerste vrije weekdag
    const usedDays = new Set(Object.values(localWeekSchedule))
    const freeDays = WEEK_DAYS.filter(d => !Object.keys(localWeekSchedule).includes(d))
    if (freeDays.length > 0) {
      setLocalWeekSchedule(prev => ({ ...prev, [freeDays[0]]: newKey }))
    }

    // Open de nieuwe dag direct
    setTimeout(() => setExpandedDay(newKey), 100)
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }

  // ── Dag verwijderen ──
  const removeDay = (workoutKey) => {
    mutate(s => { delete s[workoutKey] })
    // Verwijder ook uit weekschedule
    setLocalWeekSchedule(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(day => { if (next[day] === workoutKey) delete next[day] })
      return next
    })
    if (expandedDay === workoutKey) setExpandedDay(null)
  }

  // ── Weekdag koppeling wijzigen ──
  const changeWeekDay = (workoutKey, newWeekDay) => {
    setLocalWeekSchedule(prev => {
      const next = { ...prev }
      // Verwijder bestaande koppeling voor deze workoutKey
      Object.keys(next).forEach(d => { if (next[d] === workoutKey) delete next[d] })
      // Verwijder bestaande koppeling voor de gekozen weekdag
      if (newWeekDay !== 'none') next[newWeekDay] = workoutKey
      return next
    })
    setIsDirty(true)
  }

  // ── Dag naam aanpassen ──
  const startEditDayName = (workoutKey) => {
    setEditingDayName(workoutKey)
    setDayNameValue(localStructure[workoutKey]?.name || workoutKey)
  }

  const saveDayName = (workoutKey) => {
    if (!dayNameValue.trim()) { setEditingDayName(null); return }
    mutate(s => { s[workoutKey].name = dayNameValue.trim() })
    setEditingDayName(null)
  }

  // ── Dag kopiëren ──
  const copyDayTo = (fromKey, toKey) => {
    mutate(s => {
      s[toKey] = {
        ...JSON.parse(JSON.stringify(s[fromKey])),
        name: s[toKey]?.name || toKey
      }
    })
    setCopySheet(null)
    if (navigator.vibrate) navigator.vibrate([30, 50, 30])
  }

  // ── Oefening toevoegen ──
  const handleAddExercise = (workoutKey, ex) => {
    mutate(s => {
      if (!s[workoutKey].exercises) s[workoutKey].exercises = []
      s[workoutKey].exercises.push({
        name: ex.name, sets: 3, reps: '10', rust: '90s',
        primairSpieren: ex.primair_spieren || null,
        equipment: ex.equipment || null,
        image_url: ex.image_url || null,
        type: ex._isCustom ? 'custom' : 'standard'
      })
    })
    setSearchQuery(''); setSearchResults([])
  }

  const handleDeleteExercise = (workoutKey, idx) => {
    mutate(s => { s[workoutKey].exercises.splice(idx, 1) })
  }

  const handleField = (workoutKey, idx, field, val) => {
    mutate(s => { s[workoutKey].exercises[idx][field] = val })
  }

  const moveExercise = (workoutKey, idx, dir) => {
    const newIdx = idx + dir
    mutate(s => {
      const exs = s[workoutKey].exercises
      if (newIdx < 0 || newIdx >= exs.length) return
      const tmp = exs[idx]; exs[idx] = exs[newIdx]; exs[newIdx] = tmp
    })
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }

  if (!localStructure) return null

  const workoutKeys = Object.keys(localStructure)

  // Weekdag die gekoppeld is aan een workoutKey
  const getWeekDayForKey = (workoutKey) => {
    return Object.entries(localWeekSchedule).find(([_, v]) => v === workoutKey)?.[0] || null
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 2000, display: 'flex', flexDirection: 'column', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)', zIndex: 1 }} />

      {/* HEADER */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Plan Bewerken</div>
          <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{schema?.name || 'Jouw Plan'}</h2>
          {schema?.is_client_edited && <div style={{ fontSize: '0.57rem', color: 'rgba(255,215,0,0.35)', fontWeight: '600', marginTop: '0.15rem' }}>Persoonlijke versie</div>}
        </div>
        <button onClick={handleClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Info */}
        <div style={{ padding: isMobile ? '0.75rem 1rem 0' : '0.875rem 1.25rem 0' }}>
          <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertCircle size={12} color="rgba(255,215,0,0.35)" strokeWidth={2} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <p style={{ margin: 0, fontSize: isMobile ? '0.67rem' : '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500', lineHeight: 1.5 }}>
              Klik op een dag om oefeningen te bewerken. Pas de weekdag-koppeling aan via het dropdown. Wijzigingen worden opgeslagen als jouw versie.
            </p>
          </div>
        </div>

        {/* Workout slots */}
        <div style={{ padding: isMobile ? '0.75rem 0 0' : '0.875rem 0 0' }}>
          {workoutKeys.map((workoutKey) => {
            const workout = localStructure[workoutKey]
            const exercises = workout.exercises || []
            const isExpanded = expandedDay === workoutKey
            const isAddingHere = showAddExercise === workoutKey
            const linkedWeekDay = getWeekDayForKey(workoutKey)
            const linkedWeekDayNL = linkedWeekDay ? WEEK_DAYS_NL[WEEK_DAYS.indexOf(linkedWeekDay)] : null
            const usedWeekDays = Object.keys(localWeekSchedule)

            return (
              <div key={workoutKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

                {/* DAG HEADER */}
                <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>

                    {/* Naam */}
                    {editingDayName === workoutKey ? (
                      <input autoFocus value={dayNameValue} onChange={(e) => setDayNameValue(e.target.value)}
                        onBlur={() => saveDayName(workoutKey)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveDayName(workoutKey); if (e.key === 'Escape') setEditingDayName(null) }}
                        style={{ flex: 1, fontSize: isMobile ? '0.9rem' : '0.975rem', fontWeight: '800', color: '#fff', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,215,0,0.4)', outline: 'none', padding: '0.1rem 0' }} />
                    ) : (
                      <div onClick={() => setExpandedDay(isExpanded ? null : workoutKey)} style={{ flex: 1, minWidth: 0, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                        <div style={{ fontSize: isMobile ? '0.9rem' : '0.975rem', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {workout.name || workoutKey}
                        </div>
                        <div style={{ fontSize: isMobile ? '0.57rem' : '0.62rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600', marginTop: '0.1rem' }}>
                          {exercises.length} oefening{exercises.length !== 1 ? 'en' : ''}{workout.focus ? ` · ${workout.focus}` : ''}
                        </div>
                      </div>
                    )}

                    {/* Actie knoppen */}
                    <div style={{ display: 'flex', gap: '0.275rem', flexShrink: 0 }}>
                      <button onClick={() => startEditDayName(workoutKey)} style={iconBtn()}>
                        <Edit2 size={11} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => setCopySheet(copySheet === workoutKey ? null : workoutKey)} style={iconBtn(copySheet === workoutKey)}>
                        <Copy size={11} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => removeDay(workoutKey)} style={iconBtn(false, true)}>
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                      <button onClick={() => setExpandedDay(isExpanded ? null : workoutKey)} style={iconBtn(isExpanded)}>
                        <ChevronDown size={13} strokeWidth={2.5} style={{ transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>
                    </div>
                  </div>

                  {/* Weekdag koppeling */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>Dag:</span>
                    <select
                      value={linkedWeekDay || 'none'}
                      onChange={(e) => changeWeekDay(workoutKey, e.target.value)}
                      style={{ flex: 1, padding: '0.3rem 0.5rem', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: linkedWeekDay ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.72rem' : '0.77rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="none">Niet gepland</option>
                      {WEEK_DAYS.map((d, i) => {
                        const isTaken = usedWeekDays.includes(d) && localWeekSchedule[d] !== workoutKey
                        return (
                          <option key={d} value={d} disabled={isTaken}>
                            {WEEK_DAYS_NL[i]}{isTaken ? ' (bezet)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                {/* KOPIEER BOTTOMSHEET */}
                {copySheet === workoutKey && (
                  <div style={{ padding: isMobile ? '0 1rem 0.75rem' : '0 1.25rem 0.875rem', background: 'rgba(255,215,0,0.02)', borderTop: '1px solid rgba(255,215,0,0.08)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingTop: '0.625rem' }}>
                      Kopieer "{workout.name || workoutKey}" naar:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {workoutKeys.filter(k => k !== workoutKey).map(targetKey => (
                        <button key={targetKey} onClick={() => copyDayTo(workoutKey, targetKey)}
                          style={{ padding: '0.45rem 0.875rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px', color: '#FFD700', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.12)'}
                          onTouchEnd={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.06)'}>
                          {localStructure[targetKey]?.name || targetKey}
                        </button>
                      ))}
                      <button onClick={() => setCopySheet(null)} style={{ padding: '0.45rem 0.875rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation' }}>
                        Annuleren
                      </button>
                    </div>
                  </div>
                )}

                {/* UITKLAPBARE OEFENINGEN */}
                {isExpanded && (
                  <div style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>

                    {exercises.length === 0 && (
                      <div style={{ padding: isMobile ? '1rem' : '1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: '600', fontStyle: 'italic' }}>
                        Nog geen oefeningen — voeg er een toe
                      </div>
                    )}

                    {exercises.map((exercise, exIdx) => (
                      <div key={`${workoutKey}-${exIdx}`} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '0.5rem' }}>

                        {/* Volgorde */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flexShrink: 0 }}>
                          <button onClick={() => moveExercise(workoutKey, exIdx, -1)} disabled={exIdx === 0} style={{ width: '22px', height: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px', color: exIdx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: exIdx === 0 ? 'default' : 'pointer', touchAction: 'manipulation', padding: 0 }}>
                            <ChevronUp size={10} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => moveExercise(workoutKey, exIdx, 1)} disabled={exIdx === exercises.length - 1} style={{ width: '22px', height: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px', color: exIdx === exercises.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: exIdx === exercises.length - 1 ? 'default' : 'pointer', touchAction: 'manipulation', padding: 0 }}>
                            <ChevronDown size={10} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Foto */}
                        <div style={{ width: '36px', height: '36px', borderRadius: '4px', flexShrink: 0, backgroundImage: `url(${exercise.image_url || getFallbackImage(exercise.name)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />

                        {/* Info + inputs */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? '0.77rem' : '0.82rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                            {exercise.name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.275rem', alignItems: 'center' }}>
                            <input type="number" value={exercise.sets || 3} min={1} max={10}
                              onChange={(e) => handleField(workoutKey, exIdx, 'sets', parseInt(e.target.value) || 3)}
                              style={{ width: '36px', padding: '0.18rem 0.25rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFD700', fontSize: '0.7rem', fontWeight: '800', textAlign: 'center', outline: 'none' }} />
                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>×</span>
                            <input type="text" value={exercise.reps || '10'}
                              onChange={(e) => handleField(workoutKey, exIdx, 'reps', e.target.value)}
                              style={{ width: '36px', padding: '0.18rem 0.25rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFD700', fontSize: '0.7rem', fontWeight: '800', textAlign: 'center', outline: 'none' }} />
                            <input type="text" value={exercise.rust || '90s'}
                              onChange={(e) => handleField(workoutKey, exIdx, 'rust', e.target.value)}
                              style={{ width: '40px', padding: '0.18rem 0.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', fontWeight: '600', textAlign: 'center', outline: 'none' }} />
                          </div>
                        </div>

                        {/* Verwijder */}
                        <button onClick={() => handleDeleteExercise(workoutKey, exIdx)}
                          style={{ width: '30px', height: '30px', background: 'transparent', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '5px', color: 'rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          onTouchStart={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444' }}
                          onTouchEnd={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = 'rgba(239,68,68,0.35)' }}>
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                    ))}

                    {/* Toevoegen knop */}
                    {!isAddingHere && (
                      <div style={{ padding: isMobile ? '0.5rem 1rem 0.75rem' : '0.625rem 1.25rem 0.875rem' }}>
                        <button onClick={() => { setShowAddExercise(workoutKey); setSearchQuery('') }}
                          style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: '36px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                          <Plus size={12} strokeWidth={2.5} />Oefening toevoegen
                        </button>
                      </div>
                    )}

                    {/* Zoek sectie */}
                    {isAddingHere && (
                      <div style={{ padding: isMobile ? '0.5rem 1rem 0.75rem' : '0.625rem 1.25rem 0.875rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                          <Search size={12} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input autoFocus type="text" placeholder="Zoek oefening..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem 0.625rem 0.5rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', fontWeight: '500', outline: 'none', boxSizing: 'border-box' }} />
                        </div>

                        {searching && <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Zoeken...</div>}

                        {searchResults.slice(0, 8).map((ex, i) => (
                          <div key={i} onClick={() => handleAddExercise(workoutKey, ex)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.45rem 0.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onTouchEnd={(e) => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '3px', backgroundImage: `url(${ex.image_url || getFallbackImage(ex.name)})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, opacity: 1 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ex.name}
                                {ex._isCustom && <span style={{ marginLeft: '0.3rem', fontSize: '0.5rem', background: 'rgba(255,215,0,0.12)', color: '#FFD700', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '800' }}>Eigen</span>}
                              </div>
                              {ex.primair_spieren && <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600', textTransform: 'capitalize' }}>{ex.primair_spieren}</div>}
                            </div>
                            <Plus size={13} color="rgba(255,255,255,0.2)" strokeWidth={2.5} />
                          </div>
                        ))}

                        <button onClick={() => { setShowAddExercise(null); setSearchQuery('') }}
                          style={{ width: '100%', marginTop: '0.375rem', padding: '0.375rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.62rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation' }}>
                          Annuleren
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Nieuwe dag toevoegen */}
          <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem' }}>
            <button onClick={addNewDay}
              style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'transparent', border: '1px dashed rgba(255,215,0,0.2)', borderRadius: '8px', color: 'rgba(255,215,0,0.5)', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              onTouchStart={(e) => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)'}
              onTouchEnd={(e) => e.currentTarget.style.borderColor = 'rgba(255,215,0,0.2)'}>
              <Plus size={14} strokeWidth={2.5} />Trainingsdag toevoegen
            </button>
          </div>
        </div>

        <div style={{ height: '80px' }} />
      </div>

      {/* FOOTER */}
      <div style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem', flexShrink: 0 }}>
        {error && <div style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.7rem', color: 'rgba(239,68,68,0.7)', fontWeight: '600' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleClose} style={{ flex: 1, padding: isMobile ? '0.75rem' : '0.875rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '700', cursor: 'pointer', minHeight: '46px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>Sluiten</button>
          <button onClick={handleSave} disabled={saving || !isDirty}
            style={{ flex: 2, padding: isMobile ? '0.75rem' : '0.875rem', background: saveSuccess ? 'rgba(16,185,129,0.12)' : isDirty ? 'rgba(255,215,0,0.1)' : 'transparent', border: `1px solid ${saveSuccess ? 'rgba(16,185,129,0.3)' : isDirty ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', color: saveSuccess ? '#10b981' : isDirty ? '#FFD700' : 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: isDirty && !saving ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', minHeight: '46px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease' }}>
            {saving ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</>
              : saveSuccess ? <><Check size={15} strokeWidth={2.5} />Opgeslagen!</>
              : <><Check size={15} strokeWidth={2.5} />Plan Opslaan</>}
          </button>
        </div>
        {isDirty && !saving && <div style={{ textAlign: 'center', fontSize: '0.57rem', color: 'rgba(255,255,255,0.18)', fontWeight: '600', marginTop: '0.375rem' }}>Niet-opgeslagen wijzigingen</div>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}

// Helper - icon knop stijl
function iconBtn(active = false, danger = false) {
  return {
    width: '30px', height: '30px',
    background: active ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.07)') : 'transparent',
    border: `1px solid ${danger ? 'rgba(239,68,68,0.15)' : active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: '5px',
    color: danger ? 'rgba(239,68,68,0.45)' : active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
  }
}
