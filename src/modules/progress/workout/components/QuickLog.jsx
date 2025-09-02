// src/modules/progress/workout/components/QuickLog.jsx

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Check, X, Plus, Minus } from 'lucide-react';
import WorkoutService from '../services/WorkoutService';

export default function QuickLog({ db, currentUser, onComplete }) {
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [previousLogs, setPreviousLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const workoutService = new WorkoutService(db);

  useEffect(() => {
    loadTodaysWorkout();
  }, [currentUser]);

  const loadTodaysWorkout = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      // Haal vandaag's workout op
      const workout = await workoutService.getTodaysWorkout(currentUser.id);
      
      if (workout?.workout) {
        setTodaysWorkout(workout);
        
        // Initialiseer oefeningen met default waardes
        const exerciseData = workout.workout.workout_exercises.map(we => ({
          exercise_id: we.exercise.id,
          name: we.exercise.name,
          target_sets: we.sets,
          target_reps: we.reps,
          rest_seconds: we.rest_seconds,
          sets: [],
          currentSet: { reps: we.reps, weight: 0 }
        }));
        
        setExercises(exerciseData);
        
        // Haal vorige logs op
        const exerciseIds = exerciseData.map(e => e.exercise_id);
        const prevLogs = await workoutService.getPreviousExerciseLogs(
          currentUser.id, 
          exerciseIds, 
          1
        );
        setPreviousLogs(prevLogs);
        
        // Set default gewichten van laatste sessie
        exerciseData.forEach((ex, idx) => {
          const lastLog = prevLogs[ex.exercise_id]?.[0];
          if (lastLog?.weight) {
            exerciseData[idx].currentSet.weight = lastLog.weight;
          }
        });
        setExercises([...exerciseData]);
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSet = (exerciseIdx) => {
    const exercise = exercises[exerciseIdx];
    const newSet = { ...exercise.currentSet };
    
    exercises[exerciseIdx].sets.push(newSet);
    setExercises([...exercises]);
  };

  const removeSet = (exerciseIdx, setIdx) => {
    exercises[exerciseIdx].sets.splice(setIdx, 1);
    setExercises([...exercises]);
  };

  const updateCurrentSet = (exerciseIdx, field, value) => {
    exercises[exerciseIdx].currentSet[field] = value;
    setExercises([...exercises]);
  };

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    exercises[exerciseIdx].sets[setIdx][field] = value;
    setExercises([...exercises]);
  };

  const submitWorkout = async () => {
    setSubmitting(true);
    try {
      const exerciseData = exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        sets: ex.sets.length,
        reps: ex.sets.map(s => s.reps),
        weight: ex.sets.map(s => s.weight),
        notes: ''
      }));

      await workoutService.logWorkoutSession(
        currentUser.id,
        todaysWorkout.workout.id,
        exerciseData
      );

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error submitting workout:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!todaysWorkout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Geen workout gepland voor vandaag</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl">
        <h3 className="text-white font-bold text-lg">{todaysWorkout.workout.name}</h3>
        <p className="text-orange-100 text-sm mt-1">
          {exercises.length} oefeningen • {exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets voltooid
        </p>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map((exercise, idx) => (
          <div key={exercise.exercise_id} className="bg-gray-900 rounded-xl p-4 border border-orange-500/10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="text-white font-semibold">{exercise.name}</h4>
                <p className="text-gray-400 text-xs mt-1">
                  Doel: {exercise.target_sets} × {exercise.target_reps}
                </p>
                
                {/* Previous performance */}
                {previousLogs[exercise.exercise_id]?.[0] && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-orange-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      Vorige: {previousLogs[exercise.exercise_id][0].sets_completed} × {previousLogs[exercise.exercise_id][0].reps?.[0]} @ {previousLogs[exercise.exercise_id][0].weight?.[0]}kg
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Completed sets */}
            {exercise.sets.length > 0 && (
              <div className="space-y-2 mb-3">
                {exercise.sets.map((set, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
                    <span className="text-orange-400 text-sm font-medium w-12">Set {setIdx + 1}</span>
                    
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(idx, setIdx, 'reps', parseInt(e.target.value))}
                        className="w-16 bg-gray-700 text-white text-center rounded px-2 py-1 text-sm"
                        placeholder="Reps"
                      />
                      <span className="text-gray-500">×</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(idx, setIdx, 'weight', parseFloat(e.target.value))}
                        className="w-20 bg-gray-700 text-white text-center rounded px-2 py-1 text-sm"
                        placeholder="Gewicht"
                        step="0.5"
                      />
                      <span className="text-gray-500 text-sm">kg</span>
                    </div>

                    <button
                      onClick={() => removeSet(idx, setIdx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add set */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 bg-gray-800 p-2 rounded-lg">
                <button
                  onClick={() => updateCurrentSet(idx, 'reps', Math.max(1, exercise.currentSet.reps - 1))}
                  className="text-orange-400 hover:text-orange-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={exercise.currentSet.reps}
                  onChange={(e) => updateCurrentSet(idx, 'reps', parseInt(e.target.value))}
                  className="w-12 bg-transparent text-white text-center text-sm"
                />
                <button
                  onClick={() => updateCurrentSet(idx, 'reps', exercise.currentSet.reps + 1)}
                  className="text-orange-400 hover:text-orange-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <span className="text-gray-500 mx-1">×</span>
                
                <button
                  onClick={() => updateCurrentSet(idx, 'weight', Math.max(0, exercise.currentSet.weight - 2.5))}
                  className="text-orange-400 hover:text-orange-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={exercise.currentSet.weight}
                  onChange={(e) => updateCurrentSet(idx, 'weight', parseFloat(e.target.value))}
                  className="w-16 bg-transparent text-white text-center text-sm"
                  step="0.5"
                />
                <button
                  onClick={() => updateCurrentSet(idx, 'weight', exercise.currentSet.weight + 2.5)}
                  className="text-orange-400 hover:text-orange-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-gray-500 text-sm">kg</span>
              </div>
              
              <button
                onClick={() => addSet(idx)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Add Set
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={submitWorkout}
        disabled={submitting || exercises.every(e => e.sets.length === 0)}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all transform active:scale-95"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Opslaan...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            Workout Voltooien
          </span>
        )}
      </button>
    </div>
  );
}
