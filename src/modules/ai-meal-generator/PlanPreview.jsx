// src/modules/ai-meal-generator/PlanPreview.jsx

import { useState } from 'react'
import { 
  Eye, Download, Share2, Package, Printer,
  Mail, MessageSquare, Copy, Check, Calendar,
  ChefHat, ShoppingCart, TrendingUp, Brain,
  DollarSign, Tag, Target, Award
} from 'lucide-react'

export default function PlanPreview({ weekPlan, client, onSave, db }) {
  const isMobile = window.innerWidth <= 768
  
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [shoppingList, setShoppingList] = useState(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAiInsights, setShowAiInsights] = useState(false)
  
  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
  
  // Helper function to get macro values (handles both old and new AI format)
  const getMacroValue = (meal, macro) => {
    if (!meal) return 0
    
    // Map old names to new AI format
    const macroMap = {
      'kcal': 'calories',
      'protein': 'protein', 
      'carbs': 'carbs',
      'fat': 'fat'
    }
    
    // Try new AI format first
    const aiMacro = macroMap[macro]
    if (meal[aiMacro] !== undefined) return meal[aiMacro]
    
    // Fallback to old format
    if (meal[macro] !== undefined) return meal[macro]
    if (meal.macros && meal.macros[macro] !== undefined) return meal.macros[macro]
    
    return 0
  }
  
  // Get portion text with ingredient details
  const getPortionText = (meal) => {
    if (!meal) return '0g'
    if (meal.portion) return typeof meal.portion === 'number' ? `${meal.portion}g` : meal.portion
    if (meal.portionText) return meal.portionText
    if (meal.portionGrams) return `${meal.portionGrams}g`
    
    // For AI meals with ingredients_list
    if (meal.ingredients_list && meal.ingredients_list.length > 0) {
      const totalGrams = meal.ingredients_list.reduce((sum, ing) => sum + (ing.amount || 0), 0)
      return `${totalGrams}g`
    }
    
    return '100g'
  }
  
  // Get meal labels for display
  const getMealLabels = (meal) => {
    if (!meal || !meal.labels) return []
    
    // Filter and map labels for user-friendly display
    const labelMap = {
      'high_protein': { text: 'High Protein', color: '#10b981' },
      'low_cal': { text: 'Low Cal', color: '#3b82f6' },
      'bulk_friendly': { text: 'Bulk', color: '#f59e0b' },
      'cut_friendly': { text: 'Cut', color: '#8b5cf6' },
      'meal_prep': { text: 'Prep', color: '#ec4899' },
      'quick': { text: 'Quick', color: '#06b6d4' },
      'balanced': { text: 'Balanced', color: '#10b981' }
    }
    
    return meal.labels
      .filter(label => labelMap[label])
      .map(label => labelMap[label])
      .slice(0, 3) // Max 3 labels for space
  }
  
  // Generate AI-enhanced shopping list
  const generateShoppingList = async () => {
    const ingredientMap = new Map()
    
    // Collect all ingredients from the week
    for (const day of weekPlan.weekPlan) {
      const meals = [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])]
      
      for (const meal of meals.filter(Boolean)) {
        if (meal.ingredients_list) {
          // New AI format with detailed ingredients
          for (const ing of meal.ingredients_list) {
            if (ing.ingredient_id) {
              // Fetch ingredient details from database
              const { data: ingredient } = await db.supabase
                .from('ai_ingredients')
                .select('*')
                .eq('id', ing.ingredient_id)
                .single()
              
              if (ingredient) {
                const key = ingredient.name
                if (ingredientMap.has(key)) {
                  ingredientMap.get(key).amount += ing.amount
                  ingredientMap.get(key).occurrences += 1
                } else {
                  ingredientMap.set(key, {
                    name: ingredient.name,
                    category: ingredient.category,
                    amount: ing.amount,
                    unit: ing.unit || 'gram',
                    price: ingredient.price_per_unit,
                    storage: ingredient.storage_type,
                    occurrences: 1
                  })
                }
              }
            }
          }
        } else if (meal.name) {
          // Fallback for meals without ingredients_list
          const key = meal.name
          const portion = meal.portionGrams || 100
          
          if (ingredientMap.has(key)) {
            ingredientMap.get(key).amount += portion
            ingredientMap.get(key).occurrences += 1
          } else {
            ingredientMap.set(key, {
              name: meal.name,
              category: meal.category || 'overig',
              amount: portion,
              unit: 'gram',
              occurrences: 1
            })
          }
        }
      }
    }
    
    // Convert to array and sort by category
    const list = Array.from(ingredientMap.values())
    list.sort((a, b) => {
      // Sort by storage type first (fresh items first)
      const storageOrder = { 'fridge': 0, 'freezer': 1, 'pantry': 2 }
      const storageA = storageOrder[a.storage] ?? 3
      const storageB = storageOrder[b.storage] ?? 3
      if (storageA !== storageB) return storageA - storageB
      
      // Then by category
      return a.category.localeCompare(b.category)
    })
    
    setShoppingList(list)
    setShowShoppingList(true)
  }
  
  // Export to WhatsApp with AI insights
  const exportToWhatsApp = () => {
    const targets = weekPlan.dailyTargets || weekPlan.options?.dailyTargets || {}
    const clientProfile = weekPlan.clientProfile
    
    let message = `*🍽️ AI MEAL PLAN - ${client.first_name} ${client.last_name}*\n\n`
    
    if (clientProfile) {
      message += `*🎯 Goal:* ${clientProfile.primary_goal}\n`
      message += `*💪 Activity:* ${clientProfile.activity_level}\n\n`
    }
    
    message += `*📊 Daily Targets:*\n`
    message += `${targets.kcal || 0} kcal | ${targets.protein || 0}g P | ${targets.carbs || 0}g C | ${targets.fat || 0}g F\n`
    message += `*✅ Accuracy:* ${weekPlan.stats?.averageAccuracy || 0}%\n`
    
    if (weekPlan.aiAnalysis?.budgetAnalysis) {
      message += `*💰 Week Budget:* €${weekPlan.aiAnalysis.budgetAnalysis.total}\n`
    }
    
    message += '\n━━━━━━━━━━━━━━━\n\n'
    
    weekPlan.weekPlan.forEach((day, index) => {
      message += `*${dayNames[index].toUpperCase()}*\n`
      
      if (day.breakfast) {
        const portion = getPortionText(day.breakfast)
        const labels = day.breakfast.labels ? ` [${day.breakfast.labels[0]}]` : ''
        message += `🌅 ${day.breakfast.name} (${portion})${labels}\n`
      }
      
      if (day.lunch) {
        const portion = getPortionText(day.lunch)
        const labels = day.lunch.labels ? ` [${day.lunch.labels[0]}]` : ''
        message += `☀️ ${day.lunch.name} (${portion})${labels}\n`
      }
      
      if (day.dinner) {
        const portion = getPortionText(day.dinner)
        const labels = day.dinner.labels ? ` [${day.dinner.labels[0]}]` : ''
        message += `🌙 ${day.dinner.name} (${portion})${labels}\n`
      }
      
      if (day.snacks && day.snacks.length > 0) {
        day.snacks.forEach(snack => {
          const portion = getPortionText(snack)
          message += `🍎 ${snack.name} (${portion})\n`
        })
      }
      
      message += `📈 ${day.totals.kcal}kcal | ${day.totals.protein}g P | ${day.accuracy?.total || 0}%\n\n`
    })
    
    if (weekPlan.aiOptimized) {
      message += `\n🤖 *AI Optimized Plan*`
    }
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }
  
  // Copy to clipboard with AI data
  const copyToClipboard = () => {
    const targets = weekPlan.dailyTargets || weekPlan.options?.dailyTargets || {}
    const profile = weekPlan.clientProfile
    
    let text = `AI MEAL PLAN - ${client.first_name} ${client.last_name}\n`
    text += '═══════════════════════════════════\n\n'
    
    if (profile) {
      text += `Goal: ${profile.primary_goal} | Activity: ${profile.activity_level}\n`
    }
    
    text += `Daily Targets: ${targets.kcal || 0}kcal | ${targets.protein || 0}g P | ${targets.carbs || 0}g C | ${targets.fat || 0}g F\n`
    text += `Week Accuracy: ${weekPlan.stats?.averageAccuracy || 0}%\n`
    
    if (weekPlan.aiAnalysis) {
      text += `AI Score: ${weekPlan.aiAnalysis.averageScore?.toFixed(0) || 0}\n`
      text += `Budget: €${weekPlan.aiAnalysis.budgetAnalysis?.daily || 0}/day\n`
    }
    
    text += '\n'
    
    weekPlan.weekPlan.forEach((day, index) => {
      text += `${dayNames[index].toUpperCase()}\n`
      text += '-------------------\n'
      
      const meals = [
        { meal: day.breakfast, type: 'Ontbijt' },
        { meal: day.lunch, type: 'Lunch' },
        { meal: day.dinner, type: 'Diner' }
      ]
      
      meals.forEach(({ meal, type }) => {
        if (meal) {
          const portion = getPortionText(meal)
          const kcal = getMacroValue(meal, 'kcal')
          const protein = getMacroValue(meal, 'protein')
          const labels = meal.labels ? ` [${meal.labels.join(', ')}]` : ''
          
          text += `${type}: ${meal.name} (${portion})${labels}\n`
          text += `  → ${kcal}kcal | ${protein}g protein`
          
          if (meal.total_cost) {
            text += ` | €${meal.total_cost.toFixed(2)}`
          }
          text += '\n'
        }
      })
      
      if (day.snacks && day.snacks.length > 0) {
        day.snacks.forEach((snack, i) => {
          const portion = getPortionText(snack)
          const kcal = getMacroValue(snack, 'kcal')
          const protein = getMacroValue(snack, 'protein')
          
          text += `Snack ${i+1}: ${snack.name} (${portion})\n`
          text += `  → ${kcal}kcal | ${protein}g protein\n`
        })
      }
      
      text += `\nDAG TOTAAL: ${day.totals.kcal}kcal | ${day.totals.protein}g P | ${day.totals.carbs}g C | ${day.totals.fat}g F\n`
      text += `Accuracy: ${day.accuracy?.total || 0}%\n\n`
    })
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Render meal card with AI enhancements
  const MealCard = ({ meal, type }) => {
    if (!meal) return null
    
    const kcal = getMacroValue(meal, 'kcal')
    const protein = getMacroValue(meal, 'protein')
    const carbs = getMacroValue(meal, 'carbs')
    const fat = getMacroValue(meal, 'fat')
    const portionText = getPortionText(meal)
    const labels = getMealLabels(meal)
    
    return (
      <div style={{
        padding: '0.75rem',
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        transition: 'all 0.3s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-1px)'
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
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: '600'
          }}>
            {type === 'breakfast' && '🌅 Ontbijt'}
            {type === 'lunch' && '☀️ Lunch'}
            {type === 'dinner' && '🌙 Diner'}
            {type === 'snack' && '🍎 Snack'}
          </span>
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            alignItems: 'center'
          }}>
            {meal.aiScore && (
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
                <Brain size={10} />
                {meal.aiScore}
              </span>
            )}
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '4px',
              color: '#8b5cf6'
            }}>
              {portionText}
            </span>
          </div>
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#fff',
          marginBottom: '0.25rem'
        }}>
          {meal.name}
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
                fontWeight: '600'
              }}>
                {label.text}
              </span>
            ))}
          </div>
        )}
        
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span>{Math.round(kcal)}kcal</span>
          <span>•</span>
          <span>{Math.round(protein)}g P</span>
          <span>•</span>
          <span>{Math.round(carbs)}g C</span>
          <span>•</span>
          <span>{Math.round(fat)}g F</span>
          {meal.total_cost && (
            <>
              <span>•</span>
              <span style={{ color: '#f59e0b' }}>€{meal.total_cost.toFixed(2)}</span>
            </>
          )}
        </div>
      </div>
    )
  }
  
  if (!weekPlan || !weekPlan.weekPlan) {
    return (
      <div style={{
        background: '#111',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)'
      }}>
        Geen week plan beschikbaar
      </div>
    )
  }
  
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
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Eye size={20} />
              AI Plan Preview
              {weekPlan.aiOptimized && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  borderRadius: '4px',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Brain size={12} />
                  AI Optimized
                </span>
              )}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {client.first_name} {client.last_name} • 
              {weekPlan.stats?.averageAccuracy || 0}% accuracy • 
              {weekPlan.stats?.mealVariety?.size || 0} unieke meals
            </p>
          </div>
        </div>
        
        {/* AI Insights Button */}
        {weekPlan.aiAnalysis && (
          <button
            onClick={() => setShowAiInsights(!showAiInsights)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#8b5cf6',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            <Brain size={16} />
            {showAiInsights ? 'Verberg' : 'Toon'} AI Insights
          </button>
        )}
        
        {/* Export buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginTop: '1rem'
        }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '0.5rem 1rem',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
              border: copied ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: copied ? '#10b981' : '#fff',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Gekopieerd!' : 'Kopieer'}
          </button>
          
          <button
            onClick={exportToWhatsApp}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(37, 211, 102, 0.2)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              borderRadius: '8px',
              color: '#25d366',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            <MessageSquare size={16} />
            WhatsApp
          </button>
          
          <button
            onClick={() => window.print()}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#8b5cf6',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            <Printer size={16} />
            Print
          </button>
          
          <button
            onClick={generateShoppingList}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              color: '#f59e0b',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '44px',
              touchAction: 'manipulation'
            }}
          >
            <ShoppingCart size={16} />
            Boodschappen
          </button>
        </div>
      </div>
      
      {/* AI Insights Panel */}
      {showAiInsights && weekPlan.aiAnalysis && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: '#8b5cf6',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Brain size={18} />
            AI Analysis
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {/* Average Score */}
            <div style={{
              padding: '0.75rem',
              background: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem'
              }}>
                AI Match Score
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#8b5cf6'
              }}>
                {weekPlan.aiAnalysis.averageScore?.toFixed(0) || 0}/100
              </div>
            </div>
            
            {/* Budget */}
            {weekPlan.aiAnalysis.budgetAnalysis && (
              <div style={{
                padding: '0.75rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  Week Budget
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#f59e0b'
                }}>
                  €{weekPlan.aiAnalysis.budgetAnalysis.total}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  €{weekPlan.aiAnalysis.budgetAnalysis.daily}/dag
                </div>
              </div>
            )}
            
            {/* Portion Compliance */}
            {weekPlan.aiAnalysis.portionCompliance && (
              <div style={{
                padding: '0.75rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  Portion Compliance
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  {weekPlan.aiAnalysis.portionCompliance}%
                </div>
              </div>
            )}
            
            {/* Label Distribution */}
            {weekPlan.aiAnalysis.labelDistribution && (
              <div style={{
                padding: '0.75rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                gridColumn: isMobile ? 'span 1' : 'span 2'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.5rem'
                }}>
                  Label Distribution
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {Object.entries(weekPlan.aiAnalysis.labelDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([label, count]) => (
                      <span key={label} style={{
                        fontSize: '0.75rem',
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
        </div>
      )}
      
      {/* Week Overview */}
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
          <Calendar size={18} />
          Week Overzicht
        </h4>
        
        <div className="printable-week-plan">
          {weekPlan.weekPlan.map((day, index) => (
            <div key={index} style={{
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: index < 6 ? '1px solid #333' : 'none'
            }}>
              <h5 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                color: '#8b5cf6',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{dayNames[index]}</span>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  {day.totalCost && (
                    <span style={{
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderRadius: '6px',
                      color: '#f59e0b'
                    }}>
                      €{day.totalCost.toFixed(2)}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.75rem',
                    background: day.accuracy?.total >= 90 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '6px',
                    color: day.accuracy?.total >= 90 ? '#10b981' : '#f59e0b'
                  }}>
                    {day.accuracy?.total || 0}% accuracy
                  </span>
                </div>
              </h5>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                <MealCard meal={day.breakfast} type="breakfast" />
                <MealCard meal={day.lunch} type="lunch" />
                <MealCard meal={day.dinner} type="dinner" />
                
                {day.snacks && day.snacks.length > 0 && day.snacks.map((snack, si) => (
                  <MealCard key={si} meal={snack} type="snack" />
                ))}
              </div>
              
              {/* Day totals */}
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.1) 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: '500'
                }}>
                  Dag totaal
                </span>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#10b981',
                  fontWeight: '600',
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span>{day.totals.kcal}kcal</span>
                  <span>{day.totals.protein}g P</span>
                  <span>{day.totals.carbs}g C</span>
                  <span>{day.totals.fat}g F</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Shopping List Modal with AI enhancements */}
      {showShoppingList && shoppingList && (
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
            marginBottom: '1rem'
          }}>
            <h4 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShoppingCart size={18} />
              AI Boodschappenlijst
            </h4>
            <button
              onClick={() => setShowShoppingList(false)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                minHeight: '44px',
                minWidth: '44px',
                touchAction: 'manipulation'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {shoppingList.map((item, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#fff',
                    fontWeight: '500'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginTop: '0.25rem'
                  }}>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.occurrences}x</span>
                    {item.storage && (
                      <>
                        <span>•</span>
                        <span>
                          {item.storage === 'fridge' && '❄️'}
                          {item.storage === 'freezer' && '🧊'}
                          {item.storage === 'pantry' && '🗄️'}
                        </span>
                      </>
                    )}
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
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#f59e0b',
                    fontWeight: '600'
                  }}>
                    {Math.round(item.amount)}g
                  </span>
                  {item.price && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      ~€{(item.amount / 1000 * item.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Save Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1rem'
      }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: isMobile ? '1rem 3rem' : '1.25rem 4rem',
            background: saving 
              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '1.05rem' : '1.15rem',
            fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease',
            minHeight: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Download size={20} />
          {saving ? 'Bezig met opslaan...' : `AI Plan Opslaan voor ${client.first_name}`}
        </button>
      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-week-plan, .printable-week-plan * {
            visibility: visible;
            background: white !important;
            color: black !important;
          }
          .printable-week-plan {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  )
}
