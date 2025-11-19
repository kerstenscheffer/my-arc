// src/coach/pages/challenge-monitor/LastActivityView.jsx
// NEW COMPONENT - Shows last activity across all challenge metrics

import { useState, useEffect } from 'react'
import { Activity, Clock, Calendar, Phone, Scale, Camera, Dumbbell, AlertCircle } from 'lucide-react'

export default function LastActivityView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    lastActivity: null,
    daysSinceActivity: 0,
    isActive: false
  })

  useEffect(() => {
    loadLastActivities()
  }, [client?.id, challengeData])

  async function loadLastActivities() {
    if (!client?.id || !challengeData) return

    try {
      const startDate = new Date(challengeData.start_date)
      const today = new Date()
      
      const activityPromises = [
        // Last weigh-in
        db.supabase
          .from('weight_history')
          .select('date, weight')
          .eq('client_id', client.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(1)
          .single(),
        
        // Last workout
        db.supabase
          .from('workout_completions')
          .select('workout_date, completed')
          .eq('client_id', client.id)
          .eq('completed', true)
          .gte('workout_date', startDate.toISOString().split('T')[0])
          .order('workout_date', { ascending: false })
          .limit(1)
          .single(),
        
        // Last photo
        db.supabase
          .from('progress_photos')
          .select('created_at, photo_type')
          .eq('client_id', client.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        
        // Last call (check challenge_assignment_goals for calls)
        db.supabase
          .from('challenge_assignment_goals')
          .select('updated_at, current_value, goal_type')
          .eq('assignment_id', challengeData.id)
          .eq('goal_type', 'calls')
          .single()
      ]

      const results = await Promise.all(activityPromises)
      
      const activityList = []
      
      // Process weigh-in
      if (results[0].data) {
        activityList.push({
          type: 'weight',
          label: 'Weigh-in',
          icon: Scale,
          color: '#10b981',
          date: results[0].data.date,
          value: `${results[0].data.weight}kg`,
          timestamp: new Date(results[0].data.date)
        })
      }
      
      // Process workout
      if (results[1].data) {
        activityList.push({
          type: 'workout',
          label: 'Workout',
          icon: Dumbbell,
          color: '#f97316',
          date: results[1].data.workout_date,
          value: 'Completed',
          timestamp: new Date(results[1].data.workout_date)
        })
      }
      
      // Process photo
      if (results[2].data) {
        activityList.push({
          type: 'photo',
          label: 'Progress Photo',
          icon: Camera,
          color: '#8b5cf6',
          date: results[2].data.created_at.split('T')[0],
          value: results[2].data.photo_type || 'Photo',
          timestamp: new Date(results[2].data.created_at)
        })
      }
      
      // Process calls
      if (results[3].data && results[3].data.updated_at) {
        activityList.push({
          type: 'call',
          label: 'Calls',
          icon: Phone,
          color: '#3b82f6',
          date: results[3].data.updated_at.split('T')[0],
          value: `${results[3].data.current_value || 0} calls`,
          timestamp: new Date(results[3].data.updated_at)
        })
      }

      // Sort by most recent
      activityList.sort((a, b) => b.timestamp - a.timestamp)
      
      // Calculate summary
      const mostRecent = activityList[0]
      const daysSince = mostRecent 
        ? Math.floor((today - mostRecent.timestamp) / (1000 * 60 * 60 * 24))
        : 999
      
      setSummary({
        lastActivity: mostRecent,
        daysSinceActivity: daysSince,
        isActive: daysSince <= 3 // Active if activity within last 3 days
      })
      
      setActivities(activityList)
      
    } catch (error) {
      console.error('❌ Error loading last activities:', error)
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
        Loading activity data...
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(99, 102, 241, 0.2)'
    }}>
      {/* Summary Card */}
      <div style={{
        background: summary.isActive 
          ? 'rgba(16, 185, 129, 0.15)' 
          : 'rgba(239, 68, 68, 0.15)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: `1px solid ${summary.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {summary.isActive ? (
              <Activity size={24} color="#10b981" />
            ) : (
              <AlertCircle size={24} color="#ef4444" />
            )}
            <div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.25rem'
              }}>
                Status
              </div>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: summary.isActive ? '#10b981' : '#ef4444'
              }}>
                {summary.isActive ? '✅ Actief' : '⚠️ Inactief'}
              </div>
            </div>
          </div>

          {summary.lastActivity && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.25rem'
              }}>
                Laatste activiteit
              </div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                {summary.daysSinceActivity === 0 
                  ? 'Vandaag' 
                  : summary.daysSinceActivity === 1 
                  ? 'Gisteren'
                  : `${summary.daysSinceActivity} dagen geleden`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities List */}
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
          <Clock size={18} />
          Recente Activiteiten
        </h3>

        {activities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '2rem 1rem' : '2.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <AlertCircle size={48} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '1rem' }} />
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Nog geen activiteit geregistreerd
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {activities.map((activity, idx) => {
              const Icon = activity.icon
              const activityDate = new Date(activity.date)
              const today = new Date()
              const daysDiff = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24))
              
              let timeLabel = ''
              if (daysDiff === 0) timeLabel = 'Vandaag'
              else if (daysDiff === 1) timeLabel = 'Gisteren'
              else if (daysDiff <= 7) timeLabel = `${daysDiff} dagen geleden`
              else timeLabel = activityDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

              return (
                <div
                  key={idx}
                  style={{
                    background: idx === 0 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: isMobile ? '0.875rem' : '1rem',
                    border: `1px solid ${idx === 0 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}>
                    {/* Left: Icon + Type */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${activity.color}20`,
                        border: `1px solid ${activity.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={20} color={activity.color} />
                      </div>
                      <div>
                        <div style={{
                          fontSize: isMobile ? '0.9rem' : '0.95rem',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.15rem'
                        }}>
                          {activity.label}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          {activity.value}
                        </div>
                      </div>
                    </div>

                    {/* Right: Time */}
                    <div style={{
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Calendar size={14} color="rgba(255, 255, 255, 0.5)" />
                      <span style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}>
                        {timeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Most recent indicator */}
                  {idx === 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '4px',
                        color: '#818cf8',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Meest Recent
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Guidelines */}
      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '0.875rem' : '1rem',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.5'
      }}>
        <strong>📊 Activiteit Guidelines:</strong><br />
        • ✅ Actief: Activiteit binnen 3 dagen<br />
        • ⚠️ Inactief: Geen activiteit 3+ dagen<br />
        • Check-in frequentie: Min. 2x per week aanbevolen
      </div>
    </div>
  )
}
