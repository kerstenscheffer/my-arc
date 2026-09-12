// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Trash2, Edit3, Info, Check } from 'lucide-react'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'

// Label van het moment waarop iets gelogd is, voor op de foto van de kaart.
const MOMENT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack: 'Tussendoortje', snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3',
}

// De indeling in Ontbijt / Lunch / Diner / Tussendoortjes is vervallen: de
// lijst staat nu op kloktijd. Daarmee zijn ook de mappers weg die een slot
// naar zo'n vak vertaalden — alles wat geen ontbijt, lunch of diner heette
// belandde daarin, en dat zette een kwark van 09:30 onder het avondeten.

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
          // Zelfde kaart als een plan-maaltijd, alleen met andere knoppen:
          // wat je zelf logt hoef je niet af te vinken of te wisselen.
          const g = item.data
          return (
            <MealCard
              key={item.sleutel}
              meal={{
                name: g.meal_name || g.name || g.product_name || 'Gelogd',
                image_url: g.image_url,
                slot: g.meal_type,
                calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat,
              }}
              momentLabel={g.brand || MOMENT_LABEL[g.meal_type] || 'Gelogd'}
              tijdLabel={klok(item.min)}
              isMobile={isMobile !== false}
              acties={[
                { icon: <Edit3 size={11} />, label: 'Bewerken', onClick: () => onEditConsumedMeal?.(g) },
                { icon: <Trash2 size={11} />, label: 'Verwijderen', onClick: () => onDeleteConsumedMeal?.(g.id), kleur: 'rgba(239,68,68,0.85)' },
              ]}
            />
          )
        }

        // Supplement — nu letterlijk dezelfde kaart als een maaltijd, met de
        // dosering op de plek van de macro's en de tijd op de foto.
        const sp = item.data
        const afgevinkt = !!supplementLogs?.has?.(sp.id)
        return (
          <MealCard
            key={item.sleutel}
            meal={{ name: sp.naam, image_url: supplementFoto(sp, 240) }}
            momentLabel="Supplement"
            tijdLabel={Number.isFinite(item.min) ? klok(item.min) : null}
            ondertitel={sp.dosering || null}
            isChecked={afgevinkt}
            isMobile={isMobile !== false}
            onCheck={() => onSupplementCheck?.(sp)}
            acties={[
              { icon: <Info size={11} />, label: 'Info', onClick: () => onSupplementInfo?.(sp) },
              {
                icon: <Check size={11} strokeWidth={2.6} />,
                label: afgevinkt ? 'Genomen' : 'Afronden',
                onClick: () => onSupplementCheck?.(sp),
                checked: afgevinkt,
              },
            ]}
          />
        )
      })}

      {/* Wijde gele "Voedingsmiddel toevoegen" knop weggehaald —
          de floating FAB rechtsonder is de enige log-actie op de pagina. */}
    </div>
  )
}
