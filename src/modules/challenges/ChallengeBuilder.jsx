import React, { useState, useEffect } from 'react'

const FinetunedChallengeBuilder = ({ client, db, onSave }) => {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [challenge, setChallenge] = useState({
    title: '',
    description: '',
    category: 'running',
    duration_weeks: 4
  })
  
  const [strategy, setStrategy] = useState([])
  const [activeTab, setActiveTab] = useState('details')
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeWeek, setActiveWeek] = useState(null)
  
  // EXACT SAME AS GOALS MANAGER - Categories
  const goalCategories = {
    herstel: {
      name: 'Herstel',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #dbeafe 100%)',
      darkGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(219, 234, 254, 0.05) 100%)',
      icon: '🌙',
      color: '#60a5fa',
      bgColor: 'rgba(96, 165, 250, 0.1)',
      subcategories: ['Slaap', 'Recovery', 'Stretching', 'Meditatie', 'Breathwork']
    },
    mindset: {
      name: 'Mindset', 
      gradient: 'linear-gradient(135deg, #ef4444 0%, #fee2e2 100%)',
      darkGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(254, 226, 226, 0.05) 100%)',
      icon: '🧠',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      subcategories: ['Focus', 'Discipline', 'Motivatie', 'Visualisatie', 'Journaling']
    },
    workout: {
      name: 'Workout',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)',
      darkGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(254, 243, 199, 0.05) 100%)',
      icon: '💪',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      subcategories: ['Kracht', 'Cardio', 'Mobility', 'Sport', 'Skills']
    },
    voeding: {
      name: 'Voeding',
      gradient: 'linear-gradient(135deg, #10b981 0%, #d1fae5 100%)',
      darkGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(209, 250, 229, 0.05) 100%)',
      icon: '🍎',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      subcategories: ['Calorieën', 'Macros', 'Hydratatie', 'Supplementen', 'Meal Prep']
    },
    structuur: {
      name: 'Structuur',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ede9fe 100%)',
      darkGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(237, 233, 254, 0.05) 100%)',
      icon: '📅',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      subcategories: ['Routine', 'Habits', 'Planning', 'Consistency', 'Time Management']
    }
  }
  
  // EXACT SAME AS GOALS MANAGER - Measurement types
  const measurementTypes = [
    { id: 'checkbox', name: 'Dagen', icon: '☑️', description: 'per week' },
    { id: 'number', name: 'Getal', icon: '🔢', description: 'kg, km, etc.' },
    { id: 'timer', name: 'Tijd', icon: '⏱️', description: 'minuten/uren' },
    { id: 'counter', name: 'Teller', icon: '➕', description: 'reps, glazen' }
  ]
  
  // EXACT SAME AS GOALS MANAGER - Duration presets
  const durationPresets = [
    { id: '1_week', label: '1 Week', days: 7, icon: '📅' },
    { id: '2_weeks', label: '2 Weken', days: 14, icon: '🗓️' },
    { id: '4_weeks', label: '4 Weken', days: 28, icon: '📆' },
    { id: '2_months', label: '2 Maanden', days: 60, icon: '🗓️' },
    { id: 'custom', label: 'Handmatig', days: null, icon: '✏️' }
  ]
  
  // Actions suggestions - SAME PATTERN AS GOALS
  const getActionSuggestions = (goalCategory) => {
    const suggestions = {
      herstel: [
        { title: 'Slaap tracker', frequency: 'daily', target: 7, icon: 'moon' },
        { title: 'Screen-free hour', frequency: 'daily', target: 7, icon: 'smartphone' },
        { title: 'Stretchen', frequency: 'daily', target: 5, icon: 'activity' },
        { title: 'Foam rolling', frequency: 'weekly', target: 3, icon: 'circle' },
        { title: 'Meditatie', frequency: 'daily', target: 7, icon: 'brain' }
      ],
      mindset: [
        { title: 'Journaling', frequency: 'daily', target: 7, icon: 'book' },
        { title: 'Gratitude list', frequency: 'daily', target: 7, icon: 'heart' },
        { title: 'Visualisatie', frequency: 'daily', target: 5, icon: 'eye' },
        { title: 'Cold shower', frequency: 'weekly', target: 5, icon: 'droplets' },
        { title: 'No complaints', frequency: 'daily', target: 7, icon: 'smile' }
      ],
      workout: [
        { title: 'Training session', frequency: 'weekly', target: 4, icon: 'dumbbell' },
        { title: 'Cardio', frequency: 'weekly', target: 3, icon: 'run' },
        { title: 'Mobility work', frequency: 'daily', target: 5, icon: 'activity' },
        { title: 'Rest day', frequency: 'weekly', target: 2, icon: 'pause' },
        { title: 'Progress foto', frequency: 'weekly', target: 1, icon: 'camera' }
      ],
      voeding: [
        { title: 'Water intake', frequency: 'daily', target: 7, icon: 'droplets' },
        { title: 'Track calories', frequency: 'daily', target: 7, icon: 'calculator' },
        { title: 'Meal prep', frequency: 'weekly', target: 2, icon: 'chefHat' },
        { title: 'No junk food', frequency: 'daily', target: 6, icon: 'pizza' },
        { title: 'Protein target', frequency: 'daily', target: 7, icon: 'beef' }
      ],
      structuur: [
        { title: 'Morning routine', frequency: 'daily', target: 7, icon: 'sunrise' },
        { title: 'Planning session', frequency: 'weekly', target: 1, icon: 'calendar' },
        { title: 'No snooze', frequency: 'daily', target: 5, icon: 'alarm' },
        { title: 'Evening shutdown', frequency: 'daily', target: 5, icon: 'power' },
        { title: 'Digital detox', frequency: 'daily', target: 2, icon: 'phoneOff' }
      ]
    }
    
    return suggestions[goalCategory] || suggestions.structuur
  }
  
  useEffect(() => {
    loadTemplates()
    initializeStrategy()
  }, [])
  
  const loadTemplates = async () => {
    try {
      const data = await db.getChallengeTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Load templates failed:', error)
    }
  }
  
  const initializeStrategy = () => {
    const weeks = []
    for (let i = 1; i <= challenge.duration_weeks; i++) {
      weeks.push({
        week_number: i,
        week_title: `Week ${i}`,
        week_description: '',
        
        // PRIMARY TARGET - SAME AS GOALS
        title: '',
        category: challenge.category,
        subcategory: null,
        measurement_type: 'checkbox',
        target_value: '',
        unit: '',
        frequency_target: 5,
        target_date: '',
        notes: '',
        
        // ACTIONS - SAME AS GOALS ACTIONS
        actions: [], // Array of action objects
        
        // Checkpoints
        checkpoint_title: '',
        checkpoint_description: '',
        checkpoint_type: 'performance'
      })
    }
    setStrategy(weeks)
  }
  
  const updateWeek = (weekIndex, field, value) => {
    const newStrategy = [...strategy]
    newStrategy[weekIndex][field] = value
    setStrategy(newStrategy)
  }
  
  const addAction = (weekIndex) => {
    const newStrategy = [...strategy]
    newStrategy[weekIndex].actions.push({
      id: Date.now(),
      title: '',
      frequency: 'weekly',
      frequency_target: 3,
      icon: 'zap'
    })
    setStrategy(newStrategy)
  }
  
  const updateAction = (weekIndex, actionIndex, field, value) => {
    const newStrategy = [...strategy]
    newStrategy[weekIndex].actions[actionIndex][field] = value
    setStrategy(newStrategy)
  }
  
  const removeAction = (weekIndex, actionIndex) => {
    const newStrategy = [...strategy]
    newStrategy[weekIndex].actions.splice(actionIndex, 1)
    setStrategy(newStrategy)
  }
  
  const saveChallenge = async () => {
    if (!challenge.title || strategy.length === 0) {
      alert('Vul alle verplichte velden in')
      return
    }
    
    setLoading(true)
    try {
      const createdChallenge = await db.createChallenge({
        coach_id: db.getCurrentUser()?.id,
        ...challenge
      })
      
      await db.createChallengeStrategy(createdChallenge.id, strategy)
      
      if (client) {
        await db.assignChallengeToClient(
          createdChallenge.id,
          client.id,
          db.getCurrentUser()?.id
        )
      }
      
      alert(`Challenge "${challenge.title}" succesvol aangemaakt${client ? ' en toegewezen!' : '!'}`)
      onSave && onSave(createdChallenge)
      
      // Reset form
      setChallenge({ title: '', description: '', category: 'running', duration_weeks: 4 })
      setStrategy([])
      setSelectedTemplate(null)
      initializeStrategy()
    } catch (error) {
      console.error('Save challenge failed:', error)
      alert('Fout bij opslaan challenge')
    } finally {
      setLoading(false)
    }
  }
  
  // EXACT SAME STYLING AS GOALS MANAGER
  const renderWeekBuilder = (week, index) => {
    const categoryConfig = goalCategories[week.category] || goalCategories.structuur
    const actionSuggestions = getActionSuggestions(week.category)
    
    return (
      <div
        key={index}
        style={{
          padding: isMobile ? '1rem' : '1.5rem',
          background: activeWeek === index 
            ? categoryConfig.darkGradient 
            : 'rgba(0,0,0,0.4)',
          borderRadius: '16px',
          border: `2px solid ${activeWeek === index ? categoryConfig.color : 'rgba(255,255,255,0.1)'}`,
          marginBottom: '1rem',
          boxShadow: activeWeek === index 
            ? `0 8px 20px ${categoryConfig.color}44` 
            : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Week Header - SAME AS GOALS */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: activeWeek === index ? '1.5rem' : '0',
            cursor: 'pointer'
          }}
          onClick={() => setActiveWeek(activeWeek === index ? null : index)}
          onMouseEnter={(e) => {
            if (activeWeek !== index) {
              e.currentTarget.style.transform = 'scale(1.02)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: categoryConfig.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.5rem', color: '#000', fontWeight: 'bold' }}>
              {week.week_number}
            </span>
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {week.week_title || `Week ${week.week_number}`}
            </h4>
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {categoryConfig.name} • {week.actions.length} acties
            </div>
          </div>
          
          <div style={{
            fontSize: '1.5rem',
            color: categoryConfig.color,
            transform: activeWeek === index ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s'
          }}>
            ↓
          </div>
        </div>
        
        {/* Expanded Week Content */}
        {activeWeek === index && (
          <div>
            {/* Week Title Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem'
              }}>
                Week Titel
              </label>
              <input
                type="text"
                value={week.week_title}
                onChange={(e) => updateWeek(index, 'week_title', e.target.value)}
                placeholder={`Week ${week.week_number} titel`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: `1px solid ${categoryConfig.color}33`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            {/* PRIMARY TARGET - EXACT SAME AS GOALS */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: categoryConfig.color
              }}>
                {categoryConfig.icon} Primary Goal
              </h5>
              
              {/* Goal Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Titel van je doel *
                </label>
                <input
                  type="text"
                  value={week.title}
                  onChange={(e) => updateWeek(index, 'title', e.target.value)}
                  placeholder="Bijv. '8 uur slaap per nacht'"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: `1px solid ${categoryConfig.color}33`,
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              
              {/* Subcategory */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Subcategorie
                </label>
                <select
                  value={week.subcategory || ''}
                  onChange={(e) => updateWeek(index, 'subcategory', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: `1px solid ${categoryConfig.color}33`,
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                >
                  <option value="">Kies subcategorie</option>
                  {categoryConfig.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              
              {/* Measurement Type - EXACT SAME AS GOALS */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Hoe meet je dit? *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem'
                }}>
                  {measurementTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => updateWeek(index, 'measurement_type', type.id)}
                      style={{
                        padding: '0.75rem',
                        background: week.measurement_type === type.id
                          ? categoryConfig.gradient
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${week.measurement_type === type.id
                          ? categoryConfig.color
                          : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px',
                        color: week.measurement_type === type.id ? '#000' : '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{type.icon}</span>
                      <span>{type.name}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                        {type.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Target Value & Unit */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr', 
                gap: '0.5rem', 
                marginBottom: '1rem' 
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.875rem'
                  }}>
                    Target Waarde *
                  </label>
                  <input
                    type="number"
                    value={week.target_value}
                    onChange={(e) => updateWeek(index, 'target_value', e.target.value)}
                    placeholder="8"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: `1px solid ${categoryConfig.color}33`,
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.875rem'
                  }}>
                    Eenheid
                  </label>
                  <input
                    type="text"
                    value={week.unit}
                    onChange={(e) => updateWeek(index, 'unit', e.target.value)}
                    placeholder="uur"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: `1px solid ${categoryConfig.color}33`,
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>
              
              {/* Frequency for checkbox - EXACT SAME AS GOALS */}
              {week.measurement_type === 'checkbox' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.875rem'
                  }}>
                    Hoe vaak per week? *
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '0.5rem'
                  }}>
                    {[1,2,3,4,5,6,7].map(num => (
                      <button
                        key={num}
                        onClick={() => updateWeek(index, 'frequency_target', num)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          background: week.frequency_target === num
                            ? categoryConfig.gradient
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${week.frequency_target === num
                            ? categoryConfig.color
                            : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '6px',
                          color: week.frequency_target === num ? '#000' : '#fff',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'center'
                  }}>
                    {week.frequency_target} {week.frequency_target === 1 ? 'dag' : 'dagen'} per week
                  </div>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Notities
                </label>
                <textarea
                  value={week.notes}
                  onChange={(e) => updateWeek(index, 'notes', e.target.value)}
                  placeholder="Bijv. specifieke instructies of tips..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: `1px solid ${categoryConfig.color}33`,
                    borderRadius: '8px',
                    color: '#fff',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            {/* ACTIONS SECTION - EXACT SAME AS GOALS ACTIONS */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h5 style={{
                  color: '#f59e0b',
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  ⚡ Daily Actions ({week.actions.length})
                </h5>
                <button
                  onClick={() => addAction(index)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    color: '#f59e0b',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  ➕
                </button>
              </div>
              
              {/* Actions List */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {week.actions.map((action, actionIndex) => (
                  <div
                    key={action.id}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr auto',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <input
                        type="text"
                        value={action.title}
                        onChange={(e) => updateAction(index, actionIndex, 'title', e.target.value)}
                        placeholder="Actie naam (bijv. 30 min hardlopen)"
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem'
                        }}
                      />
                      
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={action.frequency_target}
                        onChange={(e) => updateAction(index, actionIndex, 'frequency_target', e.target.value)}
                        placeholder="Aantal"
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem'
                        }}
                      />
                      
                      <select
                        value={action.frequency}
                        onChange={(e) => updateAction(index, actionIndex, 'frequency', e.target.value)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="daily">keer per dag</option>
                        <option value="weekly">keer per week</option>
                      </select>
                      
                      <button
                        onClick={() => removeAction(index, actionIndex)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action Suggestions - SAME AS GOALS */}
              {actionSuggestions.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.5rem'
                  }}>
                    Suggesties voor {categoryConfig.name}:
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '0.5rem'
                  }}>
                    {actionSuggestions.slice(0, 4).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newAction = {
                            id: Date.now() + idx,
                            title: suggestion.title,
                            frequency: suggestion.frequency,
                            frequency_target: suggestion.target,
                            icon: suggestion.icon
                          }
                          const newStrategy = [...strategy]
                          newStrategy[index].actions.push(newAction)
                          setStrategy(newStrategy)
                        }}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {suggestion.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                          {suggestion.target}x per {suggestion.frequency === 'daily' ? 'dag' : 'week'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {week.actions.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.875rem'
                }}>
                  Geen acties toegevoegd. Klik "➕" om er een toe te voegen.
                </div>
              )}
            </div>
            
            {/* Checkpoint Section */}
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h5 style={{
                color: '#10b981',
                marginBottom: '1rem',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                🚩 Checkpoint
              </h5>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Checkpoint (wat zou client nu moeten kunnen?)
                </label>
                <input
                  type="text"
                  value={week.checkpoint_title}
                  onChange={(e) => updateWeek(index, 'checkpoint_title', e.target.value)}
                  placeholder="Bijv. Nu zou je 5:40 pace moeten kunnen"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}>
                  Uitleg
                </label>
                <textarea
                  value={week.checkpoint_description}
                  onChange={(e) => updateWeek(index, 'checkpoint_description', e.target.value)}
                  placeholder="Uitleg van wat de client zou moeten kunnen op dit punt..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid #333',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🎯 Challenge Builder
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: isMobile ? '0.875rem' : '1rem'
        }}>
          {client ? `Maak een challenge voor ${client.name}` : 'Maak een nieuwe challenge template'}
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'details', label: 'Details', icon: '📝' },
          { id: 'strategy', label: 'Strategie', icon: '🗓️' },
          { id: 'preview', label: 'Preview', icon: '👁️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              minWidth: isMobile ? '100px' : '120px',
              padding: isMobile ? '0.75rem 0.5rem' : '1rem',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === tab.id ? '#000' : '#fff',
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Basic Details Tab */}
      {activeTab === 'details' && (
        <div>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>
            📝 Challenge Details
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Challenge Title */}
            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Challenge Titel *
              </label>
              <input
                type="text"
                value={challenge.title}
                onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
                placeholder="Bijv. 20KM Hardloop Challenge"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.125rem'
                }}
              />
            </div>
            
            {/* Category Selection */}
            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Categorie *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                gap: '0.5rem'
              }}>
                {Object.entries(goalCategories).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setChallenge({ ...challenge, category: key })}
                    style={{
                      padding: isMobile ? '1rem 0.5rem' : '1.5rem',
                      background: challenge.category === key 
                        ? cat.darkGradient 
                        : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${challenge.category === key ? cat.color : 'transparent'}`,
                      borderRadius: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (challenge.category !== key) {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = `0 8px 20px ${cat.color}44`
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
                      {cat.icon}
                    </span>
                    <div>
                      <div style={{ 
                        fontSize: isMobile ? '0.875rem' : '1rem', 
                        fontWeight: 'bold' 
                      }}>
                        {cat.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: '0.25rem'
                      }}>
                        {cat.subcategories.length} opties
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Duration */}
            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Duur (weken) *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                {[2, 4, 6, 8].map(weeks => (
                  <button
                    key={weeks}
                    onClick={() => {
                      setChallenge({ ...challenge, duration_weeks: weeks })
                      // Reinitialize strategy for new duration
                      initializeStrategy()
                    }}
                    style={{
                      padding: isMobile ? '0.75rem' : '1rem',
                      background: challenge.duration_weeks === weeks 
                        ? '#10b981' 
                        : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: challenge.duration_weeks === weeks ? '#000' : '#fff',
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {weeks} weken
                  </button>
                ))}
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Beschrijving
              </label>
              <textarea
                value={challenge.description}
                onChange={(e) => setChallenge({ ...challenge, description: e.target.value })}
                placeholder="Beschrijf wat deze challenge inhoudt en wat het doel is..."
                rows={isMobile ? 3 : 4}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              color: '#fff', 
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              margin: 0
            }}>
              🗓️ Week-by-Week Strategie
            </h3>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '20px',
              fontSize: '0.875rem',
              color: '#10b981',
              fontWeight: 'bold'
            }}>
              {strategy.length} weken
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {strategy.map((week, index) => renderWeekBuilder(week, index))}
          </div>
        </div>
      )}
      
      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
          <h3>Preview komt binnenkort</h3>
          <p>Focus ligt nu op de perfecte Goals-style interface</p>
        </div>
      )}
      
      {/* Save Button */}
      <div style={{
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        <button
          onClick={saveChallenge}
          disabled={!challenge.title || loading}
          style={{
            padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
            background: !challenge.title || loading 
              ? 'rgba(16, 185, 129, 0.3)' 
              : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '12px',
            color: !challenge.title || loading ? 'rgba(255,255,255,0.5)' : '#000',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: 'bold',
            cursor: !challenge.title || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            boxShadow: !challenge.title || loading 
              ? 'none' 
              : '0 4px 15px rgba(16, 185, 129, 0.4)',
            minWidth: isMobile ? '200px' : '250px'
          }}
        >
          {loading ? 'Opslaan...' : (client ? `Assign aan ${client.name}` : 'Challenge Opslaan')}
        </button>
      </div>
    </div>
  )
}

export default FinetunedChallengeBuilder
