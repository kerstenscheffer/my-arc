// src/modules/meal-plan/components/MacroHero.jsx
//
// Compact "budget-dashboard". Drie niveaus van hiërarchie:
//
//   HELD 1  Ring (links) — fill = wat hij gegeten heeft (consumed/target).
//           In het midden van de ring: groot "remaining" + klein "kcal over".
//           Zo ziet hij zijn budget slinken, niet zijn verbruik stijgen.
//   HELD 2  Eiwit (rechts naast ring) — groot "nog Xg" + label EIWIT + balk.
//   SUBTIEL Koolhydraten + vetten op één gedempte regel eronder.
//
// Dag/Week-tabs zijn weggehaald — week-gem zit nu in MealDaySummaryModal.

import React, { useEffect, useState } from 'react'
import MacroBoxes from '../../../client/components/MacroBoxes'

const G = {
  primary:   '#FFD700',
  secondary: '#D4AF37',
  textDim:   'rgba(255, 255, 255, 0.45)',
  textFaint: 'rgba(255, 255, 255, 0.25)',
  trackBg:   'rgba(255, 215, 0, 0.08)',
  over:      '#ef4444',
}

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')

// Fetch totals for a specific day (used when looking at a non-today day).
const fetchDayTotals = async (db, clientId, dateStr) => {
  if (!db?.supabase || !clientId || !dateStr) return null
  // Use next-day midnight as upper bound to include the full last second.
  const [yr, mo, dy] = dateStr.split('-').map(Number)
  const nd = new Date(yr, mo - 1, dy + 1)
  const nextDateStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`
  const { data, error } = await db.supabase
    .from('consumed_meals')
    .select('calories, protein, carbs, fat')
    .eq('client_id', clientId)
    .gte('consumed_at', `${dateStr}T00:00:00`)
    .lt('consumed_at', `${nextDateStr}T00:00:00`)
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

// ── Budget ring ───────────────────────────────────────────────────────────
// Vult zich naarmate hij eet (consumed/target). In het midden: het aantal
// kcal dat hij nog over heeft. Bij overschrijding: rode rand + "-X over".
const BudgetRing = ({
  consumed, target, isMobile, showTotal = false, compact = false,
  size: sizeOverride, unit = 'kcal', remainWord = 'over', overWord = 'te veel',
  valueSuffix = '', overIsGood = false,
}) => {
  const size = sizeOverride || (compact ? (isMobile ? 82 : 92) : (isMobile ? 110 : 130))
  const stroke = compact ? (isMobile ? 8 : 9) : (isMobile ? 10 : 12)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0
  const offset = circumference - ratio * circumference
  const remaining = (target || 0) - (consumed || 0)
  const isOver = remaining < 0
  const overBad = isOver && !overIsGood   // rood alleen bij "slecht" over (kcal)

  const remainStr = showTotal
    ? fmt(consumed)
    : (isOver ? `${overIsGood ? '+' : '−'}${fmt(Math.abs(remaining))}` : fmt(remaining))
  const len = (remainStr + valueSuffix).length
  const base = compact ? (isMobile ? 1.15 : 1.3) : (isMobile ? 1.5 : 1.7)
  const scale = sizeOverride ? sizeOverride / (compact ? (isMobile ? 82 : 92) : (isMobile ? 110 : 130)) : 1
  const fontSize = (len >= 5 ? base * 0.78 : len >= 4 ? base * 0.92 : base) * scale
  const gradId = overIsGood ? 'bgrad' : (isOver ? 'bgradOver' : 'bgrad')

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="bgrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFD700" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="bgradOver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFD700" />
            <stop offset="60%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius}
          stroke={G.trackBg} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', textAlign: 'center',
      }}>
        <div style={{
          fontSize: `${fontSize}rem`, fontWeight: 900,
          color: overBad ? G.over : (isOver && overIsGood ? '#10b981' : '#fff'),
          letterSpacing: '-0.025em', lineHeight: 1,
        }}>
          {remainStr}{valueSuffix && <span style={{ fontSize: '0.6em' }}>{valueSuffix}</span>}
        </div>
        <div style={{
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: 700, color: G.textDim,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginTop: 1,
        }}>
          {showTotal ? `${unit} totaal` : `${unit} ${isOver ? overWord : remainWord}`}
        </div>
        {target > 0 && (
          <div style={{
            fontSize: isMobile ? '0.62rem' : '0.7rem',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '-0.01em',
            marginTop: 1,
            display: 'flex', alignItems: 'baseline', gap: 3,
          }}>
            <span style={{
              fontSize: '0.7em', color: G.textFaint, fontWeight: 700,
            }}>van</span>
            {fmt(target)}{valueSuffix}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Eiwit blok — held #2 ─────────────────────────────────────────────────
const ProteinBlock = ({ consumed, target, isMobile, compact = false }) => {
  const remaining = (target || 0) - (consumed || 0)
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  const isOver = remaining < 0
  const remainStr = isOver ? `+${fmt(Math.abs(remaining))}` : fmt(remaining)
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: isMobile ? '0.62rem' : '0.7rem',
        fontWeight: 800, color: G.primary,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 3,
      }}>
        Eiwit
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: compact ? (isMobile ? '1.2rem' : '1.35rem') : (isMobile ? '1.55rem' : '1.85rem'),
          fontWeight: 900,
          color: isOver ? '#10b981' : '#fff',
          letterSpacing: '-0.025em', lineHeight: 1,
        }}>
          {remainStr}<span style={{ fontSize: '0.6em' }}>g</span>
        </span>
        <span style={{
          fontSize: isMobile ? '0.62rem' : '0.7rem',
          fontWeight: 700, color: G.textDim,
        }}>
          {isOver ? 'extra' : 'te gaan'} · doel {fmt(target)}g
        </span>
      </div>
      <div style={{
        height: 7, background: G.trackBg, borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
          borderRadius: 4,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ── Macro-blok (compacte versie, alle 3 macro's even groot) ──
// Toont per macro: label + "X g van Y" + progress bar.
// "X" = huidig (wit, groot), "Y" = doel (subtiel maar zelfde grootte,
// minder felle kleur). Eén regel — geen ruis met sublabels eronder.
const MacroDetailBlock = ({ label, consumed, target, isMobile }) => {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: isMobile ? '0.5rem' : '0.55rem',
        fontWeight: 800, color: G.primary,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 5,
        marginBottom: 5,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        <span style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {fmt(consumed)}<span style={{ fontSize: '0.55em' }}>g</span>
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.32)',
          letterSpacing: '-0.01em', lineHeight: 1,
        }}>
          van {fmt(target)}
        </span>
      </div>
      <div style={{
        height: 5, background: G.trackBg, borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
          borderRadius: 3,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}

// ── Carbs+Vet zwarte balk (hero-variant) ──────────────────────────────────
// Subtiel, compact, op één regel. Toont per macro: label + "X / Y g".
const SubtleCarbsFatBar = ({ carbs, fat, targets, isMobile, compact = false }) => {
  const Cell = ({ label, val, target }) => (
    <div style={{
      flex: 1, minWidth: 0,
      display: 'flex', alignItems: 'baseline', gap: 6,
      whiteSpace: 'nowrap', overflow: 'hidden',
    }}>
      <span style={{
        fontSize: isMobile ? '0.55rem' : '0.62rem',
        fontWeight: 800, color: G.primary,
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{label}</span>
      <span style={{
        fontSize: compact ? (isMobile ? '0.82rem' : '0.9rem') : (isMobile ? '0.95rem' : '1.05rem'),
        fontWeight: 900, color: '#fff',
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {fmt(val)}<span style={{ fontSize: '0.55em' }}>g</span>
      </span>
      <span style={{
        fontSize: isMobile ? '0.6rem' : '0.68rem',
        fontWeight: 700, color: G.textDim,
      }}>/ {fmt(target)}</span>
    </div>
  )
  return (
    <div style={{
      marginTop: isMobile ? 8 : 10,
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      background: '#171717',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '1.2rem',
    }}>
      <Cell label="Koolh" val={carbs} target={targets.carbs || 0} />
      <Cell label="Vet"   val={fat}   target={targets.fat   || 0} />
    </div>
  )
}

export default function MacroHero({
  consumed, targets, db, clientId, isMobile: propMobile,
  selectedDate, selectedIsToday = true,
  variant = 'detail',  // 'hero' = oude stijl (kcal+eiwit groot, koolh/vet zwarte balk),
                       // 'detail' = compacte 3-blok layout (plan-analyzer).
  compact = false,     // kleinere ring + kleinere getallen (bv. home "Planning vandaag").
  // Increment to force a cache clear + re-fetch for the current day
  // (used when a meal is logged or deleted on a past day).
  refreshKey = 0,
}) {
  const isMobile = propMobile ?? window.innerWidth <= 768

  // Per-dag cache voor non-today days.
  const [dayCache, setDayCache] = useState({})
  const [dayLoading, setDayLoading] = useState(false)
  const dateKey = toIsoDate(selectedDate)

  // When refreshKey changes, clear the cached value for the current day
  // so the next effect re-fetches fresh data.
  useEffect(() => {
    if (!dateKey) return
    setDayCache(prev => {
      if (prev[dateKey] === undefined) return prev
      const { [dateKey]: _, ...rest } = prev
      return rest
    })
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
  }, [selectedIsToday, dateKey, db, clientId, dayCache])

  const display = selectedIsToday
    ? (consumed || {})
    : (dayCache[dateKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 })
  const t = targets || {}
  const showShim = !selectedIsToday && dayCache[dateKey] === undefined && dayLoading

  // 'boxes' = de 4 macro-vakken (zelfde als client-home), dag-bewust via `display`.
  if (variant === 'boxes') {
    return (
      <div style={{ padding: isMobile ? '0 0.9rem 0.6rem' : '0 1.5rem 0.7rem', maxWidth: 1400, margin: '0 auto', opacity: showShim ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
        <MacroBoxes consumed={display} targets={t} />
      </div>
    )
  }

  return (
    <div style={{
      padding: compact
        ? (isMobile ? '0.5rem 0.6rem 0.6rem' : '0.6rem 0.75rem 0.7rem')
        : (isMobile ? '0.7rem 0.9rem 0.85rem' : '0.85rem 1.5rem 1rem'),
      maxWidth: 1400, margin: '0 auto',
    }}>
      {showShim ? (
        <div style={{
          padding: '1.6rem 1rem', textAlign: 'center',
          color: G.textFaint, fontSize: '0.75rem',
        }}>
          Daggegevens laden…
        </div>
      ) : variant === 'rings' ? (
        // Twee gelijke ringen naast elkaar: kcal + eiwit.
        (() => {
          const ringSize = compact ? (isMobile ? 104 : 116) : (isMobile ? 124 : 144)
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '1.4rem' : '2rem' }}>
              <BudgetRing
                consumed={display.calories || 0}
                target={t.calories || 0}
                isMobile={isMobile}
                compact={compact}
                size={ringSize}
                unit="kcal"
              />
              <BudgetRing
                consumed={display.protein || 0}
                target={t.protein || 0}
                isMobile={isMobile}
                compact={compact}
                size={ringSize}
                unit="eiwit"
                remainWord="te gaan"
                overWord="gehaald"
                valueSuffix="g"
                overIsGood
              />
            </div>
          )
        })()
      ) : variant === 'hero' ? (
        <>
          {/* Hero-variant (meal-pagina): kcal-ring + groot eiwit op één rij,
              koolh + vet eronder in een zwarte balk — subtiel en compact. */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: isMobile ? '0.8rem' : '1.2rem',
            minWidth: 0,
          }}>
            <BudgetRing
              consumed={display.calories || 0}
              target={t.calories || 0}
              isMobile={isMobile}
              compact={compact}
            />
            <ProteinBlock
              consumed={display.protein || 0}
              target={t.protein || 0}
              isMobile={isMobile}
              compact={compact}
            />
          </div>
          <SubtleCarbsFatBar
            carbs={display.carbs || 0}
            fat={display.fat || 0}
            targets={t}
            isMobile={isMobile}
            compact={compact}
          />
        </>
      ) : (
        <>
          {/* Detail-variant (plan-analyzer): ring + 3 macro-blokken op één rij,
              even groot voor snelle scan tijdens plan-bouwen. */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: isMobile ? '0.7rem' : '1.1rem',
            minWidth: 0,
          }}>
            <BudgetRing
              consumed={display.calories || 0}
              target={t.calories || 0}
              isMobile={isMobile}
              showTotal
            />
            <div style={{
              flex: 1, minWidth: 0,
              display: 'flex',
              gap: isMobile ? '0.55rem' : '0.85rem',
            }}>
              <MacroDetailBlock
                label="Eiwit"
                consumed={display.protein || 0}
                target={t.protein || 0}
                isMobile={isMobile}
              />
              <MacroDetailBlock
                label="Koolh"
                consumed={display.carbs || 0}
                target={t.carbs || 0}
                isMobile={isMobile}
              />
              <MacroDetailBlock
                label="Vet"
                consumed={display.fat || 0}
                target={t.fat || 0}
                isMobile={isMobile}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
