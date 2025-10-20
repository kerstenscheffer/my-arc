// src/modules/ai-meal-generator/tabs/plan-builder/WeekPlanDisplay.jsx
// FIXED VERSION - Shows scaled macros correctly

import { Calendar, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'

export default function WeekPlanDisplay({
  currentPlan,
  activeDay,
  setActiveDay,
  dailyTargets,
  mealsPerDay,
  totalSlots,
  handleGeneratePlan,
  generating,
  isMobile
}) {
  const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  if (!currentPlan || !currentPlan.weekPlan) {
    return null
  }
  
  const currentDayData = currentPlan.weekPlan[activeDay] || {}
  
  // Get slot names based on meals per day
  const getSlotNames = () => {
    const slots = ['breakfast', 'lunch', 'dinner']
    if (mealsPerDay > 3) {
      for (let i = 1; i <= mealsPerDay - 3; i++) {
        slots.push(`snack${i}`)
      }
    }
    return slots
  }
  
  const slotNames = getSlotNames()
  const slotDisplayNames = {
    breakfast: 'Ontbijt',
    lunch: 'Lunch',
    dinner: 'Diner',
    snack1: 'Snack 1',
    snack2: 'Snack 2',
    snack3: 'Snack 3'
  }
  
  // CRITICAL FIX: Calculate scaled macros for a meal
  const getScaledMacros = (meal) => {
    if (!meal) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    const scale = meal.scale_factor || 1.0
    
    return {
      calories: Math.round((meal.calories || 0) * scale),
      protein: Math.round((meal.protein || 0) * scale),
      carbs: Math.round((meal.carbs || 0) * scale),
      fat: Math.round((meal.fat || 0) * scale)
    }
  }
  
  // Helper to format meal display
  const formatMealDisplay = (meal) => {
    if (!meal) return null
    
    const scaledMacros = getScaledMacros(meal)
    const scale = meal.scale_factor || 1.0
    const scalePercentage = Math.round(scale * 100)
    
    return {
      name: meal.name,
      scaledMacros,
      scalePercentage,
      isScaled: scale !== 1.0,
      originalCalories: meal.calories
    }
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: isMobile ? '1rem' : '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={20} style={{ color: '#10b981' }} />
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            Week Overzicht
          </h3>
        </div>
        
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '36px',
            touchAction: 'manipulation'
          }}
        >
          <RefreshCw size={16} className={generating ? 'spinning' : ''} />
          Regenerate
        </button>
      </div>
      
      {/* Day Selector */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
          disabled={activeDay === 0}
          style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: activeDay === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
            cursor: activeDay === 0 ? 'not-allowed' : 'pointer',
            minWidth: '36px',
            minHeight: '36px',
            touchAction: 'manipulation'
          }}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flex: 1
        }}>
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => setActiveDay(index)}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                background: activeDay === index 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: activeDay === index 
                  ? '1px solid #10b981'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: activeDay === index ? '#10b981' : 'rgba(255,255,255,0.7)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: activeDay === index ? '600' : '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '36px',
                touchAction: 'manipulation',
                transition: 'all 0.3s ease'
              }}
            >
              {isMobile ? day.slice(0, 2) : day}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setActiveDay(Math.min(6, activeDay + 1))}
          disabled={activeDay === 6}
          style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: activeDay === 6 ? 'rgba(255,255,255,0.3)' : '#fff',
            cursor: activeDay === 6 ? 'not-allowed' : 'pointer',
            minWidth: '36px',
            minHeight: '36px',
            touchAction: 'manipulation'
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Day Content */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Day Stats Summary */}
        {currentDayData.totals && (
          <div style={{
            marginBottom: '1.5rem',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.75rem'
            }}>
              Dag Totalen
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Calorieën</span>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  color: Math.abs(currentDayData.totals.kcal - dailyTargets.calories) < dailyTargets.calories * 0.05 
                    ? '#10b981' 
                    : '#f59e0b'
                }}>
                  {Math.round(currentDayData.totals.kcal)} / {dailyTargets.calories}
                </div>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Eiwitten</span>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  color: Math.abs(currentDayData.totals.protein - dailyTargets.protein) < dailyTargets.protein * 0.05 
                    ? '#10b981' 
                    : '#f59e0b'
                }}>
                  {Math.round(currentDayData.totals.protein)}g / {dailyTargets.protein}g
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Meals List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {slotNames.map(slot => {
            const meal = currentDayData[slot]
            const mealData = formatMealDisplay(meal)
            
            return (
              <div key={slot} style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: meal 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                  : 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: meal 
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {slotDisplayNames[slot] || slot}
                    </h5>
                    
                    {mealData ? (
                      <>
                        <div style={{
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.5rem'
                        }}>
                          {mealData.name}
                          {mealData.isScaled && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.2rem 0.5rem',
                              background: mealData.scalePercentage > 100 
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: mealData.scalePercentage > 100 ? '#10b981' : '#f59e0b',
                              border: `1px solid ${mealData.scalePercentage > 100 ? '#10b981' : '#f59e0b'}40`
                            }}>
                              {mealData.scalePercentage}%
                            </span>
                          )}
                        </div>
                        
                        {/* Scaled Macros Display */}
                        <div style={{
                          display: 'flex',
                          gap: isMobile ? '0.75rem' : '1rem',
                          fontSize: isMobile ? '0.85rem' : '0.9rem',
                          color: 'rgba(255,255,255,0.8)'
                        }}>
                          <span style={{ color: '#f59e0b' }}>
                            {mealData.scaledMacros.calories} kcal
                            {mealData.isScaled && (
                              <span style={{ 
                                color: 'rgba(255,255,255,0.4)', 
                                fontSize: '0.75rem',
                                marginLeft: '0.25rem'
                              }}>
                                ({mealData.originalCalories})
                              </span>
                            )}
                          </span>
                          <span style={{ color: '#8b5cf6' }}>
                            {mealData.scaledMacros.protein}g P
                          </span>
                          <span style={{ color: '#3b82f6' }}>
                            {mealData.scaledMacros.carbs}g C
                          </span>
                          <span style={{ color: '#10b981' }}>
                            {mealData.scaledMacros.fat}g F
                          </span>
                        </div>
                        
                        {/* Forced/AI indicator */}
                        {meal.forced && (
                          <div style={{
                            marginTop: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#f59e0b'
                          }}>
                            {meal.fromFrequency ? 'Frequency' : 'Forced'}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontStyle: 'italic'
                      }}>
                        Geen maaltijd toegewezen
                      </div>
                    )}
                  </div>
                  
                  {mealData && meal.aiScore !== null && meal.aiScore !== undefined && (
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#8b5cf6'
                    }}>
                      AI: {meal.aiScore}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Accuracy Badge */}
        {currentDayData.accuracy && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ color: '#3b82f6' }} />
              <span style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.7)'
              }}>
                Macro Accuracy
              </span>
            </div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: currentDayData.accuracy.total >= 90 ? '#10b981' : '#f59e0b'
            }}>
              {currentDayData.accuracy.total}%
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
