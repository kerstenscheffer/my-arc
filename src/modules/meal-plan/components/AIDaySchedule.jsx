// src/modules/meal-plan/components/AIDaySchedule.jsx
// 🎯 PREMIUM GREEN STYLING - ConsumedMealsView level design
// ✅ Props system INTACT - Only inline styles changed
import React, { useState, useEffect } from 'react'
import { 
  Calendar, Check, Info, RefreshCw, Clock, Copy, TrendingUp
} from 'lucide-react'
import ApplyTemplateModal from '../../client-meal-base/components/ApplyTemplateModal'

const getTodayIndex = () => {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

const truncateMealName = (name, maxLength) => {
  if (!name) return ''
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

export default function AIDaySchedule({
  activePlan,
  todayMeals,
  todayProgress,
  selectedDay,
  onDayChange,
  onCheckMeal,
  onUncheckMeal,
  onOpenInfo,
  onOpenAlternatives,
  dayTemplates = [],
  db,
  onPlanUpdate
}) {
  const isMobile = window.innerWidth <= 768
  
  const [currentDay, setCurrentDay] = useState(getTodayIndex())
  const [displayMeals, setDisplayMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [hoveredMeal, setHoveredMeal] = useState(null)
  const [checkedMeals, setCheckedMeals] = useState({})
  const [showApplyTemplate, setShowApplyTemplate] = useState(false)
  
  const daysOfWeek = [
    { id: 0, name: 'Ma', key: 'monday' },
    { id: 1, name: 'Di', key: 'tuesday' },
    { id: 2, name: 'Wo', key: 'wednesday' },
    { id: 3, name: 'Do', key: 'thursday' },
    { id: 4, name: 'Vr', key: 'friday' },
    { id: 5, name: 'Za', key: 'saturday' },
    { id: 6, name: 'Zo', key: 'sunday' }
  ]

  useEffect(() => {
    console.log('🔍 [AIDaySchedule] useEffect triggered - selectedDay:', selectedDay, 'currentDay:', currentDay)
    if (selectedDay) {
      const dayIndex = daysOfWeek.findIndex(d => d.key === selectedDay)
      console.log('🔍 [AIDaySchedule] Calculated dayIndex:', dayIndex, 'for selectedDay:', selectedDay)
      if (dayIndex !== -1 && dayIndex !== currentDay) {
        console.log('🔄 [AIDaySchedule] Syncing selectedDay prop:', selectedDay, '→ index:', dayIndex)
        setCurrentDay(dayIndex)
      } else if (dayIndex === currentDay) {
        console.log('⏭️ [AIDaySchedule] Day already selected, skipping update')
      }
    } else {
      console.log('⚠️ [AIDaySchedule] selectedDay is null/undefined')
    }
  }, [selectedDay, currentDay])

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
  
  const calculateDailyTotals = () => {
    if (!displayMeals || displayMeals.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    }
    
    return displayMeals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }
  
  const dailyTotals = calculateDailyTotals()
  
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
  
  useEffect(() => {
    const todayIdx = getTodayIndex()
    
    if (currentDay === todayIdx && todayMeals) {
      setDisplayMeals(todayMeals)
    } else {
      loadDayMeals(currentDay)
    }
  }, [currentDay, todayMeals, activePlan])
  
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
        
        if (typeof mealRef === 'object') {
          if (mealRef.calories) return mealRef
          if (mealRef.id || mealRef.meal_id) {
            const mealId = mealRef.id || mealRef.meal_id
            if (typeof mealId === 'string') {
              mealRef = mealId
            } else {
              return mealRef
            }
          }
        }
        
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
      
      if (dayPlan.snack1) {
        const mealData = await getMealData(dayPlan.snack1)
        if (mealData) {
          meals.push({
            ...mealData,
            slot: 'snack1',
            timeSlot: 'Snack 1',
            plannedTime: 10,
            meal_name: mealData.name || mealData.meal_name || 'Snack 1',
            meal_id: mealData.id || mealData.meal_id
          })
        }
      }
      
      if (dayPlan.snack2) {
        const mealData = await getMealData(dayPlan.snack2)
        if (mealData) {
          meals.push({
            ...mealData,
            slot: 'snack2',
            timeSlot: 'Snack 2',
            plannedTime: 15,
            meal_name: mealData.name || mealData.meal_name || 'Snack 2',
            meal_id: mealData.id || mealData.meal_id
          })
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
  
  const handleDayClick = (dayIndex) => {
    setCurrentDay(dayIndex)
    if (onDayChange) {
      onDayChange(daysOfWeek[dayIndex].key)
    }
  }
  
  const handleMealCheck = async (meal) => {
    const isCurrentlyChecked = checkedMeals[meal.slot]
    
    if (isCurrentlyChecked) {
      await onUncheckMeal(meal.slot)
      setCheckedMeals(prev => ({
        ...prev,
        [meal.slot]: false
      }))
    } else {
      await onCheckMeal(meal.slot, meal)
      setCheckedMeals(prev => ({
        ...prev,
        [meal.slot]: true
      }))
    }
  }
  
  const todayIdx = getTodayIndex()
  const isToday = currentDay === todayIdx
  
  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.5rem 0.25rem' : '0.75rem 0.75rem 0.5rem',
      background: '#000'
    }}>
      {/* 🎨 PREMIUM HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.625rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)'
          }}>
            <Calendar 
              size={isMobile ? 14 : 16} 
              color="#10b981"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))'
              }}
            />
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase'
          }}>
            Dagschema
          </div>
        </div>

        {dayTemplates.length > 0 && (
          <button
            onClick={() => setShowApplyTemplate(true)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Copy size={isMobile ? 13 : 14} />
            Template
          </button>
        )}
      </div>

      {/* 🎨 DAY SELECTOR - GLASSMORPHIC */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.375rem' : '0.5rem',
          justifyContent: 'space-between'
        }}>
          {daysOfWeek.map((day) => (
            <button
              key={day.id}
              onClick={() => handleDayClick(day.id)}
              style={{
                flex: 1,
                height: isMobile ? '44px' : '48px',
                borderRadius: '10px',
                background: day.id === currentDay
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: day.id === currentDay
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: day.id === currentDay ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: day.id === currentDay ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: day.id === currentDay
                  ? '0 0 16px rgba(16, 185, 129, 0.4)'
                  : 'none',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em'
              }}
              onMouseEnter={(e) => {
                if (day.id !== currentDay) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                  e.currentTarget.style.color = '#10b981'
                }
              }}
              onMouseLeave={(e) => {
                if (day.id !== currentDay) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      {/* 🎨 DAILY TOTALS BAR - GLASSMORPHIC */}
      {displayMeals.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '0.75rem' : '0.875rem',
          marginBottom: '0.75rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.625rem'
          }}>
            <div style={{
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)'
            }}>
              <TrendingUp size={isMobile ? 12 : 14} color="#10b981" />
            </div>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              Dag Totalen
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            <DailyTotalBadge 
              value={Math.round(dailyTotals.calories)}
              label="kcal"
              color="#10b981"
              isMobile={isMobile}
            />
            <DailyTotalBadge 
              value={Math.round(dailyTotals.protein)}
              label="P"
              color="#8b5cf6"
              isMobile={isMobile}
            />
            <DailyTotalBadge 
              value={Math.round(dailyTotals.carbs)}
              label="C"
              color="#ef4444"
              isMobile={isMobile}
            />
            <DailyTotalBadge 
              value={Math.round(dailyTotals.fat)}
              label="F"
              color="#3b82f6"
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* MEAL CARDS */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.875rem'
        }}>
          Laden...
        </div>
      ) : displayMeals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem 1rem' : '2.5rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.875rem' : '0.95rem'
        }}>
          Geen maaltijden gepland voor deze dag
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.5rem' : '0.625rem'
        }}>
          {displayMeals.map((meal, index) => (
            <MealCard
              key={`${meal.slot}-${index}`}
              meal={meal}
              isChecked={checkedMeals[meal.slot]}
              isMobile={isMobile}
              onCheck={() => handleMealCheck(meal)}
              onInfo={() => onOpenInfo(meal)}
              onAlternatives={() => onOpenAlternatives(meal)}
              getMealImage={getMealImage}
              truncateMealName={truncateMealName}
            />
          ))}
        </div>
      )}

      {showApplyTemplate && (
        <ApplyTemplateModal
          isOpen={showApplyTemplate}
          onClose={() => setShowApplyTemplate(false)}
          dayTemplates={dayTemplates}
          currentDayKey={daysOfWeek[currentDay].key}
          activePlan={activePlan}
          db={db}
          onSuccess={() => {
            setShowApplyTemplate(false)
            if (onPlanUpdate) onPlanUpdate()
            loadDayMeals(currentDay)
          }}
        />
      )}
    </div>
  )
}

const DailyTotalBadge = ({ value, label, color, isMobile }) => (
  <div style={{
    background: `${color}10`,
    border: `1px solid ${color}33`,
    borderRadius: '8px',
    padding: isMobile ? '0.5rem' : '0.625rem',
    textAlign: 'center',
    boxShadow: `0 0 8px ${color}15`
  }}>
    <div style={{
      fontSize: isMobile ? '1rem' : '1.125rem',
      fontWeight: '800',
      color: color,
      marginBottom: '0.125rem',
      textShadow: `0 0 12px ${color}40`
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '0.65rem',
      color: `${color}99`,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.03em'
    }}>
      {label}
    </div>
  </div>
)

const MealCard = ({ 
  meal, 
  isChecked, 
  isMobile, 
  onCheck, 
  onInfo, 
  onAlternatives,
  getMealImage,
  truncateMealName
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onCheck}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isChecked
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        backdropFilter: 'blur(12px)',
        border: isChecked 
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isHovered || isChecked
          ? '0 4px 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 8px rgba(16, 185, 129, 0.08)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.75rem' : '0.875rem',
        alignItems: 'flex-start'
      }}>
        <div style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '8px',
          background: `url(${getMealImage(meal)}) center/cover`,
          border: `2px solid ${isChecked ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isChecked ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
        }}>
          {isChecked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(16, 185, 129, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={20} color="white" strokeWidth={3} />
            </div>
          )}
        </div>
        
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.375rem',
            minWidth: 0
          }}>
            <div style={{ 
              flex: 1, 
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '0.65rem',
                color: isChecked ? 'rgba(16, 185, 129, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.125rem'
              }}>
                {meal.timeSlot}
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                color: isChecked ? '#10b981' : 'white',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {truncateMealName(meal.meal_name, isMobile ? 18 : 28)}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.375rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
              marginLeft: '0.5rem',
              fontWeight: '700',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)'
            }}>
              <Clock size={10} />
              {Math.floor(meal.plannedTime)}:{meal.plannedTime % 1 === 0.5 ? '30' : '00'}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.625rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <MacroBadge value={meal.calories} label="kcal" color="#10b981" isMobile={isMobile} />
            <MacroBadge value={meal.protein} label="P" color="#8b5cf6" isMobile={isMobile} />
            <MacroBadge value={meal.carbs} label="C" color="#ef4444" isMobile={isMobile} />
            <MacroBadge value={meal.fat} label="F" color="#3b82f6" isMobile={isMobile} />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.375rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInfo()
              }}
              style={{
                padding: '0.375rem 0.625rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                color: '#10b981',
                fontSize: '0.7rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <Info size={11} />
              Info
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAlternatives()
              }}
              style={{
                padding: '0.375rem 0.625rem',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                color: '#fbbf24',
                fontSize: '0.7rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.25)'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <RefreshCw size={11} />
              Wissel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MacroBadge = ({ value, label, color, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: isMobile ? '0.25rem 0.375rem' : '0.25rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '6px',
    border: `1px solid ${color}33`,
    fontSize: isMobile ? '0.7rem' : '0.75rem'
  }}>
    <span style={{
      fontWeight: '700',
      color: color
    }}>
      {Math.round(value || 0)}
    </span>
    <span style={{
      color: `${color}99`,
      fontSize: '0.65rem',
      fontWeight: '600'
    }}>
      {label}
    </span>
  </div>
)
