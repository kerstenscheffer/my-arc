// src/modules/client-management/modules/GoalsModule.jsx
// Goals Module voor MY ARC Client Management
// Complete implementatie met alle DatabaseService goal methods

import { useState, useEffect } from 'react'

const GoalsModule = ({ client, data, onAction, viewMode, db }) => {
  const [goals, setGoals] = useState([])
  const [categoryProgress, setCategoryProgress] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [goalForm, setGoalForm] = useState({
    title: '',
    goal_type: 'custom',
    category: 'workout',
    target_value: '',
    target_date: '',
    unit: '',
    notes: ''
  })

  const categories = [
    { id: 'workout', label: 'Workout', icon: '💪', color: '#10b981' },
    { id: 'voeding', label: 'Nutrition', icon: '🥗', color: '#f59e0b' },
    { id: 'herstel', label: 'Recovery', icon: '🧘', color: '#3b82f6' },
    { id: 'mindset', label: 'Mindset', icon: '🧠', color: '#8b5cf6' },
    { id: 'structuur', label: 'Structure', icon: '📋', color: '#6366f1' }
  ]

  useEffect(() => {
    if (client?.id && db) {
      loadGoalsData()
    }
  }, [client])

  const loadGoalsData = async () => {
    if (!client?.id || !db) return
    setLoading(true)
    
    try {
      const [clientGoals, progress] = await Promise.all([
        db.getClientGoalsWithProgress(client.id),
        db.getAllCategoriesProgress(client.id)
      ])
      
      setGoals(clientGoals || [])
      setCategoryProgress(progress || [])
      
      // Update parent data
      if (onAction) {
        onAction('updateData', {
          goals: {
            active: clientGoals?.filter(g => g.status === 'active') || [],
            completed: clientGoals?.filter(g => g.status === 'completed') || [],
            categoryProgress: progress || []
          }
        })
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async () => {
    if (!goalForm.title || !goalForm.target_value) return
    
    try {
      await db.saveGoal({
        client_id: client.id,
        ...goalForm,
        target_value: parseFloat(goalForm.target_value),
        current_value: 0,
        status: 'active'
      })
      
      // Reset form
      setGoalForm({
        title: '',
        goal_type: 'custom',
        category: 'workout',
        target_value: '',
        target_date: '',
        unit: '',
        notes: ''
      })
      
      setShowAddGoal(false)
      await loadGoalsData()
      
      if (onAction) {
        onAction('goalAdded', goalForm)
      }
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      await db.updateGoalProgress(goalId, {
        client_id: client.id,
        value: newValue,
        date: new Date().toISOString().split('T')[0]
      })
      
      await loadGoalsData()
      
      if (onAction) {
        onAction('progressUpdated', { goalId, value: newValue })
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const completeGoal = async (goalId) => {
    try {
      await db.completeGoal(goalId)
      
      // Send achievement notification
      await db.createNotification({
        client_id: client.id,
        type: 'achievement',
        priority: 'normal',
        title: '🎉 Goal Completed!',
        message: 'Congratulations on reaching your goal!',
        action_type: 'goal',
        action_target: goalId,
        action_label: 'View Achievement'
      })
      
      await loadGoalsData()
      
      if (onAction) {
        onAction('goalCompleted', { goalId })
      }
    } catch (error) {
      console.error('Error completing goal:', error)
    }
  }

  // Compact view for dashboard
  if (viewMode === 'compact') {
    const goalsData = data?.goals || {}
    const activeGoals = goalsData.active || []
    const avgProgress = activeGoals.reduce((sum, goal) => {
      const progress = goal.target_value > 0 
        ? (goal.current_value / goal.target_value) * 100 
        : 0
      return sum + Math.min(100, progress)
    }, 0) / (activeGoals.length || 1)
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h4 style={{ color: '#10b981', margin: 0 }}>Goals</h4>
          <button
            onClick={() => onAction && onAction('viewDetails', {})}
            style={{
              padding: '4px 8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            View All
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
              {activeGoals.length}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>Active Goals</div>
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
            <div style={{ 
              color: avgProgress >= 70 ? '#10b981' : avgProgress >= 40 ? '#f59e0b' : '#ef4444',
              fontSize: '20px', 
              fontWeight: 'bold' 
            }}>
              {Math.round(avgProgress)}%
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>Avg Progress</div>
          </div>
        </div>
        
        {/* Category Progress Mini */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {categoryProgress.slice(0, 5).map(cat => (
            <div
              key={cat.category}
              style={{
                flex: 1,
                height: '6px',
                background: '#374151',
                borderRadius: '3px',
                overflow: 'hidden'
              }}
              title={`${cat.category}: ${cat.averageProgress}%`}
            >
              <div style={{
                height: '100%',
                width: `${cat.averageProgress}%`,
                background: '#10b981'
              }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Focus view for detailed management
  if (viewMode === 'focus') {
    const filteredGoals = selectedCategory === 'all' 
      ? goals 
      : goals.filter(g => g.main_category === selectedCategory || g.category === selectedCategory)
    
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h4 style={{ color: '#10b981', margin: 0 }}>Goals Management</h4>
          <button
            onClick={() => setShowAddGoal(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Add Goal
          </button>
        </div>

        {/* Category Progress Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {categoryProgress.map(cat => {
            const categoryInfo = categories.find(c => c.id === cat.category) || {}
            return (
              <div
                key={cat.category}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedCategory === cat.category ? '2px solid #10b981' : '1px solid #374151'
                }}
                onClick={() => setSelectedCategory(cat.category)}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {categoryInfo.icon}
                </div>
                <div style={{ 
                  color: cat.averageProgress >= 70 ? '#10b981' : '#f59e0b',
                  fontSize: '18px', 
                  fontWeight: 'bold' 
                }}>
                  {cat.averageProgress}%
                </div>
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                  {cat.totalGoals} goals
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 12px',
              background: selectedCategory === 'all' ? '#10b981' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            All ({goals.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 12px',
                background: selectedCategory === cat.id ? cat.color : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>
            Active Goals ({filteredGoals.filter(g => g.status === 'active').length})
          </h5>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              Loading...
            </div>
          ) : filteredGoals.length === 0 ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '32px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
              <p>No goals in this category</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredGoals
                .filter(g => g.status === 'active')
                .map(goal => {
                  const progress = goal.target_value > 0 
                    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                    : 0
                  const categoryInfo = categories.find(c => c.id === goal.category) || {}
                  
                  return (
                    <div
                      key={goal.id}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '16px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontSize: '24px' }}>{categoryInfo.icon}</div>
                          <div>
                            <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>
                              {goal.title}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                              Target: {goal.target_value} {goal.unit} by {
                                goal.target_date 
                                  ? new Date(goal.target_date).toLocaleDateString('nl-NL')
                                  : 'No deadline'
                              }
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            color: progress >= 70 ? '#10b981' : progress >= 40 ? '#f59e0b' : '#ef4444',
                            fontSize: '20px', 
                            fontWeight: 'bold' 
                          }}>
                            {Math.round(progress)}%
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                            {goal.current_value}/{goal.target_value} {goal.unit}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{
                        height: '8px',
                        background: '#374151',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${categoryInfo.color}, ${categoryInfo.color}dd)`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Update value"
                          style={{
                            flex: 1,
                            padding: '6px',
                            background: '#1e293b',
                            color: 'white',
                            border: '1px solid #374151',
                            borderRadius: '4px'
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value) {
                              updateGoalProgress(goal.id, parseFloat(e.target.value))
                              e.target.value = ''
                            }
                          }}
                        />
                        {progress >= 100 && (
                          <button
                            onClick={() => completeGoal(goal.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Complete ✓
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Add Goal Modal */}
        {showAddGoal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0f172a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ color: '#f3f4f6', marginBottom: '20px' }}>Add New Goal</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e293b',
                      color: 'white',
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e293b',
                      color: 'white',
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={goalForm.target_value}
                      onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1e293b',
                        color: 'white',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
                      Unit
                    </label>
                    <input
                      type="text"
                      value={goalForm.unit}
                      onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                      placeholder="kg, reps, etc"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#1e293b',
                        color: 'white',
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#1e293b',
                      color: 'white',
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    onClick={handleAddGoal}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Add Goal
                  </button>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#374151',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default list view
  const activeGoals = goals.filter(g => g.status === 'active')
  
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Goals</h4>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#9ca3af' }}>Active: </span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            {activeGoals.length} goals
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Completed: </span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            {goals.filter(g => g.status === 'completed').length}
          </span>
        </div>
      </div>
      
      {/* Quick Progress Bars */}
      {activeGoals.slice(0, 3).map(goal => {
        const progress = goal.target_value > 0 
          ? Math.min(100, (goal.current_value / goal.target_value) * 100)
          : 0
        
        return (
          <div key={goal.id} style={{ marginBottom: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '12px'
            }}>
              <span style={{ color: '#d1d5db' }}>{goal.title}</span>
              <span style={{ color: '#10b981' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{
              height: '4px',
              background: '#374151',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: '#10b981'
              }} />
            </div>
          </div>
        )
      })}
      
      <button
        onClick={() => onAction && onAction('viewDetails', {})}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          width: '100%',
          marginTop: '12px'
        }}
      >
        Manage All Goals
      </button>
    </div>
  )
}

export default GoalsModule;
