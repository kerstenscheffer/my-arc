// src/modules/lead-management/components/PeriodStatsBar.jsx
// Grote, kale quick-stats bar bovenaan de lead-kanban (issue 98cefce0).
// Periode-selector (dag/week/maand) staat op dezelfde regel als de stats:
// bold gouden titel + dikke witte pijl, geen vak eromheen. Klik = dropdown die
// de stats voor die periode laadt. Data uit dezelfde range-methodes als de
// week-analytics modal (getRangeFunnelStats + getRangeReactionStats).
import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, TrendingUp, UserPlus, Send, MessageCircle, Phone, CalendarCheck, Trophy, UserX } from 'lucide-react'
import WeekStatsModal from './WeekStatsModal'
import GrowthChart from './GrowthChart'

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
  const [s, setS] = useState({ nieuw: 0, follow: 0, reacties: 0, voorgesteld: 0, ingepland: 0, sales: 0, noshow: 0 })
  const [timeSeries, setTimeSeries] = useState([])
  const [chartOpen, setChartOpen] = useState(false)

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
        const [funnel, react, ts] = await Promise.all([
          leadService.getRangeFunnelStats(coachId, start, end),
          leadService.getRangeReactionStats ? leadService.getRangeReactionStats(coachId, start, end) : Promise.resolve(null),
          leadService.getDailyTimeSeries ? leadService.getDailyTimeSeries(coachId, chartRange.start, chartRange.end) : Promise.resolve([]),
        ])
        if (!alive) return
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
  }, [period, customRange, coachId, leadService, refreshKey])

  // Elke stat een eigen lucide-icoon + kleur, zodat je zonder label ziet welke
  // het is (label blijft als tooltip). Zo passen ze compact op één rij.
  const items = [
    { label: 'Nieuwe leads',     value: s.nieuw,       Icon: UserPlus,      color: '#3b82f6' },
    { label: 'Follow-ups',       value: s.follow,      Icon: Send,          color: '#f59e0b' },
    { label: 'Reacties',         value: s.reacties,    Icon: MessageCircle, color: '#10b981' },
    { label: 'Call voorgesteld', value: s.voorgesteld, Icon: Phone,         color: '#a855f7' },
    { label: 'Call ingepland',   value: s.ingepland,   Icon: CalendarCheck, color: '#06b6d4' },
    { label: 'Sales',            value: s.sales,       Icon: Trophy,        color: GOLD },
    { label: 'No-shows',         value: s.noshow,      Icon: UserX,         color: '#ef4444' },
  ]
  const PERIOD_SHORT = { day: 'Vandaag', week: 'Week', month: 'Maand', lastMonth: 'Vorige', custom: 'Datum' }
  const pill = (active) => ({ flexShrink: 0, minHeight: 32, padding: '0 0.7rem', borderRadius: 9, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', background: active ? 'rgba(255,215,0,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.08)'}`, color: active ? GOLD : 'rgba(255,255,255,0.62)' })
  const dateInput = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.5rem', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }

  return (
    <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', columnGap: isMobile ? '0.85rem' : '1.25rem', flexWrap: 'wrap', rowGap: '0.65rem' }}>

        {/* Datum-header + periode-selector samengevoegd: grote gouden dropdown
            (Vandaag / Deze week / Deze maand) met de datum-regel eronder. */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              padding: 0, background: 'transparent', border: 'none',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: GOLD, fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {periodLabel}
              <ChevronDown size={isMobile ? 18 : 20} color="#fff" strokeWidth={3.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </span>
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {subLabelFor(period, customRange)}
            </span>
          </button>
          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 2147483647, background: '#141414', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 10, overflow: 'hidden', minWidth: 170, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                {PERIODS.map(p => (
                  <button key={p.id} onClick={() => { setPeriod(p.id); if (p.id !== 'custom') setOpen(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: p.id === period ? 'rgba(255,215,0,0.1)' : 'transparent', border: 'none', color: p.id === period ? GOLD : 'rgba(255,255,255,0.75)', fontSize: '0.9rem', fontWeight: p.id === period ? 800 : 600, cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
                {period === 'custom' && (
                  <div style={{ padding: '0.6rem 0.85rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,215,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Van
                      <input type="date" value={customRange.start} max={customRange.end || undefined}
                        onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.5rem', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Tot
                      <input type="date" value={customRange.end} min={customRange.start || undefined}
                        onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, color: '#fff', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.5rem', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }} />
                    </label>
                  </div>
                )}
                {/* Volledige stats — opent de uitgebreide stats-modal */}
                <button onClick={() => { setShowWeek(true); setOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,215,0,0.06)', border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255,255,255,0.08)', color: GOLD, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                  <BarChart3 size={15} /> Volledige stats
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats — kaal, geen vak: groot getal + klein label */}
        {items.map((it) => (
          <div key={it.label} style={{ flexShrink: 0, textAlign: 'left' }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, color: it.color || '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', opacity: loading ? 0.45 : 1 }}>
              {it.value}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
              {it.label}
            </div>
          </div>
        ))}

        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Grafiek-knop — grafiek is standaard verborgen, tonen op aanvraag. */}
        <button onClick={() => setChartOpen(v => !v)} title={chartOpen ? 'Grafiek verbergen' : 'Grafiek tonen'}
          style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 0.7rem', borderRadius: 9, cursor: 'pointer', background: chartOpen ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${chartOpen ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`, color: chartOpen ? GOLD : 'rgba(255,255,255,0.6)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <TrendingUp size={14} /> Grafiek
        </button>
      </div>

      {/* Groei-grafiek — alleen zichtbaar wanneer de coach 'm opent. */}
      {chartOpen && (
        <div style={{ marginTop: isMobile ? '0.7rem' : '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: isMobile ? '0.6rem 0.5rem 0.4rem' : '0.75rem 0.85rem 0.5rem' }}>
          <GrowthChart data={timeSeries} isMobile={isMobile} />
        </div>
      )}

      <WeekStatsModal isOpen={showWeek} onClose={() => setShowWeek(false)} leadService={leadService} coachId={coachId} isMobile={isMobile} />
    </div>
  )
}
