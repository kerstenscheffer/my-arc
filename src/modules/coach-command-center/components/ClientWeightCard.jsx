// src/modules/coach-command-center/components/ClientWeightCard.jsx
// v3.0 — styling-upgrade: goud, bold wit, simpel. Gestript tot de essentie
// (naam, doel, gewicht+datum, gewicht-progressie, notitie-log, insight-knop,
// deactiveer). Gradients eruit → solide #0a0a0a.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingDown, TrendingUp,
  MessageCircle, Power, MoreHorizontal,
  BarChart3, BookOpen, Pause
} from 'lucide-react'
import ClientInsightModal from './ClientInsightModal'
import CoachingLogModal from './CoachingLogModal'
import { weightGoalColor } from '../../weight-tracker/utils/weightGoalColor'

const GOAL_LABELS = {
  afvallen: 'Afvallen', fat_loss: 'Afvallen', weight_loss: 'Afvallen',
  spieren: 'Spieropbouw', muscle_gain: 'Spieropbouw',
  recomp: 'Recomp', body_recomposition: 'Recomp',
  fitness: 'Fitter worden', general_fitness: 'Fitter worden',
}

export default function ClientWeightCard({ client, isMobile, onToggleStatus, showStatusToggle = false, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel }) {
  const [showInsight, setShowInsight]   = useState(false)
  const [showLog, setShowLog]           = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const [toggling, setToggling]         = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)

  const latestLog = client.latestCoachingLog || null
  const [previewNote, setPreviewNote] = useState(latestLog?.note || client.coachingPlan?.plan?.coach_notitie || null)

  const weightData    = client.weightData
  const latest        = weightData?.latest
  const history       = weightData?.history || []
  const isInactive    = client.status === 'inactive'

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

  // Kalenderweek-gemiddelden — appels met appels i.p.v. rollende 7-daagse
  // vensters. weekOffset 0 = deze week (Ma→Zo), -1 = vorige week, enz.
  const mondayOf = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const getCalendarWeekAvg = (weekOffset = 0) => {
    const monday = mondayOf(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    const entries = history.filter(e => {
      const d = new Date(e.date)
      return d >= monday && d <= sunday
    })
    if (entries.length === 0) return { avg: null, count: 0, monday, sunday }
    const avg = parseFloat(
      (entries.reduce((t, e) => t + parseFloat(e.weight), 0) / entries.length).toFixed(1)
    )
    return { avg, count: entries.length, monday, sunday }
  }
  const fmtWeekRange = (mon, sun) => {
    const fmt = d => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${fmt(mon)} – ${fmt(sun)}`
  }
  const thisWeek = getCalendarWeekAvg(0)
  const lastWeek = getCalendarWeekAvg(-1)
  const curAvg  = thisWeek.avg
  const prevAvg = lastWeek.avg
  const weekDiff = (curAvg !== null && prevAvg !== null)
    ? parseFloat((curAvg - prevAvg).toFixed(1))
    : null

  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstEntry  = sortedHistory[0]
  const latestEntry = sortedHistory[sortedHistory.length - 1]
  const totalChange = (firstEntry && latestEntry && sortedHistory.length >= 2)
    ? parseFloat((parseFloat(latestEntry.weight) - parseFloat(firstEntry.weight)).toFixed(1))
    : null
  const startDateLabel = firstEntry
    ? new Date(firstEntry.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null
  const totalEntries = sortedHistory.length

  const openWhatsApp = () => {
    let phone = client.phone || client.phone_number || ''
    phone = phone.replace(/[\s-]/g, '')
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

  const urgencyColor = getUrgencyColor()

  const intakeDoel = client.coachingPlan?.plan?.intake_call_notes?.notes?.doel
  const goalRoute  = intakeDoel?.route || client.primary_goal || null
  const goalLabel  = GOAL_LABELS[goalRoute] || goalRoute || null

  const isPaused = client.coaching_status === 'paused'

  // Eén status-signaal: de linker-accentrand (urgentiekleur). Verder solide
  // #0a0a0a met een subtiele goud-rand — geen gradients, niet druk.
  const cardBorderLeft = `3px solid ${urgencyColor}`

  // Gedeelde stat-config voor de gewicht-progressie.
  const progressionStats = [
    { label: 'Deze week',   val: curAvg ?? '—',  color: '#FFD700' },
    { label: 'Vorige week', val: prevAvg ?? '—', color: '#fff' },
    {
      label: 'Verschil',
      val: weekDiff !== null ? `${weekDiff > 0 ? '+' : ''}${weekDiff}` : '—',
      color: weekDiff !== null ? weightGoalColor(weekDiff, client.weekly_weight_goal) : 'rgba(255,255,255,0.4)',
    },
    {
      label: 'Sinds start',
      val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—',
      color: totalChange !== null ? weightGoalColor(totalChange, client.weekly_weight_goal) : 'rgba(255,255,255,0.4)',
    },
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,215,0,0.15)',
      borderLeft: cardBorderLeft,
      borderRadius: isMobile ? '12px' : '14px',
      overflow: 'hidden', position: 'relative',
      transition: 'all 0.2s ease', transform: 'translateZ(0)',
      opacity: isInactive ? 0.55 : 1,
    }}>

      {/* ── PAUSE BANNER ── */}
      {isPaused && (
        <div style={{
          padding: '0.35rem 0.85rem',
          background: 'rgba(245,158,11,0.12)',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: '#f59e0b',
        }}>
          <Pause size={12} strokeWidth={2.8} fill="#f59e0b" />
          <span style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Coaching gepauzeerd
          </span>
        </div>
      )}

      {/* ── ROW 1 — naam + doel · gewicht + datum ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 1rem',
        gap: isMobile ? '0.5rem' : '0.625rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', minWidth: 0 }}>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: isInactive ? '#6b7280' : '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, letterSpacing: '-0.01em' }}>
              {client.first_name} {client.last_name}
            </h3>
            {isInactive && (
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.1rem 0.3rem', background: 'rgba(107,114,128,0.15)', borderRadius: '4px', flexShrink: 0 }}>off</span>
            )}
          </div>
          {goalLabel && (
            <span style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {goalLabel}
            </span>
          )}
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: isMobile ? '1.6rem' : '1.85rem', fontWeight: 900, color: isInactive ? '#6b7280' : '#FFD700', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {latest?.weight ? latest.weight.toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isInactive ? 'rgba(107,114,128,0.5)' : 'rgba(255,215,0,0.45)', marginBottom: '0.1rem' }}>kg</span>
            {trend && !isInactive && (
              trend === 'down'
                ? <TrendingDown size={15} color="#10b981" style={{ marginLeft: '0.2rem' }} />
                : <TrendingUp   size={15} color="#ef4444" style={{ marginLeft: '0.2rem' }} />
            )}
          </div>
          {latest?.date && (
            <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem', textAlign: 'right' }}>
              {new Date(latest.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2 — gewicht-progressie ── */}
      {!isInactive && (
        <>
          {!statsExpanded ? (
            <button
              onClick={() => setStatsExpanded(true)}
              style={{
                width: '100%', display: 'grid',
                gridTemplateColumns: '1fr 1fr 0.75fr 0.85fr auto',
                alignItems: 'center',
                padding: isMobile ? '0.6rem 0.85rem' : '0.65rem 1rem',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', gap: '0.55rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {progressionStats.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, gap: 2 }}>
                  <span style={{ fontSize: isMobile ? '0.6rem' : '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    {s.val}<span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.5, marginLeft: 2 }}>kg</span>
                  </span>
                </div>
              ))}
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,215,0,0.4)', fontWeight: 700, justifySelf: 'end' }}>▾</span>
            </button>
          ) : (
            <div
              onClick={() => setStatsExpanded(false)}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
                padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,215,0,0.02)', cursor: 'pointer',
              }}
            >
              {[
                { label: 'Deze week (Ma-Zo)',   sub: thisWeek.count > 0 ? `${thisWeek.count} meting${thisWeek.count === 1 ? '' : 'en'} · ${fmtWeekRange(thisWeek.monday, thisWeek.sunday)}` : `geen metingen · ${fmtWeekRange(thisWeek.monday, thisWeek.sunday)}`, val: curAvg ?? '—', color: '#FFD700' },
                { label: 'Vorige week (Ma-Zo)', sub: lastWeek.count > 0 ? `${lastWeek.count} meting${lastWeek.count === 1 ? '' : 'en'} · ${fmtWeekRange(lastWeek.monday, lastWeek.sunday)}` : `geen metingen · ${fmtWeekRange(lastWeek.monday, lastWeek.sunday)}`, val: prevAvg ?? '—', color: '#fff' },
                { label: 'vs Vorige week', sub: weekDiff !== null ? 'verschil tussen weekgemiddelden' : 'geen vergelijking', val: weekDiff !== null ? `${weekDiff > 0 ? '+' : ''}${weekDiff}` : '—', color: weekDiff !== null ? weightGoalColor(weekDiff, client.weekly_weight_goal) : 'rgba(255,255,255,0.4)' },
                { label: 'Sinds start', sub: startDateLabel ? `eerste meting · ${startDateLabel}` : 'geen startmeting', val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—', color: totalChange !== null ? weightGoalColor(totalChange, client.weekly_weight_goal) : 'rgba(255,255,255,0.4)' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '0.5rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{s.label}</div>
                  <div style={{ fontSize: isMobile ? '1.2rem' : '1.3rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                    {s.val}<span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.5, marginLeft: 4 }}>kg</span>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{s.sub}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                {totalEntries} meting{totalEntries === 1 ? '' : 'en'} totaal · klik om in te klappen
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ROW 3 — notitie + acties (Log · Inzicht · ⋯) ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.55rem 0.85rem' : '0.6rem 1rem', gap: '0.5rem', minHeight: '44px' }}>
        <span onClick={() => setShowLog(true)} style={{ flex: 1, minWidth: 0, fontSize: '0.7rem', color: previewNote ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)', fontStyle: previewNote ? 'italic' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', touchAction: 'manipulation' }}>
          {previewNote || 'Geen notities...'}
        </span>

        <button onClick={() => setShowLog(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '32px' }}>
          <BookOpen size={12} /> Log
        </button>

        <button onClick={() => setShowInsight(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.7rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: '8px', color: '#FFD700', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '32px' }}>
          <BarChart3 size={12} /> Inzicht
        </button>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: showMenu ? 'rgba(255,255,255,0.08)' : 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.25rem', zIndex: 100, background: '#111', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '10px', overflow: 'hidden', minWidth: '150px', boxShadow: '0 -8px 24px rgba(0,0,0,0.6)' }}>
                {hasPhone && !isInactive && (
                  <button onClick={() => { openWhatsApp(); setShowMenu(false) }} style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', color: '#25D366', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                )}
                {showStatusToggle && (
                  <button onClick={handleToggle} disabled={toggling} style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', borderTop: hasPhone && !isInactive ? '1px solid rgba(255,255,255,0.06)' : 'none', color: isInactive ? '#10b981' : '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: toggling ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', opacity: toggling ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Power size={15} /> {isInactive ? 'Activeer' : 'Deactiveer'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
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
          onSwitchToClientView={(c) => {
            localStorage.setItem('coachPreviewClientId', c.id)
            localStorage.setItem('isClientMode', 'true')
            window.location.href = '/'
          }}
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
          }}
        />,
        document.body
      )}
    </div>
  )
}
