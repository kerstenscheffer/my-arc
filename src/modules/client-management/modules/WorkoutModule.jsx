// src/modules/client-management/modules/WorkoutModule.jsx
import { useState, useEffect } from 'react'

export default function WorkoutModule({ client, data, onAction, viewMode, db }) {
  const [loading, setLoading] = useState(false)
  const [newCompletion, setNewCompletion] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    rating: 5
  })
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Safe data extraction
  const workoutData = {
    current_schema: data?.current_schema || null,
    compliance: data?.compliance || 0,
    progress: data?.progress || [],
    completions: data?.completions || [],
    streak: data?.streak || 0
  }
  
  // Calculate weekly stats
  const weeklyWorkouts = workoutData.completions.filter(c => {
    const date = new Date(c.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date > weekAgo
  }).length
  
  const targetWorkouts = workoutData.current_schema?.days_per_week || 3
  const weeklyCompliance = Math.round((weeklyWorkouts / targetWorkouts) * 100)
  
  const handleSaveCompletion = async () => {
    setLoading(true)
    try {
      await onAction('saveWorkoutCompletion', {
        client_id: client.id,
        schema_id: workoutData.current_schema?.id,
        ...newCompletion
      })
      setShowAddForm(false)
      setNewCompletion({
        date: new Date().toISOString().split('T')[0],
        notes: '',
        rating: 5
      })
    } catch (error) {
      console.error('Failed to save completion:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getComplianceColor = (value) => {
    if (value >= 80) return '#10b981'
    if (value >= 60) return '#3b82f6'
    if (value >= 40) return '#f59e0b'
    return '#ef4444'
  }
  
  const getRatingEmoji = (rating) => {
    if (rating >= 8) return '🔥'
    if (rating >= 6) return '💪'
    if (rating >= 4) return '👍'
    return '😅'
  }
  
  // Focus view - detailed workout management
  if (viewMode === 'focus') {
    return (
      <div>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>💪 Workout Program</h4>
          <button
            className="myarc-btn myarc-btn-sm myarc-btn-secondary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕' : '➕ Log Workout'}
          </button>
        </div>
        
        {/* Current Program Info */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)'
        }}>
          {workoutData.current_schema ? (
            <>
              <h5 style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 'var(--s-2)' }}>
                {workoutData.current_schema.name}
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
                <p style={{ color: 'var(--c-muted)' }}>
                  📅 {workoutData.current_schema.days_per_week} days/week
                </p>
                <p style={{ color: 'var(--c-muted)' }}>
                  🎯 {workoutData.current_schema.primary_goal || 'General Fitness'}
                </p>
                <p style={{ color: 'var(--c-muted)' }}>
                  ⏱️ {workoutData.current_schema.duration || '45-60'} min
                </p>
                <p style={{ color: 'var(--c-muted)' }}>
                  📈 {workoutData.current_schema.difficulty || 'Intermediate'}
                </p>
              </div>
              {workoutData.current_schema.notes && (
                <p style={{ 
                  color: 'var(--c-muted)', 
                  fontSize: 'var(--text-sm)',
                  marginTop: 'var(--s-2)',
                  fontStyle: 'italic'
                }}>
                  💡 {workoutData.current_schema.notes}
                </p>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--s-4)' }}>
              <p style={{ color: 'var(--c-muted)', marginBottom: 'var(--s-2)' }}>No workout program assigned</p>
              <button
                className="myarc-btn myarc-btn-primary"
                onClick={() => onAction('assignWorkout', { clientId: client.id })}
              >
                Assign Workout Program
              </button>
            </div>
          )}
        </div>
        
        {/* Add Workout Completion Form */}
        {showAddForm && workoutData.current_schema && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <h5 style={{ color: '#fff', marginBottom: 'var(--s-2)' }}>Log Workout Completion</h5>
            
            <input
              type="date"
              className="myarc-input"
              value={newCompletion.date}
              onChange={(e) => setNewCompletion({...newCompletion, date: e.target.value})}
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <div style={{ marginBottom: 'var(--s-2)' }}>
              <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: '4px', display: 'block' }}>
                How was the workout? (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newCompletion.rating}
                onChange={(e) => setNewCompletion({...newCompletion, rating: parseInt(e.target.value)})}
                style={{ width: '100%' }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                color: 'var(--c-muted)',
                fontSize: 'var(--text-sm)'
              }}>
                <span>😅 Tough</span>
                <span style={{ fontSize: '1.5rem' }}>{getRatingEmoji(newCompletion.rating)}</span>
                <span>🔥 Amazing</span>
              </div>
            </div>
            
            <textarea
              className="myarc-input"
              placeholder="Notes (optional)"
              value={newCompletion.notes}
              onChange={(e) => setNewCompletion({...newCompletion, notes: e.target.value})}
              rows="3"
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
              <button
                className="myarc-btn myarc-btn-primary"
                onClick={handleSaveCompletion}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Saving...' : 'Save Workout'}
              </button>
              <button
                className="myarc-btn myarc-btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-3)'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Weekly Compliance</p>
            <p style={{ 
              color: getComplianceColor(weeklyCompliance), 
              fontSize: '2rem', 
              fontWeight: 'bold' 
            }}>
              {weeklyCompliance}%
            </p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
              {weeklyWorkouts}/{targetWorkouts} workouts
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Current Streak</p>
            <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {workoutData.streak} 🔥
            </p>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
              days in a row
            </p>
          </div>
        </div>
        
        {/* Recent Completions */}
        {workoutData.completions.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
              Recent Workouts
            </p>
            {workoutData.completions.slice(0, 5).map((completion, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-2)',
                borderBottom: idx < 4 ? '1px solid var(--c-border)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ color: '#fff', fontSize: 'var(--text-sm)' }}>
                    {new Date(completion.date).toLocaleDateString()}
                  </span>
                  {completion.notes && (
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                      {completion.notes}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: '1.2rem' }}>
                  {getRatingEmoji(completion.rating || 5)}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ marginTop: 'var(--s-3)', display: 'flex', gap: 'var(--s-2)' }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={() => onAction('assignWorkout', { clientId: client.id })}
            style={{ flex: 1 }}
          >
            Change Program
          </button>
          <button
            className="myarc-btn myarc-btn-secondary"
            onClick={() => onAction('viewWorkoutHistory', {})}
            style={{ flex: 1 }}
          >
            View History
          </button>
        </div>
      </div>
    )
  }
  
  // Grid/List view - compact display
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Program</p>
        <p style={{ color: '#fff', fontWeight: 'bold' }}>
          {workoutData.current_schema?.name || 'Not assigned'}
        </p>
        {workoutData.current_schema && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: 'var(--s-1)'
          }}>
            <span style={{ 
              color: getComplianceColor(weeklyCompliance),
              fontSize: 'var(--text-sm)'
            }}>
              {weeklyCompliance}% this week
            </span>
            <span style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
              {workoutData.streak}🔥
            </span>
          </div>
        )}
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('assignWorkout', { clientId: client.id })}
        style={{ width: '100%' }}
      >
        {workoutData.current_schema ? 'Update Program' : 'Assign Program'}
      </button>
    </div>
  )
}
