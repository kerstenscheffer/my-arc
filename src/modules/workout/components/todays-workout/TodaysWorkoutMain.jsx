// src/modules/workout/components/todays-workout/TodaysWorkoutMain.jsx
import { useState, useEffect } from 'react'
import TodaysWorkoutCard from './TodaysWorkoutCard'
import LogModal from './LogModal'

export default function TodaysWorkoutMain({ client, schema, db }) {
  const isMobile = window.innerWidth <= 768
  const [showLogModal, setShowLogModal] = useState(false)
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [todaysLogs, setTodaysLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0) // ⭐ Force reload trigger
  
  // Get today's day index (0 = Monday, 6 = Sunday)
  const currentDate = new Date()
  const todayIndex = (currentDate.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  useEffect(() => {
    if (schema && client?.id) {
      loadTodaysWorkout()
      loadTodaysLogs()
    }
  }, [schema, client?.id, reloadKey]) // ⭐ Trigger on reloadKey change
  
  // Load today's workout from SAVED SCHEDULE (not schema directly!)
  const loadTodaysWorkout = async () => {
    if (!client?.id || !db) {
      console.log('ℹ️ No client or db')
      setLoading(false)
      return
    }
    
    try {
      // ⭐ STAP 1: Laad FRESH schema uit database (niet uit prop!)
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
          freshSchema = schema // Fallback to prop
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
      
      // STAP 2: Laad opgeslagen schedule uit database
      const savedSchedule = await db.getClientWorkoutSchedule(client.id)
      console.log('📅 Saved schedule from database:', savedSchedule)
      
      // STAP 3: Bepaal vandaag's dag naam
      const todayName = weekDays[todayIndex]
      console.log('📅 Today is:', todayName, '(index:', todayIndex, ')')
      
      // STAP 4: Check welke workout KEY er staat voor vandaag
      const workoutKey = savedSchedule && savedSchedule[todayName]
        ? savedSchedule[todayName]
        : null
      
      console.log('📅 Workout KEY for today:', workoutKey)
      
      if (workoutKey && freshSchema.week_structure[workoutKey]) {
        // STAP 5: Haal de workout DATA op uit FRESH schema
        const workout = freshSchema.week_structure[workoutKey]
        console.log('✅ Today\'s workout loaded:', workout.name)
        console.log('✅ Exercises:', workout.exercises?.map(e => e.name).join(', '))
        
        setTodaysWorkout({
          ...workout,
          workoutKey: workoutKey,
          dayKey: workoutKey,
          dayName: todayName
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
    // Refresh logs when opening
    loadTodaysLogs()
  }
  
  // Handle close log modal
  const handleCloseLog = () => {
    setShowLogModal(false)
    // Refresh logs after closing
    loadTodaysLogs()
  }
  
  // Handle logs update (from ExerciseCard swap)
  const handleLogsUpdate = async (options) => {
    console.log('🔄 handleLogsUpdate called with options:', options)
    
    // If swap happened, FORCE FULL RELOAD
    if (options?.reloadSchema) {
      console.log('🔄 SWAP DETECTED - Full reload triggered')
      
      // ⭐ MODAL BLIJFT OPEN - alleen reload schema
      console.log('🔄 Forcing schema reload...')
      setReloadKey(prev => prev + 1)
      
      // Success feedback
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
    } else {
      // Normal log update (no swap)
      await loadTodaysLogs()
    }
  }
  
  // Check if workout is completed today
  const isWorkoutCompleted = async () => {
    if (!client?.id || !db) return false
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await db.supabase
        .from('workout_completions')
        .select('completed')
        .eq('client_id', client.id)
        .eq('workout_date', today)
        .single()
      
      return data?.completed || false
    } catch (error) {
      return false
    }
  }
  
  // If no schema, show message
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
