// src/coach/pages/challenge-monitor/CallProgressView.jsx
// Shows call progress and history for 8-week challenge

import { useState, useEffect } from 'react'
import { Phone, Calendar, CheckCircle, TrendingUp, Clock } from 'lucide-react'

export default function CallProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [callData, setCallData] = useState({
    goal: null,
    current: 0,
    target: 0,
    history: [],
    lastCall: null,
    compliance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCallData()
  }, [client?.id, challengeData])

  async function loadCallData() {
    if (!client?.id || !challengeData) return

    try {
      // Load call goal
      const { data: goal } = await db.supabase
        .from('challenge_assignment_goals')
        .select('*')
        .eq('assignment_id', challengeData.id)
        .eq('goal_type', 'calls')
        .single()

      if (!goal) {
        setCallData({
          goal: null,
          current: 0,
          target: 0,
          history: [],
          lastCall: null,
          compliance: 0
        })
        setLoading(false)
        return
      }

      const current = goal.current_value || 0
      const target = goal.target_value || 0
      const compliance = target > 0 ? Math.round((current / target) * 100) : 0

      // Calculate expected calls based on current week
      const expectedCalls = Math.ceil((challengeData.currentWeek / 8) * target)

      setCallData({
        goal,
        current,
        target,
        expected: expectedCalls,
        history: [], // Call history not tracked in detail yet
        lastCall: goal.updated_at,
        compliance
      })
    } catch (error) {
      console.error('❌ Error loading call data:', error)
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
        Loading call data...
      </div>
    )
  }

  if (!callData.goal) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <Phone size={48} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '1rem' }} />
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Nog geen call goal ingesteld voor deze challenge
        </div>
      </div>
    )
  }

  const isOnTrack = callData.current >= callData.expected
  const remaining = Math.max(0, callData.target - callData.current)

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
        {/* Current Calls */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Phone size={20} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {callData.current}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Completed
          </div>
        </div>

        {/* Target */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <CheckCircle size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {callData.target}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Target
          </div>
        </div>

        {/* Remaining */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <TrendingUp size={20} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {remaining}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Remaining
          </div>
        </div>

        {/* Compliance */}
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
            {callData.compliance}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Compliance
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            Call Progress
          </span>
          <span style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            color: '#3b82f6'
          }}>
            {callData.current}/{callData.target}
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Expected progress line */}
          <div style={{
            position: 'absolute',
            left: `${(callData.expected / callData.target) * 100}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'rgba(251, 191, 36, 0.6)',
            zIndex: 1
          }} />
          
          {/* Actual progress */}
          <div style={{
            width: `${callData.compliance}%`,
            height: '100%',
            background: callData.compliance >= 100 
              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '6px',
            transition: 'width 0.5s ease'
          }} />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Expected: {callData.expected} calls
          </span>
          <span style={{
            fontSize: '0.75rem',
            color: isOnTrack ? '#10b981' : '#fbbf24',
            fontWeight: '600'
          }}>
            {isOnTrack ? '✅ On Track' : '⚠️ Behind Schedule'}
          </span>
        </div>
      </div>

      {/* Status Card */}
      <div style={{
        background: isOnTrack 
          ? 'rgba(16, 185, 129, 0.15)' 
          : 'rgba(251, 191, 36, 0.15)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: `1px solid ${isOnTrack ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {isOnTrack ? (
            <CheckCircle size={24} color="#10b981" />
          ) : (
            <Clock size={24} color="#fbbf24" />
          )}
          <div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {isOnTrack ? 'Great Progress!' : 'Needs Attention'}
            </div>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {isOnTrack 
                ? `${callData.current - callData.expected} call${callData.current - callData.expected !== 1 ? 's' : ''} ahead of schedule`
                : `${callData.expected - callData.current} call${callData.expected - callData.current !== 1 ? 's' : ''} behind schedule`
              }
            </div>
          </div>
        </div>

        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.5'
        }}>
          💡 <strong>Tip:</strong> Plan regelmatig check-in calls om op schema te blijven. 
          Week {challengeData.currentWeek} van 8 betekent {callData.expected} verwachte calls op dit moment.
        </div>
      </div>

      {/* Week Breakdown */}
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
          Challenge Timeline
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
            const isCurrentWeek = week === challengeData.currentWeek
            const isPastWeek = week < challengeData.currentWeek
            const callsPerWeek = callData.target / 8
            const expectedForWeek = Math.ceil(week * callsPerWeek)
            const isCompleteForWeek = callData.current >= expectedForWeek

            return (
              <div
                key={week}
                style={{
                  background: isCurrentWeek 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.875rem' : '1rem',
                  border: `1px solid ${isCurrentWeek 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      color: isCurrentWeek ? '#3b82f6' : '#fff'
                    }}>
                      Week {week}
                    </span>
                    {isCurrentWeek && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontWeight: '600'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      Target: {expectedForWeek}
                    </span>
                    {isPastWeek && (
                      isCompleteForWeek ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <Clock size={16} color="#fbbf24" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Last Update Info */}
      {callData.lastCall && (
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
          Laatste update: {new Date(callData.lastCall).toLocaleDateString('nl-NL', {
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
