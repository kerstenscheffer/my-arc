// src/modules/challenges/components/ChallengeGoals.jsx
// Challenge Goals Component - FIXED DATA LOADING
// Kersten - 28 Augustus 2025

import { Target, ChevronDown } from 'lucide-react'

export default function ChallengeGoals({ 
  challengeGoals, 
  loading, 
  expandedGoals, 
  setExpandedGoals, 
  isMobile, 
  theme 
}) {
  
  const getUnitForKey = (key) => {
    const units = {
      distance_km: 'km',
      distance: 'km', 
      pace: 'min/km',
      duration_minutes: 'min',
      duration: 'min',
      rpe: '/10',
      weight: 'kg',
      reps: 'x',
      sets: 'sets',
      calories: 'kcal',
      protein: 'g',
      carbs: 'g',
      fat: 'g',
      water: 'L',
      sleep_hours: 'uur',
      steps: 'stappen',
      heart_rate: 'bpm',
      warmup_km: 'km'
    }
    return units[key] || ''
  }

  // Generate display goals from database OR fallback
  const goalsDisplay = challengeGoals.length > 0 
    ? challengeGoals.map((goal, index) => ({
        week: goal.week_number || index + 1,
        action: goal.goal_name || `Goal ${index + 1}`,
        description: goal.description,
        goalData: goal // Pass full goal data for expansion
      }))
    : [
        { week: 1, action: 'Basis routine opbouwen - 3x per week trainen', description: 'Start met fundamenten' },
        { week: 2, action: 'Intensiteit verhogen - tempo runs toevoegen', description: 'Voeg snelheid toe' },
        { week: 3, action: 'Volume opbouwen - lange duurloop weekend', description: 'Verhoog afstand' },
        { week: 4, action: 'Taper week - herstel focus', description: 'Herstel en voorbereiding' }
      ]

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Target size={20} color={theme.primary} />
        Doelen & Acties
        {challengeGoals.length > 0 && (
          <span style={{
            fontSize: '0.75rem',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            {challengeGoals.length} goals geladen
          </span>
        )}
      </h3>
      
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(220, 38, 38, 0.3)',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Goals laden...
        </div>
      )}
      
      {/* Goals List - Direct without container */}
      {!loading && goalsDisplay.map((goal, index) => (
        <div key={index} style={{
          marginBottom: index < goalsDisplay.length - 1 ? '1rem' : 0,
          border: `1px solid ${theme.borderColor}`,
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.02)'
        }}>
          {/* Goal Header - Clickable */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'transparent'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Goal clicked:', index, 'Current state:', expandedGoals[index])
              if (setExpandedGoals) {
                setExpandedGoals(prev => {
                  const newState = {
                    ...prev,
                    [index]: !prev[index]
                  }
                  console.log('New expanded state:', newState)
                  return newState
                })
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: theme.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: '#fff',
                flexShrink: 0,
                fontSize: '0.9rem',
                boxShadow: theme.boxShadow
              }}>
                W{goal.week}
              </div>
              <div>
                <p style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  {goal.action}
                </p>
                {goal.description && (
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.85rem',
                    margin: '0.25rem 0 0 0',
                    lineHeight: 1.4
                  }}>
                    {goal.description}
                  </p>
                )}
              </div>
            </div>
            <div style={{ 
              transition: 'transform 0.3s ease',
              transform: expandedGoals[index] ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <ChevronDown size={20} />
            </div>
          </div>

          {/* Expandable Content - Show for ALL goals */}
          {expandedGoals[index] && (
            <div style={{
              padding: '0 1rem 1rem 1rem',
              borderTop: `1px solid ${theme.borderColor}`,
              background: 'rgba(0,0,0,0.1)',
              animation: 'expandIn 0.3s ease'
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                padding: '1rem 0'
              }}>
                {/* If we have database goal data, show detailed WORKOUT info */}
                {goal.goalData ? (
                  <>
                    {/* Workout Type & Specifics */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ 
                        color: '#fff', 
                        fontSize: '1.1rem', 
                        fontWeight: '700', 
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🏃‍♂️ {goal.goalData.goal_name || 'Workout Details'}
                      </h4>

                      {/* Parse and display TARGET DATA in detail */}
                      {goal.goalData.target_data && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.05) 100%)',
                          padding: '1.5rem',
                          borderRadius: '12px',
                          border: `1px solid ${theme.borderColor}`
                        }}>
                          {(() => {
                            try {
                              const targets = JSON.parse(goal.goalData.target_data)
                              return (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                  gap: '1rem'
                                }}>
                                  {Object.entries(targets).map(([key, value]) => {
                                    // Determine the workout parameter type and styling
                                    let icon = '📊'
                                    let label = key.replace('_', ' ')
                                    let displayValue = value
                                    let unit = getUnitForKey(key)
                                    let color = '#10b981'

                                    // Specific styling per workout parameter
                                    if (key.includes('distance') || key.includes('km')) {
                                      icon = '📏'
                                      color = '#3b82f6'
                                      label = 'Afstand'
                                    } else if (key.includes('pace') || key.includes('tempo')) {
                                      icon = '⏱️'
                                      color = '#f59e0b' 
                                      label = 'Tempo'
                                      displayValue = `${value} min/km`
                                      unit = ''
                                    } else if (key.includes('duration') || key.includes('time')) {
                                      icon = '⏰'
                                      color = '#8b5cf6'
                                      label = 'Duur'
                                    } else if (key.includes('rpe') || key.includes('intensity')) {
                                      icon = '🔥'
                                      color = '#ef4444'
                                      label = 'Intensiteit'
                                    } else if (key.includes('weight')) {
                                      icon = '🏋️‍♂️'
                                      color = '#10b981'
                                      label = 'Gewicht'
                                    } else if (key.includes('reps')) {
                                      icon = '🔢'
                                      color = '#06b6d4'
                                      label = 'Herhalingen'
                                    } else if (key.includes('sets')) {
                                      icon = '📋'
                                      color = '#84cc16'
                                      label = 'Sets'
                                    } else if (key.includes('rest')) {
                                      icon = '⏸️'
                                      color = '#64748b'
                                      label = 'Rust'
                                    }

                                    return (
                                      <div 
                                        key={key} 
                                        style={{
                                          background: 'rgba(0,0,0,0.3)',
                                          padding: '1rem',
                                          borderRadius: '10px',
                                          border: `1px solid rgba(220, 38, 38, 0.2)`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '1rem'
                                        }}
                                      >
                                        <div style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '10px',
                                          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '1.2rem'
                                        }}>
                                          {icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{
                                            color: 'rgba(255,255,255,0.7)',
                                            fontSize: '0.85rem',
                                            textTransform: 'capitalize',
                                            marginBottom: '0.25rem'
                                          }}>
                                            {label}
                                          </div>
                                          <div style={{
                                            color: '#fff',
                                            fontSize: '1.2rem',
                                            fontWeight: '700'
                                          }}>
                                            {displayValue} {unit}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            } catch (e) {
                              return (
                                <div style={{
                                  textAlign: 'center',
                                  padding: '2rem',
                                  color: 'rgba(255,255,255,0.5)'
                                }}>
                                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
                                  <p>Workout details worden geladen...</p>
                                </div>
                              )
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Workout Instructions & Notes */}
                    {goal.goalData.description && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ 
                          color: '#fff', 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          marginBottom: '0.75rem' 
                        }}>
                          📝 Workout Instructies:
                        </h4>
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: 'rgba(255,255,255,0.85)',
                          lineHeight: 1.6
                        }}>
                          {goal.goalData.description}
                        </div>
                      </div>
                    )}

                    {/* Tracking & Completion Requirements */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ 
                        color: '#fff', 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        marginBottom: '0.75rem' 
                      }}>
                        ✅ Hoe deze workout te voltooien:
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                        gap: '1rem'
                      }}>
                        {/* Frequency */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '1rem',
                          borderRadius: '10px',
                          textAlign: 'center',
                          border: '1px solid rgba(220, 38, 38, 0.2)'
                        }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗓️</div>
                          <div style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: '700', 
                            color: '#fff',
                            marginBottom: '0.25rem'
                          }}>
                            {goal.goalData.frequency_per_week || 3}x
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}>
                            Deze Week
                          </div>
                        </div>

                        {/* Tracking Method */}
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '1rem',
                          borderRadius: '10px',
                          textAlign: 'center',
                          border: '1px solid rgba(220, 38, 38, 0.2)'
                        }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            {goal.goalData.auto_trackable ? '📱' : '✍️'}
                          </div>
                          <div style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '700', 
                            color: goal.goalData.auto_trackable ? '#10b981' : '#f59e0b',
                            marginBottom: '0.25rem'
                          }}>
                            {goal.goalData.auto_trackable ? 'Automatisch' : 'Handmatig'}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}>
                            Tracking
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proof Requirements */}
                    {goal.goalData.requires_proof && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f59e0b, #f59e0bdd)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                          }}>
                            📸
                          </div>
                          <div>
                            <div style={{
                              color: '#f59e0b',
                              fontSize: '0.9rem',
                              fontWeight: '700',
                              marginBottom: '0.25rem'
                            }}>
                              Bewijs Upload Vereist
                            </div>
                            <div style={{
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.7)'
                            }}>
                              Upload een foto of screenshot na voltooiing
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Criteria */}
                    {goal.goalData.target_value && (
                      <div>
                        <h4 style={{ 
                          color: '#fff', 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          marginBottom: '0.75rem' 
                        }}>
                          🎯 Succeskriterium:
                        </h4>
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                          padding: '1.5rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '900',
                            color: '#10b981',
                            marginBottom: '0.5rem'
                          }}>
                            {goal.goalData.target_value}
                          </div>
                          {goal.goalData.measurement_unit && (
                            <div style={{
                              fontSize: '1.1rem',
                              color: 'rgba(255,255,255,0.8)',
                              fontWeight: '600',
                              marginBottom: '0.5rem'
                            }}>
                              {goal.goalData.measurement_unit}
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.9rem',
                            color: 'rgba(255,255,255,0.6)',
                            fontWeight: '500'
                          }}>
                            Minimum om deze week te voltooien
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback content voor goals zonder database data */
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '1rem'
                    }}>🎯</div>
                    <h4 style={{ 
                      color: '#fff', 
                      fontSize: '1.1rem', 
                      marginBottom: '0.5rem' 
                    }}>
                      Week {goal.week} Details
                    </h4>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      marginBottom: '1rem'
                    }}>
                      {goal.description || 'Focus op het opbouwen van consistentie en het behalen van je doelen voor deze week.'}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1rem',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700', 
                          color: '#10b981' 
                        }}>
                          3-4x
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'rgba(255,255,255,0.6)',
                          textTransform: 'uppercase'
                        }}>
                          Per Week
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1rem',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700', 
                          color: '#f59e0b' 
                        }}>
                          Manual
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'rgba(255,255,255,0.6)',
                          textTransform: 'uppercase'
                        }}>
                          Tracking
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
