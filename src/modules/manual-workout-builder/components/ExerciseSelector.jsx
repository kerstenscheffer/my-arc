// src/modules/manual-workout-builder/components/ExerciseSelector.jsx
import { useState, useEffect } from 'react'
import { X, Search, Dumbbell, User, Plus, Trash2 } from 'lucide-react'
import EXERCISE_DATABASE from '../../workout/constants/exerciseDatabase'
import CustomExerciseModal from '../../workout/components/todays-workout/components/CustomExerciseModal'

export default function ExerciseSelector({ onSelect, onClose, isMobile, db, selectedClient }) {
  const [tab, setTab] = useState('database') // 'database' | 'client' | 'coach'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [exercises, setExercises] = useState([])
  const [clientExercises, setClientExercises] = useState([])
  const [loadingClient, setLoadingClient] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [coachExercises, setCoachExercises] = useState([])
  const [loadingCoach, setLoadingCoach] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', muscle_group: '', equipment: '', notes: '' })

  useEffect(() => { loadExercises() }, [selectedMuscle, selectedEquipment, selectedDifficulty, searchTerm])

  useEffect(() => {
    if (tab === 'client' && db) loadClientExercises()
    if (tab === 'coach' && db) loadCoachExercises()
  }, [tab])

  const loadExercises = () => {
    let all = []
    Object.entries(EXERCISE_DATABASE).forEach(([muscle, data]) => {
      if (data.compound) data.compound.forEach(ex => all.push({ ...ex, muscle, type: 'compound', primairSpieren: muscle }))
      if (data.isolation) data.isolation.forEach(ex => all.push({ ...ex, muscle, type: 'isolation', primairSpieren: muscle }))
    })

    let filtered = all
    if (selectedMuscle !== 'all') filtered = filtered.filter(ex => ex.muscle === selectedMuscle)
    if (selectedEquipment !== 'all') filtered = filtered.filter(ex => ex.equipment === selectedEquipment)
    if (selectedDifficulty !== 'all') filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty)
    if (searchTerm) filtered = filtered.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setExercises(filtered)
  }

  const loadClientExercises = async () => {
    setLoadingClient(true)
    try {
      // Laad alle custom oefeningen van alle clients
      const { data: exercises, error } = await db.supabase
        .from('custom_exercises')
        .select('id, name, muscle_group, sets, reps, rest, notes, client_id')
        .order('name')

      if (error) throw error

      // Haal client namen op
      const clientIds = [...new Set((exercises || []).map(e => e.client_id).filter(Boolean))]
      const { data: clients } = await db.supabase
        .from('clients')
        .select('id, first_name, last_name')
        .in('id', clientIds)

      const clientMap = {}
      clients?.forEach(c => { clientMap[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() })

      setClientExercises((exercises || []).map(e => ({
        ...e,
        clientName: clientMap[e.client_id] || 'Onbekend'
      })))
    } catch (e) { console.error('Failed to load client exercises:', e) }
    finally { setLoadingClient(false) }
  }

  const loadCoachExercises = async () => {
    setLoadingCoach(true)
    try {
      const { data, error } = await db.supabase
        .from('custom_exercises')
        .select('id, name, muscle_group, equipment, notes')
        .is('client_id', null)
        .order('name')
      if (error) throw error
      setCoachExercises(data || [])
    } catch (e) { console.error('Failed to load coach exercises:', e) }
    finally { setLoadingCoach(false) }
  }

  const addCoachExercise = async () => {
    if (!newEx.name.trim() || !newEx.muscle_group.trim()) return
    try {
      const { data, error } = await db.supabase
        .from('custom_exercises')
        .insert({ name: newEx.name.trim(), muscle_group: newEx.muscle_group.trim(), equipment: newEx.equipment.trim() || null, notes: newEx.notes.trim() || null, client_id: null })
        .select().single()
      if (error) throw error
      setCoachExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewEx({ name: '', muscle_group: '', equipment: '', notes: '' })
      setShowAddForm(false)
    } catch (e) { console.error('Failed to add coach exercise:', e); alert('Opslaan mislukt') }
  }

  const deleteCoachExercise = async (id) => {
    if (!window.confirm('Oefening verwijderen uit coach database?')) return
    try {
      const { error } = await db.supabase.from('custom_exercises').delete().eq('id', id).is('client_id', null)
      if (error) throw error
      setCoachExercises(prev => prev.filter(e => e.id !== id))
    } catch (e) { console.error('Failed to delete coach exercise:', e); alert('Verwijderen mislukt') }
  }

  const handleSelectClient = (ex) => {
    onSelect({
      name: ex.name,
      sets: ex.sets || 3,
      reps: ex.reps || '10',
      rest: ex.rest || '90s',
      primairSpieren: ex.muscle_group || '',
      type: 'custom',
      _isCustom: true
    })
  }

  const handleSelectDb = (ex) => {
    onSelect({
      name: ex.name,
      sets: 3,
      reps: ex.reps || '10',
      rest: '90s',
      primairSpieren: ex.primairSpieren || ex.muscle || '',
      equipment: ex.equipment || '',
      difficulty: ex.difficulty || ''
    })
  }

  const muscleGroups = ['all', ...Object.keys(EXERCISE_DATABASE)]
  const equipmentTypes = ['all', 'bodyweight', 'dumbbell', 'barbell', 'cable', 'machine', 'band']
  const difficultyLevels = ['all', 'beginner', 'intermediate', 'advanced']

  const getDifficultyColor = (d) => ({ beginner: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' }[d] || '#6b7280')

  const clientName = selectedClient ? `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() : ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{ width: '100%', maxWidth: '700px', background: '#0a0a0a', borderRadius: isMobile ? '16px 16px 0 0' : '16px', border: '1px solid rgba(255,215,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', marginBottom: isMobile ? 0 : '2rem' }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Oefening toevoegen</div>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Kies een oefening</h2>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => setTab('database')} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: 'none', borderBottom: tab === 'database' ? '2px solid #FFD700' : '2px solid transparent', color: tab === 'database' ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation' }}>
            <Dumbbell size={12} strokeWidth={2.5} />Database
          </button>
          {db && (
            <button onClick={() => setTab('client')} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: 'none', borderBottom: tab === 'client' ? '2px solid #FFD700' : '2px solid transparent', color: tab === 'client' ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation' }}>
              <User size={12} strokeWidth={2.5} />Client
              {clientExercises.length > 0 && <span style={{ fontSize: '0.58rem', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '800' }}>{clientExercises.length}</span>}
            </button>
          )}
          {db && (
            <button onClick={() => setTab('coach')} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: 'none', borderBottom: tab === 'coach' ? '2px solid #FFD700' : '2px solid transparent', color: tab === 'coach' ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', touchAction: 'manipulation' }}>
              <Dumbbell size={12} strokeWidth={2.5} />Coach DB
              {coachExercises.length > 0 && <span style={{ fontSize: '0.58rem', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '800' }}>{coachExercises.length}</span>}
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, position: 'relative' }}>
          <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: isMobile ? '1.75rem' : '2rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Zoek oefening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Filters — alleen voor database tab */}
        {tab === 'database' && (
          <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, display: 'flex', gap: '0.375rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {['all', ...Object.keys(EXERCISE_DATABASE)].slice(0, 8).map(muscle => (
              <button key={muscle} onClick={() => setSelectedMuscle(muscle)}
                style={{ padding: '0.25rem 0.625rem', background: selectedMuscle === muscle ? 'rgba(255,215,0,0.12)' : 'transparent', border: `1px solid ${selectedMuscle === muscle ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '5px', color: selectedMuscle === muscle ? '#FFD700' : 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize', touchAction: 'manipulation' }}>
                {muscle === 'all' ? 'Alle' : muscle}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* DATABASE TAB */}
          {tab === 'database' && exercises.map((ex, i) => (
            <div key={i} onClick={() => handleSelectDb(ex)}
              style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', gap: '0.75rem' }}
              onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onTouchEnd={(e) => e.currentTarget.style.background = 'transparent'}
              onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginTop: '0.1rem', textTransform: 'capitalize' }}>
                  {ex.muscle}{ex.equipment ? ` · ${ex.equipment}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                {ex.type && <span style={{ fontSize: '0.52rem', padding: '0.15rem 0.4rem', background: ex.type === 'compound' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.06)', color: ex.type === 'compound' ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.3)', borderRadius: '3px', fontWeight: '700', textTransform: 'uppercase' }}>{ex.type === 'compound' ? 'Comp' : 'Iso'}</span>}
                {ex.difficulty && <span style={{ fontSize: '0.52rem', padding: '0.15rem 0.4rem', background: `${getDifficultyColor(ex.difficulty)}15`, color: getDifficultyColor(ex.difficulty), borderRadius: '3px', fontWeight: '700', textTransform: 'capitalize' }}>{ex.difficulty}</span>}
              </div>
            </div>
          ))}

          {tab === 'database' && exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', fontWeight: '600', fontStyle: 'italic' }}>
              Geen oefeningen gevonden
            </div>
          )}

          {/* CLIENT TAB */}
          {tab === 'client' && (
            <>
              {loadingClient ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : clientExercises.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', fontWeight: '600', fontStyle: 'italic' }}>
                  {clientName} heeft nog geen eigen oefeningen aangemaakt
                </div>
              ) : (
                <>
                  <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.58rem', color: 'rgba(255,215,0,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Alle client oefeningen · {clientExercises.length} totaal
                  </div>
                  {clientExercises
                    .filter(ex => !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((ex, i) => (
                      <div key={i} onClick={() => handleSelectClient(ex)}
                        style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', gap: '0.75rem' }}
                        onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onTouchEnd={(e) => e.currentTarget.style.background = 'transparent'}
                        onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'transparent' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginTop: '0.1rem', textTransform: 'capitalize' }}>
                            {ex.clientName}{ex.muscle_group ? ` · ${ex.muscle_group}` : ''}{ex.sets ? ` · ${ex.sets}×${ex.reps}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.52rem', padding: '0.15rem 0.4rem', background: 'rgba(255,215,0,0.1)', color: 'rgba(255,215,0,0.7)', borderRadius: '3px', fontWeight: '800', textTransform: 'uppercase', flexShrink: 0 }}>Eigen</span>
                      </div>
                    ))}
                </>
              )}
            </>
          )}
          {/* COACH DB TAB */}
          {tab === 'coach' && (
            <>
              {loadingCoach ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  {coachExercises.filter(ex => !searchTerm || ex.name.toLowerCase().includes(searchTerm.toLowerCase())).map(ex => (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '0.75rem' }}>
                      <div onClick={() => onSelect({ name: ex.name, sets: 3, reps: '10', rest: '90s', primairSpieren: ex.muscle_group || '', equipment: ex.equipment || '', type: 'custom', _isCustom: true })}
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                        onMouseEnter={e => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { if (window.innerWidth > 768) e.currentTarget.style.background = 'transparent' }}>
                        <div style={{ fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginTop: '0.1rem', textTransform: 'capitalize' }}>
                          {ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ''}
                        </div>
                      </div>
                      <button onClick={() => deleteCoachExercise(ex.id)} style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation' }}>
                        <Trash2 size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  {coachExercises.length === 0 && !showAddForm && (
                    <div style={{ textAlign: 'center', padding: '2rem 2rem 1rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', fontWeight: '600', fontStyle: 'italic' }}>
                      Nog geen coach-oefeningen — voeg ze toe hieronder
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* COACH DB — Oefening toevoegen footer */}
        {tab === 'coach' && db && (
          <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {showAddForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input value={newEx.name} onChange={e => setNewEx(p => ({ ...p, name: e.target.value }))} placeholder="Naam oefening *" style={{ padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
                <input value={newEx.muscle_group} onChange={e => setNewEx(p => ({ ...p, muscle_group: e.target.value }))} placeholder="Spiergroep * (bv. borst, rug, benen)" style={{ padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
                <input value={newEx.equipment} onChange={e => setNewEx(p => ({ ...p, equipment: e.target.value }))} placeholder="Materiaal (optioneel)" list="coach-equipment-list" style={{ padding: '0.4rem 0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', outline: 'none' }} />
                <datalist id="coach-equipment-list">
                  {['Bodyweight','Dumbbell','Barbell','Kettlebell','EZ-bar','Weerstandsband','Kabel','Smith machine','Machine (algemeen)','Pull-up bar','Dip station','Halterbank'].map(o => <option key={o} value={o} />)}
                  {[...new Set(coachExercises.map(e => e.equipment).filter(Boolean))].map(o => <option key={'ce-' + o} value={o} />)}
                </datalist>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addCoachExercise} disabled={!newEx.name.trim() || !newEx.muscle_group.trim()} style={{ flex: 1, padding: '0.4rem', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '6px', color: '#FFD700', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation' }}>Opslaan</button>
                  <button onClick={() => { setShowAddForm(false); setNewEx({ name: '', muscle_group: '', equipment: '', notes: '' }) }} style={{ flex: 1, padding: '0.4rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation' }}>Annuleren</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed rgba(255,215,0,0.2)', borderRadius: '7px', color: 'rgba(255,215,0,0.5)', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Plus size={12} strokeWidth={2.5} />Oefening toevoegen aan Coach DB
              </button>
            )}
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Eigen oefening aanmaken (client tab only) */}
      {db && selectedClient && tab !== 'coach' && (
        <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={() => setShowCustomModal(true)}
            style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed rgba(255,215,0,0.2)', borderRadius: '7px', color: 'rgba(255,215,0,0.5)', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <Plus size={12} strokeWidth={2.5} />Eigen oefening aanmaken
          </button>
        </div>
      )}

      {showCustomModal && (
        <CustomExerciseModal
          client={selectedClient}
          db={db}
          onClose={() => setShowCustomModal(false)}
          onSave={(newExercise) => {
            setShowCustomModal(false)
            // Voeg direct toe als geselecteerde oefening
            handleSelectClient({ ...newExercise, _isCustom: true })
            // Herlaad client oefeningen
            if (tab === 'client') loadClientExercises()
          }}
        />
      )}
    </div>
  )
}
