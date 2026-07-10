// src/modules/lead-management/components/DailyStatsBar.jsx
// VERSION 3.0 - SOP KNOP + STYLING CLEANUP
// Added: SOP panel (DM routine + warm-up + outreach)

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Activity, Target, Clock, TrendingUp, MessageCircle, Users, Calendar, FileText, Zap, ChevronDown, ChevronUp, Flame, BookOpen, X, CheckCircle, BarChart3, Send } from 'lucide-react'
import { exportDailyReport } from '../utils/exportDailyReport'
import WeekStatsModal from './WeekStatsModal'

// GOLD THEME (consistent)
const G = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  border: 'rgba(212, 175, 55, 0.15)',
  bg: 'rgba(212, 175, 55, 0.08)',
  bgStrong: 'rgba(212, 175, 55, 0.15)'
}

// ============================================
// SOP DATA
// ============================================
const SOP_STEPS = [
  {
    phase: 'DM Beantwoorden',
    time: '09:00',
    color: '#3b82f6',
    collapsed: false,
    steps: [
      { text: 'Open Instagram DM\'s', detail: 'Beantwoord iedereen die gereageerd heeft' },
      { text: 'Update kanban per lead', detail: 'Vink "contacted today" aan, update reply count' },
      { text: 'Noteer struggle/doel bij nieuwe info', detail: 'Gebruik het info panel op de kaart' },
      { text: 'Optioneel: gebruik DM flow modal', detail: 'Klik 💬 op de kaart voor kant-en-klare berichten per fase' }
    ]
  },
  {
    phase: 'Follow-ups',
    time: '09:30',
    color: '#f59e0b',
    collapsed: false,
    steps: [
      { text: 'Check "Stil" secties (1d, 2d, 3+)', detail: 'Leads die niet gereageerd hebben' },
      { text: 'Stuur follow-up bericht', detail: 'Gebruik ghost berichten uit DM flow' },
      { text: 'Na 3+ dagen stil → overweeg snooze', detail: 'Later Follow Up sectie of loslaten' }
    ]
  },
  {
    phase: 'Nieuwe Outreach',
    time: '10:00',
    color: '#10b981',
    collapsed: true,
    steps: [
      { text: 'Zoek nieuwe leads via Instagram', detail: 'Hashtags, suggested, competitor followers' },
      { text: 'Voeg toe aan kanban of Warm-Up board', detail: 'Instagram handle + bron + notities' },
      { text: 'Of direct DM bij sterke match', detail: 'Voeg toe aan kanban → start gesprek' },
      { text: 'Doel: minimaal 10 nieuwe leads/dag', detail: 'Track via DailyStats "Nieuw" counter' }
    ]
  }
]

export default function DailyStatsBar({ 
  leadService, 
  coachId, 
  sections = [],
  isMobile,
  coachName = 'Coach',
  dailyGoal = 100,
  onExportPDF
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSOP, setShowSOP] = useState(false)
  const [showWeek, setShowWeek] = useState(false)
  const [stats, setStats] = useState({
    newOutreach: 0, followUps: 0, totalTouches: 0,
    movementsBySection: {}, totalMovements: 0,
    followupToday: 0,
  })
  const [funnel, setFunnel] = useState({
    replied: { count: 0, leads: [] },
    conversation: { count: 0, leads: [] },
    callScheduled: { count: 0, leads: [] }
  })
  const [activityData, setActivityData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [leadService, coachId, sections])

  const loadStats = async () => {
    if (!leadService || !coachId) return
    try {
      const [activity, funnelStats, followupToday] = await Promise.all([
        leadService.getTodayActivity(coachId),
        leadService.getTodayFunnelStats(coachId),
        leadService.getTodayFollowupCount(coachId),
      ])
      setStats({
        newOutreach: activity.newOutreach || 0,
        followUps: activity.followUps || 0,
        totalTouches: activity.totalTouches || 0,
        movementsBySection: activity.movementsBySection || {},
        totalMovements: activity.totalMovements || 0,
        followupToday: followupToday || 0,
      })
      setFunnel(funnelStats)
      setActivityData(activity)
    } catch (error) {
      console.error('❌ Load stats failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const remaining = Math.max(0, dailyGoal - stats.newOutreach)
  const now = new Date()
  const endOfDay = new Date(now); endOfDay.setHours(22, 0, 0, 0)
  const hoursLeft = Math.max(1, (endOfDay - now) / (1000 * 60 * 60))
  const perHour = remaining > 0 ? Math.ceil(remaining / hoursLeft) : 0
  const progress = Math.min(100, Math.round((stats.newOutreach / dailyGoal) * 100))
  const isGoalMet = progress >= 100

  const handleExport = () => {
    if (onExportPDF) onExportPDF()
    else exportDailyReport(sections, { coachName, dailyGoal }, activityData, funnel)
  }

  if (loading) {
    return (
      <div style={{
        background: '#0a0a0a',
        borderRadius: '8px',
        border: `1px solid rgba(255,255,255,0.06)`,
        padding: '0.5rem 0.75rem',
        marginBottom: '0.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>Laden...</div>
      </div>
    )
  }

  // ===== COLLAPSED VIEW =====
  if (!isExpanded) {
    return (
      <>
        <div style={{
          background: '#0a0a0a',
          borderRadius: '8px',
          border: `1px solid rgba(255,255,255,0.06)`,
          padding: '0.4rem 0.625rem',
          marginBottom: '0.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          {/* Left: Quick Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
            {/* Progress Circle */}
            <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
              <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle cx="16" cy="16" r="13" fill="none" 
                  stroke={isGoalMet ? G.light : G.primary}
                  strokeWidth="2.5" 
                  strokeDasharray={`${progress * 0.82} 82`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '0.6rem', fontWeight: '800',
                color: isGoalMet ? G.light : G.primary,
                fontFamily: 'monospace'
              }}>
                {progress}%
              </div>
            </div>

            {/* Key Numbers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isGoalMet ? G.light : '#fff', fontFamily: 'monospace' }}>
                  {stats.newOutreach}
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NIEUW</div>
              </div>

              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.06)' }} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>{stats.followUps}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FOLLOW</div>
              </div>

              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Funnel mini */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '2px',
                  padding: '2px 5px',
                  background: funnel.replied.count > 0 ? G.bg : 'transparent',
                  border: `1px solid ${funnel.replied.count > 0 ? G.border : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: '3px'
                }}>
                  <MessageCircle size={8} color={funnel.replied.count > 0 ? G.primary : 'rgba(255,255,255,0.2)'} />
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: funnel.replied.count > 0 ? G.primary : 'rgba(255,255,255,0.2)' }}>{funnel.replied.count}</span>
                </span>

                <span style={{
                  display: 'flex', alignItems: 'center', gap: '2px',
                  padding: '2px 5px',
                  background: funnel.callScheduled.count > 0 ? G.bgStrong : 'transparent',
                  border: `1px solid ${funnel.callScheduled.count > 0 ? G.primary : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: '3px'
                }}>
                  <Calendar size={8} color={funnel.callScheduled.count > 0 ? G.light : 'rgba(255,255,255,0.2)'} />
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: funnel.callScheduled.count > 0 ? G.light : 'rgba(255,255,255,0.2)' }}>{funnel.callScheduled.count}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Week + SOP + PDF + Expand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            {/* Week stats — opens a modal with current + previous weeks */}
            <button onClick={() => setShowWeek(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '4px 8px',
                background: G.bg,
                border: `1px solid ${G.border}`,
                borderRadius: '5px',
                color: G.primary,
                fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '26px',
              }}>
              <BarChart3 size={10} />
              WEEK
            </button>

            {/* SOP Button */}
            <button onClick={() => setShowSOP(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '4px 8px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '5px',
                color: '#a855f7',
                fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '26px'
              }}>
              <BookOpen size={10} />
              SOP
            </button>

            {/* PDF Button */}
            <button onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '4px 8px',
                background: G.bg,
                border: `1px solid ${G.border}`,
                borderRadius: '5px',
                color: G.primary,
                fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '26px'
              }}>
              <FileText size={10} />
              PDF
            </button>

            {/* Expand */}
            <button onClick={() => setIsExpanded(true)}
              style={{
                width: '26px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '5px',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}>
              <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {/* SOP MODAL */}
        {showSOP && <SOPModal isMobile={isMobile} onClose={() => setShowSOP(false)} />}
        <WeekStatsModal
          isOpen={showWeek}
          onClose={() => setShowWeek(false)}
          leadService={leadService}
          coachId={coachId}
          isMobile={isMobile}
        />
      </>
    )
  }

  // ===== EXPANDED VIEW =====
  return (
    <>
      <div style={{
        background: '#0a0a0a',
        borderRadius: isMobile ? '10px' : '12px',
        border: `1px solid rgba(255,255,255,0.06)`,
        overflow: 'hidden',
        marginBottom: '0.5rem'
      }}>
        {/* HEADER */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.4rem 0.625rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Flame size={13} color={G.primary} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: G.light }}>Dagelijks Overzicht</span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
              {new Date().toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={() => setShowWeek(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', background: G.bg, border: `1px solid ${G.border}`, borderRadius: '5px', color: G.primary, fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '26px' }}>
              <BarChart3 size={10} /> WEEK
            </button>
            <button onClick={() => setShowSOP(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '5px', color: '#a855f7', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '26px' }}>
              <BookOpen size={10} /> SOP
            </button>
            <button onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 8px', background: G.bg, border: `1px solid ${G.border}`, borderRadius: '5px', color: G.primary, fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', minHeight: '26px' }}>
              <FileText size={10} /> PDF
            </button>
            <button onClick={() => setIsExpanded(false)}
              style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', touchAction: 'manipulation' }}>
              <ChevronUp size={12} />
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.375rem',
          padding: '0.5rem'
        }}>
          <StatCard icon={<Zap size={9} />} label="Nieuw" value={stats.newOutreach} highlight={progress >= 90} progress={progress} subtext={`${progress}% van ${dailyGoal}`} />
          <StatCard icon={<TrendingUp size={9} />} label="Follow-up" value={stats.followUps} subtext="Bestaande leads" />
          <StatCard icon={<Send size={9} />} label="Opvolg-DM" value={stats.followupToday} highlight={stats.followupToday > 0} subtext="Leads vandaag" />
          <StatCard icon={<Target size={9} />} label="Totaal" value={stats.totalTouches} subtext="Alle touches" />
          <StatCard icon={<MessageCircle size={9} />} label="Reacties" value={funnel.replied.count} highlight={funnel.replied.count > 0} subtext="Antwoorden" />
          <StatCard icon={<Users size={9} />} label="Gesprek" value={funnel.conversation.count} highlight={funnel.conversation.count > 0} subtext="Kwalificatie" />
          <StatCard icon={<Calendar size={9} />} label="Calls" value={funnel.callScheduled.count} highlight={funnel.callScheduled.count > 0} subtext="Ingepland" />
          <StatCard icon={<Clock size={9} />} label="Per Uur" value={perHour} subtext={`${remaining} nog`} />
          <StatCard icon={<Activity size={9} />} label="Moves" value={stats.totalMovements} subtext="Verplaatsingen" />
          <div style={{
            background: isGoalMet ? G.bgStrong : 'rgba(255,255,255,0.02)',
            borderRadius: '6px', padding: '0.4rem',
            border: `1px solid ${isGoalMet ? G.primary + '30' : 'rgba(255,255,255,0.04)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            {isGoalMet ? (
              <>
                <Flame size={13} color={G.light} style={{ marginBottom: '2px' }} />
                <span style={{ fontSize: '0.6rem', fontWeight: '700', color: G.light, textTransform: 'uppercase' }}>Doel!</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: G.primary, fontFamily: 'monospace' }}>{remaining}</div>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>TE GAAN</span>
              </>
            )}
          </div>
        </div>
      </div>

      {showSOP && <SOPModal isMobile={isMobile} onClose={() => setShowSOP(false)} />}
      <WeekStatsModal
        isOpen={showWeek}
        onClose={() => setShowWeek(false)}
        leadService={leadService}
        coachId={coachId}
        isMobile={isMobile}
      />
    </>
  )
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ icon, label, value, highlight = false, progress = null, subtext }) {
  return (
    <div style={{
      background: highlight ? G.bgStrong : 'rgba(255,255,255,0.02)',
      borderRadius: '6px', padding: '0.4rem',
      border: `1px solid ${highlight ? G.primary + '20' : 'rgba(255,255,255,0.04)'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
        <span style={{ color: highlight ? G.primary : 'rgba(255,255,255,0.25)' }}>{icon}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: highlight ? G.light : '#fff', fontFamily: 'monospace' }}>{value}</div>
      {progress !== null && (
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', marginTop: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: G.primary, borderRadius: '1px' }} />
        </div>
      )}
      {subtext && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>{subtext}</div>}
    </div>
  )
}

// ============================================
// SOP MODAL
// ============================================
export function SOPModal({ isMobile, onClose }) {
  const [checkedSteps, setCheckedSteps] = useState({})
  const [collapsedPhases, setCollapsedPhases] = useState(() => {
    const initial = {}
    SOP_STEPS.forEach((phase, idx) => { if (phase.collapsed) initial[idx] = true })
    return initial
  })

  const toggleStep = (phaseIdx, stepIdx) => {
    const key = `${phaseIdx}-${stepIdx}`
    setCheckedSteps(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const togglePhase = (phaseIdx) => {
    setCollapsedPhases(prev => ({ ...prev, [phaseIdx]: !prev[phaseIdx] }))
  }

  const totalSteps = SOP_STEPS.reduce((sum, phase) => sum + phase.steps.length, 0)
  const checkedCount = Object.values(checkedSteps).filter(Boolean).length
  const allDone = checkedCount === totalSteps

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 10000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        animation: 'sopFadeIn 0.15s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(139,92,246,0.15)',
          borderRadius: isMobile ? '16px 16px 0 0' : isMobile ? '10px' : '12px',
          width: isMobile ? '100%' : '480px',
          maxHeight: isMobile ? '85vh' : '80vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={14} color="#a855f7" />
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '800', color: '#fff' }}>DM SOP</span>
            <span style={{
              padding: '2px 6px',
              background: allDone ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.08)',
              border: `1px solid ${allDone ? 'rgba(16,185,129,0.25)' : 'rgba(139,92,246,0.15)'}`,
              borderRadius: '3px',
              fontSize: '0.6rem', fontWeight: '700',
              color: allDone ? '#10b981' : '#a855f7'
            }}>
              {checkedCount}/{totalSteps}
            </span>
          </div>
          <button onClick={onClose}
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {SOP_STEPS.map((phase, phaseIdx) => {
            const phaseChecked = phase.steps.every((_, stepIdx) => checkedSteps[`${phaseIdx}-${stepIdx}`])
            const isCollapsed = collapsedPhases[phaseIdx]
            return (
              <div key={phaseIdx}>
                {/* Phase header — clickable to collapse */}
                <button
                  onClick={() => togglePhase(phaseIdx)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: phaseChecked ? 'rgba(16,185,129,0.03)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: phaseChecked ? '#10b981' : phase.color,
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: '0.6rem', fontWeight: '700',
                    color: phaseChecked ? '#10b981' : phase.color,
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>
                    {phase.time}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700',
                    color: phaseChecked ? 'rgba(16,185,129,0.6)' : '#fff'
                  }}>
                    {phase.phase}
                  </span>
                  {phaseChecked && <CheckCircle size={11} color="#10b981" style={{ marginLeft: 'auto' }} />}
                  {!phaseChecked && (
                    <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.15)', transition: 'transform 0.15s ease', transform: isCollapsed ? 'rotate(0)' : 'rotate(180deg)' }}>
                      <ChevronDown size={12} />
                    </div>
                  )}
                </button>

                {/* Steps — collapsible */}
                {!isCollapsed && phase.steps.map((step, stepIdx) => {
                  const key = `${phaseIdx}-${stepIdx}`
                  const isChecked = checkedSteps[key]
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(phaseIdx, stepIdx)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        padding: isMobile ? '0.4rem 0.75rem 0.4rem 1.75rem' : '0.4rem 1rem 0.4rem 2rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        opacity: isChecked ? 0.4 : 1,
                        transition: 'opacity 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '16px', height: '16px', marginTop: '1px',
                        borderRadius: '4px',
                        border: isChecked ? '1.5px solid #10b981' : `1.5px solid rgba(255,255,255,0.12)`,
                        background: isChecked ? 'rgba(16,185,129,0.15)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isChecked && <CheckCircle size={10} color="#10b981" />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          fontWeight: '600',
                          color: isChecked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          lineHeight: 1.3
                        }}>
                          {step.text}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.55rem' : '0.6rem',
                          color: 'rgba(255,255,255,0.2)',
                          lineHeight: 1.3, marginTop: '1px'
                        }}>
                          {step.detail}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes sopFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  )
}
