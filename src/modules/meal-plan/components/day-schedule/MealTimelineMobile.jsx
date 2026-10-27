// src/modules/meal-plan/components/day-schedule/MealTimelineMobile.jsx
// 🎯 v5.0 - Unified timeline with plan toggle + per-moment sections
// Plan toggle: show/hide plan meals as reference
// Plan afvinken → auto-log to consumed_meals
// Logged meals: edit/delete
// "Voedingsmiddel toevoegen" per section
import React, { useState } from 'react'
import MealCard from './MealCard'
import { Trash2, Edit3, Info, Check, Plus, Sunrise, Salad, Apple, UtensilsCrossed, Zap, Pill, ChevronDown } from 'lucide-react'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'
import { useProductFotos } from '../../../supplements/utils/productFoto'

// Icoon per vast moment voor een lege plek in de tijdlijn.
const LEEG_ICOON = { breakfast: Sunrise, lunch: Salad, snack1: Apple, dinner: UtensilsCrossed, pre_workout: Zap }

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
  onVerwijderMeal = null,
  isToday,
  consumedMeals = [],
  onOpenFoodLog,
  onDeleteConsumedMeal,
  onEditConsumedMeal,
  onPlanMealLog, // NEW: callback when plan meal is checked → auto-log
  supplementenPerMoment = {},
  supplementLogs,
  onSupplementCheck,
  onSupplementInfo,
  // Vaste momenten die vandaag ontbreken: [{ slot, label, min }]. Een lege
  // plek met "+ toevoegen" (opent het wisselscherm als toevoegen).
  legeMomenten = [],
  onVoegToe = null,
}) {
  const [showPlan, setShowPlan] = useState(true)
  const productFotos = useProductFotos()

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
  // Welke maaltijden staan er vandaag in het plan? Daar vergelijken we de
  // gelogde rijen mee.
  const planIds = new Set(meals.map(m => m.meal_id || m.id).filter(Boolean))
  ;(consumedMeals || []).forEach(meal => {
    // Een afgevinkte plan-maaltijd staat al als kaart in de lijst; hem hier
    // nog eens tonen zou hetzelfde eten twee keer laten zien.
    //
    // Maar alleen als hij er nog ín staat. Wissel je van dag nadat je iets
    // hebt afgevinkt, dan hoort wat je at gewoon zichtbaar te blijven —
    // anders verdwijnt het van het scherm terwijl het wel meetelt in je
    // dagtotalen.
    const staatInPlan = meal.meal_id ? planIds.has(meal.meal_id) : true
    if (showPlan && meal.source === 'plan_check' && staatInPlan) return
    items.push({
      soort: 'gelogd', sleutel: `logged-${meal.id}`, data: meal,
      min: tijdVanGelogd(meal) ?? 12 * 60,
    })
  })
  // Supplementen niet meer tussen de maaltijden (dat maakte de pagina druk,
  // 27 okt 2026) maar in één inklapbaar blok onderaan, op tijd.
  const supplementen = Object.values(supplementenPerMoment || {}).flat()
    .map(sp => ({ sp, min: Number.isFinite(sp.sorteerMin) ? sp.sorteerMin : 12 * 60 }))
    .sort((a, b) => a.min - b.min)
  const genomen = supplementen.filter(x => supplementLogs?.has?.(x.sp.id)).length
  const [suppOpen, setSuppOpenRuw] = useState(() => { try { return localStorage.getItem('myarc_supp_open') === '1' } catch { return false } })
  const setSuppOpen = (v) => { setSuppOpenRuw(v); try { localStorage.setItem('myarc_supp_open', v ? '1' : '0') } catch { /* geen opslag */ } }

  if (onVoegToe) (legeMomenten || []).forEach(p => items.push({
    soort: 'leeg', sleutel: `leeg-${p.slot}`, data: p, min: p.min,
  }))

  // Bij een gelijke tijd eerst het plan, dan het supplement, dan wat er
  // gelogd is — zo staat de bedoeling boven de uitvoering.
  const RANG = { plan: 0, leeg: 0, supplement: 1, gelogd: 2 }
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
              onVerwijder={onVerwijderMeal ? () => onVerwijderMeal(meal) : null}
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
              gegeten
              isMobile={true}
              acties={[
                { icon: <Edit3 size={11} />, label: 'Bewerken', onClick: () => onEditConsumedMeal?.(g) },
                { icon: <Trash2 size={11} />, label: 'Verwijderen', onClick: () => onDeleteConsumedMeal?.(g.id), kleur: 'rgba(239,68,68,0.85)' },
              ]}
            />
          )
        }

        // Lege plek: dit vaste moment staat niet (meer) in het plan. Een
        // grijze maaltijdkaart met het icoon van het moment op de fotoplek.
        if (item.soort === 'leeg') {
          const p = item.data
          const Icoon = LEEG_ICOON[p.slot] || LEEG_ICOON.snack1
          return (
            <button key={item.sleutel} onClick={() => onVoegToe?.(p)} style={{
              margin: '0 0.9rem 0.55rem', minHeight: 56, borderRadius: 12, padding: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'stretch', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <div style={{
                width: 60, flexShrink: 0, background: 'rgba(255,255,255,0.05)', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)',
              }}>
                <Icoon size={20} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0.8rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{p.label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{klok(p.min)} · nog niets gepland</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.9rem', color: '#fff' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={15} strokeWidth={3} />
                </span>
              </div>
            </button>
          )
        }

        // Supplement — dezelfde kaart als een maaltijd, de dosering grijs
        // achter de naam (op dezelfde regel) en de tijd op de foto.
        const sp = item.data
        const afgevinkt = !!supplementLogs?.has?.(sp.id)
        return (
          <MealCard
            key={item.sleutel}
            meal={{ name: sp.naam, image_url: productFotos[sp.id] || supplementFoto(sp, 240) }}
            productFoto={!!productFotos[sp.id]}
            momentLabel="Supplement"
            tijdLabel={Number.isFinite(item.min) ? klok(item.min) : null}
            naNaam={sp.dosering || null}
            isChecked={afgevinkt}
            isMobile={true}
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

      {/* Supplementen: één blok onderaan, standaard dicht, met voortgang. */}
      {supplementen.length > 0 && (
        <div style={{ margin: '0.4rem 0.9rem 0.6rem', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <button onClick={() => setSuppOpen(!suppOpen)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.9rem',
            background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Pill size={17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900 }}>Supplementen</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 900, color: genomen === supplementen.length ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {genomen === supplementen.length && <Check size={14} strokeWidth={3} />}
              {genomen}/{supplementen.length}
            </span>
            <ChevronDown size={16} strokeWidth={2.8} style={{ transition: 'transform 0.15s ease', transform: suppOpen ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
          </button>
          {suppOpen && supplementen.map(({ sp, min }) => {
            const af = !!supplementLogs?.has?.(sp.id)
            return (
              <div key={sp.id} onClick={() => onSupplementInfo?.(sp)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.9rem',
                borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
              }}>
                <span style={{ width: 40, flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{klok(min)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 800, color: af ? 'rgba(255,255,255,0.45)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: af ? 'line-through' : 'none' }}>
                  {sp.naam}
                  {sp.dosering && <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginLeft: 6, textDecoration: 'none' }}>{sp.dosering}</span>}
                </span>
                <button onClick={(e) => { e.stopPropagation(); onSupplementCheck?.(sp) }} aria-label={af ? 'Genomen' : 'Afvinken'} style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%', padding: 0,
                  background: af ? '#fff' : 'transparent', border: `1.5px solid ${af ? '#fff' : 'rgba(255,255,255,0.35)'}`,
                  color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{af && <Check size={14} strokeWidth={3} />}</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Wijde gele "Voedingsmiddel toevoegen" knop weggehaald —
          de floating FAB rechtsonder is de enige log-actie op de pagina. */}
    </div>
  )
}
