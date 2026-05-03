// WorkoutSection.jsx - Workout sectie component voor Command Center
import React, { useState } from 'react'
import { Dumbbell, X, ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function WorkoutSection({ client, workoutData, isMobile }) {
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false)
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0)
  
  // Workout data
  const workouts = workoutData?.workouts || []
  const totalWorkouts = workoutData?.totalWorkouts || 0
  const completedWorkouts = workoutData?.completedWorkouts || 0
  const lastWorkoutDate = workoutData?.lastWorkoutDate
  const daysSinceWorkout = workoutData?.daysSinceWorkout
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  // Format days ago
  const formatDaysAgo = (days) => {
    if (days === null || days === undefined) return 'Nooit'
    if (days === 0) return 'Vandaag'
    if (days === 1) return 'Gisteren'
    if (days <= 7) return `${days} dagen`
    if (days <= 14) return '1-2 weken'
    return `${Math.floor(days / 7)} weken`
  }

  // Get urgency color based on days since workout
  const getUrgencyColor = () => {
    if (daysSinceWorkout === null || daysSinceWorkout === undefined) return '#6b7280'
    if (daysSinceWorkout <= 3) return '#10b981' // Green - recent
    if (daysSinceWorkout <= 7) return '#f59e0b' // Orange - warning
    return '#ef4444' // Red - overdue
  }

  // Workout modal navigation
  const openWorkoutModal = (index = 0) => {
    setSelectedWorkoutIndex(index)
    setWorkoutModalOpen(true)
  }

  const nextWorkout = () => {
    setSelectedWorkoutIndex(prev => (prev + 1) % workouts.length)
  }

  const prevWorkout = () => {
    setSelectedWorkoutIndex(prev => (prev - 1 + workouts.length) % workouts.length)
  }

  const urgencyColor = getUrgencyColor()

  return (
    <>
      {/* Workout Section Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.75rem' : '0.875rem',
        background: totalWorkouts > 0 
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.03) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        border: totalWorkouts > 0 
          ? '1px solid rgba(249, 115, 22, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px'
      }}>
        {/* Icon container */}
        <div style={{
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          borderRadius: '8px',
          background: totalWorkouts > 0 
            ? 'rgba(249, 115, 22, 0.15)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: totalWorkouts > 0 
            ? '1px solid rgba(249, 115, 22, 0.3)' 
            : '1px dashed rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Dumbbell 
            size={isMobile ? 18 : 22} 
            color={totalWorkouts > 0 ? '#f97316' : 'rgba(255, 255, 255, 0.3)'} 
          />
        </div>

        {/* Workout stats */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: totalWorkouts > 0 ? '#f97316' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {totalWorkouts > 0 ? `${completedWorkouts}/${totalWorkouts} workouts` : 'Geen workouts'}
            </span>
            {totalWorkouts > 0 && (
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                padding: '0.125rem 0.375rem',
                background: `${urgencyColor}20`,
                border: `1px solid ${urgencyColor}40`,
                borderRadius: '4px',
                color: urgencyColor,
                fontWeight: '600'
              }}>
                {formatDaysAgo(daysSinceWorkout)}
              </span>
            )}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            {lastWorkoutDate ? `Laatste: ${formatDate(lastWorkoutDate)}` : 'Nog geen workouts gelogd'}
          </div>
        </div>

        {/* View all button */}
        {workouts.length > 0 && (
          <button
            onClick={() => openWorkoutModal(0)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '8px',
              color: '#f97316',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px'
            }}
          >
            <Calendar size={14} />
            Bekijk
          </button>
        )}
      </div>

      {/* WORKOUT HISTORY MODAL */}
      {workoutModalOpen && workouts.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '1rem' : '2rem',
            overflowY: 'auto'
          }}
          onClick={() => setWorkoutModalOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setWorkoutModalOpen(false)}
            style={{
              position: 'fixed',
              top: isMobile ? '1rem' : '2rem',
              right: isMobile ? '1rem' : '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div style={{
            marginBottom: '1.5rem',
            paddingRight: '60px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#f97316',
              margin: 0,
              marginBottom: '0.25rem'
            }}>
              {client.first_name}'s Workouts
            </h2>
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              {completedWorkouts} van {totalWorkouts} voltooid
            </p>
          </div>

          {/* Workout List */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              maxWidth: '600px',
              width: '100%',
              margin: '0 auto'
            }}
          >
            {workouts.map((workout, idx) => (
              <div
                key={`${workout.workout_date}-${idx}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
                  border: workout.is_completed 
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: workout.is_completed 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                  opacity: 0.8
                }} />

                {/* Header row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>
                      {workout.day_name}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {formatDate(workout.workout_date)}
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    background: workout.is_completed 
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(249, 115, 22, 0.15)',
                    border: workout.is_completed 
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '6px'
                  }}>
                    {workout.is_completed ? (
                      <CheckCircle size={14} color="#10b981" />
                    ) : (
                      <Clock size={14} color="#f97316" />
                    )}
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: '600',
                      color: workout.is_completed ? '#10b981' : '#f97316'
                    }}>
                      {workout.is_completed ? 'Voltooid' : 'Niet afgerond'}
                    </span>
                  </div>
                </div>

                {/* Exercises */}
                {workout.exercises_completed && workout.exercises_completed.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {workout.exercises_completed.length} oefeningen
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem'
                    }}>
                      {workout.exercises_completed.map((exercise, exIdx) => (
                        <div
                          key={exIdx}
                          style={{
                            padding: '0.375rem 0.625rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: 'rgba(255, 255, 255, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}
                        >
                          <span>{exercise.name}</span>
                          <span style={{
                            padding: '0.125rem 0.25rem',
                            background: 'rgba(249, 115, 22, 0.2)',
                            borderRadius: '3px',
                            fontSize: isMobile ? '0.6rem' : '0.65rem',
                            color: '#f97316',
                            fontWeight: '600'
                          }}>
                            {exercise.sets}×
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty state message if somehow no workouts */}
          {workouts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Geen workouts gevonden
            </div>
          )}
        </div>
      )}
    </>
  )
}
