// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Plus, Eye, EyeOff, Trash2, Edit3, MoreHorizontal, X, Apple, Info, Check } from 'lucide-react'
import { foodImageFallback } from '../../foodImageFallback'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'

// De indeling in Ontbijt / Lunch / Diner / Tussendoortjes is vervallen: de
// lijst staat nu op kloktijd. Daarmee zijn ook de mappers weg die een slot
// naar zo'n vak vertaalden — alles wat geen ontbijt, lunch of diner heette
// belandde daarin, en dat zette een kwark van 09:30 onder het avondeten.

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
  supplementLogs,
  onSupplementCheck,
  onSupplementInfo,
}) {
  const [showPlan, setShowPlan] = useState(true)

  // Eén lijst op kloktijd, geen groepen per moment.
  //
  // Hiervoor stond alles in vier vakken: Ontbijt, Lunch, Diner en
  // Tussendoortjes. Alles wat niet een van de eerste drie was viel in dat
  // laatste vak, onderaan de pagina — een kwark om 09:30 stond daardoor
  // ónder het avondeten, en een pre-workout maaltijd om 06:20 helemaal
  // onderaan. Op een dagoverzicht wil je zien wat er ná elkaar komt.
  //
  // Alles wat een tijd heeft doet mee: plan-maaltijden, wat de klant zelf
  // logde, en supplementen.
  const minutenVan = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 60)
    const m = /^\s*(\d{1,2}):(\d{2})/.exec(String(v || ''))
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null
  }
  const tijdVanGelogd = (m) => {
    if (!m?.consumed_at) return null
    const d = new Date(m.consumed_at)
    return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes()
  }

  const items = []
  meals.forEach((meal, i) => items.push({
    soort: 'plan', sleutel: `plan-${meal.slot}-${i}`, data: meal,
    // plannedTime is de bron: die is voor de pre-workout maaltijd al
    // omgerekend naar de trainingstijd. timing is de terugval.
    min: minutenVan(meal.plannedTime) ?? minutenVan(meal.timing) ?? 12 * 60,
  }))
  ;(consumedMeals || []).forEach(meal => {
    // Een afgevinkte plan-maaltijd staat al als kaart in de lijst; hem hier
    // nog eens tonen zou hetzelfde eten twee keer laten zien.
    if (showPlan && meal.source === 'plan_check') return
    items.push({
      soort: 'gelogd', sleutel: `logged-${meal.id}`, data: meal,
      min: tijdVanGelogd(meal) ?? 12 * 60,
    })
  })
  Object.values(supplementenPerMoment || {}).flat().forEach(sp => items.push({
    soort: 'supplement', sleutel: `supp-${sp.id}`, data: sp,
    min: Number.isFinite(sp.sorteerMin) ? sp.sorteerMin : 12 * 60,
  }))

  // Bij een gelijke tijd eerst het plan, dan het supplement, dan wat er
  // gelogd is — zo staat de bedoeling boven de uitvoering.
  const RANG = { plan: 0, supplement: 1, gelogd: 2 }
  items.sort((a, b) => (a.min - b.min) || (RANG[a.soort] - RANG[b.soort]))

  const klok = (min) =>
    `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

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


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* "Plan verbergen / Plan tonen" toggle weggehaald — was ruis
          tussen dag-navigatie en eerste maaltijd. Plan staat altijd aan. */}

      {/* ── Alles op tijd, van vroeg naar laat ── */}
      {items.map(item => {
        if (item.soort === 'plan') {
          const meal = item.data
          return (
            <MealCard
              key={item.sleutel}
              meal={meal}
              isChecked={checkedMeals[meal.slot]}
              onCheck={() => handlePlanCheck(meal)}
              onInfo={() => onOpenInfo(meal)}
              onAlternatives={() => onOpenAlternatives(meal)}
              isMobile={true}
              isLast={false}
            />
          )
        }

        if (item.soort === 'gelogd') {
          return (
            <LoggedMealRow
              key={item.sleutel}
              meal={item.data}
              onDelete={onDeleteConsumedMeal}
              onEdit={onEditConsumedMeal}
              isMobile={isMobile}
            />
          )
        }

        // Supplement — zelfde beeldtaal als een maaltijdkaart, met de tijd
        // erbij zodat je ziet waarom hij hier staat.
        const sp = item.data
        const afgevinkt = !!supplementLogs?.has?.(sp.id)
        return (
          <div key={item.sleutel} style={{
            margin: isMobile ? '0 0.9rem 0.55rem' : '0 1.25rem 0.7rem',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            overflow: 'hidden',
            opacity: afgevinkt ? 0.55 : 1,
            transition: 'opacity 0.2s ease',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
              <div style={{
                width: isMobile ? 70 : 80, height: isMobile ? 70 : 80, flexShrink: 0,
                background: `url(${supplementFoto(sp, 160)}) center/cover`,
                position: 'relative',
              }}>
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
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6,
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 800,
                    color: '#FFD700', letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    Supplement
                  </span>
                  {Number.isFinite(item.min) && (
                    <span style={{
                      fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 800,
                      color: 'rgba(255,255,255,0.35)', flexShrink: 0,
                    }}>{klok(item.min)}</span>
                  )}
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

            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => onSupplementInfo?.(sp)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: isMobile ? '0.5rem' : '0.55rem',
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
                fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <Info size={12} /> Info
              </button>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', alignSelf: 'stretch' }} />
              <button onClick={() => onSupplementCheck?.(sp)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: isMobile ? '0.5rem' : '0.55rem',
                background: 'transparent', border: 'none',
                color: afgevinkt ? '#10b981' : 'rgba(255,255,255,0.5)',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <Check size={12} /> {afgevinkt ? 'Genomen' : 'Afronden'}
              </button>
            </div>
          </div>
        )
      })}

      {/* Wijde gele "Voedingsmiddel toevoegen" knop weggehaald —
          de floating FAB rechtsonder is de enige log-actie op de pagina. */}
    </div>
  )
}
