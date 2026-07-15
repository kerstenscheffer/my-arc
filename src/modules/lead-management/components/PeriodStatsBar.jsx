// src/modules/lead-management/components/PeriodStatsBar.jsx
// Grote, kale quick-stats bar bovenaan de lead-kanban (issue 98cefce0).
// Periode-selector (dag/week/maand) staat op dezelfde regel als de stats:
// bold gouden titel + dikke witte pijl, geen vak eromheen. Klik = dropdown die
// de stats voor die periode laadt. Data uit dezelfde range-methodes als de
// week-analytics modal (getRangeFunnelStats + getRangeReactionStats).
import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, TrendingUp, UserPlus, Send, MessageCircle, Phone, CalendarCheck, Trophy, UserX, Euro } from 'lucide-react'
import WeekStatsModal from './WeekStatsModal'
import GrowthChart from './GrowthChart'
import { kpiTargetFor, kpiColor, fmtTarget } from '../kpiConfig'

const GOLD = '#FFD700'

const PERIODS = [
  { id: 'day', label: 'Vandaag' },
  { id: 'week', label: 'Deze week' },
  { id: 'month', label: 'Deze maand' },
  { id: 'lastMonth', label: 'Vorige maand' },
  { id: 'custom', label: 'Aangepaste datum' },
]

const dmFmt = (x) => x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// Datum/periode-subtekst onder de dropdown (zoals de meal-pagina datum-regel).
function subLabelFor(period, custom) {
  const now = new Date()
  if (period === 'day') return now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  if (period === 'week') {
    const s = new Date(now); const d = s.getDay(); s.setDate(s.getDate() + (d === 0 ? -6 : 1 - d)); s.setHours(0, 0, 0, 0)
    const e = new Date(s); e.setDate(s.getDate() + 6)
    return `${dmFmt(s)} – ${dmFmt(e)}`
  }
  if (period === 'lastMonth') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  }
  if (period === 'custom') {
    if (custom?.start && custom?.end) return `${dmFmt(new Date(custom.start))} – ${dmFmt(new Date(custom.end))}`
    return 'Kies een periode →'
  }
  return now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function rangeFor(period, custom) {
  const now = new Date()
  const start = new Date(now)
  if (period === 'day') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day // maandag-start
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
  } else if (period === 'lastMonth') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    const e = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0) // begin deze maand = eind vorige
    return { start: s.toISOString(), end: e.toISOString() }
  } else if (period === 'custom') {
    if (custom?.start && custom?.end) {
      const s = new Date(custom.start + 'T00:00:00')
      const e = new Date(custom.end + 'T23:59:59')
      return { start: s.toISOString(), end: e.toISOString() }
    }
    start.setHours(0, 0, 0, 0) // nog geen datums → val terug op vandaag
    return { start: start.toISOString(), end: now.toISOString() }
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { start: start.toISOString(), end: now.toISOString() }
}

export default function PeriodStatsBar({ leadService, coachId, isMobile, refreshKey = 0 }) {
  const [period, setPeriod] = useState('day')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [open, setOpen] = useState(false)
  const [showWeek, setShowWeek] = useState(false)
  const [loading, setLoading] = useState(true)
  const [s, setS] = useState({ nieuw: 0, follow: 0, reacties: 0, voorgesteld: 0, ingepland: 0, sales: 0, omzet: 0, noshow: 0 })
  const [timeSeries, setTimeSeries] = useState([])
  const [chartOpen, setChartOpen] = useState(false)
  // KPI-doelen (per coach) + een key om ze te herladen na opslaan in de modal.
  const [targets, setTargets] = useState({})
  const [targetsKey, setTargetsKey] = useState(0)

  useEffect(() => {
    if (!leadService || !coachId) return
    let alive = true
    const load = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const { start, end } = rangeFor(period, customRange)
        // Grafiek volgt de gekozen periode — behalve "Vandaag" (1 dag = 1 punt),
        // dan tonen we de hele maand zodat er een zinvolle trendlijn is.
        const chartRange = rangeFor(period === 'day' ? 'month' : period, customRange)
        const [funnel, react, ts, kpiT] = await Promise.all([
          leadService.getRangeFunnelStats(coachId, start, end),
          leadService.getRangeReactionStats ? leadService.getRangeReactionStats(coachId, start, end) : Promise.resolve(null),
          leadService.getDailyTimeSeries ? leadService.getDailyTimeSeries(coachId, chartRange.start, chartRange.end) : Promise.resolve([]),
          leadService.getKpiTargets ? leadService.getKpiTargets(coachId) : Promise.resolve({}),
        ])
        if (!alive) return
        setTargets(kpiT || {})
        setTimeSeries(Array.isArray(ts) ? ts : [])
        const next = {
          nieuw: react?.newLeads || 0,
          follow: react?.followupsInWindow || 0,
          // Reacties = élke losse +klik op de reactie-teller in deze periode
          // (uit het reactie-logje). Telt dus ook de 2e/3e reactie van dezelfde
          // lead. Valt terug op de eerste-reactie-telling voor oude periodes
          // van vóór het logje (anders zou het 0 tonen).
          reacties: react?.reactionEventsInWindow || react?.reactionsInWindow || 0,
          voorgesteld: funnel?.callProposed?.count || 0,
          ingepland: funnel?.callScheduled?.count || 0,
          sales: funnel?.sale?.count || 0,
          omzet: funnel?.sale?.omzet || 0,
          noshow: funnel?.noShow?.count || 0,
        }
        setS(next)
      } catch (e) { console.error('[PeriodStatsBar] laden mislukt:', e) }
      finally { if (alive && !silent) setLoading(false) }
    }
    load()
    // Auto-refresh elke 60s (stil) zodat een nieuw aangemaakte lead vanzelf
    // binnenkomt — dan veroorzaakt een +1 reactie nooit meer een "sprong" in
    // de Nieuwe-leads-teller (die liep alleen achter, telde de reactie niet).
    const id = setInterval(() => load(true), 60000)
    return () => { alive = false; clearInterval(id) }
    // refreshKey verandert bij elke reactie/DM/lead-mutatie in het bord, zodat
    // de bovenste stat-bar direct meeloopt (i.p.v. pas bij periode-wissel).
  }, [period, customRange, coachId, leadService, refreshKey, targetsKey])

  // Elke stat een eigen lucide-icoon + kleur, zodat je zonder label ziet welke
  // het is (label blijft als tooltip). Zo passen ze compact op één rij.
  const items = [
    { key: 'nieuw',       label: 'Nieuwe leads',     value: s.nieuw,       num: s.nieuw,     Icon: UserPlus,      color: '#3b82f6' },
    { key: 'follow',      label: 'Follow-ups',       value: s.follow,      num: s.follow,    Icon: Send,          color: '#f59e0b' },
    { key: 'reacties',    label: 'Reacties',         value: s.reacties,    num: s.reacties,  Icon: MessageCircle, color: '#10b981' },
    { key: 'voorgesteld', label: 'Call voorgesteld', value: s.voorgesteld, num: s.voorgesteld, Icon: Phone,       color: '#a855f7' },
    { key: 'ingepland',   label: 'Call ingepland',   value: s.ingepland,   num: s.ingepland, Icon: CalendarCheck, color: '#06b6d4' },
    { key: 'sales',       label: 'Sales',            value: s.sales,       num: s.sales,     Icon: Trophy,        color: GOLD },
    { key: 'omzet',       label: 'Omzet',            value: '€' + Math.round(s.omzet || 0).toLocaleString('nl-NL'), num: s.omzet, Icon: Euro, color: '#22c55e' },
    { key: 'noshow',      label: 'No-shows',         value: s.noshow,      num: s.noshow,    Icon: UserX,         color: '#ef4444' },
  ]
  const PERIOD_SHORT = { day: 'Vandaag', week: 'Week', month: 'Maand', lastMonth: 'Vorige', custom: 'Datum' }
  const pill = (active) => ({ flexShrink: 0, minHeight: 32, padding: '0 0.7rem', borderRadius: 9, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: active ? 'rgba(255,215,0,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.08)'}`, color: active ? GOLD : 'rgba(255,255,255,0.62)' })
  const dateInput = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.5rem', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }

  return (
    <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Rij 1 — periode als aaneengesloten segmented control + volledig */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        <div style={{ display: 'inline-flex', flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
          {PERIODS.filter(p => p.id !== 'lastMonth').map((p, i) => {
            const active = period === p.id
            return (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                minHeight: 32, padding: '0 0.8rem', border: 'none',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: active ? 'rgba(255,215,0,0.16)' : 'transparent',
                color: active ? GOLD : 'rgba(255,255,255,0.6)',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>{PERIOD_SHORT[p.id] || p.label}</button>
            )
          })}
        </div>
        <button onClick={() => setShowWeek(true)} style={pill(false)} title="Volledige statistieken">
          <BarChart3 size={13} /> Volledig
        </button>
      </div>

      {/* Aangepaste datum-range — alleen bij 'Datum' */}
      {period === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input type="date" value={customRange.start} max={customRange.end || undefined}
            onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))} style={dateInput} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>–</span>
          <input type="date" value={customRange.end} min={customRange.start || undefined}
            onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))} style={dateInput} />
        </div>
      )}

      {/* Rij 2 — stats: gekleurd icoon (welke) + getal; label als tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 22, overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: 10, paddingBottom: 2 }}>
        {items.map((it) => {
          // Doel voor de huidige periode (alleen dag/week). Bepaalt de kleur van
          // het getal en toont "/ doel" erachter.
          const target = kpiTargetFor(targets, it.key, period)
          const col = target != null ? kpiColor(it.num, target) : null
          return (
            <div key={it.label} title={target != null ? `${it.label} — doel ${fmtTarget(it.key, target)}` : it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <it.Icon size={16} color={it.color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 900, color: col || '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: loading ? 0.45 : 1 }}>
                {it.value}
                {target != null && (
                  <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: 700, color: col || 'rgba(255,255,255,0.5)', opacity: 0.85 }}>
                    {' / '}{fmtTarget(it.key, target)}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <WeekStatsModal isOpen={showWeek} onClose={() => setShowWeek(false)} leadService={leadService} coachId={coachId} isMobile={isMobile} onTargetsSaved={() => setTargetsKey(k => k + 1)} />
    </div>
  )
}
