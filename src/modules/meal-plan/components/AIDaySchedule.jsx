// src/modules/meal-plan/components/AIDaySchedule.jsx
// 🎯 v3.1 - Edit consumed meal support added
// ✅ FOOD LOG: Loads consumed_meals, combined totals, log button
// ✅ EDIT: editingMeal state + FoodLogModal editMeal prop
import React, { useState, useEffect } from 'react'
import DayScheduleHeader from './day-schedule/DayScheduleHeader'
import DaySelector from './day-schedule/DaySelector'
import DailyTotalsBar from './day-schedule/DailyTotalsBar'
import MealTimelineDesktop from './day-schedule/MealTimelineDesktop'
import MealTimelineMobile from './day-schedule/MealTimelineMobile'
import ApplyTemplateModal from '../../client-meal-base/components/ApplyTemplateModal'
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
  client, onMealLogged, targets
}) {
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
      setCheckedMeals(newChecked)
    }
  }, [todayProgress])

  useEffect(() => {
    if (currentDay === getTodayIndex() && todayMeals) setDisplayMeals(todayMeals)
    else loadDayMeals(currentDay)

    // ✅ FOOD LOG: Load consumed meals for this day
    if (client?.id) loadConsumedMeals(currentDay)
  }, [currentDay, todayMeals, activePlan, client?.id])

  // ✅ FOOD LOG: Load consumed_meals from DB for selected day
  const loadConsumedMeals = async (dayIndex) => {
    if (!db?.supabase || !client?.id) return
    try {
      const today = new Date()
      const diff = dayIndex - getTodayIndex()
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + diff)
      const dateStr = targetDate.toISOString().split('T')[0]

      const { data, error } = await db.supabase
        .from('consumed_meals')
        .select('*')
        .eq('client_id', client.id)
        .gte('consumed_at', `${dateStr}T00:00:00`)
        .lt('consumed_at', `${dateStr}T23:59:59`)
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
      setConsumedMeals(prev => prev.filter(m => m.id !== mealId))

      // Notify parent to update macro totals
      const deleted = consumedMeals.find(m => m.id === mealId)
      if (deleted && onMealLogged) {
        onMealLogged({
          calories: -(deleted.calories || 0),
          protein: -(deleted.protein || 0),
          carbs: -(deleted.carbs || 0),
          fat: -(deleted.fat || 0)
        })
      }
    } catch (err) {
      console.error('Failed to delete consumed meal:', err)
    }
  }

  // ✅ FOOD LOG: Handle new meal logged
  const handleMealLogged = (loggedData) => {
    // Add to local consumed list
    if (currentDay === getTodayIndex()) {
      setConsumedMeals(prev => [...prev, loggedData])
    }
    // Notify parent for macro update
    if (onMealLogged) onMealLogged(loggedData)
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
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      <DayScheduleHeader
        dayTemplates={dayTemplates}
        onOpenTemplate={() => setShowApplyTemplate(true)}
        isMobile={isMobile}
      />
      
      <DaySelector
        days={daysOfWeek}
        currentDay={currentDay}
        onDayClick={handleDayClick}
        isToday={currentDay === getTodayIndex()}
        isMobile={isMobile}
      />
      
      {hasContent && (
        <DailyTotalsBar dailyTotals={combinedTotals} targets={clientTargets} isMobile={isMobile} />
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Laden...</div>
      ) : !hasContent && !client ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
          Geen maaltijden gepland voor deze dag
        </div>
      ) : isMobile ? (
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
      ) : (
        <>
          <MealTimelineDesktop
            meals={displayMeals}
            checkedMeals={checkedMeals}
            onMealCheck={handleMealCheck}
            onOpenInfo={onOpenInfo}
            onOpenAlternatives={onOpenAlternatives}
            isToday={currentDay === getTodayIndex()}
            isMobile={isMobile}
          />
          {/* ✅ FOOD LOG: Log button for desktop too */}
          {consumedMeals.map((meal) => (
            <div key={`logged-desktop-${meal.id}`} style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              borderLeft: '3px solid #f59e0b',
              padding: '0.625rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontSize: '0.4rem', fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gelogd</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', flex: 1 }}>{meal.meal_name}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'rgba(245, 158, 11, 0.7)' }}>{Math.round(meal.calories || 0)} kcal</span>
            </div>
          ))}
        </>
      )}

      {/* ✅ FOOD LOG: Empty state with log button when no plan */}
      {!loading && displayMeals.length === 0 && consumedMeals.length === 0 && client && (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.75rem' }}>
            {activePlan ? 'Geen maaltijden gepland voor deze dag' : 'Begin met loggen'}
          </div>
          <button
            onClick={() => setShowFoodLog(true)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: '0.75rem', fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: '40px'
            }}
          >
            + Maaltijd loggen
          </button>
        </div>
      )}
      
      {showApplyTemplate && (
        <ApplyTemplateModal isOpen={showApplyTemplate} onClose={() => setShowApplyTemplate(false)} dayTemplates={dayTemplates} currentDayKey={daysOfWeek[currentDay].key} activePlan={activePlan} db={db}
          onSuccess={() => { setShowApplyTemplate(false); if (onPlanUpdate) onPlanUpdate(); loadDayMeals(currentDay) }} />
      )}

      {/* ✅ FOOD LOG + EDIT: Modal with editMeal support */}
      {showFoodLog && (
        <FoodLogModal
          isOpen={showFoodLog}
          onClose={() => { setShowFoodLog(false); setDefaultMealMoment(null); setEditingMeal(null) }}
          client={client}
          db={db}
          targets={clientTargets}
          consumedToday={consumedToday}
          onMealLogged={(data) => {
            handleMealLogged(data)
            // Reload consumed meals to reflect edit
            if (data?._isEdit) loadConsumedMeals(currentDay)
          }}
          defaultMealMoment={defaultMealMoment}
          editMeal={editingMeal}
        />
      )}
    </div>
  )
}
