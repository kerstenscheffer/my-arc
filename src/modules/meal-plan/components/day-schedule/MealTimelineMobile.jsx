// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Plus, Eye, EyeOff, Trash2, Edit3, MoreHorizontal, X, Apple } from 'lucide-react'
import { foodImageFallback } from '../../foodImageFallback'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'

const MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Diner' },
  { id: 'snack', label: 'Tussendoortjes' }
]

// Map plan slot names to moments.
// display_label (set by coach in plan-analyzer) is checked first so a meal
// explicitly labelled 'Diner' groups into the Diner section even when its
// underlying slot key is 'lunch'.
const slotToMoment = (slot, displayLabel) => {
  const dl = (displayLabel || '').toLowerCase()
  if (dl === 'ontbijt' || dl.includes('breakfast')) return 'breakfast'
  if (dl === 'lunch' || dl.includes('middag')) return 'lunch'
  if (dl === 'diner' || dl.includes('dinner') || dl.includes('avond')) return 'dinner'
  if (dl === 'snack' || dl.includes('tussendoor')) return 'snack'
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
        {/* Thumbnail — 44x44; eigen foto of titel-gebaseerde fallback
            (kwark -> zuivel, kip -> kip, enz.) i.p.v. een appel-icoon. */}
        <div style={{
          width: '44px', height: '44px',
          borderRadius: '12px',
          background: `url(${meal.image_url || foodImageFallback(meal.name || meal.title || meal.product_name, meal.meal_type, 88)}) center/cover, #111`,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }} />

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
  onPlanMealLog, // NEW: callback when plan meal is checked → auto-log
  supplementenPerMoment = {},
}) {
  const [showPlan, setShowPlan] = useState(true)

  // Group plan meals by moment
  const grouped = {}
  MOMENTS.forEach(m => { grouped[m.id] = { planMeals: [], loggedMeals: [] } })

  meals.forEach(meal => {
    const moment = slotToMoment(meal.slot, meal.display_label)
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
      {/* "Plan verbergen / Plan tonen" toggle weggehaald — was ruis
          tussen dag-navigatie en eerste maaltijd. Plan staat altijd aan. */}

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
          const supps = supplementenPerMoment[moment.id] || []
          // Skip moments that have nothing to show — no per-moment "+ add"
          // button anymore, so an empty header is just noise. Supplementen
          // tellen mee: een moment met alleen een pil hoort ook te verschijnen.
          if (!hasPlanMeals && visibleLoggedMeals.length === 0 && supps.length === 0) return null
          const cal = momentCalories(moment.id)
          const isFirst = renderedCount === 0
          renderedCount += 1

          return (
            <div key={moment.id}>
              {/* Moment header — geen achtergrond/borders meer, valt nu
                  losjes boven de zwevende kaarten. Iets meer ruimte boven
                  zodat groepen visueel uit elkaar liggen. */}
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: isMobile
                  ? `${isFirst ? '0.55rem' : '0.85rem'} 1.1rem 0.4rem`
                  : `${isFirst ? '0.65rem' : '1rem'} 1.5rem 0.5rem`,
              }}>
                <div style={{
                  fontSize: isMobile ? '0.78rem' : '0.85rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.85)',
                  letterSpacing: '-0.01em',
                }}>
                  {moment.label}
                </div>
                {cal > 0 && (
                  <div style={{
                    fontSize: isMobile ? '0.62rem' : '0.68rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.3)',
                  }}>
                    {cal} kcal
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

              {/* Supplementen op dit moment, in dezelfde vorm als een
                  maaltijdkaart: foto links, naam en dosering ernaast. Als
                  smalle regel met een emoji-tegeltje vielen ze visueel buiten
                  de lijst terwijl ze er gewoon bij horen.

                  Geen afvinkknop: dat bestaat nog nergens voor supplementen,
                  en een knop die niets doet is erger dan geen knop. */}
              {supps.map(sp => (
                <div key={`supp-${sp.id}`} style={{
                  margin: isMobile ? '0 0.9rem 0.55rem' : '0 1.25rem 0.7rem',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'stretch', minWidth: 0,
                }}>
                  <div style={{
                    width: isMobile ? 70 : 80, height: isMobile ? 70 : 80, flexShrink: 0,
                    background: `url(${supplementFoto(sp, 160)}) center/cover`,
                    position: 'relative',
                  }}>
                    {/* Klein gouden hoekje met de emoji: zo blijft zichtbaar
                        dat dit een supplement is en geen maaltijd. */}
                    <div style={{
                      position: 'absolute', left: 4, top: 4,
                      width: 20, height: 20, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.65)', fontSize: '0.7rem',
                    }}>{sp.emoji}</div>
                  </div>

                  <div style={{
                    flex: 1, minWidth: 0,
                    padding: isMobile ? '0.5rem 0.6rem' : '0.6rem 0.75rem',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
                  }}>
                    <div style={{
                      fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 800,
                      color: '#FFD700', letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                      Supplement
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.9rem' : '0.98rem', fontWeight: 800, color: '#fff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {sp.naam}
                    </div>
                    {sp.dosering && (
                      <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
                        {sp.dosering}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Wijde gele "Voedingsmiddel toevoegen" knop weggehaald —
          de floating FAB rechtsonder is de enige log-actie op de pagina. */}
    </div>
  )
}
