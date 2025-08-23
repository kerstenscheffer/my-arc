// src/client/pages/ClientMealPlan.jsx - SALE-READY PERFECT VERSION
import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  getClientPlanWithOverrides, 
  fetchMealsByIds, 
  getMeals,
  listMealsNearCalories,
  saveClientMealSwap
} from '../../lib/mealplanDatabase'
import { useLanguage } from '../../contexts/LanguageContext'

// Utility functions
function formatDate(d) {
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function addDays(date, n) {
  const x = new Date(date)
  x.setDate(x.getDate() + n)
  return x
}

function sumMacros(list) {
  return list.reduce((acc, m) => {
    const kcal = m?.kcal || 0
    const p = m?.protein || 0
    const c = m?.carbs || 0
    const f = m?.fat || 0
    return { kcal: acc.kcal + kcal, protein: acc.protein + p, carbs: acc.carbs + c, fat: acc.fat + f }
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 })
}

// 🎯 Portion Calculator for scaled macros
const PortionCalculator = {
  calculateScaledPortion(meal, targetKcal) {
    if (!meal.kcal || meal.kcal <= 0) return { newPortion: meal.default_portion || '1 portie', scaledMacros: meal }
    
    const scalingFactor = Math.max(0.5, Math.min(8.0, targetKcal / meal.kcal))
    
    return {
      newPortion: `${Math.round(scalingFactor * 100)}% portie`,
      scaledMacros: {
        kcal: Math.round(meal.kcal * scalingFactor),
        protein: Math.round((meal.protein || 0) * scalingFactor),
        carbs: Math.round((meal.carbs || 0) * scalingFactor),
        fat: Math.round((meal.fat || 0) * scalingFactor)
      }
    }
  }
}

// 🎨 Macro Summary Component with MY ARC styling
function MacroSummary({ kcal, protein, carbs, fat }) {
  const macroIcons = {
    kcal: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_17_.png",
    protein: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_17_.png",
    carbs: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_17_.png",
    fat: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_17_.png"
  }

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      fontSize: '0.75rem',
      color: '#10b981',
      fontWeight: 'bold'
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.kcal} alt="kcal" style={{ width: '12px', height: '12px' }} />
        {Math.round(kcal)}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.protein} alt="protein" style={{ width: '12px', height: '12px' }} />
        {Math.round(protein)}P
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.carbs} alt="carbs" style={{ width: '12px', height: '12px' }} />
        {Math.round(carbs)}C
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <img src={macroIcons.fat} alt="fat" style={{ width: '12px', height: '12px' }} />
        {Math.round(fat)}F
      </span>
    </div>
  )
}

// 🎯 Progress Bar Component
function ProgressBar({ current, target, label }) {
  const progress = Math.min(100, (current / target) * 100)
  const getColor = () => {
    if (progress >= 90) return '#10b981' // Green
    if (progress >= 70) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.25rem'
      }}>
        <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {label}
        </span>
        <span style={{ color: getColor(), fontSize: '0.75rem', fontWeight: 'bold' }}>
          {Math.round(current)} / {target} ({Math.round(progress)}%)
        </span>
      </div>
      <div style={{
        background: '#2a2a2a',
        borderRadius: '10px',
        height: '8px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          background: `linear-gradient(90deg, ${getColor()} 0%, ${getColor()}dd 100%)`,
          height: '100%',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
          borderRadius: '10px'
        }} />
      </div>
    </div>
  )
}

export default function ClientMealPlan({ client }) {
  const { t } = useLanguage?.() || { t: (x) => x }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [plan, setPlan] = useState(null)
  const [weekStructure, setWeekStructure] = useState([])
  const [mealsMap, setMealsMap] = useState({})

  const [activeWeek, setActiveWeek] = useState(0)
  const [showDay, setShowDay] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [swapSlot, setSwapSlot] = useState(null)
  const [swapSuggestions, setSwapSuggestions] = useState([])
  const [eatenMeals, setEatenMeals] = useState(new Set())

  const [dailyKcalTarget, setDailyKcalTarget] = useState(2400)
  const [showTargetModal, setShowTargetModal] = useState(false)

  // Drag & Drop states with enhanced feedback
  const [draggedMeal, setDraggedMeal] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [dragFeedback, setDragFeedback] = useState('')

  // Add-meal picker
  const [mealPicker, setMealPicker] = useState(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchDebounce = useRef(null)

  // Mobile detection
  const isMobile = window.innerWidth <= 768

  // 🎯 DAILY MACRO TARGETS with smart calculation
  const dailyTargets = useMemo(() => {
    const kcal = dailyKcalTarget || 2400
    return {
      kcal,
      protein: Math.round(kcal * 0.25 / 4), // 25% protein, 4 kcal/g
      carbs: Math.round(kcal * 0.45 / 4),   // 45% carbs, 4 kcal/g
      fat: Math.round(kcal * 0.30 / 9)      // 30% fat, 9 kcal/g
    }
  }, [dailyKcalTarget])

  // 🎯 MEAL SLOT TARGETS for intelligent portioning
  const getMealSlotTarget = (slotIndex, totalSlots) => {
    const distributions = [0.25, 0.15, 0.30, 0.10, 0.35, 0.10] // breakfast, snack, lunch, snack, dinner, snack
    const targetRatio = distributions[slotIndex] || (1.0 / totalSlots)
    return Math.round(dailyKcalTarget * targetRatio)
  }

  // Video + notes from coach
  const videoUrl = plan?.coach_video_url || 'https://cdn.coverr.co/videos/coverr-healthy-fresh-salad-6179/1080p.mp4'
  const notes = plan?.coach_notes || 'Welkom bij jouw voedingsplan! Bewerk je maaltijden door op "Bewerk mijn mealplan" te klikken.'

  // Load meal plan on mount
  useEffect(() => {
    loadMealPlan()
  }, [client?.id])

  // Load search results with improved debouncing
  useEffect(() => {
    if (!mealPicker && !editMode) return
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await getMeals({ q: search || '', tags: [], limit: 100 })
        setSearchResults(results || [])
      } catch (e) {
        console.error('Search error:', e)
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(searchDebounce.current)
  }, [search, mealPicker, editMode])

  const loadMealPlan = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📋 Loading plan for client:', client.id)
      
      const { plan: p, mergedWeekStructure } = await getClientPlanWithOverrides(client.id)
      
      if (!p) {
        setPlan(null)
        setWeekStructure([])
        return
      }
      
      setPlan(p)
      
      // Ensure 28 days structure
      const padded = [...(Array.isArray(mergedWeekStructure) ? mergedWeekStructure : [])]
      while (padded.length < 28) {
        padded.push({ day: `Day ${padded.length + 1}`, meals: [] })
      }
      setWeekStructure(padded)
      
      // Load all meals data
      const mealIds = padded.flatMap(d => 
        (d?.meals || []).map(m => m.meal_id).filter(Boolean)
      )
      const uniqueIds = [...new Set(mealIds)]
      
      if (uniqueIds.length) {
        const meals = await fetchMealsByIds(uniqueIds)
        const map = Object.fromEntries(meals.map(m => [m.id, m]))
        setMealsMap(map)
      }

      if (p.targets?.kcal) {
        setDailyKcalTarget(p.targets.kcal)
      }
      
    } catch (e) {
      console.error('Load plan error:', e)
      setError(e.message || 'Er ging iets mis bij het laden van je voedingsplan')
    } finally {
      setLoading(false)
    }
  }

  // Open day detail view
  const openDay = (weekIndex, dayIndex) => {
    const absoluteIndex = weekIndex * 7 + dayIndex
    const day = weekStructure[absoluteIndex]
    setShowDay({ index: absoluteIndex, day })
  }

  // Add meal to day with smart slot assignment
  async function addMealToDay(meal) {
    if (!mealPicker || !plan) return
    
    try {
      const dayIndex = mealPicker.dayIndex
      const updated = [...weekStructure]
      const d = updated[dayIndex] || { day: `Day ${dayIndex + 1}`, meals: [] }
      const currentSlots = (d.meals || []).map(m => m.slot)
      
      const slotNames = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
      let nextSlot = 'breakfast'
      
      for (const slotName of slotNames) {
        if (!currentSlots.includes(slotName)) {
          nextSlot = slotName
          break
        }
      }
      
      if (currentSlots.includes(nextSlot)) {
        nextSlot = `slot_${currentSlots.length + 1}`
      }
      
      const targetKcal = getMealSlotTarget(currentSlots.length, 4)
      
      d.meals = [...(d.meals || []), { 
        slot: nextSlot, 
        meal_id: meal.id,
        target_kcal: targetKcal 
      }]
      updated[dayIndex] = d
      setWeekStructure(updated)
      setMealsMap(prev => ({ ...prev, [meal.id]: meal }))

      await saveClientMealSwap({ 
        plan_id: plan.id, 
        client_id: client.id, 
        day_index: dayIndex, 
        slot: nextSlot, 
        meal_id: meal.id 
      })
      
      setMealPicker(null)
      setSearch('')
      setSearchResults([])
    } catch (e) {
      console.error('Add meal failed:', e)
      setError(e.message || 'Kon maaltijd niet toevoegen')
    }
  }

  // Enhanced Drag & Drop handlers with visual feedback
  const handleDragStart = (meal) => {
    setDraggedMeal(meal)
    setDragFeedback(`Sleep "${meal.name}" naar een dag`)
  }

  const handleDragOver = (e, dayIndex) => {
    e.preventDefault()
    setDragOverDay(dayIndex)
    setDragFeedback(`Laat "${draggedMeal?.name}" los op deze dag`)
  }

  const handleDragLeave = () => {
    setDragOverDay(null)
    setDragFeedback(draggedMeal ? `Sleep "${draggedMeal.name}" naar een dag` : '')
  }

  const handleDrop = async (e, dayIndex) => {
    e.preventDefault()
    
    if (draggedMeal && editMode) {
      try {
        const updated = [...weekStructure]
        const d = updated[dayIndex] || { day: `Day ${dayIndex + 1}`, meals: [] }
        const currentSlots = (d.meals || []).map(m => m.slot)
        
        const slotNames = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
        let nextSlot = 'breakfast'
        
        for (const slotName of slotNames) {
          if (!currentSlots.includes(slotName)) {
            nextSlot = slotName
            break
          }
        }
        
        if (currentSlots.includes(nextSlot)) {
          nextSlot = `slot_${currentSlots.length + 1}`
        }
        
        const targetKcal = getMealSlotTarget(currentSlots.length, 4)
        
        d.meals = [...(d.meals || []), { 
          slot: nextSlot, 
          meal_id: draggedMeal.id,
          target_kcal: targetKcal 
        }]
        updated[dayIndex] = d
        setWeekStructure(updated)
        setMealsMap(prev => ({ ...prev, [draggedMeal.id]: draggedMeal }))

        await saveClientMealSwap({ 
          plan_id: plan.id, 
          client_id: client.id, 
          day_index: dayIndex, 
          slot: nextSlot, 
          meal_id: draggedMeal.id 
        })

        setDragFeedback('✅ Maaltijd toegevoegd!')
        setTimeout(() => setDragFeedback(''), 2000)
      } catch (e) {
        console.error('Drop failed:', e)
        setError(e.message || 'Failed to add meal')
        setDragFeedback('❌ Fout bij toevoegen')
      }
    }
    
    setDraggedMeal(null)
    setDragOverDay(null)
  }

  // Touch meal handler for mobile
  const handleTouchMeal = async (meal, dayIndex) => {
    if (!editMode || !meal) return
    
    try {
      const updated = [...weekStructure]
      const d = updated[dayIndex] || { day: `Day ${dayIndex+1}`, meals: [] }
      const currentSlots = (d.meals||[]).map(m=>m.slot)
      
      const slotNames = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
      let nextSlot = 'breakfast'
      
      for (const slotName of slotNames) {
        if (!currentSlots.includes(slotName)) {
          nextSlot = slotName
          break
        }
      }
      
      if (currentSlots.includes(nextSlot)) {
        nextSlot = `slot_${currentSlots.length + 1}`
      }
      
      const targetKcal = getMealSlotTarget(currentSlots.length, 4)
      
      d.meals = [...(d.meals||[]), { 
        slot: nextSlot, 
        meal_id: meal.id,
        target_kcal: targetKcal 
      }]
      updated[dayIndex] = d
      setWeekStructure(updated)
      setMealsMap(prev => ({ ...prev, [meal.id]: meal }))

      await saveClientMealSwap({ 
        plan_id: plan.id, 
        client_id: client.id, 
        day_index: dayIndex, 
        slot: nextSlot, 
        meal_id: meal.id 
      })
    } catch (e) {
      console.error('Touch add failed:', e)
      setError(e.message || 'Failed to add meal')
    }
  }

  // Open swap modal with intelligent suggestions
  async function openSwap(dayIndex, slot, targetKcal) {
    setSwapSlot({ dayIndex, slot, targetKcal })
    try {
      const suggestions = await getMeals({ q: '', tags: [], limit: 50 })
      
      const sorted = suggestions
        .map(meal => ({
          ...meal,
          calorieDiff: Math.abs(meal.kcal - (targetKcal || 400))
        }))
        .sort((a, b) => a.calorieDiff - b.calorieDiff)
        .slice(0, 15)
      
      setSwapSuggestions(sorted)
    } catch (e) {
      console.error(e)
      setSwapSuggestions([])
    }
  }

  // Handle swap pick
  async function handleSwapPick(meal) {
    if (!swapSlot || !plan) return
    
    try {
      const { dayIndex, slot } = swapSlot
      const updated = [...weekStructure]
      const d = updated[dayIndex]
      
      if (d) {
        const idx = (d.meals || []).findIndex(m => m.slot === slot)
        if (idx !== -1) {
          d.meals[idx] = { ...d.meals[idx], meal_id: meal?.id || null }
        } else {
          d.meals = [...(d.meals || []), { slot, meal_id: meal?.id || null }]
        }
      }
      
      setWeekStructure(updated)
      if (meal?.id) setMealsMap(prev => ({ ...prev, [meal.id]: meal }))

      await saveClientMealSwap({ 
        plan_id: plan.id, 
        client_id: client.id, 
        day_index: dayIndex, 
        slot, 
        meal_id: meal?.id || null 
      })

      setSwapSlot(null)
      setSwapSuggestions([])
      
      if (showDay && showDay.index === dayIndex) {
        setShowDay({ ...showDay, day: updated[dayIndex] })
      }
    } catch (e) {
      console.error(e)
      setError(e.message || 'Wissel mislukt')
    }
  }

  // Toggle meal as eaten with visual feedback
  const toggleMealEaten = (mealId) => {
    const newEaten = new Set(eatenMeals)
    if (newEaten.has(mealId)) {
      newEaten.delete(mealId)
    } else {
      newEaten.add(mealId)
    }
    setEatenMeals(newEaten)
  }

  // Handle meal click for swapping
  const handleMealClick = (meal, dayIndex, slot) => {
    if (!editMode) return
    openSwap(dayIndex, slot, meal.kcal)
  }

  // Calculate weeks and enhanced week totals
  const weeks = []
  for (let w = 0; w < 4; w++) {
    weeks.push(weekStructure.slice(w * 7, (w + 1) * 7))
  }
  const currentWeek = weeks[activeWeek] || []
  const startDate = plan?.start_date ? new Date(plan.start_date) : new Date()
  const weekStart = addDays(startDate, activeWeek * 7)

  // 🎯 Calculate comprehensive week totals
  const weekTotals = useMemo(() => {
    const weekMeals = currentWeek.flatMap(day => 
      (day?.meals || []).map(m => {
        const meal = mealsMap[m.meal_id]
        if (!meal) return null
        
        // Apply portion scaling
        if (m.target_kcal && meal.kcal) {
          const scaled = PortionCalculator.calculateScaledPortion(meal, m.target_kcal)
          return { ...meal, ...scaled.scaledMacros }
        }
        
        return meal
      }).filter(Boolean)
    )
    return sumMacros(weekMeals)
  }, [currentWeek, mealsMap])

  // Weekly targets (7 days)
  const weeklyTargets = {
    kcal: dailyTargets.kcal * 7,
    protein: dailyTargets.protein * 7,
    carbs: dailyTargets.carbs * 7,
    fat: dailyTargets.fat * 7
  }

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ color: '#fff', fontSize: '2rem' }}>
            Voedingsplan laden...
          </h3>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '8px',
          color: '#fff',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #dc2626'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>❌ Er ging iets mis</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button 
            onClick={() => {
              setError(null)
              loadMealPlan()
            }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#fff',
              color: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
          <h3 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1rem' }}>
            Geen voedingsplan beschikbaar
          </h3>
          <p style={{ color: '#d1fae5', fontSize: '1.2rem' }}>
            Je trainer heeft nog geen voedingsplan voor je aangemaakt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* 🎯 Enhanced Header with Week Totals */}
      <div style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
          <h1 style={{ color: '#fff', fontSize: isMobile ? '1.8rem' : '2.5rem', margin: 0, fontWeight: 'bold' }}>
            🍽️ {plan.title || 'Mijn Voedingsplan'}
          </h1>
          <p style={{ color: '#d1fae5', marginTop: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}>
            Week {activeWeek + 1} • {formatDate(weekStart)} - {formatDate(addDays(weekStart, 6))}
          </p>
          
          {/* 📊 Week Progress Overview */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  📊 Week {activeWeek + 1} Totalen
                </div>
                <div style={{ color: '#d1fae5', fontSize: '0.9rem' }}>
                  {Math.round(weekTotals.kcal)} / {weeklyTargets.kcal} kcal deze week
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ color: '#d1fae5', fontSize: '0.875rem' }}>
                  Doel: {dailyKcalTarget} kcal/dag
                </div>
                <button
                  onClick={() => setShowTargetModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  ⚙️ Aanpassen
                </button>
              </div>
            </div>

            {/* Week Progress Bars */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '1rem'
            }}>
              <ProgressBar 
                current={weekTotals.kcal} 
                target={weeklyTargets.kcal} 
                label="Calorieën" 
              />
              <ProgressBar 
                current={weekTotals.protein} 
                target={weeklyTargets.protein} 
                label="Eiwit (g)" 
              />
              <ProgressBar 
                current={weekTotals.carbs} 
                target={weeklyTargets.carbs} 
                label="Koolhydr. (g)" 
              />
              <ProgressBar 
                current={weekTotals.fat} 
                target={weeklyTargets.fat} 
                label="Vet (g)" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🎥 Coach Video & Notes */}
      {(videoUrl || notes) && (
        <div style={{
          marginBottom: '2rem',
          background: '#1a1a1a',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: '1px solid #10b98133'
        }}>
          {videoUrl && (
            <video
              src={videoUrl}
              poster="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800"
              controls
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
            />
          )}
          {notes && (
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.2rem' }}>
                📝 Bericht van je trainer
              </h3>
              <p style={{ color: '#fff', lineHeight: '1.6', margin: 0 }}>
                {notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 📅 Week Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {[0, 1, 2, 3].map(weekIndex => (
          <button
            key={weekIndex}
            onClick={() => setActiveWeek(weekIndex)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeWeek === weekIndex 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#2a2a2a',
              color: '#fff',
              border: activeWeek === weekIndex 
                ? '1px solid #10b981'
                : '1px solid #10b98133',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: isMobile ? '0.875rem' : '1rem',
              boxShadow: activeWeek === weekIndex 
                ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
                : '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={e => {
              if (activeWeek !== weekIndex) {
                e.target.style.background = '#3a3a3a'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={e => {
              if (activeWeek !== weekIndex) {
                e.target.style.background = '#2a2a2a'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            Week {weekIndex + 1}
          </button>
        ))}
      </div>

      {/* ✏️ Enhanced Edit Mode Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '1rem',
        background: '#1a1a1a',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #10b98133'
      }}>
        <div>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {editMode ? '✏️ Bewerkmodus actief' : '👀 Bekijkmodus'}
          </span>
          {dragFeedback && (
            <div style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {dragFeedback}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setEditMode(!editMode)
            setDraggedMeal(null)
            setDragOverDay(null)
            setDragFeedback('')
          }}
          style={{
            padding: '0.75rem 1.5rem',
            background: editMode 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          {editMode ? 'Stop bewerken' : 'Bewerk mijn mealplan'}
        </button>
      </div>

      {/* 🥗 Available Meals for Drag & Drop (Edit Mode) */}
      {editMode && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              placeholder="Zoek maaltijden... (tip: typ 'ontbijt', 'lunch', 'diner')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#10b98133'}
            />
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.5rem',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '0.5rem',
            background: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #10b98133'
          }}>
            {searchResults.map((meal) => (
              <div
                key={meal.id}
                draggable={!isMobile}
                onDragStart={() => handleDragStart(meal)}
                onClick={() => isMobile && setDraggedMeal(meal)}
                style={{
                  padding: '0.75rem',
                  border: draggedMeal?.id === meal.id 
                    ? '2px solid #10b981' 
                    : '1px solid #10b98133',
                  borderRadius: '8px',
                  background: draggedMeal?.id === meal.id 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : '#2a2a2a',
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                  boxShadow: draggedMeal?.id === meal.id 
                    ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                    : '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => {
                  if (draggedMeal?.id !== meal.id) {
                    e.target.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                  }
                }}
                onMouseLeave={e => {
                  if (draggedMeal?.id !== meal.id) {
                    e.target.style.background = '#2a2a2a'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {meal.name}
                </div>
                <MacroSummary {...meal} />
                {isMobile && (
                  <div style={{ 
                    color: draggedMeal?.id === meal.id ? '#10b981' : '#9ca3af', 
                    fontSize: '0.75rem', 
                    marginTop: '0.5rem',
                    fontWeight: draggedMeal?.id === meal.id ? 'bold' : 'normal'
                  }}>
                    {draggedMeal?.id === meal.id ? '✅ Geselecteerd - tik op een dag om toe te voegen' : '👆 Tik om te selecteren'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📅 Enhanced Week Grid with Perfect Mobile Scroll */}
      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? 'none' : 'repeat(7, 1fr)',
        gap: '0.5rem',
        overflowX: isMobile ? 'auto' : 'visible',
        paddingBottom: isMobile ? '0.5rem' : '0',
        WebkitOverflowScrolling: 'touch',
        marginBottom: '2rem'
      }}>
        {currentWeek.map((day, i) => {
          const absoluteIndex = activeWeek * 7 + i
          const date = addDays(weekStart, i)
          const meals = (day?.meals || []).map(m => {
            const meal = mealsMap[m.meal_id]
            if (!meal) return null
            
            // Apply portion scaling based on target
            if (m.target_kcal && meal.kcal) {
              const scaled = PortionCalculator.calculateScaledPortion(meal, m.target_kcal)
              return { ...meal, ...scaled.scaledMacros, portion: scaled.newPortion, isScaled: true }
            }
            
            return meal
          }).filter(Boolean)
          
          const dayTotals = sumMacros(meals)
          const isToday = date.toDateString() === new Date().toDateString()
          
          // Progress towards daily target with enhanced color coding
          const kcalProgress = Math.min(100, (dayTotals.kcal / dailyTargets.kcal) * 100)

          return (
            <div 
              key={i}
              onDragOver={(e) => editMode && handleDragOver(e, absoluteIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => editMode && handleDrop(e, absoluteIndex)}
              onClick={() => {
                if (isMobile && editMode && draggedMeal) {
                  handleTouchMeal(draggedMeal, absoluteIndex)
                  setDraggedMeal(null)
                } else {
                  openDay(activeWeek, i)
                }
              }}
              style={{
                padding: '1rem',
                minHeight: '220px',
                minWidth: isMobile ? '140px' : 'auto',
                width: isMobile ? '140px' : 'auto',
                flex: isMobile ? '0 0 auto' : '1',
                border: isToday ? '2px solid #10b981' : '1px solid #10b98133',
                background: meals.length > 0 
                  ? 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)' 
                  : (dragOverDay === absoluteIndex 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : '#1a1a1a'),
                borderRadius: '8px',
                boxShadow: isToday 
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                  : '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={e => {
                if (!editMode || dragOverDay === absoluteIndex) return
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = isToday 
                  ? '0 6px 16px rgba(16, 185, 129, 0.4)' 
                  : '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = isToday 
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                  : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* 📅 Enhanced Day Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid #10b98133'
              }}>
                <h3 style={{ color: '#fff', margin: 0, fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {formatDate(date)}
                </h3>
                {isToday && (
                  <span style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}>
                    VANDAAG
                  </span>
                )}
              </div>

              {/* 📊 Enhanced Progress Section */}
              <div style={{ marginBottom: '1rem' }}>
                {/* Progress Bar with improved styling */}
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '10px',
                  height: '8px',
                  marginBottom: '0.5rem',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    background: kcalProgress >= 90 
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : kcalProgress >= 70
                      ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                    height: '100%',
                    width: `${kcalProgress}%`,
                    transition: 'width 0.3s ease',
                    borderRadius: '10px'
                  }} />
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  {dayTotals.kcal} / {dailyTargets.kcal} kcal
                </div>
                <div style={{ 
                  color: kcalProgress >= 90 ? '#10b981' : kcalProgress >= 70 ? '#f59e0b' : '#ef4444', 
                  fontSize: '0.65rem',
                  fontWeight: 'bold'
                }}>
                  {Math.round(kcalProgress)}% van doel
                </div>
              </div>

              {/* 🍽️ Enhanced Meals List */}
              <div style={{ minHeight: '80px' }}>
                {meals.length > 0 ? (
                  meals.slice(0, 3).map((meal, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem',
                        background: eatenMeals.has(meal.id) 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(26, 26, 26, 0.5)',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        border: eatenMeals.has(meal.id) 
                          ? '1px solid #10b981' 
                          : '1px solid #10b98133',
                        cursor: editMode ? 'pointer' : 'default',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (editMode) {
                          const mealSlot = day.meals[idx]
                          handleMealClick(meal, absoluteIndex, mealSlot?.slot)
                        } else {
                          toggleMealEaten(meal.id)
                        }
                      }}
                      onMouseEnter={e => {
                        if (!editMode) return
                        e.target.style.background = 'rgba(245, 158, 11, 0.2)'
                        e.target.style.borderColor = '#f59e0b'
                      }}
                      onMouseLeave={e => {
                        if (!editMode) return
                        e.target.style.background = eatenMeals.has(meal.id) 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(26, 26, 26, 0.5)'
                        e.target.style.borderColor = eatenMeals.has(meal.id) 
                          ? '#10b981' 
                          : '#10b98133'
                      }}
                    >
                      <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {meal.name}
                        {meal.isScaled && (
                          <span style={{ color: '#10b981', marginLeft: '0.25rem' }}>
                            ({meal.portion})
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.65rem' }}>
                        {meal.kcal} kcal • {meal.protein}g eiwit
                      </div>
                      {eatenMeals.has(meal.id) && (
                        <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 'bold' }}>
                          ✓ Gegeten
                        </div>
                      )}
                      {editMode && (
                        <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 'bold' }}>
                          🔄 Klik om te wisselen
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    padding: '1rem 0'
                  }}>
                    {editMode ? (dragOverDay === absoluteIndex ? '📥 Laat hier los' : 'Sleep maaltijden hierheen') : 'Geen maaltijden'}
                  </div>
                )}
                
                {meals.length > 3 && (
                  <div style={{ color: '#9ca3af', fontSize: '0.65rem', textAlign: 'center' }}>
                    +{meals.length - 3} meer
                  </div>
                )}
              </div>

              {/* ➕ Add Meal Button */}
              {editMode && (
                <button
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    color: '#10b981',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMealPicker({ dayIndex: absoluteIndex })
                    setSearch('')
                    setSearchResults([])
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.3)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  ➕ Maaltijd toevoegen
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 🔍 Day Detail Modal */}
      {showDay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setShowDay(null)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: '1px solid #10b98133',
            animation: 'slideUp 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #10b98133',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>
                  📅 Dag {showDay.index + 1} Details
                </h3>
                <button
                  onClick={() => setShowDay(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {(showDay.day?.meals || []).length > 0 ? (
                (showDay.day.meals || []).map((mealSlot, idx) => {
                  const meal = mealsMap[mealSlot.meal_id]
                  if (!meal) return null

                  let displayMeal = meal
                  if (mealSlot.target_kcal && meal.kcal) {
                    const scaled = PortionCalculator.calculateScaledPortion(meal, mealSlot.target_kcal)
                    displayMeal = { ...meal, ...scaled.scaledMacros, portion: scaled.newPortion, isScaled: true }
                  }

                  return (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: eatenMeals.has(meal.id) 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : '#2a2a2a',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: eatenMeals.has(meal.id) 
                        ? '1px solid #10b981' 
                        : '1px solid #10b98133',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                            {meal.name}
                            {displayMeal.isScaled && (
                              <span style={{ color: '#10b981', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                                ({displayMeal.portion})
                              </span>
                            )}
                          </h4>
                          <MacroSummary {...displayMeal} />
                          {meal.ingredients && (
                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                              Ingrediënten: {Array.isArray(meal.ingredients) 
                                ? meal.ingredients.map(i => i.name || i).join(', ')
                                : meal.ingredients}
                            </div>
                          )}
                          {mealSlot.target_kcal && (
                            <div style={{ color: '#f59e0b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                              🎯 Target: {mealSlot.target_kcal} kcal
                            </div>
                          )}
                          {eatenMeals.has(meal.id) && (
                            <div style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                              ✓ Gegeten
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button
                            onClick={() => toggleMealEaten(meal.id)}
                            style={{
                              padding: '0.5rem',
                              background: eatenMeals.has(meal.id) 
                                ? 'rgba(239, 68, 68, 0.2)' 
                                : 'rgba(16, 185, 129, 0.2)',
                              border: eatenMeals.has(meal.id) 
                                ? '1px solid #ef4444' 
                                : '1px solid #10b981',
                              borderRadius: '6px',
                              color: eatenMeals.has(meal.id) ? '#ef4444' : '#10b981',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          >
                            {eatenMeals.has(meal.id) ? '❌' : '✅'}
                          </button>
                          {editMode && (
                            <button
                              onClick={() => openSwap(showDay.index, mealSlot.slot, displayMeal.kcal)}
                              style={{
                                padding: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            >
                              🔄
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                  <p>Geen maaltijden voor deze dag</p>
                  {editMode && (
                    <button
                      onClick={() => {
                        setMealPicker({ dayIndex: showDay.index })
                        setShowDay(null)
                      }}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                    >
                      ➕ Maaltijd toevoegen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔄 Swap Modal */}
      {swapSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setSwapSlot(null)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: '1px solid #10b98133',
            animation: 'slideUp 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #10b98133',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0 }}>🔄 Wissel Maaltijd</h3>
                <button
                  onClick={() => setSwapSlot(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ✕
                </button>
              </div>
              <p style={{ color: '#d1fae5', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                🎯 Target: ~{swapSlot.targetKcal} kcal • Gesorteerd op beste match
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {swapSuggestions.length > 0 ? (
                swapSuggestions.map(meal => (
                  <div key={meal.id} style={{
                    padding: '1rem',
                    background: '#2a2a2a',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid #10b98133',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleSwapPick(meal)}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = '#2a2a2a'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {meal.name}
                        </div>
                        <MacroSummary {...meal} />
                        <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          Verschil: {Math.abs(meal.kcal - swapSlot.targetKcal)} kcal
                        </div>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}>
                        Kiezen
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Geen alternatieven gevonden
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ➕ Add Meal Modal */}
      {mealPicker && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setMealPicker(null)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: '1px solid #10b98133',
            animation: 'slideUp 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #10b98133',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0 }}>➕ Maaltijd Toevoegen</h3>
                <button
                  onClick={() => setMealPicker(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #10b98133' }}>
              <input
                type="text"
                placeholder="Zoek maaltijden..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #10b98133',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#10b98133'}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div style={{ padding: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {searchResults.length > 0 ? (
                searchResults.map(meal => (
                  <div key={meal.id} style={{
                    padding: '1rem',
                    background: '#2a2a2a',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid #10b98133',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => addMealToDay(meal)}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = '#2a2a2a'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {meal.name}
                        </div>
                        <MacroSummary {...meal} />
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}>
                        Toevoegen
                      </div>
                    </div>
                  </div>
                ))
              ) : search ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Geen maaltijden gevonden voor "{search}"
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Typ om te zoeken...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ Target Adjustment Modal */}
      {showTargetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setShowTargetModal(false)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: '1px solid #10b98133',
            animation: 'slideUp 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #10b98133',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
            }}>
              <h3 style={{ color: '#fff', margin: 0 }}>⚙️ Dagelijks Doel Aanpassen</h3>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#fff', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                  Calorie Doel (kcal)
                </label>
                <input
                  type="number"
                  value={dailyKcalTarget}
                  onChange={e => setDailyKcalTarget(parseInt(e.target.value) || 2000)}
                  min="1000"
                  max="5000"
                  step="50"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#10b98133'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#2a2a2a', borderRadius: '6px' }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Automatische Macro Verdeling:
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  • Protein: {dailyTargets.protein}g (25%)
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  • Carbs: {dailyTargets.carbs}g (45%)
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  • Fat: {dailyTargets.fat}g (30%)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowTargetModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #10b98133',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.target.style.background = '#3a3a3a'}
                  onMouseLeave={e => e.target.style.background = '#2a2a2a'}
                >
                  Annuleren
                </button>
                <button
                  onClick={() => setShowTargetModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
