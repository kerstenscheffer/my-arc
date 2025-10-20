// src/modules/ai-meal-generator/tabs/plan-builder/DayMealsList.jsx
// Day meals list - Displays all meals for a single day

import { Clock, Lock } from 'lucide-react'

export default function DayMealsList({
  dayData,
  mealSlots,
  isMobile
}) {
  if (!dayData) return null
  
  // Build meals array from day data
  const getMeals = () => {
    const meals = []
    
    if (dayData.breakfast) {
      meals.push({
        slot: 'breakfast',
        ...mealSlots.find(s => s.id === 'breakfast'),
        meal: dayData.breakfast
      })
    }
    
    if (dayData.lunch) {
      meals.push({
        slot: 'lunch',
        ...mealSlots.find(s => s.id === 'lunch'),
        meal: dayData.lunch
      })
    }
    
    if (dayData.dinner) {
      meals.push({
        slot: 'dinner',
        ...mealSlots.find(s => s.id === 'dinner'),
        meal: dayData.dinner
      })
    }
    
    dayData.snacks?.forEach((snack, index) => {
      if (snack) {
        meals.push({
          slot: `snack${index + 1}`,
          ...mealSlots.find(s => s.id === `snack${index + 1}`) || {
            label: `🥜 Snack ${index + 1}`,
            time: '15:00',
            color: '#ec4899'
          },
          meal: snack
        })
      }
    })
    
    return meals
  }
  
  const meals = getMeals()
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {meals.map((slot, index) => (
        <div key={index} style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px',
          border: slot.meal?.forced 
            ? '1px solid rgba(245, 158, 11, 0.3)'
            : '1px solid rgba(255,255,255,0.1)',
          padding: isMobile ? '0.75rem' : '1rem',
          position: 'relative'
        }}>
          {/* Forced Badge */}
          {slot.meal?.forced && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '10px',
              background: '#f59e0b',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              fontWeight: '600',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <Lock size={10} />
              Verplicht
            </div>
          )}
          
          {/* AI Score Badge */}
          {slot.meal?.aiScore > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.65rem',
              fontWeight: '600',
              color: '#fff'
            }}>
              AI: {slot.meal.aiScore}
            </div>
          )}
          
          {/* Slot Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                {slot.time}
              </span>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: slot.color || '#fff'
              }}>
                {slot.label}
              </span>
            </div>
          </div>
          
          {/* Meal Info */}
          {slot.meal && (
            <>
              <h4 style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                {slot.meal.name}
              </h4>
              
              {/* Macros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                fontSize: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>kcal</div>
                  <strong style={{ color: '#fff' }}>
                    {Math.round(slot.meal.calories || 0)}
                  </strong>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>eiwit</div>
                  <strong style={{ color: '#10b981' }}>
                    {Math.round(slot.meal.protein || 0)}g
                  </strong>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>carbs</div>
                  <strong style={{ color: '#3b82f6' }}>
                    {Math.round(slot.meal.carbs || 0)}g
                  </strong>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>vet</div>
                  <strong style={{ color: '#f59e0b' }}>
                    {Math.round(slot.meal.fat || 0)}g
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
