// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Plus, Eye, EyeOff, Trash2, Edit3, MoreHorizontal, X, Apple } from 'lucide-react'

const MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Middageten' },
  { id: 'dinner', label: 'Avondeten' },
  { id: 'snack', label: 'Tussendoortjes' }
]

// Map plan slot names to moments
const slotToMoment = (slot) => {
  const s = (slot || '').toLowerCase()
  if (s.includes('breakfast') || s.includes('ontbijt')) return 'breakfast'
  if (s.includes('lunch') || s.includes('middag')) return 'lunch'
  if (s.includes('dinner') || s.includes('diner') || s.includes('avond')) return 'dinner'
  return 'snack'
}

// Map consumed meal_type to moments
const typeToMoment = (mealType) => {
  const t = (mealType || '').toLowerCase()
  if (t === 'breakfast') return 'breakfast'
  if (t === 'lunch') return 'lunch'
  if (t === 'dinner') return 'dinner'
  return 'snack'
}

// ═══════════════════════════════════════════
// LOGGED MEAL ROW (inline, not separate component)
// ═══════════════════════════════════════════

function LoggedMealRow({ meal, onDelete, onEdit, isMobile }) {
  const [expanded, setExpanded] = useState(false)

  const formatTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
      {/* Main row — SearchTab-inspired clean layout */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0.55rem 1rem' : '0.625rem 1.25rem',
        minHeight: '52px',
        gap: '0.75rem'
      }}>
        {/* Thumbnail — 44x44 with gold apple placeholder */}
        {meal.image_url ? (
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: `url(${meal.image_url}) center/cover, #fff`,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255, 215, 0, 0.55)',
            flexShrink: 0,
          }}>
            <Apple size={20} strokeWidth={1.8} />
          </div>
        )}

        {/* Name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.88rem' : '0.92rem',
              fontWeight: '700', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
              minWidth: 0,
            }}>
              {meal.meal_name || 'Onbekend'}
            </div>
            {meal.source === 'plan_check' && (
              <div style={{
                fontSize: '0.5rem', fontWeight: '700',
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.1)',
                padding: '0.1rem 0.35rem', borderRadius: '4px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                flexShrink: 0
              }}>
                Plan
              </div>
            )}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.15rem',
            fontWeight: '500',
          }}>
            {meal.brand ? `${meal.brand} · ` : ''}{formatTime(meal.consumed_at)}
          </div>
        </div>

        {/* Calories — gold accent */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: '0.15rem',
          flexShrink: 0, marginRight: '0.375rem',
        }}>
          <span style={{
            fontSize: isMobile ? '0.92rem' : '0.95rem',
            fontWeight: '800', color: '#FFD700',
            letterSpacing: '-0.01em',
          }}>
            {Math.round(meal.calories || 0)}
          </span>
          <span style={{
            fontSize: '0.6rem', fontWeight: '600',
            color: 'rgba(255, 215, 0, 0.5)',
          }}>
            kcal
          </span>
        </div>

        {/* More button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: expanded ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: 'none',
            color: expanded ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            flexShrink: 0
          }}
        >
          {expanded ? <X size={12} /> : <MoreHorizontal size={14} />}
        </button>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          display: 'flex', gap: '0.375rem',
          padding: isMobile ? '0 1rem 0.5rem' : '0 1.25rem 0.625rem'
        }}>
          {onEdit && (
            <button
              onClick={() => { onEdit(meal); setExpanded(false) }}
              style={{
                padding: '0.35rem 0.625rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px', color: 'rgba(255,255,255,0.4)',
                fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer', touchAction: 'manipulation',
                display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '28px'
              }}
            >
              <Edit3 size={10} /> Bewerken
            </button>
          )}
          <button
            onClick={() => { onDelete(meal.id); setExpanded(false) }}
            style={{
              padding: '0.35rem 0.625rem',
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.12)',
              borderRadius: '6px', color: 'rgba(239,68,68,0.5)',
              fontSize: '0.6rem', fontWeight: '700',
              cursor: 'pointer', touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '28px'
            }}
          >
            <Trash2 size={10} /> Verwijderen
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function MealTimelineMobile({
  meals = [],
  checkedMeals = {},
  onMealCheck,
  onOpenInfo,
  onOpenAlternatives,
  isToday,
  isMobile,
  consumedMeals = [],
  onOpenFoodLog,
  onDeleteConsumedMeal,
  onEditConsumedMeal,
  onPlanMealLog // NEW: callback when plan meal is checked → auto-log
}) {
  const [showPlan, setShowPlan] = useState(true)

  // Group plan meals by moment
  const grouped = {}
  MOMENTS.forEach(m => { grouped[m.id] = { planMeals: [], loggedMeals: [] } })

  meals.forEach(meal => {
    const moment = slotToMoment(meal.slot)
    if (grouped[moment]) grouped[moment].planMeals.push(meal)
  })

  consumedMeals.forEach(meal => {
    const moment = typeToMoment(meal.meal_type)
    if (grouped[moment]) grouped[moment].loggedMeals.push(meal)
  })

  // Calculate logged calories per moment
  const momentCalories = (momentId) => {
    return grouped[momentId].loggedMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  }

  // Handle plan meal check → auto-log to consumed_meals.
  // CRITICAL: when NEW-logging, only fire `onPlanMealLog` (it handles both
  // the consumed_meals insert + macro update + visual check). Firing
  // `onMealCheck` in addition causes a duplicate macro increment on the
  // DailyTotalsBar. `onMealCheck` only runs on the UNCHECK path.
  const handlePlanCheck = (meal) => {
    if (!checkedMeals[meal.slot] && onPlanMealLog) {
      onPlanMealLog(meal)
      return
    }
    if (onMealCheck) onMealCheck(meal)
  }

  const hasPlan = meals.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Plan toggle ── */}
      {hasPlan && (
        <button
          onClick={() => setShowPlan(!showPlan)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.375rem', width: '100%',
            padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
            background: showPlan ? 'rgba(255, 215, 0, 0.03)' : 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            color: showPlan ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: '600', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '32px'
          }}
        >
          {showPlan ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPlan ? 'Plan verbergen' : 'Plan tonen'}
        </button>
      )}

      {/* ── Per-moment sections ── */}
      {(() => {
        // Track which moment-section is the first that actually renders, so we
        // can skip the top border on it (otherwise we'd get a stray line under
        // the plan-toggle when the early moments are empty).
        let renderedCount = 0
        return MOMENTS.map(moment => {
          const group = grouped[moment.id]
          // Filter out plan_check entries when plan is visible (they show as MealCard instead)
          const visibleLoggedMeals = showPlan
            ? group.loggedMeals.filter(m => m.source !== 'plan_check')
            : group.loggedMeals
          const hasPlanMeals = group.planMeals.length > 0 && showPlan
          // Skip moments that have nothing to show — no per-moment "+ add"
          // button anymore, so an empty header is just noise.
          if (!hasPlanMeals && visibleLoggedMeals.length === 0) return null
          const cal = momentCalories(moment.id)
          const isFirst = renderedCount === 0
          renderedCount += 1

          return (
            <div key={moment.id}>
              {/* Moment header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.015)',
                borderTop: isFirst ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '800', color: '#fff'
                }}>
                  {moment.label}
                </div>
                {cal > 0 && (
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    fontWeight: '800', color: 'rgba(255, 255, 255, 0.35)'
                  }}>
                    {cal}
                  </div>
                )}
              </div>

              {/* Plan meals (when toggle is on) */}
              {hasPlanMeals && group.planMeals.map((meal, idx) => (
                <MealCard
                  key={`plan-${meal.slot}-${idx}`}
                  meal={meal}
                  isChecked={checkedMeals[meal.slot]}
                  onCheck={() => handlePlanCheck(meal)}
                  onInfo={() => onOpenInfo(meal)}
                  onAlternatives={() => onOpenAlternatives(meal)}
                  isMobile={true}
                  isLast={false}
                />
              ))}

              {/* Logged meals (excluding plan_check when plan visible) */}
              {visibleLoggedMeals.map(meal => (
                <LoggedMealRow
                  key={`logged-${meal.id}`}
                  meal={meal}
                  onDelete={onDeleteConsumedMeal}
                  onEdit={onEditConsumedMeal}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )
        })
      })()}

      {/* ── Single central "Voedingsmiddel toevoegen" — no moment pre-set,
            modal infers from time / lets user pick. ── */}
      {onOpenFoodLog && (
        <button
          onClick={() => onOpenFoodLog(null)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.4rem', width: '100%',
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            background: 'rgba(255, 215, 0, 0.05)',
            border: 'none',
            borderTop: '1px solid rgba(255, 215, 0, 0.12)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.12)',
            color: '#FFD700',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            letterSpacing: '-0.005em',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Voedingsmiddel toevoegen
        </button>
      )}
    </div>
  )
}
