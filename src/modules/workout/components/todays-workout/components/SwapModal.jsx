// src/modules/workout/components/todays-workout/components/SwapModal.jsx
import { X, Search, Plus, Home, Dumbbell as DumbbellIcon, ChevronRight, ChevronDown, SlidersHorizontal, Pin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CustomExerciseModal from './CustomExerciseModal'
import ExerciseService from '../../../../../services/ExerciseService'
import WorkoutServiceNew from '../../../services/WorkoutServiceNew'

const getFallbackImage = (exercise) => {
  const muscles = (exercise.primair_spieren || '').toLowerCase()
  if (muscles.includes('chest')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&h=400&fit=crop&q=80&crop=center'
  if (muscles.includes('back')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=400&fit=crop&q=80&crop=center'
  if (muscles.includes('leg')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=400&h=400&fit=crop&q=80&crop=center'
  if (muscles.includes('shoulder')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=400&fit=crop&q=80&crop=center'
  if (muscles.includes('bicep') || muscles.includes('tricep')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop&q=80&crop=center'
  if (muscles.includes('core')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop&q=80&crop=center'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop&q=80&crop=center'
}

const fuzzyMatch = (text, query) => {
  if (!text || !query) return false
  text = text.toLowerCase().trim()
  query = query.toLowerCase().trim()
  if (text.includes(query)) return true
  return query.split(/\s+/).every(word => text.includes(word))
}

const DUTCH_SYNONYMS = {
  'schouder': ['shoulder', 'delts', 'delt'],
  'borst': ['chest', 'pec'],
  'rug': ['back', 'lat'],
  'been': ['leg', 'quad', 'hamstring'],
  'bicep': ['biceps', 'arm'],
  'tricep': ['triceps', 'arm'],
  'buik': ['core', 'abs'],
  'zijkant': ['lateral', 'side'],
  'voorkant': ['front'],
  'achterkant': ['rear', 'back'],
  'kabel': ['cable'],
  'dumbbell': ['dumbbells', 'db'],
  'barbell': ['bar', 'bb'],
  'opheffen': ['raise', 'raises'],
  'curl': ['curls'],
  'drukken': ['press'],
  'trekken': ['row', 'pull']
}

const expandQuery = (query) => {
  let expanded = [query]
  Object.keys(DUTCH_SYNONYMS).forEach(dutch => {
    if (query.toLowerCase().includes(dutch)) {
      DUTCH_SYNONYMS[dutch].forEach(english => {
        expanded.push(query.toLowerCase().replace(dutch, english))
      })
    }
  })
  return expanded
}

const MUSCLE_LABELS = {
  'chest': 'Borst', 'back': 'Rug', 'shoulders': 'Schouders',
  'biceps': 'Biceps', 'triceps': 'Triceps', 'legs': 'Benen', 'core': 'Core'
}

const EQUIPMENT_LABELS = {
  'barbell': 'Barbell', 'dumbbells': 'Dumbbells', 'cables': 'Kabels',
  'machine': 'Machine', 'bodyweight': 'Bodyweight'
}

export default function SwapModal({ exercise, exerciseIndex, workoutDayKey, schema, onClose, onSwapComplete, db, client }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [allExercises, setAllExercises] = useState([])
  const [filteredAlternatives, setFilteredAlternatives] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [swapping, setSwapping] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState(exercise.primairSpieren || null)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false)
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false)
  const [showExtraFilters, setShowExtraFilters] = useState(false)
  const [homeOnlyFilter, setHomeOnlyFilter] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [exerciseImages, setExerciseImages] = useState({})

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadAllExercises()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const loadAllExercises = async () => {
    setLoading(true)
    try {
      const [dbExercises, customResult] = await Promise.all([
        ExerciseService.getAllExercises({ limit: 200 }),
        client?.id
          ? db.supabase.from('custom_exercises').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] })
      ])
      const customExercises = (customResult?.data || []).map(c => ({
        id: c.id, name: c.name,
        primair_spieren: c.primair_spieren || c.muscle_group || null,
        equipment: c.equipment || null, type: 'custom',
        image_url: c.image_url || null, home_friendly: false, gym_friendly: true, _isCustom: true
      }))
      const seen = new Set(customExercises.map(c => c.name.toLowerCase()))
      const deduped = (dbExercises || []).filter(ex => !seen.has(ex.name.toLowerCase()))
      const all = [...customExercises, ...deduped]
      setAllExercises(all)
      setFilteredAlternatives(all.filter(ex => ex.primair_spieren === (exercise.primairSpieren || null)))
      loadExerciseImages(all)
    } catch (error) {
      console.error('❌ Error loading exercises:', error)
      setAllExercises([])
    } finally { setLoading(false) }
  }

  const loadExerciseImages = async (exercises) => {
    const images = {}
    for (const ex of exercises) {
      if (ex._isCustom && ex.image_url) { images[ex.name] = ex.image_url; continue }
      const img = await ExerciseService.getExerciseImage(ex.name)
      if (img) images[ex.name] = img
    }
    setExerciseImages(images)
  }

  useEffect(() => {
    let filtered = [...allExercises]
    if (selectedMuscle) filtered = filtered.filter(ex => ex.primair_spieren === selectedMuscle)
    if (selectedEquipment) filtered = filtered.filter(ex => ex.equipment === selectedEquipment)
    if (homeOnlyFilter) filtered = filtered.filter(ex => ex.home_friendly === true)
    if (selectedType) filtered = filtered.filter(ex => ex.type === selectedType)
    if (searchQuery.trim()) {
      const queries = expandQuery(searchQuery)
      filtered = filtered.filter(alt => {
        if (queries.some(q => fuzzyMatch(alt.name, q))) return true
        if (alt.tags?.some(tag => queries.some(q => fuzzyMatch(tag, q)))) return true
        if (alt.search_terms?.some(term => queries.some(q => fuzzyMatch(term, q)))) return true
        if (queries.some(q => fuzzyMatch(alt.equipment, q))) return true
        if (queries.some(q => fuzzyMatch(alt.primair_spieren, q))) return true
        return false
      })
    }
    filtered = filtered.filter(ex => ex.name !== exercise.name)
    setFilteredAlternatives(filtered)
  }, [searchQuery, allExercises, selectedMuscle, selectedEquipment, homeOnlyFilter, selectedType])

  const muscleGroups = [...new Set(allExercises.map(ex => ex.primair_spieren).filter(Boolean))].sort()
  const equipmentTypes = [...new Set(allExercises.filter(ex => !ex._isCustom).map(ex => ex.equipment).filter(Boolean))].sort()
  const activeExtraFiltersCount = [homeOnlyFilter, selectedType].filter(Boolean).length

  const handleSwap = async (newExercise) => {
    if (!schema?.id || !workoutDayKey || swapping) return
    setSwapping(true)
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren,
        _isWeeklyOverride: true,
        _originalName: exercise.name
      }

      // Sla op als weekly override — NIET in het schema
      await WorkoutServiceNew.saveWeeklyOverride(
        client.id, schema.id, workoutDayKey, exerciseIndex, updatedExercise, db
      )

      if (navigator.vibrate) navigator.vibrate(50)
      setVisible(false)
      setTimeout(() => {
        onSwapComplete({ reloadSchema: true, newExercise: updatedExercise })
        onClose()
      }, 300)
    } catch (error) {
      console.error('❌ Swap failed:', error)
      alert('Kon oefening niet wisselen. Probeer opnieuw.')
      setSwapping(false)
    }
  }

  const handleMakePermanent = async (newExercise) => {
    if (!schema?.id || !workoutDayKey || swapping) return
    setSwapping(true)
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren
      }
      // Schrijf permanent naar schema
      await db.updateExerciseInSchema(schema.id, workoutDayKey, exerciseIndex, updatedExercise)
      // Verwijder de weekly override als die bestaat
      await WorkoutServiceNew.removeWeeklyOverride(client.id, schema.id, workoutDayKey, exerciseIndex, db)
      if (navigator.vibrate) navigator.vibrate(50)
      setVisible(false)
      setTimeout(() => {
        onSwapComplete({ reloadSchema: true, newExercise: updatedExercise })
        onClose()
      }, 300)
    } catch (error) {
      console.error('❌ Permanent swap failed:', error)
      alert('Kon oefening niet permanent wisselen. Probeer opnieuw.')
      setSwapping(false)
    }
  }

  const handleCustomCreated = (customExercise) => {
    setShowCustomModal(false)
    if (customExercise._addedToDay) {
      onSwapComplete({ reloadSchema: true })
      onClose()
    } else {
      handleSwap(customExercise)
    }
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }
  const imageSize = isMobile ? '56px' : '64px'

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 0.375rem)', left: 0, right: 0,
    background: '#0a0a0a', borderRadius: '10px', overflow: 'hidden',
    zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
  }

  const dropdownBtnStyle = (active) => ({
    width: '100%', padding: '0.625rem 0.875rem',
    background: active ? 'rgba(255,215,0,0.08)' : 'transparent',
    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: active ? '#FFD700' : 'rgba(255,255,255,0.6)',
    fontSize: '0.85rem', fontWeight: '600', textAlign: 'left',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
  })

  return (
    <>
      {createPortal(
        <div
          style={{ position: 'fixed', inset: 0, height: '100dvh', background: '#0a0a0a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '2rem', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div style={{ maxWidth: isMobile ? '100%' : '600px', width: '100%', height: isMobile ? '100dvh' : 'auto', maxHeight: isMobile ? '100dvh' : '90vh', background: '#0a0a0a', border: isMobile ? 'none' : '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '0' : '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.8)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>

            {/* HEADER */}
            <div style={{
              padding: isMobile ? '1rem' : '1.25rem',
              paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '1rem' : '1.25rem'})`,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: '#0a0a0a',
              position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Wissel Oefening</h2>
                  <div style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: '#FFD700', fontWeight: 700, marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exercise.name}</div>
                  {exercise._isWeeklyOverride && (
                    <div style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '0.2rem' }}>
                      Origineel: {exercise._originalName}
                    </div>
                  )}
                </div>
                <button onClick={handleClose} aria-label="Sluit" style={{ width: 44, height: 44, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12, color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <X size={20} strokeWidth={2.4} />
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search size={16} color="rgba(255,215,0,0.4)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Zoek oefening..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: isMobile ? '0.625rem 0.875rem 0.625rem 2.5rem' : '0.75rem 1rem 0.75rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '500', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <button onClick={() => { setShowMuscleDropdown(!showMuscleDropdown); setShowEquipmentDropdown(false) }}
                    style={{ width: '100%', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '10px', color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <span>{selectedMuscle ? MUSCLE_LABELS[selectedMuscle] : 'Alle Spieren'}</span>
                    <ChevronDown size={16} style={{ transform: showMuscleDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                  </button>
                  {showMuscleDropdown && (
                    <div style={{ ...dropdownStyle, border: '1px solid rgba(255,215,0,0.2)' }}>
                      <button onClick={() => { setSelectedMuscle(null); setShowMuscleDropdown(false) }} style={dropdownBtnStyle(!selectedMuscle)}>
                        {!selectedMuscle && <span style={{ color: '#FFD700' }}>✓</span>}<span>Alle Spieren</span>
                      </button>
                      {muscleGroups.map(muscle => (
                        <button key={muscle} onClick={() => { setSelectedMuscle(muscle); setShowMuscleDropdown(false) }} style={dropdownBtnStyle(selectedMuscle === muscle)}>
                          {selectedMuscle === muscle && <span style={{ color: '#FFD700' }}>✓</span>}<span>{MUSCLE_LABELS[muscle] || muscle}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                  <button onClick={() => { setShowEquipmentDropdown(!showEquipmentDropdown); setShowMuscleDropdown(false) }}
                    style={{ width: '100%', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem', background: selectedEquipment ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)', border: selectedEquipment ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: selectedEquipment ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <DumbbellIcon size={14} strokeWidth={2.5} />
                      {selectedEquipment ? EQUIPMENT_LABELS[selectedEquipment] : 'Equipment'}
                    </span>
                    <ChevronDown size={16} style={{ transform: showEquipmentDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
                  </button>
                  {showEquipmentDropdown && (
                    <div style={{ ...dropdownStyle, border: '1px solid rgba(255,255,255,0.15)' }}>
                      <button onClick={() => { setSelectedEquipment(null); setShowEquipmentDropdown(false) }} style={dropdownBtnStyle(!selectedEquipment)}>
                        {!selectedEquipment && <span style={{ color: '#FFD700' }}>✓</span>}<span>Alle Equipment</span>
                      </button>
                      {equipmentTypes.map(eq => (
                        <button key={eq} onClick={() => { setSelectedEquipment(eq); setShowEquipmentDropdown(false) }} style={dropdownBtnStyle(selectedEquipment === eq)}>
                          {selectedEquipment === eq && <span style={{ color: '#FFD700' }}>✓</span>}<span>{EQUIPMENT_LABELS[eq] || eq}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setShowExtraFilters(!showExtraFilters)}
                  style={{ width: '44px', height: '44px', background: activeExtraFiltersCount > 0 ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)', border: activeExtraFiltersCount > 0 ? '1px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: activeExtraFiltersCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <SlidersHorizontal size={18} strokeWidth={2.5} />
                  {activeExtraFiltersCount > 0 && (
                    <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#FFD700', color: '#000', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeExtraFiltersCount}
                    </div>
                  )}
                </button>
              </div>

              {showExtraFilters && (
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.625rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Locatie</div>
                      <button onClick={() => setHomeOnlyFilter(!homeOnlyFilter)} style={{ padding: '0.5rem 0.75rem', background: homeOnlyFilter ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: homeOnlyFilter ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        <Home size={14} strokeWidth={2.5} />Thuis
                      </button>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Type</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['compound', 'isolation'].map(t => (
                          <button key={t} onClick={() => setSelectedType(selectedType === t ? null : t)} style={{ flex: 1, padding: '0.5rem', background: selectedType === t ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: selectedType === t ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activeExtraFiltersCount > 0 && (
                      <button onClick={() => { setHomeOnlyFilter(false); setSelectedType(null) }} style={{ padding: '0.6rem', minHeight: 40, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Reset Extra Filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#FFD700', fontWeight: 800, textAlign: 'center', opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {filteredAlternatives.length} resultaten
              </div>
            </div>

            {/* LIST */}
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : filteredAlternatives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.5)' }}>
                  <p style={{ marginBottom: '1rem' }}>Geen resultaten gevonden</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedMuscle(exercise.primairSpieren || null); setSelectedEquipment(null); setHomeOnlyFilter(false); setSelectedType(null) }}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '8px', color: '#FFD700', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>
                    Reset Alles
                  </button>
                </div>
              ) : (
                filteredAlternatives.map((alt, index) => (
                  <ExerciseRow
                    key={`${alt._isCustom ? 'custom' : 'db'}-${alt.id || index}`}
                    exercise={alt}
                    imageUrl={exerciseImages[alt.name] || getFallbackImage(alt)}
                    onSelect={() => handleSwap(alt)}
                    onSelectPermanent={() => handleMakePermanent(alt)}
                    swapping={swapping}
                    imageSize={imageSize}
                    isMobile={isMobile}
                  />
                ))
              )}

              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? '1rem' : '1.25rem'})`,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <button onClick={() => setShowCustomModal(true)}
                  style={{ width: '100%', minHeight: 54, padding: isMobile ? '0.9rem' : '1rem', background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)', border: 'none', borderRadius: 14, color: '#0a0a0a', fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', boxShadow: '0 10px 24px rgba(255,215,0,0.3), 0 2px 6px rgba(0,0,0,0.5)' }}>
                  <Plus size={20} strokeWidth={2.6} />Eigen Oefening
                </button>
              </div>
            </div>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>,
        document.body
      )}

      {showCustomModal && createPortal(
        <CustomExerciseModal onClose={() => setShowCustomModal(false)} onSave={handleCustomCreated} client={client} db={db} schema={schema} />,
        document.body
      )}
    </>
  )
}

function ExerciseRow({ exercise, imageUrl, onSelect, onSelectPermanent, swapping, imageSize, isMobile }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        onClick={() => !swapping && setShowActions(!showActions)}
        style={{ display: 'flex', alignItems: 'stretch', cursor: swapping ? 'not-allowed' : 'pointer', opacity: swapping ? 0.5 : 1, transition: 'background 0.15s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: showActions ? 'rgba(255,215,0,0.03)' : 'transparent' }}
      >
        <div style={{ width: imageSize, minHeight: imageSize, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {exercise.name}
            </h3>
            {exercise._isCustom && (
              <span style={{ fontSize: '0.6rem', background: '#FFD700', color: '#000', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1, flexShrink: 0 }}>Eigen</span>
            )}
            {exercise.home_friendly && !exercise._isCustom && (
              <div style={{ padding: '0.15rem 0.45rem', background: '#10b981', borderRadius: 4, fontSize: '0.6rem', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1, flexShrink: 0 }}>Thuis</div>
            )}
          </div>
          <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {exercise.equipment && <span style={{ textTransform: 'capitalize' }}>{exercise.equipment}</span>}
            {exercise.type && <span>• {exercise.type}</span>}
          </div>
        </div>

        <div style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChevronRight size={isMobile ? 18 : 20} color={showActions ? '#FFD700' : 'rgba(255,215,0,0.3)'} strokeWidth={2.5}
            style={{ transform: showActions ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </div>
      </div>

      {/* Actie knoppen */}
      {showActions && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem 0.625rem', background: 'rgba(255,215,0,0.02)' }}>
          <button onClick={() => { onSelect(); setShowActions(false) }}
            style={{ flex: 1, padding: '0.6rem 0.85rem', background: 'rgba(255,215,0,0.14)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 8, color: '#FFD700', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 }}>
            📅 Deze week
          </button>
          <button onClick={() => { onSelectPermanent(); setShowActions(false) }}
            style={{ flex: 1, padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 }}>
            📌 Permanent
          </button>
        </div>
      )}
    </div>
  )
}
