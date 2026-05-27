// src/modules/meal-plan/components/AIMealHistoryModal.jsx
// 🎯 v3.0 — Rebuilt on consumed_meals (the actual log table)
// InfoModal-style shell, gold theme, 3 tabs: Logboek / Stats / Patronen.

import React, { useEffect, useMemo, useState } from 'react'
import {
  X, BookOpen, BarChart3, Sparkles,
  TrendingUp, TrendingDown, Minus, Award, Calendar, Clock,
  Flame, Beef, Wheat, Droplet, ChevronRight,
} from 'lucide-react'

const G = {
  primary:    '#FFD700',
  secondary:  '#D4AF37',
  bg:         'rgba(255, 215, 0, 0.06)',
  bgStrong:   'rgba(255, 215, 0, 0.12)',
  border:     'rgba(255, 215, 0, 0.18)',
  textDim:    'rgba(255, 255, 255, 0.45)',
  textFaint:  'rgba(255, 255, 255, 0.25)',
  trackBg:    'rgba(255, 215, 0, 0.08)',
  good:       '#10b981',
  warn:       '#f59e0b',
  bad:        '#ef4444',
}

const PERIODS = [
  { id: '7d',  label: '7 dagen',  days: 7 },
  { id: '30d', label: '30 dagen', days: 30 },
  { id: '90d', label: '90 dagen', days: 90 },
]

const TABS = [
  { id: 'logboek',  label: 'Logboek',  icon: BookOpen },
  { id: 'stats',    label: 'Stats',    icon: BarChart3 },
  { id: 'patronen', label: 'Patronen', icon: Sparkles },
]

// ════════ Helpers ════════
const isoDate = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return x.toISOString().split('T')[0]
}
const fmtNL = (n) => Math.round(n || 0).toLocaleString('nl-NL')
const fmtDayLabel = (iso) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}
const fmtTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

// Group meals by date and aggregate totals.
const groupByDate = (meals) => {
  const map = {}
  for (const m of meals) {
    const date = (m.consumed_at || '').split('T')[0]
    if (!date) continue
    if (!map[date]) {
      map[date] = { date, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
    }
    map[date].meals.push(m)
    map[date].totals.calories += m.calories || 0
    map[date].totals.protein  += parseFloat(m.protein) || 0
    map[date].totals.carbs    += parseFloat(m.carbs)   || 0
    map[date].totals.fat      += parseFloat(m.fat)     || 0
  }
  return map
}

// Build a continuous date-array spanning `days` ending today.
const fillDateRange = (byDate, days) => {
  const result = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = isoDate(d)
    result.push(byDate[key] || { date: key, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } })
  }
  return result
}

// Compliance = % days where calories are within ±tolerance of target.
const computeCompliance = (days, targetKcal, tolerance = 0.10) => {
  if (!targetKcal || days.length === 0) return { hit: 0, total: 0, pct: 0 }
  const lo = targetKcal * (1 - tolerance)
  const hi = targetKcal * (1 + tolerance)
  const loggedDays = days.filter(d => d.totals.calories > 0)
  const hit = loggedDays.filter(d => d.totals.calories >= lo && d.totals.calories <= hi).length
  const total = loggedDays.length
  return { hit, total, pct: total > 0 ? Math.round((hit / total) * 100) : 0 }
}

// Streak = max consecutive days (counting from most recent) hitting target.
const computeStreak = (days, targetKcal, tolerance = 0.10) => {
  if (!targetKcal) return 0
  const lo = targetKcal * (1 - tolerance)
  const hi = targetKcal * (1 + tolerance)
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const c = days[i].totals.calories
    if (c >= lo && c <= hi) streak++
    else break
  }
  return streak
}

// Aggregate top meals by frequency.
const computePatterns = (meals) => {
  const map = new Map()
  for (const m of meals) {
    const key = (m.meal_name || '').trim().toLowerCase()
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, {
        name: m.meal_name,
        count: 0,
        totalKcal: 0,
        image_url: m.image_url || null,
      })
    }
    const e = map.get(key)
    e.count += 1
    e.totalKcal += m.calories || 0
    if (!e.image_url && m.image_url) e.image_url = m.image_url
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(e => ({ ...e, avgKcal: e.count > 0 ? Math.round(e.totalKcal / e.count) : 0 }))
}

// Hour-bucket distribution: how many meals per hour-of-day.
const computeHourDistribution = (meals) => {
  const buckets = Array(24).fill(0)
  for (const m of meals) {
    if (!m.consumed_at) continue
    const h = new Date(m.consumed_at).getHours()
    if (h >= 0 && h < 24) buckets[h]++
  }
  return buckets
}

// ════════ Sparkline ════════
const Sparkline = ({ days, target, height = 36 }) => {
  if (!days || days.length === 0) return null
  const values = days.map(d => d.totals.calories || 0)
  const mx = Math.max(...values, target || 0, 1)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: '2px',
      height: `${height}px`, padding: '0 0',
    }}>
      {days.map((d, i) => {
        const v = d.totals.calories || 0
        const h = Math.max(2, (v / mx) * height)
        const isToday = i === days.length - 1
        const inRange = target > 0 && v >= target * 0.9 && v <= target * 1.1
        const fill = v === 0
          ? 'rgba(255,255,255,0.05)'
          : inRange ? G.primary
          : v > target * 1.1 ? G.warn
          : 'rgba(255, 215, 0, 0.35)'
        return (
          <div
            key={d.date}
            title={`${fmtDayLabel(d.date)}: ${fmtNL(v)} kcal`}
            style={{
              flex: 1,
              height: `${h}px`,
              background: fill,
              borderRadius: '2px',
              opacity: isToday ? 1 : 0.85,
              transition: 'all 0.2s ease',
            }}
          />
        )
      })}
    </div>
  )
}

// ════════ Tabs ════════
function LogboekTab({ days, isMobile }) {
  const sorted = [...days].reverse()  // most recent first
  if (sorted.every(d => d.meals.length === 0)) {
    return <Empty>Nog geen gelogde maaltijden in deze periode.</Empty>
  }
  return (
    <div>
      {sorted.map(day => (
        day.meals.length > 0 && <DayCard key={day.date} day={day} isMobile={isMobile} />
      ))}
    </div>
  )
}

function DayCard({ day, isMobile }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 700, color: '#fff', textTransform: 'capitalize',
            letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>
            {fmtDayLabel(day.date)}
          </div>
          <div style={{
            display: 'flex', gap: '0.625rem', marginTop: '0.25rem',
            fontSize: isMobile ? '0.65rem' : '0.7rem', color: G.textDim,
          }}>
            <span><strong style={{ color: '#fff', fontWeight: 800 }}>{fmtNL(day.totals.calories)}</strong> kcal</span>
            <span><strong style={{ color: '#fff', fontWeight: 800 }}>{fmtNL(day.totals.protein)}</strong>g E</span>
            <span><strong style={{ color: '#fff', fontWeight: 800 }}>{fmtNL(day.totals.carbs)}</strong>g K</span>
            <span><strong style={{ color: '#fff', fontWeight: 800 }}>{fmtNL(day.totals.fat)}</strong>g V</span>
          </div>
        </div>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, color: G.textFaint,
          padding: '0.2rem 0.5rem',
          background: G.bg, border: `1px solid ${G.border}`, borderRadius: '6px',
          flexShrink: 0,
        }}>
          {day.meals.length}×
        </div>
        <ChevronRight size={14} color={G.textFaint} style={{
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease', flexShrink: 0,
        }} />
      </button>
      {open && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: isMobile ? '0.25rem 1rem 0.5rem' : '0.375rem 1.5rem 0.625rem',
        }}>
          {day.meals.map((m, idx) => (
            <div key={m.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.45rem 0',
              borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
            }}>
              {m.image_url ? (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: `url(${m.image_url}) center/cover`,
                  flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)',
                }} />
              ) : (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: G.bg, border: `1px solid ${G.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: G.primary, fontSize: '0.55rem', fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {(m.meal_name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {m.meal_name || 'Onbekend'}
                </div>
                <div style={{ fontSize: '0.55rem', color: G.textFaint, marginTop: '0.1rem' }}>
                  {fmtTime(m.consumed_at)}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: G.textDim, flexShrink: 0 }}>
                {fmtNL(m.calories)} kcal
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatsTab({ days, targets, isMobile }) {
  const compliance = computeCompliance(days, targets.calories)
  const streak = computeStreak(days, targets.calories)
  const loggedDays = days.filter(d => d.totals.calories > 0)
  const avgKcal = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.totals.calories, 0) / loggedDays.length)
    : 0
  const avgProtein = loggedDays.length > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.totals.protein, 0) / loggedDays.length)
    : 0
  const bestDay = loggedDays.reduce((b, d) => {
    if (!targets.calories) return b
    const dev = Math.abs(d.totals.calories - targets.calories)
    if (!b || dev < b.dev) return { dev, day: d }
    return b
  }, null)
  const worstDay = loggedDays.reduce((w, d) => {
    if (!targets.calories) return w
    const dev = Math.abs(d.totals.calories - targets.calories)
    if (!w || dev > w.dev) return { dev, day: d }
    return w
  }, null)

  const tileStyle = {
    flex: 1, minWidth: 0,
    padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.125rem',
    background: G.bg,
    border: `1px solid ${G.border}`,
    borderRadius: '12px',
  }
  const Tile = ({ children, label, value, sub, accent = G.primary }) => (
    <div style={tileStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
        {children}
        <span style={{
          fontSize: '0.55rem', fontWeight: 700, color: accent,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: isMobile ? '1.4rem' : '1.6rem',
        fontWeight: 900, color: '#fff',
        lineHeight: 1, letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: '0.6rem', color: G.textDim, marginTop: '0.3rem',
          fontWeight: 500,
        }}>
          {sub}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '0.75rem 1rem 1rem' : '1rem 1.5rem 1.25rem' }}>
      {/* Top row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '0.625rem',
      }}>
        <Tile
          label="Compliance"
          value={`${compliance.pct}%`}
          sub={`${compliance.hit}/${compliance.total} dagen binnen ±10%`}
        >
          <Award size={12} color={G.primary} />
        </Tile>
        <Tile
          label="Streak"
          value={streak === 1 ? '1 dag' : `${streak} dagen`}
          sub="op rij binnen kcal-doel"
          accent={streak >= 3 ? G.good : G.primary}
        >
          <Flame size={12} color={streak >= 3 ? G.good : G.primary} />
        </Tile>
      </div>

      <div style={{ height: '0.625rem' }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '0.625rem',
      }}>
        <Tile
          label="Gem. kcal"
          value={fmtNL(avgKcal)}
          sub={targets.calories ? `Doel: ${fmtNL(targets.calories)}` : 'Geen doel'}
        >
          <Flame size={12} color={G.primary} />
        </Tile>
        <Tile
          label="Gem. eiwit"
          value={`${fmtNL(avgProtein)}g`}
          sub={targets.protein ? `Doel: ${fmtNL(targets.protein)}g` : 'Geen doel'}
        >
          <Beef size={12} color={G.primary} />
        </Tile>
      </div>

      {/* Best / worst day */}
      {(bestDay || worstDay) && (
        <div style={{ marginTop: '0.875rem' }}>
          <div style={{
            fontSize: '0.55rem', fontWeight: 800, color: G.textFaint,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: '0.4rem',
          }}>
            Hoogtepunten
          </div>
          {bestDay && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '10px', marginBottom: '0.4rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} color={G.good} />
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, color: G.good, textTransform: 'uppercase' }}>
                    Dichtst bij doel
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                    {fmtDayLabel(bestDay.day.date)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                {fmtNL(bestDay.day.totals.calories)} kcal
              </div>
            </div>
          )}
          {worstDay && worstDay !== bestDay && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.12)',
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingDown size={14} color={G.warn} />
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, color: G.warn, textTransform: 'uppercase' }}>
                    Grootste afwijking
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                    {fmtDayLabel(worstDay.day.date)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                {fmtNL(worstDay.day.totals.calories)} kcal
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PatronenTab({ meals, isMobile }) {
  const top = useMemo(() => computePatterns(meals), [meals])
  const hours = useMemo(() => computeHourDistribution(meals), [meals])
  const hourMax = Math.max(...hours, 1)

  if (top.length === 0) {
    return <Empty>Nog geen patronen — log meer maaltijden.</Empty>
  }

  return (
    <div>
      {/* Top meals */}
      <div style={{
        padding: isMobile ? '0.875rem 1rem 0.5rem' : '1rem 1.5rem 0.625rem',
      }}>
        <div style={{
          fontSize: '0.55rem', fontWeight: 800, color: G.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Top {top.length} meest gelogd
        </div>
      </div>
      {top.map((p, idx) => (
        <div key={p.name + idx} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontSize: '0.55rem', fontWeight: 800, color: G.primary,
            width: '18px', textAlign: 'center', flexShrink: 0,
          }}>
            {idx + 1}
          </div>
          {p.image_url ? (
            <div style={{
              width: '32px', height: '32px', borderRadius: '7px',
              background: `url(${p.image_url}) center/cover`,
              flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)',
            }} />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '7px',
              background: G.bg, border: `1px solid ${G.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: G.primary, fontSize: '0.6rem', fontWeight: 800,
              flexShrink: 0,
            }}>
              {(p.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem', fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {p.name}
            </div>
            <div style={{ fontSize: '0.6rem', color: G.textDim, marginTop: '0.1rem' }}>
              gem. {fmtNL(p.avgKcal)} kcal
            </div>
          </div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, color: G.primary,
            padding: '0.2rem 0.5rem',
            background: G.bg, border: `1px solid ${G.border}`, borderRadius: '6px',
            flexShrink: 0,
          }}>
            {p.count}×
          </div>
        </div>
      ))}

      {/* Hour distribution */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem' }}>
        <div style={{
          fontSize: '0.55rem', fontWeight: 800, color: G.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: '0.625rem',
        }}>
          Wanneer log je?
        </div>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '2px',
          height: '52px',
        }}>
          {hours.map((c, h) => (
            <div
              key={h}
              title={`${h}:00 — ${c} log${c === 1 ? '' : 's'}`}
              style={{
                flex: 1,
                height: `${Math.max(2, (c / hourMax) * 52)}px`,
                background: c > 0 ? G.primary : 'rgba(255,255,255,0.05)',
                opacity: c > 0 ? (0.4 + (c / hourMax) * 0.6) : 0.3,
                borderRadius: '2px',
              }}
            />
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem',
          fontSize: '0.5rem', color: G.textFaint, fontWeight: 600,
        }}>
          <span>0u</span><span>6u</span><span>12u</span><span>18u</span><span>24u</span>
        </div>
      </div>
    </div>
  )
}

function Empty({ children }) {
  return (
    <div style={{
      padding: '3rem 1rem', textAlign: 'center',
      color: G.textFaint, fontSize: '0.8rem',
    }}>
      {children}
    </div>
  )
}

// ════════ Main ════════
export default function AIMealHistoryModal({ isOpen, onClose, db, clientId }) {
  const isMobile = window.innerWidth <= 768
  const [period, setPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('logboek')
  const [meals, setMeals] = useState([])
  const [targets, setTargets] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [loading, setLoading] = useState(true)

  const periodCfg = PERIODS.find(p => p.id === period) || PERIODS[0]

  // Load consumed_meals + targets
  useEffect(() => {
    if (!isOpen || !db?.supabase || !clientId) return
    let cancelled = false
    setLoading(true)
    const start = new Date()
    start.setDate(start.getDate() - (periodCfg.days - 1))
    const startIso = `${isoDate(start)}T00:00:00`
    Promise.all([
      db.supabase
        .from('consumed_meals')
        .select('id, meal_name, meal_id, image_url, calories, protein, carbs, fat, consumed_at, amount, per_unit, source')
        .eq('client_id', clientId)
        .gte('consumed_at', startIso)
        .order('consumed_at', { ascending: false }),
      db.supabase
        .from('clients')
        .select('target_calories, target_protein, target_carbs, target_fat')
        .eq('id', clientId)
        .single(),
    ]).then(([mealsRes, clientRes]) => {
      if (cancelled) return
      setMeals(mealsRes.data || [])
      const c = clientRes.data || {}
      setTargets({
        calories: c.target_calories || 0,
        protein:  c.target_protein  || 0,
        carbs:    c.target_carbs    || 0,
        fat:      c.target_fat      || 0,
      })
    }).catch(err => {
      console.error('History load failed:', err)
      if (!cancelled) setMeals([])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [isOpen, db, clientId, period, periodCfg.days])

  // Aggregate
  const days = useMemo(() => {
    const byDate = groupByDate(meals)
    return fillDateRange(byDate, periodCfg.days)
  }, [meals, periodCfg.days])

  const totals = useMemo(() => {
    const loggedDays = days.filter(d => d.totals.calories > 0)
    if (loggedDays.length === 0) {
      return { avgKcal: 0, avgP: 0, avgC: 0, avgF: 0, loggedDays: 0 }
    }
    const sum = loggedDays.reduce((s, d) => ({
      kcal: s.kcal + d.totals.calories,
      p:    s.p    + d.totals.protein,
      c:    s.c    + d.totals.carbs,
      f:    s.f    + d.totals.fat,
    }), { kcal: 0, p: 0, c: 0, f: 0 })
    return {
      avgKcal: Math.round(sum.kcal / loggedDays.length),
      avgP:    Math.round(sum.p    / loggedDays.length),
      avgC:    Math.round(sum.c    / loggedDays.length),
      avgF:    Math.round(sum.f    / loggedDays.length),
      loggedDays: loggedDays.length,
    }
  }, [days])

  const compliance = useMemo(
    () => computeCompliance(days, targets.calories),
    [days, targets.calories]
  )

  // ESC + body lock
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        zIndex: 10500, animation: 'histFadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '600px', width: '100%',
          margin: '0 auto', background: '#0a0a0a', overflow: 'hidden',
        }}
      >
        {/* ── Top bar — period selector + close ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 0.75rem',
          borderBottom: `1px solid ${G.border}`,
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', flex: 1, gap: '0.25rem',
            padding: '0.2rem',
            background: G.bg,
            border: `1px solid ${G.border}`,
            borderRadius: '8px',
          }}>
            {PERIODS.map(p => {
              const active = period === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.5rem',
                    background: active ? G.bgStrong : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: active ? G.primary : G.textDim,
                    fontSize: '0.65rem', fontWeight: active ? 800 : 600,
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '30px',
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: G.bg,
              border: `1px solid ${G.border}`,
              borderRadius: '8px', color: G.primary,
              cursor: 'pointer', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Hero — averages + sparkline + compliance ── */}
        <div style={{
          padding: isMobile ? '1rem 1rem 0.875rem' : '1.25rem 1.5rem 1rem',
          borderBottom: `1px solid ${G.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: '0.5rem', fontWeight: 800, color: G.primary,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            marginBottom: '0.5rem',
          }}>
            Gemiddeld per dag
          </div>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '0.4rem',
            marginBottom: '0.6rem',
          }}>
            <span style={{
              fontSize: isMobile ? '2rem' : '2.4rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {fmtNL(totals.avgKcal)}
            </span>
            <span style={{ fontSize: '0.75rem', color: G.textDim, fontWeight: 600 }}>
              kcal · {totals.avgP}g E · {totals.avgC}g K · {totals.avgF}g V
            </span>
          </div>

          <Sparkline days={days} target={targets.calories} height={36} />

          {targets.calories > 0 && (
            <div style={{
              marginTop: '0.625rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.7rem', fontWeight: 600, color: G.textDim,
            }}>
              <Award size={12} color={compliance.pct >= 70 ? G.good : G.primary} />
              <span style={{ color: '#fff', fontWeight: 800 }}>
                {compliance.hit}/{compliance.total}
              </span>
              <span>dagen binnen kcal-doel</span>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${G.primary}` : '2px solid transparent',
                  color: active ? '#fff' : G.textFaint,
                  fontSize: '0.7rem',
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <TabIcon size={13} />{tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <Empty>Laden…</Empty>
          ) : (
            <>
              {activeTab === 'logboek'  && <LogboekTab  days={days} isMobile={isMobile} />}
              {activeTab === 'stats'    && <StatsTab    days={days} targets={targets} isMobile={isMobile} />}
              {activeTab === 'patronen' && <PatronenTab meals={meals} isMobile={isMobile} />}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes histFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
