// src/modules/meal-plan/AIMealDashboard.jsx
import React, { useState, useEffect } from 'react'
import AIMealPlanService from './AIMealPlanService'

// Core Components
import AIDailyGoals from './components/AIDailyGoals'
import AINextMeal from './components/AINextMeal'
import AIDaySchedule from './components/AIDaySchedule'
import AIQuickActions from './components/AIQuickActions'
import MealLibrarySection from './components/MealLibrarySection'
import AIWeekPlanner from './components/AIWeekPlanner'
import MealSetupWizard from './components/MealSetupWizard'

// Challenge Banner
import MealChallengeBanner from '../../client/components/MealChallengeBanner'

// Modals
import AIAlternativesModal from './components/AIAlternativesModal'
import AIMealInfoModal from './components/AIMealInfoModal'
import AIFavoritesModal from './components/AIFavoritesModal'
import AIMealHistoryModal from './components/AIMealHistoryModal'
import CustomMealBuilder from '../custom-meals/CustomMealBuilder'

// Video Widget
import PageVideoWidget from '../videos/PageVideoWidget'

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
    quickIntake: false,
    customMeal: false,
    history: false,
    mealBase: false,
    favorites: false,
    shopping: false,
    recipes: false
  })
  
  useEffect(() => {
    if (client?.id) {
      loadDashboardData()
      loadTemplates()
      checkFirstTimeSetup()
    }
  }, [client])
  
  const checkFirstTimeSetup = async () => {
    try {
      const { data } = await db.supabase
        .from('clients')
        .select('has_completed_meal_setup')
        .eq('id', client.id)
        .single()
      
      // Auto-open wizard if first time
      if (!data?.has_completed_meal_setup) {
        setShowWizard(true)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
    }
  }
  
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
    setLoading(true)
    
    try {
      const data = await service.loadAIDashboardData(client.id)
      
      if (data.dailyTotals && data.activePlan) {
        const planTargets = {
          calories: data.activePlan.daily_calories || 2200,
          protein: data.activePlan.daily_protein || 165,
          carbs: data.activePlan.daily_carbs || 220,
          fat: data.activePlan.daily_fat || 73
        }
        
        data.dailyTotals.targets = planTargets
        
        data.dailyTotals.percentages = {
          calories: Math.round((data.dailyTotals.consumed.calories / planTargets.calories) * 100),
          protein: Math.round((data.dailyTotals.consumed.protein / planTargets.protein) * 100),
          carbs: Math.round((data.dailyTotals.consumed.carbs / planTargets.carbs) * 100),
          fat: Math.round((data.dailyTotals.consumed.fat / planTargets.fat) * 100)
        }
      }
      
      if (!data.nextMeal && data.todayMeals?.length > 0) {
        const unconsumedMeal = data.todayMeals.find(meal => !meal.isConsumed)
        if (unconsumedMeal) {
          data.nextMeal = unconsumedMeal
        }
      }
      
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setDashboardData({
        activePlan: null,
        todayMeals: [],
        nextMeal: null,
        todayProgress: null,
        dailyTotals: {
          targets: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
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
  
  const handleQuickIntake = async (intakeData) => {
    try {
      await service.logManualIntake(
        client.id, 
        dashboardData.activePlan?.id,
        intakeData
      )
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to log manual intake:', error)
    }
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
  
  const handleDayChange = (day) => {
    setSelectedDay(day)
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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <div style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            AI Meal Dashboard laden...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  if (!dashboardData?.activePlan) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        padding: isMobile ? '2rem 1rem' : '4rem 2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <span style={{ fontSize: '3rem' }}>🍽️</span>
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: 'white',
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
      
      <div style={{ padding: isMobile ? '1rem 1rem 0' : '1.5rem 1.5rem 0' }}>
        <MealChallengeBanner client={client} db={db} />
      </div>
      
      <AIDailyGoals
        dailyTotals={dashboardData.dailyTotals || {
          targets: { calories: 2200, protein: 165, carbs: 220, fat: 73 },
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          percentages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          mealsConsumed: 0,
          mealsPlanned: dashboardData.todayMeals?.length || 0
        }}
        waterIntake={dashboardData.waterIntake || 0}
        todayMood={dashboardData.mood}
        onUpdateWater={handleUpdateWater}
        onLogMood={handleMoodLog}
        onQuickIntake={handleQuickIntake}
        db={db}
      />
      
      <AINextMeal
        nextMeal={dashboardData.nextMeal}
        todayMeals={dashboardData.todayMeals || []}
        onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
        onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
        onFinishMeal={handleFinishMeal}
        onOpenDaySchedule={() => {
          document.getElementById('day-schedule')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }}
        db={db}
      />
      
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
      
      {showWeekPlanner && (
        <AIWeekPlanner
          activePlan={dashboardData.activePlan}
          client={client}
          db={db}
          onWeekUpdated={loadDashboardData}
          dailyTotals={dashboardData.dailyTotals}
        />
      )}
      
      <MealLibrarySection
        client={client}
        db={db}
        onMealCreated={loadDashboardData}
      />
      
      <div style={{
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="nutrition"
          title="Voeding & Meal Prep Video's"
          compact={true}
        />
      </div>
      
      <div id="day-schedule">
        {dashboardData.todayMeals && dashboardData.todayMeals.length > 0 && (
          <AIDaySchedule
            todayMeals={dashboardData.todayMeals}
            todayProgress={dashboardData.todayProgress}
            activePlan={dashboardData.activePlan}
            selectedDay={selectedDay}
            dayTemplates={dayTemplates}
            onDayChange={handleDayChange}
            onCheckMeal={handleCheckMeal}
            onUncheckMeal={handleUncheckMeal}
            onOpenInfo={(meal) => setModals(prev => ({ ...prev, info: meal }))}
            onOpenAlternatives={(meal) => setModals(prev => ({ ...prev, alternatives: meal }))}
            db={db}
          />
        )}
      </div>
      
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
      
      {showWizard && (
        <MealSetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            loadDashboardData()
          }}
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
      `}</style>
    </div>
  )
}
