// src/modules/ai-meal-generator/MacroAnalyzer.jsx

import { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, AlertCircle, Check, X,
  Target, Percent, Info, Edit3, Save, ChefHat, Pizza, Coffee,
  Brain, DollarSign, Tag, Award, Filter
} from 'lucide-react'

export default function MacroAnalyzer({ weekPlan, dailyTargets, onEdit }) {
  const isMobile = window.innerWidth <= 768
  
  const [selectedDay, setSelectedDay] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [dayPlan, setDayPlan] = useState(null)
  const [showAiMetrics, setShowAiMetrics] = useState(true)
  
  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  useEffect(() => {
    if (weekPlan && weekPlan.weekPlan) {
      setDayPlan(weekPlan.weekPlan[selectedDay])
    }
  }, [selectedDay, weekPlan])
  
  // Calculate macro percentage
  const calcPercentage = (achieved, target) => {
    if (!target) return 0
    return Math.round((achieved / target) * 100)
  }
  
  // Get color based on accuracy
  const getAccuracyColor = (percentage) => {
    const diff = Math.abs(100 - percentage)
    if (diff <= 5) return '#10b981' // Perfect
    if (diff <= 10) return '#f59e0b' // Good
    return '#ef4444' // Needs improvement
  }
  
  // Get meal icon
  const getMealIcon = (mealType) => {
    switch(mealType) {
      case 'breakfast': return '🌅'
      case 'lunch': return '☀️'
      case 'dinner': return '🌙'
      case 'snack': return '🍎'
      default: return '🍽️'
    }
  }
  
  // Extract macro value (handles AI format)
  const getMacroValue = (meal, macro) => {
    if (!meal) return 0
    
    // Map to AI format
    const macroMap = {
      'kcal': 'calories',
      'protein': 'protein',
      'carbs': 'carbs', 
      'fat': 'fat'
    }
    
    // Try AI format first
    const aiMacro = macroMap[macro]
    if (meal[aiMacro] !== undefined) return meal[aiMacro]
    
    // Fallback to old format
    if (meal[macro] !== undefined) return meal[macro]
    if (meal.macros && meal.macros[macro] !== undefined) return meal.macros[macro]
    
    return 0
  }
  
  // Get meal labels for display
  const getMealLabels = (meal) => {
    if (!meal || !meal.labels) return []
    
    const labelMap = {
      'high_protein': { text: 'High Protein', color: '#10b981', icon: '💪' },
      'low_cal': { text: 'Low Cal', color: '#3b82f6', icon: '🥗' },
      'bulk_friendly': { text: 'Bulk', color: '#f59e0b', icon: '📈' },
      'cut_friendly': { text: 'Cut', color: '#8b5cf6', icon: '✂️' },
      'meal_prep': { text: 'Prep', color: '#ec4899', icon: '📦' },
      'quick': { text: 'Quick', color: '#06b6d4', icon: '⚡' },
      'balanced': { text: 'Balanced', color: '#10b981', icon: '⚖️' },
      'high_carbs': { text: 'High Carbs', color: '#f59e0b', icon: '🍞' },
      'low_carbs': { text: 'Low Carbs', color: '#3b82f6', icon: '🥬' }
    }
    
    return meal.labels
      .filter(label => labelMap[label])
      .map(label => labelMap[label])
  }
  
  // Calculate day cost
  const calculateDayCost = (day) => {
    let totalCost = 0
    const meals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])]
    
    meals.forEach(meal => {
      if (meal && meal.total_cost) {
        totalCost += meal.total_cost
      }
    })
    
    return totalCost
  }
  
  // Render macro bar with AI enhancements
  const MacroBar = ({ label, achieved, target, color, showCompliance = true }) => {
    const percentage = calcPercentage(achieved, target)
    const isOver = percentage > 100
    const compliance = 100 - Math.abs(100 - percentage)
    
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '500'
          }}>
            {label}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              {Math.round(achieved || 0)} / {target}
            </span>
            <span style={{
              fontSize: '0.875rem',
              color: getAccuracyColor(percentage),
              fontWeight: '600'
            }}>
              ({percentage}%)
            </span>
            {showCompliance && compliance >= 90 && (
              <span style={{
                padding: '0.15rem 0.3rem',
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: '#10b981'
              }}>
                ✓
              </span>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '24px',
          background: '#1a1a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid #333'
        }}>
          <div style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
            transition: 'width 0.5s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '0.5rem'
          }}>
            {percentage > 20 && (
              <span style={{
                fontSize: '0.75rem',
                color: '#fff',
                fontWeight: '600'
              }}>
                {percentage}%
              </span>
            )}
          </div>
          
          {/* Target line */}
          <div style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'rgba(255,255,255,0.3)',
            transform: 'translateX(-100%)'
          }} />
          
          {/* Over indicator */}
          {isOver && (
            <div style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0.25rem 0.5rem',
              background: '#ef4444',
              borderRadius: '4px',
              fontSize: '0.7rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              +{percentage - 100}%
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Render AI-enhanced meal card
  const MealCard = ({ meal, mealType }) => {
    if (!meal) return null
    
    const kcal = getMacroValue(meal, 'kcal')
    const protein = getMacroValue(meal, 'protein')
    const carbs = getMacroValue(meal, 'carbs')
    const fat = getMacroValue(meal, 'fat')
    const portion = meal.portion || meal.portionGrams || meal.portionText || '100g'
    const labels = getMealLabels(meal)
    
    return (
      <div style={{
        padding: '1rem',
        background: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = '#10b981'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = '#333'
        }
      }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '0.5rem'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {getMealIcon(mealType)}
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              {meal.aiScore && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.3rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  borderRadius: '4px',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Brain size={10} />
                  {meal.aiScore}
                </span>
              )}
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: '#fff'
            }}>
              {meal.name}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem'
          }}>
            <span style={{
              padding: '0.25rem 0.5rem',
              background: 'rgba(139, 92, 246, 0.2)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#8b5cf6',
              fontWeight: '600'
            }}>
              {typeof portion === 'number' ? `${portion}g` : portion}
            </span>
            {meal.total_cost && (
              <span style={{
                fontSize: '0.7rem',
                color: '#f59e0b'
              }}>
                €{meal.total_cost.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        {/* AI Labels */}
        {labels.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {labels.map((label, i) => (
              <span key={i} style={{
                fontSize: '0.65rem',
                padding: '0.15rem 0.3rem',
                background: `${label.color}20`,
                borderRadius: '3px',
                color: label.color,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.15rem'
              }}>
                <span>{label.icon}</span>
                {label.text}
              </span>
            ))}
          </div>
        )}
        
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#8b5cf6' }}>{Math.round(kcal)} kcal</span>
          <span>•</span>
          <span style={{ color: '#10b981' }}>{Math.round(protein)}g P</span>
          <span>•</span>
          <span style={{ color: '#3b82f6' }}>{Math.round(carbs)}g C</span>
          <span>•</span>
          <span style={{ color: '#f59e0b' }}>{Math.round(fat)}g F</span>
        </div>
      </div>
    )
  }
  
  // Check if data is available
  if (!weekPlan || !weekPlan.weekPlan || !weekPlan.stats) {
    return (
      <div style={{
        background: '#111',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          animation: 'spin 2s linear infinite'
        }}>⏳</div>
        Macro analyse wordt geladen...
      </div>
    )
  }
  
  if (!dayPlan) {
    return (
      <div style={{
        background: '#111',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)'
      }}>
        Geen plan data beschikbaar voor deze dag
      </div>
    )
  }
  
  const dayCost = calculateDayCost(dayPlan)
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} />
            AI Macro Analyse
            {weekPlan.aiOptimized && (
              <span style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.4rem',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                borderRadius: '4px',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Brain size={12} />
                Optimized
              </span>
            )}
          </h3>
          
          <button
            onClick={() => setShowAiMetrics(!showAiMetrics)}
            style={{
              padding: '0.5rem 0.75rem',
              background: showAiMetrics 
                ? 'rgba(139, 92, 246, 0.2)'
                : 'rgba(255,255,255,0.05)',
              border: showAiMetrics 
                ? '1px solid rgba(139, 92, 246, 0.3)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: showAiMetrics ? '#8b5cf6' : 'rgba(255,255,255,0.6)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            <Filter size={14} />
            AI Metrics
          </button>
        </div>
        
        {/* Day selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {weekPlan.weekPlan.map((day, index) => {
            const cost = calculateDayCost(day)
            return (
              <button
                key={index}
                onClick={() => setSelectedDay(index)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                  background: selectedDay === index 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'rgba(255,255,255,0.05)',
                  border: selectedDay === index 
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: selectedDay === index ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: selectedDay === index ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minWidth: isMobile ? '80px' : '100px',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {dayNames[index].slice(0, 3)}
                <div style={{
                  fontSize: '0.7rem',
                  marginTop: '0.25rem',
                  opacity: 0.8
                }}>
                  {day.accuracy?.total || 0}%
                  {cost > 0 && (
                    <div style={{ color: '#f59e0b' }}>
                      €{cost.toFixed(1)}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* AI Metrics Panel */}
      {showAiMetrics && weekPlan.aiAnalysis && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Brain size={12} />
                AI Score
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {weekPlan.aiAnalysis.averageScore?.toFixed(0) || 0}
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <DollarSign size={12} />
                Dag Budget
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#f59e0b'
              }}>
                €{dayCost.toFixed(2)}
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Award size={12} />
                Compliance
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {weekPlan.aiAnalysis.portionCompliance || 100}%
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Tag size={12} />
                Labels
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#ec4899'
              }}>
                {Object.keys(weekPlan.aiAnalysis.labelDistribution || {}).length}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Macro Bars */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h4 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Target size={18} />
          {dayNames[selectedDay]} - Macro Verdeling
          {dayCost > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
              color: '#f59e0b'
            }}>
              €{dayCost.toFixed(2)}
            </span>
          )}
        </h4>
        
        <MacroBar
          label="Calorieën"
          achieved={dayPlan.totals?.kcal || 0}
          target={dailyTargets.kcal}
          color="#8b5cf6"
        />
        
        <MacroBar
          label="Eiwit"
          achieved={dayPlan.totals?.protein || 0}
          target={dailyTargets.protein}
          color="#10b981"
        />
        
        <MacroBar
          label="Koolhydraten"
          achieved={dayPlan.totals?.carbs || 0}
          target={dailyTargets.carbs}
          color="#3b82f6"
        />
        
        <MacroBar
          label="Vet"
          achieved={dayPlan.totals?.fat || 0}
          target={dailyTargets.fat}
          color="#f59e0b"
        />
      </div>
      
      {/* Meal Breakdown */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h4 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ChefHat size={18} />
          Maaltijd Breakdown
        </h4>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <MealCard meal={dayPlan.breakfast} mealType="breakfast" />
          <MealCard meal={dayPlan.lunch} mealType="lunch" />
          <MealCard meal={dayPlan.dinner} mealType="dinner" />
          
          {/* Snacks */}
          {dayPlan.snacks && dayPlan.snacks.length > 0 && (
            <>
              {dayPlan.snacks.map((snack, idx) => (
                <MealCard 
                  key={idx} 
                  meal={snack} 
                  mealType="snack" 
                />
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Week Summary with AI Data */}
      {weekPlan.stats && weekPlan.stats.weekAverages && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUp size={18} />
            Week Overzicht
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem'
              }}>
                Gem. Accuracy
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {weekPlan.stats.averageAccuracy || 0}%
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem'
              }}>
                Gem. Calorieën
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {weekPlan.stats.weekAverages.kcal || 0}
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem'
              }}>
                Gem. Eiwit
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#3b82f6'
              }}>
                {weekPlan.stats.weekAverages.protein || 0}g
              </div>
            </div>
            
            {weekPlan.aiAnalysis?.budgetAnalysis && (
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  Week Budget
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f59e0b'
                }}>
                  €{weekPlan.aiAnalysis.budgetAnalysis.total}
                </div>
              </div>
            )}
          </div>
          
          {/* Variety Score & AI Metrics */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  Meal Variety Score
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  {weekPlan.stats.varietyScore || weekPlan.stats.mealVariety?.size || 0}%
                </span>
              </div>
              
              {weekPlan.stats.complianceScore !== undefined && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    Compliance Score
                  </span>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#f59e0b'
                  }}>
                    {weekPlan.stats.complianceScore}%
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Top Labels Used */}
          {weekPlan.aiAnalysis?.labelDistribution && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem'
              }}>
                Top AI Labels
              </div>
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                flexWrap: 'wrap'
              }}>
                {Object.entries(weekPlan.aiAnalysis.labelDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([label, count]) => (
                    <span key={label} style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: '4px',
                      color: '#8b5cf6'
                    }}>
                      {label}: {count}x
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
