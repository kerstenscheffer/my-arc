// src/modules/meal-plan/AIMealDashboard.jsx
// ✅ FIXED - Quick Intake & Meal Logging now properly reload dashboard data with timing guarantee
import React, { useState, useEffect } from 'react'
import AIMealPlanService from './AIMealPlanService'
import MealLoggingService from '../meal-logging-wizard/MealLoggingService'

// Core Components
import AIDailyGoals from './components/AIDailyGoals'
import PlanWithCoachSection from './components/PlanWithCoachSection'
import AINextMeal from './components/AINextMeal'
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
    recipes: false
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
        // ✅ Use client's target values directly from clients table
        const planTargets = {
          calories: client.target_calories || 0,
          protein: client.target_protein || 0,
          carbs: client.target_carbs || 0,
          fat: client.target_fat || 0
        }
        
        data.dailyTotals.targets = planTargets
        
        // Calculate percentages (prevent division by zero)
        data.dailyTotals.percentages = {
          calories: planTargets.calories > 0 ? Math.round((data.dailyTotals.consumed.calories / planTargets.calories) * 100) : 0,
          protein: planTargets.protein > 0 ? Math.round((data.dailyTotals.consumed.protein / planTargets.protein) * 100) : 0,
          carbs: planTargets.carbs > 0 ? Math.round((data.dailyTotals.consumed.carbs / planTargets.carbs) * 100) : 0,
          fat: planTargets.fat > 0 ? Math.round((data.dailyTotals.consumed.fat / planTargets.fat) * 100) : 0
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
      // ✅ Use client's actual target values in error fallback
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
  
  // ✅ FIXED: Quick Intake with proper reload timing
  const handleQuickIntake = async (intakeData) => {
    console.log('🍽️ [AIMealDashboard] handleQuickIntake called with:', intakeData)
    try {
      await service.logManualIntake(
        client.id, 
        dashboardData.activePlan?.id,
        intakeData
      )
      
      console.log('⏳ [AIMealDashboard] Waiting for database write to complete...')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log('🔄 [AIMealDashboard] Reloading dashboard data...')
      await loadDashboardData()
      
      console.log('✅ [AIMealDashboard] Quick Intake complete, dashboard refreshed')
    } catch (error) {
      console.error('❌ [AIMealDashboard] Quick Intake failed:', error)
      throw error
    }
  }

  // ✅ FIXED: Meal logged with proper reload timing
  const handleMealLogged = async (loggedData) => {
    console.log('✅ [AIMealDashboard] Meal logged:', loggedData)
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('🔄 [AIMealDashboard] Reloading dashboard data...')
    await loadDashboardData()
    
    console.log('✅ [AIMealDashboard] Dashboard refreshed after meal log')
  }
  
  const handleCheckMeal = async (slot, mealData) => {
    try {
      await service.checkAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot,
        mealData
      )
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to check meal:', error)
    }
  }
  
  const handleUncheckMeal = async (slot) => {
    try {
      await service.uncheckAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        slot
      )
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to uncheck meal:', error)
    }
  }
  
  const handleFinishMeal = async (meal) => {
    try {
      await service.checkAIMeal(
        client.id,
        dashboardData.activePlan?.id,
        meal.slot,
        meal
      )
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to finish meal:', error)
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
      paddingBottom: isMobile ? '6rem' : '2rem',
      animation: 'fadeIn 0.5s ease'
    }}>
      
      {/* Challenge Sidebar - Floating Widget */}
      <MealChallengeSidebar client={client} db={db} />


      {/* 4. FOTO SLIDER */}
      <MealPhotoSlider />
  



{/* 1. DAGELIJKSE DOELEN */}
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
  onMealLogged={loadDashboardData}  // ✅ FIXED: Added this line
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
/>

      {/* 2. VOLGENDE MAALTIJD */}
      <AINextMeal
        nextMeal={dashboardData.nextMeal}
        todayMeals={dashboardData.todayMeals || []}
        onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
        onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
        onFinishMeal={handleFinishMeal}
        onOpenDaySchedule={() => {
          console.log('Day schedule is now modal-only')
        }}
        db={db}
      />



     

{/* 5. MEAL PHOTO NAVIGATION */}
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


      {/* 5. QUICK ACTIONS */}
      <div id="quick-actions">
        <AIQuickActions
          db={db}
          client={client}
          clientId={client.id}
          onOpenFavorites={handleOpenFavorites}
          onOpenHistory={() => setModals(prev => ({ ...prev, history: true }))}
          onOpenMealBase={() => alert('Meal database komt binnenkort!')}
          onOpenShopping={() => onNavigate('shopping')}
          onOpenRecipes={() => onNavigate('recipe-library')}
          onMealCreated={() => loadDashboardData()}
          onOpenWeekPlanner={() => setShowWeekPlanner(!showWeekPlanner)}
          onOpenWizard={() => setShowWizard(true)}
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
      
      {/* Video Widget */}
      <div style={{
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="meals"
          title="Voeding & Meal Prep Video's"
          compact={true}
        />
      </div>
      
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
