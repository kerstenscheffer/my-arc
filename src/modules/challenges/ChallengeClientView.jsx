import React, { useState, useEffect } from 'react'

const ChallengeClientView = ({ client, db }) => {
  const isMobile = window.innerWidth <= 768
  
  const [challenges, setChallenges] = useState([])
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [strategy, setStrategy] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [weekProgress, setWeekProgress] = useState({})
  
  // Categories for display
  const categories = {
    running: { name: 'Hardlopen', icon: '🏃', color: '#ef4444' },
    workout: { name: 'Workout', icon: '💪', color: '#f59e0b' },
    nutrition: { name: 'Voeding', icon: '🥗', color: '#10b981' },
    sleep: { name: 'Slaap', icon: '😴', color: '#60a5fa' },
    mindset: { name: 'Mindset', icon: '🧠', color: '#8b5cf6' },
    lifestyle: { name: 'Levensstijl', icon: '⚡', color: '#06b6d4' }
  }
  
  useEffect(() => {
    if (client?.id) {
      loadChallenges()
    }
  }, [client])
  
  const loadChallenges = async () => {
    setLoading(true)
    try {
      const data = await db.getClientChallenges(client.id)
      setChallenges(data)
      
      // Auto-select active challenge
      const active = data.find(c => c.status === 'active')
      if (active) {
        setActiveChallenge(active)
        loadChallengeDetails(active)
      }
    } catch (error) {
      console.error('Load challenges failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadChallengeDetails = async (challenge) => {
    try {
      const [strategyData, progressData] = await Promise.all([
        db.getChallengeStrategy(challenge.challenge_id),
        db.getChallengeProgress ? db.getChallengeProgress(challenge.id) : []
      ])
      
      setStrategy(strategyData)
      setProgress(progressData)
      setCurrentWeek(challenge.current_week || 1)
      
      // Initialize week progress tracking
      const weekData = {}
      strategyData.forEach(week => {
        const existingProgress = progressData.find(p => p.week_number === week.week_number)
        weekData[week.week_number] = {
          target_achieved: existingProgress?.target_achieved || false,
          actual_value: existingProgress?.actual_value || 0,
          checkpoint_passed: existingProgress?.checkpoint_passed || false,
          week_rating: existingProgress?.week_rating || 0,
          notes: existingProgress?.notes || ''
        }
      })
      setWeekProgress(weekData)
    } catch (error) {
      console.error('Load challenge details failed:', error)
    }
  }
  
  const updateWeekProgress = async (weekNumber, progressData) => {
    try {
      const weekStart = new Date(activeChallenge.start_date)
      weekStart.setDate(weekStart.getDate() + ((weekNumber - 1) * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const updatedProgress = {
        ...progressData,
        week_start_date: weekStart.toISOString().split('T')[0],
        week_end_date: weekEnd.toISOString().split('T')[0]
      }
      
      await db.updateChallengeProgress(activeChallenge.id, weekNumber, updatedProgress)
      
      setWeekProgress({
        ...weekProgress,
        [weekNumber]: progressData
      })
      
      // Refresh challenge data
      await loadChallenges()
      
      alert(`✅ Week ${weekNumber} progress opgeslagen!`)
    } catch (error) {
      console.error('Update progress failed:', error)
      alert('❌ Fout bij opslaan progress')
    }
  }
  
  const getWeekStatus = (weekNumber) => {
    if (currentWeek > weekNumber) return 'completed'
    if (currentWeek === weekNumber) return 'current'
    return 'upcoming'
  }
  
  const calculateOverallProgress = () => {
    if (strategy.length === 0) return 0
    const completedWeeks = Object.values(weekProgress).filter(w => w.target_achieved).length
    return Math.round((completedWeeks / strategy.length) * 100)
  }
  
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#0a0a0a',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(16,185,129,0.3)',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Loading challenges...
        </p>
      </div>
    )
  }
  
  if (challenges.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#0a0a0a',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>
          Geen Actieve Challenge
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>
          Je coach heeft nog geen challenge voor je klaargezet.
        </p>
      </div>
    )
  }
  
  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '1rem' : '1.5rem',
      border: '1px solid #333'
    }}>
      {/* Challenge Header */}
      {activeChallenge && (
        <div style={{
          marginBottom: '1.5rem',
          padding: isMobile ? '1rem' : '1.5rem',
          background: `linear-gradient(135deg, ${categories[activeChallenge.challenges.category]?.color}20, ${categories[activeChallenge.challenges.category]?.color}10)`,
          borderRadius: '12px',
          border: `2px solid ${categories[activeChallenge.challenges.category]?.color}33`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem' }}>
              {categories[activeChallenge.challenges.category]?.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                {activeChallenge.challenges.title}
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                Week {currentWeek} van {strategy.length} • {calculateOverallProgress()}% compleet
              </p>
            </div>
            <div style={{
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              background: activeChallenge.status === 'completed' 
                ? '#10b981' 
                : categories[activeChallenge.challenges.category]?.color,
              borderRadius: '20px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: 'bold',
              color: '#000'
            }}>
              {activeChallenge.status === 'completed' ? '✅ Voltooid' : '⚡ Actief'}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            height: '8px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${calculateOverallProgress()}%`,
              background: `linear-gradient(90deg, ${categories[activeChallenge.challenges.category]?.color}, ${categories[activeChallenge.challenges.category]?.color}dd)`,
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${categories[activeChallenge.challenges.category]?.color}66`
            }} />
          </div>
        </div>
      )}
      
      {/* Strategy Timeline */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: 'bold',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          📅 Challenge Roadmap
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {strategy.map((week) => {
            const status = getWeekStatus(week.week_number)
            const weekData = weekProgress[week.week_number] || {}
            const isCurrentWeek = status === 'current'
            const categoryColor = categories[activeChallenge?.challenges?.category]?.color || '#8b5cf6'
            
            return (
              <div
                key={week.week_number}
                style={{
                  padding: isMobile ? '1rem' : '1.5rem',
                  background: status === 'completed' 
                    ? 'rgba(16, 185, 129, 0.1)'
                    : isCurrentWeek
                    ? `${categoryColor}15`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${
                    status === 'completed' 
                      ? '#10b981'
                      : isCurrentWeek
                      ? categoryColor
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  borderRadius: '12px',
                  position: 'relative'
                }}
              >
                {/* Week Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    borderRadius: '50%',
                    background: status === 'completed' 
                      ? '#10b981'
                      : isCurrentWeek
                      ? categoryColor
                      : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: 'bold',
                    color: status === 'completed' || isCurrentWeek ? '#000' : '#fff'
                  }}>
                    {status === 'completed' ? '✓' : week.week_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      margin: 0,
                      marginBottom: '0.25rem'
                    }}>
                      {week.week_title}
                    </h4>
                    <p style={{
                      color: 'rgba(255,255,255,0.7)',
                      margin: 0,
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }}>
                      Target: {week.target_value} {week.target_unit} - {week.primary_target}
                    </p>
                  </div>
                  {status === 'upcoming' && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                      Binnenkort
                    </div>
                  )}
                </div>
                
                {/* Checkpoint */}
                {week.checkpoint_title && (
                  <div style={{
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    marginBottom: isCurrentWeek ? '1rem' : 0
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem'
                    }}>
                      Checkpoint:
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      color: 'rgba(255,255,255,0.9)'
                    }}>
                      {week.checkpoint_title}
                    </div>
                  </div>
                )}
                
                {/* Current Week Progress Tracker */}
                {isCurrentWeek && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px'
                  }}>
                    <h5 style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: 'bold',
                      color: categoryColor,
                      marginBottom: '1rem'
                    }}>
                      📊 Deze Week Bijhouden
                    </h5>
                    
                    <div style={{
                      display: 'grid',
                      gap: '1rem'
                    }}>
                      {/* Target Achievement */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '0.5rem'
                        }}>
                          Behaalde Waarde ({week.target_unit})
                        </label>
                        <input
                          type="number"
                          value={weekData.actual_value || ''}
                          onChange={(e) => setWeekProgress({
                            ...weekProgress,
                            [week.week_number]: {
                              ...weekData,
                              actual_value: parseFloat(e.target.value) || 0,
                              target_achieved: (parseFloat(e.target.value) || 0) >= week.target_value
                            }
                          })}
                          placeholder={`Target: ${week.target_value}`}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.75rem' : '1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: isMobile ? '1rem' : '1.125rem'
                          }}
                        />
                      </div>
                      
                      {/* Week Rating */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '0.5rem'
                        }}>
                          Hoe voelde deze week? (1-5 sterren)
                        </label>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          {[1,2,3,4,5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => setWeekProgress({
                                ...weekProgress,
                                [week.week_number]: {
                                  ...weekData,
                                  week_rating: rating
                                }
                              })}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: (weekData.week_rating || 0) >= rating 
                                  ? '#fbbf24' 
                                  : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                transition: 'all 0.2s',
                                touchAction: 'manipulation'
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Notes */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '0.5rem'
                        }}>
                          Notities (optioneel)
                        </label>
                        <textarea
                          value={weekData.notes || ''}
                          onChange={(e) => setWeekProgress({
                            ...weekProgress,
                            [week.week_number]: {
                              ...weekData,
                              notes: e.target.value
                            }
                          })}
                          placeholder="Hoe ging het? Wat ging goed? Wat was moeilijk?"
                          rows={3}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.75rem' : '1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      {/* Save Button */}
                      <button
                        onClick={() => updateWeekProgress(week.week_number, {
                          target_achieved: weekData.target_achieved || false,
                          actual_value: weekData.actual_value || 0,
                          target_value: week.target_value,
                          checkpoint_passed: (weekData.actual_value || 0) >= week.target_value,
                          week_rating: weekData.week_rating || 0,
                          notes: weekData.notes || '',
                          checkpoint_notes: ''
                        })}
                        disabled={!weekData.actual_value}
                        style={{
                          width: '100%',
                          padding: isMobile ? '0.875rem' : '1rem',
                          background: !weekData.actual_value 
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          borderRadius: '8px',
                          color: !weekData.actual_value ? 'rgba(255,255,255,0.5)' : '#000',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontWeight: 'bold',
                          cursor: !weekData.actual_value ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          touchAction: 'manipulation'
                        }}
                      >
                        Week {week.week_number} Opslaan
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Completed Week Summary */}
                {status === 'completed' && weekData.actual_value && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: weekData.notes ? '0.5rem' : 0
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#10b981',
                        fontWeight: 'bold'
                      }}>
                        Behaald: {weekData.actual_value} {week.target_unit}
                      </span>
                      {weekData.week_rating && (
                        <div style={{
                          display: 'flex',
                          gap: '0.125rem'
                        }}>
                          {Array.from({ length: weekData.week_rating }).map((_, i) => (
                            <span key={i} style={{ fontSize: '0.75rem' }}>⭐</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {weekData.notes && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.8)',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        "{weekData.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default ChallengeClientView
