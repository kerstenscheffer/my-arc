import { useState, useEffect } from 'react'
import { Activity, Clock, UserPlus, Edit, CheckCircle, Calendar } from 'lucide-react'

export default function ActivityTab({ lead, leadService, isMobile }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [lead.id])

  const loadActivities = async () => {
    setLoading(true)
    try {
      // Generate activity timeline from lead data
      const timeline = []

      // Created event
      timeline.push({
        id: 'created',
        type: 'created',
        timestamp: lead.created_at,
        description: 'Lead aangemaakt',
        icon: UserPlus,
        color: '#3b82f6'
      })

      // Status changes (inferred from current status)
      if (lead.last_contacted_at) {
        timeline.push({
          id: 'contacted',
          type: 'status_change',
          timestamp: lead.last_contacted_at,
          description: 'Status gewijzigd naar Benaderd',
          icon: Edit,
          color: '#f97316'
        })
      }

      if (lead.scheduled_at) {
        timeline.push({
          id: 'scheduled',
          type: 'status_change',
          timestamp: lead.scheduled_at,
          description: 'Status gewijzigd naar Gepland',
          icon: Calendar,
          color: '#8b5cf6'
        })
      }

      if (lead.conversion_date) {
        timeline.push({
          id: 'converted',
          type: 'status_change',
          timestamp: lead.conversion_date,
          description: 'Lead geconverteerd naar klant',
          icon: CheckCircle,
          color: '#10b981'
        })
      }

      // Sort by timestamp (newest first)
      timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setActivities(timeline)
    } catch (error) {
      console.error('❌ Load activities failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return diffMins < 1 ? 'Zojuist' : `${diffMins} min geleden`
      }
      return `${diffHours} uur geleden`
    } else if (diffDays === 1) {
      return 'Gisteren'
    } else if (diffDays < 7) {
      return `${diffDays} dagen geleden`
    } else {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        flexDirection: 'column',
        gap: '1rem',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center'
      }}>
        <Activity size={48} style={{ opacity: 0.3 }} />
        <div>
          <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            Geen activiteit gevonden
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Er zijn nog geen activiteiten voor deze lead
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative'
    }}>
      {/* Timeline */}
      <div style={{
        position: 'relative',
        paddingLeft: isMobile ? '2.5rem' : '3rem'
      }}>
        {/* Timeline Line */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '1rem' : '1.25rem',
          top: '1.5rem',
          bottom: '1.5rem',
          width: '2px',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.05) 100%)'
        }} />

        {/* Activity Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {activities.map((activity, index) => {
            const IconComponent = activity.icon

            return (
              <div
                key={activity.id}
                style={{
                  position: 'relative',
                  animation: `slideIn 0.3s ease ${index * 0.1}s both`
                }}
              >
                {/* Icon Dot */}
                <div style={{
                  position: 'absolute',
                  left: isMobile ? '-2.5rem' : '-3rem',
                  top: '0.25rem',
                  width: isMobile ? '32px' : '36px',
                  height: isMobile ? '32px' : '36px',
                  borderRadius: '50%',
                  background: `${activity.color}20`,
                  border: `2px solid ${activity.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${activity.color}40`
                }}>
                  <IconComponent size={isMobile ? 14 : 16} color={activity.color} />
                </div>

                {/* Activity Card */}
                <div style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderLeft: `3px solid ${activity.color}`,
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <h4 style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '600',
                      color: '#fff',
                      margin: 0
                    }}>
                      {activity.description}
                    </h4>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      <Clock size={12} />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>

                  {/* Full Timestamp */}
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem',
                    margin: 0
                  }}>
                    {new Date(activity.timestamp).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '2rem',
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.8rem',
              fontWeight: '500',
              marginBottom: '0.35rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Totaal activiteiten
            </div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              {activities.length}
            </div>
          </div>

          {lead.response_time_hours && (
            <div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8rem',
                fontWeight: '500',
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Reactietijd
              </div>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {lead.response_time_hours}u
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
