// src/coach/v2/1-client-management/pages/MealAssignV2.jsx
import { useState, useEffect } from 'react'

// Macro Display Component
function MacroDisplay({ macros, compact = false, isMobile }) {
  if (compact) {
    return (
      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#10b981' }}>
        {macros.kcal}kcal • P{macros.protein}g
      </span>
    )
  }
  
  return (
    <div style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#9ca3af' }}>
      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{macros.kcal} kcal</span>
      {' • '}
      <span>P: {macros.protein}g</span>
      {' • '}
      <span>C: {macros.carbs}g</span>
      {' • '}
      <span>F: {macros.fat}g</span>
    </div>
  )
}

// Progress Bar Component
function MacroProgressBar({ current, target, label, color, isMobile }) {
  const percentage = Math.min(100, (current / target) * 100)
  
  return (
    <div style={{ marginBottom: isMobile ? '0.5rem' : '0.75rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '0.25rem',
        fontSize: isMobile ? '0.75rem' : '0.8rem'
      }}>
        <span style={{ color: '#999' }}>{label}</span>
        <span style={{ color: color }}>
          {current}/{target} ({Math.round(percentage)}%)
        </span>
      </div>
      <div style={{
        width: '100%',
        height: isMobile ? '4px' : '6px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s'
        }} />
      </div>
    </div>
  )
}

export default function MealAssignV2({ db, client, mealTemplates = [], refreshData, isMobile }) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templatePreview, setTemplatePreview] = useState(null)
  const [mealsMap, setMealsMap] = useState({})
  const [filter, setFilter] = useState('all')
  const [currentPlan, setCurrentPlan] = useState(null)
  const [assigning, setAssigning] = useState(false)

  // Load templates and current plan
  useEffect(() => {
    loadTemplates()
    loadCurrentPlan()
  }, [client])

  async function loadTemplates() {
    if (!db) return
    
    try {
      setLoading(true)
      // Check if method exists, otherwise set empty array
      if (typeof db.getMealPlanTemplates === 'function') {
        const templatesData = await db.getMealPlanTemplates()
        setTemplates(templatesData || [])
      } else {
        console.warn('getMealPlanTemplates method not found in DatabaseService')
        setTemplates(mealTemplates || []) // Use props as fallback
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates(mealTemplates || []) // Use props as fallback
    } finally {
      setLoading(false)
    }
  }

  async function loadCurrentPlan() {
    if (!db || !client?.id) return
    
    try {
      const plan = await db.getClientMealPlan(client.id)
      setCurrentPlan(plan)
    } catch (error) {
      console.error('Error loading current plan:', error)
    }
  }

  // Load template preview
  async function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    
    if (!template.week_structure) {
      setTemplatePreview(null)
      return
    }
    
    try {
      // Get all meal IDs from template
      const mealIds = template.week_structure.flatMap(day => 
        (day?.meals || []).map(m => m.meal_id).filter(Boolean)
      )
      const uniqueIds = [...new Set(mealIds)]
      
      if (uniqueIds.length > 0) {
        // Use getMealsByIds if it exists, otherwise try getAllMeals
        let meals = []
        if (typeof db.getMealsByIds === 'function') {
          meals = await db.getMealsByIds(uniqueIds)
        } else if (typeof db.getAllMeals === 'function') {
          const allMeals = await db.getAllMeals()
          meals = allMeals.filter(m => uniqueIds.includes(m.id))
        }
        
        const map = Object.fromEntries(meals.map(m => [m.id, m]))
        setMealsMap(map)
      }
      
      // Generate preview (first 7 days)
      const preview = template.week_structure.slice(0, 7)
      setTemplatePreview(preview)
    } catch (error) {
      console.error('Error loading template preview:', error)
    }
  }

  // Assign template to client
  async function handleAssignTemplate() {
    if (!selectedTemplate || !client || assigning) return
    
    if (!window.confirm(
      `Wil je template "${selectedTemplate.title}" toewijzen aan ${client.first_name}? Dit overschrijft het huidige meal plan!`
    )) {
      return
    }
    
    setAssigning(true)
    try {
      // Use saveMealPlan as the standard method (it exists in DatabaseService)
      await db.saveMealPlan(client.id, {
        template_id: selectedTemplate.id,
        targets: selectedTemplate.targets,
        week_structure: selectedTemplate.week_structure,
        coach_notes: selectedTemplate.coach_notes,
        coach_video_url: selectedTemplate.coach_video_url,
        title: selectedTemplate.title
      })
      
      alert(`✅ Template "${selectedTemplate.title}" succesvol toegewezen aan ${client.first_name}!`)
      
      // Refresh data
      if (refreshData) refreshData()
      loadCurrentPlan()
      
      // Clear selection
      setSelectedTemplate(null)
      setTemplatePreview(null)
      
    } catch (error) {
      console.error('Error assigning template:', error)
      alert('❌ Template toewijzen mislukt: ' + error.message)
    } finally {
      setAssigning(false)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (filter === 'all') return true
    if (filter === 'bulking' && t.targets?.kcal >= 2800) return true
    if (filter === 'cutting' && t.targets?.kcal <= 2000) return true
    if (filter === 'maintenance' && t.targets?.kcal > 2000 && t.targets?.kcal < 2800) return true
    return false
  })

  // Calculate totals for preview
  const calculateDayTotals = (day) => {
    const meals = (day?.meals || []).map(m => mealsMap[m.meal_id]).filter(Boolean)
    return meals.reduce((acc, meal) => ({
      kcal: acc.kcal + (meal.kcal || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
  }

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        textAlign: 'center',
        color: '#999'
      }}>
        ⏳ Templates laden...
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          color: '#fff',
          margin: 0,
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 'bold'
        }}>
          🍽️ Meal Plan Toewijzen
        </h3>
        <p style={{
          color: '#d1fae5',
          marginTop: '0.5rem',
          fontSize: isMobile ? '0.8rem' : '0.875rem'
        }}>
          {client.first_name} {client.last_name} 
          {currentPlan && ` • Huidig: ${currentPlan.title || 'Naamloos plan'}`}
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {['all', 'bulking', 'cutting', 'maintenance'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
              background: filter === type ? '#10b981' : '#2a2a2a',
              border: '1px solid #10b98133',
              borderRadius: '6px',
              color: filter === type ? '#000' : '#fff',
              cursor: 'pointer',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: filter === type ? 'bold' : 'normal',
              transition: 'all 0.2s',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            {type === 'all' && '🔹 Alle'}
            {type === 'bulking' && '💪 Bulking'}
            {type === 'cutting' && '🔥 Cutting'}
            {type === 'maintenance' && '⚖️ Maintenance'}
            {` (${templates.filter(t => {
              if (type === 'all') return true
              if (type === 'bulking' && t.targets?.kcal >= 2800) return true
              if (type === 'cutting' && t.targets?.kcal <= 2000) return true
              if (type === 'maintenance' && t.targets?.kcal > 2000 && t.targets?.kcal < 2800) return true
              return false
            }).length})`}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : selectedTemplate ? '400px 1fr' : '1fr',
        gap: '1rem'
      }}>
        {/* Template List */}
        <div>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem' : '1rem',
            maxHeight: isMobile ? '400px' : '600px',
            overflowY: 'auto'
          }}>
            <h4 style={{
              color: '#10b981',
              margin: '0 0 1rem 0',
              fontSize: isMobile ? '1rem' : '1.1rem'
            }}>
              📚 Beschikbare Templates ({filteredTemplates.length})
            </h4>

            {filteredTemplates.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666'
              }}>
                Geen templates gevonden
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    style={{
                      padding: isMobile ? '0.75rem' : '1rem',
                      background: selectedTemplate?.id === template.id
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                        : '#2a2a2a',
                      border: selectedTemplate?.id === template.id
                        ? '2px solid #10b981'
                        : '1px solid #10b98133',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      {template.title}
                      {selectedTemplate?.id === template.id && (
                        <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✓</span>
                      )}
                    </div>
                    
                    {template.description && (
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: '#999',
                        marginBottom: '0.5rem'
                      }}>
                        {template.description}
                      </div>
                    )}
                    
                    {template.targets && (
                      <MacroDisplay macros={template.targets} compact isMobile={isMobile} />
                    )}
                    
                    <div style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: '#666',
                      marginTop: '0.5rem'
                    }}>
                      Aangemaakt: {new Date(template.created_at).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {selectedTemplate && (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                color: '#10b981',
                margin: 0,
                fontSize: isMobile ? '1rem' : '1.1rem'
              }}>
                📋 Preview: {selectedTemplate.title}
              </h4>
              
              <button
                onClick={handleAssignTemplate}
                disabled={assigning}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  background: assigning ? '#555' : '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: assigning ? '#999' : '#000',
                  cursor: assigning ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: 'bold',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {assigning ? '⏳ Bezig...' : '✅ Toewijzen aan ' + client.first_name}
              </button>
            </div>

            {/* Macro Overview */}
            {selectedTemplate.targets && (
              <div style={{
                background: '#2a2a2a',
                borderRadius: '6px',
                padding: isMobile ? '0.75rem' : '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '0.75rem'
                }}>
                  📊 Dagelijkse Targets
                </div>
                
                <MacroProgressBar
                  current={selectedTemplate.targets.kcal}
                  target={selectedTemplate.targets.kcal}
                  label="Calorieën"
                  color="#10b981"
                  isMobile={isMobile}
                />
                <MacroProgressBar
                  current={selectedTemplate.targets.protein}
                  target={selectedTemplate.targets.protein}
                  label="Eiwit (g)"
                  color="#3b82f6"
                  isMobile={isMobile}
                />
                <MacroProgressBar
                  current={selectedTemplate.targets.carbs}
                  target={selectedTemplate.targets.carbs}
                  label="Koolhydraten (g)"
                  color="#f59e0b"
                  isMobile={isMobile}
                />
                <MacroProgressBar
                  current={selectedTemplate.targets.fat}
                  target={selectedTemplate.targets.fat}
                  label="Vet (g)"
                  color="#ef4444"
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* 7-Day Preview Grid */}
            {templatePreview && (
              <div style={{
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile 
                    ? 'repeat(7, minmax(150px, 1fr))' 
                    : 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  minWidth: isMobile ? '1050px' : 'auto'
                }}>
                  {templatePreview.map((day, dayIndex) => {
                    const dayTotals = calculateDayTotals(day)
                    const meals = (day?.meals || []).map(m => mealsMap[m.meal_id]).filter(Boolean)
                    
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          background: '#2a2a2a',
                          borderRadius: '6px',
                          padding: isMobile ? '0.5rem' : '0.75rem',
                          border: '1px solid #10b98133'
                        }}
                      >
                        <div style={{
                          fontWeight: 'bold',
                          color: '#10b981',
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          Dag {dayIndex + 1}
                        </div>
                        
                        {/* Meals list */}
                        <div style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: '#999',
                          marginBottom: '0.5rem'
                        }}>
                          {meals.slice(0, 3).map((meal, idx) => (
                            <div key={idx} style={{ marginBottom: '0.25rem' }}>
                              • {meal.name}
                            </div>
                          ))}
                          {meals.length > 3 && (
                            <div style={{ color: '#666' }}>
                              +{meals.length - 3} meer...
                            </div>
                          )}
                        </div>
                        
                        {/* Day totals */}
                        <div style={{
                          borderTop: '1px solid #10b98133',
                          paddingTop: '0.5rem',
                          fontSize: isMobile ? '0.65rem' : '0.7rem',
                          color: '#10b981'
                        }}>
                          {dayTotals.kcal} kcal
                          <br />
                          P{dayTotals.protein} C{dayTotals.carbs} F{dayTotals.fat}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Coach Notes */}
            {selectedTemplate.coach_notes && (
              <div style={{
                marginTop: '1rem',
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '6px',
                border: '1px solid #fbbf2433'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: '0.5rem'
                }}>
                  💬 Coach Notities
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#ccc',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTemplate.coach_notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
