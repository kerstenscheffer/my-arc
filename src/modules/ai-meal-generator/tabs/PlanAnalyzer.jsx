// src/modules/ai-meal-generator/tabs/PlanAnalyzer.jsx
// TAB 4: Analyze & Edit Generated Plan - FIXED VERSION

import { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Edit3, Shuffle, DollarSign, ShoppingCart, Info,
  Target, Activity, Clock, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, X, Percent, Scale
} from 'lucide-react'

export default function PlanAnalyzer({
  db,
  generatedPlan,
  planModifications,
  setPlanModifications,
  dailyTargets,
  isMobile
}) {
  // States
  const [activeDay, setActiveDay] = useState(0)
  const [weekAnalysis, setWeekAnalysis] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [replacementMeals, setReplacementMeals] = useState([])
  const [loadingReplacements, setLoadingReplacements] = useState(false)
  const [showDetails, setShowDetails] = useState({
    macros: true,
    costs: false,
    shopping: false,
    warnings: true
  })
  
  const weekDays = [
    { id: 'monday', label: 'Ma', fullLabel: 'Maandag' },
    { id: 'tuesday', label: 'Di', fullLabel: 'Dinsdag' },
    { id: 'wednesday', label: 'Wo', fullLabel: 'Woensdag' },
    { id: 'thursday', label: 'Do', fullLabel: 'Donderdag' },
    { id: 'friday', label: 'Vr', fullLabel: 'Vrijdag' },
    { id: 'saturday', label: 'Za', fullLabel: 'Zaterdag' },
    { id: 'sunday', label: 'Zo', fullLabel: 'Zondag' }
  ]
  
  // Analyze plan when loaded or modified
  useEffect(() => {
    if (generatedPlan?.weekPlan) {
      analyzePlan()
    }
  }, [generatedPlan, planModifications])
  
  const analyzePlan = () => {
    if (!generatedPlan?.weekPlan) return
    
    const analysis = {
      dailyTotals: [],
      weekTotal: { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 },
      warnings: [],
      shoppingList: generatedPlan.aiAnalysis?.shoppingList || {},
      mealFrequency: {},
      ingredientUsage: {}
    }
    
    // Get current plan (with modifications if any)
    const currentPlan = getModifiedPlan()
    
    // Analyze each day
    currentPlan.forEach((day, dayIndex) => {
      const dayTotal = { 
        calories: day.totals?.kcal || 0,
        protein: day.totals?.protein || 0,
        carbs: day.totals?.carbs || 0,
        fat: day.totals?.fat || 0,
        cost: 0,
        accuracy: day.accuracy?.total || 0
      }
      
      // Get all meals for the day
      const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter(Boolean)
      
      meals.forEach(meal => {
        // Track meal frequency
        const mealName = meal.name
        analysis.mealFrequency[mealName] = (analysis.mealFrequency[mealName] || 0) + 1
        
        // Calculate cost (estimate if not provided)
        const mealCost = meal.total_cost || 5
        dayTotal.cost += mealCost
        
        // Track ingredient usage
        if (meal.ingredients_list && typeof meal.ingredients_list === 'object') {
          Object.keys(meal.ingredients_list).forEach(ing => {
            analysis.ingredientUsage[ing] = (analysis.ingredientUsage[ing] || 0) + 1
          })
        }
      })
      
      analysis.dailyTotals.push(dayTotal)
      
      // Add to week total
      analysis.weekTotal.calories += dayTotal.calories
      analysis.weekTotal.protein += dayTotal.protein
      analysis.weekTotal.carbs += dayTotal.carbs
      analysis.weekTotal.fat += dayTotal.fat
      analysis.weekTotal.cost += dayTotal.cost
      
      // Check for warnings
      const calorieDiff = Math.abs(dayTotal.calories - dailyTargets.calories)
      const proteinDiff = Math.abs(dayTotal.protein - dailyTargets.protein)
      
      if (calorieDiff > dailyTargets.calories * 0.15) {
        analysis.warnings.push({
          type: 'calories',
          day: dayIndex,
          message: `${weekDays[dayIndex].fullLabel}: ${dayTotal.calories < dailyTargets.calories ? 'Te weinig' : 'Te veel'} calorieën (${Math.round(dayTotal.calories)} vs ${dailyTargets.calories})`,
          severity: calorieDiff > dailyTargets.calories * 0.25 ? 'high' : 'medium'
        })
      }
      
      if (proteinDiff > dailyTargets.protein * 0.15) {
        analysis.warnings.push({
          type: 'protein',
          day: dayIndex,
          message: `${weekDays[dayIndex].fullLabel}: ${dayTotal.protein < dailyTargets.protein ? 'Te weinig' : 'Te veel'} eiwit (${Math.round(dayTotal.protein)}g vs ${dailyTargets.protein}g)`,
          severity: proteinDiff > dailyTargets.protein * 0.25 ? 'high' : 'medium'
        })
      }
    })
    
    // Check for meal repetition warnings
    Object.entries(analysis.mealFrequency).forEach(([meal, count]) => {
      if (count > 3) {
        analysis.warnings.push({
          type: 'variety',
          message: `"${meal}" komt ${count}x voor in de week`,
          severity: count > 4 ? 'medium' : 'low'
        })
      }
    })
    
    // Calculate averages
    analysis.dailyAverage = {
      calories: Math.round(analysis.weekTotal.calories / 7),
      protein: Math.round(analysis.weekTotal.protein / 7),
      carbs: Math.round(analysis.weekTotal.carbs / 7),
      fat: Math.round(analysis.weekTotal.fat / 7),
      cost: (analysis.weekTotal.cost / 7).toFixed(2)
    }
    
    // Add shopping list from AI analysis if available
    if (generatedPlan.stats?.shoppingList) {
      analysis.shoppingList = generatedPlan.stats.shoppingList
    }
    
    setWeekAnalysis(analysis)
  }
  
  // Get plan with modifications applied
  const getModifiedPlan = () => {
    if (!generatedPlan?.weekPlan) return []
    
    return generatedPlan.weekPlan.map((day, index) => {
      if (planModifications && planModifications[index]) {
        return planModifications[index]
      }
      return day
    })
  }
  
  // Load replacement meals using AI service
  const loadReplacementMeals = async (dayIndex, slotType) => {
    if (!db) return
    
    setLoadingReplacements(true)
    try {
      // Get AI service
      const aiService = await db.getAIMealPlanningService()
      
      // Load all meals
      const allMeals = await aiService.loadAIMeals()
      
      // Filter by meal type
      const filteredMeals = allMeals.filter(meal => {
        if (slotType === 'breakfast' && meal.timing?.includes('breakfast')) return true
        if (slotType === 'lunch' && meal.timing?.includes('lunch')) return true
        if (slotType === 'dinner' && meal.timing?.includes('dinner')) return true
        if (slotType === 'snack' && meal.timing?.includes('snack')) return true
        return false
      })
      
      // Score and sort meals
      if (generatedPlan?.clientProfile) {
        const scoredMeals = aiService.scoreAllMeals(
          filteredMeals,
          generatedPlan.clientProfile,
          generatedPlan.ingredientPreferences?.excluded || [],
          generatedPlan.ingredientPreferences?.selected || []
        )
        
        // Get top 10 alternatives
        setReplacementMeals(scoredMeals.slice(0, 10))
      } else {
        // Fallback: just take first 10
        setReplacementMeals(filteredMeals.slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading replacement meals:', error)
      setReplacementMeals([])
    } finally {
      setLoadingReplacements(false)
    }
  }
  
  // Replace meal in plan
  const replaceMeal = (dayIndex, slotType, newMeal) => {
    const currentPlan = getModifiedPlan()
    const modifiedDay = { ...currentPlan[dayIndex] }
    
    // Replace the meal
    if (slotType === 'breakfast') {
      modifiedDay.breakfast = newMeal
    } else if (slotType === 'lunch') {
      modifiedDay.lunch = newMeal
    } else if (slotType === 'dinner') {
      modifiedDay.dinner = newMeal
    } else if (slotType.startsWith('snack')) {
      const snackIndex = parseInt(slotType.replace('snack', '')) - 1
      if (!modifiedDay.snacks) modifiedDay.snacks = []
      modifiedDay.snacks[snackIndex] = newMeal
    }
    
    // Recalculate totals
    const meals = [modifiedDay.breakfast, modifiedDay.lunch, modifiedDay.dinner, ...modifiedDay.snacks].filter(Boolean)
    modifiedDay.totals = {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
    
    meals.forEach(meal => {
      modifiedDay.totals.kcal += meal.calories || 0
      modifiedDay.totals.protein += meal.protein || 0
      modifiedDay.totals.carbs += meal.carbs || 0
      modifiedDay.totals.fat += meal.fat || 0
    })
    
    // Recalculate accuracy
    const calAccuracy = 100 - Math.min(20, Math.abs(100 - (modifiedDay.totals.kcal / dailyTargets.calories * 100)))
    const protAccuracy = 100 - Math.min(20, Math.abs(100 - (modifiedDay.totals.protein / dailyTargets.protein * 100)))
    
    modifiedDay.accuracy = {
      total: Math.round((calAccuracy + protAccuracy) / 2),
      calories: Math.round(calAccuracy),
      protein: Math.round(protAccuracy)
    }
    
    // Update modifications
    const newModifications = { ...planModifications }
    newModifications[dayIndex] = modifiedDay
    setPlanModifications(newModifications)
    
    // Close edit mode
    setEditMode(false)
    setSelectedSlot(null)
    setReplacementMeals([])
  }
  
  // Get current day's data
  const getCurrentDayData = () => {
    const plan = getModifiedPlan()
    return plan[activeDay] || null
  }
  
  // Get macro comparison
  const getMacroComparison = (actual, target) => {
    const percentage = (actual / target) * 100
    return {
      percentage: Math.round(percentage),
      color: percentage < 85 ? '#ef4444' : percentage > 115 ? '#f59e0b' : '#10b981',
      status: percentage < 85 ? 'Te laag' : percentage > 115 ? 'Te hoog' : 'Perfect'
    }
  }
  
  if (!generatedPlan?.weekPlan) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>Genereer eerst een weekplan in Tab 3</p>
      </div>
    )
  }
  
  const currentDay = getCurrentDayData()
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <BarChart3 size={24} style={{ color: '#3b82f6' }} />
          Plan Analyse & Aanpassingen
        </h2>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          Analyseer het gegenereerde plan en maak aanpassingen waar nodig
        </p>
      </div>
      
      {/* Quick Stats */}
      {weekAnalysis && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* Daily Average Calories */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.25rem'
            }}>
              Gem. Calorieën
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: getMacroComparison(weekAnalysis.dailyAverage.calories, dailyTargets.calories).color
            }}>
              {weekAnalysis.dailyAverage.calories}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              Target: {dailyTargets.calories}
            </div>
          </div>
          
          {/* Daily Average Protein */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.25rem'
            }}>
              Gem. Eiwit
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              {weekAnalysis.dailyAverage.protein}g
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: getMacroComparison(weekAnalysis.dailyAverage.protein, dailyTargets.protein).color
            }}>
              {getMacroComparison(weekAnalysis.dailyAverage.protein, dailyTargets.protein).percentage}%
            </div>
          </div>
          
          {/* Week Cost */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.25rem'
            }}>
              Week Kosten
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#f59e0b'
            }}>
              €{weekAnalysis.weekTotal.cost.toFixed(0)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              €{weekAnalysis.dailyAverage.cost}/dag
            </div>
          </div>
          
          {/* Unique Meals */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.25rem'
            }}>
              Unieke Meals
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#8b5cf6'
            }}>
              {Object.keys(weekAnalysis.mealFrequency).length}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              Variatie
            </div>
          </div>
          
          {/* Warnings */}
          <div style={{
            background: weekAnalysis.warnings.length > 0 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
            borderRadius: '10px',
            border: weekAnalysis.warnings.length > 0
              ? '1px solid rgba(239, 68, 68, 0.2)'
              : '1px solid rgba(16, 185, 129, 0.2)',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.25rem'
            }}>
              Meldingen
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: weekAnalysis.warnings.length > 0 ? '#ef4444' : '#10b981'
            }}>
              {weekAnalysis.warnings.length}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              {weekAnalysis.warnings.length > 0 ? 'Check' : 'OK'}
            </div>
          </div>
        </div>
      )}
      
      {/* Day Navigation */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: isMobile ? '0.75rem' : '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
            disabled={activeDay === 0}
            style={{
              padding: '0.5rem',
              background: activeDay === 0 ? 'transparent' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: activeDay === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
              cursor: activeDay === 0 ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              touchAction: 'manipulation'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            {weekDays[activeDay].fullLabel}
          </h3>
          
          <button
            onClick={() => setActiveDay(Math.min(6, activeDay + 1))}
            disabled={activeDay === 6}
            style={{
              padding: '0.5rem',
              background: activeDay === 6 ? 'transparent' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: activeDay === 6 ? 'rgba(255,255,255,0.3)' : '#fff',
              cursor: activeDay === 6 ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              touchAction: 'manipulation'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Day Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {weekDays.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveDay(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === activeDay 
                  ? '#10b981' 
                  : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Current Day Meals */}
      {currentDay && (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {/* Breakfast */}
            {currentDay.breakfast && (
              <MealSlot
                meal={currentDay.breakfast}
                slotType="breakfast"
                slotLabel="🌅 Ontbijt"
                onReplace={() => {
                  setEditMode(true)
                  setSelectedSlot('breakfast')
                  loadReplacementMeals(activeDay, 'breakfast')
                }}
                isMobile={isMobile}
              />
            )}
            
            {/* Lunch */}
            {currentDay.lunch && (
              <MealSlot
                meal={currentDay.lunch}
                slotType="lunch"
                slotLabel="🥗 Lunch"
                onReplace={() => {
                  setEditMode(true)
                  setSelectedSlot('lunch')
                  loadReplacementMeals(activeDay, 'lunch')
                }}
                isMobile={isMobile}
              />
            )}
            
            {/* Dinner */}
            {currentDay.dinner && (
              <MealSlot
                meal={currentDay.dinner}
                slotType="dinner"
                slotLabel="🍽️ Diner"
                onReplace={() => {
                  setEditMode(true)
                  setSelectedSlot('dinner')
                  loadReplacementMeals(activeDay, 'dinner')
                }}
                isMobile={isMobile}
              />
            )}
            
            {/* Snacks */}
            {currentDay.snacks?.map((snack, index) => (
              snack && (
                <MealSlot
                  key={index}
                  meal={snack}
                  slotType={`snack${index + 1}`}
                  slotLabel={`🥜 Snack ${index + 1}`}
                  onReplace={() => {
                    setEditMode(true)
                    setSelectedSlot(`snack${index + 1}`)
                    loadReplacementMeals(activeDay, 'snack')
                  }}
                  isMobile={isMobile}
                />
              )
            ))}
          </div>
          
          {/* Day Totals */}
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={16} />
              Dag Totalen & Accuracy
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Macros
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>kcal: </span>
                    <strong style={{ 
                      color: getMacroComparison(currentDay.totals?.kcal || 0, dailyTargets.calories).color
                    }}>
                      {Math.round(currentDay.totals?.kcal || 0)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>P: </span>
                    <strong style={{ 
                      color: getMacroComparison(currentDay.totals?.protein || 0, dailyTargets.protein).color
                    }}>
                      {Math.round(currentDay.totals?.protein || 0)}g
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>C: </span>
                    <strong style={{ color: '#3b82f6' }}>
                      {Math.round(currentDay.totals?.carbs || 0)}g
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>F: </span>
                    <strong style={{ color: '#f59e0b' }}>
                      {Math.round(currentDay.totals?.fat || 0)}g
                    </strong>
                  </div>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Nauwkeurigheid
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: currentDay.accuracy?.total >= 90 ? '#10b981' :
                         currentDay.accuracy?.total >= 75 ? '#f59e0b' : '#ef4444'
                }}>
                  {currentDay.accuracy?.total || 0}%
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  Cal: {currentDay.accuracy?.calories || 0}% | 
                  Prot: {currentDay.accuracy?.protein || 0}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Section Toggles */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {Object.entries({
          warnings: { label: 'Waarschuwingen', icon: AlertTriangle, count: weekAnalysis?.warnings.length },
          shopping: { label: 'Boodschappen', icon: ShoppingCart },
          costs: { label: 'Kosten', icon: DollarSign }
        }).map(([key, section]) => {
          const Icon = section.icon
          return (
            <button
              key={key}
              onClick={() => setShowDetails(prev => ({ ...prev, [key]: !prev[key] }))}
              style={{
                padding: '0.5rem 0.75rem',
                background: showDetails[key]
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showDetails[key] ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                color: showDetails[key] ? '#10b981' : 'rgba(255,255,255,0.6)',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: showDetails[key] ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                touchAction: 'manipulation'
              }}
            >
              <Icon size={16} />
              {section.label}
              {section.count !== undefined && section.count > 0 && (
                <span style={{
                  background: '#ef4444',
                  borderRadius: '10px',
                  padding: '0 6px',
                  fontSize: '0.7rem',
                  color: '#fff'
                }}>
                  {section.count}
                </span>
              )}
              {showDetails[key] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )
        })}
      </div>
      
      {/* Warnings Section */}
      {showDetails.warnings && weekAnalysis?.warnings.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#ef4444',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={20} />
            Waarschuwingen & Suggesties
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {weekAnalysis.warnings.map((warning, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                background: warning.severity === 'high' 
                  ? 'rgba(239, 68, 68, 0.05)'
                  : warning.severity === 'medium'
                    ? 'rgba(245, 158, 11, 0.05)'
                    : 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: `1px solid ${
                  warning.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                  warning.severity === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                  'rgba(255,255,255,0.1)'
                }`,
                fontSize: '0.875rem',
                color: '#fff'
              }}>
                {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Shopping List */}
      {showDetails.shopping && weekAnalysis?.shoppingList && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#3b82f6',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShoppingCart size={20} />
            Boodschappenlijst
          </h3>
          
          {weekAnalysis.shoppingList.ingredients ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {weekAnalysis.shoppingList.ingredients
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item, index) => (
                  <div key={index} style={{
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.85rem',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{item.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {Math.round(item.totalAmount)}{item.unit || 'g'}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Genereer eerst een shopping list in tab 3
            </p>
          )}
        </div>
      )}
      
      {/* Costs Overview */}
      {showDetails.costs && weekAnalysis && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <DollarSign size={20} />
            Kosten Overzicht
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Week Totaal
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                €{weekAnalysis.weekTotal.cost.toFixed(2)}
              </div>
            </div>
            
            <div style={{
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Per Dag
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>
                €{weekAnalysis.dailyAverage.cost}
              </div>
            </div>
            
            <div style={{
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Per Maaltijd
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                €{(weekAnalysis.weekTotal.cost / (7 * 4)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Replacement Modal */}
      {editMode && selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#111',
            borderRadius: '16px',
            border: '1px solid #333',
            padding: isMobile ? '1.5rem' : '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                Vervang {selectedSlot === 'breakfast' ? 'Ontbijt' :
                         selectedSlot === 'lunch' ? 'Lunch' :
                         selectedSlot === 'dinner' ? 'Diner' :
                         selectedSlot.startsWith('snack') ? 'Snack' : ''}
              </h3>
              
              <button
                onClick={() => {
                  setEditMode(false)
                  setSelectedSlot(null)
                  setReplacementMeals([])
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {loadingReplacements ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(16, 185, 129, 0.2)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }} />
                <p>Laden van alternatieven...</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {replacementMeals.map(meal => (
                  <button
                    key={meal.id}
                    onClick={() => replaceMeal(activeDay, selectedSlot, meal)}
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {meal.name}
                      </div>
                      {meal.aiScore && (
                        <span style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          color: '#fff'
                        }}>
                          AI: {meal.aiScore}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.6)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem'
                    }}>
                      <span>{Math.round(meal.calories)} kcal</span>
                      <span style={{ color: '#10b981' }}>{Math.round(meal.protein)}g P</span>
                      <span style={{ color: '#3b82f6' }}>{Math.round(meal.carbs)}g C</span>
                      <span style={{ color: '#f59e0b' }}>{Math.round(meal.fat)}g F</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Meal Slot Component
function MealSlot({ meal, slotType, slotLabel, onReplace, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '0.75rem' : '1rem',
      position: 'relative'
    }}>
      {/* AI Score Badge */}
      {meal.aiScore > 0 && (
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
          AI: {meal.aiScore}
        </div>
      )}
      
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
          <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.7)'
          }}>
            {slotLabel}
          </span>
        </div>
        
        <button
          onClick={onReplace}
          style={{
            padding: '0.25rem 0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            color: '#10b981',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
          }}
        >
          <Shuffle size={12} />
          Vervang
        </button>
      </div>
      
      <h4 style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        {meal.name}
      </h4>
      
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
            {Math.round(meal.calories || 0)}
          </strong>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>eiwit</div>
          <strong style={{ color: '#10b981' }}>
            {Math.round(meal.protein || 0)}g
          </strong>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>carbs</div>
          <strong style={{ color: '#3b82f6' }}>
            {Math.round(meal.carbs || 0)}g
          </strong>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)' }}>vet</div>
          <strong style={{ color: '#f59e0b' }}>
            {Math.round(meal.fat || 0)}g
          </strong>
        </div>
      </div>
    </div>
  )
}
