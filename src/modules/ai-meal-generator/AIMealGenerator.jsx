// src/modules/ai-meal-generator/AIMealGenerator.jsx
import { useState, useEffect } from 'react'
import AIMealSelector from './AIMealSelector'
import RecipeBuilder from './RecipeBuilder'
import IngredientImportUI from '../ingredient-import/IngredientImportUI'
import PortionCalculator from './PortionCalculator'
import { Calendar, Users, Target, Save, RefreshCw, ChevronDown, ChevronUp, Info, List, ChefHat, Upload } from 'lucide-react'

export default function AIMealGenerator({ db, clients, selectedClient, onClientSelect }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [activeTab, setActiveTab] = useState('generator') // 'generator', 'recipes', 'import'
  const [selectedMeals, setSelectedMeals] = useState([])
  const [dailyTargets, setDailyTargets] = useState({
    kcal: 2000,
    protein: 150,
    carbs: 200,
    fat: 67
  })
  const [mealsPerDay, setMealsPerDay] = useState(4)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSelector, setShowSelector] = useState(true)
  const [showTargets, setShowTargets] = useState(true)
  const [showPlan, setShowPlan] = useState(false)
  
  // Load client targets when selected
  useEffect(() => {
    if (selectedClient) {
      // Load client's current targets if they exist
      const clientTargets = selectedClient.daily_targets || selectedClient.macro_targets
      if (clientTargets) {
        setDailyTargets({
          kcal: clientTargets.calories || clientTargets.kcal || 2000,
          protein: clientTargets.protein || 150,
          carbs: clientTargets.carbs || 200,
          fat: clientTargets.fat || 67
        })
      }
    }
  }, [selectedClient])
  
  // Handle meal selection change
  const handleMealSelectionChange = (meals) => {
    setSelectedMeals(meals)
    console.log(`✅ ${meals.length} meals selected for generation`)
  }
  
  // Generate meal plan
  const generateMealPlan = async () => {
    if (!selectedClient) {
      alert('Selecteer eerst een client!')
      return
    }
    
    if (selectedMeals.length === 0) {
      alert('Selecteer eerst maaltijden die gebruikt mogen worden!')
      return
    }
    
    setLoading(true)
    try {
      // Generate 7-day plan
      const weekPlan = []
      
      for (let day = 0; day < 7; day++) {
        const dayPlan = PortionCalculator.generateDayPlan(
          selectedMeals,
          dailyTargets,
          mealsPerDay,
          day // Pass day index for meal rotation
        )
        weekPlan.push(dayPlan)
      }
      
      setGeneratedPlan({
        client: selectedClient,
        targets: dailyTargets,
        mealsPerDay,
        weekPlan,
        generatedAt: new Date().toISOString()
      })
      
      setShowPlan(true)
      setShowSelector(false)
      console.log('✅ Meal plan generated successfully!')
    } catch (error) {
      console.error('❌ Error generating plan:', error)
      alert('Fout bij genereren van meal plan')
    } finally {
      setLoading(false)
    }
  }
  
  // Save plan to database
  const savePlan = async () => {
    if (!generatedPlan || !selectedClient) return
    
    setLoading(true)
    try {
      // Convert plan to database format
      const weekStructure = generatedPlan.weekPlan.map(day => ({
        breakfast: day.breakfast ? [day.breakfast.id] : [],
        lunch: day.lunch ? [day.lunch.id] : [],
        dinner: day.dinner ? [day.dinner.id] : [],
        snacks: day.snacks.map(s => s.id),
        totals: day.totals
      }))
      
      // Save to database
      await db.saveMealPlan(selectedClient.id, {
        week_structure: weekStructure,
        targets: dailyTargets,
        meals_per_day: mealsPerDay,
        generated_by_ai: true,
        generated_at: generatedPlan.generatedAt
      })
      
      alert(`✅ Meal plan opgeslagen voor ${selectedClient.first_name}!`)
    } catch (error) {
      console.error('❌ Error saving plan:', error)
      alert('Fout bij opslaan van meal plan')
    } finally {
      setLoading(false)
    }
  }
  
  // Reset generator
  const resetGenerator = () => {
    setGeneratedPlan(null)
    setShowPlan(false)
    setShowSelector(true)
  }
  
  // Format macro display
  const formatMacros = (macros) => {
    return `${macros.kcal} kcal | P: ${macros.protein}g | C: ${macros.carbs}g | F: ${macros.fat}g`
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Tab Navigation */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: '0.5rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('generator')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'generator' 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'transparent',
            border: 'none',
            borderRadius: isMobile ? '8px' : '10px',
            color: activeTab === 'generator' ? '#fff' : 'rgba(255,255,255,0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          <List size={isMobile ? 18 : 20} />
          Plan Generator
        </button>
        
        <button
          onClick={() => setActiveTab('recipes')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'recipes'
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'transparent',
            border: 'none',
            borderRadius: isMobile ? '8px' : '10px',
            color: activeTab === 'recipes' ? '#fff' : 'rgba(255,255,255,0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          <ChefHat size={isMobile ? 18 : 20} />
          Recipe Builder
        </button>
        
        <button
          onClick={() => setActiveTab('import')}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem' : '1rem',
            background: activeTab === 'import'
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : 'transparent',
            border: 'none',
            borderRadius: isMobile ? '8px' : '10px',
            color: activeTab === 'import' ? '#fff' : 'rgba(255,255,255,0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          <Upload size={isMobile ? 18 : 20} />
          Import
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'generator' ? (
        <>
          {/* Client Selector */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <Users size={isMobile ? 20 : 24} style={{ color: '#8b5cf6' }} />
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            Selecteer Client
          </h3>
        </div>
        
        <select
          value={selectedClient?.id || ''}
          onChange={(e) => {
            const client = clients.find(c => c.id === e.target.value)
            onClientSelect(client)
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: isMobile ? '8px' : '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          <option value="">Selecteer een client...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Macro Targets */}
      <div style={{
        background: '#111',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        <div 
          onClick={() => setShowTargets(!showTargets)}
          style={{
            padding: isMobile ? '1rem' : '1.5rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
            borderBottom: showTargets ? '1px solid #333' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Target size={isMobile ? 20 : 24} style={{ color: '#8b5cf6' }} />
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0
              }}>
                Daily Targets
              </h3>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255,255,255,0.5)',
                margin: '0.25rem 0 0 0'
              }}>
                {formatMacros(dailyTargets)}
              </p>
            </div>
          </div>
          {showTargets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {showTargets && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            {/* Calories */}
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Calorieën (kcal)
              </label>
              <input
                type="number"
                value={dailyTargets.kcal}
                onChange={(e) => setDailyTargets(prev => ({
                  ...prev,
                  kcal: parseInt(e.target.value) || 0
                }))}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              />
            </div>
            
            {/* Protein */}
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Eiwit (gram)
              </label>
              <input
                type="number"
                value={dailyTargets.protein}
                onChange={(e) => setDailyTargets(prev => ({
                  ...prev,
                  protein: parseInt(e.target.value) || 0
                }))}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              />
            </div>
            
            {/* Carbs */}
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Koolhydraten (gram)
              </label>
              <input
                type="number"
                value={dailyTargets.carbs}
                onChange={(e) => setDailyTargets(prev => ({
                  ...prev,
                  carbs: parseInt(e.target.value) || 0
                }))}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              />
            </div>
            
            {/* Fat */}
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Vet (gram)
              </label>
              <input
                type="number"
                value={dailyTargets.fat}
                onChange={(e) => setDailyTargets(prev => ({
                  ...prev,
                  fat: parseInt(e.target.value) || 0
                }))}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              />
            </div>
            
            {/* Meals per day */}
            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Maaltijden per dag
              </label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: isMobile ? '8px' : '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <option value="3">3 maaltijden (ontbijt, lunch, diner)</option>
                <option value="4">4 maaltijden (+ 1 snack)</option>
                <option value="5">5 maaltijden (+ 2 snacks)</option>
                <option value="6">6 maaltijden (+ 3 snacks)</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Meal Selector */}
      {showSelector && (
        <div style={{
          display: showSelector ? 'block' : 'none',
          animation: 'fadeIn 0.5s ease'
        }}>
          <AIMealSelector 
            db={db}
            onSelectionChange={handleMealSelectionChange}
          />
        </div>
      )}
      
      {/* Generated Plan Display */}
      {showPlan && generatedPlan && (
        <div style={{
          background: '#111',
          borderRadius: isMobile ? '12px' : '16px',
          border: '1px solid #333',
          padding: isMobile ? '1rem' : '1.5rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Calendar size={isMobile ? 20 : 24} style={{ color: '#10b981' }} />
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0
              }}>
                Generated Week Plan
              </h3>
            </div>
            <button
              onClick={resetGenerator}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: isMobile ? '8px' : '10px',
                color: '#ef4444',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation'
              }}
            >
              <RefreshCw size={16} />
              Opnieuw
            </button>
          </div>
          
          {/* Week Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1rem',
            maxHeight: isMobile ? '400px' : '500px',
            overflow: 'auto'
          }}>
            {generatedPlan.weekPlan.map((day, index) => (
              <div key={index} style={{
                background: '#1a1a1a',
                borderRadius: isMobile ? '8px' : '12px',
                border: '1px solid #333',
                padding: isMobile ? '1rem' : '1.5rem'
              }}>
                <h4 style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  marginBottom: '1rem'
                }}>
                  Dag {index + 1}
                </h4>
                
                {/* Meals */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {day.breakfast && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#111',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        fontWeight: '500',
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        🌅 Ontbijt: {day.breakfast.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#8b5cf6',
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        Portie: {day.breakfast.portionGrams}g {day.breakfast.portionDescription && `(${day.breakfast.portionDescription})`}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        {formatMacros(day.breakfast.macros)}
                      </div>
                      {day.breakfast.ingredients && day.breakfast.ingredients.length > 0 && (
                        <div style={{
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          {day.breakfast.ingredients.slice(0, 3).map((ing, idx) => (
                            <div key={idx}>
                              • {ing.name}: {ing.displayAmount || `${ing.amount}${ing.unit || 'g'}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {day.lunch && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#111',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        fontWeight: '500',
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        ☀️ Lunch: {day.lunch.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        color: '#8b5cf6',
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        Portie: {day.lunch.portionGrams}g {day.lunch.portionDescription && `(${day.lunch.portionDescription})`}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        {formatMacros(day.lunch.macros)}
                      </div>
                      {day.lunch.ingredients && day.lunch.ingredients.length > 0 && (
                        <div style={{
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          {day.lunch.ingredients.slice(0, 3).map((ing, idx) => (
                            <div key={idx}>
                              • {ing.name}: {ing.displayAmount || `${ing.amount}${ing.unit || 'g'}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {day.dinner && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#111',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        fontWeight: '500',
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        🌙 Diner: {day.dinner.displayName || day.dinner.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        {formatMacros(day.dinner.macros)}
                      </div>
                    </div>
                  )}
                  
                  {day.snacks && day.snacks.map((snack, si) => (
                    <div key={si} style={{
                      padding: '0.75rem',
                      background: '#111',
                      borderRadius: '8px',
                      border: '1px solid #333'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        fontWeight: '500',
                        color: '#10b981',
                        marginBottom: '0.25rem'
                      }}>
                        🍎 Snack {si + 1}: {snack.displayName || snack.name}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        {formatMacros(snack.macros)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Day Totals */}
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    Dag Totaal
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    color: '#10b981'
                  }}>
                    {formatMacros(day.totals)}
                  </div>
                </div>
                
                {/* Accuracy */}
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  Accuracy: {day.accuracy.total}% (P: {day.accuracy.protein}% | C: {day.accuracy.carbs}% | F: {day.accuracy.fat}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        {!showPlan && (
          <button
            onClick={generateMealPlan}
            disabled={loading || selectedMeals.length === 0 || !selectedClient}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
              background: loading || selectedMeals.length === 0 || !selectedClient
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: isMobile ? '10px' : '12px',
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              cursor: loading || selectedMeals.length === 0 || !selectedClient ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              minHeight: '44px',
              opacity: loading || selectedMeals.length === 0 || !selectedClient ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Genereren...
              </>
            ) : (
              <>
                🎯 Genereer Meal Plan
              </>
            )}
          </button>
        )}
        
        {showPlan && (
          <button
            onClick={savePlan}
            disabled={loading}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
              background: loading
                ? 'rgba(16, 185, 129, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: isMobile ? '10px' : '12px',
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              minHeight: '44px',
              opacity: loading ? 0.5 : 1
            }}
          >
            <Save size={20} />
            Opslaan voor {selectedClient?.first_name}
          </button>
        )}
      </div>
      
      {/* Info Box */}
      {selectedMeals.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: isMobile ? '8px' : '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: isMobile ? '1rem' : '1.5rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <Info size={20} style={{ color: '#8b5cf6', flexShrink: 0 }} />
          <div style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#8b5cf6' }}>{selectedMeals.length} maaltijden geselecteerd.</strong><br />
            Het systeem zal automatisch de beste combinaties vinden en porties aanpassen om de daily targets te bereiken.
            Elke maaltijd wordt geschaald op basis van de macro behoefte.
          </div>
        </div>
      )}
        </>
      ) : activeTab === 'recipes' ? (
        /* Recipe Builder Tab */
        <RecipeBuilder 
          db={db}
          onRecipeCreated={(recipe, meal) => {
            console.log('✅ New recipe created:', recipe.name)
            // Switch back to generator tab after creation
            setActiveTab('generator')
            // Reload meals if needed
            if (window.location.reload) {
              setTimeout(() => window.location.reload(), 1000)
            }
          }}
        />
      ) : (
        /* Import Tab */
        <IngredientImportUI db={db} />
      )}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
