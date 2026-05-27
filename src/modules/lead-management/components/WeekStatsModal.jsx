// src/modules/lead-management/components/WeekStatsModal.jsx
// Week-level stats overlay. Same metrics as the daily bar but aggregated
// over Mon–Sun, with arrow buttons to step backward/forward through
// previous weeks. Mounts via portal so it sits above the kanban board.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ChevronLeft, ChevronRight, ChevronDown, Calendar, Zap, TrendingUp,
  MessageCircle, Users, Phone, Trophy, Activity, BarChart3, PhoneCall,
  Send, FileText, Percent, UserX, Eye,
} from 'lucide-react'

const GOLD = '#FFD700'
const GOLD_DARK = '#D4AF37'

// Monday-anchored start of the week containing `date`.
const mondayOf = (date) => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const sundayOf = (mondayDate) => {
  const d = new Date(mondayDate)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

const fmtRange = (monday) => {
  const sun = new Date(monday); sun.setDate(monday.getDate() + 6)
  const left = monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const right = sun.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `${left} – ${right}`
}

const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

const sameMonday = (a, b) => mondayOf(a).getTime() === mondayOf(b).getTime()
const sameDay = (a, b) => {
  const x = new Date(a), y = new Date(b)
  return x.getFullYear() === y.getFullYear()
    && x.getMonth() === y.getMonth()
    && x.getDate() === y.getDate()
}
const fmtDay = (date) => date.toLocaleDateString('nl-NL', {
  weekday: 'long', day: 'numeric', month: 'short',
})
// Whole-number percentage with safe divide-by-zero. Returns null when the
// denominator is 0 so the UI can show "—" instead of 0% (which would suggest
// a real 0% conversion rather than "no data yet").
const pct = (num, den) => {
  if (!den || den <= 0) return null
  return Math.round((num / den) * 100)
}

export default function WeekStatsModal({ isOpen, onClose, leadService, coachId, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)
  // periodMode: 'day' = single day window, 'week' = Monday→Sunday window.
  // anchorDate is the reference point — for 'day' it's the chosen day,
  // for 'week' we use its Monday.
  const [periodMode, setPeriodMode] = useState('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState(null)
  const [funnel, setFunnel] = useState(null)
  const [sourceBreakdown, setSourceBreakdown] = useState(null)
  const [reactionStats, setReactionStats] = useState(null)

  // Resolve the [start, end) window once per render based on the mode.
  const { start, end } = (() => {
    if (periodMode === 'day') {
      const s = new Date(anchorDate); s.setHours(0, 0, 0, 0)
      const e = new Date(s); e.setDate(e.getDate() + 1)
      return { start: s, end: e }
    }
    const s = mondayOf(anchorDate)
    const e = new Date(s); e.setDate(e.getDate() + 7)
    return { start: s, end: e }
  })()

  useEffect(() => {
    if (!isOpen) return
    if (!leadService || !coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [a, f, srcs, rxn] = await Promise.all([
          leadService.getRangeActivity(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeFunnelStats(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeLeadSources
            ? leadService.getRangeLeadSources(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
          leadService.getRangeReactionStats
            ? leadService.getRangeReactionStats(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
        ])
        if (!cancelled) {
          setActivity(a); setFunnel(f); setSourceBreakdown(srcs); setReactionStats(rxn)
        }
      } catch (e) {
        console.error('WeekStatsModal load failed:', e)
        if (!cancelled) {
          setActivity(null); setFunnel(null); setSourceBreakdown(null); setReactionStats(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, leadService, coachId, periodMode, +start, +end])

  if (!isOpen) return null

  const stepDays = periodMode === 'day' ? 1 : 7
  const goPrev = () => {
    const next = new Date(anchorDate); next.setDate(anchorDate.getDate() - stepDays)
    setAnchorDate(next)
  }
  const goNext = () => {
    const next = new Date(anchorDate); next.setDate(anchorDate.getDate() + stepDays)
    setAnchorDate(next)
  }
  const goToday = () => setAnchorDate(new Date())

  const isCurrentPeriod = periodMode === 'day'
    ? sameDay(anchorDate, new Date())
    : sameMonday(anchorDate, new Date())
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0)
  const isFuturePeriod = periodMode === 'day'
    ? new Date(anchorDate).setHours(0,0,0,0) > todayMidnight.getTime()
    : mondayOf(anchorDate).getTime() > mondayOf(new Date()).getTime()

  const totalReplies = funnel?.replied?.count || 0
  const totalConvs = funnel?.conversation?.count || 0
  const totalCallProposed = funnel?.callProposed?.count || 0
  const totalCalls = funnel?.callScheduled?.count || 0
  const totalSales = funnel?.sale?.count || 0

  // Reactie-stats — uses the lead-card counters as the source of truth:
  //   reply_count   > 0  → lead reacted (Reactie-knop)
  //   followup_count > 0 → coach had to chase (= no reply yet)
  // newLeads here is "leads created in the window" (per call_leads.created_at),
  // which differs from activity.newOutreach (movement-based).
  const newLeadsInPeriod   = reactionStats?.newLeads        ?? 0
  const reactedLeads       = reactionStats?.reactedLeads    ?? 0
  const notReactedLeads    = reactionStats?.notReactedYet   ?? 0
  const followedLeads      = reactionStats?.followedLeads   ?? 0
  const followupsInWindow  = reactionStats?.followupsInWindow ?? 0

  const responseRate = pct(reactedLeads, newLeadsInPeriod)
  const callRate     = pct(totalCalls + totalCallProposed, newLeadsInPeriod)
  const saleRate     = pct(totalSales, newLeadsInPeriod)
  const closeRate    = pct(totalSales, totalCalls + totalCallProposed) // sales / calls
  // What share of leads needed a chase to get any reply at all.
  const chaseShare   = pct(followedLeads, newLeadsInPeriod)

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483450,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'calc(100vw - 32px)',
          maxWidth: isMobile ? '100%' : 1400,
          height: isMobile ? '92vh' : 'calc(100vh - 48px)',
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.18)',
          borderRadius: isMobile ? '16px 16px 0 0' : 14,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 0.85rem 0.7rem' : '0.9rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.55rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <BarChart3 size={17} color={GOLD} />
          <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
            Stats — {periodMode === 'day' ? 'Dag' : 'Week'}
          </div>
          <button onClick={onClose} title="Sluiten" style={iconBtn}>
            <X size={16} />
          </button>
        </div>

        {/* Period mode toggle */}
        <div style={{
          flexShrink: 0, padding: '0.55rem 0.85rem 0',
          display: 'flex', gap: 4,
        }}>
          {['day', 'week'].map(mode => {
            const active = periodMode === mode
            return (
              <button
                key={mode}
                onClick={() => setPeriodMode(mode)}
                style={{
                  flex: 1, padding: '0.4rem',
                  background: active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6,
                  color: active ? GOLD : 'rgba(255,255,255,0.5)',
                  fontSize: '0.72rem', fontWeight: 800,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                {mode === 'day' ? '📅 Dag' : '🗓️ Week'}
              </button>
            )
          })}
        </div>

        {/* Period navigator */}
        <div style={{
          flexShrink: 0, padding: '0.55rem 0.85rem 0.7rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button onClick={goPrev} title={periodMode === 'day' ? 'Vorige dag' : 'Vorige week'} style={navBtn}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {periodMode === 'day'
                ? (isCurrentPeriod ? 'Vandaag' : fmtDay(anchorDate).split(' ').slice(0, -2).join(' '))
                : `Week ${isoWeek(mondayOf(anchorDate))}${isCurrentPeriod ? ' · Deze week' : ''}`
              }
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>
              {periodMode === 'day' ? fmtDay(anchorDate) : fmtRange(mondayOf(anchorDate))}
            </div>
          </div>
          <button onClick={goNext} title={periodMode === 'day' ? 'Volgende dag' : 'Volgende week'} disabled={isFuturePeriod} style={{ ...navBtn, opacity: isFuturePeriod ? 0.3 : 1, cursor: isFuturePeriod ? 'not-allowed' : 'pointer' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '0.85rem',
        }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              Laden…
            </div>
          )}

          {!loading && activity && (
            <>
              <SectionTitle icon={<Activity size={13} color={GOLD} />} title="Activiteit" />
              <Grid>
                <StatCard
                  icon={<Zap size={14} />} label="Nieuwe leads"
                  value={activity.newOutreach} accent={GOLD}
                />
                <StatCard
                  icon={<TrendingUp size={14} />} label="Follow-ups"
                  value={activity.followUps}
                />
                <StatCard
                  icon={<Activity size={14} />} label="Verplaatsingen"
                  value={activity.totalMovements}
                />
              </Grid>

              <SectionTitle icon={<MessageCircle size={13} color={GOLD} />} title="Reactie" />
              <Grid>
                <StatCard
                  icon={<MessageCircle size={14} />} label="Gereageerd"
                  value={reactedLeads} accent="#3b82f6"
                  subtext={newLeadsInPeriod > 0
                    ? `van ${newLeadsInPeriod} nieuwe leads`
                    : 'geen nieuwe leads'}
                />
                <StatCard
                  icon={<UserX size={14} />} label="Niet gereageerd"
                  value={notReactedLeads} accent="#6b7280"
                  subtext={newLeadsInPeriod > 0 ? 'reply_count = 0' : '—'}
                />
                <StatCard
                  icon={<Send size={14} />} label="Opvolg verstuurd"
                  value={followupsInWindow}
                  accent={GOLD_DARK}
                  subtext={`naar ${followedLeads} leads totaal`}
                />
              </Grid>

              <SectionTitle icon={<Percent size={13} color={GOLD} />} title="Conversie ratio's" />
              <Grid>
                <RatioCard
                  icon={<MessageCircle size={14} />} label="Response rate"
                  value={responseRate} accent="#3b82f6"
                  subtext={`${reactedLeads} / ${newLeadsInPeriod}`}
                />
                <RatioCard
                  icon={<Send size={14} />} label="Opvolg-share"
                  value={chaseShare} accent={GOLD_DARK}
                  subtext={`${followedLeads} / ${newLeadsInPeriod} kreeg follow-up`}
                />
                <RatioCard
                  icon={<Phone size={14} />} label="Call rate"
                  value={callRate} accent={GOLD_DARK}
                  subtext={`${totalCalls + totalCallProposed} / ${newLeadsInPeriod}`}
                />
                <RatioCard
                  icon={<Trophy size={14} />} label="Sale rate"
                  value={saleRate} accent="#10b981"
                  subtext={`${totalSales} / ${newLeadsInPeriod}`}
                />
                <RatioCard
                  icon={<Trophy size={14} />} label="Close rate"
                  value={closeRate} accent="#10b981"
                  subtext={`${totalSales} / ${totalCalls + totalCallProposed} calls`}
                />
              </Grid>

              <SectionTitle icon={<MessageCircle size={13} color={GOLD} />} title="Funnel" />
              <Grid>
                <StatCard
                  icon={<MessageCircle size={14} />} label="Reacties"
                  value={totalReplies} accent="#3b82f6"
                />
                <StatCard
                  icon={<Users size={14} />} label="Gesprekken"
                  value={totalConvs} accent="#8b5cf6"
                />
                <StatCard
                  icon={<PhoneCall size={14} />} label="Call voorgesteld"
                  value={totalCallProposed} accent="#ef4444"
                />
                <StatCard
                  icon={<Phone size={14} />} label="Calls ingepland"
                  value={totalCalls} accent={GOLD_DARK}
                />
                <StatCard
                  icon={<Trophy size={14} />} label="Sales"
                  value={totalSales} accent="#10b981" highlight={totalSales > 0}
                />
              </Grid>

              {/* Source breakdown — which campaigns / magnets brought leads in */}
              {sourceBreakdown && (sourceBreakdown.campaigns.length > 0 || sourceBreakdown.magnets.length > 0 || sourceBreakdown.noSource.total > 0) && (
                <>
                  <SectionTitle icon={<Send size={13} color={GOLD} />} title={`Bron-breakdown · ${sourceBreakdown.totalLeads} nieuwe leads`} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {sourceBreakdown.campaigns.map(c => (
                      <SourceRow key={c.id} icon={<Send size={12} color={GOLD} />} label={c.name} total={c.total} reached={c.reached} stages={c.stages} followupCount={c.followupCount} repliedLeads={c.repliedLeads} followedLeads={c.followedLeads} messageText={c.messageText} platform={c.platform} purpose={c.purpose} />
                    ))}
                    {sourceBreakdown.magnets.map(m => (
                      <SourceRow key={m.id} icon={<FileText size={12} color="#3b82f6" />} label={m.name} total={m.total} reached={m.reached} stages={m.stages} followupCount={m.followupCount} repliedLeads={m.repliedLeads} followedLeads={m.followedLeads} description={m.description} accent="#3b82f6" />
                    ))}
                    {sourceBreakdown.noSource.total > 0 && (
                      <SourceRow icon={<X size={12} color="rgba(255,255,255,0.4)" />} label="Geen bron toegewezen" total={sourceBreakdown.noSource.total} reached={sourceBreakdown.noSource.reached} stages={sourceBreakdown.noSource.stages} followupCount={sourceBreakdown.noSource.followupCount} repliedLeads={sourceBreakdown.noSource.repliedLeads} followedLeads={sourceBreakdown.noSource.followedLeads} accent="rgba(255,255,255,0.4)" muted />
                    )}
                  </div>
                </>
              )}

              {/* Recent movements list */}
              {activity.movementsList && activity.movementsList.length > 0 && (
                <>
                  <SectionTitle icon={<Calendar size={13} color={GOLD} />} title={`Verplaatsingen (${activity.movementsList.length})`} />
                  <div style={{
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {activity.movementsList.slice(0, 30).map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        borderBottom: i === Math.min(29, activity.movementsList.length - 1) ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.75rem',
                      }}>
                        <span style={{ flex: 1, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.leadName}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>
                          {m.from} → <span style={{ color: GOLD }}>{m.to}</span>
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', minWidth: 70, textAlign: 'right' }}>
                          {m.time}
                        </span>
                      </div>
                    ))}
                    {activity.movementsList.length > 30 && (
                      <div style={{
                        padding: '0.5rem 0.65rem', textAlign: 'center',
                        color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem',
                      }}>
                        +{activity.movementsList.length - 30} meer…
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isCurrentPeriod && (
                <div style={{ marginTop: '0.85rem' }}>
                  <button onClick={goToday} style={{
                    width: '100%', minHeight: 42, padding: '0 0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    background: 'rgba(255,215,0,0.1)',
                    border: `1px solid rgba(255,215,0,0.3)`,
                    borderRadius: 8, color: GOLD,
                    fontWeight: 700, fontSize: '0.78rem',
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}>
                    <Calendar size={14} /> Terug naar {periodMode === 'day' ? 'vandaag' : 'deze week'}
                  </button>
                </div>
              )}

              {activity.totalTouches === 0 && activity.totalMovements === 0 && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.85rem',
                }}>
                  Geen activiteit in deze {periodMode === 'day' ? 'dag' : 'week'}.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

const iconBtn = {
  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: 'none',
  borderRadius: 8, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}
const navBtn = {
  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      margin: '0.85rem 0 0.45rem',
      color: 'rgba(255,255,255,0.55)',
      fontSize: '0.7rem', fontWeight: 800,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {icon} {title}
    </div>
  )
}

function Grid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '0.4rem',
    }}>
      {children}
    </div>
  )
}

function SourceRow({ icon, label, total, reached, stages, followupCount = 0, repliedLeads = 0, followedLeads = 0, messageText = null, description = null, platform = null, purpose = null, accent = '#FFD700', muted = false }) {
  const [expanded, setExpanded] = useState(false)
  const reachedPct = total > 0 ? Math.round((reached / total) * 100) : 0
  const s = stages || { replied: 0, callProposed: 0, callScheduled: 0, sale: 0 }
  // Avg followups per lead — gives a sense of how nurture-heavy a source
  // is, without the noise of raw totals (a big campaign always wins).
  const avgFollow = total > 0 ? (followupCount / total).toFixed(1) : '0'

  // Per-source ratios — same definitions as the top-level Conversie ratio's
  // section, but scoped to this single source's lead cohort.
  const calls = (s.callProposed || 0) + (s.callScheduled || 0)
  const responseRate = pct(repliedLeads,  total)
  const callRate     = pct(calls,         total)
  const saleRate     = pct(s.sale,        total)
  const closeRate    = pct(s.sale,        calls)
  const chaseShare   = pct(followedLeads, total)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.45rem',
      padding: '0.55rem 0.65rem',
      background: muted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 7,
    }}>
      {/* Row 1: icon + label + big total — clickable to expand */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: muted ? 'rgba(255,255,255,0.5)' : '#fff',
            fontSize: '0.8rem', fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
          <div style={{
            marginTop: 3,
            height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${reachedPct}%`, height: '100%',
              background: accent, transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '1.05rem', fontWeight: 900,
            color: muted ? 'rgba(255,255,255,0.5)' : accent,
            fontFamily: 'monospace', lineHeight: 1,
          }}>
            {total}
          </div>
          <div style={{
            fontSize: '0.5rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2,
          }}>
            leads
          </div>
        </div>
        <ChevronDown
          size={13}
          color="rgba(255,255,255,0.4)"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s', flexShrink: 0,
          }}
        />
      </div>

      {/* Row 2: stage breakdown — 5 small pills (4 stages + followup) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.35rem',
      }}>
        <StagePill label="Reactie"  value={s.replied}       color="#3b82f6" />
        <StagePill label="Voorgest." value={s.callProposed}  color="#ef4444" />
        <StagePill label="Ingepl."   value={s.callScheduled} color="#FFD700" />
        <StagePill label="Sale"     value={s.sale}          color="#10b981" />
        <StagePill label={`Opvolg · ø${avgFollow}`} value={followupCount} color="#FFD700" />
      </div>

      {/* Expanded: per-source % metrics + the actual outreach message that
          this source used. Same definitions as the top Conversie ratio's
          section, but scoped to this single source. */}
      {expanded && (
        <div style={{
          marginTop: 4,
          paddingTop: '0.45rem',
          borderTop: '1px dashed rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.35rem',
          }}>
            <MiniRatio label="Response" value={responseRate}
              sub={`${repliedLeads} / ${total}`} accent="#3b82f6" />
            <MiniRatio label="Opvolg-share" value={chaseShare}
              sub={`${followedLeads} / ${total}`} accent="#D4AF37" />
            <MiniRatio label="Call rate" value={callRate}
              sub={`${calls} / ${total}`} accent="#D4AF37" />
            <MiniRatio label="Sale rate" value={saleRate}
              sub={`${s.sale} / ${total}`} accent="#10b981" />
            <MiniRatio label="Close rate" value={closeRate}
              sub={`${s.sale} / ${calls} calls`} accent="#10b981" />
          </div>

          {/* Outreach-message preview (campaigns) of magnet-description.
              Pure read-only inside the metrics modal — handy for the "wat
              heb ik ook alweer naar deze cohort gestuurd?" vraag. */}
          {(messageText || description) && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid ${accent}33`,
              borderRadius: 6,
              padding: '0.55rem 0.7rem',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4,
                fontSize: '0.55rem', fontWeight: 800,
                color: accent, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <MessageCircle size={10} />
                {messageText ? 'Outreach bericht' : 'Lead magnet beschrijving'}
                {platform && (
                  <span style={{
                    marginLeft: 6, padding: '1px 5px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.5rem', borderRadius: 3,
                    letterSpacing: '0.02em',
                  }}>{platform}</span>
                )}
                {purpose && (
                  <span style={{
                    padding: '1px 5px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.5rem', borderRadius: 3,
                  }}>{purpose}</span>
                )}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}>
                {messageText || description}
              </div>
            </div>
          )}
          {!messageText && !description && (
            <div style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
              fontStyle: 'italic', textAlign: 'center', padding: '0.3rem',
            }}>
              Geen bericht / beschrijving opgeslagen voor deze bron.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MiniRatio({ label, value, sub, accent }) {
  const hasValue = value !== null && value !== undefined
  return (
    <div style={{
      padding: '0.35rem 0.45rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: '0.85rem', fontWeight: 900,
          color: hasValue ? accent : 'rgba(255,255,255,0.25)',
          fontFamily: 'monospace', lineHeight: 1,
        }}>
          {hasValue ? `${value}%` : '—'}
        </span>
        <span style={{
          fontSize: '0.55rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{
        marginTop: 3,
        height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1,
      }}>
        <div style={{
          width: `${hasValue ? Math.min(100, value) : 0}%`,
          height: '100%', background: accent,
        }} />
      </div>
      {sub && (
        <div style={{ marginTop: 2, fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function StagePill({ label, value, color }) {
  const active = value > 0
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0.3rem 0.2rem',
      borderRadius: 5,
      background: active ? `${color}1f` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.04)'}`,
    }}>
      <div style={{
        fontSize: '0.85rem', fontWeight: 900,
        color: active ? color : 'rgba(255,255,255,0.25)',
        fontFamily: 'monospace', lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.48rem', fontWeight: 800,
        color: active ? color : 'rgba(255,255,255,0.3)',
        opacity: active ? 0.85 : 1,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent = 'rgba(255,255,255,0.7)', highlight = false, subtext = null }) {
  return (
    <div style={{
      padding: '0.6rem 0.7rem',
      background: highlight ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${highlight ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
        {icon}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '1.4rem', fontWeight: 900,
        color: highlight ? '#10b981' : '#fff',
        fontFamily: 'monospace',
        lineHeight: 1,
      }}>
        {value ?? 0}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
          {subtext}
        </div>
      )}
    </div>
  )
}

// % card with a thin progress bar — same footprint as StatCard but uses
// pct() value (0–100 or null when denominator is 0).
function RatioCard({ icon, label, value, accent = '#FFD700', subtext = null }) {
  const hasValue = value !== null && value !== undefined
  const pctVal = hasValue ? Math.min(100, value) : 0
  return (
    <div style={{
      padding: '0.6rem 0.7rem',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
        {icon}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '1.35rem', fontWeight: 900,
        color: hasValue ? accent : 'rgba(255,255,255,0.25)',
        fontFamily: 'monospace', lineHeight: 1,
      }}>
        {hasValue ? `${value}%` : '—'}
      </div>
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
        marginTop: 2,
      }}>
        <div style={{
          width: `${pctVal}%`, height: '100%',
          background: accent, transition: 'width 0.3s ease',
        }} />
      </div>
      {subtext && (
        <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
          {subtext}
        </div>
      )}
    </div>
  )
}
