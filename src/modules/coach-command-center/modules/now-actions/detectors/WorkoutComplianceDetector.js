// src/modules/coach-command-center/modules/now-actions/detectors/WorkoutComplianceDetector.js

class WorkoutComplianceDetector {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  async detect(client) {
    const actions = []
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()]
    const currentHour = today.getHours()
    
    try {
      // Get last 7 days of workout data
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      // Check workout_completion table
      const { data: completions } = await this.supabase
        .from('workout_completion')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
      
      // Check today's workout
      const { data: todayWorkout } = await this.supabase
        .from('workout_completion')
        .select('*')
        .eq('client_id', client.id)
        .eq('workout_date', todayStr)
        .maybeSingle()
      
      // Get workout sessions for more detail
      const { data: sessions } = await this.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', client.id)
        .gte('workout_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false })
      
      // Get client's workout schema to know expected days
      const { data: workoutPlan } = await this.supabase
        .from('client_workouts')
        .select('*')
        .eq('client_id', client.id)
        .maybeSingle()
      
      // 1. CHECK: Today's workout not done (after typical workout time)
      if (!todayWorkout || !todayWorkout.completed) {
        if (currentHour >= 12) { // After noon
          const urgency = currentHour >= 20 ? 'urgent' : (currentHour >= 16 ? 'today' : 'upcoming')
          const score = currentHour >= 20 ? 85 : (currentHour >= 16 ? 65 : 45)
          
          actions.push({
            id: `workout_not_done_${client.id}_${todayStr}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'workout_missing',
            priority: urgency,
            urgencyScore: score,
            icon: '💪',
            message: `${client.first_name} heeft workout nog niet gedaan`,
            detail: currentHour >= 20 
              ? `Het is al laat - check of workout nog gaat gebeuren`
              : `${dayName} workout staat gepland`,
            buttonText: 'Send Reminder',
            data: { 
              date: todayStr,
              day: dayName,
              skipped: todayWorkout?.skipped_reason || null
            }
          })
        }
      }
      
      // 2. CHECK: Workout streak broken
      const completedDays = completions?.filter(c => c.completed).length || 0
      const lastWorkoutDate = completions?.find(c => c.completed)?.workout_date
      
      if (lastWorkoutDate) {
        const daysSinceLastWorkout = Math.floor((today - new Date(lastWorkoutDate)) / (1000 * 60 * 60 * 24))
        
        if (daysSinceLastWorkout >= 3) {
          actions.push({
            id: `workout_streak_broken_${client.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'workout_inactive',
            priority: daysSinceLastWorkout >= 5 ? 'urgent' : 'today',
            urgencyScore: daysSinceLastWorkout >= 5 ? 80 : 60,
            icon: '🔥',
            message: `${client.first_name}: ${daysSinceLastWorkout} dagen geen workout`,
            detail: `Laatste workout was ${lastWorkoutDate}`,
            buttonText: 'Motivate Client',
            data: { 
              daysSince: daysSinceLastWorkout,
              lastDate: lastWorkoutDate
            }
          })
        }
      }
      
      // 3. CHECK: Low weekly compliance
      const expectedWorkoutsPerWeek = workoutPlan?.days_per_week || 4
      if (completedDays < expectedWorkoutsPerWeek - 2 && today.getDay() >= 4) { // Thursday or later
        actions.push({
          id: `low_weekly_compliance_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'workout_compliance',
          priority: 'today',
          urgencyScore: 55,
          icon: '📊',
          message: `${client.first_name}: ${completedDays}/${expectedWorkoutsPerWeek} workouts deze week`,
          detail: `Achterstand van ${expectedWorkoutsPerWeek - completedDays} workouts`,
          buttonText: 'Review Schedule',
          data: { 
            completed: completedDays,
            expected: expectedWorkoutsPerWeek,
            deficit: expectedWorkoutsPerWeek - completedDays
          }
        })
      }
      
      // 4. CHECK: Skipped with reason
      const skippedToday = todayWorkout?.skipped_reason
      if (skippedToday) {
        actions.push({
          id: `workout_skipped_${client.id}_${todayStr}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'workout_skipped',
          priority: 'today',
          urgencyScore: 40,
          icon: '⚠️',
          message: `${client.first_name} skipped workout: "${skippedToday}"`,
          detail: 'Check if support needed',
          buttonText: 'Follow Up',
          data: { 
            reason: skippedToday,
            date: todayStr
          }
        })
      }
      
      // 5. CHECK: Partial completion (from sessions)
      const todaySession = sessions?.find(s => s.workout_date === todayStr)
      if (todaySession && todaySession.completion_percentage) {
        const percentage = Math.round(todaySession.completion_percentage)
        if (percentage > 0 && percentage < 80) {
          actions.push({
            id: `partial_workout_${client.id}_${todayStr}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'workout_partial',
            priority: 'today',
            urgencyScore: 35,
            icon: '⚡',
            message: `${client.first_name} deed ${percentage}% van workout`,
            detail: todaySession.notes || 'Incomplete workout logged',
            buttonText: 'Check In',
            data: { 
              percentage: percentage,
              session: todaySession
            }
          })
        }
      }
      
      // 6. CHECK: Perfect week (celebrate!)
      if (completedDays >= expectedWorkoutsPerWeek && today.getDay() === 0) { // Sunday
        actions.push({
          id: `perfect_workout_week_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'celebration',
          priority: 'upcoming',
          urgencyScore: 10,
          icon: '🏆',
          message: `${client.first_name} completed all ${completedDays} workouts!`,
          detail: 'Perfect week - send congratulations',
          buttonText: 'Celebrate',
          data: { 
            type: 'perfect_week',
            workouts: completedDays
          }
        })
      }
      
      // 7. CHECK: No workout plan assigned
      if (!workoutPlan) {
        actions.push({
          id: `no_workout_plan_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'workout_setup',
          priority: 'urgent',
          urgencyScore: 90,
          icon: '📋',
          message: `${client.first_name} heeft geen workout plan`,
          detail: 'Assign a workout schema ASAP',
          buttonText: 'Assign Plan',
          data: { 
            type: 'missing_plan'
          }
        })
      }
      
    } catch (error) {
      console.error('WorkoutComplianceDetector error:', error)
    }
    
    return actions.length > 0 ? actions : null
  }
}

export default WorkoutComplianceDetector
