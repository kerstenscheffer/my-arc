// src/modules/meal-plan/AIMealDashboard.jsx
// ✅ OPTIMISTIC UPDATES - Instant UI zonder hard refresh
// ✅ v6.1 - Fixed: Zero top padding, MacroOverview flush
// ✅ v6.2 - Added: SupplementPlanPanel integration
// ✅ v6.3 - Fixed: Supplement button styled to match dashboard design
import React, { useState, useEffect } from 'react'
import AIMealPlanService from './AIMealPlanService'
import MealLoggingService from '../meal-logging-wizard/MealLoggingService'

// Core Components
import AIDailyGoals from './components/AIDailyGoals'
import PlanWithCoachSection from './components/PlanWithCoachSection'
import AIQuickActions from './components/AIQuickActions'
import MealLibrarySection from './components/MealLibrarySection'
import AIWeekPlanner from './components/AIWeekPlanner'
import MealSetupWizard from './components/wizard/MealSetupWizard'
import MealPhotoSlider from './components/MealPhotoSlider'
import MealPhotoNav from './components/MealPhotoNav'

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
  const [mealLoggingService, setMealLoggingService] = useState(null)
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
    quickIntake: false,
    customMeal: false,
    history: false,
    mealBase: false,
    favorites: false,
    shopping: false,
    recipes: false,
    supplements: false, // ✅ NIEUW
    weekOverview: false // ✅ NIEUW
  })
  
  // Initialize MealLoggingService
  useEffect(() => {
    if (db?.supabase) {
      const loggingService = new MealLoggingService(db.supabase)
      setMealLoggingService(loggingService)
      console.log('✅ MealLoggingService initialized')
    }
  }, [db])
  
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
  
  const handleUpdateWater = async (milliliters) => {
    try {
      await service.updateAIWaterIntake(client.id, milliliters)
      setDashboardData(prev => ({
        ...prev,
        waterIntake: milliliters
      }))
    } catch (error) {
      console.error('Failed to update water:', error)
    }
  }
  
  const handleMoodLog = async (moodData) => {
    try {
      const result = await service.logAIMood(client.id, moodData)
      setDashboardData(prev => ({
        ...prev,
        mood: result
      }))
      return result
    } catch (error) {
      console.error('Failed to log mood:', error)
      return null
    }
  }
  
  const handleQuickIntake = async (intakeData) => {
    console.log('🍽️ [OPTIMISTIC] Quick Intake:', intakeData)
    
    setDashboardData(prev => {
      const newConsumed = {
        calories: prev.dailyTotals.consumed.calories + intakeData.calories,
        protein: prev.dailyTotals.consumed.protein + intakeData.protein,
        carbs: prev.dailyTotals.consumed.carbs + intakeData.carbs,
        fat: prev.dailyTotals.consumed.fat + intakeData.fat
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
    
    try {
      await service.logManualIntake(
        client.id, 
        dashboardData.activePlan?.id,
        intakeData
      )
      console.log('✅ [OPTIMISTIC] Quick Intake saved to DB')
    } catch (error) {
      console.error('❌ [OPTIMISTIC] Quick Intake failed, reverting...', error)
      await loadDashboardData()
      throw error
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
  
  const handleFinishMeal = async (meal) => {
    await handleCheckMeal(meal.slot, meal)
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

  const handleWizardComplete = async (planData) => {
    setShowWizard(false)
    await loadDashboardData()
  }

  const handleOpenFavorites = () => {
    setModals(prev => ({ ...prev, favorites: true }))
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
          border: '4px solid rgba(16, 185, 129, 0.2)',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }
  
  if (!dashboardData?.activePlan) {
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
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '1rem'
          }}>
            Geen actief meal plan
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem',
            lineHeight: 1.6
          }}>
            Je coach heeft nog geen AI meal plan voor je aangemaakt.
          </p>
          
          <button
            onClick={() => onNavigate('home')}
            style={{
              marginTop: '2rem',
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
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
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingTop: 0,
      paddingBottom: isMobile ? '6rem' : '2rem',
      animation: 'fadeIn 0.5s ease'
    }}>
      
      {/* Challenge Sidebar - Floating Widget */}
      <MealChallengeSidebar client={client} db={db} />

      {/* ✅ 1. MACRO DOELEN + DAY SCHEDULE + NEXT MEAL (all inside AIDailyGoals) */}
      <AIDailyGoals
        client={client}
        db={db}
        dailyTotals={dashboardData.dailyTotals || {
          targets: {
            calories: client.target_calories || 0,
            protein: client.target_protein || 0,
            carbs: client.target_carbs || 0,
            fat: client.target_fat || 0   
          },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          percentages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          mealsConsumed: 0,
          mealsPlanned: dashboardData.todayMeals?.length || 0
        }}
        waterIntake={dashboardData.waterIntake || 0}
        todayMood={dashboardData.mood}
        onUpdateWater={handleUpdateWater}
        onLogMood={handleMoodLog}
        onMealLogged={handleMealLogged}
        onQuickIntake={handleQuickIntake}
        activePlan={dashboardData.activePlan}
        todayMeals={dashboardData.todayMeals || []}
        todayProgress={dashboardData.todayProgress}
        onCheckMeal={handleCheckMeal}
        onUncheckMeal={handleUncheckMeal}
        onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
        onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
        dayTemplates={dayTemplates}
        clients={[client]}
        onPlanUpdate={loadDashboardData}
        onNavigateToDay={handleDayChange}
        selectedDay={selectedDay}
        nextMeal={dashboardData.nextMeal}
        onFinishMeal={handleFinishMeal}
      />

      {/* ✅ 2. MEAL PHOTO NAVIGATION */}
      <div id="meal-photo-nav">
        <MealPhotoNav
          onActionClick={(actionId) => {
            switch(actionId) {
              case 'schedule':
                setShowWeekPlanner(!showWeekPlanner)
                break
              case 'shopping':
                onNavigate('boodschappen')
                break
              case 'custom':
                setShowWizard(true)
                break
              case 'history':
                setModals(prev => ({ ...prev, history: true }))
                break
              case 'swap':
                handleOpenFavorites()
                break
              case 'stats':
                alert('Week statistieken komen binnenkort!')
                break
            }
          }}
        />
      </div>

      {/* ✅ SUPPLEMENT ADVIES - Subtle row matching dashboard style */}
      <div style={{
        padding: isMobile ? '0 1rem' : '0 2rem',
        maxWidth: '1400px',
        margin: '0.75rem auto 0'
      }}>
        <button
          onClick={() => setModals(prev => ({ ...prev, supplements: true }))}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            background: 'rgba(23, 23, 23, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: isMobile ? '12px' : '16px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
            }
          }}
        >
          {/* Icon container */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1rem'
          }}>
            💊
          </div>
          
          {/* Label */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '1px'
            }}>
              Supplement Plan
            </span>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 600
            }}>
              Bekijk supplement advies
            </span>
          </div>
          
          {/* Chevron */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* ✅ WEEKOVERZICHT - Subtle row matching dashboard style */}
      <div style={{
        padding: isMobile ? '0 1rem' : '0 2rem',
        maxWidth: '1400px',
        margin: '0.5rem auto 0'
      }}>
        <button
          onClick={() => setModals(prev => ({ ...prev, weekOverview: true }))}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            background: 'rgba(23, 23, 23, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: isMobile ? '12px' : '16px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
            }
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1rem'
          }}>
            📊
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '1px'
            }}>
              Voeding Overzicht
            </span>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 600
            }}>
              Weekoverzicht bekijken
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* ✅ NIEUW: Client Documents (PDF viewer, read-only) */}
      <div style={{ padding: isMobile ? '0 1rem' : '0 2rem', maxWidth: '1400px', margin: '0.5rem auto 0' }}>
        <ClientDocumentsSection
          db={db} clientId={client.id} coachId={null}
          isMobile={isMobile} isClientView={true}
        />
      </div>

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
