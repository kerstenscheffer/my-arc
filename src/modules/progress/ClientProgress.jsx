// src/modules/progress/ClientProgress.jsx
// v2.0 - PREMIUM GOLDEN PROGRESS PAGE
// Props: { client, db, isMobile }

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Scale, Camera, TrendingUp, Activity, 
  ChevronRight, Trophy, Flame, Target,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

// ── GOLDEN THEME ──
const GOLD = {
  primary: '#FFD700',
  secondary: '#FFA500',
  dark: '#D4AF37',
  light: '#FFEAA7',
  glow: 'rgba(255, 215, 0, 0.15)',
  glowStrong: 'rgba(255, 215, 0, 0.3)',
  border: 'rgba(255, 215, 0, 0.2)',
  borderActive: 'rgba(255, 215, 0, 0.4)',
  gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  gradientSubtle: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%)',
  success: '#10b981',
  error: '#ef4444'
}

// ── TAB CONFIG ──
const TABS = [
  { id: 'overview', label: 'Overzicht', icon: TrendingUp },
  { id: 'weight', label: 'Gewicht', icon: Scale },
  { id: 'photos', label: "Foto's", icon: Camera },
  { id: 'workout', label: 'Workouts', icon: Activity }
]

export default function ClientProgress({ client, db, isMobile: propIsMobile }) {
  const [isMobile, setIsMobile] = useState(propIsMobile ?? window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (propIsMobile !== undefined) return
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [propIsMobile])

  // ── Load overview stats ──
  const loadStats = useCallback(async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const [weightHistory, photos, streak] = await Promise.all([
        db.getWeightHistory?.(client.id, 30) || Promise.resolve([]),
        db.getProgressPhotos?.(client.id) || Promise.resolve([]),
        db.getClientStreak?.(client.id) || Promise.resolve(0)
      ])

      const currentWeight = weightHistory?.[0]?.weight || client?.current_weight || 0
      const startWeight = client?.start_weight || currentWeight
      const targetWeight = client?.target_weight || currentWeight
      const weekAgoWeight = weightHistory?.[7]?.weight || currentWeight

      setStats({
        currentWeight,
        startWeight,
        targetWeight,
        weekChange: currentWeight - weekAgoWeight,
        totalChange: currentWeight - startWeight,
        photoCount: photos?.length || 0,
        streak: streak || 0,
        weightEntries: weightHistory?.length || 0
      })
    } catch (err) {
      console.error('Stats load error:', err)
    } finally {
      setLoading(false)
    }
  }, [client?.id, db])

  useEffect(() => { loadStats() }, [loadStats])

  // ── RENDER ACTIVE TAB CONTENT ──
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} client={client} isMobile={isMobile} onNavigate={setActiveTab} loading={loading} />
      case 'weight':
        // WeightTracker module wordt hier geladen
        return (
          <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
            <LazyModule 
              modulePath="weight"
              fallbackText="Gewicht tracker laden..."
              client={client}
              db={db}
              isMobile={isMobile}
            />
          </div>
        )
      case 'photos':
        return (
          <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
            <LazyModule 
              modulePath="photos"
              fallbackText="Foto module laden..."
              client={client}
              db={db}
              isMobile={isMobile}
            />
          </div>
        )
      case 'workout':
        return (
          <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
            <LazyModule 
              modulePath="workout"
              fallbackText="Workout logs laden..."
              client={client}
              db={db}
              isMobile={isMobile}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      paddingBottom: isMobile ? '100px' : '2rem'
    }}>
      
      {/* ── GOLDEN HEADER ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${GOLD.border}`
      }}>
        {/* Subtle golden gradient bg */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.06) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          padding: isMobile ? '1.25rem 1rem 0' : '2rem 1.5rem 0'
        }}>
          {/* Title Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.625rem' : '0.75rem',
            marginBottom: isMobile ? '1rem' : '1.25rem'
          }}>
            <div style={{
              width: isMobile ? '32px' : '38px',
              height: isMobile ? '32px' : '38px',
              borderRadius: '10px',
              background: GOLD.gradientSubtle,
              border: `1px solid ${GOLD.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={isMobile ? 16 : 18} color={GOLD.primary} />
            </div>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '900',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Mijn Progressie
              </h1>
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '600',
                color: 'rgba(255, 215, 0, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '0.15rem'
              }}>
                Track jouw transformatie
              </div>
            </div>
          </div>

          {/* ── TAB NAVIGATION — flush, premium golden ── */}
          <div style={{
            display: 'flex',
            gap: 0,
            borderBottom: 'none'
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.625rem 0' : '0.75rem 0',
                    background: isActive 
                      ? 'rgba(255, 215, 0, 0.08)'
                      : 'transparent',
                    border: 'none',
                    borderBottom: isActive 
                      ? `2px solid ${GOLD.primary}` 
                      : '2px solid transparent',
                    color: isActive ? GOLD.primary : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.25s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onTouchStart={(e) => {
                    if (isMobile && !isActive) {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.04)'
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile && !isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <Icon 
                    size={isMobile ? 16 : 18} 
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 4px ${GOLD.glow})` : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.675rem',
                    fontWeight: isActive ? '800' : '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap'
                  }}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{
        animation: 'fadeIn 0.3s ease'
      }}>
        {renderTabContent()}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


// ═══════════════════════════════════════════
// OVERVIEW TAB - Golden stat cards + quick nav
// ═══════════════════════════════════════════
function OverviewTab({ stats, client, isMobile, onNavigate, loading }) {
  
  if (loading || !stats) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '3rem 0'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `2px solid ${GOLD.border}`,
          borderTopColor: GOLD.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Determine trend
  const weekTrend = stats.weekChange
  const trendIcon = weekTrend < -0.1 ? ArrowDownRight : weekTrend > 0.1 ? ArrowUpRight : Minus
  const trendColor = weekTrend < -0.1 ? GOLD.success : weekTrend > 0.1 ? GOLD.error : 'rgba(255, 255, 255, 0.4)'
  const isLosing = (stats.targetWeight || 0) < (stats.startWeight || 0)
  
  // Progress calc
  const totalToChange = Math.abs((stats.targetWeight || 0) - (stats.startWeight || 0))
  const changed = Math.abs((stats.currentWeight || 0) - (stats.startWeight || 0))
  const progressPct = totalToChange > 0 ? Math.min(100, Math.round((changed / totalToChange) * 100)) : 0

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      
      {/* ── HERO STAT — Current Weight + Progress Bar ── */}
      <div style={{
        position: 'relative',
        background: GOLD.gradientSubtle,
        border: `1px solid ${GOLD.border}`,
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '1.25rem 1rem' : '1.5rem',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        overflow: 'hidden'
      }}>
        {/* Subtle golden shimmer */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative' }}>
          {/* Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.5rem'
          }}>
            <Scale size={isMobile ? 14 : 16} color={GOLD.primary} />
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '700',
              color: 'rgba(255, 215, 0, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              Huidig Gewicht
            </span>
          </div>

          {/* Weight Display */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <span style={{
              fontSize: isMobile ? '2.5rem' : '3rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-0.03em'
            }}>
              {stats.currentWeight?.toFixed(1) || '--'}
            </span>
            <span style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              color: 'rgba(255, 215, 0, 0.5)',
              marginBottom: '0.2rem'
            }}>
              kg
            </span>
            
            {/* Week trend badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.2rem 0.5rem',
              background: `${trendColor}15`,
              border: `1px solid ${trendColor}30`,
              borderRadius: '6px',
              marginLeft: 'auto'
            }}>
              {React.createElement(trendIcon, { size: 14, color: trendColor })}
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '800',
                color: trendColor
              }}>
                {Math.abs(weekTrend).toFixed(1)} kg
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.375rem'
            }}>
              <span style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase'
              }}>
                Start: {stats.startWeight?.toFixed(1)} kg
              </span>
              <span style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: '700',
                color: GOLD.primary,
                textTransform: 'uppercase'
              }}>
                Doel: {stats.targetWeight?.toFixed(1)} kg
              </span>
            </div>
            
            <div style={{
              height: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: GOLD.gradient,
                borderRadius: '3px',
                transition: 'width 0.6s ease',
                boxShadow: `0 0 8px ${GOLD.glow}`
              }} />
            </div>
            
            <div style={{
              textAlign: 'right',
              marginTop: '0.25rem',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '800',
              color: GOLD.primary
            }}>
              {progressPct}% bereikt
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK STAT CARDS — 2x2 grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        <QuickStatCard
          icon={Flame}
          label="Streak"
          value={`${stats.streak || 0}`}
          unit="dagen"
          isMobile={isMobile}
        />
        <QuickStatCard
          icon={Scale}
          label="Wegingen"
          value={`${stats.weightEntries || 0}`}
          unit="totaal"
          isMobile={isMobile}
        />
        <QuickStatCard
          icon={Camera}
          label="Foto's"
          value={`${stats.photoCount || 0}`}
          unit="uploads"
          isMobile={isMobile}
        />
        <QuickStatCard
          icon={Target}
          label="Verschil"
          value={`${stats.totalChange > 0 ? '+' : ''}${stats.totalChange?.toFixed(1) || '0'}`}
          unit="kg"
          isMobile={isMobile}
          highlight={stats.totalChange < 0 && isLosing}
        />
      </div>

      {/* ── QUICK NAV CARDS ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.375rem' : '0.5rem'
      }}>
        <NavCard
          icon={Scale}
          title="Gewicht Bijhouden"
          subtitle="Log je dagelijkse weging"
          onClick={() => onNavigate('weight')}
          isMobile={isMobile}
        />
        <NavCard
          icon={Camera}
          title="Progress Foto's"
          subtitle={`${stats.photoCount || 0} foto's opgeslagen`}
          onClick={() => onNavigate('photos')}
          isMobile={isMobile}
        />
        <NavCard
          icon={Activity}
          title="Workout Logs"
          subtitle="Bekijk je training prestaties"
          onClick={() => onNavigate('workout')}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

function QuickStatCard({ icon: Icon, label, value, unit, isMobile, highlight = false }) {
  return (
    <div style={{
      background: highlight 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)'
        : 'rgba(255, 255, 255, 0.02)',
      border: highlight 
        ? '1px solid rgba(16, 185, 129, 0.2)'
        : `1px solid rgba(255, 255, 255, 0.06)`,
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.75rem' : '1rem',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        marginBottom: '0.375rem'
      }}>
        <Icon size={isMobile ? 12 : 14} color={highlight ? GOLD.success : 'rgba(255, 215, 0, 0.4)'} />
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.25rem'
      }}>
        <span style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '900',
          color: highlight ? GOLD.success : '#fff',
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}>
          {value}
        </span>
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.3)',
          textTransform: 'uppercase'
        }}>
          {unit}
        </span>
      </div>
    </div>
  )
}

function NavCard({ icon: Icon, title, subtitle, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.875rem 0.75rem' : '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: isMobile ? '10px' : '12px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        textAlign: 'left'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.04)'
          e.currentTarget.style.borderColor = GOLD.border
          e.currentTarget.style.transform = 'scale(0.99)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.04)'
          e.currentTarget.style.borderColor = GOLD.border
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
        }
      }}
    >
      {/* Icon */}
      <div style={{
        width: isMobile ? '36px' : '40px',
        height: isMobile ? '36px' : '40px',
        borderRadius: '10px',
        background: GOLD.gradientSubtle,
        border: `1px solid ${GOLD.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={isMobile ? 16 : 18} color={GOLD.primary} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: '0.125rem'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.35)'
        }}>
          {subtitle}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight 
        size={isMobile ? 16 : 18} 
        color="rgba(255, 215, 0, 0.3)"
        style={{ flexShrink: 0 }}
      />
    </button>
  )
}


// ═══════════════════════════════════════════
// LAZY MODULE LOADER - Placeholder for sub-modules
// ═══════════════════════════════════════════
function LazyModule({ modulePath, fallbackText, client, db, isMobile }) {
  // This is a placeholder that renders the existing sub-modules
  // Each module (WeightTracker, PhotosModule, WorkoutLogModule) 
  // gets imported in the actual integration
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: GOLD.gradientSubtle,
        border: `1px solid ${GOLD.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: `2px solid ${GOLD.border}`,
          borderTopColor: GOLD.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        {fallbackText}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
