// src/coach/pages/challenge-monitor/WeightProgressView.jsx
import { useState, useEffect } from 'react'
import { Scale, TrendingDown, Calendar, Target } from 'lucide-react'

export default function WeightProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [weightData, setWeightData] = useState({
    entries: [],
    startWeight: 0,
    currentWeight: 0,
    totalLoss: 0,
    fridayCount: 0,
    targetWeight: client?.target_weight || 0
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
      
      // Load all weight logs
      const { data: weights } = await db.supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      // Count Friday weigh-ins
      const fridayWeights = weights?.filter(w => {
        const date = new Date(w.date)
        return date.getDay() === 5 // Friday
      }) || []

      const startWeight = weights?.[0]?.weight || client?.current_weight || 0
      const currentWeight = weights?.[weights.length - 1]?.weight || client?.current_weight || 0
      const totalLoss = startWeight - currentWeight

      setWeightData({
        entries: weights || [],
        startWeight,
        currentWeight,
        totalLoss,
        fridayCount: fridayWeights.length,
        targetWeight: client?.target_weight || 0
      })
    } catch (error) {
      console.error('Error loading weight data:', error)
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

  const progressToTarget = weightData.targetWeight > 0
    ? Math.round(((weightData.startWeight - weightData.currentWeight) / 
        (weightData.startWeight - weightData.targetWeight)) * 100)
    : 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Scale size={20} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.currentWeight.toFixed(1)}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Current (kg)
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <TrendingDown size={20} color={weightData.totalLoss > 0 ? "#10b981" : "#ef4444"} 
            style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: weightData.totalLoss > 0 ? '#10b981' : '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.totalLoss > 0 ? '-' : '+'}{Math.abs(weightData.totalLoss).toFixed(1)}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Total (kg)
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Calendar size={20} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {weightData.fridayCount}/8
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Fridays
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Target size={20} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {progressToTarget}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            To Goal
          </div>
        </div>
      </div>

      {/* Weight Entries List */}
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
          <Scale size={18} />
          Weight Log History
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {weightData.entries.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem'
            }}>
              No weight entries yet
            </div>
          ) : (
            weightData.entries.map((entry, idx) => {
              const date = new Date(entry.date)
              const isFriday = date.getDay() === 5
              const change = idx > 0 
                ? entry.weight - weightData.entries[idx - 1].weight
                : 0

              return (
                <div
                  key={entry.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: isFriday 
                      ? 'rgba(251, 191, 36, 0.1)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: `1px solid ${isFriday 
                      ? 'rgba(251, 191, 36, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Scale size={16} color={isFriday ? '#fbbf24' : 'rgba(255, 255, 255, 0.5)'} />
                    <div>
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        fontWeight: '500',
                        color: '#fff'
                      }}>
                        {date.toLocaleDateString('nl-NL', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                      {isFriday && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#fbbf24',
                          marginTop: '0.1rem'
                        }}>
                          Friday Weigh-in
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '600',
                      color: '#fff'
                    }}>
                      {entry.weight.toFixed(1)} kg
                    </span>
                    {idx > 0 && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: change < 0 ? '#10b981' : change > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.5)'
                      }}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
