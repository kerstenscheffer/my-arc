// ============================================
// 📁 FILE: src/modules/client-journey/components/progress/ProgressTracker.jsx
// PROGRESSIE TRACKING - Overall status + 6 metrics
// On/Off track indicator met reden & aanpassingen
// ============================================
import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Scale, Ruler, Camera, Dumbbell, Apple, Zap, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Edit3, Save, X, Minus } from 'lucide-react'

const GOLD = { primary: '#d4a853', background: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.2)' }
const GREEN = '#10b981'
const RED = '#ef4444'
const YELLOW = '#f59e0b'

// Track status options
const TRACK_STATUS = {
  on_track: { label: 'On Track', color: GREEN, icon: CheckCircle, emoji: '🟢' },
  slight_off: { label: 'Licht afwijkend', color: YELLOW, icon: AlertTriangle, emoji: '🟡' },
  off_track: { label: 'Off Track', color: RED, icon: AlertTriangle, emoji: '🔴' }
}

const OFF_TRACK_REASONS = [
  { id: 'injury', label: 'Blessure', emoji: '🤕' },
  { id: 'illness', label: 'Ziekte', emoji: '🤒' },
  { id: 'motivation', label: 'Motivatie', emoji: '😔' },
  { id: 'schedule', label: 'Druk schema', emoji: '📅' },
  { id: 'nutrition', label: 'Voeding niet op orde', emoji: '🍔' },
  { id: 'sleep', label: 'Slaap/stress', emoji: '😴' },
  { id: 'holiday', label: 'Vakantie', emoji: '✈️' },
  { id: 'personal', label: 'Persoonlijke omstandigheden', emoji: '🏠' },
  { id: 'other', label: 'Anders', emoji: '📝' }
]

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProgressTracker({ client, journey, weekNumber, isMobile, db, progressData, onSaveProgress }) {
  const [status, setStatus] = useState(progressData?.status || 'on_track')
  const [reasons, setReasons] = useState(progressData?.reasons || [])
  const [adjustments, setAdjustments] = useState(progressData?.adjustments || '')
  const [customReason, setCustomReason] = useState(progressData?.customReason || '')
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [metrics, setMetrics] = useState(null)

  // Load metrics from existing data
  useEffect(() => {
    if (client?.id && db) loadMetrics()
  }, [client?.id])

  const loadMetrics = async () => {
    try {
      const m = {}

      // Weight data (from existing weight tracker)
      try {
        const weightHistory = await db.getWeightHistory?.(client.id) || []
        const startWeight = weightHistory[weightHistory.length - 1]?.weight || null
        const currentWeight = weightHistory[0]?.weight || null
        const weekAgoWeight = weightHistory.find(w => {
          const d = new Date(w.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return d <= weekAgo
        })?.weight || null

        m.weight = {
          current: currentWeight,
          start: startWeight,
          change: currentWeight && startWeight ? currentWeight - startWeight : null,
          weekChange: currentWeight && weekAgoWeight ? currentWeight - weekAgoWeight : null,
          entries: weightHistory.length,
          trend: currentWeight && weekAgoWeight ? (currentWeight < weekAgoWeight ? 'down' : currentWeight > weekAgoWeight ? 'up' : 'flat') : null
        }
      } catch (e) { m.weight = null }

      // Workout compliance
      try {
        const workouts = await db.getClientWorkouts?.(client.id) || []
        const totalPlanned = weekNumber * 3 // assume 3 workouts per week
        const completed = workouts.filter(w => w.completed).length
        m.workouts = {
          completed,
          planned: totalPlanned,
          compliance: totalPlanned > 0 ? Math.round((completed / totalPlanned) * 100) : 0,
          lastWorkout: workouts[0]?.date || null,
          thisWeek: workouts.filter(w => {
            const d = new Date(w.date)
            const weekStart = new Date()
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            return d >= weekStart
          }).length
        }
      } catch (e) { m.workouts = null }

      // Photo count
      try {
        const photos = await db.getClientPhotos?.(client.id) || []
        m.photos = {
          total: photos.length,
          lastDate: photos[0]?.created_at || null,
          hasRecent: photos.some(p => {
            const d = new Date(p.created_at)
            const fourWeeksAgo = new Date()
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
            return d >= fourWeeksAgo
          })
        }
      } catch (e) { m.photos = null }

      setMetrics(m)
    } catch (e) {
      console.error('Load metrics error:', e)
    }
  }

  const handleSave = () => {
    setEditing(false)
    if (onSaveProgress) {
      onSaveProgress({
        weekNumber,
        status,
        reasons,
        customReason,
        adjustments,
        updatedAt: new Date().toISOString()
      })
    }
  }

  const handleToggleReason = (reasonId) => {
    setReasons(prev =>
      prev.includes(reasonId) ? prev.filter(r => r !== reasonId) : [...prev, reasonId]
    )
  }

  const statusConfig = TRACK_STATUS[status]
  const StatusIcon = statusConfig?.icon || CheckCircle

  return (
    <div style={{
      borderRadius: '10px',
      background: `${statusConfig?.color}06`,
      border: `1px solid ${statusConfig?.color}15`,
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* ===== HEADER - Always visible ===== */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.25rem 0.6rem', borderRadius: '6px',
          background: `${statusConfig?.color}15`,
          border: `1px solid ${statusConfig?.color}30`
        }}>
          <span style={{ fontSize: '0.7rem' }}>{statusConfig?.emoji}</span>
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600',
            color: statusConfig?.color
          }}>
            {statusConfig?.label}
          </span>
        </div>

        {/* Quick metrics */}
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          {metrics?.weight?.current && (
            <MetricPill
              icon={Scale}
              value={`${metrics.weight.current.toFixed(1)}`}
              unit="kg"
              change={metrics.weight.weekChange}
              isMobile={isMobile}
            />
          )}
          {metrics?.workouts && (
            <MetricPill
              icon={Dumbbell}
              value={`${metrics.workouts.compliance}`}
              unit="%"
              isMobile={isMobile}
              color={metrics.workouts.compliance >= 80 ? GREEN : metrics.workouts.compliance >= 60 ? YELLOW : RED}
            />
          )}
          {expanded ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      {/* Reasons summary (collapsed) */}
      {!expanded && reasons.length > 0 && (
        <div style={{
          padding: '0 0.75rem 0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap'
        }}>
          {reasons.map(r => {
            const reason = OFF_TRACK_REASONS.find(otr => otr.id === r)
            return reason ? (
              <span key={r} style={{
                padding: '0.1rem 0.35rem', borderRadius: '4px',
                background: 'rgba(255,255,255,0.04)',
                fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)'
              }}>
                {reason.emoji} {reason.label}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* ===== EXPANDED CONTENT ===== */}
      {expanded && (
        <div style={{
          padding: isMobile ? '0 0.75rem 0.75rem' : '0 1rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.04)'
        }}>

          {/* ===== STATUS SELECTOR ===== */}
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
              STATUS
            </label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {Object.entries(TRACK_STATUS).map(([key, config]) => {
                const isSelected = status === key
                return (
                  <button
                    key={key}
                    onClick={() => { setStatus(key); if (key === 'on_track') setReasons([]) }}
                    style={{
                      flex: 1, padding: isMobile ? '0.5rem' : '0.6rem', borderRadius: '8px',
                      background: isSelected ? `${config.color}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? `${config.color}40` : 'rgba(255,255,255,0.06)'}`,
                      color: isSelected ? config.color : 'rgba(255,255,255,0.4)',
                      fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: isSelected ? '600' : '400',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                    }}
                  >
                    {config.emoji} {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ===== OFF TRACK REASONS ===== */}
          {status !== 'on_track' && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                REDEN (selecteer 1 of meer)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {OFF_TRACK_REASONS.map(reason => {
                  const isSelected = reasons.includes(reason.id)
                  return (
                    <button
                      key={reason.id}
                      onClick={() => handleToggleReason(reason.id)}
                      style={{
                        padding: '0.35rem 0.6rem', borderRadius: '6px',
                        background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: isSelected ? '500' : '400',
                        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      {reason.emoji} {reason.label}
                    </button>
                  )
                })}
              </div>

              {/* Custom reason */}
              {reasons.includes('other') && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Beschrijf de reden..."
                  rows={2}
                  style={{
                    width: '100%', marginTop: '0.35rem', padding: '0.4rem 0.5rem', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: isMobile ? '0.78rem' : '0.83rem',
                    outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              )}

              {/* Adjustments made */}
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  AANPASSINGEN GEDAAN
                </label>
                <textarea
                  value={adjustments}
                  onChange={e => setAdjustments(e.target.value)}
                  placeholder="Welke aanpassingen heb je gedaan om weer on track te komen?"
                  rows={2}
                  style={{
                    width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: isMobile ? '0.78rem' : '0.83rem',
                    outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.75rem',
              background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.primary}cc)`,
              border: 'none', color: '#000', fontWeight: '700',
              fontSize: isMobile ? '0.78rem' : '0.83rem',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
            }}
          >
            <Save size={14} /> Status opslaan
          </button>

          {/* ===== METRICS GRID ===== */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '0.4rem'
          }}>
            {/* Weight */}
            <MetricCard
              icon={Scale}
              title="Gewicht"
              value={metrics?.weight?.current ? `${metrics.weight.current.toFixed(1)} kg` : '-'}
              subtitle={metrics?.weight?.change != null
                ? `${metrics.weight.change > 0 ? '+' : ''}${metrics.weight.change.toFixed(1)} kg totaal`
                : 'Geen data'}
              trend={metrics?.weight?.trend}
              color="#3b82f6"
              isMobile={isMobile}
            />

            {/* Workout compliance */}
            <MetricCard
              icon={Dumbbell}
              title="Workouts"
              value={metrics?.workouts ? `${metrics.workouts.compliance}%` : '-'}
              subtitle={metrics?.workouts ? `${metrics.workouts.completed}/${metrics.workouts.planned} gedaan` : 'Geen data'}
              color={metrics?.workouts?.compliance >= 80 ? GREEN : metrics?.workouts?.compliance >= 60 ? YELLOW : RED}
              isMobile={isMobile}
            />

            {/* Photos */}
            <MetricCard
              icon={Camera}
              title="Foto's"
              value={metrics?.photos ? `${metrics.photos.total}` : '0'}
              subtitle={metrics?.photos?.lastDate
                ? `Laatste: ${new Date(metrics.photos.lastDate).toLocaleDateString('nl-NL')}`
                : 'Nog geen foto\'s'}
              color={metrics?.photos?.hasRecent ? GREEN : YELLOW}
              isMobile={isMobile}
            />

            {/* Measurements */}
            <MetricCard
              icon={Ruler}
              title="Metingen"
              value="-"
              subtitle="Via progressie foto's"
              color="#8b5cf6"
              isMobile={isMobile}
            />

            {/* Nutrition compliance */}
            <MetricCard
              icon={Apple}
              title="Voeding"
              value="-"
              subtitle="Tracking via MFP"
              color="#ec4899"
              isMobile={isMobile}
            />

            {/* Strength */}
            <MetricCard
              icon={Zap}
              title="Kracht"
              value="-"
              subtitle="Via workout logs"
              color="#f59e0b"
              isMobile={isMobile}
            />
          </div>

          {/* ===== PROGRESS TIMELINE (mini) ===== */}
          {metrics?.weight?.entries > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                GEWICHT TREND
              </label>
              <WeightMiniChart
                current={metrics.weight.current}
                start={metrics.weight.start}
                change={metrics.weight.change}
                weekChange={metrics.weight.weekChange}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// METRIC CARD
// ============================================
function MetricCard({ icon: Icon, title, value, subtitle, trend, color, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0.5rem' : '0.6rem', borderRadius: '8px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {trend && (
          trend === 'down' ? <TrendingDown size={10} color={GREEN} style={{ marginLeft: 'auto' }} />
          : trend === 'up' ? <TrendingUp size={10} color={RED} style={{ marginLeft: 'auto' }} />
          : <Minus size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
        )}
      </div>
      <p style={{
        color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700',
        margin: 0, letterSpacing: '-0.02em'
      }}>
        {value}
      </p>
      <p style={{
        color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.6rem' : '0.65rem',
        margin: '0.15rem 0 0'
      }}>
        {subtitle}
      </p>
    </div>
  )
}

// ============================================
// METRIC PILL (compact, for header)
// ============================================
function MetricPill({ icon: Icon, value, unit, change, color, isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.2rem',
      padding: '0.15rem 0.4rem', borderRadius: '4px',
      background: 'rgba(255,255,255,0.04)'
    }}>
      <Icon size={10} color={color || 'rgba(255,255,255,0.4)'} />
      <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#fff', fontWeight: '600' }}>
        {value}
      </span>
      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>{unit}</span>
      {change != null && (
        <span style={{
          fontSize: '0.55rem', fontWeight: '600',
          color: change < 0 ? GREEN : change > 0 ? RED : 'rgba(255,255,255,0.3)'
        }}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// ============================================
// WEIGHT MINI CHART (simple bar visualization)
// ============================================
function WeightMiniChart({ current, start, change, weekChange, isMobile }) {
  if (!current || !start) return null

  const isLoss = change < 0
  const percentage = Math.min(100, Math.abs(change / start) * 100)

  return (
    <div style={{
      padding: '0.5rem', borderRadius: '8px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
          Start: {start.toFixed(1)} kg
        </span>
        <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: '600' }}>
          Nu: {current.toFixed(1)} kg
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: `${Math.min(100, percentage * 5)}%`,
          background: isLoss
            ? `linear-gradient(90deg, ${GREEN}, ${GREEN}aa)`
            : `linear-gradient(90deg, ${RED}aa, ${RED})`,
          transition: 'width 0.5s ease'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: '600',
          color: isLoss ? GREEN : change > 0 ? RED : 'rgba(255,255,255,0.3)'
        }}>
          {change > 0 ? '+' : ''}{change.toFixed(1)} kg totaal
        </span>
        {weekChange != null && (
          <span style={{
            fontSize: '0.6rem',
            color: weekChange < 0 ? GREEN : weekChange > 0 ? RED : 'rgba(255,255,255,0.3)'
          }}>
            Deze week: {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)} kg
          </span>
        )}
      </div>
    </div>
  )
}
