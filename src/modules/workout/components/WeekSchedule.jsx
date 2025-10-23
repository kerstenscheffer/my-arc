// src/modules/workout/components/WeekSchedule.jsx
import useIsMobile from '../../../hooks/useIsMobile'
import { Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import PlanningModal from './planning/PlanningModal'
import PlanningButtons from './week-schedule/PlanningButtons'
import WeekGrid from './week-schedule/WeekGrid'
import WeekList from './week-schedule/WeekList'
import ActionButtons from './week-schedule/ActionButtons'

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
  workoutService,
  onScheduleUpdate,
  onOpenWizard
}) {
  const isMobile = useIsMobile()
  const [localSwapMode, setLocalSwapMode] = useState(false)
  const [selectedForSwap, setSelectedForSwap] = useState(null)
  const [tempSchedule, setTempSchedule] = useState(weekSchedule || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState({})
  
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const weekDaysDutch = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  
  const hasValidSchema = schema && schema.week_structure && typeof schema.week_structure === 'object'
  
  useEffect(() => {
    loadSavedSchedule()
  }, [clientId])
  
  useEffect(() => {
    if (!loading && weekSchedule) {
      setTempSchedule(weekSchedule)
      loadCustomWorkoutsForSchedule(weekSchedule)
    }
  }, [weekSchedule, loading])
  
  // Load custom workouts referenced in schedule
  const loadCustomWorkoutsForSchedule = async (schedule) => {
    if (!workoutService || !schedule) {
      console.log('⚠️ Missing workoutService or schedule')
      return
    }
    
    console.log('🔍 Full schedule:', schedule)
    
    const customWorkoutIds = Object.values(schedule)
      .filter(val => val && val.startsWith('custom_'))
      .map(val => val.replace('custom_', ''))
    
    console.log('🔍 Custom workout IDs found in schedule:', customWorkoutIds)
    
    if (customWorkoutIds.length === 0) {
      console.log('ℹ️ No custom workouts in schedule')
      return
    }
    
    try {
      const allCustomWorkouts = await workoutService.getCustomWorkouts(clientId)
      console.log('🔍 All custom workouts from DB:', allCustomWorkouts)
      
      const workoutsMap = {}
      
      allCustomWorkouts.forEach(workout => {
        workoutsMap[workout.id] = workout
      })
      
      console.log('🔍 Workouts map created:', workoutsMap)
      
      setCustomWorkouts(workoutsMap)
      console.log('✅ Custom workouts loaded for schedule:', Object.keys(workoutsMap).length)
    } catch (error) {
      console.error('❌ Load custom workouts failed:', error)
    }
  }
  
  const loadSavedSchedule = async () => {
    if (!clientId || !db) return
    
    setLoading(true)
    try {
      const savedSchedule = await db.getClientWorkoutSchedule(clientId)
      if (savedSchedule && Object.keys(savedSchedule).length > 0) {
        setTempSchedule(savedSchedule)
        await loadCustomWorkoutsForSchedule(savedSchedule)
        
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
    loadCustomWorkoutsForSchedule(newSchedule)
    if (onScheduleUpdate) {
      onScheduleUpdate(newSchedule)
    }
  }
  
  // Get workout data (schema, custom, or activity)
  const getWorkoutData = (workoutKey) => {
    if (!workoutKey) return null
    
    // Custom workouts
    if (workoutKey.startsWith('custom_')) {
      const customId = workoutKey.replace('custom_', '')
      return customWorkouts[customId] || null
    }
    
    // Standard activities (swimming, cardio, etc)
    const activities = {
      swimming: {
        name: 'Zwemmen',
        focus: 'Cardio',
        geschatteTijd: '60 min',
        type: 'swimming',
        isActivity: true
      },
      cardio: {
        name: 'Cardio',
        focus: 'Cardio',
        geschatteTijd: '45 min',
        type: 'cardio',
        isActivity: true
      },
      hiking: {
        name: 'Wandelen',
        focus: 'Cardio',
        geschatteTijd: '90 min',
        type: 'hiking',
        isActivity: true
      },
      cycling: {
        name: 'Fietsen',
        focus: 'Cardio',
        geschatteTijd: '60 min',
        type: 'cycling',
        isActivity: true
      },
      running: {
        name: 'Hardlopen',
        focus: 'Cardio',
        geschatteTijd: '45 min',
        type: 'running',
        isActivity: true
      }
    }
    
    if (activities[workoutKey]) {
      return activities[workoutKey]
    }
    
    // Schema workouts
    if (schema?.week_structure?.[workoutKey]) {
      return schema.week_structure[workoutKey]
    }
    
    return null
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
  
  return (
    <div style={{ 
      paddingLeft: isMobile ? '0.75rem' : '1.5rem',
      paddingRight: isMobile ? '0.75rem' : '1.5rem',
      marginBottom: '1rem'
    }}>
      {/* Swap Mode Info */}
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
      
      {/* Week Grid */}
      <WeekGrid
        tempSchedule={tempSchedule}
        weekDays={weekDays}
        todayIndex={todayIndex}
        completedWorkouts={completedWorkouts}
        selectedWorkout={selectedWorkout}
        selectedForSwap={selectedForSwap}
        swapMode={swapMode}
        localSwapMode={localSwapMode}
        getWorkoutData={getWorkoutData}
        onDayClick={onDayClick}
        onSwapClick={handleSwapClick}
        isMobile={isMobile}
      />
      
      {/* Planning Buttons - VERPLAATST NAAR ONDER GRID */}
      <div style={{ marginTop: '1rem' }}>
        <PlanningButtons
          onOpenWizard={onOpenWizard}
          onOpenCustom={() => setShowPlanningModal(true)}
          isMobile={isMobile}
        />
      </div>
      
      {/* Action Buttons */}
      {(localSwapMode || hasChanges) && (
        <ActionButtons
          hasChanges={hasChanges}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
          isMobile={isMobile}
        />
      )}
      
      {/* Week List View */}
      {!swapMode && (
        <WeekList
          tempSchedule={tempSchedule}
          weekDays={weekDays}
          todayIndex={todayIndex}
          completedWorkouts={completedWorkouts}
          selectedWorkout={selectedWorkout}
          selectedForSwap={selectedForSwap}
          localSwapMode={localSwapMode}
          getWorkoutData={getWorkoutData}
          onDayClick={onDayClick}
          onSwapClick={handleSwapClick}
          isMobile={isMobile}
        />
      )}
      
      {/* Planning Modal */}
      {showPlanningModal && (
        <PlanningModal
          schema={schema}
          currentSchedule={tempSchedule}
          clientId={clientId}
          db={db}
          workoutService={workoutService}
          onClose={() => setShowPlanningModal(false)}
          onSave={handlePlanningModalSave}
        />
      )}
    </div>
  )
}
