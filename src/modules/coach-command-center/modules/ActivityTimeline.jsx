// src/modules/coach-command-center/modules/ActivityTimeline.jsx
// ActivityTimeline Component - 7-day workout activity grid for Command Center
// Follows MY ARC WORKOUT STYLING GUIDE v1.0

import React, { useState, useEffect } from 'react'
import { Dumbbell, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import ActivityTimelineService from './ActivityTimelineService'

export default function ActivityTimeline({ clientId, isMobile }) {
  const [activityData, setActivityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    loadActivity()
  }, [clientId])

  const loadActivity = async () => {
    console.log('📊 [ActivityTimeline] Loading activity for client:', clientId)
    setLoading(true)
    
    try {
      const data = await ActivityTimelineService.get7DayWorkoutActivitySingle(clientId)
      console.log('✅ [ActivityTimeline] Activity data loaded:', data.length, 'days')
      setActivityData(data)
    } catch (error) {
      console.error('❌ [ActivityTimeline] Error loading activity:', error)
      setActivityData(ActivityTimelineService.generateEmptyWeek())
    }
    
    setLoading(false)
  }

  // Calculate stats
  const streak = ActivityTimelineService.calculateStreakFromActivity(activityData)
  const totalWorkouts = activityData.filter(d => d.hasWorkout).length

  // Get day styling based on state (WORKOUT STYLING GUIDE)
  const getDayStyle = (day) => {
    const isToday = ActivityTimelineService.isToday(day.date)
    const isSelected = selectedDay !== null && activityData[selectedDay].date === day.date

    // STATE PRIORITY: 1. Completed → 2. Today → 3. Has workout → 4. Rest
    
    // COMPLETED (100%) - GREEN
    if (day.isCompleted && day.completionPercentage === 100) {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        border: isSelected ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.25)',
        accentColor: '#10b981',
        shadow: isSelected ? '0 6px 20px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.15)',
        showAccentLine: true
      }
    }

    // TODAY (not completed) - ORANGE
    if (isToday && !day.isCompleted) {
      return {
        bg: 'rgba(249, 115, 22, 0.15)',
        border: isSelected ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.3)',
        accentColor: '#f97316',
        shadow: isSelected ? '0 6px 20px rgba(249, 115, 22, 0.3)' : '0 4px 16px rgba(249, 115, 22, 0.2)',
        showAccentLine: true
      }
    }

    // HAS WORKOUT (partial) - ORANGE TINT
    if (day.hasWorkout) {
      return {
        bg: 'rgba(249, 115, 22, 0.1)',
        border: isSelected ? '2px solid #f97316' : '1px solid rgba(249, 115, 22, 0.2)',
        accentColor: '#f97316',
        shadow: isSelected ? '0 4px 16px rgba(249, 115, 22, 0.25)' : 'none',
        showAccentLine: false
      }
    }

    // REST DAY - DARK GRAY
    return {
      bg: 'rgba(23, 23, 23, 0.6)',
      border: isSelected ? '2px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
      accentColor: 'rgba(255, 255, 255, 0.3)',
      shadow: 'none',
      showAccentLine: false
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(249, 115, 22, 0.06)',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          color: '#f97316',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <Dumbbell size={isMobile ? 16 : 18} />
          7-Day Workout Activity
        </div>
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          padding: '1rem'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(249, 115, 22, 0.06)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.875rem' : '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          color: '#f97316',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600'
        }}>
          <Dumbbell size={isMobile ? 16 : 18} />
          7-Day Activity
        </div>
        
        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.625rem' : '0.75rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          alignItems: 'center'
        }}>
          {/* X/7 Counter */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '6px',
            padding: '0.25rem 0.5rem',
            color: '#f97316',
            fontWeight: '700'
          }}>
            {totalWorkouts}/7
          </div>
          
          {/* Streak */}
          {streak > 0 && (
            <div style={{
              background: 'rgba(234, 88, 12, 0.15)',
              border: '1px solid rgba(234, 88, 12, 0.3)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              color: '#ea580c',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              🔥 {streak}d
            </div>
          )}
        </div>
      </div>

      {/* 7-DAY GRID - ALWAYS 7 COLUMNS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem',
        marginBottom: selectedDay !== null ? (isMobile ? '0.75rem' : '1rem') : 0
      }}>
        {activityData.map((day, index) => {
          const isToday = ActivityTimelineService.isToday(day.date)
          const dayName = ActivityTimelineService.getDayName(day.date)
          const isSelected = selectedDay === index
          const style = getDayStyle(day)
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDay(isSelected ? null : index)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '0.3rem' : '0.375rem',
                padding: isMobile ? '0.625rem 0.375rem' : '0.875rem 0.5rem',
                minHeight: isMobile ? '80px' : '100px',
                background: style.bg,
                border: style.border,
                borderRadius: isMobile ? '10px' : '12px',
                backdropFilter: 'blur(10px)',
                boxShadow: style.shadow,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
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
              {/* TOP ACCENT LINE (Today/Completed only) */}
              {style.showAccentLine && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: day.isCompleted && day.completionPercentage === 100
                    ? 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
                  opacity: 0.6
                }} />
              )}

              {/* COMPLETED BADGE (Top Right) */}
              {day.isCompleted && day.completionPercentage === 100 && (
                <div style={{
                  position: 'absolute',
                  top: isMobile ? '0.3rem' : '0.4rem',
                  right: isMobile ? '0.3rem' : '0.4rem',
                  width: isMobile ? '16px' : '18px',
                  height: isMobile ? '16px' : '18px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
                }}>
                  <Check size={isMobile ? 10 : 11} color="#10b981" strokeWidth={3} />
                </div>
              )}

              {/* DAY LABEL */}
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: isToday ? '800' : '600',
                color: style.accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {dayName}
              </div>
              
              {/* WORKOUT STATUS ICON */}
              <div style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: day.hasWorkout 
                  ? (day.isCompleted && day.completionPercentage === 100
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(249, 115, 22, 0.15)')
                  : 'rgba(239, 68, 68, 0.1)',
                border: day.hasWorkout
                  ? (day.isCompleted && day.completionPercentage === 100
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(249, 115, 22, 0.25)')
                  : '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {day.hasWorkout ? (
                  <Check 
                    size={isMobile ? 13 : 15} 
                    color={day.isCompleted && day.completionPercentage === 100 ? '#10b981' : '#f97316'}
                    strokeWidth={3} 
                  />
                ) : (
                  <X size={isMobile ? 13 : 15} color="#ef4444" strokeWidth={2} />
                )}
              </div>
              
              {/* COMPLETION PERCENTAGE BADGE (Partial workouts) */}
              {day.hasWorkout && day.completionPercentage > 0 && day.completionPercentage < 100 && (
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  color: '#f97316',
                  fontWeight: '700',
                  background: 'rgba(249, 115, 22, 0.15)',
                  padding: '0.125rem 0.3rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  {Math.round(day.completionPercentage)}%
                </div>
              )}

              {/* DATE NUMBER */}
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: '600'
              }}>
                {new Date(day.date + 'T12:00:00').getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* SELECTED DAY DETAILS PANEL */}
      {selectedDay !== null && (
        <div style={{
          marginTop: isMobile ? '0.75rem' : '1rem',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: '8px',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {/* Date Header */}
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: '#fff',
            marginBottom: '0.625rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>
              {new Date(activityData[selectedDay].date + 'T12:00:00').toLocaleDateString('nl-NL', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: '0.25rem',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ChevronUp size={16} />
            </button>
          </div>
          
          {/* Workout Status */}
          {activityData[selectedDay].hasWorkout ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {/* Completed Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: activityData[selectedDay].isCompleted && activityData[selectedDay].completionPercentage === 100
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(249, 115, 22, 0.15)',
                  border: activityData[selectedDay].isCompleted && activityData[selectedDay].completionPercentage === 100
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check 
                    size={12} 
                    color={activityData[selectedDay].isCompleted && activityData[selectedDay].completionPercentage === 100 ? '#10b981' : '#f97316'}
                  />
                </div>
                <span style={{ 
                  color: activityData[selectedDay].isCompleted && activityData[selectedDay].completionPercentage === 100 ? '#10b981' : '#f97316',
                  fontWeight: '600' 
                }}>
                  {activityData[selectedDay].isCompleted && activityData[selectedDay].completionPercentage === 100
                    ? 'Workout completed'
                    : 'Workout started'}
                </span>
              </div>
              
              {/* Completion Percentage */}
              {activityData[selectedDay].completionPercentage > 0 && (
                <div style={{ paddingLeft: '1.5rem' }}>
                  <strong style={{ color: '#f97316' }}>Completion:</strong>{' '}
                  {Math.round(activityData[selectedDay].completionPercentage)}%
                </div>
              )}
              
              {/* Feeling */}
              {activityData[selectedDay].feeling && activityData[selectedDay].feeling !== 'normal' && (
                <div style={{ paddingLeft: '1.5rem' }}>
                  <strong style={{ color: '#f97316' }}>Feeling:</strong>{' '}
                  {activityData[selectedDay].feeling}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <X size={12} color="#ef4444" />
              </div>
              <span style={{ color: '#ef4444', fontWeight: '600' }}>
                No workout logged
              </span>
            </div>
          )}
        </div>
      )}

      {/* LEGEND */}
      <div style={{
        marginTop: isMobile ? '0.75rem' : '1rem',
        paddingTop: isMobile ? '0.75rem' : '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? '0.75rem' : '1rem',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Check size={12} color="#10b981" />
          100% done
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Check size={12} color="#f97316" />
          Partial
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <X size={12} color="#ef4444" />
          No workout
        </div>
      </div>
    </div>
  )
}
