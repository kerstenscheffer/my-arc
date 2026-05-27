// src/modules/meal-plan/components/day-schedule/MealTimelineDesktop.jsx
// 🎯 Desktop timeline - Hour headers HORIZONTAL, cards full width below
// ✨ UPDATED: ALL hours (6,7,8,9...22) instead of 2-hour intervals

import React, { useRef, useEffect } from 'react'
import MealCard from './MealCard'
import CurrentTimeIndicator from './CurrentTimeIndicator'

// Hour slots for timeline - ALL HOURS (6:00 - 22:00)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6-22

export default function MealTimelineDesktop({
  meals,
  checkedMeals,
  onMealCheck,
  onOpenInfo,
  onOpenAlternatives,
  isToday,
  isMobile
}) {
  const timelineRef = useRef(null)
  
  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current && isToday) {
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour >= 6 && currentHour <= 22) {
        const scrollPosition = Math.max(0, (currentHour - 6) * 60)
        timelineRef.current.scrollTop = scrollPosition
      }
    }
  }, [isToday])
  
  // Get meals for specific hour
  const getMealsForHour = (hour) => {
    return meals.filter(meal => {
      const mealHour = Math.floor(meal.plannedTime)
      return mealHour === hour
    })
  }
  
  return (
    <div 
      ref={timelineRef}
      style={{
        maxHeight: '500px',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 215, 0, 0.1)'
      }}
    >
      <div style={{ position: 'relative' }}>
        {HOURS.map(hour => {
          const hourMeals = getMealsForHour(hour)
          
          return (
            <div key={hour}>
              {/* Hour Header - HORIZONTAL on top */}
              <div style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '700',
                background: 'rgba(0, 0, 0, 0.3)',
                borderBottom: '2px solid rgba(255, 215, 0, 0.2)',
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}>
                {hour}:00
              </div>
              
              {/* Meals Section - Full Width */}
              <div style={{
                padding: hourMeals.length > 0 ? '0.75rem' : '0',
                minHeight: hourMeals.length > 0 ? '60px' : '40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {hourMeals.length > 0 && hourMeals.map((meal, idx) => (
                  <MealCard
                    key={`${meal.slot}-${idx}`}
                    meal={meal}
                    isChecked={checkedMeals[meal.slot]}
                    onCheck={() => onMealCheck(meal)}
                    onInfo={() => onOpenInfo(meal)}
                    onAlternatives={() => onOpenAlternatives(meal)}
                    isMobile={false}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          )
        })}
        
        {/* Current time indicator */}
        {isToday && <CurrentTimeIndicator />}
      </div>
    </div>
  )
}
