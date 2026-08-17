// src/modules/workout/components/todays-workout/components/AddExerciseModal.jsx
import { X, Search, Plus, Dumbbell, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ExerciseService from '../../../../../services/ExerciseService'
import CustomExerciseModal from './CustomExerciseModal'

const getFallbackImage = (exercise) => {
  const muscles = (exercise.primair_spieren || '').toLowerCase()
  if (muscles.includes('chest')) return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=200&h=200&fit=crop&q=60'
  if (muscles.includes('back')) return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=200&h=200&fit=crop&q=60'
  if (muscles.includes('leg')) return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=200&h=200&fit=crop&q=60'
  if (muscles.includes('shoulder')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&h=200&fit=crop&q=60'
  if (muscles.includes('bicep') || muscles.includes('tricep')) return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=200&fit=crop&q=60'
  if (muscles.includes('core')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop&q=60'
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&q=60'
}

const MUSCLE_LABELS = {
  'chest': 'Borst', 'back': 'Rug', 'shoulders': 'Schouders',
  'biceps': 'Biceps', 'triceps': 'Triceps', 'legs': 'Benen', 'core': 'Core'
}

export default function AddExerciseModal({ onClose, onSave, client, db, schema, workoutDayKey }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState('zoeken') // 'zoeken' | 'nieuw'
  const [showCustomModal, setShowCustomModal] = useState(false)

  // Zoeken state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMuscle, setSelectedMuscle] = useState(null)
  const [exerciseImages, setExerciseImages] = useState({})

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadAll()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const loadAll = async () => {
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
        image_url: c.image_url || null, _isCustom: true
      }))

      const seen = new Set(customExercises.map(c => c.name.toLowerCase()))
      const deduped = (dbExercises || []).filter(ex => !seen.has(ex.name.toLowerCase()))
      const all = [...customExercises, ...deduped]
      setAllExercises(all)
      setResults(all)

      // Images voor custom
      const images = {}
      customExercises.forEach(c => { if (c.image_url) images[c.name] = c.image_url })
      setExerciseImages(images)
    } catch (e) {
      console.error('❌ LoadAll failed:', e)
    } finally {
      setLoading(false)
    }
  }

  // Filter
  useEffect(() => {
    let filtered = [...allExercises]
    if (selectedMuscle) filtered = filtered.filter(ex => ex.primair_spieren === selectedMuscle)
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(ex => ex.name.toLowerCase().includes(q))
    }
    setResults(filtered)
  }, [query, selectedMuscle, allExercises])

  const muscleGroups = [...new Set(allExercises.filter(ex => !ex._isCustom).map(ex => ex.primair_spieren).filter(Boolean))].sort()

  const handleSelectExercise = (exercise) => {
    // Voeg toe met _pendingPermanent flag zodat ExerciseCard de knop toont
    onSave({
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '10',
      rust: exercise.rust || '90s',
      primairSpieren: exercise.primair_spieren || null,
      equipment: exercise.equipment || null,
      image_url: exercise.image_url || exerciseImages[exercise.name] || null,
      type: exercise.type || 'standard',
      _pendingPermanent: true // signaal voor ExerciseCard
    })
  }

  const handleCustomSave = (exercise) => {
    setShowCustomModal(false)
    onSave(exercise)
  }

  const handleClose = () => { setVisible(false); setTimeout(() => onClose(), 300) }

  if (showCustomModal) {
    return (
      <CustomExerciseModal
        onClose={() => setShowCustomModal(false)}
        onSave={handleCustomSave}
        client={client}
        db={db}
        schema={schema}
      />
    )
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '2rem', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>

      <div style={{ maxWidth: isMobile ? '100%' : '560px', width: '100%', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '90vh', background: '#0a0a0a', border: isMobile ? 'none' : '1px solid rgba(255,215,0,0.15)', borderRadius: isMobile ? '0' : '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Oefening Toevoegen</h2>
            <button onClick={handleClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px' }}>
            {[['zoeken', 'Zoeken'], ['nieuw', 'Eigen oefening']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '0.5rem', background: tab === key ? 'rgba(255,215,0,0.12)' : 'transparent', border: tab === key ? '1px solid rgba(255,215,0,0.25)' : '1px solid transparent', borderRadius: '8px', color: tab === key ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 0.15s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: ZOEKEN */}
        {tab === 'zoeken' && (
          <>
            <div style={{ padding: isMobile ? '0.75rem 1rem 0' : '0.875rem 1.25rem 0', flexShrink: 0 }}>
              {/* Zoekbalk */}
              <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
                <Search size={16} color="rgba(255,215,0,0.4)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Zoek oefening..." value={query} onChange={(e) => setQuery(e.target.value)} autoFocus style={{ width: '100%', padding: '0.7rem 0.875rem 0.7rem 2.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', fontWeight: '500', outline: 'none' }} />
              </div>

              {/* Spiergroep filter pills */}
              <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
                <button onClick={() => setSelectedMuscle(null)} style={{ padding: '0.3rem 0.7rem', background: !selectedMuscle ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: !selectedMuscle ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: !selectedMuscle ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  Alles
                </button>
                {muscleGroups.map(m => (
                  <button key={m} onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)} style={{ padding: '0.3rem 0.7rem', background: selectedMuscle === m ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: selectedMuscle === m ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: selectedMuscle === m ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    {MUSCLE_LABELS[m] || m}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '0.65rem', color: 'rgba(255,215,0,0.4)', fontWeight: '600', textAlign: 'center', paddingBottom: '0.375rem' }}>
                {results.length} oefeningen
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  Geen resultaten — probeer een andere zoekterm
                </div>
              ) : (
                results.map((ex, i) => (
                  <div key={`${ex._isCustom ? 'c' : 'd'}-${ex.id || i}`} onClick={() => handleSelectExercise(ex)} style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.background = 'rgba(255,215,0,0.03)' }}
                    onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.background = 'transparent' }}
                    onTouchStart={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.04)'}
                    onTouchEnd={(e) => e.currentTarget.style.background = 'transparent'}>

                    {/* Thumbnail */}
                    <div style={{ width: isMobile ? '52px' : '60px', minHeight: isMobile ? '52px' : '60px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${exerciseImages[ex.name] || ex.image_url || getFallbackImage(ex)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ex.name}
                        </span>
                        {ex._isCustom && (
                          <span style={{ fontSize: '0.55rem', background: 'rgba(255,215,0,0.15)', color: '#FFD700', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: '800', textTransform: 'uppercase', flexShrink: 0 }}>Eigen</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600', display: 'flex', gap: '0.4rem' }}>
                        {ex.primair_spieren && <span style={{ textTransform: 'capitalize' }}>{MUSCLE_LABELS[ex.primair_spieren] || ex.primair_spieren}</span>}
                        {ex.equipment && <span>• {ex.equipment}</span>}
                      </div>
                    </div>

                    <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ChevronRight size={18} color="rgba(255,215,0,0.3)" strokeWidth={2.5} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* TAB: EIGEN OEFENING */}
        {tab === 'nieuw' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={24} color="#FFD700" strokeWidth={2} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginBottom: '0.375rem' }}>Eigen oefening</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500', lineHeight: 1.5 }}>
                Maak een nieuwe oefening aan met foto, sets, reps en spiergroep. Daarna kun je hem permanent in je plan zetten.
              </div>
            </div>
            <button onClick={() => setShowCustomModal(true)} style={{ padding: '0.875rem 2rem', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', color: '#FFD700', fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Plus size={18} strokeWidth={2.5} />
              Nieuwe oefening aanmaken
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  )
}
