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
  
  // Progressive reveal
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    loadAlternatives()
  }, [])
  
  // Load alternative exercises
  const loadAlternatives = async () => {
    setLoading(true)
    try {
      const muscleGroup = exercise.primairSpieren || 'chest'
      console.log('🔍 Loading alternatives for:', muscleGroup, 'Current:', exercise.name)
      const alts = await db.getAlternativeExercises(muscleGroup, exercise.name)
      console.log('✅ Alternatives loaded:', alts.length, alts)
      setAlternatives(alts)
      
      const all = await db.getAllExercisesForSwap()
      console.log('✅ All exercises loaded:', all.length)
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
  
  // Filter alternatives by search
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
  
  // Handle swap
  const handleSwap = async (newExercise) => {
    console.log('🔍 SWAP CLICKED!', newExercise.name)
    
    if (!schema?.id || !workoutDayKey || swapping) {
      console.log('❌ Cannot swap:', { schemaId: schema?.id, workoutDayKey, swapping })
      return
    }
    
    setSwapping(true)
    
    try {
      const updatedExercise = {
        ...exercise,
        name: newExercise.name,
        equipment: newExercise.equipment || exercise.equipment,
        primairSpieren: exercise.primairSpieren
      }
      
      console.log('🔄 Updating exercise:', updatedExercise)
      
      await db.updateExerciseInSchema(
        schema.id,
        workoutDayKey,
        exerciseIndex,
        updatedExercise
      )
      
      console.log('✅ Exercise swapped successfully')
      
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
  
  // Handle custom exercise created
  const handleCustomCreated = (customExercise) => {
    setShowCustomModal(false)
    handleSwap(customExercise)
  }
  
  // Handle close
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Prevent body scroll
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
            backdropFilter: 'blur(20px)',
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
            background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: isMobile ? '12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 60px rgba(249, 115, 22, 0.1)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}
        >
          {/* Top glow accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
            opacity: 0.6
          }} />
          
          {/* Header */}
          <div style={{
            padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isMobile ? '0.75rem' : '1rem'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '800',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                flex: 1
              }}>
                Wissel Oefening
              </h2>
              
              <button
                onClick={handleClose}
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'rgba(23, 23, 23, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '10px',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginLeft: isMobile ? '0.75rem' : '1rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Current exercise */}
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: isMobile ? '0.625rem' : '0.75rem',
              fontWeight: '600'
            }}>
              Huidig: <span style={{ color: '#f97316' }}>{exercise.name}</span>
            </div>
            
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: isMobile ? '0.625rem' : '0.75rem'
            }}>
              <button
                onClick={() => setSearchMode('alternatives')}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  background: searchMode === 'alternatives' 
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
                    : 'rgba(23, 23, 23, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: searchMode === 'alternatives'
                    ? '1px solid rgba(249, 115, 22, 0.3)'
                    : '1px solid rgba(249, 115, 22, 0.15)',
                  borderRadius: '8px',
                  color: searchMode === 'alternatives' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  minHeight: '44px'
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
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
                    : 'rgba(23, 23, 23, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: searchMode === 'all'
                    ? '1px solid rgba(249, 115, 22, 0.3)'
                    : '1px solid rgba(249, 115, 22, 0.15)',
                  borderRadius: '8px',
                  color: searchMode === 'all' ? '#f97316' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  minHeight: '44px'
                }}
              >
                Alle ({allExercises.length})
              </button>
            </div>
            
            {/* Search bar */}
            <div style={{
              position: 'relative'
            }}>
              <Search 
                size={isMobile ? 16 : 18} 
                color="rgba(249, 115, 22, 0.5)"
                style={{
                  position: 'absolute',
                  left: isMobile ? '0.75rem' : '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder={searchMode === 'all' ? "Zoek alle oefeningen..." : "Zoek alternatief..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.625rem 0.75rem 0.625rem 2.5rem' : '0.75rem 1rem 0.75rem 3rem',
                  background: 'rgba(23, 23, 23, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(249, 115, 22, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: '44px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.15)'
                  e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                }}
              />
            </div>
            
            {/* Results count */}
            {searchQuery && (
              <div style={{
                marginTop: '0.4rem',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                {filteredAlternatives.length} resultaten
              </div>
            )}
          </div>
          
          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '0.875rem' : '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid rgba(249, 115, 22, 0.2)',
                  borderTopColor: '#f97316',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600'
                }}>
                  Alternatieven laden...
                </p>
              </div>
            ) : filteredAlternatives.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2.5rem',
                background: 'rgba(23, 23, 23, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(249, 115, 22, 0.1)'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>
                  {searchQuery ? 'Geen resultaten' : 'Geen alternatieven'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(249, 115, 22, 0.1)',
                      border: '1px solid rgba(249, 115, 22, 0.2)',
                      borderRadius: '8px',
                      color: '#f97316',
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minHeight: '44px'
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
                gap: isMobile ? '0.625rem' : '0.75rem'
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
            
            {/* Custom exercise button */}
            <button
              onClick={() => setShowCustomModal(true)}
              style={{
                width: '100%',
                marginTop: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(23, 23, 23, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px dashed rgba(249, 115, 22, 0.25)',
                borderRadius: '8px',
                color: '#f97316',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
                  e.currentTarget.style.borderStyle = 'solid'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                  e.currentTarget.style.borderStyle = 'dashed'
                }
              }}
            >
              <Plus size={isMobile ? 16 : 18} />
              Eigen Oefening
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
      
      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <div style={{ zIndex: 10000 }}>
          <CustomExerciseModal
            onClose={() => setShowCustomModal(false)}
            onSave={handleCustomCreated}
            client={null}
            db={db}
          />
        </div>
      )}
    </>
  )
}

// Alternative Card Component
function AlternativeCard({ exercise, onSelect, swapping }) {
  const isMobile = window.innerWidth <= 768
  
  const handleClick = (e) => {
    console.log('🖱️ CARD CLICKED!', exercise.name, 'Swapping:', swapping)
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
        padding: isMobile ? '0.75rem' : '1rem',
        background: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(249, 115, 22, 0.15)',
        borderRadius: '8px',
        cursor: swapping ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        opacity: swapping ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile && !swapping) {
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
          e.currentTarget.style.transform = 'translateX(4px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.15)'
          e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
          e.currentTarget.style.transform = 'translateX(0)'
        }
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          width: isMobile ? '20px' : '22px',
          height: isMobile ? '20px' : '22px',
          borderRadius: '6px',
          background: 'rgba(249, 115, 22, 0.2)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(249, 115, 22, 0.3)'
        }}>
          <RefreshCw 
            size={isMobile ? 11 : 12} 
            color="#f97316"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.6))'
            }}
          />
        </div>
        <h3 style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '800',
          color: '#fff',
          margin: 0,
          flex: 1,
          letterSpacing: '-0.02em'
        }}>
          {exercise.name}
        </h3>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.5)',
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
