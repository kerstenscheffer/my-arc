// src/modules/lead-management/components/PeriodStatsBar.jsx
// Grote, kale quick-stats bar bovenaan de lead-kanban (issue 98cefce0).
// Periode-selector (dag/week/maand) staat op dezelfde regel als de stats:
// bold gouden titel + dikke witte pijl, geen vak eromheen. Klik = dropdown die
// de stats voor die periode laadt. Data uit dezelfde range-methodes als de
// week-analytics modal (getRangeFunnelStats + getRangeReactionStats).
import { useState, useEffect } from 'react'
import { ChevronDown, BarChart3, BookOpen } from 'lucide-react'
import WeekStatsModal from './WeekStatsModal'
import { SOPModal } from './DailyStatsBar'

const GOLD = '#FFD700'

const PERIODS = [
  { id: 'day', label: 'Vandaag' },
  { id: 'week', label: 'Deze week' },
  { id: 'month', label: 'Deze maand' },
]

// Datum/periode-subtekst onder de dropdown (zoals de meal-pagina datum-regel).
function subLabelFor(period) {
  const now = new Date()
  if (period === 'day') return now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  if (period === 'week') {
    const s = new Date(now); const d = s.getDay(); s.setDate(s.getDate() + (d === 0 ? -6 : 1 - d)); s.setHours(0, 0, 0, 0)
    const e = new Date(s); e.setDate(s.getDate() + 6)
    const fmt = (x) => x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${fmt(s)} – ${fmt(e)}`
  }
  return now.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function rangeFor(period) {
  const now = new Date()
  const start = new Date(now)
  if (period === 'day') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day // maandag-start
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  return { start: start.toISOString(), end: now.toISOString() }
}

export default function PeriodStatsBar({ leadService, coachId, isMobile, refreshKey = 0 }) {
  const [period, setPeriod] = useState('day')
  const [open, setOpen] = useState(false)
  const [showWeek, setShowWeek] = useState(false)
  const [showSOP, setShowSOP] = useState(false)
  const [loading, setLoading] = useState(true)
  const [s, setS] = useState({ nieuw: 0, follow: 0, reacties: 0, voorgesteld: 0, ingepland: 0, sales: 0, noshow: 0 })

  useEffect(() => {
    if (!leadService || !coachId) return
    let alive = true
    const load = async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const { start, end } = rangeFor(period)
        const [funnel, react] = await Promise.all([
          leadService.getRangeFunnelStats(coachId, start, end),
          leadService.getRangeReactionStats ? leadService.getRangeReactionStats(coachId, start, end) : Promise.resolve(null),
        ])
        if (!alive) return
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
  }, [period, coachId, leadService, refreshKey])

  const periodLabel = PERIODS.find(p => p.id === period)?.label || 'Week'
  const items = [
    { label: 'Nieuwe leads', value: s.nieuw },
    { label: 'Follow-ups', value: s.follow },
    { label: 'Reacties', value: s.reacties },
    { label: 'Call voorgesteld', value: s.voorgesteld },
    { label: 'Call ingepland', value: s.ingepland },
    { label: 'Sales', value: s.sales, color: GOLD },
    { label: 'No-shows', value: s.noshow, color: '#ef4444' },
  ]

  return (
    <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', columnGap: isMobile ? '0.85rem' : '1.25rem', flexWrap: 'wrap', rowGap: '0.65rem' }}>

        {/* Periode-selector — bold goud + dikke witte pijl, geen vak */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: 0, background: 'transparent', border: 'none',
              color: GOLD, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              letterSpacing: '-0.01em',
            }}
          >
            {periodLabel}
            <ChevronDown size={isMobile ? 18 : 20} color="#fff" strokeWidth={3.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>
          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 2147483647, background: '#141414', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 10, overflow: 'hidden', minWidth: 130, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                {PERIODS.map(p => (
                  <button key={p.id} onClick={() => { setPeriod(p.id); setOpen(false) }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', background: p.id === period ? 'rgba(255,215,0,0.1)' : 'transparent', border: 'none', color: p.id === period ? GOLD : 'rgba(255,255,255,0.75)', fontSize: '0.9rem', fontWeight: p.id === period ? 800 : 600, cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
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
            <div style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
              {it.label}
            </div>
          </div>
        ))}

        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Week-analytics + SOP — belangrijk, groot en duidelijk */}
        <button onClick={() => setShowWeek(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.85rem', background: 'rgba(255,215,0,0.12)', border: `1.5px solid ${GOLD}`, borderRadius: 8, color: GOLD, fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap' }}>
          <BarChart3 size={14} /> Week
        </button>
        <button onClick={() => setShowSOP(true)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0.4rem 0.65rem' : '0.45rem 0.85rem', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap' }}>
          <BookOpen size={14} /> SOP
        </button>
      </div>

      <WeekStatsModal isOpen={showWeek} onClose={() => setShowWeek(false)} leadService={leadService} coachId={coachId} isMobile={isMobile} />
      {showSOP && <SOPModal isMobile={isMobile} onClose={() => setShowSOP(false)} />}
    </div>
  )
}
