// src/modules/meal-plan/AIMealDashboard.jsx
// ✅ OPTIMISTIC UPDATES - Instant UI zonder hard refresh
// ✅ v6.1 - Fixed: Zero top padding, MacroOverview flush
// ✅ v6.2 - Added: SupplementPlanPanel integration
// ✅ v6.3 - Fixed: Supplement button styled to match dashboard design
import React, { useState, useEffect } from 'react'
import AIMealPlanService from './AIMealPlanService'

// Core Components
import AIDaySchedule from './components/AIDaySchedule'
import AIWeekPlanner from './components/AIWeekPlanner'
import MealSetupWizard from './components/wizard/MealSetupWizard'

// New (overhaul) — header + macro hero + more sheet
import MealPageHeader from './components/MealPageHeader'
import MacroHero from './components/MacroHero'
import MoreActionsSheet from './components/MoreActionsSheet'
import RemainingPill from './components/RemainingPill'
import { resolveMealMode, updateMealMode } from './mealViewMode'

// Day-of-week metadata used by both the lifted DaySelector and downstream timeline.
const DAYS_OF_WEEK = [
  { id: 0, name: 'Ma', key: 'monday' },
  { id: 1, name: 'Di', key: 'tuesday' },
  { id: 2, name: 'Wo', key: 'wednesday' },
  { id: 3, name: 'Do', key: 'thursday' },
  { id: 4, name: 'Vr', key: 'friday' },
  { id: 5, name: 'Za', key: 'saturday' },
  { id: 6, name: 'Zo', key: 'sunday' },
]
const getTodayIndex = () => {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}
const dayKeyToIndex = (key) => {
  if (key === 'today' || !key) return getTodayIndex()
  const i = DAYS_OF_WEEK.findIndex(d => d.key === key)
  return i >= 0 ? i : getTodayIndex()
}
const indexToDate = (idx) => {
  const todayIdx = getTodayIndex()
  const diff = idx - todayIdx
  const date = new Date()
  date.setDate(date.getDate() + diff)
  return date
}

// Challenge Sidebar
import MealChallengeSidebar from '../../client/components/MealChallengeSidebar'

// Modals
import AIAlternativesModal from './components/AIAlternativesModal'
import AIMealInfoModal from './components/AIMealInfoModal'
import AIFavoritesModal from './components/AIFavoritesModal'
import AIMealHistoryModal from './components/AIMealHistoryModal'

// Video Widget
import PageVideoWidget from '../videos/PageVideoWidget'

// ✅ NIEUW: Supplement Panel
import SupplementPlanPanel from '../supplements/SupplementPlanPanel'

// ✅ NIEUW: Weekly Nutrition Overview
import WeeklyNutritionOverview from './components/food-log/WeeklyNutritionOverview'

// ✅ NIEUW: Client Documents (PDF viewer)
import ClientDocumentsSection from '../coach-command-center/components/insight/ClientDocumentsSection'

export default function AIMealDashboard({ client, onNavigate, db }) {
  const [service] = useState(() => new AIMealPlanService(db))
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedDay, setSelectedDay] = useState('today')
  const [dayTemplates, setDayTemplates] = useState([])
  const [showWeekPlanner, setShowWeekPlanner] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  
  const [modals, setModals] = useState({
    alternatives: null,
    info: null,
    history: false,
    favorites: false,
    supplements: false,
    weekOverview: false,
    more: false,
    documents: false,
  })

  // ── Meal view mode (Plan / Free) — phase 1 of overhaul ──
  // null while resolving; once resolved holds 'plan' | 'free'.
  const [mealMode, setMealMode] = useState(null)
  const [modeUpdating, setModeUpdating] = useState(false)

  useEffect(() => {
    if (!client || mealMode !== null) return
    const hasActivePlan = !!dashboardData?.activePlan
    setMealMode(resolveMealMode(client, hasActivePlan))
  }, [client, dashboardData?.activePlan, mealMode])

  const handleModeChange = async (next) => {
    if (next === mealMode || modeUpdating || !client?.id) return
    const prev = mealMode
    setMealMode(next)        // optimistic
    setModeUpdating(true)
    try {
      await updateMealMode(db, client.id, next)
    } catch (err) {
      console.error('Failed to update meal_view_mode, reverting:', err)
      setMealMode(prev)
    } finally {
      setModeUpdating(false)
    }
  }
  
  useEffect(() => {
    if (client?.id) {
      loadDashboardData()
      loadTemplates()
    }
  }, [client])
  
  const loadTemplates = async () => {
    try {
      const templates = await db.getClientDayTemplates(client.id)
      setDayTemplates(templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      setDayTemplates([])
    }
  }
  
  const loadDashboardData = async () => {
    console.log('🚀 Loading AI dashboard data')
    setLoading(true)
    
    try {
      const data = await service.loadAIDashboardData(client.id)
      
      if (data.dailyTotals) {
        // Fresh targets from DB — not cached client prop
        let planTargets = {
          calories: client.target_calories || 0,
          protein: client.target_protein || 0,
          carbs: client.target_carbs || 0,
          fat: client.target_fat || 0
        }
        try {
          const { data: fc } = await db.supabase
            .from('clients')
            .select('target_calories, target_protein, target_carbs, target_fat')
            .eq('id', client.id)
            .single()
          if (fc) {
            planTargets = {
              calories: fc.target_calories || planTargets.calories,
              protein: fc.target_protein || planTargets.protein,
              carbs: fc.target_carbs || planTargets.carbs,
              fat: fc.target_fat || planTargets.fat
            }
          }
        } catch (e) { console.warn('Fresh targets fetch failed') }
        
        data.dailyTotals.targets = planTargets
        
        const realConsumed = await calculateConsumedFromDB(data)
        data.dailyTotals.consumed = realConsumed
        
        data.dailyTotals.percentages = {
          calories: planTargets.calories > 0 ? Math.round((realConsumed.calories / planTargets.calories) * 100) : 0,
          protein: planTargets.protein > 0 ? Math.round((realConsumed.protein / planTargets.protein) * 100) : 0,
          carbs: planTargets.carbs > 0 ? Math.round((realConsumed.carbs / planTargets.carbs) * 100) : 0,
          fat: planTargets.fat > 0 ? Math.round((realConsumed.fat / planTargets.fat) * 100) : 0
        }
      }
      
      if (!data.nextMeal && data.todayMeals?.length > 0) {
        const unconsumedMeal = data.todayMeals.find(meal => !meal.isConsumed)
        if (unconsumedMeal) {
          data.nextMeal = unconsumedMeal
        }
      }
      
      setDashboardData(data)
      console.log('✅ AI Dashboard loaded')
      console.log('📊 Daily Totals:', data.dailyTotals)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setDashboardData({
        activePlan: null,
        todayMeals: [],
        nextMeal: null,
        todayProgress: null,
        dailyTotals: {
          targets: { 
            calories: client.target_calories || 0, 
            protein: client.target_protein || 0, 
            carbs: client.target_carbs || 0, 
            fat: client.target_fat || 0 
          },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          percentages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          mealsConsumed: 0,
          mealsPlanned: 0
        },
        waterIntake: 0,
        todayMood: null,
        favorites: [],
        customMeals: [],
        recentHistory: []
      })
    } finally {
      setLoading(false)
    }
  }
  
  const calculateConsumedFromDB = async (data) => {
    const today = new Date().toISOString().split('T')[0]
   
    let totalConsumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
   
    try {
      // Single source of truth: consumed_meals table
      const { data: consumedData, error: consumedError } = await db.supabase
        .from('consumed_meals')
        .select('calories, protein, carbs, fat')
        .eq('client_id', client.id)
        .gte('consumed_at', `${today}T00:00:00`)
        .lt('consumed_at', `${today}T23:59:59`)

      if (!consumedError && consumedData) {
        consumedData.forEach(meal => {
          totalConsumed.calories += meal.calories || 0
          totalConsumed.protein += parseFloat(meal.protein) || 0
          totalConsumed.carbs += parseFloat(meal.carbs) || 0
          totalConsumed.fat += parseFloat(meal.fat) || 0
        })
        console.log('✅ Consumed from DB:', consumedData.length, 'meals, total:', totalConsumed.calories, 'kcal')
      }

      return totalConsumed
   
    } catch (error) {
      console.error('Error calculating consumed:', error)
      return totalConsumed
    }
  }
  
  const handleMealLogged = async (loggedData) => {
    console.log('✅ [OPTIMISTIC] Meal logged:', loggedData)
    
    setDashboardData(prev => {
      const newConsumed = {
        calories: prev.dailyTotals.consumed.calories + (loggedData.calories || 0),
        protein: prev.dailyTotals.consumed.protein + (loggedData.protein || 0),
        carbs: prev.dailyTotals.consumed.carbs + (loggedData.carbs || 0),
        fat: prev.dailyTotals.consumed.fat + (loggedData.fat || 0)
      }
      
      const targets = prev.dailyTotals.targets
      
      return {
        ...prev,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          }
        }
      }
    })
    
    console.log('✅ [OPTIMISTIC] UI updated instantly')
  }
  
  const handleCheckMeal = async (slot, mealData) => {
    console.log('✅ [OPTIMISTIC] Checking meal:', slot, mealData)
    
    setDashboardData(prev => {
      const newConsumed = {
        calories: prev.dailyTotals.consumed.calories + (mealData.calories || 0),
        protein: prev.dailyTotals.consumed.protein + (mealData.protein || 0),
        carbs: prev.dailyTotals.consumed.carbs + (mealData.carbs || 0),
        fat: prev.dailyTotals.consumed.fat + (mealData.fat || 0)
      }
      
      const targets = prev.dailyTotals.targets
      
      const updatedTodayMeals = prev.todayMeals?.map(meal => 
        meal.slot === slot ? { ...meal, isConsumed: true } : meal
      ) || []
      
      const nextUnconsumedMeal = updatedTodayMeals.find(meal => !meal.isConsumed)
      
      return {
        ...prev,
        todayMeals: updatedTodayMeals,
        nextMeal: nextUnconsumedMeal || null,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          },
          mealsConsumed: (prev.dailyTotals.mealsConsumed || 0) + 1
        }
      }
    })
    
    try {
      await service.checkAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot,
        mealData
      )
      console.log('✅ [OPTIMISTIC] Meal check saved to DB')
    } catch (error) {
      console.error('❌ [OPTIMISTIC] Meal check failed, reverting...', error)
      await loadDashboardData()
    }
  }
  
  const handleUncheckMeal = async (slot) => {
    console.log('❌ [OPTIMISTIC] Unchecking meal:', slot)
    
    const mealToUncheck = dashboardData.todayMeals?.find(m => m.slot === slot)
    if (!mealToUncheck) return
    
    setDashboardData(prev => {
      const newConsumed = {
        calories: Math.max(0, prev.dailyTotals.consumed.calories - (mealToUncheck.calories || 0)),
        protein: Math.max(0, prev.dailyTotals.consumed.protein - (mealToUncheck.protein || 0)),
        carbs: Math.max(0, prev.dailyTotals.consumed.carbs - (mealToUncheck.carbs || 0)),
        fat: Math.max(0, prev.dailyTotals.consumed.fat - (mealToUncheck.fat || 0))
      }
      
      const targets = prev.dailyTotals.targets
      
      const updatedTodayMeals = prev.todayMeals?.map(meal => 
        meal.slot === slot ? { ...meal, isConsumed: false } : meal
      ) || []
      
      let newNextMeal = prev.nextMeal
      
      if (!prev.nextMeal || prev.nextMeal.slot === slot) {
        newNextMeal = updatedTodayMeals.find(meal => !meal.isConsumed) || null
      } else if (mealToUncheck.isConsumed) {
        newNextMeal = updatedTodayMeals.find(meal => !meal.isConsumed) || null
      }
      
      return {
        ...prev,
        todayMeals: updatedTodayMeals,
        nextMeal: newNextMeal,
        dailyTotals: {
          ...prev.dailyTotals,
          consumed: newConsumed,
          percentages: {
            calories: targets.calories > 0 ? Math.round((newConsumed.calories / targets.calories) * 100) : 0,
            protein: targets.protein > 0 ? Math.round((newConsumed.protein / targets.protein) * 100) : 0,
            carbs: targets.carbs > 0 ? Math.round((newConsumed.carbs / targets.carbs) * 100) : 0,
            fat: targets.fat > 0 ? Math.round((newConsumed.fat / targets.fat) * 100) : 0
          },
          mealsConsumed: Math.max(0, (prev.dailyTotals.mealsConsumed || 0) - 1)
        }
      }
    })
    
    try {
      await service.uncheckAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot
      )
      console.log('✅ [OPTIMISTIC] Meal uncheck saved to DB')
    } catch (error) {
      console.error('❌ [OPTIMISTIC] Meal uncheck failed, reverting...', error)
      await loadDashboardData()
    }
  }
  
  const handleSwapMeal = async (originalMeal, newMealId) => {
    try {
      await service.swapAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        dashboardData.dayName || 'today',
        originalMeal.slot,
        newMealId
      )
      setModals(prev => ({ ...prev, alternatives: null, favorites: false }))
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to swap meal:', error)
    }
  }

  const handleDayChange = (newDay) => {
    setSelectedDay(newDay)
  }

  const handleWizardComplete = async () => {
    setShowWizard(false)
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 215, 0, 0.2)',
          borderTop: '4px solid #FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  // In plan-mode without an active plan: show empty state.
  // In free-mode: keep rendering the dashboard so users can still log meals.
  if (!dashboardData?.activePlan && (mealMode || 'plan') === 'plan') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          background: 'rgba(17, 17, 17, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.18)',
          borderRadius: '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#FFD700',
            marginBottom: '1rem'
          }}>
            Geen actief meal plan
          </h2>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.5rem',
            lineHeight: 1.6
          }}>
            Je coach heeft nog geen AI meal plan voor je aangemaakt.
            Wissel naar <strong style={{ color: '#FFD700' }}>Free</strong> modus om alleen meals te loggen.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => handleModeChange('free')}
              style={{
                padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                border: 'none',
                borderRadius: '14px',
                color: '#0a0a0a',
                fontSize: isMobile ? '1rem' : '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(255, 215, 0, 0.25)'
              }}
            >
              Schakel naar Free modus
            </button>
            <button
              onClick={() => onNavigate('home')}
              style={{
                padding: isMobile ? '0.75rem 2rem' : '0.875rem 2.5rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Terug naar Home
            </button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingTop: 0,
      paddingBottom: isMobile ? '6rem' : '2rem',
      overflowX: 'hidden',
      maxWidth: '100vw',
      animation: 'fadeIn 0.5s ease'
    }}>

      {/* ════ NEW HEADER (overhaul phase 2) ════ */}
      <MealPageHeader
        mode={mealMode}
        onModeChange={handleModeChange}
        modeLoading={modeUpdating}
        onOpenHistory={() => setModals(prev => ({ ...prev, history: true }))}
        onOpenMore={() => setModals(prev => ({ ...prev, more: true }))}
        isMobile={isMobile}
      />

      {/* ════ TODAY BUDGET — "Je mag nog eten: X kcal" + progress bar (Food-app style) ════ */}
      {(() => {
        const t = dashboardData?.dailyTotals?.targets
        const c = dashboardData?.dailyTotals?.consumed
        if (!t?.calories) return null
        const remaining = {
          kcal:    Math.round(t.calories - (c?.calories || 0)),
          protein: t.protein ? Math.round(t.protein - (c?.protein || 0)) : null,
        }
        return (
          <RemainingPill
            remaining={remaining}
            consumed={c}
            target={t}
            isMobile={isMobile}
          />
        )
      })()}

      {/* DaySelector removed — history modal (header icon) handles other days. */}

      {/* ════ NEW MACRO HERO — selected-day aware ════ */}
      {(() => {
        const currentDayIdx = dayKeyToIndex(selectedDay)
        const selectedDate = indexToDate(currentDayIdx)
        const selectedIsToday = currentDayIdx === getTodayIndex()
        return (
          <MacroHero
            consumed={dashboardData?.dailyTotals?.consumed}
            targets={dashboardData?.dailyTotals?.targets}
            db={db}
            clientId={client?.id}
            selectedDate={selectedDate}
            selectedIsToday={selectedIsToday}
            isMobile={isMobile}
            onWeekDetail={() => setModals(prev => ({ ...prev, weekOverview: true }))}
          />
        )
      })()}

      {/* Challenge Sidebar - Floating Widget */}
      <MealChallengeSidebar client={client} db={db} />

      {/* ════ TIMELINE (overhaul phase 5: direct AIDaySchedule, mode-aware) ════ */}
      <AIDaySchedule
        mode={mealMode || 'plan'}
        hideDayPicker
        hideTotalsBar
        activePlan={dashboardData.activePlan}
        todayMeals={dashboardData.todayMeals || []}
        todayProgress={dashboardData.todayProgress}
        selectedDay={selectedDay}
        onDayChange={handleDayChange}
        onCheckMeal={handleCheckMeal}
        onUncheckMeal={handleUncheckMeal}
        onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
        onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
        dayTemplates={dayTemplates || []}
        db={db}
        onPlanUpdate={loadDashboardData}
        dailyTotals={dashboardData.dailyTotals || {
          targets: {
            calories: client.target_calories || 0,
            protein: client.target_protein || 0,
            carbs: client.target_carbs || 0,
            fat: client.target_fat || 0,
          },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        }}
        client={client}
        onMealLogged={handleMealLogged}
        targets={dashboardData.dailyTotals?.targets}
      />

      {/* Week Planner */}
      {showWeekPlanner && (
        <AIWeekPlanner
          activePlan={dashboardData.activePlan}
          client={client}
          db={db}
          onWeekUpdated={loadDashboardData}
          dailyTotals={dashboardData.dailyTotals}
        />
      )}
      
      {/* Video Widget — floating sidebar, no wrapper needed */}
      <PageVideoWidget
        client={client}
        db={db}
        pageContext="meals"
      />
      
      {/* MODALS */}
      {modals.alternatives && (
        <AIAlternativesModal
          isOpen={!!modals.alternatives}
          onClose={() => setModals(prev => ({ ...prev, alternatives: null }))}
          currentMeal={modals.alternatives}
          onSelectMeal={(newMealId) => handleSwapMeal(modals.alternatives, newMealId)}
          db={db}
          service={service}
        />
      )}
      
      {modals.info && (
        <AIMealInfoModal
          key={modals.info?.id || modals.info?.meal_id || Date.now()}
          isOpen={!!modals.info}
          onClose={() => setModals(prev => ({ ...prev, info: null }))}
          meal={modals.info}
          db={db}
        />
      )}
      
      {modals.favorites && (
        <AIFavoritesModal
          isOpen={modals.favorites}
          onClose={() => setModals(prev => ({ ...prev, favorites: false }))}
          onSelectMeal={(mealId) => {
            if (dashboardData.nextMeal) {
              handleSwapMeal(dashboardData.nextMeal, mealId)
            }
          }}
          currentMeal={dashboardData.nextMeal}
          db={db}
          service={service}
          client={client}
        />
      )}
      
      {modals.history && (
        <AIMealHistoryModal
          isOpen={modals.history}
          onClose={() => setModals(prev => ({ ...prev, history: false }))}
          db={db}
          clientId={client.id}
          service={service}
        />
      )}

      {/* ✅ NIEUW: Supplement Panel */}
      {modals.supplements && (
        <SupplementPlanPanel
          clientId={client.id}
          clientWeight={client.weight}
          trainingFreq={client.training_frequency}
          isOpen={modals.supplements}
          onClose={() => setModals(prev => ({ ...prev, supplements: false }))}
        />
      )}

      {/* ✅ NIEUW: Weekly Nutrition Overview */}
      {modals.weekOverview && (
        <WeeklyNutritionOverview
          isOpen={modals.weekOverview}
          onClose={() => setModals(prev => ({ ...prev, weekOverview: false }))}
          client={client}
          db={db}
          targets={dashboardData.dailyTotals?.targets || {
            calories: client.target_calories || 0,
            protein: client.target_protein || 0,
            carbs: client.target_carbs || 0,
            fat: client.target_fat || 0
          }}
        />
      )}
      
      {/* ✅ OVERHAUL: Meer-sheet (bottom sheet) */}
      <MoreActionsSheet
        isOpen={modals.more}
        onClose={() => setModals(prev => ({ ...prev, more: false }))}
        isPlanMode={(mealMode || 'plan') === 'plan'}
        onOpenSupplements={() => setModals(prev => ({ ...prev, more: false, supplements: true }))}
        onOpenDocuments={() => setModals(prev => ({ ...prev, more: false, documents: true }))}
        onOpenPlanEdit={() => {
          setModals(prev => ({ ...prev, more: false }))
          setShowWeekPlanner(true)
        }}
        onOpenCoachWizard={() => {
          setModals(prev => ({ ...prev, more: false }))
          setShowWizard(true)
        }}
        isMobile={isMobile}
      />

      {/* ✅ OVERHAUL: Documents fullscreen modal */}
      {modals.documents && (
        <div
          onClick={() => setModals(prev => ({ ...prev, documents: false }))}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 2050,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top, 0)',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              maxWidth: '900px',
              width: '100%',
              margin: '0 auto',
              background: '#0a0a0a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255, 215, 0, 0.18)',
            }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, color: '#FFD700',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Documenten
              </span>
              <button
                onClick={() => setModals(prev => ({ ...prev, documents: false }))}
                aria-label="Sluiten"
                style={{
                  width: '30px', height: '30px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255, 215, 0, 0.06)',
                  border: '1px solid rgba(255, 215, 0, 0.18)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.5rem' }}>
              <ClientDocumentsSection
                db={db} clientId={client.id} coachId={null}
                isMobile={isMobile} isClientView={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Coach Strategy Wizard */}
      {showWizard && (
        <MealSetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
          client={client}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
