// src/modules/meal-plan/MealPlanMain.jsx
import React, { useState, useEffect, useRef } from 'react'
import MealPlanService from './MealPlanService'

// Import nieuwe componenten
import TimelineProgress from './components/TimelineProgress'
import MealGoalCard from './components/MealGoalCard'
import QuickActions from './components/QuickActions'
import WaterTracker from './components/WaterTracker'
import NextMealCard from './components/NextMealCard'
import MealListToday from './components/MealListToday'
import MealNavigation from './components/MealNavigation'

// Import Video Widget
import PageVideoWidget from '../../modules/videos/PageVideoWidget'

// Import modals
import MealSwapModal from './components/MealSwapModal'
import RecipeDetailModal from './components/RecipeDetailModal'
import CustomMealModal from './components/CustomMealModal'
import HistoryModal from './components/HistoryModal'

export default function MealPlanMain({ client, onNavigate, db }) {
  const [service] = useState(() => new MealPlanService(db))
  const waterSaveTimeout = useRef(null)
  const mealSaveTimeout = useRef(null)
  const isMobile = window.innerWidth <= 768
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  
  // State
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState({
    plan: null,
    meals: [],
    allMeals: [],
    customMeals: [],
    targets: service.getDefaultTargets(),
    favorites: [],
    history: []
  })
  
  const [checkedMeals, setCheckedMeals] = useState({})
  const [waterIntake, setWaterIntake] = useState(0)
  
  // Modals
  const [modals, setModals] = useState({
    swap: null,
    detail: null,
    custom: false,
    history: false
  })
  
  // Load data + Scroll indicator management
  useEffect(() => {
    if (client?.id) loadData()
    
    // Hide scroll indicator when user scrolls
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [client])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const result = await service.loadMealPlanData(client.id)
      setData(result)
      setCheckedMeals(result.todayProgress || {})
      setWaterIntake(result.waterIntake || 0)
    } catch (error) {
      console.error('Error loading meal plan:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Auto-save handlers
  const autoSaveMealProgress = async (newCheckedMeals) => {
    if (mealSaveTimeout.current) clearTimeout(mealSaveTimeout.current)
    setIsSaving(true)
    
    mealSaveTimeout.current = setTimeout(async () => {
      try {
        await service.saveMealProgress(client.id, data.plan, data.meals, newCheckedMeals)
        const history = await db.getMealHistory(client.id, 30)
        setData(prev => ({ ...prev, history }))
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }
  
  const autoSaveWater = async (newAmount) => {
    if (waterSaveTimeout.current) clearTimeout(waterSaveTimeout.current)
    setIsSaving(true)
    
    waterSaveTimeout.current = setTimeout(async () => {
      try {
        await service.updateWaterIntake(client.id, newAmount)
      } catch (error) {
        console.error('Water save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }
  
  // Meal handlers
  const handleToggleMeal = (idx) => {
    const newChecked = { ...checkedMeals, [idx]: !checkedMeals[idx] }
    setCheckedMeals(newChecked)
    autoSaveMealProgress(newChecked)
  }
  
  const handleToggleFavorite = async (mealId) => {
    const result = await service.toggleFavorite(client.id, mealId, data.favorites)
    if (result) {
      setData(prev => ({
        ...prev,
        favorites: result.nutrition_info?.favorite_meals || []
      }))
    }
  }
  
  const handleSwapMeal = async (newMeal) => {
    if (!modals.swap || !data.plan) return
    
    const mealIndex = data.meals.findIndex(m => 
      m.id === modals.swap.id && m.timeSlot === modals.swap.timeSlot
    )
    
    if (mealIndex === -1) return
    
    setIsSaving(true)
    
    const newMeals = [...data.meals]
    newMeals[mealIndex] = {
      ...newMeal,
      timeSlot: modals.swap.timeSlot,
      plannedTime: modals.swap.plannedTime,
      targetKcal: modals.swap.targetKcal
    }
    setData(prev => ({ ...prev, meals: newMeals }))
    
    const today = new Date()
    const startDate = data.plan.start_date ? new Date(data.plan.start_date) : new Date()
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) % 7
    
    await service.swapMeal(client.id, data.plan, dayIndex, modals.swap.timeSlot, newMeal.id)
    setModals(prev => ({ ...prev, swap: null }))
    setIsSaving(false)
  }
  
  const handleSaveCustomMeal = async (mealData) => {
    const saved = await service.saveCustomMeal(client.id, mealData)
    if (saved) {
      setData(prev => ({
        ...prev,
        customMeals: [...prev.customMeals, saved],
        allMeals: [...prev.allMeals, saved]
      }))
      setModals(prev => ({ ...prev, custom: false }))
      
      if (modals.swap) {
        handleSwapMeal(saved)
      }
    }
  }
  
  // Calculations
  const progress = service.calculateProgress(data.meals, checkedMeals)
  const nextMeal = service.getNextMeal(data.meals, checkedMeals)
  
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
          width: '60px',
          height: '60px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingBottom: isMobile ? '5rem' : '2rem',
      animation: 'fadeIn 0.5s ease'
    }}>
      {/* Save Indicator */}
      {isSaving && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '8px 12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          zIndex: 9999
        }}>
          <span style={{ color: '#10b981', fontSize: '0.75rem' }}>
            Opslaan...
          </span>
        </div>
      )}
      
      {/* 1. MealGoalCard - Met water functie */}
      <MealGoalCard
        progress={progress}
        targets={data.targets}
        plan={data.plan}
        waterIntake={waterIntake}
        onAddWater={(amount) => {
          setWaterIntake(amount)
          autoSaveWater(amount)
        }}
      />

      {/* 2. Video Widget - Coach Video's voor Voeding */}
      <div style={{ 
        paddingTop: isMobile ? '1rem' : '1.5rem',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        paddingBottom: '0.5rem',
        position: 'relative',
        zIndex: 10,
        marginBottom: '0.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="nutrition"
          title="Voeding & Meal Prep Video's"
          compact={true}
        />
      </div>
      
      {/* 3. Next Meal Card - Volgende maaltijd highlight met tijdlijn */}
      <NextMealCard 
        nextMeal={nextMeal}
        meals={data.meals}
        checkedMeals={checkedMeals}
        onMealClick={(meal) => setModals(prev => ({ ...prev, detail: meal }))}
        onSwapMeal={(meal) => setModals(prev => ({ ...prev, swap: meal }))}
      />
      
      {/* 4. Today's Meals (vandaags planning) */}
      <MealListToday
        meals={data.meals}
        checkedMeals={checkedMeals}
        favorites={data.favorites}
        onToggleMeal={handleToggleMeal}
        onSwapMeal={(meal) => setModals(prev => ({ ...prev, swap: meal }))}
        onDetailMeal={(meal) => setModals(prev => ({ ...prev, detail: meal }))}
        onToggleFavorite={handleToggleFavorite}
      />
      
      {/* 5. Quick Actions */}
      <QuickActions
        onAddCustom={() => setModals(prev => ({ ...prev, custom: true }))}
        onShowHistory={() => setModals(prev => ({ ...prev, history: true }))}
        onNavigate={onNavigate}
      />
      
      {/* 6. Timeline Progress - Nu geïntegreerd in NextMealCard */}
      {/* TimelineProgress is verplaatst naar NextMealCard voor betere UI */}
      
      {/* Modals */}
      <MealSwapModal
        isOpen={!!modals.swap}
        onClose={() => setModals(prev => ({ ...prev, swap: null }))}
        currentMeal={modals.swap}
        onSelectMeal={handleSwapMeal}
        allMeals={data.allMeals}
        favorites={data.favorites}
        customMeals={data.customMeals}
        onCreateCustom={() => setModals(prev => ({ ...prev, swap: null, custom: true }))}
      />
      
      <RecipeDetailModal
        meal={modals.detail}
        isOpen={!!modals.detail}
        onClose={() => setModals(prev => ({ ...prev, detail: null }))}
        onSave={(adjustedMacros) => {
          console.log('Adjusted macros:', adjustedMacros)
          setModals(prev => ({ ...prev, detail: null }))
        }}
      />
      
      <CustomMealModal
        isOpen={modals.custom}
        onClose={() => setModals(prev => ({ ...prev, custom: false }))}
        onSave={handleSaveCustomMeal}
        client={client}
      />
      
      <HistoryModal
        isOpen={modals.history}
        onClose={() => setModals(prev => ({ ...prev, history: false }))}
        historyData={data.history}
        targets={data.targets}
        db={db}
        clientId={client?.id}
      />
      
      {/* Bottom Navigation */}
      <MealNavigation
        activePage="meals"
        onNavigate={onNavigate}
        onShowHistory={() => setModals(prev => ({ ...prev, history: false }))}
      />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInOut {
          0%, 100% { 
            opacity: 0;
            transform: translateY(10px);
          }
          20%, 80% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scrollBounce {
          0%, 100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) translateY(12px);
            opacity: 0.5;
          }
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
