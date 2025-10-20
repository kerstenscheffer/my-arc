// src/modules/workout/components/planning/PlanningModal.jsx
// HOI KERSTEN - PREMIUM STYLING UPGRADE 🔥

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Save } from 'lucide-react'
import PlanningDayRow from './PlanningDayRow'

export default function PlanningModal({ 
  schema, 
  currentSchedule, 
  clientId, 
  db, 
  onClose, 
  onSave 
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [schedule, setSchedule] = useState({})
  const [saving, setSaving] = useState(false)
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  // Get workout options from schema
  const workoutOptions = schema?.week_structure 
    ? Object.entries(schema.week_structure).map(([key, workout]) => ({
        value: key,
        label: workout.name,
        focus: workout.focus,
        exercises: workout.exercises?.length || 0
      }))
    : []
  
  // Activity types
  const activityTypes = [
    { value: 'rest', label: 'Rust', color: '#6b7280' },
    { value: 'cardio', label: 'Cardio', color: '#ef4444' },
    { value: 'swimming', label: 'Zwemmen', color: '#3b82f6' }
  ]
  
  // Initialize with current schedule
  useEffect(() => {
    setSchedule(currentSchedule || {})
    setTimeout(() => setVisible(true), 50)
  }, [currentSchedule])
  
  // Handle day change
  const handleDayChange = (day, value) => {
    const newSchedule = { ...schedule }
    
    if (value === 'rest' || !value) {
      delete newSchedule[day]
    } else {
      newSchedule[day] = value
    }
    
    setSchedule(newSchedule)
  }
  
  // Handle save
  const handleSave = async () => {
    if (!clientId || !db) return
    
    setSaving(true)
    
    try {
      await db.updateClientWorkoutSchedule(clientId, schedule)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      if (onSave) onSave(schedule)
      
      handleClose()
    } catch (error) {
      console.error('❌ Error saving schedule:', error)
      alert('Er ging iets mis bij het opslaan. Probeer opnieuw.')
      setSaving(false)
    }
  }
  
  // Handle close
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Get selected workout/activity data
  const getSelectedData = (day) => {
    const value = schedule[day]
    if (!value) return null
    
    // Check if it's a workout
    const workout = workoutOptions.find(w => w.value === value)
    if (workout) return { type: 'workout', ...workout }
    
    // Check if it's an activity
    const activity = activityTypes.find(a => a.value === value)
    if (activity) return { type: 'activity', ...activity }
    
    return null
  }
  
  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0.75rem' : '1.5rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '16px' : '20px',
          width: isMobile ? '95vw' : '700px',
          maxHeight: isMobile ? '90vh' : '85vh',
          boxShadow: '0 20px 60px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow accent - PREMIUM */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.8,
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)'
        }} />
        
        {/* Background decoration - like TodaysWorkout */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-8%',
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Calendar size={isMobile ? 200 : 250} color="#f97316" />
        </div>
        
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {/* Icon box - PREMIUM GLOW */}
              <div style={{
                width: isMobile ? '40px' : '44px',
                height: isMobile ? '40px' : '44px',
                borderRadius: '12px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)',
                backdropFilter: 'blur(10px)'
              }}>
                <Calendar 
                  size={isMobile ? 20 : 22} 
                  color="#f97316"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.8))' }}
                />
              </div>
              
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.15rem' : '1.3rem',
                  fontWeight: '800',
                  color: '#fff',
                  margin: 0,
                  marginBottom: '0.15rem',
                  letterSpacing: '-0.02em'
                }}>
                  Plan je Workout Week
                </h2>
                <p style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  Kies je workouts en activiteiten per dag
                </p>
              </div>
            </div>
            
            {/* Close button - PREMIUM HOVER */}
            <button
              onClick={handleClose}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
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
              style={{
                width: '44px',
                height: '44px',
                minHeight: '44px',
                flexShrink: 0,
                borderRadius: '12px',
                background: 'rgba(23, 23, 23, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: '#f97316',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={isMobile ? 18 : 20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Scrollable days */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {weekDays.map((day, index) => (
              <PlanningDayRow
                key={day}
                day={day}
                dayDutch={weekDaysDutch[index]}
                selectedValue={schedule[day]}
                selectedData={getSelectedData(day)}
                workoutOptions={workoutOptions}
                activityTypes={activityTypes}
                onChange={(value) => handleDayChange(day, value)}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
        
        {/* Footer buttons - PREMIUM */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(249, 115, 22, 0.15)',
          flexShrink: 0,
          display: 'flex',
          gap: '0.875rem',
          position: 'relative',
          zIndex: 1
        }}>
          <button
            onClick={handleClose}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
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
            style={{
              flex: 1,
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            onMouseEnter={(e) => {
              if (!isMobile && !saving) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile && !saving) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.35)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile && !saving) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && !saving) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            style={{
              flex: 2,
              padding: isMobile ? '0.875rem' : '1rem',
              background: saving
                ? 'rgba(107, 114, 128, 0.3)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '12px',
              color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: saving
                ? 'none'
                : '0 4px 20px rgba(249, 115, 22, 0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: isMobile ? '16px' : '18px',
                  height: isMobile ? '16px' : '18px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Save size={isMobile ? 16 : 18} />
                Planning Opslaan
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
  
  return createPortal(modalContent, document.body)
}
