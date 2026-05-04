// ============================================================
// 📁 src/modules/coach-command-center/components/insight/WorkoutOverviewChart.jsx
// 4th view in WorkoutColumn — multi-exercise est8Rep over time.
// v1: chart + range selector + default legend. No fullscreen, no custom legend (yet).
// ============================================================
import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, BarChart3, Loader, Maximize2, Minimize2,
  ChevronRight, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'
import {
  buildChartData, toRechartsData,
  MUSCLE_LABELS, MUSCLE_COLORS
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
const Y_SPANS = [
  { id: 'auto', label: 'auto', span: null },
  { id: '5',    label: '5',    span: 5 },
  { id: '10',   label: '10',   span: 10 },
  { id: '20',   label: '20',   span: 20 },
  { id: '50',   label: '50',   span: 50 },
  { id: '100',  label: '100',  span: 100 },
  { id: 'vol',  label: 'vol',  span: 'data' },
]

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
      fontSize: '0.65rem',
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
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
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
                fontSize: '0.7rem', fontWeight: '700',
                color: isGroupHidden ? 'rgba(255,255,255,0.3)' : '#fff',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {groupLabel}
                <span style={{
                  marginLeft: '0.4rem', fontWeight: '500', fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.3)', textTransform: 'none',
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
                    fontSize: '0.65rem', fontWeight: '500',
                    color: isHidden ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
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
                    fontSize: '0.62rem', fontWeight: '700',
                    color: isHidden ? 'rgba(255,255,255,0.2)' : '#fff',
                    minWidth: '38px', textAlign: 'right', flexShrink: 0,
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
  const [hiddenExercises, setHiddenEx]  = useState(() => new Set())
  const [hiddenGroups, setHiddenGroups] = useState(() => new Set())
  const [collapsedGroups, setCollapsed] = useState(() => new Set())
  const [ySpanId, setYSpanId]           = useState('auto')  // see Y_SPANS
  const [yOffset, setYOffset]           = useState(0)       // bottom of window when span is numeric

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
  const chartResult = useMemo(() => {
    if (!muscleMap || !sourceProgress) return null
    return buildChartData(sourceProgress, muscleMap, range, 3)
  }, [muscleMap, sourceProgress, range])

  const rechartsData = useMemo(() => {
    if (!chartResult) return []
    return toRechartsData(chartResult.datasets, chartResult.allDates)
  }, [chartResult])

  const isLoading = muscleMap === null || (NEEDS_FETCH[range] && !extendedCache[range])

  // ── Header ──
  const Header = () => (
    <div style={{
      padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      flexShrink: 0
    }}>
      {onBack && !fullscreen && (
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center',
            background: 'transparent', border: 'none',
            color: '#f97316', cursor: 'pointer', padding: 0,
            touchAction: 'manipulation'
          }}
        >
          <ArrowLeft size={14} />
        </button>
      )}
      <BarChart3 size={14} color="#f97316" />
      <span style={{
        fontSize: '0.7rem', fontWeight: '700', color: '#f97316',
        textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1
      }}>
        Krachtoverzicht
      </span>
      <button
        onClick={() => setFullscreen(f => !f)}
        title={fullscreen ? 'Verlaat fullscreen (Esc)' : 'Fullscreen'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '26px', height: '26px',
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: '5px', color: '#f97316',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', flexShrink: 0
        }}
      >
        {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
      </button>
    </div>
  )

  // ── Range selector (date) ──
  const RangeBar = () => (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      flexShrink: 0
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
              padding: isMobile ? '0.45rem 0' : '0.5rem 0',
              background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #f97316' : '2px solid transparent',
              color: active ? '#f97316' : 'rgba(255,255,255,0.4)',
              fontSize: '0.65rem',
              fontWeight: active ? '700' : '500',
              cursor: fetching ? 'wait' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )

  // ── Y-axis SPAN selector ──
  const YBar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      padding: '0 0.5rem',
      flexShrink: 0,
      gap: '0.25rem',
    }}>
      <span style={{
        fontSize: '0.5rem', fontWeight: '700',
        color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
        letterSpacing: '0.06em', flexShrink: 0,
      }}>
        Y-VENSTER
      </span>
      {Y_SPANS.map(p => {
        const active = ySpanId === p.id
        return (
          <button
            key={p.id}
            onClick={() => changeSpan(p.id)}
            style={{
              flex: 1,
              padding: isMobile ? '0.3rem 0' : '0.35rem 0',
              background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: active ? '#f97316' : 'rgba(255,255,255,0.4)',
              fontSize: '0.6rem',
              fontWeight: active ? '700' : '500',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )

  // ── Pan controls (only when span is numeric) ──
  const YPanBar = () => {
    if (!isNumericSpan) return null
    const [lo, hi] = yDomain
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '0.25rem 0.5rem',
        flexShrink: 0,
        gap: '0.4rem',
      }}>
        <button
          onClick={panDown}
          disabled={yOffset === 0}
          title="Venster omlaag"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.6rem',
            background: yOffset === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(249,115,22,0.1)',
            border: '1px solid ' + (yOffset === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(249,115,22,0.2)'),
            borderRadius: '5px',
            color: yOffset === 0 ? 'rgba(255,255,255,0.2)' : '#f97316',
            fontSize: '0.62rem', fontWeight: '700',
            cursor: yOffset === 0 ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronDown size={12} /> -{panStep}
        </button>
        <span style={{
          fontSize: '0.62rem', fontWeight: '700',
          color: 'rgba(255,255,255,0.7)',
          flex: 1, textAlign: 'center',
        }}>
          {lo}–{hi} kg
        </span>
        <button
          onClick={panUp}
          title="Venster omhoog"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.3rem 0.6rem',
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '5px',
            color: '#f97316',
            fontSize: '0.62rem', fontWeight: '700',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronUp size={12} /> +{panStep}
        </button>
        <button
          onClick={resetView}
          title="Reset naar auto"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '26px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '5px',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    )
  }

  // ── Empty / loading / error states ──
  const StateBlock = ({ children }) => (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', textAlign: 'center',
      color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem'
    }}>
      {children}
    </div>
  )

  // Filtered datasets for rendering Lines
  const visibleDatasets = useMemo(() => {
    if (!chartResult) return []
    return chartResult.datasets.filter(ds =>
      !hiddenGroups.has(ds.muscleGroup) && !hiddenExercises.has(ds.exercise)
    )
  }, [chartResult, hiddenGroups, hiddenExercises])

  const currentSpan = Y_SPANS.find(s => s.id === ySpanId) || Y_SPANS[0]
  const isNumericSpan = typeof currentSpan.span === 'number'

  // Data extents of currently visible datasets (memoized, used for auto/vol/centering)
  const dataExtents = useMemo(() => {
    if (visibleDatasets.length === 0) return null
    let mn = Infinity, mx = -Infinity
    for (const ds of visibleDatasets) {
      for (const p of ds.points) {
        if (p.value < mn) mn = p.value
        if (p.value > mx) mx = p.value
      }
    }
    return Number.isFinite(mn) ? { mn, mx } : null
  }, [visibleDatasets])

  // Y-axis domain by mode:
  //   'auto'    → data-tight (mn-pad, mx+pad)
  //   numeric   → fixed-size window from yOffset (panable)
  //   'data'    → 0 to actual data max + 5%
  const yDomain = useMemo(() => {
    if (isNumericSpan) return [yOffset, yOffset + currentSpan.span]
    if (!dataExtents) return [0, 'auto']
    const { mn, mx } = dataExtents
    if (currentSpan.span === 'data') return [0, Math.ceil(mx * 1.05)]
    const range = mx - mn
    const pad = Math.max(range * 0.15, 2)
    return [Math.max(0, Math.floor(mn - pad)), Math.ceil(mx + pad)]
  }, [isNumericSpan, currentSpan, yOffset, dataExtents])

  // Pan step = half window (overlap so you don't lose context)
  const panStep = isNumericSpan ? Math.max(1, Math.round(currentSpan.span / 2)) : 0
  const panUp   = () => setYOffset(o => o + panStep)
  const panDown = () => setYOffset(o => Math.max(0, o - panStep))
  const resetView = () => { setYSpanId('auto'); setYOffset(0) }

  // Switching span: preserve the visible center so the user keeps focus on the same area.
  const changeSpan = (id) => {
    const next = Y_SPANS.find(s => s.id === id)
    if (next && typeof next.span === 'number') {
      const [lo, hi] = yDomain
      const loN = typeof lo === 'number' ? lo : 0
      const hiN = typeof hi === 'number' ? hi : (loN + next.span)
      const center = (loN + hiN) / 2
      setYOffset(Math.max(0, Math.round(center - next.span / 2)))
    }
    setYSpanId(id)
  }

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
        height: '100%', overflow: 'hidden',
        background: '#0a0a0a',
      }

  return (
    <div style={rootStyle}>
      <Header />
      <RangeBar />
      <YBar />
      <YPanBar />

      {/* Body */}
      {isLoading ? (
        <StateBlock>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader size={20} style={{ animation: 'spinChart 0.8s linear infinite' }} color="#f97316" />
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: isMobile ? '220px' : '300px', padding: '0.5rem 0.25rem 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rechartsData}
                margin={{ top: 8, right: 12, bottom: 4, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateTick}
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  unit="kg"
                  width={42}
                  domain={yDomain}
                  allowDataOverflow={true}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                {visibleDatasets.map(ds => (
                  <Line
                    key={ds.exercise}
                    type="monotone"
                    dataKey={ds.exercise}
                    stroke={ds.color}
                    strokeWidth={2}
                    dot={<PrDot />}
                    activeDot={{ r: 4.5, strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <CustomLegend
            datasets={chartResult.datasets}
            legendGroups={chartResult.byMuscleGroup}
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
