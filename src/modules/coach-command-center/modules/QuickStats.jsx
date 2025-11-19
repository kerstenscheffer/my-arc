// src/modules/coach-command-center/modules/QuickStats.jsx
// Quick statistics overview for client in Command Center
// Shows: Weight trend, Goal progress, Workout compliance

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Target, Dumbbell, Activity } from 'lucide-react'
import DatabaseService from '../../../services/DatabaseService'

export default function QuickStats({ clientId, db, isMobile }) {
  const [stats, setStats] = useState({
    weight: null,
    goals: null,
    workouts: null,
    loading: true
  })

  useEffect(() => {
    loadAllStats()
  }, [clientId])

  const loadAllStats = async () => {
    setStats(prev => ({ ...prev, loading: true }))
    
    try {
      const [weight, goals, workouts] = await Promise.all([
        loadWeightTrend(),
        loadGoalProgress(),
        loadWorkoutCompliance()
      ])

      setStats({
        weight,
        goals,
        workouts,
        loading: false
      })

      console.log('✅ [QuickStats] All stats loaded for client:', clientId)
    } catch (error) {
      console.error('❌ [QuickStats] Error loading stats:', error)
      setStats({
        weight: null,
        goals: null,
        workouts: null,
        loading: false
      })
    }
  }

  // WEIGHT TREND
  const loadWeightTrend = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('weight_logs')
        .select('date, weight')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      
      if (!data || data.length === 0) {
        return { status: 'no_data', message: 'No weight logged' }
      }

      if (data.length === 1) {
        return { 
          status: 'single', 
          current: data[0].weight,
          message: `${data[0].weight} kg`,
          date: data[0].date
        }
      }

      // Calculate trend (last 7 days vs 30 days ago)
      const latest = data[0]
      const oldest = data[data.length - 1]
      const diff = latest.weight - oldest.weight
      const diffAbs = Math.abs(diff)

      return {
        status: 'trend',
        current: latest.weight,
        previous: oldest.weight,
        diff: diff,
        diffAbs: diffAbs,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
        message: diff === 0 
          ? `${latest.weight} kg (stable)` 
          : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`,
        entries: data.length
      }
    } catch (error) {
      console.error('❌ [QuickStats] Weight load failed:', error)
      return { status: 'error', message: 'Error loading' }
    }
  }

  // GOAL PROGRESS
  const loadGoalProgress = async () => {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('client_goals')
        .select('id, goal_type, title, current_value, target_value, status, target_date')
        .eq('client_id', clientId)
        .eq('status', 'active')

      if (error) throw error

      if (!data || data.length === 0) {
        return { status: 'no_data', message: 'No active goals' }
      }

      // Calculate progress for each goal
      const goalsWithProgress = data.map(goal => {
        const progress = goal.target_value > 0 
          ? (goal.current_value / goal.target_value) * 100 
          : 0
        const isOnTrack = progress >= 50 // 50% or more = on track
        return {
          ...goal,
          progress: Math.min(progress, 100),
          isOnTrack
        }
      })

      const onTrackCount = goalsWithProgress.filter(g => g.isOnTrack).length
      const totalGoals = goalsWithProgress.length
      const avgProgress = goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / totalGoals

      return {
        status: 'active',
        total: totalGoals,
        onTrack: onTrackCount,
        offTrack: totalGoals - onTrackCount,
        avgProgress: avgProgress,
        message: `${onTrackCount}/${totalGoals} on track`,
        goals: goalsWithProgress
      }
    } catch (error) {
      console.error('❌ [QuickStats] Goals load failed:', error)
      return { status: 'error', message: 'Error loading' }
    }
  }

  // WORKOUT COMPLIANCE
  const loadWorkoutCompliance = async () => {
    try {
      const last7Days = new Date()
      last7Days.setDate(last7Days.getDate() - 7)
      const last7DaysStr = last7Days.toISOString().split('T')[0]

      const { data, error } = await DatabaseService.supabase
        .from('workout_completions')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .gte('workout_date', last7DaysStr)
        .order('workout_date', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        return { status: 'no_data', message: 'No workouts logged' }
      }

      const completedCount = data.filter(w => w.completed).length
      const totalDays = 7
      const complianceRate = (completedCount / totalDays) * 100

      return {
        status: 'active',
        completed: completedCount,
        total: totalDays,
        rate: complianceRate,
        message: `${completedCount}/${totalDays} days`,
        lastWorkout: data[0]?.workout_date || null
      }
    } catch (error) {
      console.error('❌ [QuickStats] Workouts load failed:', error)
      return { status: 'error', message: 'Error loading' }
    }
  }

  if (stats.loading) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: '#10b981',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading stats...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '0.875rem' : '1rem'
    }}>
      {/* Header */}
      <h4 style={{
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '600',
        color: '#10b981',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Activity size={isMobile ? 16 : 18} />
        Quick Stats
      </h4>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* WEIGHT STAT */}
        <StatCard
          icon={getWeightIcon(stats.weight)}
          label="Weight"
          value={stats.weight?.message || 'No data'}
          color={getWeightColor(stats.weight)}
          isMobile={isMobile}
          detail={stats.weight?.status === 'trend' && stats.weight?.entries > 1 
            ? `${stats.weight.entries} entries` 
            : null
          }
        />

        {/* GOALS STAT */}
        <StatCard
          icon={<Target size={isMobile ? 18 : 20} />}
          label="Goals"
          value={stats.goals?.message || 'No goals'}
          color={getGoalsColor(stats.goals)}
          isMobile={isMobile}
          detail={stats.goals?.status === 'active' 
            ? `${Math.round(stats.goals.avgProgress)}% avg` 
            : null
          }
        />

        {/* WORKOUT STAT */}
        <StatCard
          icon={<Dumbbell size={isMobile ? 18 : 20} />}
          label="Workouts (7d)"
          value={stats.workouts?.message || 'No data'}
          color={getWorkoutsColor(stats.workouts)}
          isMobile={isMobile}
          detail={stats.workouts?.status === 'active' 
            ? `${Math.round(stats.workouts.rate)}% compliance` 
            : null
          }
        />
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, label, value, color, isMobile, detail }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      border: `1px solid ${color}40`,
      borderRadius: '10px',
      padding: isMobile ? '0.75rem' : '0.875rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {/* Icon + Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: color,
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        fontWeight: '500',
        opacity: 0.8
      }}>
        {icon}
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: '700',
        color: color,
        lineHeight: '1.2'
      }}>
        {value}
      </div>

      {/* Detail */}
      {detail && (
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '-0.25rem'
        }}>
          {detail}
        </div>
      )}
    </div>
  )
}

// Helper functions for colors and icons
function getWeightIcon(weight) {
  if (!weight || weight.status === 'no_data' || weight.status === 'error') {
    return <Minus size={18} />
  }
  if (weight.status === 'single') {
    return <Activity size={18} />
  }
  if (weight.direction === 'up') {
    return <TrendingUp size={18} />
  }
  if (weight.direction === 'down') {
    return <TrendingDown size={18} />
  }
  return <Minus size={18} />
}

function getWeightColor(weight) {
  if (!weight || weight.status === 'no_data' || weight.status === 'error') {
    return 'rgba(255, 255, 255, 0.3)'
  }
  if (weight.direction === 'up') {
    return '#f59e0b' // Orange for gain
  }
  if (weight.direction === 'down') {
    return '#10b981' // Green for loss (assuming fat loss goal)
  }
  return '#6b7280' // Gray for stable
}

function getGoalsColor(goals) {
  if (!goals || goals.status === 'no_data' || goals.status === 'error') {
    return 'rgba(255, 255, 255, 0.3)'
  }
  const onTrackRate = goals.onTrack / goals.total
  if (onTrackRate >= 0.7) return '#10b981' // Green
  if (onTrackRate >= 0.4) return '#f59e0b' // Orange
  return '#ef4444' // Red
}

function getWorkoutsColor(workouts) {
  if (!workouts || workouts.status === 'no_data' || workouts.status === 'error') {
    return 'rgba(255, 255, 255, 0.3)'
  }
  if (workouts.rate >= 70) return '#10b981' // Green
  if (workouts.rate >= 40) return '#f59e0b' // Orange
  return '#ef4444' // Red
}
