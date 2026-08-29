// ============================================================
// 📁 src/modules/coach-command-center/components/insight/WorkoutOverviewChart.jsx
// 4th view in WorkoutColumn — multi-exercise est8Rep over time.
// v1: chart + range selector + default legend. No fullscreen, no custom legend (yet).
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BarChart3, Loader, Maximize2, Minimize2,
  ChevronRight, Eye, EyeOff, ChevronDown
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'
import {
  buildChartData, toRechartsData,
  MUSCLE_LABELS, MUSCLE_COLORS, MUSCLE_ORDER,
} from './workoutChartUtils'

const RANGES = [
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: '1y',  label: '1j'  },
  { id: 'all', label: 'Alles' },
]

// Y-axis SPAN presets — how big is the visible kg window.
// 'auto' = data-tight (lo+hi padded). 'data' (vol) = 0 to actual data max.
// Numeric spans = fixed-size window that can be panned up/down.
// Y_SPANS + Y-pan controls verwijderd. Nieuwe view-mode toggle (per-spiergroep
// vs % verandering) lost het schaal-probleem fundamenteler op: tight auto-scale
// per groep, of normalize-naar-% voor cross-group overzicht.

// 30d/90d use the prop (already loaded). 1y/all need own fetch.
const NEEDS_FETCH = { '30d': false, '90d': false, '1y': true, 'all': true }
const RANGE_DAYS  = { '30d': 30,    '90d': 90,    '1y': 365,  'all': null }

// Convert raw workout_progress rows into the same shape as the exerciseProgress prop.
const shapeProgress = (sessions, progressRows) => {
  const sessionMap = {}
  sessions.forEach(s => { sessionMap[s.id] = s.workout_date })
  const byExercise = {}
  for (const row of progressRows) {
    const date = sessionMap[row.session_id]
    if (!date || !Array.isArray(row.sets)) continue
    const completed = row.sets.filter(s => s.completed !== false)
    if (!byExercise[row.exercise_name]) byExercise[row.exercise_name] = []
    byExercise[row.exercise_name].push({
      date,
      sessionId: row.session_id,
      sets: completed.map(s => ({ reps: s.reps, weight: s.weight })),
    })
  }
  return byExercise
}

const fetchExtendedProgress = async (db, clientId, days) => {
  let q = db.supabase
    .from('workout_sessions')
    .select('id, workout_date')
    .eq('client_id', clientId)
    .order('workout_date', { ascending: true })
  if (days !== null) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    q = q.gte('workout_date', cutoff.toISOString().split('T')[0])
  }
  const { data: sessions, error: sErr } = await q
  if (sErr || !sessions || sessions.length === 0) return {}
  let progress = []
  const batch = 200
  for (let i = 0; i < sessions.length; i += batch) {
    const ids = sessions.slice(i, i + batch).map(s => s.id)
    const { data } = await db.supabase
      .from('workout_progress')
      .select('session_id, exercise_name, sets')
      .in('session_id', ids)
    if (data) progress = progress.concat(data)
  }
  return shapeProgress(sessions, progress)
}

const fetchMuscleMap = async (db, clientId) => {
  const [globalRes, customRes] = await Promise.all([
    db.supabase.from('exercises').select('name, primair_spieren'),
    clientId
      ? db.supabase.from('custom_exercises').select('name, primair_spieren').eq('client_id', clientId)
      : Promise.resolve({ data: [] }),
  ])
  const map = {}
  for (const row of globalRes.data || []) {
    if (row.name && row.primair_spieren) map[row.name] = row.primair_spieren
  }
  // Custom exercises override global (client-specific definitions win)
  for (const row of customRes.data || []) {
    if (row.name && row.primair_spieren) map[row.name] = row.primair_spieren
  }
  return map
}

const formatDateTick = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

const formatDateFull = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null
  const visible = payload.filter(p => p.value !== undefined && p.value !== null)
  if (visible.length === 0) return null
  visible.sort((a, b) => b.value - a.value)
  return (
    <div style={{
      background: 'rgba(15, 15, 15, 0.97)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '0.5rem 0.625rem',
      fontSize: '0.72rem',
      maxWidth: '240px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.35rem', fontWeight: '600' }}>
        {formatDateFull(label)}
      </div>
      {visible.map((p, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          gap: '0.5rem', alignItems: 'center', padding: '0.1rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: p.color, flexShrink: 0
            }} />
            <span style={{
              color: 'rgba(255,255,255,0.85)', fontWeight: '500',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {p.dataKey}
            </span>
          </div>
          <span style={{ color: '#fff', fontWeight: '700', flexShrink: 0 }}>
            {p.value}kg
          </span>
        </div>
      ))}
    </div>
  )
}

// ── PR marker dot (yellow ringed dot on record-sessions, normal dot otherwise) ──
const PrDot = (props) => {
  const { cx, cy, payload, dataKey, stroke } = props
  if (cx == null || cy == null) return null
  const isPR = payload && payload[`${dataKey}__pr`]
  if (isPR) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="#fbbf24" stroke="#fff" strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={1.6} fill="#fff" />
      </g>
    )
  }
  return <circle cx={cx} cy={cy} r={2.5} fill={stroke} />
}

const TREND_BAR_COLOR = { up: '#10b981', down: '#ef4444' } // last bar accent; flat falls back to line color

// ── Mini bar sparkline (last N sessions) — replaces a single arrow ──
// Shows progression shape at a glance. Last bar gets trend-colored accent.
const Sparkline = ({ points, color, trend, hidden, isMobile }) => {
  if (!points || points.length === 0) return null
  const maxBars = isMobile ? 8 : 12
  const slice = points.slice(-maxBars)
  if (slice.length === 0) return null
  const values = slice.map(p => p.value)
  const mn = Math.min(...values)
  const mx = Math.max(...values)
  const rng = mx - mn || 1
  const minH = 5, maxH = 18
  const barW = 3, barGap = 1
  const accent = TREND_BAR_COLOR[trend] || color
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      gap: `${barGap}px`, height: `${maxH}px`,
      flexShrink: 0,
    }}>
      {slice.map((p, i) => {
        const h = minH + ((p.value - mn) / rng) * (maxH - minH)
        const isLast = i === slice.length - 1
        const fill = isLast ? accent : color
        const opacity = hidden ? 0.18 : (isLast ? 1 : 0.3)
        return (
          <div key={i} style={{
            width: `${barW}px`,
            height: `${h}px`,
            background: fill,
            borderRadius: '1px',
            opacity,
            flexShrink: 0,
          }} />
        )
      })}
    </div>
  )
}

// ── Hierarchical legend (groups → exercises with collapse, hide, trend, latest value) ──
const CustomLegend = ({
  datasets, legendGroups, hiddenExercises, hiddenGroups, collapsedGroups,
  onToggleExercise, onToggleGroup, onToggleCollapse, isMobile
}) => {
  if (!datasets || datasets.length === 0) return null
  const groupKeys = Object.keys(legendGroups)
  return (
    <div style={{
      maxHeight: isMobile ? '180px' : '220px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '0.25rem 0',
      flexShrink: 0,
    }}>
      {groupKeys.map(group => {
        const exercises = legendGroups[group]
        const isCollapsed  = collapsedGroups.has(group)
        const isGroupHidden = hiddenGroups.has(group)
        const groupColor = MUSCLE_COLORS[group] || MUSCLE_COLORS.other
        const groupLabel = MUSCLE_LABELS[group] || group

        return (
          <div key={group}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.625rem',
              borderBottom: !isCollapsed ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}>
              <button
                onClick={() => onToggleCollapse(group)}
                aria-label="toggle"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '16px', height: '16px',
                  background: 'transparent', border: 'none', padding: 0,
                  color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                }}
              >
                <ChevronRight size={12} style={{
                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                  transition: 'transform 0.15s ease',
                }} />
              </button>
              <span style={{
                width: '10px', height: '10px', borderRadius: '2px',
                background: groupColor, opacity: isGroupHidden ? 0.25 : 1,
                flexShrink: 0,
              }} />
              <span style={{
                flex: 1, minWidth: 0,
                fontSize: '0.78rem', fontWeight: 800,
                color: isGroupHidden ? 'rgba(255,255,255,0.35)' : '#fff',
                letterSpacing: '-0.01em',
              }}>
                {groupLabel}
                <span style={{
                  marginLeft: '0.5rem', fontWeight: 600, fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.55)', textTransform: 'none',
                }}>
                  ({exercises.length})
                </span>
              </span>
              <button
                onClick={() => onToggleGroup(group)}
                aria-label={isGroupHidden ? 'show group' : 'hide group'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '24px', height: '24px',
                  background: 'transparent', border: 'none', padding: 0,
                  cursor: 'pointer', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                }}
              >
                {isGroupHidden
                  ? <EyeOff size={13} color="rgba(255,255,255,0.35)" />
                  : <Eye size={13} color={groupColor} />}
              </button>
            </div>

            {/* Exercise rows */}
            {!isCollapsed && exercises.map(name => {
              const ds = datasets.find(d => d.exercise === name)
              if (!ds) return null
              const isHidden = hiddenExercises.has(name) || isGroupHidden
              const lastPoint = ds.points[ds.points.length - 1]
              const lastValue = lastPoint?.value
              const firstValue = ds.points[0]?.value
              return (
                <button
                  key={name}
                  onClick={() => onToggleExercise(name)}
                  disabled={isGroupHidden}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.3rem 0.625rem 0.3rem 1.875rem',
                    background: 'transparent', border: 'none',
                    cursor: isGroupHidden ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    textAlign: 'left',
                  }}
                  title={firstValue && lastValue ? `${Math.round(firstValue)}kg → ${Math.round(lastValue)}kg` : undefined}
                >
                  <span style={{
                    width: '14px', height: '2.5px',
                    background: ds.color, borderRadius: '1px',
                    opacity: isHidden ? 0.2 : 1, flexShrink: 0,
                  }} />
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: '0.75rem', fontWeight: 600,
                    color: isHidden ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.92)',
                    textDecoration: isHidden ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {name}
                  </span>
                  <Sparkline
                    points={ds.points}
                    color={ds.color}
                    trend={ds.trend}
                    hidden={isHidden}
                    isMobile={isMobile}
                  />
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800,
                    color: isHidden ? 'rgba(255,255,255,0.25)' : '#fff',
                    minWidth: 44, textAlign: 'right', flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {lastValue ? `${Math.round(lastValue)}kg` : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function WorkoutOverviewChart({
  db, client, exerciseProgress = {}, isMobile = false, onBack
}) {
  const [range, setRange]               = useState('90d')
  const [muscleMap, setMuscleMap]       = useState(null)   // null while loading
  const [extendedCache, setExtCache]    = useState({})     // { '1y': {...}, 'all': {...} }
  const [fetching, setFetching]         = useState(false)
  const [fetchError, setFetchError]     = useState(null)
  const [fullscreen, setFullscreen]     = useState(false)
  // Data-zoom + pan voor de chart (alleen actief in fullscreen).
  // `zoom`: hoeveel we ingezoomd zijn op de DATA (1 = full extent,
  //   2 = de helft, 4 = kwart). Y-domein krimpt evenredig zodat
  //   recharts vanzelf fijnere ticks rendert (5kg → 1kg sprongen).
  // `xOffset` / `yOffset`: relatieve verschuiving van het venster
  //   (-0.5 tot 0.5 van de volledige data-range).
  const [zoom, setZoom]                 = useState(1)
  const [xOffset, setXOffset]           = useState(0)
  const [yOffset, setYOffset]           = useState(0)
  const [hiddenExercises, setHiddenEx]  = useState(() => new Set())
  const [hiddenGroups, setHiddenGroups] = useState(() => new Set())
  const [collapsedGroups, setCollapsed] = useState(() => new Set())
  // View-mode: 'group' = één spiergroep tegelijk tonen (auto-scaled),
  // 'percent' = alle lijnen normaliseren naar % verandering sinds start
  // (alle exercises passen samen op één Y-as).
  const [viewMode, setViewMode]         = useState('group')
  const [selectedGroup, setSelectedGroup] = useState(null)

  const toggleExercise = (name) => setHiddenEx(prev => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name); else next.add(name)
    return next
  })
  const toggleGroup = (group) => setHiddenGroups(prev => {
    const next = new Set(prev)
    if (next.has(group)) next.delete(group); else next.add(group)
    return next
  })
  const toggleCollapse = (group) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(group)) next.delete(group); else next.add(group)
    return next
  })

  // ESC key exits fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  // Load muscle group mapping (global + this client's custom exercises)
  useEffect(() => {
    let cancelled = false
    fetchMuscleMap(db, client?.id).then(map => {
      if (!cancelled) setMuscleMap(map)
    }).catch(() => {
      if (!cancelled) setMuscleMap({})
    })
    return () => { cancelled = true }
  }, [db, client?.id])

  // Trigger fetch when needed
  useEffect(() => {
    if (!NEEDS_FETCH[range]) return
    if (extendedCache[range]) return
    if (!client?.id) return
    let cancelled = false
    setFetching(true)
    setFetchError(null)
    fetchExtendedProgress(db, client.id, RANGE_DAYS[range])
      .then(progress => {
        if (cancelled) return
        setExtCache(prev => ({ ...prev, [range]: progress }))
      })
      .catch(err => {
        if (!cancelled) setFetchError(err.message || 'Fetch mislukt')
      })
      .finally(() => {
        if (!cancelled) setFetching(false)
      })
    return () => { cancelled = true }
  }, [range, client?.id, db, extendedCache])

  // Pick the right data source for the current range
  const sourceProgress = useMemo(() => {
    if (NEEDS_FETCH[range]) return extendedCache[range] || null
    return exerciseProgress
  }, [range, extendedCache, exerciseProgress])

  // Build chart data
  // minSessions = 2: oefeningen met <2 sessies in range worden eruit gefilterd.
  // Eerder stond dit op 3 — dat betekende dat klanten met minder data hun
  // lijnen niet zagen verschijnen totdat ze "inzoomden" naar een breder
  // bereik. Met 2 sessies zijn er al meerdere data-punten voor een lijn.
  const chartResult = useMemo(() => {
    if (!muscleMap || !sourceProgress) return null
    return buildChartData(sourceProgress, muscleMap, range, 2)
  }, [muscleMap, sourceProgress, range])

  // rechartsData wordt verderop in de render-tree gebruikt; we genereren'm
  // pas ná `finalDatasets` (na de percent-transform). Zie onder useMemo voor
  // finalDatasets — daar wordt een tweede useMemo op gestapeld.

  const isLoading = muscleMap === null || (NEEDS_FETCH[range] && !extendedCache[range])

  // ── Header — section-title niveau, consistent met andere page-headers ──
  const Header = () => (
    <div style={{
      padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      flexShrink: 0,
    }}>
      {onBack && !fullscreen && (
        <button
          onClick={onBack}
          aria-label="Terug"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36,
            background: 'transparent', border: 'none',
            color: '#fff', cursor: 'pointer', padding: 0,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
      )}
      <BarChart3 size={isMobile ? 20 : 22} color="#fff" strokeWidth={2.2} style={{ flexShrink: 0 }} />
      <span style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 900, color: '#fff',
        letterSpacing: '-0.02em',
        flex: 1, minWidth: 0,
      }}>
        Krachtoverzicht
      </span>
      <button
        onClick={() => setFullscreen(f => !f)}
        title={fullscreen ? 'Verlaat fullscreen (Esc)' : 'Fullscreen'}
        aria-label={fullscreen ? 'Verlaat fullscreen' : 'Fullscreen'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 10, color: '#fff',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', flexShrink: 0,
        }}
      >
        {fullscreen ? <Minimize2 size={16} strokeWidth={2.4} /> : <Maximize2 size={16} strokeWidth={2.4} />}
      </button>
    </div>
  )

  // ── Range selector (date) ──
  const RangeBar = () => (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      flexShrink: 0,
    }}>
      {RANGES.map(r => {
        const active = range === r.id
        return (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            disabled={fetching}
            style={{
              flex: 1,
              minHeight: 40,
              padding: isMobile ? '0.55rem 0' : '0.6rem 0',
              background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #fff' : '2px solid transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: active ? 800 : 600,
              letterSpacing: '0.04em',

              cursor: fetching ? 'wait' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )

  // ── View-mode toggle: GROEP vs %. Duidelijk welke actief is. ──
  const ModeToggle = () => (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: isMobile ? '0.5rem 0.75rem 0.4rem' : '0.6rem 1rem 0.5rem',
      borderBottom: viewMode === 'percent' ? '1px solid rgba(255,255,255,0.04)' : 'none',
      flexShrink: 0,
    }}>
      {[
        { id: 'group',   label: 'Per spiergroep' },
        { id: 'percent', label: '% verandering' },
      ].map(m => {
        const active = viewMode === m.id
        return (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            style={{
              flex: 1,
              minHeight: 40,
              padding: isMobile ? '0.55rem 0.5rem' : '0.65rem 0.75rem',
              background: active
                ? '#fff'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: active ? 900 : 700,
              letterSpacing: '0.03em',

              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )

  // ── Group-chips: horizontale rij met één spiergroep tegelijk geselecteerd.
  // Alleen zichtbaar in 'group' mode. Scrollt op mobile als'ie niet past. ──
  const GroupChips = ({ groups }) => (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: isMobile ? '0 0.75rem 0.6rem' : '0 1rem 0.7rem',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      paddingBottom: isMobile ? '0.6rem' : '0.7rem',
    }}>
      {groups.map(g => {
        const active = selectedGroup === g
        const color = MUSCLE_COLORS[g] || MUSCLE_COLORS.other
        return (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            style={{
              flexShrink: 0,
              minHeight: 36,
              padding: isMobile ? '0.45rem 0.85rem' : '0.5rem 1rem',
              background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 999,
              color: active ? color : 'rgba(255,255,255,0.65)',
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: active ? 900 : 700,
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: color, flexShrink: 0,
            }} />
            {MUSCLE_LABELS[g] || g}
          </button>
        )
      })}
    </div>
  )

  // ── Empty / loading / error states ──
  const StateBlock = ({ children }) => (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2.5rem 1rem', textAlign: 'center',
      color: 'rgba(255,255,255,0.55)', fontSize: isMobile ? '0.85rem' : '0.9rem',
      fontWeight: 600,
    }}>
      {children}
    </div>
  )

  // Beschikbare spiergroepen (= alleen groepen die data hebben in deze range).
  const availableGroups = useMemo(() => {
    if (!chartResult?.byMuscleGroup) return []
    return MUSCLE_ORDER.filter(g => chartResult.byMuscleGroup[g]?.length > 0)
  }, [chartResult])

  // Auto-select eerste beschikbare groep wanneer er nog geen / een ongeldige
  // gekozen is. Behoudt selectie als die nog steeds bestaat na range-switch.
  useEffect(() => {
    if (viewMode !== 'group') return
    if (selectedGroup && availableGroups.includes(selectedGroup)) return
    if (availableGroups.length > 0) setSelectedGroup(availableGroups[0])
  }, [viewMode, selectedGroup, availableGroups])

  // Filter datasets:
  //   group-mode  → alleen de geselecteerde spiergroep
  //   percent-mode → alle groepen, behalve handmatig verborgen
  const visibleDatasets = useMemo(() => {
    if (!chartResult) return []
    return chartResult.datasets.filter(ds => {
      if (hiddenExercises.has(ds.exercise)) return false
      if (viewMode === 'group') return ds.muscleGroup === selectedGroup
      return !hiddenGroups.has(ds.muscleGroup)
    })
  }, [chartResult, hiddenGroups, hiddenExercises, viewMode, selectedGroup])

  // In percent-mode normaliseren we naar % verandering t.o.v. de eerste
  // datapoint per oefening, zodat alle lijnen op één Y-as passen.
  const finalDatasets = useMemo(() => {
    if (viewMode !== 'percent') return visibleDatasets
    return visibleDatasets.map(ds => {
      const firstNonNull = ds.points.find(p => p.value != null)?.value
      if (!firstNonNull || firstNonNull === 0) return ds
      return {
        ...ds,
        points: ds.points.map(p => ({
          ...p,
          value: p.value != null ? ((p.value / firstNonNull) - 1) * 100 : null,
        })),
      }
    })
  }, [visibleDatasets, viewMode])

  // Data-extents van de uiteindelijke datasets (dus na percent-transform).
  const dataExtents = useMemo(() => {
    if (finalDatasets.length === 0) return null
    let mn = Infinity, mx = -Infinity
    for (const ds of finalDatasets) {
      for (const p of ds.points) {
        if (p.value == null) continue
        if (p.value < mn) mn = p.value
        if (p.value > mx) mx = p.value
      }
    }
    return Number.isFinite(mn) ? { mn, mx } : null
  }, [finalDatasets])

  // Auto-tight basis-Y-domain (zonder zoom): kleine padding rond data zodat
  // lijnen niet tegen de rand plakken. In percent-mode mag negatief.
  const baseYDomain = useMemo(() => {
    if (!dataExtents) return [0, 'auto']
    const { mn, mx } = dataExtents
    const range = mx - mn
    const pad = Math.max(range * 0.12, viewMode === 'percent' ? 5 : 2)
    const lo = viewMode === 'percent'
      ? Math.floor(mn - pad)
      : Math.max(0, Math.floor(mn - pad))
    const hi = Math.ceil(mx + pad)
    return [lo, hi]
  }, [dataExtents, viewMode])

  // Visible Y-domain: pas zoom + yOffset toe op basis-domein. Hoe hoger
  // de zoom, hoe smaller het Y-venster → recharts kiest vanzelf fijnere
  // ticks (1kg sprongen op zoom 4+).
  const yDomain = useMemo(() => {
    const [lo, hi] = baseYDomain
    if (typeof lo !== 'number' || typeof hi !== 'number') return baseYDomain
    if (!fullscreen || zoom <= 1.001) return baseYDomain
    const full = hi - lo
    const span = full / zoom
    const center = (lo + hi) / 2 + yOffset * full
    return [
      Math.round((center - span / 2) * 10) / 10,
      Math.round((center + span / 2) * 10) / 10,
    ]
  }, [baseYDomain, fullscreen, zoom, yOffset])

  // Full recharts row-data.
  const fullRechartsData = useMemo(() => {
    if (!chartResult) return []
    return toRechartsData(finalDatasets, chartResult.allDates)
  }, [chartResult, finalDatasets])

  // Visible slice voor de X-as: in fullscreen pakken we 1/zoom van de rijen,
  // gecentreerd op (midden + xOffset). Buiten fullscreen of bij zoom=1
  // gewoon de volledige data.
  const rechartsData = useMemo(() => {
    if (!fullscreen || zoom <= 1.001) return fullRechartsData
    const n = fullRechartsData.length
    if (n === 0) return fullRechartsData
    const windowSize = Math.max(2, Math.round(n / zoom))
    const centerIdx = Math.round(n / 2 + xOffset * n)
    const startIdx = Math.max(0, Math.min(n - windowSize, centerIdx - Math.floor(windowSize / 2)))
    const endIdx = startIdx + windowSize
    return fullRechartsData.slice(startIdx, endIdx)
  }, [fullRechartsData, fullscreen, zoom, xOffset])

  // ── Gestures ──
  // Cyclus-helpers voor swipe-navigatie:
  //   - group-mode    → vorige/volgende spiergroep
  //   - percent-mode  → vorige/volgende tijdsrange
  const cycleGroup = (dir) => {
    if (availableGroups.length < 2) return
    const idx = availableGroups.indexOf(selectedGroup)
    const next = (idx + dir + availableGroups.length) % availableGroups.length
    setSelectedGroup(availableGroups[next])
    if (navigator.vibrate) navigator.vibrate(15)
  }
  const cycleRange = (dir) => {
    const idx = RANGES.findIndex(r => r.id === range)
    const next = idx + dir
    if (next < 0 || next >= RANGES.length) return
    setRange(RANGES[next].id)
    if (navigator.vibrate) navigator.vibrate(15)
  }

  // Body scroll lock + reset zoom/pan zodra fullscreen opent.
  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setZoom(1)
    setXOffset(0)
    setYOffset(0)
    return () => { document.body.style.overflow = prev }
  }, [fullscreen])

  // Houdt de container-afmetingen bij voor px-naar-offset conversie
  // tijdens dragging.
  const chartAreaRef = useRef(null)

  // ── Touch-gesture refs ──
  const gestureRef = useRef({
    pinchDist: null,    // distance bij 2-finger start
    pinchScale: null,   // zoom op moment van 2-finger start
    dragStart: null,    // {x,y,panX,panY} bij 1-finger start
    tapStart: null,     // {x,y,time} voor tap/swipe-detectie
    lastTap: 0,         // timestamp vorige tap (voor dubbel-tap)
  })

  const touchDistance = (touches) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleChartTouchStart = (e) => {
    const g = gestureRef.current
    if (e.touches.length === 2 && fullscreen) {
      g.pinchDist = touchDistance(e.touches)
      g.pinchScale = zoom
      g.dragStart = null
      g.tapStart = null
    } else if (e.touches.length === 1) {
      const t = e.touches[0]
      g.dragStart = {
        x: t.clientX, y: t.clientY,
        xOff: xOffset, yOff: yOffset,
      }
      g.tapStart = { x: t.clientX, y: t.clientY, time: Date.now() }
    }
  }

  const handleChartTouchMove = (e) => {
    const g = gestureRef.current
    if (e.touches.length === 2 && g.pinchDist != null) {
      const newDist = touchDistance(e.touches)
      const factor = newDist / g.pinchDist
      const newZoom = Math.max(1, Math.min(10, g.pinchScale * factor))
      setZoom(newZoom)
      // Clamp offsets opnieuw op nieuwe zoom-level (anders kun je voorbij
      // de data-randen schuiven tijdens uitzoomen).
      const maxOff = (1 - 1 / newZoom) / 2
      setXOffset(o => Math.max(-maxOff, Math.min(maxOff, o)))
      setYOffset(o => Math.max(-maxOff, Math.min(maxOff, o)))
      e.preventDefault()
      return
    }
    // 1-vinger drag in fullscreen wanneer ingezoomd → pan binnen het
    // venster. Bij zoom = 1 is er geen ruimte om te pannen.
    if (e.touches.length === 1 && g.dragStart && fullscreen && zoom > 1.02) {
      const t = e.touches[0]
      const dx = t.clientX - g.dragStart.x
      const dy = t.clientY - g.dragStart.y
      const rect = chartAreaRef.current?.getBoundingClientRect()
      const w = rect?.width || window.innerWidth
      const h = rect?.height || window.innerHeight
      // Drag-distance → fractie van zichtbare window → fractie van full range
      // (delen door zoom omdat het zichtbare venster 1/zoom van het totaal is).
      const dxFrac = -(dx / w) / zoom
      const dyFrac =  (dy / h) / zoom
      const maxOff = (1 - 1 / zoom) / 2
      const nextX = Math.max(-maxOff, Math.min(maxOff, g.dragStart.xOff + dxFrac))
      const nextY = Math.max(-maxOff, Math.min(maxOff, g.dragStart.yOff + dyFrac))
      setXOffset(nextX)
      setYOffset(nextY)
      e.preventDefault()
    }
  }

  const handleChartTouchEnd = (e) => {
    const g = gestureRef.current
    if (e.touches.length < 2) g.pinchDist = null

    if (g.tapStart) {
      const last = e.changedTouches[0]
      const dx = (last?.clientX || 0) - g.tapStart.x
      const dy = (last?.clientY || 0) - g.tapStart.y
      const dt = Date.now() - g.tapStart.time
      const movement = Math.sqrt(dx * dx + dy * dy)

      // Tap (klein, snel)
      if (movement < 10 && dt < 280) {
        if (!fullscreen) {
          // Normale mode → tap opent fullscreen
          setFullscreen(true)
        } else {
          // Fullscreen → dubbel-tap = zoom-toggle op tap-positie
          const now = Date.now()
          if (now - g.lastTap < 300) {
            setZoom(z => z > 1.5 ? 1 : 2)
            setXOffset(0)
            setYOffset(0)
            g.lastTap = 0
          } else {
            g.lastTap = now
          }
        }
      }
      // Horizontale swipe alleen in NORMALE mode = cycle groep/range. In
      // fullscreen is drag voor panning, dus geen swipe-cyclus.
      else if (!fullscreen && movement >= 50 && dt < 700
               && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const dir = dx < 0 ? +1 : -1
        if (viewMode === 'group') cycleGroup(dir)
        else cycleRange(dir)
      }
      g.tapStart = null
      g.dragStart = null
    }
  }

  // In fullscreen-mode pakt de chart de hele viewport via `inset: 0`.
  // In de inline-mode (op een normale pagina) heeft de parent geen vaste
  // hoogte, dus `height: 100%` faalde stil en de chart collapseerde tot een
  // krap streepje. Hier laten we de root content-gestuurd zijn en geven we
  // straks de chart-area een vaste hoogte.
  const rootStyle = fullscreen
    ? {
        display: 'flex', flexDirection: 'column',
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0a', overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }
    : {
        display: 'flex', flexDirection: 'column',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        overflow: 'hidden',
      }

  return (
    <div style={rootStyle}>
      <Header />
      <RangeBar />
      <ModeToggle />
      {viewMode === 'group' && availableGroups.length > 0 && (
        <GroupChips groups={availableGroups} />
      )}

      {/* Body */}
      {isLoading ? (
        <StateBlock>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader size={20} style={{ animation: 'spinChart 0.8s linear infinite' }} color="#fff" />
            <span>Laden...</span>
          </div>
        </StateBlock>
      ) : fetchError ? (
        <StateBlock>{fetchError}</StateBlock>
      ) : !chartResult || chartResult.datasets.length === 0 ? (
        <StateBlock>
          {Object.keys(sourceProgress || {}).length === 0
            ? 'Geen workout-data in deze periode.'
            : 'Te weinig data — minstens 3 sessies per oefening nodig.'}
        </StateBlock>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column',
          // Inline-mode: laat content zelf z'n ruimte pakken (root heeft geen
          // fixed height meer). Fullscreen: vul resterende ruimte.
          flex: fullscreen ? 1 : '0 0 auto',
          minHeight: 0,
        }}>
          <div
            ref={chartAreaRef}
            onTouchStart={handleChartTouchStart}
            onTouchMove={handleChartTouchMove}
            onTouchEnd={handleChartTouchEnd}
            onClick={!fullscreen ? () => setFullscreen(true) : undefined}
            style={{
              // Vaste hoogte voor de chart-area zodat de grafiek niet meer
              // collapseert op pagina's zonder fixed parent-height.
              height: fullscreen ? undefined : (isMobile ? 340 : 440),
              flex: fullscreen ? 1 : undefined,
              minHeight: fullscreen ? (isMobile ? 220 : 300) : undefined,
              padding: '0.5rem 0.25rem 0',
              touchAction: fullscreen ? 'none' : 'pan-y',
              cursor: fullscreen ? (zoom > 1.05 ? 'zoom-out' : 'default') : 'zoom-in',
              overflow: 'hidden',
              position: 'relative',
            }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rechartsData}
                margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fontSize: 11, fill: '#fff', fontWeight: 700 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  unit={viewMode === 'percent' ? '%' : 'kg'}
                  width={viewMode === 'percent' ? 60 : 54}
                  domain={yDomain}
                  allowDataOverflow={true}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                {finalDatasets.map(ds => (
                  <Line
                    key={ds.exercise}
                    type="monotone"
                    dataKey={ds.exercise}
                    stroke={ds.color}
                    strokeWidth={2.6}
                    dot={viewMode === 'percent' ? false : <PrDot />}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legend toont in group-mode alleen de geselecteerde groep, in
              percent-mode alle groepen (gebruiker mag exercises uitschakelen). */}
          <CustomLegend
            datasets={chartResult.datasets}
            legendGroups={viewMode === 'group' && selectedGroup
              ? { [selectedGroup]: chartResult.byMuscleGroup[selectedGroup] || [] }
              : chartResult.byMuscleGroup}
            hiddenExercises={hiddenExercises}
            hiddenGroups={hiddenGroups}
            collapsedGroups={collapsedGroups}
            onToggleExercise={toggleExercise}
            onToggleGroup={toggleGroup}
            onToggleCollapse={toggleCollapse}
            isMobile={isMobile}
          />
        </div>
      )}

      <style>{`
        @keyframes spinChart { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
