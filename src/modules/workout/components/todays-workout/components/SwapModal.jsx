// src/modules/workout/components/todays-workout/components/SwapModal.jsx
import { X, RefreshCw, Search, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CustomExerciseModal from './CustomExerciseModal'

export default function SwapModal({ 
  exercise, 
  exerciseIndex, 
  workoutDayKey, 
  schema, 
  onClose, 
  onSwapComplete, 
  db 
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [alternatives, setAlternatives] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [filteredAlternatives, setFilteredAlternatives] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [swapping, setSwapping] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [searchMode, setSearchMode] = useState('alternatives')
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadAlternatives()
  }, [])
  
  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const muscleGroup = exercise.primairSpieren || 'chest'
      const alts = await db.getAlternativeExercises(muscleGroup, exercise.name)
      setAlternatives(alts)
      
      const all = await db.getAllExercisesForSwap()
      setAllExercises(all)
      
      setFilteredAlternatives(alts)
    } catch (error) {
      console.error('❌ Error loading alternatives:', error)
      setAlternatives([])
      setAllExercises([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const sourceList = searchMode === 'all' ? allExercises : alternatives
    
    if (!searchQuery.trim()) {
      setFilteredAlternatives(sourceList)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = sourceList.filter(alt =>
      alt.name.toLowerCase().includes(query)
    )
    setFilteredAlternatives(filtered)
  }, [searchQuery, alternatives, allExercises, searchMode])
  
  const handleSwap = async (newExercise) => {
    if (!schema?.id || !workoutDayKey || swapping) return
    
    setSwapping(true)
    
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren
      }
      
      await db.updateExerciseInSchema(
        schema.id,
        workoutDayKey,
        exerciseIndex,
        updatedExercise
      )
      
      if (navigator.vibrate) navigator.vibrate(50)
      
      setVisible(false)
      
      setTimeout(() => {
        onSwapComplete({ reloadSchema: true })
        onClose()
      }, 300)
      
    } catch (error) {
      console.error('❌ Swap failed:', error)
      alert('Kon oefening niet wisselen. Probeer opnieuw.')
      setSwapping(false)
    }
  }
  
  const handleCustomCreated = (customExercise) => {
    setShowCustomModal(false)
    handleSwap(customExercise)
  }
  
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])
  
  return (
    <>
      {createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1rem' : '2rem',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
        <div
          style={{
            maxWidth: isMobile ? '100%' : '700px',
            width: '100%',
            maxHeight: isMobile ? '90vh' : '80vh',
            background: '#000',
            border: '2px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '900',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
                flex: 1
              }}>
                Wissel Oefening
              </h2>
              
              <button
                onClick={handleClose}
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'transparent',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '0',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginLeft: '1rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={isMobile ? 20 : 24} strokeWidth={2.5} />
              </button>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Huidig: <span style={{ color: '#f97316' }}>{exercise.name}</span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <button
                onClick={() => setSearchMode('alternatives')}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  background: searchMode === 'alternatives' 
                    ? 'rgba(249, 115, 22, 0.15)' 
                    : 'rgba(249, 115, 22, 0.05)',
                  border: searchMode === 'alternatives'
                    ? '1px solid rgba(249, 115, 22, 0.4)'
                    : '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '0',
                  color: searchMode === 'alternatives' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Alternatieven ({alternatives.length})
              </button>
              
              <button
                onClick={() => setSearchMode('all')}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  background: searchMode === 'all' 
                    ? 'rgba(249, 115, 22, 0.15)' 
                    : 'rgba(249, 115, 22, 0.05)',
                  border: searchMode === 'all'
                    ? '1px solid rgba(249, 115, 22, 0.4)'
                    : '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '0',
                  color: searchMode === 'all' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Alle Oefeningen ({allExercises.length})
              </button>
            </div>
            
            <div style={{
              position: 'relative'
            }}>
              <Search 
                size={18} 
                color="rgba(249, 115, 22, 0.5)"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder={searchMode === 'all' ? "Zoek alle oefeningen..." : "Zoek alternatieve oefening..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1.25rem 0.875rem 3.5rem',
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '0',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
            
            {searchQuery && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                {filteredAlternatives.length} resultaten gevonden
              </div>
            )}
          </div>
          
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '1rem' : '1.5rem',
            WebkitOverflowScrolling: 'touch'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(249, 115, 22, 0.2)',
                  borderTopColor: '#f97316',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '600'
                }}>
                  Alternatieven laden...
                </p>
              </div>
            ) : filteredAlternatives.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  {searchQuery ? 'Geen resultaten voor je zoekopdracht' : 'Geen alternatieven gevonden'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(249, 115, 22, 0.1)',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      borderRadius: '0',
                      color: '#f97316',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Wis zoekopdracht
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {filteredAlternatives.map((alt, index) => (
                  <AlternativeCard
                    key={index}
                    exercise={alt}
                    onSelect={() => handleSwap(alt)}
                    swapping={swapping}
                  />
                ))}
              </div>
            )}
            
            <button
              onClick={() => {
                console.log('🔵 + Eigen Oefening CLICKED')
                console.log('🔵 Current showCustomModal:', showCustomModal)
                setShowCustomModal(true)
                console.log('🔵 setShowCustomModal(true) called')
              }}
              style={{
                width: '100%',
                marginTop: isMobile ? '1rem' : '1.5rem',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '2px dashed rgba(249, 115, 22, 0.3)',
                borderRadius: '0',
                color: '#f97316',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Plus size={isMobile ? 18 : 20} />
              Eigen Oefening Toevoegen
            </button>
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>,
      document.body
      )}
      
      {/* Custom Exercise Modal - PORTAL FIX WITH WRAPPER */}
      {showCustomModal && (
        <>
          {console.log('🟢 RENDERING CustomExerciseModal, showCustomModal:', showCustomModal)}
          {createPortal(
            <div style={{ position: 'relative', zIndex: 10001 }}>
              <CustomExerciseModal
                onClose={() => {
                  console.log('🔴 CustomExerciseModal onClose called')
                  setShowCustomModal(false)
                }}
                onSave={(customExercise) => {
                  console.log('🟢 CustomExerciseModal onSave called:', customExercise)
                  handleCustomCreated(customExercise)
                }}
                client={null}
                db={db}
              />
            </div>,
            document.body
          )}
        </>
      )}
    </>
  )
}

function AlternativeCard({ exercise, onSelect, swapping }) {
  const isMobile = window.innerWidth <= 768
  
  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!swapping) {
      onSelect()
    }
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={swapping}
      style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'rgba(10, 10, 10, 0.8)',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '0',
        cursor: swapping ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        opacity: swapping ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        <RefreshCw 
          size={isMobile ? 16 : 18} 
          color="#f97316"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
          }}
        />
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '800',
          color: '#fff',
          margin: 0,
          flex: 1
        }}>
          {exercise.name}
        </h3>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600'
      }}>
        {exercise.equipment && (
          <span>{exercise.equipment}</span>
        )}
        {exercise.sets && exercise.reps && (
          <span>• {exercise.sets} × {exercise.reps}</span>
        )}
      </div>
    </button>
  )
}
