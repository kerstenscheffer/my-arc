// src/modules/workout/components/WeekSchedule.jsx - WITH PLANNING BUTTON
import useIsMobile from '../../../hooks/useIsMobile'
import { Moon, Plus, CheckCircle, ArrowLeftRight, X, ChevronRight, Clock, Target, Save, Info, Calendar, Heart, Waves } from 'lucide-react'
import { useState, useEffect } from 'react'
import PlanningModal from './planning/PlanningModal'

// Muscle group image mapping
const muscleGroupImages = {
  chest: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
  back: 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400&h=300&fit=crop',
  legs: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
  shoulders: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400&h=300&fit=crop',
  arms: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  core: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  triceps: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  biceps: 'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=300&fit=crop',
  fallback: 'https://images.unsplash.com/photo-1517963628607-235ccdd5476c?w=400&h=300&fit=crop'
}

const getWorkoutImage = (workoutData) => {
  if (!workoutData || !workoutData.focus) return muscleGroupImages.fallback
  
  const focusParts = workoutData.focus.toLowerCase().split(',').map(s => s.trim())
  const primaryMuscle = focusParts[0]
  
  return muscleGroupImages[primaryMuscle] || muscleGroupImages.fallback
}

export default function WeekSchedule({
  weekSchedule,
  schema,
  swapMode,
  selectedWorkout,
  completedWorkouts = [],
  todayIndex,
  onDayClick,
  clientId,
  db,
  onScheduleUpdate
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  
  const hasValidSchema = schema && schema.week_structure && typeof schema.week_structure === 'object'
  
  useEffect(() => {
    loadSavedSchedule()
  }, [clientId])
  
  useEffect(() => {
    if (!loading && weekSchedule) {
      setTempSchedule(weekSchedule)
    }
  }, [weekSchedule, loading])
  
  const loadSavedSchedule = async () => {
    if (!clientId || !db) return
    
    setLoading(true)
    try {
      const savedSchedule = await db.getClientWorkoutSchedule(clientId)
      if (savedSchedule && Object.keys(savedSchedule).length > 0) {
        setTempSchedule(savedSchedule)
        
        if (onScheduleUpdate) {
          onScheduleUpdate(savedSchedule)
        }
      }
    } catch (error) {
      console.error('Error loading saved schedule:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSwapClick = (day, workoutKey) => {
    if (!hasValidSchema) return
    
    if (!localSwapMode) {
      setLocalSwapMode(true)
      setSelectedForSwap({ day, workoutKey })
    } else {
      if (selectedForSwap) {
        const newSchedule = { ...tempSchedule }
        
        if (selectedForSwap.workoutKey && workoutKey) {
          newSchedule[day] = selectedForSwap.workoutKey
          newSchedule[selectedForSwap.day] = workoutKey
        } else if (selectedForSwap.workoutKey && !workoutKey) {
          newSchedule[day] = selectedForSwap.workoutKey
          delete newSchedule[selectedForSwap.day]
        } else if (!selectedForSwap.workoutKey && workoutKey) {
          newSchedule[selectedForSwap.day] = workoutKey
          delete newSchedule[day]
        }
        
        setTempSchedule(newSchedule)
        setHasChanges(true)
      }
      
      setLocalSwapMode(false)
      setSelectedForSwap(null)
    }
  }
  
  const handleSave = async () => {
    if (!clientId || !db) return
    
    setSaving(true)
    
    try {
      await db.updateClientWorkoutSchedule(clientId, tempSchedule)
      
      if (onScheduleUpdate) {
        onScheduleUpdate(tempSchedule)
      }
      
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Er ging iets mis bij het opslaan. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    setTempSchedule(weekSchedule || {})
    setHasChanges(false)
    setLocalSwapMode(false)
    setSelectedForSwap(null)
  }
  
  const handlePlanningModalSave = (newSchedule) => {
    setTempSchedule(newSchedule)
    if (onScheduleUpdate) {
      onScheduleUpdate(newSchedule)
    }
  }
  
  if (!hasValidSchema) {
    return (
      <div style={{ 
        paddingLeft: isMobile ? '0.75rem' : '1.5rem',
        paddingRight: isMobile ? '0.75rem' : '1.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'rgba(17, 17, 17, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Geen workout schema beschikbaar
          </p>
        </div>
      </div>
    )
  }
  
  const renderCalendarView = () => (
    <div style={{ 
      paddingLeft: isMobile ? '0.75rem' : '1.5rem',
      paddingRight: isMobile ? '0.75rem' : '1.5rem',
      marginBottom: '1rem'
    }}>
      {/* PLANNING BUTTON */}
      <button
        onClick={() => setShowPlanningModal(true)}
        style={{
          width: '100%',
          marginBottom: '1rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#000',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px rgba(249, 115, 22, 0.35)',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(249, 115, 22, 0.45)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(249, 115, 22, 0.35)'
          }
        }}
      >
        <Calendar size={isMobile ? 18 : 20} />
        📅 Plan je Workout Week
      </button>
      
      {localSwapMode && (
        <div style={{
          marginBottom: '1rem',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Info size={18} color="#f97316" />
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: '#f97316',
              margin: 0,
              fontWeight: '600'
            }}>
              {selectedForSwap ? 
                selectedForSwap.workoutKey ?
                  `Klik op een andere dag om te wisselen met ${weekDaysDutch[weekDays.indexOf(selectedForSwap.day)]}` :
                  `Klik op een workout om deze naar ${weekDaysDutch[weekDays.indexOf(selectedForSwap.day)]} te verplaatsen` :
                'Selecteer een workout om te verplaatsen'
              }
            </p>
          </div>
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: isMobile ? '0.4rem' : '0.6rem'
      }}>
        {weekDays.map((day, index) => {
          const assignedWorkout = tempSchedule[day]
          const workoutData = assignedWorkout && schema.week_structure[assignedWorkout] 
            ? schema.week_structure[assignedWorkout] 
            : null
          const isToday = index === todayIndex
          const isCompleted = Array.isArray(completedWorkouts) && 
            completedWorkouts.some(w => w.workout_day === day)
          const isSelected = selectedWorkout === assignedWorkout || 
                           (selectedForSwap && selectedForSwap.day === day)
          
          return (
            <DayCard
              key={day}
              day={day}
              dayIndex={index}
              workoutKey={assignedWorkout}
              workoutData={workoutData}
              isToday={isToday}
              isCompleted={isCompleted}
              isSelected={isSelected}
              swapMode={swapMode || localSwapMode}
              isMobile={isMobile}
              weekDaysShort={weekDaysShort}
              weekDaysDutch={weekDaysDutch}
              onClick={() => {
                if (localSwapMode) {
                  handleSwapClick(day, assignedWorkout)
                } else {
                  onDayClick(day, assignedWorkout)
                }
              }}
              onSwapClick={() => handleSwapClick(day, assignedWorkout)}
              localSwapMode={localSwapMode}
            />
          )
        })}
      </div>
      
      {(localSwapMode || hasChanges) && (
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
                background: saving 
                  ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                opacity: saving ? 0.7 : 1,
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Save size={16} />
              {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </button>
          )}
          
          <button
            onClick={handleCancel}
            style={{
              padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Annuleren
          </button>
        </div>
      )}
    </div>
  )
  
  const renderListView = () => {
    const scheduledDays = weekDays.filter(day => tempSchedule[day])
    
    if (scheduledDays.length === 0) return null
    
    return (
      <div style={{
        paddingLeft: '1rem',
        paddingRight: '1rem',
        marginTop: '1rem'
      }}>
        <h3 style={{
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Deze Week's Schema
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {scheduledDays.map((day, index) => {
            const workoutKey = tempSchedule[day]
            const workout = workoutKey && schema.week_structure[workoutKey] 
              ? schema.week_structure[workoutKey] 
              : null
              
            if (!workout) return null
            
            const dayIndex = weekDays.indexOf(day)
            const isToday = dayIndex === todayIndex
            const isCompleted = Array.isArray(completedWorkouts) && 
              completedWorkouts.some(w => w.workout_day === day)
            const isSelected = selectedWorkout === workoutKey ||
                             (selectedForSwap && selectedForSwap.day === day)
            
            return (
              <WorkoutListCard
                key={day}
                day={day}
                workout={workout}
                isToday={isToday}
                isCompleted={isCompleted}
                isSelected={isSelected}
                onClick={() => onDayClick(day, workoutKey)}
                onSwapClick={() => handleSwapClick(day, workoutKey)}
                localSwapMode={localSwapMode}
                isMobile={isMobile}
              />
            )
          })}
        </div>
      </div>
    )
  }
  
  return (
    <>
      {renderCalendarView()}
      {!swapMode && renderListView()}
      
      {/* Planning Modal */}
      {showPlanningModal && (
        <PlanningModal
          schema={schema}
          currentSchedule={tempSchedule}
          clientId={clientId}
          db={db}
          onClose={() => setShowPlanningModal(false)}
          onSave={handlePlanningModalSave}
        />
      )}
    </>
  )
}

// DayCard Component - UPDATED to show cardio/swimming
function DayCard({
  day,
  dayIndex,
  workoutKey,
  workoutData,
  isToday,
  isCompleted,
  isSelected,
  swapMode,
  isMobile,
  weekDaysShort,
  weekDaysDutch,
  onClick,
  onSwapClick,
  localSwapMode
}) {
  const [showSwapButton, setShowSwapButton] = useState(false)
  
  // Check if it's a special activity
  const isCardio = workoutKey === 'cardio'
  const isSwimming = workoutKey === 'swimming'
  const isActivity = isCardio || isSwimming
  
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setShowSwapButton(true)}
      onMouseLeave={() => setShowSwapButton(false)}
      style={{
        padding: isMobile ? '0.75rem 0.4rem' : '1rem',
        minHeight: isMobile ? '90px' : '120px',
        background: workoutData || isActivity
          ? `linear-gradient(135deg, ${
              isToday ? 'rgba(249, 115, 22, 0.15)' : 
              isCompleted ? 'rgba(16, 185, 129, 0.1)' : 
              isCardio ? 'rgba(239, 68, 68, 0.1)' :
              isSwimming ? 'rgba(59, 130, 246, 0.1)' :
              'rgba(249, 115, 22, 0.05)'
            } 0%, ${
              isToday ? 'rgba(234, 88, 12, 0.08)' : 
              isCompleted ? 'rgba(5, 150, 105, 0.05)' : 
              isCardio ? 'rgba(239, 68, 68, 0.05)' :
              isSwimming ? 'rgba(59, 130, 246, 0.05)' :
              'rgba(234, 88, 12, 0.02)'
            } 100%)`
          : isSelected 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
        border: `1px solid ${
          isSelected ? 'rgba(249, 115, 22, 0.3)' :
          isToday ? 'rgba(249, 115, 22, 0.25)' : 
          isCardio ? 'rgba(239, 68, 68, 0.2)' :
          isSwimming ? 'rgba(59, 130, 246, 0.2)' :
          workoutData ? 'rgba(249, 115, 22, 0.1)' : 
          'rgba(255, 255, 255, 0.03)'
        }`,
        borderRadius: '14px',
        cursor: swapMode || workoutData || isActivity ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        transform: isSelected && swapMode ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isToday ? '0 8px 20px rgba(249, 115, 22, 0.15)' : 'none',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {isCompleted && (
        <CheckCircle 
          size={14} 
          color="#10b981" 
          style={{ 
            position: 'absolute',
            top: '0.35rem',
            right: '0.35rem'
          }} 
        />
      )}
      
      {(workoutData || isActivity) && showSwapButton && !localSwapMode && !isMobile && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSwapClick()
          }}
          style={{
            position: 'absolute',
            top: '0.35rem',
            left: '0.35rem',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
        >
          <ArrowLeftRight size={12} color="#f97316" />
        </button>
      )}
      
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        fontWeight: isToday ? '800' : '600',
        marginBottom: '0.35rem',
        color: isToday ? '#f97316' : 
               isCardio ? '#ef4444' :
               isSwimming ? '#3b82f6' :
               workoutData ? 'rgba(249, 115, 22, 0.8)' : 
               'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMobile ? weekDaysDutch[dayIndex] : weekDaysShort[dayIndex]}
        {isToday && (
          <div style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#f97316',
            margin: '0.2rem auto 0',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </div>
      
      {workoutData ? (
        <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
      ) : isCardio ? (
        <ActivityIndicator icon={Heart} color="#ef4444" label="Cardio" isMobile={isMobile} />
      ) : isSwimming ? (
        <ActivityIndicator icon={Waves} color="#3b82f6" label="Zwemmen" isMobile={isMobile} />
      ) : (
        <RestIndicator swapMode={swapMode} isMobile={isMobile} />
      )}
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
      `}</style>
    </div>
  )
}

// Activity Indicator Component (NEW)
function ActivityIndicator({ icon: Icon, color, label, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <div style={{
        width: isMobile ? '32px' : '36px',
        height: isMobile ? '32px' : '36px',
        borderRadius: '10px',
        background: `${color}20`,
        border: `2px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={isMobile ? 14 : 16} color={color} />
      </div>
      <div style={{
        fontSize: isMobile ? '0.55rem' : '0.65rem',
        color: `${color}cc`,
        lineHeight: 1.2,
        fontWeight: '600'
      }}>
        {label}
      </div>
    </div>
  )
}

// Keep existing WorkoutListCard, WorkoutIndicator, RestIndicator components
function WorkoutListCard({ day, workout, isToday, isCompleted, isSelected, onClick, onSwapClick, localSwapMode, isMobile }) {
  const workoutImage = getWorkoutImage(workout)
  
  return (
    <div onClick={onClick} style={{
      padding: isMobile ? '1rem' : '1.25rem',
      background: isToday 
        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
        : isCompleted
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
      border: `1px solid ${isSelected ? 'rgba(249, 115, 22, 0.3)' : isToday ? 'rgba(249, 115, 22, 0.2)' : isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.1)'}`,
      borderRadius: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      minHeight: '44px',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      {isToday && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)', boxShadow: '2px 0 8px rgba(249, 115, 22, 0.3)' }} />
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: isToday || isCompleted ? '0.5rem' : 0 }}>
        <div style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '12px', background: `url(${workoutImage}) center/cover`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {isCompleted && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={isMobile ? 20 : 22} color="white" strokeWidth={2.5} />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: isToday ? '#f97316' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.5)', marginBottom: '0.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {day}
            {isToday && <span style={{ fontSize: '0.65rem', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: '800', color: 'white' }}>VANDAAG</span>}
          </div>
          
          <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', color: '#fff', fontWeight: '700', marginBottom: '0.3rem' }}>{workout.name}</div>
          
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Target size={12} />{workout.focus}</span>
            {workout.geschatteTijd && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} />{workout.geschatteTijd}</span>}
          </div>
        </div>
        
        {!localSwapMode && (
          <button onClick={(e) => { e.stopPropagation(); onSwapClick() }} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', marginRight: '0.5rem' }}>
            <ArrowLeftRight size={14} color="#f97316" />
          </button>
        )}
      </div>
      
      <ChevronRight size={18} color={isToday ? 'rgba(249, 115, 22, 0.5)' : isCompleted ? 'rgba(16, 185, 129, 0.5)' : 'rgba(249, 115, 22, 0.3)'} />
    </div>
  )
}

function WorkoutIndicator({ workoutData, isMobile }) {
  const workoutImage = getWorkoutImage(workoutData)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '10px', background: `url(${workoutImage}) center/cover`, border: '2px solid rgba(249, 115, 22, 0.2)', position: 'relative', overflow: 'hidden' }} />
      <div style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.2, maxWidth: isMobile ? '45px' : '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workoutData.focus?.split(',')[0] || ''}</div>
    </div>
  )
}

function RestIndicator({ swapMode, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      {swapMode ? (
        <>
          <div style={{ width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(249, 115, 22, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={isMobile ? 16 : 20} color="rgba(249, 115, 22, 0.4)" /></div>
          <div style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(249, 115, 22, 0.4)' }}>Voeg toe</div>
        </>
      ) : (
        <>
          <div style={{ width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Moon size={isMobile ? 14 : 16} color="rgba(255,255,255,0.2)" /></div>
          <div style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.15rem' }}>Rust</div>
        </>
      )}
    </div>
  )
}
