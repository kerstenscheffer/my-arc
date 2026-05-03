// src/modules/sales/components/SalesDashboard.jsx
// Sales Dashboard - Metrics, stats en inzichten
// Simple version met bestaande data

import { useState, useEffect } from 'react'
import { TrendingUp, Phone, CheckCircle, Clock, Target, Calendar, Zap } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

export default function SalesDashboard({ db, isMobile }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [timeFilter, setTimeFilter] = useState('week') // 'week', 'month', 'all'

  useEffect(() => {
    loadStats()
  }, [timeFilter])

  const loadStats = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return

      // Get all sales pieces
      const { data: allPieces, error } = await db.supabase
        .from('sales_pieces')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter by time
      const filteredPieces = filterByTime(allPieces || [], timeFilter)

      // Calculate stats
      const calculated = calculateStats(filteredPieces)
      setStats(calculated)

    } catch (error) {
      console.error('Failed to load stats:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const filterByTime = (pieces, filter) => {
    if (filter === 'all') return pieces

    const now = new Date()
    const cutoff = new Date()

    if (filter === 'week') {
      cutoff.setDate(now.getDate() - 7)
    } else if (filter === 'month') {
      cutoff.setMonth(now.getMonth() - 1)
    }

    return pieces.filter(p => new Date(p.created_at) >= cutoff)
  }

  const calculateStats = (pieces) => {
    const total = pieces.length

    // Phase completion
    const prepCompleted = pieces.filter(p => p.prep_completed).length
    const callCompleted = pieces.filter(p => p.call_completed).length
    const followupCompleted = pieces.filter(p => p.followup_completed).length
    const aftersaleCompleted = pieces.filter(p => p.aftersale_completed).length

    // Scheduled vs Idea
    const scheduled = pieces.filter(p => p.status === 'scheduled').length
    const ideas = pieces.filter(p => p.status === 'idea').length

    // Full completion (all phases done)
    const fullyCompleted = pieces.filter(p => 
      p.prep_completed && 
      p.call_completed && 
      p.followup_completed && 
      p.aftersale_completed
    ).length

    // Completion rates
    const prepRate = total > 0 ? Math.round((prepCompleted / total) * 100) : 0
    const callRate = total > 0 ? Math.round((callCompleted / total) * 100) : 0
    const followupRate = total > 0 ? Math.round((followupCompleted / total) * 100) : 0
    const aftersaleRate = total > 0 ? Math.round((aftersaleCompleted / total) * 100) : 0
    const fullRate = total > 0 ? Math.round((fullyCompleted / total) * 100) : 0

    return {
      total,
      scheduled,
      ideas,
      fullyCompleted,
      fullRate,
      phases: {
        prep: { completed: prepCompleted, rate: prepRate },
        call: { completed: callCompleted, rate: callRate },
        followup: { completed: followupCompleted, rate: followupRate },
        aftersale: { completed: aftersaleCompleted, rate: aftersaleRate }
      }
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${SALES_THEME.border}`,
            borderTopColor: SALES_THEME.primary,
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Dashboard laden...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Geen data beschikbaar</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Maak eerst sales pieces aan in de Library
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '900',
            background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.25rem',
            letterSpacing: '-0.02em'
          }}>
            Sales Dashboard
          </h2>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '500'
          }}>
            Overzicht van je sales performance
          </p>
        </div>

        {/* Time Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.25rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {['week', 'month', 'all'].map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              style={{
                padding: '0.5rem 1rem',
                background: timeFilter === filter 
                  ? `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`
                  : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: timeFilter === filter ? '#000' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
            >
              {filter === 'week' ? 'Deze Week' : filter === 'month' ? 'Deze Maand' : 'Alles'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <StatCard
          icon={Target}
          label="Total Sales Pieces"
          value={stats.total}
          color={SALES_THEME.primary}
          isMobile={isMobile}
        />

        <StatCard
          icon={Calendar}
          label="Scheduled"
          value={stats.scheduled}
          subtext={`${stats.ideas} ideas`}
          color="#3b82f6"
          isMobile={isMobile}
        />

        <StatCard
          icon={CheckCircle}
          label="Fully Completed"
          value={stats.fullyCompleted}
          percentage={stats.fullRate}
          color="#10b981"
          isMobile={isMobile}
        />

        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${stats.fullRate}%`}
          color={stats.fullRate >= 50 ? '#10b981' : '#f59e0b'}
          isMobile={isMobile}
        />
      </div>

      {/* Phase Breakdown */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Zap size={20} color={SALES_THEME.primary} />
          Phase Completion
        </h3>

        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          <PhaseBar
            label="Prep"
            completed={stats.phases.prep.completed}
            total={stats.total}
            percentage={stats.phases.prep.rate}
            color="#3b82f6"
            isMobile={isMobile}
          />

          <PhaseBar
            label="Sales Call"
            completed={stats.phases.call.completed}
            total={stats.total}
            percentage={stats.phases.call.rate}
            color="#10b981"
            isMobile={isMobile}
          />

          <PhaseBar
            label="Follow-up"
            completed={stats.phases.followup.completed}
            total={stats.total}
            percentage={stats.phases.followup.rate}
            color="#f59e0b"
            isMobile={isMobile}
          />

          <PhaseBar
            label="After Sale"
            completed={stats.phases.aftersale.completed}
            total={stats.total}
            percentage={stats.phases.aftersale.rate}
            color="#8b5cf6"
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subtext, percentage, color, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '1rem' : '1.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {label}
          </div>

          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '900',
            color: color,
            lineHeight: '1',
            marginBottom: '0.25rem'
          }}>
            {value}
          </div>

          {subtext && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontWeight: '500'
            }}>
              {subtext}
            </div>
          )}

          {percentage !== undefined && (
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              marginTop: '0.25rem'
            }}>
              {percentage}% completion
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          borderRadius: '10px',
          background: `${color}20`,
          border: `1px solid ${color}40`
        }}>
          <Icon size={isMobile ? 20 : 24} color={color} />
        </div>
      </div>
    </div>
  )
}

// Phase Bar Component
function PhaseBar({ label, completed, total, percentage, color, isMobile }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <span style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          color: '#fff'
        }}>
          {label}
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '700',
          color: color
        }}>
          {completed}/{total} ({percentage}%)
        </span>
      </div>

      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
          borderRadius: '4px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px ${color}40`
        }} />
      </div>
    </div>
  )
}
