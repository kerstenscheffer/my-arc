// src/modules/coach-command-center/components/ClientWeightCard.jsx
// v2.4 — onOpenMealPanel prop toegevoegd + doorgegeven aan ClientInsightModal
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingDown, TrendingUp,
  MessageCircle, Power, Camera, Dumbbell, MoreHorizontal,
  BarChart3, UtensilsCrossed, BookOpen
} from 'lucide-react'
import ClientInsightModal from './ClientInsightModal'
import CoachingLogModal from './CoachingLogModal'

const STATUS_OPTIONS = [
  { id: 'on_track',        label: 'Op schema',        color: '#FFD700' },
  { id: 'crushing_it',     label: 'On fire 🔥',       color: '#10b981' },
  { id: 'needs_attention', label: 'Aandacht nodig',   color: '#f59e0b' },
  { id: 'off_track',       label: 'Off track',         color: '#ef4444' },
]

const GOAL_LABELS = {
  afvallen: 'Afvallen', fat_loss: 'Afvallen', weight_loss: 'Afvallen',
  spieren: 'Spieropbouw', muscle_gain: 'Spieropbouw',
  recomp: 'Recomp', body_recomposition: 'Recomp',
  fitness: 'Fitter worden', general_fitness: 'Fitter worden',
}

export default function ClientWeightCard({ client, isMobile, onToggleStatus, showStatusToggle = false, onOpenJourney, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel }) {
  const [showInsight, setShowInsight]   = useState(false)
  const [showLog, setShowLog]           = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const [toggling, setToggling]         = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)

  const latestLog = client.latestCoachingLog || null
  const [localStatus, setLocalStatus] = useState(latestLog?.status || client.coachingPlan?.plan?.coach_status || 'on_track')
  const [previewNote, setPreviewNote] = useState(latestLog?.note || client.coachingPlan?.plan?.coach_notitie || null)

  const weightData    = client.weightData
  const photoData     = client.photoData
  const workoutData   = client.workoutData
  const latest        = weightData?.latest
  const history       = weightData?.history || []
  const isInactive    = client.status === 'inactive'

  const formatDaysAgo = (days) => {
    if (days === null || days === undefined) return 'Nooit'
    if (days === 0) return 'Vandaag'
    if (days === 1) return 'Gisteren'
    return `${days}d`
  }

  const getTrend = () => {
    if (history.length < 2) return null
    const diff = history[0].weight - history[1].weight
    if (Math.abs(diff) < 0.1) return null
    return diff < 0 ? 'down' : 'up'
  }
  const trend = getTrend()

  const getUrgencyColor = () => {
    if (isInactive) return '#4b5563'
    const status = weightData?.weightStatus
    if (status === 'never' || status === 'overdue' || weightData?.fridayMissing) return '#ef4444'
    if (status === 'warning') return '#f59e0b'
    if (status === 'today' || status === 'recent') return '#FFD700'
    return '#333'
  }

  const getRollingAvg = (offset = 0) => {
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
    if (sorted.length === 0) return null
    const today = new Date(); today.setHours(0,0,0,0)
    const end   = new Date(today); end.setDate(today.getDate() - offset)
    const start = new Date(end);   start.setDate(end.getDate() - 7)
    const entries = sorted.filter(e => {
      const d = new Date(e.date); d.setHours(0,0,0,0)
      return d >= start && d <= end
    })
    if (entries.length === 0) return null
    return parseFloat((entries.reduce((t, e) => t + parseFloat(e.weight), 0) / entries.length).toFixed(1))
  }

  const curAvg  = getRollingAvg(0)
  const prevAvg = getRollingAvg(7)
  const weekDiff = (curAvg && prevAvg) ? parseFloat((curAvg - prevAvg).toFixed(1)) : null

  const getAllWeeksTotal = () => {
    const weeks = []
    for (let i = 0; i < 12; i++) { const a = getRollingAvg(i * 7); if (a) weeks.push(a) }
    if (weeks.length < 2) return null
    return parseFloat((weeks[0] - weeks[weeks.length - 1]).toFixed(1))
  }
  const totalChange = getAllWeeksTotal()

  const openWhatsApp = () => {
    let phone = client.phone || client.phone_number || ''
    phone = phone.replace(/[\s\-]/g, '')
    if (phone.startsWith('0')) phone = '31' + phone.substring(1)
    phone = phone.replace(/\+/g, '')
    const msg = `Hey ${client.first_name || 'daar'}! Is het je gelukt om te wegen vanochtend? 💪`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  const hasPhone = !!(client.phone || client.phone_number)

  const handleToggle = async () => {
    if (toggling || !onToggleStatus) return
    setToggling(true)
    await onToggleStatus(client.id, client.status)
    setToggling(false)
    setShowMenu(false)
  }

  const handleStatusChange = async (newStatus) => {
    setShowStatusPicker(false)
    setLocalStatus(newStatus)
    try {
      await db.supabase
        .from('client_coaching_logs')
        .insert({ client_id: client.id, coach_id: coachId || null, status: newStatus, note: '' })
    } catch (e) { console.error('❌ status update:', e) }
  }

  const photoCount       = photoData?.progressCount || photoData?.totalCount || 0
  const workoutCompleted = workoutData?.completedWorkouts || 0
  const workoutTotal     = workoutData?.totalWorkouts || 0
  const loggingDays      = client.mealData?.loggingDays || 0

  const urgencyColor  = getUrgencyColor()
  const currentStatus = STATUS_OPTIONS.find(s => s.id === localStatus) || STATUS_OPTIONS[0]

  const intakeDoel = client.coachingPlan?.plan?.intake_call_notes?.notes?.doel
  const goalRoute  = intakeDoel?.route || client.primary_goal || null
  const goalLabel  = GOAL_LABELS[goalRoute] || goalRoute || null

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `3px solid ${urgencyColor}`,
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden', position: 'relative',
      transition: 'all 0.2s ease', transform: 'translateZ(0)',
      opacity: isInactive ? 0.6 : 1
    }}>

      {/* ── ROW 1 ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
        gap: isMobile ? '0.5rem' : '0.625rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '0.2rem', position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setShowStatusPicker(p => !p)}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.1rem 0.35rem',
                background: `${currentStatus.color}12`,
                border: `1px solid ${currentStatus.color}30`,
                borderRadius: '3px', color: currentStatus.color,
                fontSize: '0.42rem', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                letterSpacing: '0.04em', textTransform: 'uppercase'
              }}
            >
              {currentStatus.label}
            </button>
            {showStatusPicker && (
              <>
                <div onClick={() => setShowStatusPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.25rem', zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', minWidth: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.id} onClick={() => handleStatusChange(s.id)} style={{
                      width: '100%', padding: '0.45rem 0.75rem',
                      background: localStatus === s.id ? `${s.color}12` : 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      color: s.color, fontSize: '0.7rem', fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      minHeight: '36px'
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', minWidth: 0 }}>
            <h3 style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', color: isInactive ? '#6b7280' : '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
              {client.first_name} {client.last_name}
            </h3>
            {goalLabel && (
              <span style={{ fontSize: '0.48rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                {goalLabel}
              </span>
            )}
            {isInactive && (
              <span style={{ fontSize: '0.5rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.1rem 0.3rem', background: 'rgba(107,114,128,0.15)', borderRadius: '3px', flexShrink: 0 }}>off</span>
            )}
          </div>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
            {formatDaysAgo(weightData?.daysSinceWeighin)} · {weightData?.fridayCount || 0}/8 VR
          </span>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: isInactive ? '#6b7280' : '#FFD700', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {latest?.weight ? latest.weight.toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: '600', color: isInactive ? 'rgba(107,114,128,0.5)' : 'rgba(255,215,0,0.4)', marginBottom: '0.1rem' }}>kg</span>
            {trend && !isInactive && (
              trend === 'down'
                ? <TrendingDown size={14} color="#10b981" style={{ marginLeft: '0.2rem' }} />
                : <TrendingUp   size={14} color="#ef4444" style={{ marginLeft: '0.2rem' }} />
            )}
          </div>
          {latest?.date && (
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.1rem', textAlign: 'right' }}>
              {new Date(latest.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {client.target_weight && !isInactive && (
            <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
              <span>→</span>
              <span style={{ fontWeight: '700', color: 'rgba(255,255,255,0.35)' }}>{parseFloat(client.target_weight).toFixed(1)}kg</span>
              {client.goal_deadline && (
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>· {new Date(client.goal_deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: Stats bar ── */}
      {!isInactive && (
        <>
          {!statsExpanded && (
            <button
              onClick={() => setStatsExpanded(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: isMobile ? '0.3rem 0.75rem' : '0.35rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GEM</span>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>{curAvg ?? '—'}<span style={{ fontSize: '0.4rem', opacity: 0.4, marginLeft: '0.05rem' }}>kg</span></span>
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ΔW</span>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 800, lineHeight: 1, color: weekDiff !== null ? (weekDiff < 0 ? '#10b981' : weekDiff > 0 ? '#ef4444' : '#fff') : 'rgba(255,255,255,0.3)' }}>{weekDiff !== null ? `${weekDiff > 0 ? '+' : ''}${weekDiff}` : '—'}<span style={{ fontSize: '0.4rem', opacity: 0.4, marginLeft: '0.05rem' }}>kg</span></span>
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.1)' }}>·</span>
              <span style={{ fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOT</span>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 800, lineHeight: 1, color: totalChange !== null ? (totalChange < 0 ? '#10b981' : totalChange > 0 ? '#ef4444' : '#fff') : 'rgba(255,255,255,0.3)' }}>{totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—'}<span style={{ fontSize: '0.4rem', opacity: 0.4, marginLeft: '0.05rem' }}>kg</span></span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>▾</span>
            </button>
          )}
          {statsExpanded && (
            <div onClick={() => setStatsExpanded(false)} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,215,0,0.02)', cursor: 'pointer' }}>
              {[
                { label: 'WEEK',     val: curAvg      ? `${curAvg}`                                                                         : '—', color: '#FFD700' },
                { label: 'VORIGE',   val: prevAvg     ? `${prevAvg}`                                                                        : '—', color: '#fff' },
                { label: 'VERSCHIL', val: weekDiff    !== null ? `${weekDiff    > 0 ? '+' : ''}${weekDiff}`    : '—', color: weekDiff    !== null ? (weekDiff    < 0 ? '#10b981' : weekDiff    > 0 ? '#ef4444' : '#fff') : '#fff' },
                { label: 'TOTAAL',   val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—', color: totalChange !== null ? (totalChange < 0 ? '#10b981' : totalChange > 0 ? '#ef4444' : '#fff') : '#fff' }
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
                  <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}<span style={{ fontSize: '0.4rem', fontWeight: '500', opacity: 0.4, marginLeft: '0.05rem' }}>kg</span></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ROW 3 ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.3rem 0.75rem' : '0.35rem 1rem', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={() => setShowInsight(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.15rem 0', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px' }}>
          <Camera   size={10} color={photoCount     > 0 ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.15)'} />
          <span style={{ fontSize: '0.55rem', fontWeight: '700', color: photoCount > 0 ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.2)' }}>{photoCount}</span>
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.08)' }}>·</span>
          <Dumbbell size={10} color={workoutTotal   > 0 ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.15)'} />
          <span style={{ fontSize: '0.55rem', fontWeight: '700', color: workoutTotal > 0 ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.2)' }}>{workoutCompleted}/{workoutTotal}</span>
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.08)' }}>·</span>
          <UtensilsCrossed size={10} color={loggingDays > 0 ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.15)'} />
          <span style={{ fontSize: '0.55rem', fontWeight: '700', color: loggingDays > 0 ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.2)' }}>{loggingDays}d</span>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowInsight(true)} style={{ padding: isMobile ? '0.3rem 0.4rem' : '0.35rem 0.5rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '6px', color: 'rgba(255,215,0,0.6)', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px' }}>
          <BarChart3 size={11} />
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <MoreHorizontal size={13} />
          </button>
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.25rem', zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', minWidth: '140px', boxShadow: '0 -8px 24px rgba(0,0,0,0.6)' }}>
                {hasPhone && !isInactive && (
                  <button onClick={() => { openWhatsApp(); setShowMenu(false) }} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', color: '#25D366', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                )}
                {showStatusToggle && (
                  <button onClick={handleToggle} disabled={toggling} style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'transparent', border: 'none', borderTop: hasPhone && !isInactive ? '1px solid rgba(255,255,255,0.06)' : 'none', color: isInactive ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: '600', cursor: toggling ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', textAlign: 'left', opacity: toggling ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Power size={14} /> {isInactive ? 'Activeer' : 'Deactiveer'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ROW 4 ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', gap: '0.5rem', minHeight: '36px' }}>
        <span onClick={() => setShowLog(true)} style={{ flex: 1, minWidth: 0, fontSize: '0.65rem', color: previewNote ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', fontStyle: previewNote ? 'italic' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', touchAction: 'manipulation' }}>
          {previewNote || 'Geen notities...'}
        </span>
        <button onClick={() => setShowLog(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: 'rgba(255,255,255,0.3)', fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '24px' }}>
          <BookOpen size={10} /> Log
        </button>
      </div>

      {/* ── MODALS ── */}
      {showInsight && createPortal(
        <ClientInsightModal
          isOpen={showInsight}
          onClose={() => setShowInsight(false)}
          client={client}
          isMobile={isMobile}
          onNavigatePlan={onNavigatePlan}
          onNavigateWorkout={onNavigateWorkout}
          db={db}
          coachId={coachId}
          onOpenMealPanel={onOpenMealPanel}
          onOpenWorkoutPanel={onOpenWorkoutPanel}
        />,
        document.body
      )}

      {showLog && createPortal(
        <CoachingLogModal
          client={client}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowLog(false)}
          onLogSaved={(log) => {
            if (log.note) setPreviewNote(log.note)
            if (log.status) setLocalStatus(log.status)
          }}
        />,
        document.body
      )}
    </div>
  )
}
