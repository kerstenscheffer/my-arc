// src/modules/workout/components/todays-workout/TodaysWorkoutMain.jsx
import { useState, useEffect } from 'react'
import TodaysWorkoutCard from './TodaysWorkoutCard'
import LogModal from './LogModal'

export default function TodaysWorkoutMain({ client, schema, db, workoutService }) {
  const isMobile = window.innerWidth <= 768
  const [showLogModal, setShowLogModal] = useState(false)
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  
  // Get today's day index (0 = Monday, 6 = Sunday)
  const currentDate = new Date()
  const todayIndex = (currentDate.getDay() + 6) % 7
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  useEffect(() => {
    if (schema && client?.id) {
      loadTodaysWorkout()
      loadTodaysLogs()
    }
  }, [schema, client?.id, reloadKey])
  
  // Load today's workout - WITH CUSTOM SUPPORT
  const loadTodaysWorkout = async () => {
    if (!client?.id || !db) {
      console.log('ℹ️ No client or db')
      setLoading(false)
      return
    }
    
    try {
      // STAP 1: Laad FRESH schema
      let freshSchema = schema
      
      if (client.assigned_schema_id) {
        console.log('🔄 Loading FRESH schema from database...')
        const { data: schemaData, error: schemaError } = await db.supabase
          .from('workout_schemas')
          .select('*')
          .eq('id', client.assigned_schema_id)
          .single()
        
        if (schemaError) {
          console.error('❌ Error loading fresh schema:', schemaError)
          freshSchema = schema
        } else {
          freshSchema = schemaData
          console.log('✅ Fresh schema loaded from database')
        }
      }
      
      if (!freshSchema?.week_structure) {
        console.log('ℹ️ No schema structure')
        setLoading(false)
        return
      }
      
      // STAP 2: Laad opgeslagen schedule
      const savedSchedule = await db.getClientWorkoutSchedule(client.id)
      console.log('📅 Saved schedule from database:', savedSchedule)
      
      // STAP 3: Bepaal vandaag
      const todayName = weekDays[todayIndex]
      console.log('📅 Today is:', todayName)
      
      // STAP 4: Check welke workout KEY er staat
      const workoutKey = savedSchedule && savedSchedule[todayName]
        ? savedSchedule[todayName]
        : null
      
      console.log('📅 Workout KEY for today:', workoutKey)
      
      // ⭐ STAP 5: CHECK OF HET CUSTOM IS
      if (workoutKey && workoutKey.startsWith('custom_')) {
        console.log('🎯 Custom workout detected!')
        
        const customId = workoutKey.replace('custom_', '')
        console.log('🔍 Custom workout ID:', customId)
        
        try {
          // Laad custom workout via WorkoutService
          const customWorkout = await workoutService.getCustomWorkoutById(customId)
          
          if (customWorkout) {
            console.log('✅ Custom workout loaded:', customWorkout.name)
            
            // Format naar TodaysWorkoutCard format
            setTodaysWorkout({
              name: customWorkout.name,
              focus: getCustomWorkoutTypeLabel(customWorkout.type),
              geschatteTijd: `${customWorkout.duration} min`,
              exercises: [], // Custom workouts hebben geen exercises
              workoutKey: workoutKey,
              dayKey: workoutKey,
              dayName: todayName,
              isCustom: true,
              customData: customWorkout // Extra data
            })
          } else {
            console.log('⚠️ Custom workout not found (deleted?)')
            setTodaysWorkout(null)
          }
        } catch (error) {
          console.error('❌ Error loading custom workout:', error)
          setTodaysWorkout(null)
        }
      }
      // STAP 6: Check schema workout
      else if (workoutKey && freshSchema.week_structure[workoutKey]) {
        const workout = freshSchema.week_structure[workoutKey]
        console.log('✅ Schema workout loaded:', workout.name)
        console.log('✅ Exercises:', workout.exercises?.map(e => e.name).join(', '))
        
        setTodaysWorkout({
          ...workout,
          workoutKey: workoutKey,
          dayKey: workoutKey,
          dayName: todayName,
          isCustom: false
        })
      } else {
        console.log('ℹ️ No workout scheduled for today (rest day)')
        setTodaysWorkout(null)
      }
    } catch (error) {
      console.error('❌ Error loading today\'s workout:', error)
      setTodaysWorkout(null)
    }
    
    setLoading(false)
  }
  
  // Helper: Get type label
  const getCustomWorkoutTypeLabel = (type) => {
    const labels = {
      cardio: 'Cardio',
      cycling: 'Fietsen',
      running: 'Hardlopen',
      swimming: 'Zwemmen',
      hiking: 'Wandelen',
      yoga: 'Yoga',
      sports: 'Sport',
      custom: 'Custom'
    }
    return labels[type] || type
  }
  
  // Load today's logs
  const loadTodaysLogs = async () => {
    if (!client?.id || !db) return
    
    try {
      const logs = await db.getTodaysWorkoutLogs(client.id)
      console.log('✅ Today\'s logs loaded:', logs.length)
      setTodaysLogs(logs)
    } catch (error) {
      console.error('❌ Error loading today\'s logs:', error)
      setTodaysLogs([])
    }
  }
  
  // Handle open log modal
  const handleOpenLog = () => {
    setShowLogModal(true)
    loadTodaysLogs()
  }
  
  // Handle close log modal
  const handleCloseLog = () => {
    setShowLogModal(false)
    loadTodaysLogs()
  }
  
  // Handle logs update
  const handleLogsUpdate = async (options) => {
    console.log('🔄 handleLogsUpdate called with options:', options)
    
    if (options?.reloadSchema) {
      console.log('🔄 SWAP DETECTED - Full reload triggered')
      console.log('🔄 Forcing schema reload...')
      setReloadKey(prev => prev + 1)
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
    } else {
      await loadTodaysLogs()
    }
  }
  
  // If no schema
  if (!schema) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '0',
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600'
          }}>
            Nog geen workout schema toegewezen
          </p>
        </div>
      </div>
    )
  }
  
  // If loading
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '0',
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
    )
  }
  
  // If no workout today (rest day)
  if (!todaysWorkout) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '0',
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600'
          }}>
            🌙 Rustdag - Geen workout vandaag
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <>
      {/* Today's Workout Card */}
      <TodaysWorkoutCard
        workout={todaysWorkout}
        onLogClick={handleOpenLog}
        logsCount={todaysLogs.length}
        client={client}
        db={db}
      />
      
      {/* Log Modal (Overlay) */}
      {showLogModal && (
        <LogModal
          workout={todaysWorkout}
          todaysLogs={todaysLogs}
          onClose={handleCloseLog}
          onLogsUpdate={handleLogsUpdate}
          client={client}
          schema={schema}
          db={db}
        />
      )}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
