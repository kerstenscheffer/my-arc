// src/modules/meal-plan/components/AIDaySchedule.jsx
// UPDATED: Template toepassen functionaliteit toegevoegd

import React, { useState, useEffect } from 'react'
import { 
  Calendar, Check, Info, RefreshCw, Clock,
  ChevronLeft, ChevronRight, Flame, Target, Zap, Droplets,
  Utensils, Apple
} from 'lucide-react'
import ApplyTemplateModal from '../../client-meal-base/components/ApplyTemplateModal'

export default function AIDaySchedule({
  activePlan,
  todayMeals,
  todayProgress,
  selectedDay,
  onDayChange,
  onCheckMeal,
  onOpenInfo,
  onOpenAlternatives,
  dayTemplates = [], // NEW: Templates prop
  db
}) {
  const isMobile = window.innerWidth <= 768
  const [currentDay, setCurrentDay] = useState('today')
  const [displayMeals, setDisplayMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [hoveredMeal, setHoveredMeal] = useState(null)
  const [checkedMeals, setCheckedMeals] = useState({})
  const [showApplyTemplate, setShowApplyTemplate] = useState(false) // NEW: Modal state
  
  // Days of week configuration
  const daysOfWeek = [
    { id: 0, name: 'Maandag', key: 'monday' },
    { id: 1, name: 'Dinsdag', key: 'tuesday' },
    { id: 2, name: 'Woensdag', key: 'wednesday' },
    { id: 3, name: 'Donderdag', key: 'thursday' },
    { id: 4, name: 'Vrijdag', key: 'friday' },
    { id: 5, name: 'Zaterdag', key: 'saturday' },
    { id: 6, name: 'Zondag', key: 'sunday' }
  ]
  
  // Get today's day index
  const getTodayIndex = () => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1
  }
  
  // Get meal image
  const getMealImage = (meal) => {
    if (meal?.image_url) return meal.image_url
    
    const mealType = meal?.slot || 'meal'
    const fallbacks = {
      breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=100&h=100&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100&h=100&fit=crop',
      snack1: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=100&h=100&fit=crop',
      snack2: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=100&h=100&fit=crop'
    }
    
    return fallbacks[mealType] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'
  }
  
  // Initialize checked meals from today's progress
  useEffect(() => {
    if (todayProgress && todayProgress.consumed_meals) {
      const newChecked = {}
      Object.entries(todayProgress.consumed_meals).forEach(([slot, data]) => {
        if (data && data.consumed) {
          newChecked[slot] = true
        }
      })
      setCheckedMeals(newChecked)
    }
  }, [todayProgress])
  
  // Set initial meals
  useEffect(() => {
    if (currentDay === 'today' && todayMeals) {
      setDisplayMeals(todayMeals)
    }
  }, [todayMeals, currentDay])
  
  // Load meals when day changes
  useEffect(() => {
    if (currentDay !== 'today') {
      loadDayMeals(currentDay)
    } else if (todayMeals) {
      setDisplayMeals(todayMeals)
    }
  }, [currentDay])
  
  // Load meals for specific day
  const loadDayMeals = async (dayIndex) => {
    if (!activePlan || !activePlan.week_structure) {
      setDisplayMeals([])
      return
    }
    
    setLoading(true)
    try {
      const dayKey = daysOfWeek[dayIndex]?.key
      if (!dayKey) {
        setDisplayMeals([])
        setLoading(false)
        return
      }
      
      const dayPlan = activePlan.week_structure[dayKey]
      if (!dayPlan) {
        setDisplayMeals([])
        setLoading(false)
        return
      }
      
      const meals = []
      
      const getMealData = async (mealRef) => {
        if (!mealRef) return null
        
        // If already a complete object with meal data, return it
        if (typeof mealRef === 'object') {
          if (mealRef.calories) {
            return mealRef
          }
          // If object has id property, extract it
          if (mealRef.id || mealRef.meal_id) {
            const mealId = mealRef.id || mealRef.meal_id
            if (typeof mealId === 'string') {
              // Continue to fetch logic below with the extracted ID
              mealRef = mealId
            } else {
              return mealRef // Already complete
            }
          }
        }
        
        // If string ID, fetch from database
        if (typeof mealRef === 'string') {
          try {
            const cleanId = mealRef
              .replace('_small', '')
              .replace('_large', '')
              .replace('_xl', '')
              .replace('_medium', '')
            
            const { data, error } = await db.supabase
              .from('ai_meals')
              .select('*')
              .eq('id', cleanId)
              .single()
            
            if (error) {
              console.error('Error fetching meal:', error)
              return null
            }
            return data
          } catch (err) {
            console.error('Failed to fetch meal:', err)
            return null
          }
        }
        
        return null
      }
      
      // Process meals
      if (dayPlan.breakfast) {
        const mealData = await getMealData(dayPlan.breakfast)
        if (mealData) {
          meals.push({
            ...mealData,
            slot: 'breakfast',
            timeSlot: 'Ontbijt',
            plannedTime: 8,
            meal_name: mealData.name || mealData.meal_name || 'Ontbijt',
            meal_id: mealData.id || mealData.meal_id
          })
        }
      }
      
      if (dayPlan.lunch) {
        const mealData = await getMealData(dayPlan.lunch)
        if (mealData) {
          meals.push({
            ...mealData,
            slot: 'lunch',
            timeSlot: 'Lunch',
            plannedTime: 12.5,
            meal_name: mealData.name || mealData.meal_name || 'Lunch',
            meal_id: mealData.id || mealData.meal_id
          })
        }
      }
      
      if (dayPlan.dinner) {
        const mealData = await getMealData(dayPlan.dinner)
        if (mealData) {
          meals.push({
            ...mealData,
            slot: 'dinner',
            timeSlot: 'Diner',
            plannedTime: 18.5,
            meal_name: mealData.name || mealData.meal_name || 'Diner',
            meal_id: mealData.id || mealData.meal_id
          })
        }
      }
      
      if (dayPlan.snacks && Array.isArray(dayPlan.snacks)) {
        for (let i = 0; i < dayPlan.snacks.length; i++) {
          const mealData = await getMealData(dayPlan.snacks[i])
          if (mealData) {
            meals.push({
              ...mealData,
              slot: `snack${i + 1}`,
              timeSlot: `Snack ${i + 1}`,
              plannedTime: i === 0 ? 10.5 : 15.5,
              meal_name: mealData.name || mealData.meal_name || `Snack ${i + 1}`,
              meal_id: mealData.id || mealData.meal_id
            })
          }
        }
      }
      
      setDisplayMeals(meals)
    } catch (error) {
      console.error('Error loading day meals:', error)
      setDisplayMeals([])
    } finally {
      setLoading(false)
    }
  }
  
  // NEW: Handle template apply
  const handleApplyTemplate = async (templateId, dayKey) => {
    try {
      setLoading(true)
      
      const clientId = activePlan?.client_id
      if (!clientId) {
        alert('❌ Geen client ID gevonden')
        return
      }
      
      await db.applyDayTemplateToWeek(
        clientId,
        activePlan.id,
        dayKey,
        templateId
      )
      
      setShowApplyTemplate(false)
      
      // Reload the day that was updated
      const dayIndex = daysOfWeek.findIndex(d => d.key === dayKey)
      if (dayIndex !== -1) {
        setCurrentDay(dayIndex)
        await loadDayMeals(dayIndex)
      }
      
      alert('✅ Template toegepast!')
    } catch (error) {
      console.error('Failed to apply template:', error)
      alert('❌ Kon template niet toepassen: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle day selection
  const handleDayClick = (dayIndex) => {
    const todayIndex = getTodayIndex()
    const newDay = dayIndex === todayIndex ? 'today' : dayIndex
    setCurrentDay(newDay)
    
    if (newDay !== 'today') {
      setCheckedMeals({})
    }
    
    if (onDayChange) {
      onDayChange(newDay)
    }
  }
  
  // Handle meal check/uncheck
  const handleMealCheck = async (meal) => {
    const slot = meal.slot
    const isChecked = checkedMeals[slot] || false
    const newCheckedState = !isChecked
    
    setCheckedMeals(prev => ({
      ...prev,
      [slot]: newCheckedState
    }))
    
    const todayIndex = getTodayIndex()
    if (currentDay !== 'today' && currentDay !== todayIndex) {
      return
    }
    
    if (newCheckedState) {
      if (onCheckMeal) {
        onCheckMeal(slot, meal)
      }
    } else {
      try {
        const clientId = activePlan?.client_id
        if (!clientId) return
        
        const today = new Date().toISOString().split('T')[0]
        
        const { data: progress, error: fetchError } = await db.supabase
          .from('ai_meal_progress')
          .select('*')
          .eq('client_id', clientId)
          .eq('date', today)
          .maybeSingle()
        
        if (fetchError) {
          console.error('Error fetching progress:', fetchError)
          return
        }
        
        if (progress) {
          const updatedMeals = { ...(progress.consumed_meals || {}) }
          delete updatedMeals[slot]
          
          let totalCalories = 0
          let totalProtein = 0
          let totalCarbs = 0
          let totalFat = 0
          let mealsConsumed = 0
          
          Object.values(updatedMeals).forEach(m => {
            if (m && m.consumed) {
              totalCalories += m.calories || 0
              totalProtein += m.protein || 0
              totalCarbs += m.carbs || 0
              totalFat += m.fat || 0
              mealsConsumed++
            }
          })
          
          const { error: updateError } = await db.supabase
            .from('ai_meal_progress')
            .update({
              consumed_meals: updatedMeals,
              total_calories: totalCalories,
              total_protein: totalProtein,
              total_carbs: totalCarbs,
              total_fat: totalFat,
              meals_consumed: mealsConsumed,
              updated_at: new Date().toISOString()
            })
            .eq('id', progress.id)
          
          if (updateError) {
            console.error('Error updating progress:', updateError)
          }
        }
      } catch (error) {
        console.error('Error handling uncheck:', error)
      }
    }
  }
  
  // Calculate day totals
  const calculateDayTotals = () => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
    
    displayMeals.forEach(meal => {
      if (meal) {
        totals.calories += meal.calories || 0
        totals.protein += meal.protein || 0
        totals.carbs += meal.carbs || 0
        totals.fat += meal.fat || 0
      }
    })
    
    return totals
  }
  
  const dayTotals = calculateDayTotals()
  const todayIndex = getTodayIndex()
  const isToday = currentDay === 'today' || currentDay === todayIndex
  const currentDayKey = currentDay === 'today' ? daysOfWeek[todayIndex].key : daysOfWeek[currentDay]?.key
  
  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      {/* Header - WITH GREEN + TEMPLATE BUTTON */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={isMobile ? 20 : 24} color="#10b981" />
          Dag Schema
        </h2>
        
        {/* NEW: Template Apply Button */}
        <button
          onClick={() => setShowApplyTemplate(true)}
          disabled={dayTemplates.length === 0}
          style={{
            padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
            background: dayTemplates.length > 0
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '10px',
            color: dayTemplates.length > 0 ? '#fff' : 'rgba(255, 255, 255, 0.3)',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: '600',
            cursor: dayTemplates.length > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={isMobile ? 13 : 14} />
          {!isMobile && 'Template'}
        </button>
      </div>
      
      {/* Mobile day navigation - GREEN ACCENTS */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => {
              const curr = currentDay === 'today' ? todayIndex : currentDay
              const prev = curr === 0 ? 6 : curr - 1
              handleDayClick(prev)
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              color: 'rgba(16, 185, 129, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span style={{
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '600',
            minWidth: '80px',
            textAlign: 'center'
          }}>
            {currentDay === 'today' ? 'Vandaag' : daysOfWeek[currentDay]?.name}
          </span>
          
          <button
            onClick={() => {
              const curr = currentDay === 'today' ? todayIndex : currentDay
              const next = curr === 6 ? 0 : curr + 1
              handleDayClick(next)
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              color: 'rgba(16, 185, 129, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      
      {/* Desktop day selector - GREEN THEME */}
      {!isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {daysOfWeek.map(day => {
            const isSelected = currentDay === 'today' 
              ? day.id === todayIndex 
              : currentDay === day.id
            const isDayToday = day.id === todayIndex
            
            return (
              <button
                key={day.id}
                onClick={() => handleDayClick(day.id)}
                style={{
                  padding: '0.75rem',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  color: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600'
                }}>
                  {day.name}
                </div>
                {isDayToday && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#10b981',
                    fontWeight: '500',
                    marginTop: '0.25rem'
                  }}>
                    Vandaag
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      
      {/* Day totals - ENHANCED GREEN */}
      <div style={{
        padding: isMobile ? '0.875rem' : '1rem',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: '14px',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Calories with Apple icon */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0.3rem'
          }}>
            <Apple 
              size={isMobile ? 16 : 18} 
              color="#10b981" 
              style={{ opacity: 0.9 }} 
            />
            <span style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1
            }}>
              {Math.round(dayTotals.calories)}
            </span>
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: 'rgba(16, 185, 129, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              alignSelf: 'center'
            }}>
              kcal
            </span>
          </div>

          {/* Other Macros */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '1.125rem' : '1.5rem',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Target size={isMobile ? 14 : 16} color="#8b5cf6" style={{ opacity: 0.8 }} />
              <span style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {Math.round(dayTotals.protein)}g
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Zap size={isMobile ? 14 : 16} color="#ef4444" style={{ opacity: 0.8 }} />
              <span style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: '#ef4444'
              }}>
                {Math.round(dayTotals.carbs)}g
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Droplets size={isMobile ? 14 : 16} color="#3b82f6" style={{ opacity: 0.8 }} />
              <span style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: '#3b82f6'
              }}>
                {Math.round(dayTotals.fat)}g
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '3rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      {/* Meals list */}
      {!loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {displayMeals.map(meal => (
            <MealCard
              key={meal.slot}
              meal={meal}
              isChecked={checkedMeals[meal.slot] || false}
              isToday={isToday}
              onCheck={() => handleMealCheck(meal)}
              onInfo={() => onOpenInfo && onOpenInfo(meal)}
              onAlternatives={() => onOpenAlternatives && onOpenAlternatives(meal)}
              getMealImage={getMealImage}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
      
      {/* NEW: Apply Template Modal */}
      <ApplyTemplateModal
        isOpen={showApplyTemplate}
        onClose={() => setShowApplyTemplate(false)}
        templates={dayTemplates}
        currentDay={currentDayKey}
        onApply={handleApplyTemplate}
        isMobile={isMobile}
      />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Meal card component (unchanged)
function MealCard({ 
  meal, 
  isChecked, 
  isToday,
  onCheck, 
  onInfo, 
  onAlternatives,
  getMealImage,
  isMobile
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      onClick={(e) => {
        if (isToday && !e.target.closest('.action-button')) {
          onCheck()
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isChecked 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'rgba(17, 17, 17, 0.5)',
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '0.875rem' : '1rem',
        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.1)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        boxShadow: isChecked 
          ? '0 8px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(16, 185, 129, 0.05)'
          : '0 4px 16px rgba(0, 0, 0, 0.1)',
        cursor: isToday ? 'pointer' : 'default',
        transform: isHovered && isToday ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {isToday && isHovered && !isChecked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none'
        }} />
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        position: 'relative'
      }}>
        <div style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '12px',
          background: `url(${getMealImage(meal)}) center/cover`,
          border: `2px solid ${isChecked ? '#10b981' : 'rgba(16, 185, 129, 0.2)'}`,
          transition: 'all 0.3s ease',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isChecked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.85) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={24} color="white" strokeWidth={3} />
            </div>
          )}
          
          {isToday && !isChecked && isHovered && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid white',
                background: 'rgba(255, 255, 255, 0.15)'
              }} />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                color: isChecked ? 'rgba(16, 185, 129, 0.7)' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                {meal.timeSlot}
              </div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '700',
                color: isChecked ? '#10b981' : 'white',
                lineHeight: 1.2
              }}>
                {meal.meal_name}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: isChecked 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              fontSize: '0.7rem',
              color: isChecked 
                ? 'rgba(16, 185, 129, 0.8)' 
                : 'rgba(255, 255, 255, 0.4)',
              border: `1px solid ${isChecked 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(255, 255, 255, 0.08)'}`
            }}>
              <Clock size={12} />
              {Math.floor(meal.plannedTime)}:{meal.plannedTime % 1 === 0.5 ? '30' : '00'}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: isMobile ? '1rem' : '1.25rem',
            marginBottom: '0.625rem'
          }}>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ fontWeight: '700', color: isChecked ? '#10b981' : '#f59e0b' }}>
                {Math.round(meal.calories || 0)}
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                color: isChecked 
                  ? 'rgba(16, 185, 129, 0.6)' 
                  : 'rgba(245, 158, 11, 0.5)' 
              }}>
                kcal
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ fontWeight: '700', color: '#8b5cf6' }}>
                {Math.round(meal.protein || 0)}g
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(139, 92, 246, 0.5)' }}>
                eiwit
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ fontWeight: '700', color: '#ef4444' }}>
                {Math.round(meal.carbs || 0)}g
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(239, 68, 68, 0.5)' }}>
                carbs
              </span>
            </div>
            
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <span style={{ fontWeight: '700', color: '#3b82f6' }}>
                {Math.round(meal.fat || 0)}g
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(59, 130, 246, 0.5)' }}>
                vet
              </span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              className="action-button"
              onClick={(e) => {
                e.stopPropagation()
                onInfo()
              }}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              }}
            >
              <Info size={14} />
              Info
            </button>
            
            <button
              className="action-button"
              onClick={(e) => {
                e.stopPropagation()
                onAlternatives()
              }}
              style={{
                padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.15)'
              }}
            >
              <RefreshCw size={14} />
              Wissel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
