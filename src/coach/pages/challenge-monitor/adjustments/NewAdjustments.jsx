// src/coach/pages/challenge-monitor/adjustments/NewAdjustments.jsx
// FIXED VERSION - Proper goal updates with correct value calculations

import { useState, useEffect } from 'react'
import { Save, RefreshCw, Target, Scale, Phone, Camera, Dumbbell } from 'lucide-react'

export default function NewAdjustments({ client, db, challengeData, onUpdate }) {
  const isMobile = window.innerWidth <= 768
  const [goals, setGoals] = useState({
    calls: null,
    weight: null,
    photos: null,
    workouts: null
  })
  const [adjustments, setAdjustments] = useState({
    calls: '',
    weight: '',
    photos: '',
    workouts: ''
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [client?.id, challengeData])

  async function loadGoals() {
    if (!client?.id || !challengeData) return

    try {
      const { data } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challengeData.id)

      const goalsMap = {}
      data?.forEach(goal => {
        goalsMap[goal.goal_type] = goal
      })

      setGoals(goalsMap)
    } catch (error) {
      console.error('❌ Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(goalType) {
    const goal = goals[goalType]
    if (!goal) {
      alert('Goal niet gevonden!')
      return
    }

    const adjustmentValue = adjustments[goalType]
    if (!adjustmentValue || adjustmentValue === '') {
      alert('Voer een waarde in!')
      return
    }

    setSaving(true)
    try {
      const newValue = parseFloat(adjustmentValue)
      
      // ✅ FIX: Use the adjustment value directly as current_value
      const { error } = await db.supabase
        .from('challenge_assignment_goals')
        .update({
          current_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id)

      if (error) throw error

      alert(`✅ ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} bijgewerkt naar ${newValue}!`)
      
      // Reload goals and trigger parent update
      await loadGoals()
      if (onUpdate) onUpdate()

      // Clear adjustment field
      setAdjustments(prev => ({ ...prev, [goalType]: '' }))
      
    } catch (error) {
      console.error(`❌ Error updating ${goalType}:`, error)
      alert(`Error bij updaten ${goalType}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleSync(goalType) {
    setSaving(true)
    try {
      // ✅ FIX: Use DatabaseService sync function
      await db.syncChallengeGoalFromTracking(client.id)
      
      alert(`✅ ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} gesynchroniseerd!`)
      await loadGoals()
      if (onUpdate) onUpdate()
      
    } catch (error) {
      console.error(`❌ Error syncing ${goalType}:`, error)
      alert(`Error bij synchroniseren ${goalType}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading adjustments...
      </div>
    )
  }

  const adjustmentTypes = [
    {
      type: 'calls',
      label: 'Calls',
      icon: Phone,
      color: '#3b82f6',
      unit: 'calls'
    },
    {
      type: 'weight',
      label: 'Weight',
      icon: Scale,
      color: '#10b981',
      unit: 'kg'
    },
    {
      type: 'photos',
      label: 'Photos',
      icon: Camera,
      color: '#8b5cf6',
      unit: 'foto\'s'
    },
    {
      type: 'workouts',
      label: 'Workouts',
      icon: Dumbbell,
      color: '#f97316',
      unit: 'workouts'
    }
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(139, 92, 246, 0.2)'
    }}>
      <h2 style={{
        fontSize: isMobile ? '1.1rem' : '1.3rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Target size={24} color="#8b5cf6" />
        Manual Adjustments
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '1rem' : '1.25rem'
      }}>
        {adjustmentTypes.map(({ type, label, icon: Icon, color, unit }) => {
          const goal = goals[type]
          
          return (
            <div
              key={type}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: isMobile ? '1rem' : '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <Icon size={20} color={color} />
                <span style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  {label}
                </span>
              </div>

              {/* Current Progress */}
              {goal ? (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      Current
                    </span>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: color
                    }}>
                      {goal.current_value || 0} {type === 'weight' ? 'kg' : ''}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      Target
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#fff'
                    }}>
                      {goal.target_value} {type === 'weight' ? 'kg' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontStyle: 'italic',
                  marginBottom: '1rem'
                }}>
                  Geen doel ingesteld
                </div>
              )}

              {/* Manual Input */}
              <div style={{
                marginBottom: '0.75rem'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Nieuwe waarde ({unit})
                </label>
                <input
                  type="number"
                  step={type === 'weight' ? '0.1' : '1'}
                  value={adjustments[type]}
                  onChange={(e) => setAdjustments(prev => ({
                    ...prev,
                    [type]: e.target.value
                  }))}
                  placeholder={`Bijv. ${type === 'weight' ? '75.5' : '10'}`}
                  disabled={!goal || saving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = color
                    e.target.style.boxShadow = `0 0 0 2px ${color}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => handleSave(type)}
                  disabled={!goal || saving || !adjustments[type]}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: adjustments[type] ? color : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: !goal || saving || !adjustments[type] ? 'not-allowed' : 'pointer',
                    opacity: !goal || saving || !adjustments[type] ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (goal && !saving && adjustments[type]) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save'}
                </button>

                {type === 'weight' && (
                  <button
                    onClick={() => handleSync(type)}
                    disabled={!goal || saving}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: !goal || saving ? 'not-allowed' : 'pointer',
                      opacity: !goal || saving ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      if (goal && !saving) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.5'
      }}>
        💡 <strong>Tip:</strong> Gebruik deze manual adjustments alleen wanneer automatische tracking niet werkt. Weight kan ook automatisch gesynchroniseerd worden met de sync button.
      </div>
    </div>
  )
}
