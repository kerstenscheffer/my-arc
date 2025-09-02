// src/modules/workout/components/AlternativeExercises.jsx
// ENHANCED VERSION - Smart filtering, equipment matching, mobile gestures

import { useState, useEffect, useRef } from 'react'
import { 
  ChevronRight, Search, X, Activity, Dumbbell, Filter, 
  TrendingUp, Home, Users, Zap, Award, Info
} from 'lucide-react'
import WorkoutService from '../WorkoutService'
import EXERCISE_DATABASE, { 
  EQUIPMENT_TYPES, 
  DIFFICULTY_LEVELS,
  getSimilarExercises,
  getExercisesForMuscle,
  searchExercises 
} from '../constants/exerciseDatabase'

export default function AlternativeExercises({ exercise, onSelect, onClose, db }) {
  const [alternatives, setAlternatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const isMobile = window.innerWidth <= 768
  const modalRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  
  // Create service instance with db
  const workoutService = new WorkoutService(db)
  
  useEffect(() => {
    loadAlternatives()
  }, [exercise, selectedCategory, selectedEquipment, selectedDifficulty])
  
  const loadAlternatives = async () => {
    setLoading(true)
    
    try {
      // Build filters
      const filters = {
        type: selectedCategory !== 'all' ? selectedCategory : undefined,
        equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
      }
      
      // Get exercises based on muscle group and filters
      let exercises = getExercisesForMuscle(exercise.muscleGroup || 'chest', filters)
      
      // If we have a current exercise with details, get similar ones
      if (exercise.equipment || exercise.difficulty) {
        const similar = getSimilarExercises(exercise, exercise.muscleGroup || 'chest')
        // Merge similar exercises with filtered ones
        const uniqueExercises = new Map()
        similar.forEach(ex => uniqueExercises.set(ex.name, { ...ex, similarity: ex.score }))
        exercises.forEach(ex => {
          if (!uniqueExercises.has(ex.name)) {
            uniqueExercises.set(ex.name, { ...ex, similarity: 0 })
          }
        })
        exercises = Array.from(uniqueExercises.values())
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      }
      
      setAlternatives(exercises)
    } catch (error) {
      console.error('Error loading alternatives:', error)
      setAlternatives([])
    }
    
    setLoading(false)
  }
  
  // Touch handlers for swipe to close
  const handleTouchStart = (e) => {
    if (!isMobile) return
    startY.current = e.touches[0].clientY
  }
  
  const handleTouchMove = (e) => {
    if (!isMobile || !modalRef.current) return
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`
      modalRef.current.style.opacity = 1 - (deltaY / 300)
    }
  }
  
  const handleTouchEnd = () => {
    if (!isMobile || !modalRef.current) return
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      modalRef.current.style.transform = 'translateY(0)'
      modalRef.current.style.opacity = 1
    }
  }
  
  // Filter alternatives based on search
  const filteredAlternatives = alternatives.filter(alt => 
    alt.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Group alternatives by type
  const groupedAlternatives = {
    compound: filteredAlternatives.filter(a => 
      EXERCISE_DATABASE[exercise.muscleGroup?.toLowerCase()]?.compound?.some(e => 
        typeof e === 'string' ? e === a.name : e.name === a.name
      )
    ),
    isolation: filteredAlternatives.filter(a => 
      EXERCISE_DATABASE[exercise.muscleGroup?.toLowerCase()]?.isolation?.some(e => 
        typeof e === 'string' ? e === a.name : e.name === a.name
      )
    )
  }
  
  // Equipment icon mapping
  const getEquipmentIcon = (equipment) => {
    switch(equipment) {
      case 'bodyweight': return <Home size={14} />
      case 'dumbbell': return <Dumbbell size={14} />
      case 'barbell': return <Activity size={14} />
      case 'cable': return <Zap size={14} />
      case 'machine': return <Users size={14} />
      default: return <Dumbbell size={14} />
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 2000, // Hoger dan WorkoutDetails (1000)
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease',
      backdropFilter: 'blur(20px)'
    }}
    onClick={onClose}
    >
      <div 
        ref={modalRef}
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, #171717 0%, #0a0a0a 100%)',
          borderRadius: '24px 24px 0 0',
          padding: isMobile ? '1.25rem 1rem 2rem' : '1.5rem 1.5rem 2rem',
          maxHeight: isMobile ? '92vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -10px 40px rgba(249, 115, 22, 0.15)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderBottom: 'none',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          touchAction: 'none',
          position: 'relative',
          zIndex: 10000 // Extra hoge z-index voor de modal content
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle Bar */}
        <div style={{
          width: '48px',
          height: '5px',
          background: 'rgba(249, 115, 22, 0.3)',
          borderRadius: '3px',
          margin: '0 auto 1.25rem',
          cursor: 'grab'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 0.25rem 0',
              fontWeight: '800'
            }}>
              Alternatieve Oefeningen
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Dumbbell size={14} />
              {exercise.muscleGroup 
                ? `${exercise.muscleGroup.charAt(0).toUpperCase() + exercise.muscleGroup.slice(1)} • ${filteredAlternatives.length} opties`
                : 'Selecteer vervanging'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Current Exercise Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: '14px',
          padding: isMobile ? '0.875rem' : '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Activity size={isMobile ? 16 : 18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.65rem',
              color: '#f97316',
              margin: '0 0 0.1rem 0',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Huidige oefening
            </p>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#fff',
              margin: 0,
              fontWeight: '700'
            }}>
              {exercise.name}
            </p>
            {exercise.equipment && (
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                margin: '0.2rem 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                {getEquipmentIcon(exercise.equipment)}
                {EQUIPMENT_TYPES[exercise.equipment]}
              </p>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '0.75rem'
        }}>
          <Search 
            size={isMobile ? 16 : 18} 
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(249, 115, 22, 0.4)'
            }}
          />
          <input
            type="text"
            placeholder="Zoek oefeningen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem 0.75rem 0.75rem 2.5rem' : '0.875rem 0.875rem 0.875rem 2.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(249, 115, 22, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.875rem' : '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.1)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }}
          />
        </div>
        
        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
              background: showFilters
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showFilters ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              color: showFilters ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px'
            }}
          >
            <Filter size={14} />
            Filters
          </button>
          
          {/* Category Pills */}
          {['all', 'compound', 'isolation'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: selectedCategory === category
                  ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  selectedCategory === category 
                    ? '#f97316' 
                    : 'rgba(255,255,255,0.1)'
                }`,
                borderRadius: '10px',
                color: selectedCategory === category ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '36px'
              }}
            >
              {category === 'compound' && <TrendingUp size={14} />}
              {category === 'isolation' && <Activity size={14} />}
              {category === 'all' ? 'Alle' : category}
            </button>
          ))}
        </div>
        
        {/* Advanced Filters (collapsible) */}
        {showFilters && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            padding: isMobile ? '0.75rem' : '1rem',
            marginBottom: '0.75rem',
            border: '1px solid rgba(249, 115, 22, 0.08)',
            animation: 'slideDown 0.3s ease'
          }}>
            {/* Equipment Filter */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Equipment
              </label>
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setSelectedEquipment('all')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: selectedEquipment === 'all' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedEquipment === 'all' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    color: selectedEquipment === 'all' ? '#f97316' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Alle
                </button>
                {Object.entries(EQUIPMENT_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedEquipment(key)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: selectedEquipment === key ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedEquipment === key ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      color: selectedEquipment === key ? '#f97316' : 'rgba(255,255,255,0.5)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {getEquipmentIcon(key)}
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <label style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Moeilijkheid
              </label>
              <div style={{
                display: 'flex',
                gap: '0.4rem'
              }}>
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: selectedDifficulty === 'all' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedDifficulty === 'all' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    color: selectedDifficulty === 'all' ? '#f97316' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Alle
                </button>
                {Object.entries(DIFFICULTY_LEVELS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: selectedDifficulty === key ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedDifficulty === key ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      color: selectedDifficulty === key ? '#f97316' : 'rgba(255,255,255,0.5)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Award size={12} color={config.color} />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Exercise List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.25rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid rgba(249, 115, 22, 0.2)',
                borderTopColor: '#f97316',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: '1rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Alternatieven laden...
              </p>
            </div>
          ) : filteredAlternatives.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <Dumbbell size={48} color="rgba(249, 115, 22, 0.2)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>
                Geen oefeningen gevonden
              </p>
              <p style={{ 
                fontSize: isMobile ? '0.8rem' : '0.85rem', 
                marginTop: '0.5rem', 
                color: 'rgba(255,255,255,0.3)' 
              }}>
                Probeer je filters aan te passen
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '0.5rem' : '0.75rem'
            }}>
              {/* Similar Exercises First */}
              {filteredAlternatives.filter(a => a.similarity && a.similarity > 0).length > 0 && (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: '0.5rem',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Award size={14} color="rgba(249, 115, 22, 0.5)" />
                    Aanbevolen alternatieven
                  </div>
                  {filteredAlternatives
                    .filter(a => a.similarity && a.similarity > 0)
                    .map((alt) => (
                      <ExerciseOption
                        key={alt.name}
                        exercise={alt}
                        onSelect={() => {
                          onSelect(exercise, alt)
                          onClose()
                        }}
                        isRecommended={true}
                        isMobile={isMobile}
                      />
                    ))
                  }
                </>
              )}
              
              {/* Compound Exercises */}
              {groupedAlternatives.compound.filter(a => !a.similarity || a.similarity === 0).length > 0 && (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: '0.75rem',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <TrendingUp size={14} color="rgba(249, 115, 22, 0.5)" />
                    Compound Bewegingen
                  </div>
                  {groupedAlternatives.compound
                    .filter(a => !a.similarity || a.similarity === 0)
                    .map((alt) => (
                      <ExerciseOption
                        key={alt.name}
                        exercise={alt}
                        onSelect={() => {
                          onSelect(exercise, alt)
                          onClose()
                        }}
                        isCompound={true}
                        isMobile={isMobile}
                      />
                    ))
                  }
                </>
              )}
              
              {/* Isolation Exercises */}
              {groupedAlternatives.isolation.filter(a => !a.similarity || a.similarity === 0).length > 0 && (
                <>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: '0.75rem',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Activity size={14} color="rgba(249, 115, 22, 0.5)" />
                    Isolatie Bewegingen
                  </div>
                  {groupedAlternatives.isolation
                    .filter(a => !a.similarity || a.similarity === 0)
                    .map((alt) => (
                      <ExerciseOption
                        key={alt.name}
                        exercise={alt}
                        onSelect={() => {
                          onSelect(exercise, alt)
                          onClose()
                        }}
                        isCompound={false}
                        isMobile={isMobile}
                      />
                    ))
                  }
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Hide scrollbar but keep functionality */
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// Enhanced Exercise Option Component
function ExerciseOption({ exercise, onSelect, isCompound, isRecommended, isMobile }) {
  const [isPressed, setIsPressed] = useState(false)
  
  // Equipment icon
  const getEquipmentIcon = (equipment) => {
    switch(equipment) {
      case 'bodyweight': return <Home size={12} />
      case 'dumbbell': return <Dumbbell size={12} />
      case 'barbell': return <Activity size={12} />
      case 'cable': return <Zap size={12} />
      case 'machine': return <Users size={12} />
      default: return null
    }
  }
  
  // Difficulty color
  const getDifficultyColor = (difficulty) => {
    return DIFFICULTY_LEVELS[difficulty]?.color || 'rgba(255,255,255,0.5)'
  }
  
  return (
    <button 
      onClick={onSelect}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        padding: isMobile ? '0.875rem' : '1rem',
        background: isPressed 
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)'
          : isRecommended
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        border: `1px solid ${
          isRecommended 
            ? 'rgba(249, 115, 22, 0.2)' 
            : 'rgba(249, 115, 22, 0.08)'
        }`,
        borderRadius: '12px',
        color: '#fff',
        fontSize: isMobile ? '0.9rem' : '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: isMobile ? '50px' : '56px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(234, 88, 12, 0.06) 100%)'
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.25)'
          e.currentTarget.style.transform = 'translateX(4px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = isRecommended
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)'
          e.currentTarget.style.borderColor = isRecommended 
            ? 'rgba(249, 115, 22, 0.2)' 
            : 'rgba(249, 115, 22, 0.08)'
          e.currentTarget.style.transform = 'translateX(0)'
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '0.6rem' : '0.75rem',
        flex: 1
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isRecommended
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
            : isCompound 
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          flexShrink: 0,
          boxShadow: isRecommended
            ? '0 0 12px rgba(251, 191, 36, 0.5)'
            : isCompound 
              ? '0 0 10px rgba(59, 130, 246, 0.4)'
              : '0 0 10px rgba(249, 115, 22, 0.4)'
        }} />
        
        <div style={{ flex: 1 }}>
          <span style={{ display: 'block', marginBottom: '0.2rem' }}>
            {exercise.name}
          </span>
          
          {/* Exercise Details */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            marginTop: '0.25rem'
          }}>
            {exercise.equipment && (
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                {getEquipmentIcon(exercise.equipment)}
                {EQUIPMENT_TYPES[exercise.equipment]}
              </span>
            )}
            
            {exercise.difficulty && (
              <span style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '6px',
                background: `${getDifficultyColor(exercise.difficulty)}20`,
                color: getDifficultyColor(exercise.difficulty),
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {DIFFICULTY_LEVELS[exercise.difficulty].label}
              </span>
            )}
            
            {exercise.targetArea && (
              <span style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic'
              }}>
                {exercise.targetArea.replace(/-/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {isRecommended && (
          <Award size={16} color="#fbbf24" style={{ marginRight: '0.25rem' }} />
        )}
        <ChevronRight size={16} color="rgba(249, 115, 22, 0.5)" />
      </div>
    </button>
  )
}
