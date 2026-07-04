// src/modules/meal-plan/components/AIDaySchedule.jsx
// 🎯 v3.1 - Edit consumed meal support added
// ✅ FOOD LOG: Loads consumed_meals, combined totals, log button
// ✅ EDIT: editingMeal state + FoodLogModal editMeal prop
import React, { useState, useEffect } from 'react'
import DayScheduleHeader from './day-schedule/DayScheduleHeader'
import DaySelector from './day-schedule/DaySelector'
import DailyTotalsBar from './day-schedule/DailyTotalsBar'
import MealTimelineMobile from './day-schedule/MealTimelineMobile'
import DayTemplatePickerModal from './DayTemplatePickerModal'
import FoodLogModal from './food-log/FoodLogModal'
import MealLoggingService from '../../meal-logging-wizard/MealLoggingService'

const getTodayIndex = () => {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

const daysOfWeek = [
  { id: 0, name: 'Ma', key: 'monday' },
  { id: 1, name: 'Di', key: 'tuesday' },
  { id: 2, name: 'Wo', key: 'wednesday' },
  { id: 3, name: 'Do', key: 'thursday' },
  { id: 4, name: 'Vr', key: 'friday' },
  { id: 5, name: 'Za', key: 'saturday' },
  { id: 6, name: 'Zo', key: 'sunday' }
]

export default function AIDaySchedule({
  activePlan, todayMeals, todayProgress, selectedDay, onDayChange,
  onCheckMeal, onUncheckMeal, onOpenInfo, onOpenAlternatives,
  dayTemplates = [], db, onPlanUpdate, dailyTotals,
  // ✅ FOOD LOG: New props from AIMealDashboard
  client, onMealLogged, targets,
  // ✅ OVERHAUL: View mode — 'plan' (default, show plan slots) | 'free' (logging only)
  mode = 'plan',
  // ✅ OVERHAUL: hide internal day picker + totals bar when dashboard renders
  // its own at page-level (so they don't appear twice).
  hideDayPicker = false,
  hideTotalsBar = false,
  // Trigger-teller die de FoodLogModal opent — telt mee zodra de FAB
  // in AIMealDashboard wordt aangeraakt. Geeft een minimaal interface
  // tussen ouder en kind zonder de showFoodLog-state op te tillen.
  foodLogTrigger = 0,
  // Callback waarmee AIMealDashboard op de hoogte gesteld wordt als een
  // verleden-dag-log gewijzigd is (zodat MacroHero-cache ongeldig gemaakt wordt).
  onPastDayUpdate,
}) {
  const isFreeMode = mode === 'free'
  const isMobile = window.innerWidth <= 768
  const [currentDay, setCurrentDay] = useState(getTodayIndex())
  const [displayMeals, setDisplayMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [checkedMeals, setCheckedMeals] = useState({})
  const [showApplyTemplate, setShowApplyTemplate] = useState(false)

  // ✅ FOOD LOG: New state
  const [consumedMeals, setConsumedMeals] = useState([])
  const [showFoodLog, setShowFoodLog] = useState(false)
  const [loggingService, setLoggingService] = useState(null)
  const [defaultMealMoment, setDefaultMealMoment] = useState(null)

  // ✅ EDIT: New state for editing a consumed meal
  const [editingMeal, setEditingMeal] = useState(null)

  // ✅ FOOD LOG: Init logging service
  useEffect(() => {
    if (db?.supabase && !loggingService) {
      setLoggingService(new MealLoggingService(db.supabase))
    }
  }, [db])

  // FAB-trigger uit AIMealDashboard: elke increment opent de food-log modal.
  // De eerste render (foodLogTrigger=0) negeren we, anders zou de modal direct
  // bij page-load openen.
  useEffect(() => {
    if (!foodLogTrigger) return
    setShowFoodLog(true)
  }, [foodLogTrigger])

  useEffect(() => {
    if (selectedDay) {
      const dayIndex = daysOfWeek.findIndex(d => d.key === selectedDay)
      if (dayIndex !== -1 && dayIndex !== currentDay) setCurrentDay(dayIndex)
    }
  }, [selectedDay, currentDay])

  useEffect(() => {
    if (todayProgress?.consumed_meals) {
      const newChecked = {}
      Object.entries(todayProgress.consumed_meals).forEach(([slot, data]) => {
        if (data?.consumed) newChecked[slot] = true
      })
      // Mergen i.p.v. vervangen, zodat een (lege) todayProgress de uit de DB
      // herstelde vinkjes hieronder niet wegvaagt.
      setCheckedMeals(prev => ({ ...prev, ...newChecked }))
    }
  }, [todayProgress])

  // Herstel de afvink-status bij (her)laden van de pagina. De macro-totalen
  // bleven wel staan (losse som uit consumed_meals), maar de vinkjes per maaltijd
  // niet — die leidden we hier nu af uit de plan_check-rijen van vandaag, gematcht
  // op meal_id (zodat snack1/snack2 los herkend worden), met slot als fallback.
  useEffect(() => {
    if (currentDay !== getTodayIndex() || !client?.id || !db?.supabase || displayMeals.length === 0) return
    let alive = true
    ;(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await db.supabase
          .from('consumed_meals')
          .select('meal_id, meal_type')
          .eq('client_id', client.id)
          .eq('source', 'plan_check')
          .gte('consumed_at', `${today}T00:00:00`)
          .lt('consumed_at', `${today}T23:59:59`)
        if (!alive || !Array.isArray(data)) return
        const restored = {}
        for (const row of data) {
          let m = row.meal_id ? displayMeals.find(dm => (dm.meal_id || dm.id) === row.meal_id) : null
          if (!m && row.meal_type) m = displayMeals.find(dm => dm.slot === row.meal_type)
          if (m) restored[m.slot] = true
        }
        if (Object.keys(restored).length > 0) setCheckedMeals(prev => ({ ...prev, ...restored }))
      } catch (e) { console.warn('Vinkjes herstellen mislukt:', e) }
    })()
    return () => { alive = false }
  }, [displayMeals, currentDay, client?.id, db])

  useEffect(() => {
    // OVERHAUL: free-mode skips plan loading entirely
    if (isFreeMode) {
      setDisplayMeals([])
    } else if (currentDay === getTodayIndex() && todayMeals) {
      setDisplayMeals(todayMeals)
    } else {
      loadDayMeals(currentDay)
    }

    // ✅ FOOD LOG: Load consumed meals for this day (works in both modes)
    if (client?.id) loadConsumedMeals(currentDay)
  }, [currentDay, todayMeals, activePlan, client?.id, isFreeMode])

  // ✅ FOOD LOG: Load consumed_meals from DB for selected day
  const loadConsumedMeals = async (dayIndex) => {
    if (!db?.supabase || !client?.id) return
    try {
      const today = new Date()
      const diff = dayIndex - getTodayIndex()
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + diff)
      const dateStr = targetDate.toISOString().split('T')[0]
      // Use next-day midnight as upper bound to include the full last second.
      const nd = new Date(targetDate)
      nd.setDate(targetDate.getDate() + 1)
      const nextDateStr = nd.toISOString().split('T')[0]

      const { data, error } = await db.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', client.id)
        .gte('consumed_at', `${dateStr}T00:00:00`)
        .lt('consumed_at', `${nextDateStr}T00:00:00`)
        .order('consumed_at', { ascending: true })

      if (error) throw error
      setConsumedMeals(data || [])
    } catch (err) {
      console.error('Failed to load consumed meals:', err)
      setConsumedMeals([])
    }
  }

  // ✅ FOOD LOG: Delete consumed meal
  const handleDeleteConsumedMeal = async (mealId) => {
    if (!loggingService) return
    try {
      await loggingService.deleteConsumedMeal(mealId)
      const deleted = consumedMeals.find(m => m.id === mealId)
      setConsumedMeals(prev => prev.filter(m => m.id !== mealId))

      // Alleen vandaag's totals updaten als we ECHT vandaag aan het editen
      // zijn — anders trekken we de macros van een past-day delete af van
      // vandaag (zelfde bug als bij logging).
      if (deleted && onMealLogged && currentDay === getTodayIndex()) {
        onMealLogged({
          calories: -(deleted.calories || 0),
          protein: -(deleted.protein || 0),
          carbs: -(deleted.carbs || 0),
          fat: -(deleted.fat || 0)
        })
      }
      // Notify parent to refresh MacroHero cache for past days.
      if (deleted && onPastDayUpdate && currentDay !== getTodayIndex()) {
        onPastDayUpdate()
      }
    } catch (err) {
      console.error('Failed to delete consumed meal:', err)
    }
  }

  // ✅ FOOD LOG: Handle new meal logged
  const handleMealLogged = (loggedData) => {
    if (currentDay === getTodayIndex()) {
      // Vandaag: lokaal toevoegen + parent's day-totals updaten.
      setConsumedMeals(prev => [...prev, loggedData])
      if (onMealLogged) onMealLogged(loggedData)
    }
    // Vorige dag: NIET door-propagaten naar parent — die telt vandaag's
    // macros, en als we 'm voor een past-day log óók zouden bumpen pakt
    // vandaag macro's van een log die op maandag hoort. De timeline van
    // de gekozen dag laad de FoodLogModal-callsite zelf opnieuw via
    // loadConsumedMeals(currentDay).
  }

  const loadDayMeals = async (dayIndex) => {
    if (!activePlan?.week_structure) { setDisplayMeals([]); return }
    setLoading(true)
    try {
      const dayKey = daysOfWeek[dayIndex]?.key
      if (!dayKey) { setDisplayMeals([]); setLoading(false); return }
      const dayPlan = activePlan.week_structure[dayKey]
      if (!dayPlan) { setDisplayMeals([]); setLoading(false); return }
      
      const meals = []
      const getMealData = async (mealRef) => {
        if (!mealRef) return null
        if (typeof mealRef === 'object') {
          if (mealRef.calories) return mealRef
          if (mealRef.id || mealRef.meal_id) {
            const mealId = mealRef.id || mealRef.meal_id
            if (typeof mealId === 'string') mealRef = mealId; else return mealRef
          }
        }
        if (typeof mealRef === 'string') {
          try {
            const cleanId = mealRef.replace('_small','').replace('_large','').replace('_xl','').replace('_medium','')
            const { data, error } = await db.supabase.from('ai_meals').select('*').eq('id', cleanId).single()
            return error ? null : data
          } catch { return null }
        }
        return null
      }
      
      for (const cfg of [
        { key: 'breakfast', slot: 'breakfast', label: 'Ontbijt', time: 8 },
        { key: 'lunch', slot: 'lunch', label: 'Lunch', time: 12.5 },
        { key: 'dinner', slot: 'dinner', label: 'Diner', time: 18.5 },
        { key: 'snack1', slot: 'snack1', label: 'Snack 1', time: 10 },
        { key: 'snack2', slot: 'snack2', label: 'Snack 2', time: 15 }
      ]) {
        if (dayPlan[cfg.key]) {
          const d = await getMealData(dayPlan[cfg.key])
          if (d) meals.push({ ...d, slot: cfg.slot, timeSlot: cfg.label, plannedTime: cfg.time, meal_name: d.name || d.meal_name || cfg.label, meal_id: d.id || d.meal_id })
        }
      }
      setDisplayMeals(meals)
    } catch (e) { setDisplayMeals([]) }
    finally { setLoading(false) }
  }
  
  const handleDayClick = (dayIndex) => {
    setCurrentDay(dayIndex)
    if (onDayChange) onDayChange(daysOfWeek[dayIndex].key)
  }
  
  const handleMealCheck = async (meal) => {
    if (checkedMeals[meal.slot]) {
      // Find the corresponding plan_check record so we can delete it.
      // Without this, the record stays in consumed_meals: MacroHero keeps
      // showing the calories AND the restore effect re-checks the slot on
      // the next re-render — the "stuck on completed" bug.
      const mealId = meal.meal_id || meal.id
      const planCheckRecord = mealId
        ? consumedMeals.find(m => m.source === 'plan_check' && m.meal_id === mealId)
        : consumedMeals.find(m => m.source === 'plan_check' && m.meal_type === meal.slot?.replace(/\d+$/, ''))
      if (planCheckRecord && db?.supabase) {
        try {
          await db.supabase.from('consumed_meals').delete().eq('id', planCheckRecord.id)
          setConsumedMeals(prev => prev.filter(m => m.id !== planCheckRecord.id))
        } catch (e) {
          console.error('Failed to remove plan_check on uncheck:', e)
        }
      }
      await onUncheckMeal(meal.slot)
      setCheckedMeals(prev => ({ ...prev, [meal.slot]: false }))
    } else {
      await onCheckMeal(meal.slot, meal)
      setCheckedMeals(prev => ({ ...prev, [meal.slot]: true }))
    }
  }
  
  // ✅ FOOD LOG: Combined totals (plan meals + consumed meals)
  const planTotals = (!displayMeals || displayMeals.length === 0)
    ? { calories: 0, protein: 0, carbs: 0, fat: 0 }
    : displayMeals.reduce((t, m) => ({
        calories: t.calories + (m.calories || 0), protein: t.protein + (m.protein || 0),
        carbs: t.carbs + (m.carbs || 0), fat: t.fat + (m.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const consumedTotals = consumedMeals.reduce((t, m) => ({
    calories: t.calories + (m.calories || 0), protein: t.protein + (m.protein || 0),
    carbs: t.carbs + (m.carbs || 0), fat: t.fat + (m.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  // Only consumed meals count — plan is reference only
  const combinedTotals = consumedTotals

  const clientTargets = dailyTotals?.targets || targets || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // ✅ FOOD LOG: Consumed today for remaining calc
  const consumedToday = dailyTotals?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const hasContent = displayMeals.length > 0 || consumedMeals.length > 0

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      // Edge-to-edge borders weggehaald — kaartjes zweven nu zelf,
      // wrapper hoeft geen frame meer te zijn.
      paddingTop: 4,
    }}>
      {/* DayScheduleHeader (titel/datum/Template-knop) en de MA-ZO
          DaySelector zijn verwijderd: navigatie en dagweergave zitten nu
          in MealDayNavHeader bovenaan AIMealDashboard. */}

      {!hideTotalsBar && hasContent && (
        <DailyTotalsBar dailyTotals={combinedTotals} targets={clientTargets} isMobile={isMobile} />
      )}

      {/* Wijde "+ Maaltijd loggen" knop weggehaald — vervangen door de
          floating ronde + FAB in AIMealDashboard (één log-knop per pagina). */}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Laden...</div>
      ) : !hasContent && !client ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
          Geen maaltijden gepland voor deze dag
        </div>
      ) : (
        <MealTimelineMobile
          meals={displayMeals}
          checkedMeals={checkedMeals}
          onMealCheck={handleMealCheck}
          onOpenInfo={onOpenInfo}
          onOpenAlternatives={onOpenAlternatives}
          isToday={currentDay === getTodayIndex()}
          isMobile={isMobile}
          consumedMeals={consumedMeals}
          onOpenFoodLog={(momentId) => {
            setDefaultMealMoment(momentId || null)
            setShowFoodLog(true)
          }}
          onDeleteConsumedMeal={handleDeleteConsumedMeal}
          onEditConsumedMeal={(meal) => {
            setEditingMeal(meal)
            setShowFoodLog(true)
          }}
          onPlanMealLog={async (meal) => {
            if (!db?.supabase || !client?.id) return
            try {
              // Check if already logged today (prevent duplicates)
              const today = new Date().toISOString().split('T')[0]
              const { data: existing } = await db.supabase
                .from('consumed_meals')
                .select('id')
                .eq('client_id', client.id)
                .eq('meal_id', meal.id)
                .eq('source', 'plan_check')
                .gte('consumed_at', `${today}T00:00:00`)
                .lt('consumed_at', `${today}T23:59:59`)
                .limit(1)

              if (existing && existing.length > 0) {
                console.log('⏭️ Plan meal already logged today, skipping')
                return
              }

              const mealType = meal.slot?.includes('breakfast') ? 'breakfast'
                : meal.slot?.includes('lunch') ? 'lunch'
                : meal.slot?.includes('dinner') ? 'dinner'
                : 'snack'

              const { data: result, error } = await db.supabase
                .from('consumed_meals')
                .insert({
                  client_id: client.id,
                  meal_name: meal.name || meal.meal_name,
                  meal_id: meal.id || null,
                  meal_type: mealType,
                  ingredients: meal.ingredients_list || [],
                  calories: Math.round(meal.calories || 0),
                  protein: Math.round(meal.protein || 0),
                  carbs: Math.round(meal.carbs || 0),
                  fat: Math.round(meal.fat || 0),
                  // Plan meals = pre-formed portions; explicit "1 portion" so
                  // re-opening from Recent/Edit anchors macros to that.
                  amount: 1,
                  per_unit: 'portion',
                  consumed_at: new Date().toISOString(),
                  source: 'plan_check',
                  is_shared: true,
                  is_favorite: false,
                  log_count: 1
                })
                .select()
                .single()

              if (error) throw error

              if (result) {
                setConsumedMeals(prev => [...prev, result])
                // Visual check — replaces the role onMealCheck used to play
                // here. Done locally so we don't trigger the parent's
                // handleCheckMeal which would add macros a second time.
                setCheckedMeals(prev => ({ ...prev, [meal.slot]: true }))
                if (onMealLogged) onMealLogged({
                  calories: meal.calories || 0,
                  protein: meal.protein || 0,
                  carbs: meal.carbs || 0,
                  fat: meal.fat || 0
                })
                console.log('✅ Plan meal auto-logged:', meal.name)
              }
            } catch (err) {
              console.error('Auto-log plan meal failed:', err)
            }
          }}
        />
      )}

      {/* Empty state — knop weg, tekst blijft als hint. De FAB rechtsonder
          is het enige aanknopingspunt voor "loggen". */}
      {!loading && displayMeals.length === 0 && consumedMeals.length === 0 && client && (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            {activePlan ? 'Geen maaltijden gepland voor deze dag' : 'Nog niks gelogd vandaag'}
          </div>
        </div>
      )}
      
      {showApplyTemplate && (
        <DayTemplatePickerModal
          isOpen={showApplyTemplate}
          onClose={() => setShowApplyTemplate(false)}
          dayTemplates={dayTemplates}
          currentDayKey={daysOfWeek[currentDay]?.key}
          activePlan={activePlan}
          clientId={client?.id}
          db={db}
          isMobile={isMobile}
          onSuccess={() => { setShowApplyTemplate(false); if (onPlanUpdate) onPlanUpdate(); loadDayMeals(currentDay) }}
        />
      )}

      {/* ✅ FOOD LOG + EDIT: Modal with editMeal support */}
      {showFoodLog && (() => {
        // When the user is viewing a past day, stamp the meal at noon of
        // that day so it lands in the right bucket without being timezone-
        // sensitive. Today-flow falls back to "now" inside the service.
        let consumedAtIso = null
        if (currentDay !== getTodayIndex()) {
          const diff = currentDay - getTodayIndex()
          const target = new Date()
          target.setDate(target.getDate() + diff)
          target.setHours(12, 0, 0, 0)
          consumedAtIso = target.toISOString()
        }
        return (
          <FoodLogModal
            isOpen={showFoodLog}
            onClose={() => { setShowFoodLog(false); setDefaultMealMoment(null); setEditingMeal(null) }}
            client={client}
            db={db}
            targets={clientTargets}
            consumedToday={consumedToday}
            onMealLogged={(data) => {
              handleMealLogged(data)
              // Always reload the day we're looking at — so a past-day
              // log appears immediately in the timeline.
              loadConsumedMeals(currentDay)
              // Notify parent to refresh MacroHero for past days.
              if (currentDay !== getTodayIndex() && onPastDayUpdate) onPastDayUpdate()
            }}
            defaultMealMoment={defaultMealMoment}
            editMeal={editingMeal}
            consumedAt={consumedAtIso}
          />
        )
      })()}
    </div>
  )
}
