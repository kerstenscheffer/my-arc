// src/client/pages/ClientMealPlan.jsx
// 🚀 MY ARC CLIENT MEAL PLAN - ULTIMATE LAUNCH VERSION WITH ICONS!
// Features: Coach video/notes, Week navigation, Progress tracking, Meal check-off, Smart scaling, URL Icons

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'

// 🎨 ICON URLS
const iconUrls = {
  home: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/347a061-831e-4cd2-f3b-b6007f0caa2_MIND_17_.png",
  mealplan: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/6bbcb82-acf7-45d6-1e4e-627ff4061280_MIND_10_.png",
  workout: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/a3883-e0d0-0da8-deea-8b7e7dce467_MIND_14_.png",
  progress: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/b8015e-0fc-8aaf-b56-a13672c1bab5_MIND_13_.png",
  profile: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/1e1d3f-24b5-b48-37a-1537c7b8f05e_MIND_12_.png"
}

const macroIcons = {
  kcal: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/2eab52d-0a25-d6dd-bce2-53cd3818ad1c_5.png",
  protein: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/c3de8d-cfd4-ace0-1162-03011e83a13_2.png",
  carbs: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/f4e6b36-8f2-6eea-706e-83e768daddd2_3.png",
  fat: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/ed8d5f8-1a5c-e7dd-f1b-b6ec3afd6ef1_4.png"
}

// Additional meal type icons
const mealTypeIcons = {
  breakfast: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/3eb5c2a-b1e-75e3-a5b2-c8bda3e55502_7.png",
  lunch: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/73c0ff-a73-afe-2e0f-71f1c4cf73_6.png",
  dinner: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/db878-b47a-d2dc-d6a8-c383a825e2b_1.png",
  snack: macroIcons.kcal // Use kcal icon for snacks
}

// 🎯 PORTION CALCULATOR
const PortionCalculator = {
  calculateScaledPortion(meal, targetKcal) {
    if (!meal?.kcal || meal.kcal === 0) return { 
      factor: 1, 
      newPortion: meal?.default_portion || '1 portie',
      scaledMacros: meal || { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    }
    
    const scaleFactor = Math.max(0.5, Math.min(3.0, targetKcal / meal.kcal))
    const currentPortion = meal.default_portion || '100g'
    const newPortion = this.scalePortionText(currentPortion, scaleFactor)
    
    return {
      factor: scaleFactor,
      newPortion,
      scaledMacros: {
        kcal: Math.round(meal.kcal * scaleFactor),
        protein: Math.round((meal.protein || 0) * scaleFactor),
        carbs: Math.round((meal.carbs || 0) * scaleFactor),
        fat: Math.round((meal.fat || 0) * scaleFactor)
      }
    }
  },

  scalePortionText(portionText, factor) {
    if (!portionText) return `${Math.round(factor * 100)}g`
    
    const patterns = [
      { regex: /(\d+(?:\.\d+)?)\s*g/i, replacement: (match, amount) => `${Math.round(parseFloat(amount) * factor)}g` },
      { regex: /(\d+(?:\.\d+)?)\s*ml/i, replacement: (match, amount) => `${Math.round(parseFloat(amount) * factor)}ml` },
      { regex: /(\d+(?:\.\d+)?)\s*stuks?/i, replacement: (match, amount) => {
        const scaled = parseFloat(amount) * factor
        return scaled < 1 ? `${scaled.toFixed(1)} stuk` : `${Math.round(scaled)} stuks`
      }}
    ]
    
    for (const pattern of patterns) {
      if (pattern.regex.test(portionText)) {
        return portionText.replace(pattern.regex, pattern.replacement)
      }
    }
    
    return `${factor.toFixed(1)}x ${portionText}`
  }
}

// 🎨 MACRO DISPLAY COMPONENT WITH ICONS
function MacroDisplay({ macros, size = 'normal', showIcons = true }) {
  if (size === 'compact') {
    return (
      <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
        {macros.kcal}kcal • E{macros.protein}g
      </span>
    )
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      fontSize: size === 'large' ? '1rem' : '0.875rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {showIcons && <img src={macroIcons.kcal} alt="" style={{ width: '16px', height: '16px' }} />}
        {macros.kcal} kcal
      </span>
      <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {showIcons && <img src={macroIcons.protein} alt="" style={{ width: '16px', height: '16px' }} />}
        {macros.protein}g
      </span>
      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {showIcons && <img src={macroIcons.carbs} alt="" style={{ width: '16px', height: '16px' }} />}
        {macros.carbs}g
      </span>
      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {showIcons && <img src={macroIcons.fat} alt="" style={{ width: '16px', height: '16px' }} />}
        {macros.fat}g
      </span>
    </div>
  )
}

// Helper functions
function formatDate(date) {
  return date.toLocaleDateString('nl-NL', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getMealTypeIcon(type) {
  switch(type?.toLowerCase()) {
    case 'breakfast': 
    case 'ontbijt': return mealTypeIcons.breakfast
    case 'lunch': return mealTypeIcons.lunch
    case 'dinner':
    case 'diner': return mealTypeIcons.dinner
    case 'snack':
    case 'tussendoortje': return mealTypeIcons.snack
    default: return macroIcons.kcal
  }
}

export default function ClientMealPlan({ client }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Core state
  const [plan, setPlan] = useState(null)
  const [weekStructure, setWeekStructure] = useState([])
  const [mealsMap, setMealsMap] = useState({})
  const [activeWeek, setActiveWeek] = useState(0)
  const [targets, setTargets] = useState({
    kcal: 2000,
    protein: 150,
    carbs: 200,
    fat: 67
  })
  
  // UI state
  const [selectedDay, setSelectedDay] = useState(null)
  const [showMealDetail, setShowMealDetail] = useState(null)
  const [checkedMeals, setCheckedMeals] = useState({})
  const [expandedDays, setExpandedDays] = useState({})
  const [todayProgress, setTodayProgress] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  
  const isMobile = window.innerWidth <= 768

  // Load meal plan on mount
  useEffect(() => {
    if (!client) return
    
    let mounted = true
    ;(async () => {
      try {
        console.log('📋 Loading meal plan for client:', client.id)
        
        // 1. Get client's meal plan
        const { data: planData, error: planError } = await supabase
          .from('client_meal_plans')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (planError && planError.code !== 'PGRST116') {
          console.error('Error loading plan:', planError)
          setError('Kon meal plan niet laden')
          setLoading(false)
          return
        }
        
        if (!planData) {
          console.log('No plan found for client')
          setLoading(false)
          return
        }
        
        setPlan(planData)
        
        // Set targets from plan
        if (planData.targets) {
          setTargets({
            kcal: planData.targets.kcal || 2000,
            protein: planData.targets.protein || 150,
            carbs: planData.targets.carbs || 200,
            fat: planData.targets.fat || 67
          })
        }
        
        // 2. Get overrides if they exist
        const { data: overrideData } = await supabase
          .from('client_meal_overrides')
          .select('week_structure')
          .eq('client_id', client.id)
          .eq('plan_id', planData.id)
          .single()
        
        let weekStructureToUse = []
        
        if (overrideData?.week_structure) {
          console.log('✅ Using override structure')
          weekStructureToUse = overrideData.week_structure
        } else if (planData.week_structure) {
          console.log('📋 Using plan structure')
          weekStructureToUse = planData.week_structure
        } else if (planData.template_id) {
          // Get template structure
          const { data: templateData } = await supabase
            .from('meal_plan_templates')
            .select('week_structure')
            .eq('id', planData.template_id)
            .single()
          
          if (templateData?.week_structure) {
            console.log('📋 Using template structure')
            weekStructureToUse = templateData.week_structure
          }
        }
        
        // Pad to 28 days
        const padded = [...(weekStructureToUse || [])]
        while (padded.length < 28) {
          padded.push({ day: `Day ${padded.length + 1}`, meals: [] })
        }
        setWeekStructure(padded)
        
        // 3. Load all referenced meals
        const mealIds = padded.flatMap(d => 
          (d?.meals || []).map(m => m.meal_id).filter(Boolean)
        )
        const uniqueIds = [...new Set(mealIds)]
        
        if (uniqueIds.length > 0) {
          const meals = []
          const batchSize = 100
          
          for (let i = 0; i < uniqueIds.length; i += batchSize) {
            const batch = uniqueIds.slice(i, i + batchSize)
            const { data: batchMeals } = await supabase
              .from('meals')
              .select('*')
              .in('id', batch)
            
            if (batchMeals) meals.push(...batchMeals)
          }
          
          console.log(`✅ Loaded ${meals.length} meals`)
          const map = Object.fromEntries(meals.map(m => [m.id, m]))
          if (mounted) setMealsMap(map)
        }
        
        // 4. Load checked meals from localStorage
        const saved = localStorage.getItem(`checkedMeals_${client.id}`)
        if (saved) {
          setCheckedMeals(JSON.parse(saved))
        }
        
        // 5. Auto-expand today and calculate today's progress
        const today = new Date()
        const startDate = planData.start_date ? new Date(planData.start_date) : new Date()
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
        const currentWeek = Math.floor(daysSinceStart / 7)
        const currentDayInWeek = daysSinceStart % 7
        
        if (currentWeek >= 0 && currentWeek < 4) {
          setActiveWeek(currentWeek)
          const todayIndex = currentWeek * 7 + currentDayInWeek
          setExpandedDays({ [todayIndex]: true })
          
          // Calculate today's progress
          const todayDay = padded[todayIndex]
          if (todayDay) {
            let progress = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
            const savedChecks = saved ? JSON.parse(saved) : {}
            
            ;(todayDay.meals || []).forEach((mealSlot, idx) => {
              if (savedChecks[`${todayIndex}_${idx}`]) {
                const meal = map[mealSlot.meal_id]
                if (meal) {
                  let macros = meal
                  if (mealSlot.target_kcal && meal.kcal) {
                    const scaled = PortionCalculator.calculateScaledPortion(meal, mealSlot.target_kcal)
                    macros = scaled.scaledMacros
                  }
                  progress.kcal += macros.kcal || 0
                  progress.protein += macros.protein || 0
                  progress.carbs += macros.carbs || 0
                  progress.fat += macros.fat || 0
                }
              }
            })
            
            setTodayProgress(progress)
          }
        }
        
      } catch (e) {
        console.error('Load error:', e)
        if (mounted) setError('Er ging iets mis bij het laden')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    
    return () => { mounted = false }
  }, [client])

  // Save checked meals to localStorage and update today's progress
  useEffect(() => {
    if (client && Object.keys(checkedMeals).length > 0) {
      localStorage.setItem(`checkedMeals_${client.id}`, JSON.stringify(checkedMeals))
      
      // Update today's progress
      const today = new Date()
      const startDate = plan?.start_date ? new Date(plan.start_date) : new Date()
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      const todayIndex = daysSinceStart
      
      if (todayIndex >= 0 && todayIndex < weekStructure.length) {
        const progress = calculateDayProgress(todayIndex)
        setTodayProgress(progress.checked)
      }
    }
  }, [checkedMeals, client, plan, weekStructure])

  // Calculate progress
  const calculateDayProgress = (dayIndex) => {
    const day = weekStructure[dayIndex]
    if (!day) return { total: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, checked: { kcal: 0, protein: 0, carbs: 0, fat: 0 } }
    
    let total = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    let checked = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    
    ;(day.meals || []).forEach((mealSlot, idx) => {
      const meal = mealsMap[mealSlot.meal_id]
      if (!meal) return
      
      // Apply scaling if target exists
      let macros = meal
      if (mealSlot.target_kcal && meal.kcal) {
        const scaled = PortionCalculator.calculateScaledPortion(meal, mealSlot.target_kcal)
        macros = scaled.scaledMacros
      }
      
      total.kcal += macros.kcal || 0
      total.protein += macros.protein || 0
      total.carbs += macros.carbs || 0
      total.fat += macros.fat || 0
      
      if (checkedMeals[`${dayIndex}_${idx}`]) {
        checked.kcal += macros.kcal || 0
        checked.protein += macros.protein || 0
        checked.carbs += macros.carbs || 0
        checked.fat += macros.fat || 0
      }
    })
    
    return { total, checked }
  }

  // Toggle meal checked
  const toggleMealCheck = (dayIndex, mealIndex) => {
    const key = `${dayIndex}_${mealIndex}`
    setCheckedMeals(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Toggle day expanded
  const toggleDayExpanded = (dayIndex) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }))
  }

  // Get weeks
  const weeks = useMemo(() => {
    const result = []
    for (let w = 0; w < 4; w++) {
      result.push(weekStructure.slice(w * 7, (w + 1) * 7))
    }
    return result
  }, [weekStructure])

  const currentWeek = weeks[activeWeek] || []
  const startDate = plan?.start_date ? new Date(plan.start_date) : new Date()
  const weekStart = addDays(startDate, activeWeek * 7)

  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h3 style={{ color: '#fff', fontSize: '1.5rem' }}>
          Meal plan laden...
        </h3>
      </div>
    )
  }

  // No plan state
  if (!plan) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        background: '#1a1a1a',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <img 
          src={iconUrls.mealplan} 
          alt="Meal Plan" 
          style={{ width: '80px', height: '80px', marginBottom: '1rem', opacity: 0.5 }}
        />
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Nog geen meal plan
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
          Je coach heeft nog geen meal plan voor je aangemaakt.
          <br />Neem contact op voor je persoonlijke voedingsschema!
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* 🎥 COACH VIDEO BANNER */}
      {plan.coach_video_url && (
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', 
            height: 0,
            background: '#000'
          }}>
            <video
              controls
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              poster="https://cdn.coverr.co/videos/coverr-fresh-vegetables-on-table-8062/poster"
            >
              <source src={plan.coach_video_url} type="video/mp4" />
              Je browser ondersteunt geen video
            </video>
            
            {/* Video overlay text */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '8px',
              padding: '0.75rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                💬 Persoonlijke uitleg van je coach
              </h3>
              <p style={{ color: '#10b981', fontSize: '0.875rem' }}>
                Bekijk deze video voor belangrijke tips!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 💬 COACH NOTES */}
      {plan.coach_notes && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid #10b98133'
        }}>
          <h3 style={{ 
            color: '#10b981', 
            fontSize: '1.2rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💬 Coach Suggestie
          </h3>
          <div style={{
            color: '#fff',
            fontSize: '1rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {plan.coach_notes}
          </div>
        </div>
      )}

      {/* 📊 WEEK TARGETS WITH CURRENT PROGRESS */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#10b981', 
          fontSize: '1.2rem', 
          marginBottom: '1.5rem',
          fontWeight: 'bold'
        }}>
          🎯 Vandaag's Voortgang
        </h3>
        
        {/* Progress bars for each macro */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Calories */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={macroIcons.kcal} alt="" style={{ width: '20px', height: '20px' }} />
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Calorieën</span>
              </div>
              <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
                {todayProgress.kcal} / {targets.kcal} kcal
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #10b98133'
            }}>
              <div style={{
                width: `${Math.min(100, (todayProgress.kcal / targets.kcal) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 0.5s',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }} />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={macroIcons.protein} alt="" style={{ width: '20px', height: '20px' }} />
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Eiwitten</span>
              </div>
              <span style={{ color: '#3b82f6', fontSize: '0.9rem' }}>
                {todayProgress.protein}g / {targets.protein}g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #3b82f633'
            }}>
              <div style={{
                width: `${Math.min(100, (todayProgress.protein / targets.protein) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                transition: 'width 0.5s',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
              }} />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={macroIcons.carbs} alt="" style={{ width: '20px', height: '20px' }} />
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Koolhydraten</span>
              </div>
              <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                {todayProgress.carbs}g / {targets.carbs}g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #f59e0b33'
            }}>
              <div style={{
                width: `${Math.min(100, (todayProgress.carbs / targets.carbs) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                transition: 'width 0.5s',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
              }} />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={macroIcons.fat} alt="" style={{ width: '20px', height: '20px' }} />
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Vetten</span>
              </div>
              <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                {todayProgress.fat}g / {targets.fat}g
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #ef444433'
            }}>
              <div style={{
                width: `${Math.min(100, (todayProgress.fat / targets.fat) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                transition: 'width 0.5s',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* 📅 WEEK NAVIGATION */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        padding: '0.25rem'
      }}>
        {[0, 1, 2, 3].map(week => {
          const weekStartDate = addDays(startDate, week * 7)
          const weekEndDate = addDays(weekStartDate, 6)
          const isCurrentWeek = activeWeek === week
          
          return (
            <button
              key={week}
              onClick={() => setActiveWeek(week)}
              style={{
                flex: isMobile ? '0 0 auto' : 1,
                minWidth: isMobile ? '100px' : 'auto',
                padding: '0.75rem 1rem',
                background: isCurrentWeek 
                  ? 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)'
                  : '#2a2a2a',
                border: isCurrentWeek ? '2px solid #10b981' : '1px solid #10b98133',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                Week {week + 1}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                {weekStartDate.getDate()}/{weekStartDate.getMonth() + 1} - {weekEndDate.getDate()}/{weekEndDate.getMonth() + 1}
              </div>
            </button>
          )
        })}
      </div>

      {/* 🍽️ DAYS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1rem'
      }}>
        {currentWeek.map((day, dayInWeek) => {
          const dayIndex = activeWeek * 7 + dayInWeek
          const date = addDays(weekStart, dayInWeek)
          const isToday = date.toDateString() === new Date().toDateString()
          const isExpanded = expandedDays[dayIndex] || isToday
          const progress = calculateDayProgress(dayIndex)
          const dayProgress = Math.round((progress.checked.kcal / targets.kcal) * 100)
          
          // Group meals by type
          const mealsByType = {}
          ;(day?.meals || []).forEach((mealSlot, idx) => {
            const meal = mealsMap[mealSlot.meal_id]
            if (!meal) return
            
            const type = meal.category || 'other'
            if (!mealsByType[type]) mealsByType[type] = []
            
            // Apply scaling
            let displayMeal = { ...meal }
            if (mealSlot.target_kcal && meal.kcal) {
              const scaled = PortionCalculator.calculateScaledPortion(meal, mealSlot.target_kcal)
              displayMeal = {
                ...meal,
                ...scaled.scaledMacros,
                portion: scaled.newPortion,
                isScaled: true,
                originalKcal: meal.kcal
              }
            }
            
            mealsByType[type].push({ ...displayMeal, idx, checked: checkedMeals[`${dayIndex}_${idx}`] })
          })
          
          return (
            <div
              key={dayIndex}
              style={{
                background: isToday 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                  : '#1a1a1a',
                borderRadius: '12px',
                overflow: 'hidden',
                border: isToday ? '2px solid #10b981' : '1px solid #10b98133',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s'
              }}
            >
              {/* Day Header */}
              <div
                onClick={() => toggleDayExpanded(dayIndex)}
                style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ 
                      color: '#fff', 
                      fontWeight: 'bold', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {formatDate(date)}
                      {isToday && <span style={{ 
                        background: '#10b981',
                        color: '#000',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>VANDAAG</span>}
                    </div>
                    <div style={{ color: '#d1fae5', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {(day?.meals || []).length} maaltijden • {progress.total.kcal} kcal
                    </div>
                  </div>
                  <div style={{
                    color: '#fff',
                    fontSize: '1.5rem',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }}>
                    ⌄
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  marginTop: '0.75rem',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, dayProgress)}%`,
                    height: '100%',
                    background: dayProgress >= 80 ? '#10b981' : dayProgress >= 50 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.5s'
                  }} />
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#d1fae5',
                  marginTop: '0.25rem',
                  textAlign: 'right'
                }}>
                  {dayProgress}% voltooid
                </div>
              </div>
              
              {/* Day Content */}
              {isExpanded && (
                <div style={{ padding: '1rem' }}>
                  {(day?.meals || []).length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#9ca3af'
                    }}>
                      <p>Geen maaltijden gepland</p>
                    </div>
                  ) : (
                    <>
                      {/* Meals by category */}
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(category => {
                        const meals = mealsByType[category]
                        if (!meals || meals.length === 0) return null
                        
                        return (
                          <div key={category} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{
                              color: '#10b981',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              marginBottom: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <img 
                                src={getMealTypeIcon(category)} 
                                alt="" 
                                style={{ width: '20px', height: '20px' }}
                              />
                              {category === 'breakfast' ? 'Ontbijt' : 
                                category === 'lunch' ? 'Lunch' : 
                                category === 'dinner' ? 'Diner' : 'Snacks'}
                            </h4>
                            
                            {meals.map(meal => (
                              <div
                                key={meal.idx}
                                style={{
                                  background: meal.checked 
                                    ? 'rgba(16, 185, 129, 0.1)' 
                                    : '#2a2a2a',
                                  borderRadius: '8px',
                                  padding: '1rem',
                                  marginBottom: '0.75rem',
                                  border: meal.checked 
                                    ? '1px solid #10b981' 
                                    : '1px solid #10b98133',
                                  transition: 'all 0.3s'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '0.5rem'
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      color: '#fff',
                                      fontWeight: 'bold',
                                      fontSize: '0.95rem',
                                      textDecoration: meal.checked ? 'line-through' : 'none'
                                    }}>
                                      {meal.name}
                                    </div>
                                    {meal.isScaled && (
                                      <div style={{
                                        color: '#f59e0b',
                                        fontSize: '0.75rem',
                                        marginTop: '0.25rem'
                                      }}>
                                        📏 {meal.portion}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => toggleMealCheck(dayIndex, meal.idx)}
                                    style={{
                                      padding: '0.5rem',
                                      background: meal.checked ? '#10b981' : 'transparent',
                                      border: `2px solid ${meal.checked ? '#10b981' : '#10b98133'}`,
                                      borderRadius: '6px',
                                      color: meal.checked ? '#000' : '#10b981',
                                      cursor: 'pointer',
                                      fontSize: '1rem',
                                      transition: 'all 0.3s'
                                    }}
                                  >
                                    {meal.checked ? '✓' : '○'}
                                  </button>
                                </div>
                                
                                <MacroDisplay macros={meal} size="compact" showIcons={false} />
                                
                                {/* Meal actions */}
                                <div style={{
                                  display: 'flex',
                                  gap: '0.5rem',
                                  marginTop: '0.75rem'
                                }}>
                                  <button
                                    onClick={() => setShowMealDetail({
                                      meal,
                                      dayIndex,
                                      mealIndex: meal.idx
                                    })}
                                    style={{
                                      flex: 1,
                                      padding: '0.5rem',
                                      background: 'transparent',
                                      border: '1px solid #10b98133',
                                      borderRadius: '6px',
                                      color: '#10b981',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      transition: 'all 0.3s'
                                    }}
                                  >
                                    📝 Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                      
                      {/* Day totals */}
                      <div style={{
                        borderTop: '1px solid #10b98133',
                        paddingTop: '1rem',
                        marginTop: '1rem'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: '#fff',
                          marginBottom: '0.5rem'
                        }}>
                          Dag Totaal:
                        </div>
                        <MacroDisplay macros={progress.total} size="normal" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 🛒 SHOPPING LIST BUTTON */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 100
      }}>
        <button
          onClick={() => window.location.href = '/client/shopping-list'}
          style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '50px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}
        >
          🛒 Boodschappenlijst
        </button>
      </div>

      {/* 📝 MEAL DETAIL MODAL */}
      {showMealDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setShowMealDetail(null)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
              borderBottom: '1px solid #10b98133'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.3rem' }}>
                  {showMealDetail.meal.name}
                </h3>
                <button
                  onClick={() => setShowMealDetail(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>
              {/* Portie info */}
              {showMealDetail.meal.isScaled && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #f59e0b33'
                }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📏 Aangepaste Portie
                  </div>
                  <div style={{ color: '#fff' }}>
                    {showMealDetail.meal.portion}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Origineel: {showMealDetail.meal.originalKcal} kcal
                  </div>
                </div>
              )}
              
              {/* Macros */}
              <div style={{
                background: '#2a2a2a',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  📊 Voedingswaarden
                </div>
                <MacroDisplay macros={showMealDetail.meal} size="large" />
              </div>
              
              {/* Ingrediënten */}
              {showMealDetail.meal.ingredients && (
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    🥗 Ingrediënten
                  </div>
                  <div style={{ color: '#fff', lineHeight: 1.8 }}>
                    {Array.isArray(showMealDetail.meal.ingredients)
                      ? showMealDetail.meal.ingredients.map((ing, i) => (
                          <div key={i} style={{ marginBottom: '0.25rem' }}>
                            • {ing}
                          </div>
                        ))
                      : showMealDetail.meal.ingredients}
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              {showMealDetail.meal.instructions && (
                <div style={{
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    👨‍🍳 Bereidingswijze
                  </div>
                  <div style={{ color: '#fff', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {showMealDetail.meal.instructions}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                <button
                  onClick={() => {
                    toggleMealCheck(showMealDetail.dayIndex, showMealDetail.mealIndex)
                    setShowMealDetail(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: checkedMeals[`${showMealDetail.dayIndex}_${showMealDetail.mealIndex}`]
                      ? '#ef4444'
                      : '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {checkedMeals[`${showMealDetail.dayIndex}_${showMealDetail.mealIndex}`]
                    ? '❌ Markeer als niet gegeten'
                    : '✅ Markeer als gegeten'}
                </button>
                
                <button
                  onClick={() => window.location.href = '/client/recipe-library'}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                  }}
                >
                  📚 Gerechten Bibliotheek
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
