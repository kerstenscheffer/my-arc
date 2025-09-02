// src/modules/workouts/components/WorkoutWidget.jsx

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Calendar, ChevronRight, Plus, BarChart3, X } from 'lucide-react';
import WorkoutService from '../../progress/workout/services/WorkoutService';
import WorkoutLogModule from '../../progress/workout/WorkoutLogModule';

export default function WorkoutWidget({ db, currentUser }) {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [stats, setStats] = useState({
    thisWeek: 0,
    lastMonth: 0,
    streak: 0
  });
  const workoutService = new WorkoutService(db);

  useEffect(() => {
    if (currentUser?.id) {
      loadWidgetData();
    }
  }, [currentUser]);

  const loadWidgetData = async () => {
    try {
      // Laad vandaag's workout
      const today = await workoutService.getTodaysWorkout(currentUser.id);
      setTodaysWorkout(today);

      // Laad recente workouts
      const history = await workoutService.getWorkoutHistory(currentUser.id, 7);
      setRecentWorkouts(history.slice(0, 3));

      // Bereken stats
      const thisWeek = history.filter(w => {
        const date = new Date(w.completed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }).length;

      const monthHistory = await workoutService.getWorkoutHistory(currentUser.id, 30);
      
      // Bereken streak
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (monthHistory.some(w => w.completed_at.startsWith(dateStr))) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setStats({
        thisWeek,
        lastMonth: monthHistory.length,
        streak
      });
    } catch (error) {
      console.error('Error loading widget data:', error);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-orange-500/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-white" />
              <h3 className="text-white font-bold text-lg">Workout Tracker</h3>
            </div>
            <a
              href="/progress?tab=workout"
              className="text-white/80 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-px bg-orange-500/10 p-px">
          <div className="bg-gray-900 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.thisWeek}</div>
            <div className="text-xs text-gray-400 mt-1">Deze week</div>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.streak}</div>
            <div className="text-xs text-gray-400 mt-1">Dagen streak</div>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.lastMonth}</div>
            <div className="text-xs text-gray-400 mt-1">Deze maand</div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Today's Workout */}
          {todaysWorkout ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-orange-400 mb-1">Vandaag gepland</p>
                  <h4 className="text-white font-semibold">{todaysWorkout.workout.name}</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    {todaysWorkout.workout.workout_exercises?.length} oefeningen
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-orange-400" />
              </div>
              <button
                onClick={() => setShowQuickLog(true)}
                className="w-full mt-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Start Workout
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-sm mb-3">Geen workout gepland vandaag</p>
              <button
                onClick={() => setShowQuickLog(true)}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Log Vrije Training
              </button>
            </div>
          )}

          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-gray-300 font-medium text-sm">Recente workouts</h4>
                <BarChart3 className="w-4 h-4 text-gray-500" />
              </div>
              <div className="space-y-2">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex justify-between items-center bg-gray-800/30 rounded-lg p-2">
                    <div>
                      <p className="text-white text-sm">{workout.workout?.name || 'Vrije training'}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(workout.completed_at).toLocaleDateString('nl-NL', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 text-sm font-medium">
                        {workout.exercise_logs?.length} oef.
                      </p>
                      <p className="text-gray-500 text-xs">
                        {workout.duration_minutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Link */}
          <a
            href="/progress?tab=workout"
            className="block w-full py-2 bg-gray-800 hover:bg-gray-700 text-center text-gray-300 rounded-lg text-sm transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Bekijk Volledige Progressie
            </span>
          </a>
        </div>
      </div>

      {/* Quick Log Modal - Gebruik bestaande WorkoutLogModule */}
      {showQuickLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-orange-500/20">
            <div className="sticky top-0 bg-gray-900 border-b border-orange-500/10 p-4 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">Quick Workout Log</h2>
              <button
                onClick={() => setShowQuickLog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <WorkoutLogModule
                client={currentUser}
                db={db}
                onComplete={() => {
                  setShowQuickLog(false);
                  loadWidgetData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
