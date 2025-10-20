// src/modules/workout/components/todays-workout/components/ExerciseList.jsx
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import ExerciseCard from './ExerciseCard'
import CustomExerciseModal from './CustomExerciseModal'

export default function ExerciseList({ 
  exercises, 
  todaysLogs, 
  onLogsUpdate, 
  client, 
  schema,
  db,
  workoutDayKey 
}) {
  const isMobile = window.innerWidth <= 768
  const [visibleExercises, setVisibleExercises] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [localExercises, setLocalExercises] = useState(exercises || [])
  
  // Progressive reveal - stagger each exercise
  useEffect(() => {
    localExercises.forEach((_, index) => {
      setTimeout(() => {
        setVisibleExercises(prev => [...prev, index])
      }, index * 150) // 150ms stagger per exercise (was 200ms)
    })
  }, [localExercises])
  
  // Sync with parent exercises
  useEffect(() => {
    setLocalExercises(exercises || [])
  }, [exercises])
  
  // Create lookup for logged exercises
  const loggedExercises = new Set(todaysLogs.map(log => log.exercise_name))
  
  // Handle add custom exercise
  const handleAddExercise = async (newExercise) => {
    try {
      // Add to local state immediately (optimistic update)
      const updatedExercises = [...localExercises, newExercise]
      setLocalExercises(updatedExercises)
      
      // Save to database if workoutDayKey exists
      if (client?.id && db && workoutDayKey && schema) {
        // Update schema in database
        const updatedSchema = {
          ...schema,
          week_structure: {
            ...schema.week_structure,
            [workoutDayKey]: {
              ...schema.week_structure[workoutDayKey],
              exercises: updatedExercises
            }
          }
        }
        
        // Save to database
        await db.updateWorkoutSchema(schema.id, updatedSchema)
        console.log('✅ Exercise added to workout schema')
      }
      
      // Success feedback
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      // Close modal
      setShowAddModal(false)
      
    } catch (error) {
      console.error('❌ Add exercise failed:', error)
      alert('Kon oefening niet toevoegen. Probeer opnieuw.')
      // Revert optimistic update
      setLocalExercises(exercises || [])
    }
  }
  
  if (!localExercises || localExercises.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem 1rem',
        textAlign: 'center'
      }}>
        {/* Empty state message */}
        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: '12px',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            margin: 0
          }}>
            Nog geen oefeningen in deze workout
          </p>
        </div>
        
        {/* Add Exercise Button */}
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.35)'
            }
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
          <Plus size={isMobile ? 16 : 18} strokeWidth={2.5} />
          Voeg Eerste Oefening Toe
        </button>
        
        {/* Custom Exercise Modal */}
        {showAddModal && (
          <CustomExerciseModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddExercise}
            client={client}
            db={db}
          />
        )}
      </div>
    )
  }
  
  return (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {localExercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            totalExercises={localExercises.length}
            isLogged={loggedExercises.has(exercise.name)}
            previousLog={null} // Will be loaded by ExerciseCard
            onLogsUpdate={onLogsUpdate}
            client={client}
            schema={schema}
            db={db}
            workoutDayKey={workoutDayKey}
            visible={visibleExercises.includes(index)}
            delay={index * 150}
          />
        ))}
        
        {/* Add Exercise Button - ONDERAAN */}
        <div style={{
          marginTop: isMobile ? '0.5rem' : '0.75rem',
          paddingTop: isMobile ? '0.875rem' : '1rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.1)'
        }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(23, 23, 23, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px dashed rgba(249, 115, 22, 0.25)',
              borderRadius: '10px',
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
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.35)'
                e.currentTarget.style.borderStyle = 'solid'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.25)'
                e.currentTarget.style.borderStyle = 'dashed'
              }
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
            <Plus size={isMobile ? 16 : 18} strokeWidth={2.5} />
            Voeg Eigen Oefening Toe
          </button>
        </div>
      </div>
      
      {/* Custom Exercise Modal */}
      {showAddModal && (
        <CustomExerciseModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddExercise}
          client={client}
          db={db}
        />
      )}
    </>
  )
}
