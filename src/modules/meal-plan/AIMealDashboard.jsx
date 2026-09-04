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
import MealDayNavHeader from './components/MealDayNavHeader'
import MealDaySummaryModal from './components/MealDaySummaryModal'
import MacroHero from './components/MacroHero'
import MealLogFAB from './components/MealLogFAB'
import DonePanel from './components/DonePanel'
import MoreActionsSheet from './components/MoreActionsSheet'
// `RemainingPill` is verwijderd uit de UI (kcal-totaal staat al in MacroHero
// + nieuwe samenvattingsmodal). `resolveMealMode` / `updateMealMode` zijn
// ook weg — Plan/Free toggle is geschrapt; we tonen altijd plan-mode.

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
// Voeding-foto-banner onder de dag-header (zelfde idee als de boodschappen-
// pagina). Vaste, sfeer-zettende foto van gezonde voeding.
const MEAL_BANNER_URL = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=400&fit=crop&q=80'

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

// ✅ NIEUW: Supplement Panel
import SupplementPlanPanel from '../supplements/SupplementPlanPanel'

// Coach meal suggestions slider (issue f57b5a95)
import CoachMealSuggestions from './components/CoachMealSuggestions'

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
  // Counter dat AIDaySchedule's FoodLogModal triggert wanneer de FAB
  // wordt ingedrukt. Increment = open.
  const [foodLogTrigger, setFoodLogTrigger] = useState(0)
  
  const [modals, setModals] = useState({
    alternatives: null,
    info: null,
    history: false,
    summary: false,
    favorites: false,
    supplements: false,
    weekOverview: false,
    more: false,
    documents: false,
  })

  // Incremented when a meal is logged/deleted on a past day; causes MacroHero
  // to clear its day-cache and re-fetch fresh totals for that day.
  const [pastDayRefreshKey, setPastDayRefreshKey] = useState(0)

  // Meal view mode: standaard 'plan' (toont plan-slots). Als het meal-plan is
  // uitgeschakeld (`clients.meal_plan_visible = false`) valt 'm terug op 'free'
  // — food-logging blijft werken, alleen de geplande slots verdwijnen. De coach
  // kan dit togglen via client-insight; de client zelf via de knop op deze pagina.
  const [mealPlanVisible, setMealPlanVisible] = useState(client?.meal_plan_visible !== false)
  const [savingVisibility, setSavingVisibility] = useState(false)
  useEffect(() => { setMealPlanVisible(client?.meal_plan_visible !== false) }, [client?.meal_plan_visible])
  const mealMode = mealPlanVisible ? 'plan' : 'free'

  const toggleMealPlanVisible = async () => {
    if (savingVisibility || !client?.id) return
    const next = !mealPlanVisible
    setMealPlanVisible(next)
    setSavingVisibility(true)
    try {
      const { error } = await db.supabase.from('clients').update({ meal_plan_visible: next }).eq('id', client.id)
      if (error) throw error
    } catch (e) {
      console.error('meal_plan_visible update failed:', e)
      setMealPlanVisible(!next) // rollback
    }
    setSavingVisibility(false)
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
      // De dag waar de klant NAAR KIJKT, niet de dag van vandaag. Dit stond
      // op dashboardData.dayName: wisselde je iets terwijl je donderdag open
      // had, dan werd dat als "vandaag" weggeschreven.
      const dagKey = DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key
      await service.swapAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        dagKey,
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
        background: '#0a0a0a',
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
  
  // Geen actief meal-plan: rustige empty state. Plan/Free-modus is geschrapt,
  // dus de "Schakel naar Free"-knop is verwijderd. Coach maakt eerst plan.
  if (!dashboardData?.activePlan) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
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
            lineHeight: 1.6,
          }}>
            Je coach werkt aan jouw plan. Zodra het klaar staat verschijnt hier
            je dagschema.
          </p>
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
              cursor: 'pointer',
            }}
          >
            Terug naar Home
          </button>
        </div>
      </div>
    )
  }


  return (
    <div style={{
      minHeight: '100vh',
      // Flat #0a0a0a matched de rest van ClientDashboard. De oude gradient
      // (→ #171717) liet onderaan een lichtere strook zien tegen het
      // donkere parent-blok dat erdoor uitkwam — daar kwam het "andere
      // zwart blok onderaan" vandaan.
      background: '#0a0a0a',
      paddingTop: 0,
      // ClientDashboard's <main> heeft al 120px buffer voor de floating
      // navbar, maar de meal-pagina heeft een rij MealLogFAB op bottom:110
      // én eindigt met week-overzichten waarvan de onderste content vaak
      // gedeeltelijk onder de bar verdween. Extra 180px geeft de klant
      // ruimte om er voorbij te scrollen.
      paddingBottom: 180,
      overflowX: 'hidden',
      maxWidth: '100vw',
      animation: 'fadeIn 0.5s ease'
    }}>

      {/* ════ GECONSOLIDEERDE DAG-HEADER ════
          Pijlen ⇄ + klikbare dagnaam (opent agenda/samenvatting modal).
          Vervangt: MealPageHeader (Plan/Free toggle + history/more iconen)
          en de oude RemainingPill — alles wat over kcal/datums/gem ging
          zit nu in MealDaySummaryModal. */}
      <MealDayNavHeader
        selectedDay={selectedDay}
        onDayChange={handleDayChange}
        onOpenSummary={() => setModals(prev => ({ ...prev, summary: true }))}
        isMobile={isMobile}
      />

      {/* ════ VOEDING-FOTO-BANNER — net onder de dag (zoals boodschappen) ════ */}
      <div style={{ padding: isMobile ? '0 0.75rem 0.6rem' : '0 1.5rem 0.75rem' }}>
        <div style={{ width: '100%', height: isMobile ? 110 : 150, borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${MEAL_BANNER_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.6) 100%)' }} />
        </div>
      </div>

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
            variant="boxes"
            refreshKey={pastDayRefreshKey}
          />
        )
      })()}

      {/* ════ MAALTIJDPLAN TONEN — toggle direct onder de koolh/vet-regel ════ */}
      <div style={{
        padding: isMobile ? '0 0.9rem 0.5rem' : '0 1.5rem 0.6rem', maxWidth: 1400, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
      }}>
        <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 800, color: '#fff' }}>Maaltijdplan tonen</span>
        <button
          onClick={toggleMealPlanVisible}
          disabled={savingVisibility}
          role="switch"
          aria-checked={mealPlanVisible}
          style={{
            width: 46, height: 26, borderRadius: 999, flexShrink: 0, position: 'relative',
            background: mealPlanVisible ? '#FFD700' : 'rgba(255,255,255,0.14)',
            border: 'none', cursor: savingVisibility ? 'default' : 'pointer',
            transition: 'background 0.2s ease', opacity: savingVisibility ? 0.6 : 1,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          <span style={{
            position: 'absolute', top: 3, left: mealPlanVisible ? 23 : 3,
            width: 20, height: 20, borderRadius: '50%', background: mealPlanVisible ? '#000' : '#fff',
            transition: 'left 0.2s ease',
          }} />
        </button>
      </div>

      {/* Coach meal suggestions — gefilterd op tijd van de dag */}
      <CoachMealSuggestions db={db} isMobile={isMobile} />

      {/* Challenge Sidebar - Floating Widget */}
      <MealChallengeSidebar client={client} db={db} />

      {/* "Klaar voor vandaag" — als alle geplande maaltijden gelogd zijn.
          Toont een rustig groene (of amber bij over-budget) banner zodat
          de dag een afgerond gevoel krijgt. Verschijnt alleen op de dag
          van vandaag, niet bij andere dagen. */}
      {(() => {
        const todayIdx = getTodayIndex()
        const selectedIdx = dayKeyToIndex(selectedDay)
        if (selectedIdx !== todayIdx) return null
        const plan = dashboardData.todayMeals || []
        if (plan.length === 0) return null
        const allDone = plan.every(m => m.isConsumed)
        if (!allDone) return null
        const t = dashboardData?.dailyTotals?.targets || {}
        const c = dashboardData?.dailyTotals?.consumed || {}
        const remaining = (t.calories || 0) - (c.calories || 0)
        return <DonePanel kcalRemaining={remaining} isMobile={isMobile} />
      })()}

      {/* ════ TIMELINE (overhaul phase 5: direct AIDaySchedule, mode-aware) ════ */}
      <AIDaySchedule
        mode={mealMode || 'plan'}
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
        foodLogTrigger={foodLogTrigger}
        onPastDayUpdate={() => setPastDayRefreshKey(k => k + 1)}
      />

      {/* Eén ronde gele log-knop — vervangt alle inline log-knoppen. */}
      <MealLogFAB
        onClick={() => setFoodLogTrigger(n => n + 1)}
        isMobile={isMobile}
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
      
      {/* Video Widget — gemigreerd naar centrale WidgetSidebar in ClientDashboard.
          Hier weggehaald om dubbele floating-knop te voorkomen. */}

      {/* MODALS */}
      {modals.alternatives && (
        <AIAlternativesModal
          isOpen={!!modals.alternatives}
          onClose={() => setModals(prev => ({ ...prev, alternatives: null }))}
          currentMeal={modals.alternatives}
          onSelectMeal={(newMealId) => handleSwapMeal(modals.alternatives, newMealId)}
          db={db}
          service={service}
          client={client}
        />
      )}
      
      {modals.info && (
        <AIMealInfoModal
          key={modals.info?.id || modals.info?.meal_id || Date.now()}
          isOpen={!!modals.info}
          onClose={() => setModals(prev => ({ ...prev, info: null }))}
          meal={modals.info}
          db={db}
          service={service}
          client={client}
          planId={dashboardData.activePlan?.id}
          dayName={DAYS_OF_WEEK[dayKeyToIndex(selectedDay)]?.key}
          isToday={dayKeyToIndex(selectedDay) === getTodayIndex()}
          onSaved={() => { setModals(prev => ({ ...prev, info: null })); loadDashboardData() }}
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

      {/* Geconsolideerde dag-/agenda-modal die opent vanuit MealDayNavHeader. */}
      {modals.summary && (
        <MealDaySummaryModal
          isOpen={modals.summary}
          onClose={() => setModals(prev => ({ ...prev, summary: false }))}
          db={db}
          clientId={client.id}
          selectedDay={selectedDay}
          onDayChange={handleDayChange}
          onOpenFullHistory={() => setModals(prev => ({ ...prev, summary: false, history: true }))}
          targets={dashboardData?.dailyTotals?.targets || {
            calories: client.target_calories || 0,
            protein:  client.target_protein  || 0,
            carbs:    client.target_carbs    || 0,
            fat:      client.target_fat      || 0,
          }}
          isMobile={isMobile}
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
