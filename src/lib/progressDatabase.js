// src/lib/progressDatabase.js
// MY ARC Progressie Systeem - Complete Database Functions
import { supabase } from './supabase'

/**
 * ===== PROGRESSIE DATA STRUCTUUR =====
 * 
 * Table: workout_progress
 * - id (uuid, primary key)
 * - client_id (uuid, foreign key to clients)
 * - date (date, workout datum)
 * - exercise_name (text, naam van oefening)
 * - sets (jsonb, array van {reps: number, weight: number})
 * - notes (text, client notitie)
 * - coach_suggestion (text, coach advies)
 * - created_at (timestamp)
 * 
 * Coach suggestions types:
 * - "increase_weight" (zwaarder pakken)
 * - "decrease_weight" (lichter pakken)  
 * - "maintain_weight" (gewicht aanhouden)
 * - "custom" (vrije tekst)
 */

// ===== CLIENT FUNCTIONS =====

/**
 * Log workout progress voor client
 */
export async function logWorkoutProgress(progressData) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .insert([{
        client_id: progressData.clientId,
        date: progressData.date,
        exercise_name: progressData.exerciseName,
        sets: progressData.sets, // [{reps: 10, weight: 80}, {reps: 8, weight: 80}]
        notes: progressData.notes || '',
        coach_suggestion: progressData.coachSuggestion || 'maintain_weight'
      }])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Workout progress logged:', data)
    return data
  } catch (error) {
    console.error('❌ Error logging progress:', error)
    throw error
  }
}

/**
 * Get client workout progress voor specific exercise
 */
export async function getExerciseProgress(clientId, exerciseName, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('exercise_name', exerciseName)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting exercise progress:', error)
    throw error
  }
}

/**
 * Get all client progress for specific date (week view)
 */
export async function getClientProgressByDate(clientId, date) {
  try {
    const { data, error } = await supabase
      .from('workout_progress')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting progress by date:', error)
    throw error
  }
}

/**
 * Get client workout history (laatste 30 dagen)
 */
export async function getClientWorkoutHistory(clientId, days = 30) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days)
    
    const { data, error } = await supabase
      .from('workout_progress')
      .select('date, exercise_name, sets, notes')
      .eq('client_id', clientId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting workout history:', error)
    throw error
  }
}

/**
 * Get unique exercises voor client (voor dropdown) + populaire oefeningen
 */
export async function getClientExercises(clientId) {
  try {
    // Get client's own exercises
    const { data: clientData, error: clientError } = await supabase
      .from('workout_progress')
      .select('exercise_name')
      .eq('client_id', clientId)
      .order('exercise_name')

    if (clientError) throw clientError
    
    // Get popular exercises from all users (top 50)
    const { data: popularData, error: popularError } = await supabase
      .from('workout_progress')
      .select('exercise_name')
      .order('exercise_name')
      .limit(200) // Get more data to find popular ones

    if (popularError) throw popularError
    
    // Combine and remove duplicates
    const clientExercises = [...new Set(clientData?.map(item => item.exercise_name) || [])]
    const allExercises = [...new Set(popularData?.map(item => item.exercise_name) || [])]
    
    // Default popular exercises if database is empty
    const defaultExercises = [
      'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
      'Pull-ups', 'Dips', 'Lunges', 'Hip Thrust', 'Leg Press',
      'Lat Pulldown', 'Bicep Curls', 'Tricep Extensions', 'Shoulder Raises',
      'Planks', 'Russian Twists', 'Leg Curls', 'Calf Raises', 'Face Pulls',
      'Incline Bench Press', 'Romanian Deadlift', 'Bulgarian Split Squat',
      'Dumbbell Press', 'Cable Rows', 'Tricep Dips', 'Hammer Curls',
      'Lateral Raises', 'Front Squats', 'Sumo Deadlift'
    ]
    
    // Merge: client exercises first, then popular, then defaults
    const finalExercises = [
      ...clientExercises,
      ...allExercises.filter(ex => !clientExercises.includes(ex)),
      ...defaultExercises.filter(ex => !clientExercises.includes(ex) && !allExercises.includes(ex))
    ]
    
    return finalExercises.slice(0, 100) // Limit to 100 exercises
  } catch (error) {
    console.error('❌ Error getting client exercises:', error)
    
    // Fallback to default exercises
    return [
      'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
      'Pull-ups', 'Dips', 'Lunges', 'Hip Thrust', 'Leg Press',
      'Lat Pulldown', 'Bicep Curls', 'Tricep Extensions', 'Shoulder Raises',
      'Planks', 'Russian Twists', 'Leg Curls', 'Calf Raises', 'Face Pulls'
    ]
  }
}

// ===== COACH FUNCTIONS =====

/**
 * Update coach suggestion voor specific progress entry
 */
export async function updateCoachSuggestion(progressId, suggestion, customText = '') {
  try {
    const suggestionText = suggestion === 'custom' ? customText : suggestion
    
    const { data, error } = await supabase
      .from('workout_progress')
      .update({ 
        coach_suggestion: suggestionText 
      })
      .eq('id', progressId)
      .select()
      .single()

    if (error) throw error
    console.log('✅ Coach suggestion updated:', data)
    return data
  } catch (error) {
    console.error('❌ Error updating coach suggestion:', error)
    throw error
  }
}

/**
 * Get all progress for coach client overview
 */
export async function getCoachClientProgress(trainerId, clientId = null, days = 7) {
  try {
    const dateFilter = new Date()
    dateFilter.setDate(dateFilter.getDate() - days)
    
    let query = supabase
      .from('workout_progress')
      .select(`
        *,
        clients!inner(id, first_name, last_name, trainer_id)
      `)
      .eq('clients.trainer_id', trainerId)
      .gte('date', dateFilter.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Error getting coach client progress:', error)
    throw error
  }
}

/**
 * Get progress statistics voor coach dashboard
 */
export async function getProgressStats(trainerId, days = 30) {
  try {
    const dateFilter = new Date()
    dateFilter.setDate(dateFilter.getDate() - days)
    
    const { data, error } = await supabase
      .from('workout_progress')
      .select(`
        id,
        date,
        clients!inner(trainer_id)
      `)
      .eq('clients.trainer_id', trainerId)
      .gte('date', dateFilter.toISOString().split('T')[0])

    if (error) throw error
    
    const stats = {
      totalWorkouts: data?.length || 0,
      uniqueClients: new Set(data?.map(item => item.client_id) || []).size,
      lastWeekWorkouts: data?.filter(item => {
        const workoutDate = new Date(item.date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return workoutDate >= weekAgo
      }).length || 0
    }
    
    return stats
  } catch (error) {
    console.error('❌ Error getting progress stats:', error)
    throw error
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate max weight per exercise (voor progress graphs)
 */
export function calculateMaxWeight(progressEntries) {
  if (!progressEntries || progressEntries.length === 0) return []
  
  return progressEntries.map(entry => {
    const maxWeight = Math.max(
      ...entry.sets.map(set => set.weight || 0)
    )
    return {
      date: entry.date,
      maxWeight,
      exercise: entry.exercise_name
    }
  })
}

/**
 * Get suggestion text for UI
 */
export function getSuggestionText(suggestion, language = 'nl') {
  const suggestions = {
    nl: {
      increase_weight: 'Zwaarder pakken 💪',
      decrease_weight: 'Lichter pakken 📉',
      maintain_weight: 'Gewicht aanhouden ✅',
      custom: suggestion
    },
    en: {
      increase_weight: 'Increase Weight 💪',
      decrease_weight: 'Decrease Weight 📉', 
      maintain_weight: 'Maintain Weight ✅',
      custom: suggestion
    }
  }
  
  return suggestions[language][suggestion] || suggestion
}

/**
 * Format sets voor display
 */
export function formatSets(sets) {
  if (!sets || sets.length === 0) return 'Geen sets'
  
  return sets.map(set => `${set.reps}x${set.weight}kg`).join(', ')
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calculate week dates (Monday to Sunday)
 */
export function getWeekDates(date = new Date()) {
  const week = []
  const startOfWeek = new Date(date)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  
  startOfWeek.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    week.push(day.toISOString().split('T')[0])
  }
  
  return week
}

// ===== CREATE TABLE QUERIES (voor Supabase setup) =====

/**
 * SQL om workout_progress table te maken in Supabase
 */
export const CREATE_PROGRESS_TABLE_SQL = `
-- Create workout_progress table
CREATE TABLE IF NOT EXISTS workout_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  coach_suggestion TEXT DEFAULT 'maintain_weight',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_progress_client_id ON workout_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_date ON workout_progress(date);
CREATE INDEX IF NOT EXISTS idx_workout_progress_exercise ON workout_progress(exercise_name);

-- Enable RLS (Row Level Security)
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (clients can only see their own progress)
CREATE POLICY "workout_progress_select_policy" ON workout_progress
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "workout_progress_insert_policy" ON workout_progress
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "workout_progress_update_policy" ON workout_progress
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id = auth.uid()
    )
  );
`;

console.log('🎯 Progress Database Functions Loaded!')
console.log('📊 Ready for workout tracking & coach insights!')
