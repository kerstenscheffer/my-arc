// src/modules/manual-workout-builder/components/ExerciseSelector.jsx
import { useState, useEffect } from 'react'
import { X, Search, Dumbbell, Filter } from 'lucide-react'
import EXERCISE_DATABASE from '../../workout/constants/exerciseDatabase'

export default function ExerciseSelector({ onSelect, onClose, isMobile }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [selectedEquipment, setSelectedEquipment] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [exercises, setExercises] = useState([])
  
  // Get all exercises on mount
  useEffect(() => {
    loadExercises()
  }, [selectedMuscle, selectedEquipment, selectedDifficulty, searchTerm])
  
  const loadExercises = () => {
    let allExercises = []
    
    // Collect all exercises from database
    Object.entries(EXERCISE_DATABASE).forEach(([muscle, data]) => {
      if (data.compound) {
        data.compound.forEach(ex => {
          allExercises.push({
            ...ex,
            muscle,
            type: 'compound',
            primairSpieren: muscle
          })
        })
      }
      if (data.isolation) {
        data.isolation.forEach(ex => {
          allExercises.push({
            ...ex,
            muscle,
            type: 'isolation',
            primairSpieren: muscle
          })
        })
      }
    })
    
    // Apply filters
    let filtered = allExercises
    
    if (selectedMuscle !== 'all') {
      filtered = filtered.filter(ex => ex.muscle === selectedMuscle)
    }
    
    if (selectedEquipment !== 'all') {
      filtered = filtered.filter(ex => ex.equipment === selectedEquipment)
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setExercises(filtered)
  }
  
  // Get unique muscle groups
  const muscleGroups = ['all', ...Object.keys(EXERCISE_DATABASE)]
  
  // Get unique equipment types
  const equipmentTypes = ['all', 'bodyweight', 'dumbbell', 'barbell', 'cable', 'machine', 'band']
  
  // Difficulty levels
  const difficultyLevels = ['all', 'beginner', 'intermediate', 'advanced']
  
  // Difficulty colors
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return '#10b981'
      case 'intermediate': return '#f97316'
      case 'advanced': return '#dc2626'
      default: return 'rgba(255, 255, 255, 0.5)'
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Dumbbell size={24} color="#10b981" />
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              Exercise Library
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <X size={24} color="rgba(255, 255, 255, 0.5)" />
          </button>
        </div>
        
        {/* Search & Filters */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <Search 
              size={20} 
              color="rgba(255, 255, 255, 0.5)" 
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <input
              type="text"
              placeholder="Zoek oefening..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Spiergroepen</option>
              {muscleGroups.slice(1).map(muscle => (
                <option key={muscle} value={muscle}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Equipment</option>
              {equipmentTypes.slice(1).map(equipment => (
                <option key={equipment} value={equipment}>
                  {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Niveaus</option>
              {difficultyLevels.slice(1).map(level => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{
            marginTop: '0.75rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {exercises.length} oefeningen gevonden
          </div>
        </div>
        
        {/* Exercise List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem'
          }}>
            {exercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => onSelect(exercise)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h4 style={{
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {exercise.name}
                  </h4>
                  
                  <span style={{
                    background: exercise.type === 'compound' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(139, 92, 246, 0.2)',
                    border: `1px solid ${exercise.type === 'compound' 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(139, 92, 246, 0.3)'}`,
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    color: exercise.type === 'compound' ? '#10b981' : '#8b5cf6',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '500'
                  }}>
                    {exercise.type}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Spier:</span>
                    <strong style={{ color: '#10b981' }}>
                      {exercise.muscle.charAt(0).toUpperCase() + exercise.muscle.slice(1)}
                    </strong>
                  </span>
                  
                  {exercise.equipment && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Equipment:</span>
                      <strong style={{ color: '#3b82f6' }}>
                        {exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1)}
                      </strong>
                    </span>
                  )}
                  
                  {exercise.difficulty && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Niveau:</span>
                      <strong style={{ color: getDifficultyColor(exercise.difficulty) }}>
                        {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                      </strong>
                    </span>
                  )}
                </div>
                
                {exercise.targetArea && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontStyle: 'italic'
                  }}>
                    Target: {exercise.targetArea.replace(/-/g, ' ')}
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {exercises.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.3)',
              padding: '3rem',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              Geen oefeningen gevonden met deze filters
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
