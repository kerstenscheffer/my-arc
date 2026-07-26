// src/modules/lead-management/components/WeekStatsModal.jsx
// Week-level stats overlay. Same metrics as the daily bar but aggregated
// over Mon–Sun, with arrow buttons to step backward/forward through
// previous weeks. Mounts via portal so it sits above the kanban board.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ChevronLeft, ChevronRight, ChevronDown, Calendar, Zap, TrendingUp,
  MessageCircle, Users, Phone, Trophy, Activity, BarChart3, PhoneCall,
  Send, FileText, Percent, UserX, Eye, Download, LineChart as LineChartIcon,
  RotateCcw, Target, Save, UserPlus, CalendarCheck, Euro, PhoneOff, XCircle,
} from 'lucide-react'
import { exportStatsPDF } from '../utils/exportStatsPDF'
import GrowthChart from './GrowthChart'
import { KPI_STATS, kpiTargetFor, kpiColor, fmtTarget } from '../kpiConfig'

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

export default function WeekStatsModal({ isOpen, onClose, leadService, coachId, isMobile: propMobile, onTargetsSaved }) {
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
  const [timeSeries, setTimeSeries] = useState([])
  const [callProposals, setCallProposals] = useState([])
  const [avgBeforeCall, setAvgBeforeCall] = useState(null)
  // Bump om de stats opnieuw te laden na het terugdraaien van een verplaatsing.
  const [reloadKey, setReloadKey] = useState(0)
  const [revertingId, setRevertingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  // PDF-preview: { url, filename } zodra de export klaar is; null = geen preview.
  const [pdfPreview, setPdfPreview] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  // KPI-doelen: paneel open/dicht, geladen map + bewerkbaar concept + saving-flag.
  const [showKpi, setShowKpi] = useState(false)
  const [kpiTargets, setKpiTargets] = useState({})
  const [kpiDraft, setKpiDraft] = useState({})
  const [kpiSaving, setKpiSaving] = useState(false)
  // Revenue/cashflow-paneel.
  const [showRevenue, setShowRevenue] = useState(false)
  const [revenue, setRevenue] = useState(null)
  const [revLoading, setRevLoading] = useState(false)
  // Welke funnel-stap staat open in de drill-down (voor terugdraaien/verwijderen).
  const [drillStage, setDrillStage] = useState(null)

  // Preview-blob-URL opruimen wanneer 'ie sluit of de modal ontmount.
  useEffect(() => () => { if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url) }, [pdfPreview])

  // KPI-doelen laden zodra de modal opent.
  useEffect(() => {
    if (!isOpen || !coachId || !leadService?.getKpiTargets) return
    let alive = true
    leadService.getKpiTargets(coachId).then(m => { if (alive) setKpiTargets(m || {}) })
    return () => { alive = false }
  }, [isOpen, coachId, leadService])

  const openKpiPanel = () => {
    const draft = {}
    KPI_STATS.forEach(st => {
      const t = kpiTargets[st.key] || {}
      draft[st.key] = {
        day: t.day != null ? String(t.day) : '',
        week: t.week != null ? String(t.week) : '',
      }
    })
    setKpiDraft(draft)
    setShowKpi(true)
  }

  const setKpiField = (key, period, value) => {
    // Alleen cijfers toestaan (leeg = doel wissen).
    const clean = value.replace(/[^0-9]/g, '')
    setKpiDraft(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [period]: clean } }))
  }

  const openRevenuePanel = async () => {
    setShowRevenue(true)
    setRevLoading(true)
    try {
      const r = await leadService.getRevenueProjection(coachId, 12)
      setRevenue(r)
    } catch (e) {
      console.error('Revenue laden mislukt:', e)
      setRevenue(null)
    } finally {
      setRevLoading(false)
    }
  }

  const saveKpiPanel = async () => {
    if (kpiSaving) return
    setKpiSaving(true)
    const rows = KPI_STATS.map(st => ({
      stat_key: st.key,
      day_target: kpiDraft[st.key]?.day ?? '',
      week_target: kpiDraft[st.key]?.week ?? '',
    }))
    try {
      const { error } = await leadService.saveKpiTargets(coachId, rows)
      if (error) throw error
      const fresh = await leadService.getKpiTargets(coachId)
      setKpiTargets(fresh || {})
      setShowKpi(false)
      if (onTargetsSaved) onTargetsSaved()
    } catch (e) {
      console.error('KPI opslaan mislukt:', e)
    } finally {
      setKpiSaving(false)
    }
  }

  // Draai één funnel-verplaatsing terug (soft): verdwijnt uit de stats, lead
  // blijft op het bord staan. Daarna herladen we de cijfers.
  const handleRevertMovement = async (movementId) => {
    if (!movementId || !leadService?.revertMovement) return
    setRevertingId(movementId)
    try {
      const res = await leadService.revertMovement(movementId, true)
      if (res?.success) setReloadKey(k => k + 1)
    } catch (e) {
      console.error('Terugdraaien mislukt:', e)
    } finally {
      setRevertingId(null)
    }
  }

  const handleDeleteMovement = async (movementId) => {
    if (!movementId || !leadService?.deleteMovement) return
    setDeletingId(movementId)
    try {
      const res = await leadService.deleteMovement(movementId)
      if (res?.success) setReloadKey(k => k + 1)
    } catch (e) {
      console.error('Verwijderen mislukt:', e)
    } finally {
      setDeletingId(null)
    }
  }

  // Resolve the [start, end) window once per render based on the mode.
  const { start, end } = (() => {
    if (periodMode === 'day') {
      const s = new Date(anchorDate); s.setHours(0, 0, 0, 0)
      const e = new Date(s); e.setDate(e.getDate() + 1)
      return { start: s, end: e }
    }
    if (periodMode === 'month') {
      const s = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
      s.setHours(0, 0, 0, 0)
      const e = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1)
      e.setHours(0, 0, 0, 0)
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
        // Growth chart always shows a wider context window so the coach
        // can spot trends. We take max(period, 30 days) ending at the
        // period's end, so Day view still gets a meaningful trend line.
        const chartEnd = new Date(end)
        const chartStart = new Date(end)
        chartStart.setDate(chartStart.getDate() - Math.max(30, Math.ceil((end - start) / 86400000)))

        const [a, f, srcs, rxn, ts, props, avgB] = await Promise.all([
          leadService.getRangeActivity(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeFunnelStats(coachId, start.toISOString(), end.toISOString()),
          leadService.getRangeLeadSources
            ? leadService.getRangeLeadSources(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
          leadService.getRangeReactionStats
            ? leadService.getRangeReactionStats(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
          leadService.getDailyTimeSeries
            ? leadService.getDailyTimeSeries(coachId, chartStart.toISOString(), chartEnd.toISOString())
            : Promise.resolve([]),
          leadService.getRangeCallProposals
            ? leadService.getRangeCallProposals(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve([]),
          leadService.getRangeAvgFollowupsBeforeCall
            ? leadService.getRangeAvgFollowupsBeforeCall(coachId, start.toISOString(), end.toISOString())
            : Promise.resolve(null),
        ])
        if (!cancelled) {
          setActivity(a); setFunnel(f); setSourceBreakdown(srcs); setReactionStats(rxn)
          setTimeSeries(ts || [])
          setCallProposals(props || [])
          setAvgBeforeCall(avgB)
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
  }, [isOpen, leadService, coachId, periodMode, +start, +end, reloadKey])

  if (!isOpen) return null

  const goPrev = () => {
    const next = new Date(anchorDate)
    if (periodMode === 'month') next.setMonth(next.getMonth() - 1)
    else next.setDate(anchorDate.getDate() - (periodMode === 'day' ? 1 : 7))
    setAnchorDate(next)
  }
  const goNext = () => {
    const next = new Date(anchorDate)
    if (periodMode === 'month') next.setMonth(next.getMonth() + 1)
    else next.setDate(anchorDate.getDate() + (periodMode === 'day' ? 1 : 7))
    setAnchorDate(next)
  }
  const goToday = () => setAnchorDate(new Date())

  const sameMonth = (a, b) => {
    const x = new Date(a), y = new Date(b)
    return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth()
  }
  const isCurrentPeriod = periodMode === 'day'
    ? sameDay(anchorDate, new Date())
    : periodMode === 'month'
      ? sameMonth(anchorDate, new Date())
      : sameMonday(anchorDate, new Date())
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0)
  const isFuturePeriod = periodMode === 'day'
    ? new Date(anchorDate).setHours(0,0,0,0) > todayMidnight.getTime()
    : periodMode === 'month'
      ? (anchorDate.getFullYear() > todayMidnight.getFullYear()
        || (anchorDate.getFullYear() === todayMidnight.getFullYear()
          && anchorDate.getMonth() > todayMidnight.getMonth()))
      : mondayOf(anchorDate).getTime() > mondayOf(new Date()).getTime()

  const totalReplies = funnel?.replied?.count || 0
  const totalConvs = funnel?.conversation?.count || 0
  const totalCallProposed = funnel?.callProposed?.count || 0
  const totalCalls = funnel?.callScheduled?.count || 0
  const totalSales = funnel?.sale?.count || 0
  const totalNoShows = funnel?.noShow?.count || 0
  // Show rate = how many scheduled calls actually showed up
  // (scheduled - no shows) / scheduled.
  const showRate = totalCalls > 0
    ? Math.round(((totalCalls - totalNoShows) / totalCalls) * 100)
    : null

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
  // What share of leads needed a chase to get any reply at all.
  const chaseShare   = pct(followedLeads, newLeadsInPeriod)

  // Huidige waarde per KPI-stat (voor de doelen-preview in het paneel). Zelfde
  // bronnen als de stats-bar, zodat de getallen 1-op-1 overeenkomen.
  const kpiValues = {
    nieuw:       newLeadsInPeriod,
    reacties:    reactionStats?.reactionEventsInWindow ?? reactionStats?.reactionsInWindow ?? reactedLeads ?? 0,
    voorgesteld: totalCallProposed,
    ingepland:   totalCalls,
    sales:       totalSales,
    omzet:       Math.round(funnel?.sale?.omzet || 0),
  }

  // Twee strakke stat-rijen (aantallen + percentages), in de stijl van de
  // stats-bar — geen vakjes meer.
  // happenedCalls = calls whose scheduled date has already passed (or no date set).
  // Gebruik dit als noemer voor de close rate zodat nog-niet-gehouden calls de
  // close rate niet naar beneden trekken.
  const happenedCalls = funnel?.callScheduled?.happenedCount ?? totalCalls
  const shownCalls = Math.max(0, happenedCalls - totalNoShows)
  const proposedToScheduled = totalCallProposed > 0 ? Math.round((totalCalls / totalCallProposed) * 100) : null
  const noShowRate = totalCalls > 0 ? Math.round((totalNoShows / totalCalls) * 100) : null
  const closeRate = shownCalls > 0 ? Math.round((totalSales / shownCalls) * 100) : null
  const pct1 = (v) => (v == null ? '—' : `${v}%`)
  const STAGE_ACCENT = { callProposed: '#a855f7', callScheduled: '#06b6d4', sale: '#10b981', noShow: '#f97316', callRejected: '#f97316', saleLost: '#ef4444' }
  const countItems = [
    { label: 'Nieuwe leads', value: newLeadsInPeriod,          Icon: UserPlus,      color: '#3b82f6' },
    { label: 'Follow-ups',   value: activity?.followUps ?? 0,  Icon: Send,          color: '#f59e0b' },
    { label: 'Reacties',     value: kpiValues.reacties,        Icon: MessageCircle, color: '#10b981' },
    { label: 'Voorgesteld',  value: totalCallProposed,         Icon: PhoneCall,     color: '#a855f7', stage: 'callProposed' },
    { label: 'Ingepland',    value: totalCalls,                Icon: CalendarCheck, color: '#06b6d4', stage: 'callScheduled' },
    { label: 'Sales',        value: totalSales,                Icon: Trophy,        color: '#FFD700', stage: 'sale' },
    { label: 'Omzet',        value: '€' + Math.round(funnel?.sale?.omzet || 0).toLocaleString('nl-NL'), Icon: Euro, color: '#22c55e' },
    { label: 'No-shows',     value: totalNoShows,              Icon: UserX,         color: '#ef4444', stage: 'noShow' },
    { label: 'Afgewezen',    value: funnel?.callRejected?.count ?? 0, Icon: PhoneOff, color: '#f97316', stage: 'callRejected' },
    { label: 'Sale verloren', value: funnel?.saleLost?.count ?? 0, Icon: XCircle, color: '#ef4444', stage: 'saleLost' },
  ]
  const pctItems = [
    { label: 'Response',      value: pct1(responseRate),        Icon: MessageCircle, color: '#3b82f6' },
    { label: 'Opvolg',        value: pct1(chaseShare),          Icon: Send,          color: '#f59e0b' },
    { label: 'Voorstel→call', value: pct1(proposedToScheduled), Icon: PhoneCall,     color: '#a855f7' },
    { label: 'Show-up',       value: pct1(showRate),            Icon: CalendarCheck, color: '#06b6d4' },
    { label: 'No-show',       value: pct1(noShowRate),          Icon: UserX,         color: '#ef4444' },
    { label: 'Close rate',    value: pct1(closeRate),           Icon: Trophy,        color: '#22c55e' },
  ]

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
        {/* Header — titel, Dag/Week/Maand én de actie-knoppen op één regel */}
        <div style={{
          flexShrink: 0,
          padding: isMobile ? 'calc(0.6rem + env(safe-area-inset-top)) 0.75rem 0.6rem' : '0.7rem 1rem',
          display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.5)',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          <BarChart3 size={16} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ flexShrink: 0, color: '#fff', fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Stats
          </div>
          {/* Dag/Week/Maand — segment-control op dezelfde regel */}
          <div style={{ display: 'inline-flex', flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 3, marginLeft: 4 }}>
            {['day', 'week', 'month'].map(mode => {
              const active = periodMode === mode
              const labels = { day: 'Dag', week: 'Week', month: 'Maand' }
              return (
                <button key={mode} onClick={() => setPeriodMode(mode)} style={{
                  minHeight: 30, padding: isMobile ? '0 0.6rem' : '0 0.85rem', border: 'none', borderRadius: 7,
                  background: active ? 'rgba(255,215,0,0.16)' : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.55)',
                  fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 800,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                }}>{labels[mode]}</button>
              )
            })}
          </div>
          <div style={{ flex: 1, minWidth: 8 }} />
          <button
            onClick={openRevenuePanel}
            title="Terugkerende omzet & cashflow"
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: '#22c55e', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <TrendingUp size={16} />
          </button>
          <button
            onClick={openKpiPanel}
            disabled={loading}
            title="KPI-doelen instellen (dag/week)"
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: GOLD, opacity: loading ? 0.4 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Target size={16} />
          </button>
          <button
            onClick={async () => {
              if (pdfBusy || loading) return
              setPdfBusy(true)
              try {
                const periodLabel = periodMode === 'day'
                  ? fmtDay(anchorDate)
                  : periodMode === 'month'
                    ? anchorDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
                    : `Week ${isoWeek(mondayOf(anchorDate))} · ${fmtRange(mondayOf(anchorDate))}`
                const periodSubtitle = `${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })} → ${new Date(end - 1).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
                const noShowRate = totalCalls > 0 ? Math.round((totalNoShows / totalCalls) * 100) : null
                const happenedCallsPdf = funnel?.callScheduled?.happenedCount ?? totalCalls
                const shownCalls = Math.max(0, happenedCallsPdf - totalNoShows)
                const proposedToScheduled = totalCallProposed > 0 ? Math.round((totalCalls / totalCallProposed) * 100) : null
                const closeRate = shownCalls > 0 ? Math.round((totalSales / shownCalls) * 100) : null
                const omzetVal = Math.round(funnel?.sale?.omzet || 0)
                const amountPerCall = totalCalls > 0 ? Math.round(omzetVal / totalCalls) : null
                const res = await exportStatsPDF({
                  periodLabel, periodSubtitle,
                  generatedAt: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }),
                  activity, funnel, reactionStats, sourceBreakdown,
                  ratios: {
                    responseRate, chaseShare, showRate, noShowRate,
                    proposedToScheduled, closeRate, amountPerCall,
                    newLeads:         newLeadsInPeriod,
                    reactedLeads,
                    responseFraction: `${reactedLeads} / ${newLeadsInPeriod}`,
                    chaseFraction:    `${followedLeads} / ${newLeadsInPeriod}`,
                    showFraction:     totalCalls > 0 ? `${totalCalls - totalNoShows} / ${totalCalls}` : '—',
                    noShowFraction:   totalCalls > 0 ? `${totalNoShows} / ${totalCalls}` : '—',
                    proposedFraction: totalCallProposed > 0 ? `${totalCalls} / ${totalCallProposed}` : '—',
                    closeFraction:    shownCalls > 0 ? `${totalSales} / ${shownCalls}` : '—',
                    amountPerCallFraction: totalCalls > 0 ? `€${omzetVal.toLocaleString('nl-NL')} / ${totalCalls}` : '—',
                  },
                })
                if (res?.url) setPdfPreview({ url: res.url, filename: res.filename })
              } catch (e) {
                console.error('PDF-export mislukt:', e)
              } finally {
                setPdfBusy(false)
              }
            }}
            disabled={loading || pdfBusy}
            title={pdfBusy ? 'Bezig…' : 'Download als PDF'}
            style={{
              width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              color: 'rgba(255,255,255,0.7)',
              opacity: (loading || pdfBusy) ? 0.4 : 1,
              cursor: (loading || pdfBusy) ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Download size={16} />
          </button>
          <button onClick={onClose} title="Sluiten" style={{
            width: 36, height: 36, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Period navigator */}
        <div style={{
          flexShrink: 0, padding: '0.55rem 0.85rem 0.7rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button onClick={goPrev} title={periodMode === 'day' ? 'Vorige dag' : periodMode === 'month' ? 'Vorige maand' : 'Vorige week'} style={navBtn}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {periodMode === 'day'
                ? (isCurrentPeriod ? 'Vandaag' : fmtDay(anchorDate).split(' ').slice(0, -2).join(' '))
                : periodMode === 'month'
                  ? `${anchorDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}${isCurrentPeriod ? ' · Deze maand' : ''}`
                  : `Week ${isoWeek(mondayOf(anchorDate))}${isCurrentPeriod ? ' · Deze week' : ''}`
              }
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>
              {periodMode === 'day'
                ? fmtDay(anchorDate)
                : periodMode === 'month'
                  ? `${new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
                  : fmtRange(mondayOf(anchorDate))
              }
            </div>
          </div>
          <button onClick={goNext} title={periodMode === 'day' ? 'Volgende dag' : periodMode === 'month' ? 'Volgende maand' : 'Volgende week'} disabled={isFuturePeriod} style={{ ...navBtn, opacity: isFuturePeriod ? 0.3 : 1, cursor: isFuturePeriod ? 'not-allowed' : 'pointer' }}>
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
              {/* Aantallen — strakke rij zoals de stats-bar (klik funnel-stap
                  voor de drill-down met terugdraaien/verwijderen). */}
              <SectionTitle icon={<BarChart3 size={13} color={GOLD} />} title="Aantallen" />
              <StatFlow items={countItems} activeStage={drillStage} onToggle={(st) => setDrillStage(prev => prev === st ? null : st)} />
              {drillStage && (
                <DrillPanel
                  leads={funnel?.[drillStage]?.leads}
                  accent={STAGE_ACCENT[drillStage]}
                  reasons={drillStage === 'callRejected' ? funnel?.callRejected?.reasons : drillStage === 'saleLost' ? funnel?.saleLost?.reasons : null}
                  onRevert={handleRevertMovement} revertingId={revertingId}
                  onDelete={handleDeleteMovement} deletingId={deletingId}
                />
              )}

              {/* Percentages — tweede strakke rij. */}
              <SectionTitle icon={<Percent size={13} color={GOLD} />} title="Percentages" />
              <StatFlow items={pctItems} activeStage={null} onToggle={() => {}} />

              {/* Growth chart — input vs output over time. Window is wider
                  than the period (min 30 days) so coach sees trends. */}
              {timeSeries && timeSeries.length > 0 && (
                <>
                  <SectionTitle
                    icon={<LineChartIcon size={13} color={GOLD} />}
                    title={`Groei (${timeSeries.length}-daagse trend)`}
                  />
                  <div style={{
                    padding: '0.75rem 0.85rem 0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: 10,
                    marginBottom: '0.85rem',
                  }}>
                    <GrowthChart data={timeSeries} isMobile={isMobile} />
                  </div>
                </>
              )}

              {/* Call-voorstellen — exact wat ik gestuurd heb + uitkomst */}
              {callProposals && callProposals.length > 0 && (
                <>
                  <SectionTitle
                    icon={<PhoneCall size={13} color={GOLD} />}
                    title={`Call-voorstellen (${callProposals.length})`}
                  />
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 5,
                    marginBottom: '0.85rem',
                  }}>
                    {callProposals.map(p => (
                      <div key={p.id} style={{
                        padding: '0.55rem 0.7rem',
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: `3px solid ${p.outcome.color}`,
                        borderRadius: 7,
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          marginBottom: 4,
                        }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 800, color: '#fff',
                          }}>
                            {p.lead_name}
                          </span>
                          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>
                            · {new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{
                            marginLeft: 'auto',
                            padding: '1px 6px',
                            background: `${p.outcome.color}1a`,
                            border: `1px solid ${p.outcome.color}55`,
                            borderRadius: 999,
                            color: p.outcome.color,
                            fontSize: '0.55rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {p.outcome.label}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)',
                          lineHeight: 1.4, whiteSpace: 'pre-wrap',
                          display: '-webkit-box', WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {p.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

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
                    <Calendar size={14} /> Terug naar {periodMode === 'day' ? 'vandaag' : periodMode === 'month' ? 'deze maand' : 'deze week'}
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
                  Geen activiteit in deze {periodMode === 'day' ? 'dag' : periodMode === 'month' ? 'maand' : 'week'}.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      {modal}
      {showKpi && (
        <div
          onClick={() => setShowKpi(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 2147483560, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, maxHeight: isMobile ? '92vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,215,0,0.25)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
              <Target size={17} color={GOLD} />
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>KPI-doelen</div>
              <button onClick={() => setShowKpi(false)} title="Sluiten" style={iconBtn}><X size={16} /></button>
            </div>
            {/* Uitleg + kleurlegenda */}
            <div style={{ flexShrink: 0, padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Stel per stat een <b style={{ color: '#fff' }}>dag</b>- en <b style={{ color: '#fff' }}>week</b>-doel in. Op de bar: <span style={{ color: '#22c55e', fontWeight: 700 }}>groen</span> = gehaald, <span style={{ color: '#f59e0b', fontWeight: 700 }}>geel</span> = onderweg, <span style={{ color: '#ef4444', fontWeight: 700 }}>rood</span> = achter. Leeg = geen doel.
            </div>
            {/* Rijen */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 1rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0 0.3rem', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}>
                <div style={{ flex: 1 }} />
                <div style={{ width: 72, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Dag</div>
                <div style={{ width: 72, textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Week</div>
              </div>
              {KPI_STATS.map(st => {
                const val = kpiValues[st.key] || 0
                const tgt = kpiTargetFor(kpiTargets, st.key, periodMode)
                const col = tgt != null ? kpiColor(val, tgt) : null
                const draft = kpiDraft[st.key] || { day: '', week: '' }
                const shown = st.key === 'omzet' ? '€' + Math.round(val).toLocaleString('nl-NL') : val
                return (
                  <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{st.label}</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: col || 'rgba(255,255,255,0.4)' }}>
                        {periodMode === 'month'
                          ? `${shown} nu · doel alleen dag/week`
                          : (tgt != null ? `${shown} / ${fmtTarget(st.key, tgt)}` : `${shown} · geen doel`)}
                      </div>
                    </div>
                    <input inputMode="numeric" value={draft.day} onChange={e => setKpiField(st.key, 'day', e.target.value)} placeholder="—"
                      style={{ width: 72, minHeight: 38, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                    <input inputMode="numeric" value={draft.week} onChange={e => setKpiField(st.key, 'week', e.target.value)} placeholder="—"
                      style={{ width: 72, minHeight: 38, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                )
              })}
            </div>
            {/* Footer */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 8, padding: isMobile ? '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))' : '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowKpi(false)} style={{ flex: 1, minHeight: 42, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Annuleren</button>
              <button onClick={saveKpiPanel} disabled={kpiSaving} style={{ flex: 2, minHeight: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#000', fontWeight: 900, cursor: kpiSaving ? 'wait' : 'pointer', opacity: kpiSaving ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, touchAction: 'manipulation' }}>
                <Save size={15} /> {kpiSaving ? 'Opslaan…' : 'Doelen opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showRevenue && (
        <div
          onClick={() => setShowRevenue(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 2147483560, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, maxHeight: isMobile ? '92vh' : '85vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(34,197,94,0.25)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.7rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)' }}>
              <TrendingUp size={17} color="#22c55e" />
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Terugkerende omzet</div>
              <button onClick={() => setShowRevenue(false)} title="Sluiten" style={iconBtn}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {revLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>
              ) : (!revenue || revenue.saleCount === 0) ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Nog geen sales met een bedrag vastgelegd. Sleep een lead naar een sale-sectie en vul de order-waarde + betaalwijze in.
                </div>
              ) : (() => {
                const eur = (n) => '€' + Math.round(n || 0).toLocaleString('nl-NL')
                const maxAmount = Math.max(1, ...revenue.months.map(m => m.amount))
                const cards = [
                  { label: 'MRR deze maand', value: eur(revenue.mrr), color: '#22c55e', hint: `${revenue.activeMonthly} lopend maandplan${revenue.activeMonthly === 1 ? '' : 'nen'}` },
                  { label: 'Actieve plannen', value: revenue.activeMonthly, color: '#06b6d4' },
                  { label: 'Geboekt totaal', value: eur(revenue.totalBooked), color: '#FFD700', hint: `${revenue.saleCount} sale${revenue.saleCount === 1 ? '' : 's'}` },
                ]
                return (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: '1.1rem' }}>
                      {cards.map(c => (
                        <div key={c.label} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.7rem 0.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 900, color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                          <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{c.label}</div>
                          {c.hint && <div style={{ fontSize: '0.56rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{c.hint}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Cashflow komende 12 maanden</div>
                    {revenue.months.map(m => (
                      <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.3rem 0' }}>
                        <div style={{ width: 66, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{m.label}</div>
                        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((m.amount / maxAmount) * 100)}%`, height: '100%', background: '#22c55e', borderRadius: 4 }} />
                        </div>
                        <div style={{ width: 66, textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, color: m.amount > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>{eur(m.amount)}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: '0.8rem', fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                      Vooruitbetaald = volledige bedrag in de sale-maand. Maandelijks = totaal ÷ looptijd, gespreid over de maanden.
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      {pdfPreview && (
        <div
          onClick={() => setPdfPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483550,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', padding: isMobile ? 0 : '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              maxWidth: 900, width: '100%', margin: '0 auto',
              background: '#111', borderRadius: isMobile ? 0 : 14, overflow: 'hidden',
              border: '1px solid rgba(255,215,0,0.25)',
            }}
          >
            {/* Header met download-knop */}
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
              padding: isMobile ? 'calc(0.6rem + env(safe-area-inset-top)) 0.85rem 0.6rem' : '0.7rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)',
            }}>
              <Eye size={16} color={GOLD} />
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>PDF-voorbeeld</div>
              <a
                href={pdfPreview.url} download={pdfPreview.filename}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                  padding: '0 0.75rem', height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#000',
                  fontWeight: 900, fontSize: '0.72rem',
                }}
              >
                <Download size={13} /> Download
              </a>
              <button onClick={() => setPdfPreview(null)} title="Sluiten" style={iconBtn}><X size={16} /></button>
            </div>
            {/* Het voorbeeld zelf */}
            <iframe
              title="PDF-voorbeeld" src={pdfPreview.url}
              style={{ flex: 1, width: '100%', border: 'none', background: '#525659' }}
            />
            {/* Fallback voor mobiel waar een iframe geen PDF toont */}
            <div style={{ flexShrink: 0, textAlign: 'center', padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <a href={pdfPreview.url} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem' }}>
                Voorbeeld niet zichtbaar? Open in nieuw tabblad →
              </a>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
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

  // Per-source ratios — same kerncijfers als de top-level sectie, gescoped
  // op deze ene source z'n lead-cohort.
  const scheduledCalls = s.callScheduled || 0
  const responseRate = pct(repliedLeads,    total)
  const chaseShare   = pct(followedLeads,   total)

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
            <MiniRatio label="Response rate" value={responseRate}
              sub={`${repliedLeads} / ${total}`} accent="#3b82f6" />
            <MiniRatio label="Opvolg rate" value={chaseShare}
              sub={`${followedLeads} / ${total}`} accent="#D4AF37" />
            <MiniRatio label="Calls voorgesteld" value={s.callProposed || 0}
              sub="aantal" accent="#ef4444" rawValue />
            <MiniRatio label="Calls ingepland" value={scheduledCalls}
              sub="aantal" accent="#D4AF37" rawValue />
            <MiniRatio label="Sales gemaakt" value={s.sale || 0}
              sub="aantal" accent="#10b981" rawValue />
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

function MiniRatio({ label, value, sub, accent, rawValue = false }) {
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
          {hasValue ? (rawValue ? `${value}` : `${value}%`) : '—'}
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
          width: `${hasValue && !rawValue ? Math.min(100, value) : 0}%`,
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

// Compacte stat-rij in de stijl van de stats-bar: gekleurd icoon + bold wit
// getal + klein label. Items met een `stage` zijn klikbaar → drill-down eronder.
function StatFlow({ items, activeStage, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '2px 0 8px' }}>
      {items.map(it => {
        const clickable = !!it.stage
        const on = clickable && activeStage === it.stage
        return (
          <div key={it.label} onClick={clickable ? () => onToggle(it.stage) : undefined} title={it.label}
            style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, cursor: clickable ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <it.Icon size={16} color={it.color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{it.value}</span>
              {clickable && <ChevronDown size={12} color={on ? '#FFD700' : 'rgba(255,255,255,0.35)'} style={{ transform: on ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />}
            </div>
            <span style={{ fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: on ? '#FFD700' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{it.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Drill-down lijst onder de aantallen-rij: leads van een funnel-stap, met
// terugdraaien/verwijderen (zelfde acties als voorheen in de StatCard).
function DrillPanel({ leads, accent = '#FFD700', reasons = null, onRevert, revertingId, onDelete, deletingId }) {
  const [confirmId, setConfirmId] = useState(null)
  const items = Array.isArray(leads) ? leads : []
  const reasonEntries = reasons ? Object.entries(reasons).sort((a, b) => b[1] - a[1]) : []
  if (!items.length) {
    return <div style={{ padding: '0.4rem 0.2rem 0.8rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Geen items in deze periode.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, margin: '0 0 0.7rem' }}>
      {reasonEntries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingBottom: 6, marginBottom: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {reasonEntries.map(([r, n]) => (
            <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', fontWeight: 800, color: accent, background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 6, padding: '2px 7px' }}>
              {r} <span style={{ color: '#fff' }}>{n}</span>
            </span>
          ))}
        </div>
      )}
      {items.map((d, i) => {
        const busyRevert = revertingId && revertingId === d.id
        const busyDelete = deletingId && deletingId === d.id
        const busy = busyRevert || busyDelete
        const confirming = confirmId === d.id
        const canAct = (onRevert || onDelete) && d.id
        return (
          <div key={d.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingBottom: 5, borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{d.name}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{d.from} <span style={{ color: accent }}>→</span> {d.to}</div>
              {d.reason && <div style={{ fontSize: '0.58rem', fontWeight: 700, color: accent }}>Reden: {d.reason}</div>}
              <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{d.time} · door <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.by || 'Onbekend'}</span></div>
            </div>
            {canAct && (confirming ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                {onRevert && <button onClick={() => { setConfirmId(null); onRevert(d.id) }} disabled={busy} title="Verplaatsing ongedaan maken (rij blijft bewaard)" style={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff', background: 'rgba(212,175,55,0.7)', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: busy ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}><RotateCcw size={8} />{busyRevert ? '...' : 'Ongedaan'}</button>}
                {onDelete && <button onClick={() => { setConfirmId(null); onDelete(d.id) }} disabled={busy} title="Stat permanent verwijderen" style={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff', background: 'rgba(239,68,68,0.75)', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: busy ? 'wait' : 'pointer' }}>{busyDelete ? '...' : 'Verwijder'}</button>}
                <button onClick={() => setConfirmId(null)} style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Nee</button>
              </div>
            ) : (
              <button onClick={() => setConfirmId(d.id)} title="Bewerken — ongedaan maken of verwijderen" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}><RotateCcw size={10} /> Aanpassen</button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ icon, label, value, accent = 'rgba(255,255,255,0.7)', highlight = false, subtext = null, details = null, onRevert = null, revertingId = null, onDelete = null, deletingId = null }) {
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const items = Array.isArray(details) ? details : []
  const hasDetails = items.length > 0
  return (
    <div
      onClick={hasDetails ? () => setOpen(o => !o) : undefined}
      style={{
        padding: '0.6rem 0.7rem',
        background: highlight ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${open ? 'rgba(255,215,0,0.3)' : highlight ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8,
        display: 'flex', flexDirection: 'column', gap: 2,
        cursor: hasDetails ? 'pointer' : 'default',
        gridColumn: open ? '1 / -1' : 'auto',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: accent }}>
        {icon}
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{label}</span>
        {hasDetails && (
          <ChevronDown
            size={12}
            style={{
              marginLeft: 'auto', color: 'rgba(255,255,255,0.4)',
              transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease',
            }}
          />
        )}
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
      {open && hasDetails && (
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {items.map((d, i) => {
            const busyRevert = revertingId && revertingId === d.id
            const busyDelete = deletingId && deletingId === d.id
            const busy = busyRevert || busyDelete
            const confirming = confirmId === d.id
            const canAct = (onRevert || onDelete) && d.id
            return (
              <div key={d.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                paddingBottom: 5,
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{d.name}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                    {d.from} <span style={{ color: accent }}>→</span> {d.to}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                    {d.time} · door <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.by || 'Onbekend'}</span>
                  </div>
                </div>
                {canAct && (
                  confirming ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      {onRevert && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(null); onRevert(d.id) }}
                          disabled={busy}
                          title="Verplaatsing ongedaan maken (rij blijft bewaard)"
                          style={{
                            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                            background: 'rgba(212,175,55,0.7)', border: 'none', borderRadius: 5,
                            padding: '3px 7px', cursor: busy ? 'wait' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                          }}
                        ><RotateCcw size={8} />{busyRevert ? '...' : 'Ongedaan'}</button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmId(null); onDelete(d.id) }}
                          disabled={busy}
                          title="Stat permanent verwijderen"
                          style={{
                            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                            background: 'rgba(239,68,68,0.75)', border: 'none', borderRadius: 5,
                            padding: '3px 7px', cursor: busy ? 'wait' : 'pointer',
                          }}
                        >{busyDelete ? '...' : 'Verwijder'}</button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmId(null) }}
                        style={{
                          fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5,
                          padding: '3px 7px', cursor: 'pointer',
                        }}
                      >Nee</button>
                    </div>
                  ) : (
                    <button
                      title="Bewerken — ongedaan maken of verwijderen"
                      onClick={(e) => { e.stopPropagation(); setConfirmId(d.id) }}
                      style={{
                        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={10} /> Aanpassen
                    </button>
                  )
                )}
              </div>
            )
          })}
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
