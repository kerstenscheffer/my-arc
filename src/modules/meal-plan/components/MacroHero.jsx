// src/modules/meal-plan/components/MacroHero.jsx
// Big calorie ring (SVG) + 3 stacked macro bars (protein / carbs / fat).
// Tab switch [Vandaag] [Week] — Week loads 7-day average from consumed_meals.

import React, { useEffect, useMemo, useState } from 'react'

const G = {
  primary:    '#FFD700',
  secondary:  '#D4AF37',
  bg:         'rgba(255, 215, 0, 0.06)',
  bgStrong:   'rgba(255, 215, 0, 0.12)',
  border:     'rgba(255, 215, 0, 0.18)',
  textDim:    'rgba(255, 255, 255, 0.45)',
  textFaint:  'rgba(255, 255, 255, 0.25)',
  trackBg:    'rgba(255, 215, 0, 0.08)',
  warn:       '#f59e0b',
  warnSoft:   'rgba(245, 158, 11, 0.6)',
}

const TABS = [
  { id: 'today', label: 'Dag' },
  { id: 'week',  label: 'Week (gem.)' },
]

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
const pct = (consumed, target) => target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0

// Fetch last 7 days of consumed_meals, return per-day totals (oldest first).
const fetchWeekTotals = async (db, clientId) => {
  if (!db?.supabase || !clientId) return []
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)
  const startIso = `${start.toISOString().split('T')[0]}T00:00:00`
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('calories, protein, carbs, fat, consumed_at')
    .eq('client_id', clientId)
    .gte('consumed_at', startIso)
    .order('consumed_at', { ascending: true })
  if (error) return []
  const buckets = {}
  for (const row of data || []) {
    const date = (row.consumed_at || '').split('T')[0]
    if (!date) continue
    if (!buckets[date]) buckets[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    buckets[date].calories += row.calories || 0
    buckets[date].protein  += parseFloat(row.protein) || 0
    buckets[date].carbs    += parseFloat(row.carbs)   || 0
    buckets[date].fat      += parseFloat(row.fat)     || 0
  }
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push(buckets[key] || { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }
  return days
}

// ── Calorie ring (SVG) ─────────────────────────────────────────────────
const CalorieRing = ({ consumed, target, isMobile }) => {
  const size = isMobile ? 120 : 150
  const stroke = isMobile ? 10 : 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0
  const offset = circumference - ratio * circumference
  const isOver = target > 0 && consumed > target
  const consumedStr = fmt(consumed)
  const targetStr = fmt(target)

  // Auto-scale font when consumed gets long
  const len = consumedStr.length
  const baseConsumed = isMobile ? 1.5 : 1.75
  const consumedSize =
    len >= 6 ? baseConsumed * 0.6 :
    len >= 5 ? baseConsumed * 0.78 :
    len >= 4 ? baseConsumed * 0.92 :
    baseConsumed

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
    }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id="kcalGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor="#FFD700" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="kcalOverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor="#FFD700" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={G.trackBg}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? 'url(#kcalOverGrad)' : 'url(#kcalGoldGrad)'}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>

      {/* Inner text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: '0 8%',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '0.5rem',
          fontWeight: 800,
          color: G.primary,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginBottom: '0.2rem',
        }}>
          KCAL
        </div>
        <div style={{
          fontSize: `${consumedSize}rem`,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {consumedStr}
        </div>
        <div style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          color: G.textDim,
          marginTop: '0.15rem',
          lineHeight: 1,
        }}>
          / {targetStr}
        </div>
      </div>
    </div>
  )
}

// ── Macro bar (one row: label + values + bar) ───────────────────────────
const MacroBar = ({ label, consumed, target, unit, isMobile }) => {
  const p = pct(consumed, target)
  const isOver = target > 0 && consumed > target
  const consumedStr = fmt(consumed)
  const targetStr = fmt(target)

  return (
    <div style={{ minWidth: 0 }}>
      {/* Top row: label + values */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '0.5rem',
        marginBottom: '0.25rem',
        minWidth: 0,
      }}>
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: 800,
          color: G.primary,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: 700,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}>
          <span style={{ color: isOver ? G.warn : '#fff' }}>{consumedStr}</span>
          <span style={{ color: G.textDim, fontWeight: 600 }}> / {targetStr}{unit}</span>
        </span>
      </div>

      {/* Bar */}
      <div style={{
        height: '6px',
        background: G.trackBg,
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${p}%`,
          height: '100%',
          background: isOver
            ? 'linear-gradient(90deg, #FFD700 0%, #f59e0b 60%, #ef4444 100%)'
            : 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
          borderRadius: '3px',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}

// Fetch totals for one specific date.
const fetchDayTotals = async (db, clientId, dateStr) => {
  if (!db?.supabase || !clientId || !dateStr) return null
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('calories, protein, carbs, fat')
    .eq('client_id', clientId)
    .gte('consumed_at', `${dateStr}T00:00:00`)
    .lt('consumed_at', `${dateStr}T23:59:59`)
  if (error) return null
  return (data || []).reduce((t, m) => ({
    calories: t.calories + (m.calories || 0),
    protein:  t.protein  + (parseFloat(m.protein) || 0),
    carbs:    t.carbs    + (parseFloat(m.carbs)   || 0),
    fat:      t.fat      + (parseFloat(m.fat)     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

const toIsoDate = (date) => {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}

export default function MacroHero({
  consumed, targets, db, clientId, isMobile: propMobile, onWeekDetail,
  // Day awareness — when selectedIsToday=true we use `consumed` prop directly.
  // When false, MacroHero fetches that day's consumed_meals itself.
  selectedDate, selectedIsToday = true,
}) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  const [tab, setTab] = useState('today')
  const [weekDays, setWeekDays] = useState(null)
  const [weekLoading, setWeekLoading] = useState(false)

  // Per-day cache of consumed totals (key = ISO date)
  const [dayCache, setDayCache] = useState({})
  const [dayLoading, setDayLoading] = useState(false)
  const dateKey = toIsoDate(selectedDate)

  // Fetch the selected day's consumed totals when it's not today.
  useEffect(() => {
    if (tab !== 'today') return
    if (selectedIsToday) return
    if (!dateKey || !db || !clientId) return
    if (dayCache[dateKey] !== undefined) return
    let cancelled = false
    setDayLoading(true)
    fetchDayTotals(db, clientId, dateKey).then(totals => {
      if (!cancelled) {
        setDayCache(prev => ({ ...prev, [dateKey]: totals || { calories: 0, protein: 0, carbs: 0, fat: 0 } }))
      }
    }).finally(() => {
      if (!cancelled) setDayLoading(false)
    })
    return () => { cancelled = true }
  }, [tab, selectedIsToday, dateKey, db, clientId, dayCache])

  useEffect(() => {
    if (tab !== 'week' || weekDays !== null || !db || !clientId) return
    let cancelled = false
    setWeekLoading(true)
    fetchWeekTotals(db, clientId).then(days => {
      if (!cancelled) setWeekDays(days)
    }).finally(() => {
      if (!cancelled) setWeekLoading(false)
    })
    return () => { cancelled = true }
  }, [tab, weekDays, db, clientId])

  const weekAvg = useMemo(() => {
    if (!Array.isArray(weekDays) || weekDays.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
    const sum = weekDays.reduce((s, d) => ({
      calories: s.calories + d.calories,
      protein:  s.protein  + d.protein,
      carbs:    s.carbs    + d.carbs,
      fat:      s.fat      + d.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    const n = weekDays.length
    return {
      calories: sum.calories / n,
      protein:  sum.protein  / n,
      carbs:    sum.carbs    / n,
      fat:      sum.fat      / n,
    }
  }, [weekDays])

  // Resolve the right consumed source.
  let display
  if (tab === 'week') {
    display = weekAvg
  } else if (selectedIsToday) {
    display = consumed || {}
  } else {
    display = dayCache[dateKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }
  const t = targets || {}
  const showDayLoadingShim = tab === 'today' && !selectedIsToday && dayCache[dateKey] === undefined && dayLoading

  return (
    <div style={{
      padding: isMobile ? '0.75rem 1rem 1rem' : '1rem 2rem 1.25rem',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      {/* Tab strip — clean underline style, no chrome */}
      <div style={{
        display: 'flex',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {TABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: '0.5rem 0.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${G.primary}` : '2px solid transparent',
                color: active ? G.primary : G.textDim,
                fontSize: '0.7rem',
                fontWeight: active ? 800 : 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
                minHeight: '36px',
                marginBottom: '-1px',  // overlap parent border so 2px sits flush
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Loading shim — week first-load OR non-today day fetch */}
      {(tab === 'week' && weekLoading && weekDays === null) || showDayLoadingShim ? (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: G.textFaint,
          fontSize: '0.75rem',
        }}>
          {tab === 'week' ? 'Weekgegevens laden…' : 'Daggegevens laden…'}
        </div>
      ) : (
        // Ring + 3 bars — no card chrome, full width
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '1rem' : '1.75rem',
          minWidth: 0,
        }}>
          <CalorieRing
            consumed={display.calories}
            target={t.calories}
            isMobile={isMobile}
          />
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.625rem' : '0.875rem',
          }}>
            <MacroBar label="Eiwit"        consumed={display.protein} target={t.protein} unit=" g" isMobile={isMobile} />
            <MacroBar label="Koolhydraten" consumed={display.carbs}   target={t.carbs}   unit=" g" isMobile={isMobile} />
            <MacroBar label="Vetten"       consumed={display.fat}     target={t.fat}     unit=" g" isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* Week-tab footer link */}
      {tab === 'week' && weekDays && onWeekDetail && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.625rem' }}>
          <button
            onClick={onWeekDetail}
            style={{
              background: 'transparent',
              border: 'none',
              color: G.primary,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '0.4rem 0.8rem',
              touchAction: 'manipulation',
            }}
          >
            Bekijk weekdetails →
          </button>
        </div>
      )}
    </div>
  )
}
