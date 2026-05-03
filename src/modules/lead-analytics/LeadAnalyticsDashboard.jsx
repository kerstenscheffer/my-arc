// src/modules/lead-analytics/LeadAnalyticsDashboard.jsx
// VERSION 2.0 - DM PERFORMANCE FIRST, CLEAN GOLD DESIGN

import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Users, 
  Phone,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Calendar,
  Activity
} from 'lucide-react'
import LeadAnalyticsService from './LeadAnalyticsService'

// GOLD THEME
const GOLD = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  glow: 'rgba(212, 175, 55, 0.3)',
  border: 'rgba(212, 175, 55, 0.3)',
  bg: 'rgba(212, 175, 55, 0.08)'
}

export default function LeadAnalyticsDashboard({ db, coachId, isMobile }) {
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('today') // 'today' or 'week'
  
  // Activity metrics
  const [todayActivity, setTodayActivity] = useState(null)
  const [weekActivity, setWeekActivity] = useState(null)
  
  // DM Performance
  const [dmPhases, setDmPhases] = useState(null)
  const [phaseConversion, setPhaseConversion] = useState(null)
  const [pathPerformance, setPathPerformance] = useState(null)
  const [nodePerformance, setNodePerformance] = useState(null)
  
  // Expand states
  const [expandedSections, setExpandedSections] = useState({
    paths: false,
    nodes: false
  })

  const analyticsService = new LeadAnalyticsService(db)

  useEffect(() => {
    if (db && coachId) {
      loadAllAnalytics()
    }
  }, [db, coachId])

  const loadAllAnalytics = async () => {
    try {
      setLoading(true)
      
      const [
        today,
        week,
        phases,
        phaseConv,
        paths,
        nodes
      ] = await Promise.all([
        analyticsService.getTodayDMActivity(coachId),
        analyticsService.getWeekDMActivity(coachId),
        analyticsService.getDMPhaseDistribution(coachId),
        analyticsService.getPhaseConversion(coachId),
        analyticsService.getPathPerformance(coachId),
        analyticsService.getNodePerformance(coachId)
      ])

      setTodayActivity(today)
      setWeekActivity(week)
      setDmPhases(phases)
      setPhaseConversion(phaseConv)
      setPathPerformance(paths)
      setNodePerformance(nodes)
    } catch (error) {
      console.error('❌ Load analytics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const currentActivity = timeframe === 'today' ? todayActivity : weekActivity

  if (loading) {
    return (
      <div style={{ 
        minHeight: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${GOLD.bg}`,
          borderTopColor: GOLD.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0' : '0' }}>
      {/* SECTION 1: TODAY'S ACTIVITY - PROMINENT GOLD */}
      <div style={{
        background: `linear-gradient(135deg, ${GOLD.bg} 0%, rgba(212, 175, 55, 0.04) 100%)`,
        border: `1px solid ${GOLD.border}`,
        borderRadius: '12px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: `0 0 30px ${GOLD.glow}`
      }}>
        {/* Header with toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={24} color={GOLD.primary} />
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: GOLD.light,
              margin: 0
            }}>
              {timeframe === 'today' ? 'Vandaag' : 'Deze Week'}
            </h2>
            <span style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              {timeframe === 'today' 
                ? new Date().toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
                : `Week ${Math.ceil(new Date().getDate() / 7)}`
              }
            </span>
          </div>

          {/* Timeframe toggle */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.25rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setTimeframe('today')}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: timeframe === 'today' ? GOLD.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: timeframe === 'today' ? '#000' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Vandaag
            </button>
            <button
              onClick={() => setTimeframe('week')}
              style={{
                padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
                background: timeframe === 'week' ? GOLD.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: timeframe === 'week' ? '#000' : 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Deze Week
            </button>
          </div>
        </div>

        {/* Activity metrics */}
        {currentActivity && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {/* Messages */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <MessageCircle size={18} color="rgba(255, 255, 255, 0.5)" />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500'
                }}>
                  Berichten Verstuurd
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '800',
                color: GOLD.light
              }}>
                {currentActivity.messages_sent}
              </div>
            </div>

            {/* New Leads */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Users size={18} color="rgba(255, 255, 255, 0.5)" />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500'
                }}>
                  Nieuwe Leads
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '800',
                color: GOLD.light
              }}>
                {currentActivity.new_leads}
              </div>
            </div>

            {/* Calls Scheduled */}
            <div style={{
              padding: '1.25rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Phone size={18} color="rgba(255, 255, 255, 0.5)" />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '500'
                }}>
                  Calls Ingepland
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '800',
                color: '#10b981'
              }}>
                {currentActivity.calls_scheduled}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DM PERFORMANCE - ALWAYS OPEN */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: GOLD.bg,
            border: `1px solid ${GOLD.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={20} color={GOLD.primary} />
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            DM Automation Performance
          </h3>
        </div>

        {/* Phase overview */}
        {phaseConversion && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {Object.entries(phaseConversion)
              .filter(([_, data]) => data.total > 0)
              .map(([phase, data]) => {
                const isGood = data.rate >= 50
                const color = isGood ? '#10b981' : '#f97316'
                
                return (
                  <div 
                    key={phase}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${color}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#fff',
                        textTransform: 'capitalize'
                      }}>
                        {phase.replace('_', ' ')} Phase
                      </span>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: color
                      }}>
                        {data.rate}%
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {data.total} leads • {data.converted} calls geboekt
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* SECTION 3: PATH ANALYSIS - COLLAPSIBLE */}
      {pathPerformance && pathPerformance.paths.length > 0 && (
        <div style={{
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => toggleSection('paths')}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: expandedSections.paths ? '1rem' : 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {expandedSections.paths ? (
                  <ChevronDown size={20} color="rgba(255, 255, 255, 0.7)" />
                ) : (
                  <ChevronRight size={20} color="rgba(255, 255, 255, 0.7)" />
                )}
              </div>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                textAlign: 'left'
              }}>
                Beste Performing Paths
              </h3>
            </div>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              {pathPerformance.total_paths} paden
            </span>
          </button>

          {expandedSections.paths && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {pathPerformance.paths.slice(0, 5).map((path, index) => {
                const isTop = index === 0
                const color = path.conversion_rate >= 60 ? '#10b981' : 
                             path.conversion_rate >= 40 ? GOLD.primary : '#6b7280'
                
                return (
                  <div 
                    key={path.path}
                    style={{
                      padding: '1rem',
                      background: isTop ? GOLD.bg : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: isTop ? `1px solid ${GOLD.border}` : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          color: isTop ? GOLD.light : 'rgba(255, 255, 255, 0.8)',
                          fontWeight: '600',
                          marginBottom: '0.25rem',
                          lineHeight: '1.4'
                        }}>
                          {path.path}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {path.count} leads • {path.calls_scheduled} calls
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: color,
                        marginLeft: '1rem'
                      }}>
                        {path.conversion_rate}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: NODE PERFORMANCE - COLLAPSIBLE */}
      {nodePerformance && nodePerformance.nodes.length > 0 && (
        <div style={{
          background: 'rgba(17, 17, 17, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <button
            onClick={() => toggleSection('nodes')}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: expandedSections.nodes ? '1rem' : 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {expandedSections.nodes ? (
                  <ChevronDown size={20} color="rgba(255, 255, 255, 0.7)" />
                ) : (
                  <ChevronRight size={20} color="rgba(255, 255, 255, 0.7)" />
                )}
              </div>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                textAlign: 'left'
              }}>
                Bericht Performance
              </h3>
            </div>
            <span style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              {nodePerformance.nodes.length} berichten
            </span>
          </button>

          {expandedSections.nodes && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {nodePerformance.nodes.slice(0, 10).map((node, index) => {
                const isTop3 = index < 3
                const color = node.conversion_rate >= 60 ? '#10b981' : 
                             node.conversion_rate >= 40 ? GOLD.primary : 
                             node.conversion_rate >= 20 ? '#f97316' : '#6b7280'
                
                return (
                  <div 
                    key={node.node_name}
                    style={{
                      padding: '0.75rem 1rem',
                      background: isTop3 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: isTop3 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.85rem',
                        color: isTop3 ? '#10b981' : 'rgba(255, 255, 255, 0.8)',
                        fontWeight: '600'
                      }}>
                        {node.node_name}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginTop: '0.125rem'
                      }}>
                        {node.appearances} keer gebruikt
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: color
                    }}>
                      {node.conversion_rate}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
