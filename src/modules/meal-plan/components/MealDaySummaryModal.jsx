// src/modules/meal-plan/components/MealDaySummaryModal.jsx
//
// Modal die opent bij klik op de dagnaam in MealDayNavHeader.
//
// Inhoud (van boven naar onder):
//   1. Maandagenda — mini-kalender voor de actieve maand, met goud-stipje
//      onder elke dag waar consumed_meals geregistreerd zijn. Klik op een
//      dag → selecteert die dag (alleen binnen huidige week voor nu) +
//      sluit modal.
//   2. Dag-stats — kcal/eiwit/koolhydraten/vet vs targets voor de
//      geselecteerde dag.
//   3. Week-stats — gemiddelde over de laatste 7 dagen.
//   4. "Meer geschiedenis" knop — opent de bestaande AIMealHistoryModal
//      voor de volle reeks (laat de gebruiker dieper graven zonder dat
//      we al die UI dubbel bouwen).

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

const G = {
  primary: '#FFD700',
  dim: 'rgba(255,255,255,0.5)',
  faint: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,215,0,0.18)',
  surface: '#101010',
}

const DAYS_OF_WEEK = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const NL_DAY_SHORT = ['Ma','Di','Wo','Do','Vr','Za','Zo']
const NL_MONTHS = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')

const toIso = (d) => d.toISOString().split('T')[0]

const getTodayIndex = () => {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

const fetchDaysWithMeals = async (db, clientId, year, month) => {
  // month is 0-indexed (Date semantics). Returns Set of ISO date strings
  // that have ≥1 consumed_meal row.
  if (!db?.supabase || !clientId) return new Set()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const startIso = `${toIso(start)}T00:00:00`
  const endIso = `${toIso(end)}T23:59:59`
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('consumed_at')
    .eq('client_id', clientId)
    .gte('consumed_at', startIso)
    .lte('consumed_at', endIso)
  if (error || !data) return new Set()
  return new Set(data.map(r => (r.consumed_at || '').split('T')[0]).filter(Boolean))
}

const fetchTotalsForDate = async (db, clientId, dateStr) => {
  if (!db?.supabase || !clientId) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('calories, protein, carbs, fat')
    .eq('client_id', clientId)
    .gte('consumed_at', `${dateStr}T00:00:00`)
    .lt('consumed_at', `${dateStr}T23:59:59`)
  if (error) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  return (data || []).reduce((t, m) => ({
    calories: t.calories + (m.calories || 0),
    protein:  t.protein  + (parseFloat(m.protein) || 0),
    carbs:    t.carbs    + (parseFloat(m.carbs)   || 0),
    fat:      t.fat      + (parseFloat(m.fat)     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

const fetchWeekAvg = async (db, clientId) => {
  if (!db?.supabase || !clientId) return { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('calories, protein, carbs, fat, consumed_at')
    .eq('client_id', clientId)
    .gte('consumed_at', `${toIso(start)}T00:00:00`)
    .lte('consumed_at', `${toIso(today)}T23:59:59`)
  if (error) return { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  const buckets = {}
  for (const r of data || []) {
    const d = (r.consumed_at || '').split('T')[0]
    if (!d) continue
    if (!buckets[d]) buckets[d] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    buckets[d].calories += r.calories || 0
    buckets[d].protein  += parseFloat(r.protein) || 0
    buckets[d].carbs    += parseFloat(r.carbs)   || 0
    buckets[d].fat      += parseFloat(r.fat)     || 0
  }
  const days = Object.values(buckets)
  if (days.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
  const sum = days.reduce((s, d) => ({
    calories: s.calories + d.calories,
    protein:  s.protein  + d.protein,
    carbs:    s.carbs    + d.carbs,
    fat:      s.fat      + d.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  return {
    calories: sum.calories / days.length,
    protein:  sum.protein  / days.length,
    carbs:    sum.carbs    / days.length,
    fat:      sum.fat      / days.length,
    count:    days.length,
  }
}

function StatRow({ label, value, target, unit = '' }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: G.primary,
        }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
          {fmt(value)}{unit}
          {target > 0 && (
            <span style={{ color: G.dim, fontWeight: 600 }}>
              {' '}/ {fmt(target)}{unit}
            </span>
          )}
        </span>
      </div>
      <div style={{
        height: 5, background: 'rgba(255,215,0,0.08)', borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg,#FFD700 0%,#D4AF37 100%)',
          borderRadius: 3, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

export default function MealDaySummaryModal({
  isOpen, onClose,
  db, clientId,
  selectedDay,        // 'today' | weekday key
  onDayChange,        // (newKey) => void — kalender-klik
  onOpenFullHistory,  // () => void  — opent AIMealHistoryModal
  targets = {},       // { calories, protein, carbs, fat }
  isMobile: propMobile,
}) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  const [year,  setYear]  = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [daysSet, setDaysSet] = useState(new Set())
  const [dayTotals, setDayTotals] = useState(null)
  const [weekTotals, setWeekTotals] = useState(null)

  const todayIdx = getTodayIndex()
  const selIdx = selectedDay === 'today' || !selectedDay
    ? todayIdx
    : Math.max(0, DAYS_OF_WEEK.indexOf(selectedDay))
  const selectedDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + (selIdx - todayIdx))
    return d
  })()

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetchDaysWithMeals(db, clientId, year, month).then(set => {
      if (!cancelled) setDaysSet(set)
    })
    return () => { cancelled = true }
  }, [isOpen, db, clientId, year, month])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetchTotalsForDate(db, clientId, toIso(selectedDate)).then(t => {
      if (!cancelled) setDayTotals(t)
    })
    fetchWeekAvg(db, clientId).then(t => {
      if (!cancelled) setWeekTotals(t)
    })
    return () => { cancelled = true }
  }, [isOpen, db, clientId, selectedDay])

  if (!isOpen) return null

  // Build calendar grid for the visible month.
  const grid = useMemo(() => {
    const first = new Date(year, month, 1)
    // Maandag = 0
    const firstWeekday = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const onPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const onNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Klik op kalenderdag → switch dag (binnen huidige week voor nu),
  // anders alleen visueel benadrukken zonder switch.
  const handleDayClick = (d) => {
    if (!d) return
    const clicked = new Date(year, month, d)
    const today = new Date(); today.setHours(0,0,0,0)
    const start = new Date(today); start.setDate(today.getDate() - todayIdx)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    if (clicked >= start && clicked <= end) {
      const dow = (clicked.getDay() + 6) % 7
      onDayChange?.(DAYS_OF_WEEK[dow])
      onClose?.()
    }
    // anders: out-of-week, doe niets (later kunnen we hier full history-jump bouwen)
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147482000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 520,
          maxHeight: isMobile ? '92vh' : '88vh',
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: isMobile ? '18px 18px 0 0' : 18,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: '0.95rem', fontWeight: 800, color: G.primary,
          }}>
            Agenda & samenvatting
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {/* ── Maandagenda ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <button
              onClick={onPrevMonth}
              style={{
                width: 30, height: 30, borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: G.dim, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <div style={{
              fontSize: '0.85rem', fontWeight: 800, color: '#fff',
              textTransform: 'capitalize',
            }}>
              {NL_MONTHS[month]} {year}
            </div>
            <button
              onClick={onNextMonth}
              style={{
                width: 30, height: 30, borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: G.dim, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4, marginBottom: 4,
          }}>
            {NL_DAY_SHORT.map(d => (
              <div key={d} style={{
                fontSize: '0.55rem', fontWeight: 700,
                color: G.faint, textAlign: 'center',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{d}</div>
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4, marginBottom: 18,
          }}>
            {grid.map((d, i) => {
              if (!d) return <div key={i} />
              const iso = toIso(new Date(year, month, d))
              const hasData = daysSet.has(iso)
              const isToday = iso === toIso(new Date())
              const isSelected = iso === toIso(selectedDate)
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(d)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 2,
                    background: isSelected ? 'rgba(255,215,0,0.16)' : 'transparent',
                    border: isToday
                      ? '1px solid #FFD700'
                      : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: 7,
                    color: isSelected ? '#FFD700' : '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  {d}
                  {hasData && (
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#FFD700',
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Dag stats ── */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: G.dim, marginBottom: 10,
            }}>
              Dag — {selectedDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            </div>
            <StatRow label="Kcal"    value={dayTotals?.calories || 0} target={targets.calories} />
            <StatRow label="Eiwit"   value={dayTotals?.protein  || 0} target={targets.protein}  unit=" g" />
            <StatRow label="K.hydr." value={dayTotals?.carbs    || 0} target={targets.carbs}    unit=" g" />
            <StatRow label="Vet"     value={dayTotals?.fat      || 0} target={targets.fat}      unit=" g" />
          </div>

          {/* ── Week stats (gemiddelde) ── */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: G.dim, marginBottom: 10,
            }}>
              Week (gem.) — {weekTotals?.count || 0} dag{(weekTotals?.count || 0) === 1 ? '' : 'en'} data
            </div>
            <StatRow label="Kcal"    value={weekTotals?.calories || 0} target={targets.calories} />
            <StatRow label="Eiwit"   value={weekTotals?.protein  || 0} target={targets.protein}  unit=" g" />
            <StatRow label="K.hydr." value={weekTotals?.carbs    || 0} target={targets.carbs}    unit=" g" />
            <StatRow label="Vet"     value={weekTotals?.fat      || 0} target={targets.fat}      unit=" g" />
          </div>

          {/* ── Meer geschiedenis ── */}
          {onOpenFullHistory && (
            <button
              onClick={() => { onOpenFullHistory(); onClose?.() }}
              style={{
                width: '100%',
                minHeight: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 12,
                color: G.primary,
                fontSize: '0.88rem', fontWeight: 800,
                cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              Meer geschiedenis & details
              <ArrowRight size={16} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
