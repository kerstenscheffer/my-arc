// src/coach/pages/challenge-monitor/WeightProgressView.jsx
// ✅ FIXED VERSION - Now uses weight_challenge_logs (matches adjustments & banner)

import { useState, useEffect } from 'react'
import { Scale, TrendingDown, TrendingUp, Calendar, Target } from 'lucide-react'

export default function WeightProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [weightData, setWeightData] = useState({
    history: [],
    startWeight: null,
    currentWeight: null,
    targetWeight: null,
    totalChange: 0,
    weeklyAverage: 0,
    lastWeighIn: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeightData()
  }, [client?.id, challengeData])

  async function loadWeightData() {
    if (!client?.id || !challengeData) return

    try {
      const startDate = new Date(challengeData.start_date)
      const endDate = new Date(challengeData.end_date)
      
      // ✅ FIX: Load from weight_challenge_logs table (NOT weight_history)
      const { data: weights } = await db.supabase
        .from('weight_challenge_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      // ✅ FIX: Also get challenge goal for target weight
      const { data: goal } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challengeData.id)
        .eq('goal_type', 'weight')
        .single()

      if (!weights || weights.length === 0) {
        setWeightData({
          history: [],
          startWeight: null,
          currentWeight: null,
          targetWeight: goal?.target_value || null,
          totalChange: 0,
          weeklyAverage: 0,
          lastWeighIn: null
        })
        setLoading(false)
        return
      }

      const startWeight = weights[0].weight
      const currentWeight = weights[weights.length - 1].weight
      const totalChange = currentWeight - startWeight
      const weeksPassed = challengeData.currentWeek || 1
      const weeklyAverage = totalChange / weeksPassed

      // Group by week for display
      const byWeek = {}
      weights.forEach(entry => {
        const entryDate = new Date(entry.date)
        const daysSinceStart = Math.floor((entryDate - startDate) / (1000 * 60 * 60 * 24))
        const weekNum = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
        
        if (!byWeek[weekNum]) {
          byWeek[weekNum] = []
        }
        byWeek[weekNum].push(entry)
      })

      setWeightData({
        history: weights,
        byWeek,
        startWeight,
        currentWeight,
        targetWeight: goal?.target_value || null,
        totalChange,
        weeklyAverage,
        lastWeighIn: weights[weights.length - 1].date
      })
    } catch (error) {
      console.error('❌ Error loading weight data:', error)
    } finally {
      setLoading(false)
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
        Loading weight data...
      </div>
    )
  }

  if (!weightData.history || weightData.history.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <Scale size={48} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '1rem' }} />
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Nog geen weight-ins voor deze challenge
        </div>
      </div>
    )
  }

  const isLosing = weightData.totalChange < 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Start Weight */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Scale size={20} color="#6b7280" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.startWeight?.toFixed(1)}kg
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Start
          </div>
        </div>

        {/* Current Weight */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Scale size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.currentWeight?.toFixed(1)}kg
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Current
          </div>
        </div>

        {/* Total Change */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          {isLosing ? (
            <TrendingDown size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          ) : (
            <TrendingUp size={20} color="#ef4444" style={{ marginBottom: '0.5rem' }} />
          )}
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: isLosing ? '#10b981' : '#ef4444',
            marginBottom: '0.25rem'
          }}>
            {weightData.totalChange > 0 ? '+' : ''}{weightData.totalChange.toFixed(1)}kg
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Total Change
          </div>
        </div>

        {/* Weekly Average */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Calendar size={20} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.weeklyAverage > 0 ? '+' : ''}{weightData.weeklyAverage.toFixed(2)}kg
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Per Week
          </div>
        </div>
      </div>

      {/* Target Weight (if exists) */}
      {weightData.targetWeight && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Target size={20} color="#10b981" />
            <div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.15rem'
              }}>
                Doel gewicht
              </div>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {weightData.targetWeight.toFixed(1)}kg
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.15rem'
            }}>
              Nog te gaan
            </div>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.2rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              {(weightData.currentWeight - weightData.targetWeight).toFixed(1)}kg
            </div>
          </div>
        </div>
      )}

      {/* Week by Week History */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={18} />
          Weight History per Week
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
            const weekWeights = weightData.byWeek?.[week] || []
            const isCurrentWeek = week === challengeData.currentWeek
            const latestWeight = weekWeights[weekWeights.length - 1]

            return (
              <div
                key={week}
                style={{
                  background: isCurrentWeek 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.875rem' : '1rem',
                  border: `1px solid ${isCurrentWeek 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: weekWeights.length > 0 ? '0.5rem' : 0
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      color: isCurrentWeek ? '#10b981' : '#fff'
                    }}>
                      Week {week}
                    </span>
                    {isCurrentWeek && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: '4px',
                        color: '#34d399',
                        fontWeight: '600'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>

                  {latestWeight && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        {latestWeight.weight.toFixed(1)}kg
                      </span>
                      <Scale size={16} color="#10b981" />
                    </div>
                  )}
                </div>

                {/* Weight entries */}
                {weekWeights.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {weekWeights.map((entry, idx) => {
                      const entryDate = new Date(entry.date)
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '0.35rem 0.6rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.75rem',
                            color: '#34d399',
                            fontWeight: '500'
                          }}
                        >
                          {entryDate.toLocaleDateString('nl-NL', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}: {entry.weight.toFixed(1)}kg
                        </div>
                      )
                    })}
                  </div>
                )}

                {weekWeights.length === 0 && week <= challengeData.currentWeek && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontStyle: 'italic'
                  }}>
                    Geen weigh-ins deze week
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Last Weigh-in Info */}
      {weightData.lastWeighIn && (
        <div style={{
          marginTop: '1.5rem',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center'
        }}>
          Laatste weigh-in: {new Date(weightData.lastWeighIn).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      )}
    </div>
  )
}
