// src/modules/qualification-funnel/FunnelDashboard.jsx
// MY ARC Funnel Analytics Dashboard - Track conversions & drop-offs

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Users, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Target,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Database,
  HardDrive
} from 'lucide-react'
import { funnelTheme } from './funnelTheme'

// Step names for display
const STEP_NAMES = {
  landing: 'Landing',
  filter: 'Filter Vraag',
  commitment: 'Commitment',
  social_proof: 'Social Proof',
  calendly: 'Calendly',
  confirmation: 'Geboekt ✓'
}

const STEP_ORDER = ['landing', 'filter', 'commitment', 'social_proof', 'calendly', 'confirmation']

export default function FunnelDashboard({ db, isMobile: propIsMobile }) {
  const [isMobile, setIsMobile] = useState(propIsMobile ?? window.innerWidth <= 768)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState({})
  const [timeRange, setTimeRange] = useState('all') // all, today, week
  const [dataSource, setDataSource] = useState('supabase') // supabase, local

  useEffect(() => {
    loadAnalytics()
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reload when time range or data source changes
  useEffect(() => {
    loadAnalytics()
  }, [timeRange, dataSource])

  const loadAnalytics = async () => {
    setLoading(true)
    
    try {
      if (dataSource === 'supabase' && db?.supabase) {
        await loadFromSupabase()
      } else {
        loadFromLocalStorage()
      }
    } catch (e) {
      console.error('Error loading analytics:', e)
      // Fallback to localStorage
      loadFromLocalStorage()
    }
    
    setLoading(false)
  }

  const loadFromSupabase = async () => {
    try {
      // Build date filter
      let dateFilter = null
      const now = new Date()
      
      if (timeRange === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      } else if (timeRange === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString()
      }

      // Fetch sessions
      let sessionsQuery = db.supabase
        .from('funnel_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (dateFilter) {
        sessionsQuery = sessionsQuery.gte('created_at', dateFilter)
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery

      if (sessionsError) throw sessionsError

      // Fetch events for step stats
      let eventsQuery = db.supabase
        .from('funnel_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (dateFilter) {
        eventsQuery = eventsQuery.gte('created_at', dateFilter)
      }

      const { data: events, error: eventsError } = await eventsQuery

      if (eventsError) throw eventsError

      // Process the data
      const processed = processSupabaseData(sessions || [], events || [])
      setAnalytics(processed)
      
    } catch (e) {
      console.error('Supabase load error:', e)
      loadFromLocalStorage()
    }
  }

  const processSupabaseData = (sessions, events) => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        conversionRate: 0,
        stepStats: {},
        dropOffReasons: {},
        avgTimePerStep: {},
        avgTotalTime: 0,
        sessions: [],
        recentDropOffs: []
      }
    }

    // Count stats
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed).length
    const conversionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0

    // Calculate step stats from events
    const stepCounts = {}
    const stepTimes = {}
    const dropOffReasons = {}
    const recentDropOffs = []

    STEP_ORDER.forEach(step => {
      stepCounts[step] = 0
      stepTimes[step] = []
    })

    events.forEach(event => {
      if (event.event_type === 'step_view' && stepCounts[event.step] !== undefined) {
        stepCounts[event.step]++
      }

      if (event.event_type === 'step_time' && event.event_data?.duration_seconds) {
        if (!stepTimes[event.step]) stepTimes[event.step] = []
        stepTimes[event.step].push(event.event_data.duration_seconds)
      }

      if (event.event_type === 'drop_off') {
        const reason = `${event.step}: ${event.event_data?.reason || 'unknown'}`
        dropOffReasons[reason] = (dropOffReasons[reason] || 0) + 1
        
        recentDropOffs.push({
          step: event.step,
          reason: event.event_data?.reason,
          time: event.timestamp,
          timeOnStep: event.event_data?.time_on_step_seconds
        })
      }
    })

    // Calculate averages
    const avgTimePerStep = {}
    Object.keys(stepTimes).forEach(step => {
      const times = stepTimes[step]
      avgTimePerStep[step] = times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
    })

    // Calculate avg total time from completed sessions
    const completedWithTime = sessions.filter(s => s.completed && s.total_time_seconds)
    const avgTotalTime = completedWithTime.length > 0
      ? Math.round(completedWithTime.reduce((a, b) => a + b.total_time_seconds, 0) / completedWithTime.length)
      : 0

    // Calculate step stats
    const stepStats = {}
    const landingCount = stepCounts.landing || 1

    STEP_ORDER.forEach((step, index) => {
      const count = stepCounts[step]
      const prevCount = index > 0 ? stepCounts[STEP_ORDER[index - 1]] : count
      const dropOffRate = prevCount > 0 ? Math.round((1 - count / prevCount) * 100) : 0
      const percentage = Math.round((count / landingCount) * 100)

      stepStats[step] = {
        count,
        percentage,
        dropOffRate: index > 0 ? dropOffRate : 0,
        avgTime: avgTimePerStep[step] || 0
      }
    })

    // Format sessions for display
    const formattedSessions = sessions.slice(0, 20).map(session => ({
      summary: {
        session_id: session.session_id,
        current_step: session.current_step,
        completed: session.completed,
        total_time_seconds: session.total_time_seconds,
        experience_level: session.experience_level,
        committed: session.committed,
        is_mobile: session.is_mobile
      },
      flushed_at: session.created_at
    }))

    return {
      totalSessions,
      completedSessions,
      conversionRate,
      stepStats,
      dropOffReasons,
      avgTimePerStep,
      avgTotalTime,
      sessions: formattedSessions,
      recentDropOffs: recentDropOffs.slice(-10).reverse()
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('funnel_analytics') || '[]')
      const processed = processLocalData(stored)
      setAnalytics(processed)
    } catch (e) {
      console.error('LocalStorage load error:', e)
      setAnalytics(null)
    }
  }

  const processLocalData = (sessions) => {
    return processAnalytics(sessions)
  }

  const clearAnalytics = async () => {
    if (confirm('Weet je zeker dat je alle analytics wilt wissen?')) {
      if (dataSource === 'supabase' && db?.supabase) {
        // Clear from Supabase
        await db.supabase.from('funnel_events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await db.supabase.from('funnel_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      }
      localStorage.removeItem('funnel_analytics')
      localStorage.removeItem('funnel_analytics_backup')
      loadAnalytics()
    }
  }

  const processAnalytics = (sessions) => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        conversionRate: 0,
        stepStats: {},
        dropOffReasons: {},
        avgTimePerStep: {},
        avgTotalTime: 0,
        sessions: [],
        recentDropOffs: []
      }
    }

    // Filter by time range
    const now = Date.now()
    const filteredSessions = sessions.filter(session => {
      if (timeRange === 'all') return true
      const sessionTime = new Date(session.flushed_at).getTime()
      if (timeRange === 'today') {
        return now - sessionTime < 24 * 60 * 60 * 1000
      }
      if (timeRange === 'week') {
        return now - sessionTime < 7 * 24 * 60 * 60 * 1000
      }
      return true
    })

    const stepCounts = {}
    const stepCompletions = {}
    const stepTimes = {}
    const dropOffReasons = {}
    const totalTimes = []
    const recentDropOffs = []

    STEP_ORDER.forEach(step => {
      stepCounts[step] = 0
      stepCompletions[step] = 0
      stepTimes[step] = []
    })

    filteredSessions.forEach(session => {
      const { events, summary } = session

      // Count step views
      events.forEach(event => {
        if (event.event === 'step_view' && stepCounts[event.step] !== undefined) {
          stepCounts[event.step]++
        }

        if (event.event === 'step_complete' && stepCompletions[event.step] !== undefined) {
          stepCompletions[event.step]++
        }

        if (event.event === 'step_time' && event.duration_seconds) {
          if (!stepTimes[event.step]) stepTimes[event.step] = []
          stepTimes[event.step].push(event.duration_seconds)
        }

        if (event.event === 'drop_off') {
          const reason = `${event.step}: ${event.reason}`
          dropOffReasons[reason] = (dropOffReasons[reason] || 0) + 1
          
          recentDropOffs.push({
            step: event.step,
            reason: event.reason,
            time: event.timestamp,
            timeOnStep: event.time_on_step_seconds
          })
        }

        if (event.event === 'funnel_complete' && event.total_time_seconds) {
          totalTimes.push(event.total_time_seconds)
        }
      })
    })

    // Calculate averages
    const avgTimePerStep = {}
    Object.keys(stepTimes).forEach(step => {
      const times = stepTimes[step]
      avgTimePerStep[step] = times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
    })

    const avgTotalTime = totalTimes.length > 0
      ? Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length)
      : 0

    // Calculate step stats with drop-off rates
    const stepStats = {}
    const landingCount = stepCounts.landing || 1

    STEP_ORDER.forEach((step, index) => {
      const count = stepCounts[step]
      const prevCount = index > 0 ? stepCounts[STEP_ORDER[index - 1]] : count
      const dropOffRate = prevCount > 0 ? Math.round((1 - count / prevCount) * 100) : 0
      const percentage = Math.round((count / landingCount) * 100)

      stepStats[step] = {
        count,
        percentage,
        dropOffRate: index > 0 ? dropOffRate : 0,
        avgTime: avgTimePerStep[step] || 0
      }
    })

    const completedCount = stepCounts.confirmation || 0
    const conversionRate = landingCount > 0 
      ? Math.round((completedCount / landingCount) * 100) 
      : 0

    return {
      totalSessions: filteredSessions.length,
      completedSessions: completedCount,
      conversionRate,
      stepStats,
      dropOffReasons,
      avgTimePerStep,
      avgTotalTime,
      sessions: filteredSessions.slice(-20).reverse(),
      recentDropOffs: recentDropOffs.slice(-10).reverse()
    }
  }

  // Reload when time range changes
  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const toggleSession = (index) => {
    setExpandedSessions(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `2px solid ${funnelTheme.borderSubtle}`,
          borderTopColor: funnelTheme.gold,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      padding: isMobile ? '1rem' : '2rem',
      color: '#fff'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <BarChart3 size={isMobile ? 24 : 28} color={funnelTheme.gold} />
              Funnel Analytics
            </h1>
            <p style={{ color: funnelTheme.textMuted, fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
              Track waar bezoekers afhaken
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            {/* Data source toggle */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setDataSource('supabase')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  background: dataSource === 'supabase' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderLeft: 'none',
                  borderRight: `1px solid ${funnelTheme.borderSubtle}`,
                  color: dataSource === 'supabase' ? funnelTheme.gold : '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Database size={14} />
                Supabase
              </button>
              <button
                onClick={() => setDataSource('local')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  background: dataSource === 'local' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: 'none',
                  color: dataSource === 'local' ? funnelTheme.gold : '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <HardDrive size={14} />
                Local
              </button>
            </div>

            {/* Time range selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                borderRadius: '0',
                padding: '0.5rem 1rem',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle tijd</option>
              <option value="today">Vandaag</option>
              <option value="week">Deze week</option>
            </select>

            <button
              onClick={loadAnalytics}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                borderRadius: '0',
                padding: '0.5rem 1rem',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              onClick={clearAnalytics}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0',
                padding: '0.5rem 1rem',
                color: '#ef4444',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </div>

        {/* No data state */}
        {(!analytics || analytics.totalSessions === 0) && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${funnelTheme.borderSubtle}`,
            padding: isMobile ? '2rem 1.5rem' : '3rem',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} color={funnelTheme.textMuted} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Geen data nog</h3>
            <p style={{ color: funnelTheme.textMuted }}>
              Start de funnel om analytics te verzamelen
            </p>
          </div>
        )}

        {analytics && analytics.totalSessions > 0 && (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem',
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              {/* Total Sessions */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                padding: isMobile ? '1rem' : '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Users size={16} color={funnelTheme.textMuted} />
                  <span style={{ fontSize: '0.75rem', color: funnelTheme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Bezoekers
                  </span>
                </div>
                <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', margin: 0 }}>
                  {analytics.totalSessions}
                </p>
              </div>

              {/* Completed */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.05)',
                border: `1px solid ${funnelTheme.borderGold}`,
                padding: isMobile ? '1rem' : '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Target size={16} color={funnelTheme.gold} />
                  <span style={{ fontSize: '0.75rem', color: funnelTheme.gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Geboekt
                  </span>
                </div>
                <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', margin: 0, color: funnelTheme.gold }}>
                  {analytics.completedSessions}
                </p>
              </div>

              {/* Conversion Rate */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                padding: isMobile ? '1rem' : '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <TrendingUp size={16} color="#10b981" />
                  <span style={{ fontSize: '0.75rem', color: funnelTheme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Conversie
                  </span>
                </div>
                <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', margin: 0, color: '#10b981' }}>
                  {analytics.conversionRate}%
                </p>
              </div>

              {/* Avg Time */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                padding: isMobile ? '1rem' : '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Clock size={16} color={funnelTheme.textMuted} />
                  <span style={{ fontSize: '0.75rem', color: funnelTheme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gem. Tijd
                  </span>
                </div>
                <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', margin: 0 }}>
                  {formatTime(analytics.avgTotalTime)}
                </p>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              padding: isMobile ? '1.25rem' : '2rem',
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                fontWeight: '700',
                marginBottom: isMobile ? '1.25rem' : '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingDown size={18} color={funnelTheme.gold} />
                Funnel Overzicht
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
                {STEP_ORDER.map((step, index) => {
                  const stats = analytics.stepStats[step]
                  if (!stats) return null

                  return (
                    <div key={step}>
                      {/* Step row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0.75rem' : '1rem'
                      }}>
                        {/* Step name */}
                        <div style={{
                          width: isMobile ? '80px' : '120px',
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            color: step === 'confirmation' ? funnelTheme.gold : funnelTheme.textSecondary,
                            fontWeight: step === 'confirmation' ? '700' : '500'
                          }}>
                            {STEP_NAMES[step]}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                          flex: 1,
                          height: isMobile ? '24px' : '32px',
                          background: 'rgba(255,255,255,0.05)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${stats.percentage}%`,
                            background: step === 'confirmation' 
                              ? funnelTheme.goldGradient
                              : 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                            transition: 'width 0.5s ease'
                          }} />
                          
                          {/* Percentage text inside bar */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: isMobile ? '8px' : '12px',
                            transform: 'translateY(-50%)',
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            fontWeight: '700',
                            color: '#fff'
                          }}>
                            {stats.percentage}%
                          </div>
                        </div>

                        {/* Count */}
                        <div style={{
                          width: isMobile ? '40px' : '50px',
                          textAlign: 'right',
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                            fontWeight: '600',
                            color: funnelTheme.textSecondary
                          }}>
                            {stats.count}
                          </span>
                        </div>

                        {/* Drop-off indicator */}
                        {stats.dropOffRate > 0 && (
                          <div style={{
                            width: isMobile ? '55px' : '70px',
                            textAlign: 'right',
                            flexShrink: 0
                          }}>
                            <span style={{
                              fontSize: isMobile ? '0.75rem' : '0.8rem',
                              color: stats.dropOffRate > 30 ? '#ef4444' : stats.dropOffRate > 15 ? '#f59e0b' : funnelTheme.textMuted,
                              fontWeight: '600'
                            }}>
                              -{stats.dropOffRate}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time on step */}
                      {stats.avgTime > 0 && (
                        <div style={{
                          marginLeft: isMobile ? '80px' : '120px',
                          paddingLeft: isMobile ? '0.75rem' : '1rem',
                          marginTop: '0.25rem'
                        }}>
                          <span style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: funnelTheme.textMuted
                          }}>
                            Gem. {formatTime(stats.avgTime)} op deze stap
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Drop-off Reasons */}
            {Object.keys(analytics.dropOffReasons).length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: isMobile ? '1.25rem' : '2rem',
                marginBottom: isMobile ? '1.5rem' : '2rem'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: '700',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={18} />
                  Drop-off Redenen
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(analytics.dropOffReasons)
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => (
                      <div key={reason} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0,0,0,0.3)'
                      }}>
                        <span style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: funnelTheme.textSecondary }}>
                          {reason}
                        </span>
                        <span style={{ 
                          fontSize: isMobile ? '0.85rem' : '0.9rem', 
                          fontWeight: '700',
                          color: '#ef4444'
                        }}>
                          {count}x
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            {analytics.sessions.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                padding: isMobile ? '1.25rem' : '2rem'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: '700',
                  marginBottom: isMobile ? '1rem' : '1.25rem'
                }}>
                  Recente Sessies
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analytics.sessions.slice(0, 10).map((session, index) => (
                    <div key={index} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${funnelTheme.borderSubtle}`
                    }}>
                      <button
                        onClick={() => toggleSession(index)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: isMobile ? '0.75rem' : '1rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>
                          <span style={{ 
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            color: session.summary.completed ? funnelTheme.gold : funnelTheme.textSecondary
                          }}>
                            {session.summary.completed ? '✓ Geboekt' : `Gestopt bij: ${STEP_NAMES[session.summary.current_step]}`}
                          </span>
                          <span style={{
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            color: funnelTheme.textMuted,
                            marginLeft: '1rem'
                          }}>
                            {new Date(session.flushed_at).toLocaleString('nl-NL')}
                          </span>
                        </div>
                        {expandedSessions[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {expandedSessions[index] && (
                        <div style={{
                          padding: isMobile ? '0.75rem' : '1rem',
                          paddingTop: 0,
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: funnelTheme.textMuted,
                          borderTop: `1px solid ${funnelTheme.borderSubtle}`
                        }}>
                          <pre style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(session.summary, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
