// src/modules/progress/workout/services/WorkoutService.js

class WorkoutService {
  constructor(db) {
    this.db = db;
    this.supabase = db?.supabase || db;
  }

  /**
   * Get scheduled workout met smart detection en last workout data
   */
  async getScheduledWorkout(clientId) {
    if (!clientId) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check voor vandaag's geplande workout
      const { data: schedule } = await this.supabase
        .from('workout_schedule')
        .select(`
          *,
          workout:workouts(
            *,
            workout_exercises(
              *,
              exercise:exercises(*)
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('scheduled_date', today)
        .single();

      if (schedule?.workout) {
        // Haal laatste workout data op
        const lastWorkout = await this.getLastWorkoutData(clientId, schedule.workout.id);
        
        return {
          scheduled: {
            id: schedule.workout.id,
            name: schedule.workout.name,
            exercises: schedule.workout.workout_exercises?.map(we => ({
              id: we.exercise?.id || we.exercise_id,
              name: we.exercise?.name || 'Unknown Exercise',
              sets: we.sets || 3,
              reps: we.reps || 10,
              rest: we.rest_seconds || 60
            })) || []
          },
          lastWorkout,
          completed: await this.isWorkoutCompletedToday(clientId, schedule.workout.id)
        };
      }

      // Als geen geplande workout, return null zodat UI quick workouts toont
      return null;
    } catch (error) {
      console.error('Error fetching scheduled workout:', error);
      return null;
    }
  }

  /**
   * Get last workout data voor referentie
   */
  async getLastWorkoutData(clientId, workoutId) {
    try {
      // Haal laatste sessie op voor deze workout
      const { data: lastSession } = await this.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('workout_id', workoutId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastSession) return null;

      const lastDate = new Date(lastSession.completed_at).toISOString().split('T')[0];

      // Haal progress data op uit workout_progress table
      // Gebruik client_id en date in plaats van session_id
      const { data: progressData } = await this.supabase
        .from('workout_progress')
        .select('*')
        .eq('client_id', clientId)
        .eq('date', lastDate);

      if (progressData) {
        return {
          date: lastSession.completed_at,
          duration: lastSession.duration_minutes,
          exercises: progressData.map(progress => ({
            exercise_id: progress.exercise_name.toLowerCase().replace(/\s+/g, '-'),
            exercise_name: progress.exercise_name,
            sets: Array.isArray(progress.sets) ? progress.sets : []
          }))
        };
      }

      // Fallback naar exercise_logs als workout_progress niet bestaat
      const { data: exerciseLogs } = await this.supabase
        .from('exercise_logs')
        .select('*')
        .eq('session_id', lastSession.id);

      if (!exerciseLogs) return null;

      // Groepeer logs per exercise
      const exerciseMap = {};
      exerciseLogs.forEach(log => {
        if (!exerciseMap[log.exercise_id]) {
          exerciseMap[log.exercise_id] = {
            exercise_id: log.exercise_id,
            sets: []
          };
        }
        exerciseMap[log.exercise_id].sets.push({
          weight: log.weight || 0,
          reps: log.reps || 0
        });
      });

      return {
        date: lastSession.completed_at,
        duration: lastSession.duration_minutes,
        exercises: Object.values(exerciseMap)
      };
    } catch (error) {
      console.error('Error getting last workout data:', error);
      return null;
    }
  }

  /**
   * Check of workout al voltooid is vandaag
   */
  async isWorkoutCompletedToday(clientId, workoutId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await this.supabase
        .from('workout_sessions')
        .select('id')
        .eq('client_id', clientId)
        .eq('workout_id', workoutId)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(clientId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions } = await this.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      // Calculate streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasWorkout = sessions?.some(s => 
          s.completed_at.startsWith(dateStr)
        );
        
        if (hasWorkout) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // Weekly stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekSessions = sessions?.filter(s => 
        new Date(s.completed_at) >= weekAgo
      ) || [];

      // Calculate volume met client_id en date
      let weeklyVolume = 0;
      if (weekSessions.length > 0) {
        // Haal progress data op voor week
        const weekDates = weekSessions.map(s => 
          new Date(s.completed_at).toISOString().split('T')[0]
        );
        
        const { data: progressData } = await this.supabase
          .from('workout_progress')
          .select('sets')
          .eq('client_id', clientId)
          .in('date', weekDates);

        progressData?.forEach(record => {
          if (Array.isArray(record.sets)) {
            record.sets.forEach(set => {
              weeklyVolume += (set.weight || 0) * (set.reps || 0);
            });
          }
        });
      }

      // Consistency percentage
      const weeksInPeriod = days / 7;
      const avgPerWeek = sessions ? sessions.length / weeksInPeriod : 0;
      const targetPerWeek = 4;
      const consistency = Math.min(100, Math.round((avgPerWeek / targetPerWeek) * 100));

      return {
        totalWorkouts: sessions?.length || 0,
        streak,
        weeklyWorkouts: weekSessions.length,
        weeklyVolume: Math.round(weeklyVolume),
        consistency
      };
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      return {
        totalWorkouts: 0,
        streak: 0,
        weeklyWorkouts: 0,
        weeklyVolume: 0,
        consistency: 0
      };
    }
  }

  /**
   * Log completed workout - werkt met bestaande workout_progress structuur
   */
  async logWorkout(clientId, workoutData) {
    try {
      const {
        workoutId,
        exercises,
        duration,
        feeling,
        notes
      } = workoutData;

      const today = new Date().toISOString().split('T')[0];

      // Check if workoutId is a valid UUID or a quick workout string
      const isQuickWorkout = typeof workoutId === 'string' && 
        (workoutId.includes('quick') || workoutId.includes('upper') || 
         workoutId.includes('lower') || workoutId.includes('cardio'));

      // Maak workout sessie
      const { data: session, error: sessionError } = await this.supabase
        .from('workout_sessions')
        .insert({
          client_id: clientId,
          workout_id: isQuickWorkout ? null : workoutId, // NULL voor quick workouts
          completed_at: new Date().toISOString(),
          duration_minutes: duration || 0,
          notes: notes || ''
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Maak workout_progress records voor elke exercise
      // Gebruik client_id en date in plaats van session_id
      const progressRecords = [];
      
      for (const exercise of exercises) {
        // Bepaal exercise naam
        const exerciseName = exercise.exercise_name || 
          exercise.exercise_id.replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Filter alleen completed sets
        const completedSets = Object.values(exercise.sets || {})
          .filter(set => set && set.completed && set.weight && set.reps)
          .map(({ weight, reps }) => ({ 
            weight: parseFloat(weight) || 0, 
            reps: parseInt(reps) || 0 
          }));

        if (completedSets.length > 0) {
          progressRecords.push({
            client_id: clientId,  // Gebruik client_id
            date: today,          // Gebruik date
            exercise_name: exerciseName,
            sets: completedSets,  // JSONB array
            notes: notes || null
          });
        }
      }

      // Insert workout progress met upsert om duplicaten te voorkomen
      if (progressRecords.length > 0) {
        for (const record of progressRecords) {
          const { error: progressError } = await this.supabase
            .from('workout_progress')
            .upsert(record, {
              onConflict: 'client_id,date,exercise_name'
            });

          if (progressError) {
            console.error('Progress error:', progressError);
            // Fallback naar exercise_logs
            await this.logToExerciseLogs(session.id, exercises);
          }
        }
      }

      return { success: true, sessionId: session.id };
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    }
  }

  /**
   * Fallback functie voor exercise_logs table
   */
  async logToExerciseLogs(sessionId, exercises) {
    try {
      const exerciseLogs = [];
      
      exercises.forEach(exercise => {
        Object.values(exercise.sets).forEach((set, index) => {
          if (set.completed && set.weight && set.reps) {
            exerciseLogs.push({
              session_id: sessionId,
              exercise_id: exercise.exercise_id,
              set_number: index + 1,
              reps: set.reps,
              weight: set.weight,
              completed: true
            });
          }
        });
      });

      if (exerciseLogs.length > 0) {
        await this.supabase
          .from('exercise_logs')
          .insert(exerciseLogs);
      }
    } catch (error) {
      console.error('Error logging to exercise_logs:', error);
    }
  }

  /**
   * Get workout history
   */
  async getWorkoutHistory(clientId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await this.supabase
        .from('workout_sessions')
        .select(`
          *,
          workout:workouts(name, type),
          workout_progress(
            exercise_name,
            sets
          )
        `)
        .eq('client_id', clientId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error fetching workout history:', error);
      return [];
    }
  }

  /**
   * Quick log functie voor widget
   */
  async quickLogExercise(clientId, exerciseData) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check voor bestaande sessie vandaag
      let { data: session } = await this.supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .gte('completed_at', today + 'T00:00:00')
        .lte('completed_at', today + 'T23:59:59')
        .single();

      if (!session) {
        const { data: newSession } = await this.supabase
          .from('workout_sessions')
          .insert({
            client_id: clientId,
            workout_id: null,
            completed_at: new Date().toISOString(),
            duration_minutes: 0
          })
          .select()
          .single();
        
        session = newSession;
      }

      // Log naar workout_progress
      const { data: log } = await this.supabase
        .from('workout_progress')
        .insert({
          session_id: session.id,
          exercise_name: exerciseData.exercise_name,
          sets: exerciseData.sets // Array van {weight, reps}
        })
        .select()
        .single();

      return log;
    } catch (error) {
      console.error('Error quick logging:', error);
      throw error;
    }
  }

  // Behoud bestaande methods voor backwards compatibility
  calculateStreak(sessions) {
    if (!sessions?.length) return 0;
    
    const sorted = sessions.sort((a, b) => 
      new Date(b.completed_at) - new Date(a.completed_at)
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
      const sessionDate = new Date(sorted[i].completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  calculateWeeklyVolume(sessions) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = sessions?.filter(s => 
      new Date(s.completed_at) >= weekAgo
    ) || [];
    
    return weekSessions.length;
  }
}

export default WorkoutService;
