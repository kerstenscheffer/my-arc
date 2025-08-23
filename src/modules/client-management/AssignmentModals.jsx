import { useState, useEffect } from 'react'

// ===== WORKOUT SCHEMA ASSIGNMENT MODAL =====
export const WorkoutSchemaAssignmentModal = ({ client, isOpen, onClose, db }) => {
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      loadSchemas()
    }
  }, [isOpen])
  
  const loadSchemas = async () => {
    try {
      const user = await db.getCurrentUser()
      const data = await db.getWorkoutSchemas(user?.id)
      setSchemas(data || [])
      
      // Pre-select current schema
      if (client.assigned_schema_id) {
        const current = data.find(s => s.id === client.assigned_schema_id)
        if (current) setSelectedSchema(current)
      }
    } catch (error) {
      console.error('Failed to load schemas:', error)
    }
  }
  
  const handleAssign = async () => {
    if (!selectedSchema) return
    
    setLoading(true)
    try {
      await db.assignWorkoutToClient(client.id, selectedSchema.id)
      alert('✅ Workout schema assigned successfully!')
      onClose(true) // Pass true to indicate success
    } catch (error) {
      alert('❌ Failed to assign workout schema')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
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
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s-5)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '1.5rem',
                marginBottom: '8px'
              }}>
                💪 Assign Workout Schema
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>
                Assign a training program to {client.first_name} {client.last_name}
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--s-5)'
        }}>
          {previewMode && selectedSchema ? (
            // Preview Mode
            <div>
              <button
                onClick={() => setPreviewMode(false)}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  marginBottom: 'var(--s-4)',
                  cursor: 'pointer'
                }}
              >
                ← Back to selection
              </button>
              
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '12px',
                padding: 'var(--s-4)',
                marginBottom: 'var(--s-4)'
              }}>
                <h3 style={{ color: '#3b82f6', marginBottom: 'var(--s-3)' }}>
                  {selectedSchema.name}
                </h3>
                <p style={{ color: 'var(--c-muted)', marginBottom: 'var(--s-3)' }}>
                  {selectedSchema.description}
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--s-3)',
                  marginTop: 'var(--s-4)'
                }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: 'var(--s-3)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Goal</p>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>
                      {selectedSchema.primary_goal}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: 'var(--s-3)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Days/Week</p>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>
                      {selectedSchema.days_per_week}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: 'var(--s-3)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Split</p>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>
                      {selectedSchema.split_name || selectedSchema.split_type}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: 'var(--s-3)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Level</p>
                    <p style={{ color: '#fff', fontWeight: 'bold' }}>
                      {selectedSchema.experience_level}
                    </p>
                  </div>
                </div>
                
                {/* Week Structure Preview */}
                {selectedSchema.week_structure && (
                  <div style={{ marginTop: 'var(--s-4)' }}>
                    <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>Week Structure</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                      {Object.entries(selectedSchema.week_structure).map(([day, data]) => (
                        <div key={day} style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: 'var(--s-3)',
                          borderRadius: '8px',
                          borderLeft: '3px solid #3b82f6'
                        }}>
                          <p style={{ color: '#fff', fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {day}
                          </p>
                          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                            {data.focus || 'Rest Day'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Selection Mode
            <div>
              <div style={{
                display: 'grid',
                gap: 'var(--s-3)'
              }}>
                {schemas.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--s-6)',
                    color: 'var(--c-muted)'
                  }}>
                    <p style={{ fontSize: '3rem', marginBottom: 'var(--s-3)' }}>💪</p>
                    <p>No workout schemas found. Create one first!</p>
                  </div>
                ) : (
                  schemas.map(schema => {
                    const isSelected = selectedSchema?.id === schema.id
                    const isCurrent = client.assigned_schema_id === schema.id
                    
                    return (
                      <div
                        key={schema.id}
                        onClick={() => setSelectedSchema(schema)}
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)'
                            : 'rgba(0,0,0,0.3)',
                          border: `2px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
                          borderRadius: '12px',
                          padding: 'var(--s-4)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                      >
                        {isCurrent && (
                          <span style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: '#10b981',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: 'var(--text-xs)'
                          }}>
                            Currently Assigned
                          </span>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#fff', marginBottom: '8px' }}>
                              {schema.name}
                            </h3>
                            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-3)' }}>
                              {schema.description}
                            </p>
                            
                            <div style={{ display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                              <span style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: 'var(--text-sm)'
                              }}>
                                {schema.primary_goal}
                              </span>
                              <span style={{
                                background: 'rgba(139, 92, 246, 0.2)',
                                color: '#8b5cf6',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: 'var(--text-sm)'
                              }}>
                                {schema.days_per_week} days/week
                              </span>
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: 'var(--text-sm)'
                              }}>
                                {schema.experience_level}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSchema(schema)
                              setPreviewMode(true)
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid #3b82f6',
                              color: '#3b82f6',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              marginLeft: 'var(--s-3)'
                            }}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: 'var(--s-5)',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
            {selectedSchema ? `Selected: ${selectedSchema.name}` : 'No schema selected'}
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--c-border)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedSchema || loading}
              style={{
                background: selectedSchema 
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : 'rgba(59, 130, 246, 0.2)',
                border: 'none',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: selectedSchema ? 'pointer' : 'not-allowed',
                opacity: selectedSchema ? 1 : 0.5
              }}
            >
              {loading ? 'Assigning...' : 'Assign Workout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MEAL PLAN ASSIGNMENT MODAL =====
export const MealPlanAssignmentModal = ({ client, isOpen, onClose, db }) => {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customSettings, setCustomSettings] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
    meals_per_day: 3,
    coach_notes: '',
    coach_video_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('templates') // templates | custom | current
  
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      loadCurrentPlan()
    }
  }, [isOpen])
  
  const loadTemplates = async () => {
    try {
      const data = await db.getMealPlanTemplates()
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }
  
  const loadCurrentPlan = async () => {
    try {
      const plan = await db.getClientMealPlan(client.id)
      if (plan) {
        setCustomSettings({
          calories: plan.targets?.kcal || 2000,
          protein: plan.targets?.protein || 150,
          carbs: plan.targets?.carbs || 200,
          fat: plan.targets?.fat || 67,
          meals_per_day: plan.meals_per_day || 3,
          coach_notes: plan.coach_notes || '',
          coach_video_url: plan.coach_video_url || ''
        })
      }
    } catch (error) {
      console.error('Failed to load current plan:', error)
    }
  }
  
  const handleAssign = async () => {
    setLoading(true)
    try {
      const planData = {
        template_id: selectedTemplate?.id || null,
        title: selectedTemplate ? selectedTemplate.name : `Custom Plan - ${client.first_name}`,
        targets: {
          kcal: customSettings.calories,
          protein: customSettings.protein,
          carbs: customSettings.carbs,
          fat: customSettings.fat
        },
        meals_per_day: customSettings.meals_per_day,
        coach_notes: customSettings.coach_notes,
        coach_video_url: customSettings.coach_video_url,
        week_structure: selectedTemplate?.week_structure || []
      }
      
      await db.saveMealPlan(client.id, planData)
      alert('✅ Meal plan assigned successfully!')
      onClose(true)
    } catch (error) {
      alert('❌ Failed to assign meal plan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
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
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(16, 185, 129, 0.3)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s-5)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '1.5rem',
                marginBottom: '8px'
              }}>
                🍽️ Assign Meal Plan
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>
                Create a nutrition plan for {client.first_name} {client.last_name}
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--s-2)',
          padding: '0 var(--s-5)',
          paddingTop: 'var(--s-4)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          {['templates', 'custom'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: activeTab === tab ? '#10b981' : 'var(--c-muted)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab === 'templates' ? '📋 Templates' : '✏️ Custom'}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--s-5)'
        }}>
          {activeTab === 'templates' ? (
            // Templates Tab
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 'var(--s-3)'
              }}>
                {templates.slice(0, 12).map(template => {
                  const isSelected = selectedTemplate?.id === template.id
                  
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                          : 'rgba(0,0,0,0.3)',
                        border: `2px solid ${isSelected ? '#10b981' : 'transparent'}`,
                        borderRadius: '12px',
                        padding: 'var(--s-3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1rem' }}>
                        {template.name}
                      </h4>
                      <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
                        {template.description || 'Standard meal plan template'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: 'var(--text-xs)'
                        }}>
                          {template.calories || 2000} kcal
                        </span>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: 'var(--text-xs)'
                        }}>
                          {template.meals_per_day || 3} meals
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {templates.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--s-6)',
                  color: 'var(--c-muted)'
                }}>
                  <p style={{ fontSize: '3rem', marginBottom: 'var(--s-3)' }}>🍽️</p>
                  <p>No meal plan templates found</p>
                </div>
              )}
            </div>
          ) : (
            // Custom Tab
            <div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: 'var(--s-4)'
              }}>
                <h3 style={{ color: '#fff', marginBottom: 'var(--s-4)' }}>
                  Custom Macro Targets
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--s-3)',
                  marginBottom: 'var(--s-4)'
                }}>
                  <div>
                    <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={customSettings.calories}
                      onChange={(e) => setCustomSettings({...customSettings, calories: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={customSettings.protein}
                      onChange={(e) => setCustomSettings({...customSettings, protein: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={customSettings.carbs}
                      onChange={(e) => setCustomSettings({...customSettings, carbs: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={customSettings.fat}
                      onChange={(e) => setCustomSettings({...customSettings, fat: parseInt(e.target.value) || 0})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: 'var(--s-3)' }}>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                    Meals per Day
                  </label>
                  <select
                    value={customSettings.meals_per_day}
                    onChange={(e) => setCustomSettings({...customSettings, meals_per_day: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  >
                    <option value="3">3 Meals</option>
                    <option value="4">4 Meals</option>
                    <option value="5">5 Meals</option>
                    <option value="6">6 Meals</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: 'var(--s-3)' }}>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                    Coach Notes
                  </label>
                  <textarea
                    value={customSettings.coach_notes}
                    onChange={(e) => setCustomSettings({...customSettings, coach_notes: e.target.value})}
                    placeholder="Special instructions or notes for the client..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>
                    Coach Video URL (optional)
                  </label>
                  <input
                    type="url"
                    value={customSettings.coach_video_url}
                    onChange={(e) => setCustomSettings({...customSettings, coach_video_url: e.target.value})}
                    placeholder="https://youtube.com/..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
                
                {/* Macro Preview */}
                <div style={{
                  marginTop: 'var(--s-4)',
                  padding: 'var(--s-3)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: 'var(--s-2)' }}>
                    Daily Targets Summary:
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff' }}>
                      🔥 {customSettings.calories} kcal
                    </span>
                    <span style={{ color: '#fff' }}>
                      💪 {customSettings.protein}g protein
                    </span>
                    <span style={{ color: '#fff' }}>
                      🌾 {customSettings.carbs}g carbs
                    </span>
                    <span style={{ color: '#fff' }}>
                      🥑 {customSettings.fat}g fat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: 'var(--s-5)',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
            {activeTab === 'templates' && selectedTemplate 
              ? `Selected: ${selectedTemplate.name}`
              : activeTab === 'custom' 
                ? 'Custom plan ready'
                : 'Configure meal plan'}
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--c-border)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || (activeTab === 'templates' && !selectedTemplate)}
              style={{
                background: (activeTab === 'custom' || selectedTemplate)
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(16, 185, 129, 0.2)',
                border: 'none',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: (activeTab === 'custom' || selectedTemplate) ? 'pointer' : 'not-allowed',
                opacity: (activeTab === 'custom' || selectedTemplate) ? 1 : 0.5
              }}
            >
              {loading ? 'Assigning...' : 'Assign Meal Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== BULK ACTIONS MODAL =====
export const BulkActionsModal = ({ clients, isOpen, onClose, db }) => {
  const [selectedClients, setSelectedClients] = useState([])
  const [action, setAction] = useState('') // workout | meal | message
  const [loading, setLoading] = useState(false)
  
  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
  }
  
  const handleExecute = async () => {
    if (selectedClients.length === 0 || !action) return
    
    setLoading(true)
    try {
      switch(action) {
        case 'message':
          const message = prompt('Enter message to send to all selected clients:')
          if (message) {
            await db.sendBulkNotifications(selectedClients, {
              type: 'motivation',
              title: '💬 Coach Message',
              message: message,
              priority: 'normal'
            })
            alert(`✅ Message sent to ${selectedClients.length} clients!`)
          }
          break
          
        case 'workout':
          alert('🏗️ Bulk workout assignment coming soon!')
          break
          
        case 'meal':
          alert('🏗️ Bulk meal plan assignment coming soon!')
          break
      }
      
      onClose(true)
    } catch (error) {
      alert('❌ Bulk action failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
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
      zIndex: 9999
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s-5)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, transparent)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>
                ⚡ Bulk Actions
              </h2>
              <p style={{ color: 'var(--c-muted)' }}>
                Perform actions on multiple clients at once
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--s-5)'
        }}>
          {/* Action Selection */}
          <div style={{ marginBottom: 'var(--s-4)' }}>
            <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', display: 'block', marginBottom: 'var(--s-2)' }}>
              Select Action
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s-2)' }}>
              {[
                { id: 'message', label: '💬 Send Message', color: '#8b5cf6' },
                { id: 'workout', label: '💪 Assign Workout', color: '#3b82f6' },
                { id: 'meal', label: '🍽️ Assign Meal', color: '#10b981' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAction(opt.id)}
                  style={{
                    padding: 'var(--s-3)',
                    background: action === opt.id 
                      ? `linear-gradient(135deg, ${opt.color}40, ${opt.color}20)`
                      : 'rgba(0,0,0,0.3)',
                    border: `2px solid ${action === opt.id ? opt.color : 'transparent'}`,
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Client Selection */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--s-3)'
            }}>
              <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                Select Clients ({selectedClients.length}/{clients.length})
              </label>
              <button
                onClick={handleSelectAll}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: 'none',
                  color: '#8b5cf6',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer'
                }}
              >
                {selectedClients.length === clients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: 'var(--s-3)',
              maxHeight: '250px',
              overflow: 'auto'
            }}>
              {clients.map(client => (
                <label
                  key={client.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--s-2)',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients([...selectedClients, client.id])
                      } else {
                        setSelectedClients(selectedClients.filter(id => id !== client.id))
                      }
                    }}
                    style={{ marginRight: 'var(--s-3)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', marginBottom: '2px' }}>
                      {client.first_name} {client.last_name}
                    </p>
                    <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                      {client.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: 'var(--s-5)',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
            {selectedClients.length} clients selected
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--c-border)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={loading || selectedClients.length === 0 || !action}
              style={{
                background: (selectedClients.length > 0 && action)
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  : 'rgba(139, 92, 246, 0.2)',
                border: 'none',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: (selectedClients.length > 0 && action) ? 'pointer' : 'not-allowed',
                opacity: (selectedClients.length > 0 && action) ? 1 : 0.5
              }}
            >
              {loading ? 'Executing...' : `Execute on ${selectedClients.length} Clients`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export all modals
export default {
  WorkoutSchemaAssignmentModal,
  MealPlanAssignmentModal,
  BulkActionsModal
}
