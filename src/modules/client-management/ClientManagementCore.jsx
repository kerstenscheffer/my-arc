import { useState, useEffect, useCallback, useMemo } from 'react'

// Assignment Modals - BEHOUD de oude voor Workout en Bulk
import {
  WorkoutSchemaAssignmentModal,
  // MealPlanAssignmentModal, // ← VERWIJDER/COMMENT DIT
  BulkActionsModal
} from "./AssignmentModals";

// NIEUWE IMPORT voor Meal Plan Generator
import { MealPlanGenerator } from "./MealPlanGenerator";

// Progress en Export blijven hetzelfde
import {
  ProgressCharts,
  ExportManager
} from "./ProgressChartsExport";




// ===== PROGRESS MODULE - FIXED =====
const ProgressModule = ({ client, data, onAction, viewMode, db }) => {
  const [newWeight, setNewWeight] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  
  const latestMeasurement = data?.measurements?.[0] || null
  const previousMeasurement = data?.measurements?.[1] || null
  
  const calculateChange = (current, previous) => {
    if (!current || !previous) return null
    const change = current - previous
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0
    }
  }
  
  const weightChange = latestMeasurement && previousMeasurement 
    ? calculateChange(latestMeasurement.weight, previousMeasurement.weight)
    : null
  
  if (viewMode === 'focus') {
    return (
      <div>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>Progress Tracking</h4>
          <button
            className="myarc-btn myarc-btn-sm myarc-btn-secondary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕' : '➕'}
          </button>
        </div>
        
        {showAddForm && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <input
              className="myarc-input"
              type="number"
              placeholder="Weight (kg)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              style={{ marginBottom: 'var(--s-2)' }}
            />
            <button
              className="myarc-btn myarc-btn-primary myarc-btn-sm"
              onClick={async () => {
                if (newWeight) {
                  await onAction('saveProgress', { 
                    client_id: client.id,
                    weight: parseFloat(newWeight),
                    date: new Date().toISOString()
                  })
                  setNewWeight('')
                  setShowAddForm(false)
                }
              }}
            >
              Save Progress
            </button>
          </div>
        )}
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-3)'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Current Weight</p>
            <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {latestMeasurement?.weight || '—'} <span style={{ fontSize: '1rem' }}>kg</span>
            </p>
            {weightChange && (
              <p style={{ 
                color: weightChange.isPositive ? '#ef4444' : '#10b981',
                fontSize: 'var(--text-sm)'
              }}>
                {weightChange.isPositive ? '↑' : '↓'} {weightChange.value} kg
              </p>
            )}
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Body Fat %</p>
            <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {latestMeasurement?.body_fat || '—'}<span style={{ fontSize: '1rem' }}>%</span>
            </p>
          </div>
        </div>
        
        {data?.measurements && data.measurements.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
              Recent Measurements
            </p>
            {data.measurements.slice(0, 5).map((measurement, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-2)',
                borderBottom: idx < 4 ? '1px solid var(--c-border)' : 'none',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                  {new Date(measurement.date).toLocaleDateString()}
                </span>
                <span style={{ color: '#fff' }}>{measurement.weight} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Weight</p>
        <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {latestMeasurement?.weight || '—'} kg
        </p>
        {weightChange && (
          <p style={{ 
            color: weightChange.isPositive ? '#ef4444' : '#10b981',
            fontSize: 'var(--text-xs)'
          }}>
            {weightChange.isPositive ? '↑' : '↓'} {weightChange.value}
          </p>
        )}
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('viewProgress', {})}
        style={{ width: '100%' }}
      >
        Update Progress
      </button>
    </div>
  )
}

// ===== MEAL TRACKING MODULE - FIXED =====
const MealTrackingModule = ({ client, data, onAction, viewMode, db }) => {
  // Safe data access with fallbacks
  const mealCompliance = data?.compliance || {
    average: 0,
    kcal_compliance: 0,
    protein_compliance: 0,
    current_streak: 0
  }
  
  const hasPlan = data?.plan !== null
  
  const getComplianceColor = (value) => {
    if (value >= 80) return '#10b981'
    if (value >= 60) return '#3b82f6'
    if (value >= 40) return '#f59e0b'
    return '#ef4444'
  }
  
  if (viewMode === 'focus') {
    return (
      <div>
        <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>Meal Tracking</h4>
        
        {!hasPlan ? (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: 'var(--s-4)',
            textAlign: 'center',
            marginBottom: 'var(--s-3)'
          }}>
            <p style={{ color: '#f59e0b', fontSize: '2rem', marginBottom: 'var(--s-2)' }}>⚠️</p>
            <p style={{ color: '#fff', marginBottom: 'var(--s-2)' }}>No meal plan assigned yet</p>
            <button
              className="myarc-btn myarc-btn-primary"
              onClick={() => onAction('assignMealPlan', {})}
            >
              Assign Meal Plan
            </button>
          </div>
        ) : (
          <>
            <div style={{
              background: `linear-gradient(135deg, ${getComplianceColor(mealCompliance.average)}20, transparent)`,
              borderRadius: '12px',
              padding: 'var(--s-4)',
              marginBottom: 'var(--s-4)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Overall Compliance</p>
              <p style={{ 
                color: getComplianceColor(mealCompliance.average), 
                fontSize: '3rem', 
                fontWeight: 'bold',
                margin: 'var(--s-2) 0'
              }}>
                {mealCompliance.average}%
              </p>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                🔥 {mealCompliance.current_streak} day streak
              </p>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--s-3)'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: 'var(--s-3)',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Calories</p>
                <p style={{ 
                  color: getComplianceColor(mealCompliance.kcal_compliance),
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {mealCompliance.kcal_compliance}%
                </p>
              </div>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: 'var(--s-3)',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Protein</p>
                <p style={{ 
                  color: getComplianceColor(mealCompliance.protein_compliance),
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  {mealCompliance.protein_compliance}%
                </p>
              </div>
            </div>
          </>
        )}
        
        <div style={{ marginTop: 'var(--s-3)' }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={() => onAction('viewMealPlan', {})}
            style={{ width: '100%' }}
          >
            {hasPlan ? 'Edit Meal Plan' : 'Create Meal Plan'}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Compliance</p>
        <p style={{ 
          color: getComplianceColor(mealCompliance.average),
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {mealCompliance.average}%
        </p>
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('manageMeals', {})}
        style={{ width: '100%' }}
      >
        Manage Meals
      </button>
    </div>
  )
}

// ===== WORKOUT MODULE - FIXED =====
const WorkoutModule = ({ client, data, onAction, viewMode, db }) => {
  const [loading, setLoading] = useState(false)
  
  const workoutData = {
    current_schema: data?.current_schema || null,
    compliance: data?.compliance || 0,
    progress: data?.progress || []
  }
  
  const weeklyWorkouts = workoutData.progress.filter(p => {
    const date = new Date(p.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date > weekAgo
  }).length
  
  if (viewMode === 'focus') {
    return (
      <div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Current Program</h4>
          {workoutData.current_schema ? (
            <div>
              <p style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {workoutData.current_schema.name}
              </p>
              <p style={{ color: 'var(--c-muted)' }}>
                {workoutData.current_schema.days_per_week || 3} days/week • {workoutData.current_schema.primary_goal || 'General Fitness'}
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--c-muted)' }}>No workout assigned</p>
          )}
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-3)'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Compliance</p>
            <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {workoutData.compliance}%
            </p>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>This Week</p>
            <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
              {weeklyWorkouts}
            </p>
          </div>
        </div>
        
        <button
          className="myarc-btn myarc-btn-primary"
          onClick={() => onAction('assignWorkout', { clientId: client.id })}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Assigning...' : '💪 Update Workout Program'}
        </button>
      </div>
    )
  }
  
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
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('assignWorkout', { clientId: client.id })}
        style={{ width: '100%' }}
      >
        Update Program
      </button>
    </div>
  )
}

// ===== GOALS MODULE - FIXED =====
const GoalsModule = ({ client, data, onAction, viewMode }) => {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({ 
    goal_type: '', 
    target_value: '', 
    target_date: '' 
  })
  
  const goals = Array.isArray(data) ? data : []
  
  const getGoalColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981'
      case 'active': return '#3b82f6'
      case 'planned': return '#f59e0b'
      default: return '#6b7280'
    }
  }
  
  if (viewMode === 'focus') {
    return (
      <div>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>Active Goals ({goals.length})</h4>
          <button
            className="myarc-btn myarc-btn-sm myarc-btn-secondary"
            onClick={() => setShowAddGoal(!showAddGoal)}
          >
            {showAddGoal ? '✕' : '➕'}
          </button>
        </div>
        
        {showAddGoal && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <input
              className="myarc-input"
              placeholder="Goal type (e.g., weight_loss)"
              value={newGoal.goal_type}
              onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
              style={{ marginBottom: 'var(--s-2)' }}
            />
            <input
              className="myarc-input"
              type="number"
              placeholder="Target value"
              value={newGoal.target_value}
              onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
              style={{ marginBottom: 'var(--s-2)' }}
            />
<input
  type="number"
  placeholder="Start value"
  value={newGoal.start_value}
  onChange={(e) => setNewGoal({...newGoal, start_value: parseFloat(e.target.value) || 0})}
/>

            <button
              className="myarc-btn myarc-btn-primary myarc-btn-sm"
              onClick={() => {
                onAction('addGoal', {
                  client_id: client.id,
                  ...newGoal
                })
                setNewGoal({ goal_type: '', target_value: '', target_date: '' })
                setShowAddGoal(false)
              }}
            >
              Add Goal
            </button>
          </div>
        )}
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {goals.length > 0 ? (
            goals.map((goal, idx) => (
              <div key={idx} style={{
                background: 'rgba(0,0,0,0.3)',
                borderLeft: `4px solid ${getGoalColor(goal.status)}`,
                borderRadius: '8px',
                padding: 'var(--s-3)',
                marginBottom: 'var(--s-2)'
              }}>
                <div className="myarc-flex myarc-justify-between myarc-items-start">
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>
                      {goal.goal_type || 'Unnamed Goal'}
                    </p>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                      Target: {goal.target_value || 'Not set'}
                    </p>
                    {goal.target_date && (
                      <p style={{ 
                        color: getGoalColor(goal.status), 
                        fontSize: 'var(--text-sm)', 
                        marginTop: 'var(--s-1)' 
                      }}>
                        📅 {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                    onClick={() => onAction('updateGoalStatus', { 
                      goalId: goal.id,
                      status: goal.status === 'completed' ? 'active' : 'completed'
                    })}
                  >
                    {goal.status === 'completed' ? '✓' : '○'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--c-muted)', textAlign: 'center' }}>No goals set yet</p>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div style={{ marginBottom: 'var(--s-3)' }}>
        {goals.filter(g => g.status === 'active').slice(0, 2).map((goal, idx) => (
          <div key={idx} style={{
            padding: 'var(--s-2)',
            borderLeft: `3px solid ${getGoalColor(goal.status)}`,
            marginBottom: 'var(--s-1)'
          }}>
            <p style={{ color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
              {goal.goal_type}
            </p>
            {goal.target_date && (
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                {new Date(goal.target_date).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
        {goals.length === 0 && (
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
            No goals yet
          </p>
        )}
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('viewAllGoals', {})}
        style={{ width: '100%' }}
      >
        Manage Goals
      </button>
    </div>
  )
}

// ===== COMMUNICATION MODULE - FIXED =====
const CommunicationModule = ({ client, data, onAction, viewMode }) => {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const messages = Array.isArray(data) ? data : []
  const lastMessage = messages[0]
  
  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await onAction('sendMessage', { message })
      setMessage('')
      alert('✅ Message sent!')
    } catch (error) {
      alert('❌ Failed to send message')
    } finally {
      setSending(false)
    }
  }
  
  if (viewMode === 'focus') {
    return (
      <div>
        <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>
          Communication ({messages.length} messages)
        </h4>
        
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)',
          marginBottom: 'var(--s-3)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {messages.length > 0 ? (
            messages.slice(0, 5).map((msg, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-2)',
                borderBottom: idx < 4 ? '1px solid var(--c-border)' : 'none'
              }}>
                <p style={{ color: '#fff', fontSize: 'var(--text-sm)' }}>{msg.message}</p>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--c-muted)', textAlign: 'center' }}>No messages yet</p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
          <input
            className="myarc-input"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1 }}
          />
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={handleSend}
            disabled={sending || !message.trim()}
          >
            {sending ? '...' : '📨'}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Last Contact</p>
        <p style={{ color: '#fff', fontWeight: 'bold' }}>
          {lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : 'Never'}
        </p>
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('openChat', {})}
        style={{ width: '100%' }}
      >
        Send Message
      </button>
    </div>
  )
}

// ===== MODULE REGISTRY =====
class ModuleRegistry {
  constructor() {
    this.modules = new Map()
    this.dataCache = new Map()
  }

  register(moduleConfig) {
    if (!moduleConfig.id || !moduleConfig.component) {
      console.error('Module must have id and component')
      return
    }
    
    this.modules.set(moduleConfig.id, {
      ...moduleConfig,
      enabled: moduleConfig.enabled !== false
    })
  }

  getActiveModules() {
    return Array.from(this.modules.values())
      .filter(m => m.enabled)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
  }

  cacheData(key, data) {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  getCachedData(key, maxAge = 60000) {
    const cached = this.dataCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > maxAge) {
      this.dataCache.delete(key)
      return null
    }
    
    return cached.data
  }
}

const registry = new ModuleRegistry()

// Register all modules
registry.register({
  id: 'progress',
  name: 'Voortgang',
  icon: '📈',
  component: ProgressModule,
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientProgress(clientId)
      return data || { measurements: [] }
    } catch (error) {
      console.error('Progress module error:', error)
      return { measurements: [] }
    }
  },
  priority: 1
})

registry.register({
  id: 'meals',
  name: 'Meal Plans',
  icon: '🍽️',
  component: MealTrackingModule,
  dataSource: async (db, clientId) => {
    try {
      const [compliance, plan] = await Promise.all([
        db.getMealCompliance(clientId, 30),
        db.getClientMealPlan(clientId)
      ])
      return { compliance, plan }
    } catch (error) {
      console.error('Meals module error:', error)
      return { 
        compliance: {
          average: 0,
          kcal_compliance: 0,
          protein_compliance: 0,
          current_streak: 0
        }, 
        plan: null 
      }
    }
  },
  priority: 2
})

registry.register({
  id: 'workouts',
  name: 'Training',
  icon: '💪',
  component: WorkoutModule,
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientWorkoutData(clientId)
      return data || { current_schema: null, progress: [], compliance: 0 }
    } catch (error) {
      console.error('Workouts module error:', error)
      return { current_schema: null, progress: [], compliance: 0 }
    }
  },
  priority: 3
})

registry.register({
  id: 'goals',
  name: 'Doelen',
  icon: '🎯',
  component: GoalsModule,
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientGoals(clientId)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Goals module error:', error)
      return []
    }
  },
  priority: 4
})

registry.register({
  id: 'communication',
  name: 'Berichten',
  icon: '💬',
  component: CommunicationModule,
  dataSource: async (db, clientId) => {
    try {
      const data = await db.getClientMessages(clientId)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Communication module error:', error)
      return []
    }
  },
  priority: 5
})

// ===== MAIN COMPONENT =====
export default function ClientManagementCore({ db }) {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [activeModules, setActiveModules] = useState([])
  const [moduleData, setModuleData] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
// ⬇️ NIEUWE STATE VOOR MODALS EN FEATURES
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showExport, setShowExport] = useState(false)
  
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    loadInitialData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientData(selectedClient.id)
    }
  }, [selectedClient, refreshTrigger])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      const clientsData = await db.getClients(user?.id)
      setClients(clientsData || [])
      setActiveModules(registry.getActiveModules())
      
      if (clientsData && clientsData.length > 0 && !selectedClient) {
        setSelectedClient(clientsData[0])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId) => {
    const modules = registry.getActiveModules()
    const newModuleData = {}
    
    for (const module of modules) {
      try {
        if (module.dataSource) {
          const cached = registry.getCachedData(`${module.id}_${clientId}`)
          if (cached) {
            newModuleData[module.id] = cached
          } else {
            const data = await module.dataSource(db, clientId)
            newModuleData[module.id] = data
            registry.cacheData(`${module.id}_${clientId}`, data)
          }
        }
      } catch (error) {
        console.error(`Failed to load ${module.id} data:`, error)
        newModuleData[module.id] = null
      }
    }
    
    setModuleData(newModuleData)
  }

  const filteredClients = useMemo(() => {
    let filtered = clients || []
    
    if (searchQuery) {
      filtered = filtered.filter(client => {
        const search = searchQuery.toLowerCase()
        return (
          client.first_name?.toLowerCase().includes(search) ||
          client.last_name?.toLowerCase().includes(search) ||
          client.email?.toLowerCase().includes(search)
        )
      })
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        if (filterStatus === 'active') return client.status === 'active'
        if (filterStatus === 'inactive') return client.status !== 'active'
        if (filterStatus === 'new') {
          const created = new Date(client.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return created > weekAgo
        }
        return true
      })
    }
    
    return filtered
  }, [clients, searchQuery, filterStatus])

const handleModuleAction = async (moduleId, action, params) => {
  try {
    console.log(`Action: ${moduleId}.${action}`, params)

    switch(action) {
      case 'sendMessage':
        if (params.message && selectedClient) {
          await db.sendNotification(selectedClient.id, 'coach_message', params.message)
          alert('✅ Message sent!')
          setRefreshTrigger(prev => prev + 1)
        }
        break

      case 'saveProgress':
        if (params && selectedClient) {
          await db.saveProgress(params)
          alert('✅ Progress saved!')
          setRefreshTrigger(prev => prev + 1)
        }
        break
      
      case 'addGoal':
        if (params && selectedClient) {
          await db.saveGoal(params)
          alert('✅ Goal added!')
          setRefreshTrigger(prev => prev + 1)
        }
        break
      
      case 'updateGoalStatus':
        if (params.goalId) {
          await db.updateGoalStatus(params.goalId, params.status)
          alert('✅ Goal updated!')
          setRefreshTrigger(prev => prev + 1)
        }
        break

      case 'assignWorkout':
        setShowWorkoutModal(true)
        break
        
      case 'assignMealPlan':
      case 'manageMeals':
        setShowMealModal(true)
        break
      
      case 'viewProgress':
        setShowCharts(!showCharts) // Toggle charts on/off
        break
      
      case 'viewAllGoals':
        // Hier kun je een goals modal openen of navigeren
        console.log('View all goals for client:', selectedClient?.id)
        break
      
      case 'openChat':
        // Hier kun je een chat modal openen
        console.log('Open chat for client:', selectedClient?.id)
        break
      
      case 'assignContent':
        if (params.url) {
          console.log('Assign content:', params.url)
          alert('📹 Content assignment coming soon!')
        }
        break
      
      case 'viewDetails':
        // Voor analytics module
        console.log('View analytics details')
        break
        
      default:
        console.log('Unknown action:', action)
    }
  } catch (error) {
    console.error(`Module action failed:`, error)
    alert(`❌ Action failed: ${error.message}`)
  }
}







  const getClientHealth = (client) => {
    const mealCompliance = moduleData.meals?.compliance?.average || 0
    const workoutCompliance = moduleData.workouts?.compliance || 0
    const hasGoals = moduleData.goals?.length > 0 ? 50 : 0
    
    const healthScore = Math.round((mealCompliance + workoutCompliance + hasGoals) / 3)
    
    return {
      score: Math.min(100, Math.max(0, healthScore)),
      status: healthScore >= 80 ? 'excellent' : 
              healthScore >= 60 ? 'good' : 
              healthScore >= 40 ? 'fair' : 'poor'
    }
  }

  const renderClientSelector = () => (
    <div className="myarc-card" style={{ 
      marginBottom: 'var(--s-6)',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      <div className="myarc-card-header" style={{
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <h3 className="myarc-card-title" style={{ color: '#10b981' }}>
          👥 Clients ({filteredClients.length})
        </h3>
        
        <div className="myarc-flex myarc-gap-sm">
          {['grid', 'list', 'focus'].map(mode => (
            <button 
              key={mode}
              className={`myarc-btn ${viewMode === mode ? 'myarc-btn-primary' : 'myarc-btn-ghost'}`}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '8px 12px',
                fontSize: '0.9rem'
              }}
            >
              {mode === 'grid' ? '⊞' : mode === 'list' ? '☰' : '◉'}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 'var(--s-4)' }}>
        <div className="myarc-flex myarc-gap-md" style={{ marginBottom: 'var(--s-4)' }}>
          <input
            className="myarc-input"
            type="text"
            placeholder="🔍 Zoek client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
          
          <select
            className="myarc-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <option value="all">Alle</option>
            <option value="active">Actief</option>
            <option value="new">Nieuw</option>
          </select>
        </div>
        
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
          flexDirection: 'column',
          gap: 'var(--s-3)',
          maxHeight: '500px',
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {filteredClients.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--s-6)',
              color: 'var(--c-muted)'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: 'var(--s-3)' }}>🔍</p>
              <p>Geen clients gevonden</p>
            </div>
          ) : (
            filteredClients.map(client => {
              const isSelected = selectedClient?.id === client.id
              const clientHealth = selectedClient?.id === client.id ? getClientHealth(client) : null
              
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: 'var(--s-3)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#10b981' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="myarc-flex myarc-justify-between myarc-items-center">
                    <div>
                      <p style={{ 
                        color: '#fff', 
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        marginBottom: '4px'
                      }}>
                        {client.first_name} {client.last_name}
                      </p>
                      <p style={{ 
                        color: 'var(--c-muted)', 
                        fontSize: 'var(--text-sm)' 
                      }}>
                        {client.email}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      {isSelected && clientHealth && (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: `conic-gradient(
                            #10b981 ${clientHealth.score * 3.6}deg,
                            #374151 0deg
                          )`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0f0f0f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {clientHealth.score}
                          </div>
                        </div>
                      )}
                      {!isSelected && (
                        <div 
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: client.status === 'active' ? '#10b981' : '#6b7280'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const renderModuleGrid = () => {
    if (!selectedClient) {
      return (
        <div className="myarc-card" style={{ 
          textAlign: 'center', 
          padding: 'var(--s-8)',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <p style={{ fontSize: '4rem', marginBottom: 'var(--s-3)' }}>👈</p>
          <h3 style={{ color: 'var(--c-muted)' }}>Selecteer een client om te beginnen</h3>
        </div>
      )
    }
    
    const health = getClientHealth(selectedClient)
    
    return (
      <div className="myarc-card" style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div className="myarc-card-header" style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          padding: 'var(--s-5)'
        }}>
          <div className="myarc-flex myarc-justify-between myarc-items-center">
            <div>
              <h2 className="myarc-card-title" style={{
                fontSize: '1.8rem',
                background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px'
              }}>
                {selectedClient.first_name} {selectedClient.last_name}
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>{selectedClient.email}</p>
              {selectedClient.goal && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  🎯 {selectedClient.goal}
                </span>
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${health.status === 'excellent' ? '#10b981' :
                    health.status === 'good' ? '#3b82f6' :
                    health.status === 'fair' ? '#f59e0b' : '#ef4444'} ${health.score * 3.6}deg,
                  #374151 0deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#0f0f0f',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {health.score}%
                  </span>
                  <span style={{ color: 'var(--c-muted)', fontSize: '0.7rem' }}>
                    Health
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="myarc-flex myarc-gap-sm" style={{ marginTop: 'var(--s-4)' }}>
            <button
              className="myarc-btn myarc-btn-sm"
              onClick={() => handleModuleAction('communication', 'sendMessage', { 
                message: 'Hi! How are you doing today?' 
              })}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#fff'
              }}
            >
              📨 Quick Message
            </button>
            <button
              className="myarc-btn myarc-btn-sm myarc-btn-ghost"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div style={{
          padding: 'var(--s-5)',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 
            viewMode === 'focus' ? '1fr' : 
            'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--s-4)'
        }}>
          {activeModules.map((module, idx) => {
            const ModuleComponent = module.component
            
            return (
              <div
                key={module.id}
                className="myarc-module-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
                  borderRadius: '16px',
                  padding: 'var(--s-4)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  minHeight: viewMode === 'focus' ? '400px' : '220px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--s-2)'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{module.icon}</span>
                    {module.name}
                  </h3>
                </div>
                
                <ModuleComponent
                  client={selectedClient}
                  data={moduleData[module.id]}
                  onAction={(action, params) => handleModuleAction(module.id, action, params)}
                  viewMode={viewMode}
                  db={db}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ 
        padding: 'var(--s-8)', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 'var(--s-4)'
        }} />
        <h2 style={{ color: '#fff' }}>Loading Client Management System...</h2>
      </div>
    )
  }

  return (
    <div className="myarc-client-management">
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
        gap: 'var(--s-6)'
      }}>
        {renderClientSelector()}
        {renderModuleGrid()}
      </div>
   
     
      {/* Workout Assignment Modal */}
      {showWorkoutModal && selectedClient && (
        <WorkoutSchemaAssignmentModal
          client={selectedClient}
          isOpen={showWorkoutModal}
          onClose={(success) => {
            setShowWorkoutModal(false)
            if (success) {
              // Refresh de data als assignment succesvol was
              loadClientData(selectedClient.id)
            }
          }}
          db={db}
        />
      )}
      
      {/* Meal Plan Assignment Modal */}
{/* Nieuwe code - GEBRUIK DIT */}
{showMealModal && selectedClient && (
  <MealPlanGenerator
    client={selectedClient}
    isOpen={showMealModal}
    onClose={(success) => {
      setShowMealModal(false)
      if (success) {
        loadClientData(selectedClient.id)
      }
    }}
    db={db}
  />
)}

      
      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <BulkActionsModal
          clients={filteredClients}
          isOpen={showBulkModal}
          onClose={(success) => {
            setShowBulkModal(false)
            if (success) {
              loadInitialData() // Refresh alle clients
            }
          }}
          db={db}
        />
      )}
      
      {/* Progress Charts - Dit is geen modal maar een sectie */}
      {showCharts && selectedClient && (
        <div style={{ 
          marginTop: 'var(--s-6)',
          animation: 'slideIn 0.5s ease'
        }}>
          <ProgressCharts client={selectedClient} db={db} />
        </div>
      )}
      
      {/* Export Manager - Ook een sectie, geen modal */}
      {showExport && (
        <div style={{ 
          marginTop: 'var(--s-6)',
          animation: 'slideIn 0.5s ease'
        }}>
          <ExportManager clients={filteredClients} db={db} />
        </div>
      )}
      
 </div>
  )
}
