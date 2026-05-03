// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Plus, Eye, EyeOff, Trash2, Edit3, MoreHorizontal, X } from 'lucide-react'

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
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
        minHeight: '44px'
      }}>
        {/* Name + macros */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {meal.meal_name || 'Onbekend'}
            </div>
            {meal.source === 'plan_check' && (
              <div style={{
                fontSize: '0.4rem', fontWeight: '700',
                color: 'rgba(16, 185, 129, 0.5)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                flexShrink: 0
              }}>
                PLAN
              </div>
            )}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.1rem'
          }}>
            {meal.brand ? `${meal.brand}, ` : ''}{formatTime(meal.consumed_at)}
          </div>
        </div>

        {/* Calories */}
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)',
          flexShrink: 0, marginRight: '0.5rem'
        }}>
          {Math.round(meal.calories || 0)}
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

  // Handle plan meal check → auto-log to consumed_meals
  const handlePlanCheck = (meal) => {
    if (onPlanMealLog && !checkedMeals[meal.slot]) {
      // Not checked yet → check it AND log it
      onPlanMealLog(meal)
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
            background: showPlan ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            color: showPlan ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.2)',
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
      {MOMENTS.map((moment, mIdx) => {
        const group = grouped[moment.id]
        // Filter out plan_check entries when plan is visible (they show as MealCard instead)
        const visibleLoggedMeals = showPlan
          ? group.loggedMeals.filter(m => m.source !== 'plan_check')
          : group.loggedMeals
        const hasLogged = visibleLoggedMeals.length > 0
        const hasPlanMeals = group.planMeals.length > 0 && showPlan
        const cal = momentCalories(moment.id)

        return (
          <div key={moment.id}>
            {/* Moment header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.015)',
              borderTop: mIdx > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
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

            {/* "Voedingsmiddel toevoegen" per section */}
            {onOpenFoodLog && (
              <button
                onClick={() => onOpenFoodLog(moment.id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '0.25rem', width: '100%',
                  padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem',
                  background: 'transparent', border: 'none',
                  color: '#10b981',
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '32px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.04)'
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Plus size={11} strokeWidth={2.5} />
                Voedingsmiddel toevoegen
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
