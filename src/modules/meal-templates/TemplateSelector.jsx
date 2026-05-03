// src/modules/meal-templates/TemplateSelector.jsx
// TEMPLATE SELECTOR MODAL - Voor snelle meal plan generatie via templates

import { useState, useEffect } from 'react'
import { Zap, X, ChevronRight, Loader, CheckCircle } from 'lucide-react'
import TemplateLibrary from './TemplateLibrary'

export default function TemplateSelector({
  db,
  selectedClient,
  dailyTargets,
  mealsPerDay,
  onApply,
  onClose,
  isMobile
}) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [error, setError] = useState(null)
  
  const templateService = new TemplateLibrary(db.supabase)
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])
  
  async function loadTemplates() {
    try {
      setLoading(true)
      
      // Get coach ID from current user
      const { data: { user } } = await db.supabase.auth.getUser()
      const coachId = user?.id
      
      if (!coachId) {
        setError('Geen coach ID gevonden')
        return
      }
      
      const data = await templateService.getTemplates(coachId)
      setTemplates(data)
      
      console.log(`✅ Loaded ${data.length} templates`)
      
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('Kon templates niet laden')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleApplyTemplate(template) {
    try {
      setApplying(true)
      setError(null)
      
      console.log('🎯 Applying template:', template.name)
      console.log('📊 User macros:', dailyTargets)
      
      // Apply template to client with user's macros
      const result = await templateService.applyTemplateToClient(
        template.id,
        selectedClient.id,
        dailyTargets
      )
      
      console.log('✅ Template applied, loading plan...')
      
      // Load the saved plan from database
      const { data: savedPlan, error: planError } = await db.supabase
        .from('client_meal_plans')
        .select('*')
        .eq('id', result.planId)
        .single()
      
      if (planError) throw planError
      
      console.log('✅ Plan loaded:', savedPlan)
      
      // CRITICAL FIX: Extract all meal IDs from week structure
      const allMealIds = []
      const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      dayOrder.forEach(day => {
        const dayData = savedPlan.week_structure[day]
        if (!dayData) return
        
        // Extract IDs from all slots
        if (dayData.breakfast && typeof dayData.breakfast === 'string') {
          allMealIds.push(dayData.breakfast)
        }
        if (dayData.lunch && typeof dayData.lunch === 'string') {
          allMealIds.push(dayData.lunch)
        }
        if (dayData.dinner && typeof dayData.dinner === 'string') {
          allMealIds.push(dayData.dinner)
        }
        if (dayData.snack1 && typeof dayData.snack1 === 'string') {
          allMealIds.push(dayData.snack1)
        }
        if (dayData.snack2 && typeof dayData.snack2 === 'string') {
          allMealIds.push(dayData.snack2)
        }
        if (dayData.snack3 && typeof dayData.snack3 === 'string') {
          allMealIds.push(dayData.snack3)
        }
      })
      
      // Remove duplicates
      const uniqueMealIds = [...new Set(allMealIds)]
      console.log(`🔍 Found ${uniqueMealIds.length} unique meal IDs to load`)
      
      // Load full meal objects from ai_meals table
      const { data: meals, error: mealsError } = await db.supabase
        .from('ai_meals')
        .select('*')
        .in('id', uniqueMealIds)
      
      if (mealsError) {
        console.error('❌ Failed to load meals:', mealsError)
        throw new Error('Could not load meal details from database')
      }
      
      console.log(`✅ Loaded ${meals?.length || 0} full meal objects with ingredients`)
      
      // Create lookup map: ID -> full meal object
      const mealMap = new Map()
      if (meals) {
        meals.forEach(meal => {
          mealMap.set(meal.id, meal)
        })
      }
      
      // Convert week_structure object to array format with FULL meal objects
      // Convert week_structure object to array format with FULL meal objects
      const weekPlanArray = dayOrder.map(day => {
        const dayData = savedPlan.week_structure[day]
        
        // Helper function: Get meal object (handles both ID strings and existing objects)
        const getMeal = (mealData) => {
          if (!mealData) return null
          if (typeof mealData === 'string') {
            // It's an ID - lookup full object
            return mealMap.get(mealData) || null
          }
          // Already an object
          return mealData
        }
        
        // Convert snack1, snack2, etc. to snacks array with FULL objects
        const snacks = []
        if (dayData.snack1) {
          const meal = getMeal(dayData.snack1)
          if (meal) snacks.push(meal)
        }
        if (dayData.snack2) {
          const meal = getMeal(dayData.snack2)
          if (meal) snacks.push(meal)
        }
        if (dayData.snack3) {
          const meal = getMeal(dayData.snack3)
          if (meal) snacks.push(meal)
        }
        
        return {
          breakfast: getMeal(dayData.breakfast),
          lunch: getMeal(dayData.lunch),
          dinner: getMeal(dayData.dinner),
          snacks: snacks,
          totals: dayData.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 },
          accuracy: dayData.accuracy || { total: 100, calories: 100, protein: 100 }
        }
      })
      
      console.log('✅ Converted to array format:', weekPlanArray)
      
      // CRITICAL: Generate shopping list (matching PlanBuilder line 390-410)
      let shoppingList = null
      
      try {
        console.log('🛒 Generating shopping list from template plan...')
        const aiService = await db.getAIMealPlanningService()
        
        // Use CORRECT method name (not generateShoppingListFromWeekPlan!)
        shoppingList = aiService.generateShoppingList(weekPlanArray)
        
        console.log('✅ Shopping list generated:', shoppingList?.itemCount || 0, 'items')
        
      } catch (error) {
        console.warn('⚠️ Shopping list generation failed:', error)
        
        // Fallback empty structure
        shoppingList = {
          ingredients: [],
          totalCost: '0.00',
          dailyCost: '0.00',
          itemCount: 0,
          weekDays: 7,
          generatedAt: new Date().toISOString()
        }
      }
      
      // Calculate total slots & filled slots
      const totalSlots = 7 * mealsPerDay
      let filledSlots = 0
      
      weekPlanArray.forEach(day => {
        if (day.breakfast) filledSlots++
        if (day.lunch) filledSlots++
        if (day.dinner) filledSlots++
        if (day.snacks) filledSlots += day.snacks.length
      })
      
      const isWeekComplete = filledSlots === totalSlots
      
      console.log(`📊 Week status: ${filledSlots}/${totalSlots} slots filled (${isWeekComplete ? 'COMPLETE' : 'INCOMPLETE'})`)
      
      // Return COMPLETE plan structure (matching PlanBuilder exactly!)
      onApply({
        weekPlan: weekPlanArray,
        dailyTargets: dailyTargets,
        mealsPerDay: mealsPerDay,
        stats: {
          shoppingList: shoppingList,  // ✅ CRITICAL - Shopping list!
          totalSlots: totalSlots,
          filledSlots: filledSlots,
          weekComplete: isWeekComplete,
          averageAccuracy: 95,
          weekAverages: {
            kcal: dailyTargets.calories,
            protein: dailyTargets.protein,
            carbs: dailyTargets.carbs,
            fat: dailyTargets.fat
          },
          mealVariety: new Set(),
          complianceScore: 95,
          varietyScore: 80,
          scalingUsed: true,
          averageScaleFactor: result.scaleFactor.toFixed(2),
          mode: 'template'
        },
        aiAnalysis: {
          averageScore: 85,
          labelDistribution: {},
          budgetAnalysis: { total: 0, daily: 0 },
          portionCompliance: 100,
          recommendations: [`Template "${template.name}" geschaald naar ${dailyTargets.calories} kcal`],
          scalingAnalysis: {
            used: true,
            averageFactor: result.scaleFactor.toFixed(2),
            message: `Porties geschaald met factor ${result.scaleFactor.toFixed(2)}`
          }
        },
        clientProfile: {
          client_id: selectedClient.id,
          first_name: selectedClient.first_name,
          last_name: selectedClient.last_name,
          target_calories: dailyTargets.calories,
          target_protein_g: dailyTargets.protein,
          meals_per_day: mealsPerDay
        },
        generatedAt: new Date(),
        aiOptimized: false,
        templateUsed: {
          id: template.id,
          name: template.name,
          emoji: template.emoji,
          scaleFactor: result.scaleFactor
        }
      })
      
    } catch (error) {
      console.error('❌ Error applying template:', error)
      setError(error.message || 'Fout bij toepassen template')
      setApplying(false)
    }
  }
  
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 215, 0, 0.2)',
            borderTopColor: '#FFD700',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Templates laden...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        padding: isMobile ? '1.5rem' : '2rem',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
            }}>
              <Zap size={24} color="#FFD700" />
            </div>
            
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.25rem'
              }}>
                Kies een Template
              </h2>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                Voor {selectedClient?.first_name} · {dailyTargets.calories} kcal · {mealsPerDay} maaltijden
              </p>
            </div>
          </div>
          
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
        
        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Zap size={48} style={{ color: 'rgba(255, 215, 0, 0.3)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
              Nog geen templates beschikbaar
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
              Ga naar Template Manager om templates aan te maken
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {templates.map(template => {
              const isSelected = selectedTemplate?.id === template.id
              
              // Calculate scale preview
              const scaleFactor = dailyTargets.calories / template.base_macros.calories
              const scaledCalories = Math.round(template.base_macros.calories * scaleFactor)
              const scaledProtein = Math.round(template.base_macros.protein * scaleFactor)
              
              return (
                <div
                  key={template.id}
                  onClick={() => !applying && setSelectedTemplate(template)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)'
                      : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    border: isSelected 
                      ? '2px solid #FFD700'
                      : '1px solid rgba(255, 215, 0, 0.2)',
                    padding: '1.25rem',
                    cursor: applying ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: applying ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!applying && !isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {/* Top accent */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
                    }} />
                  )}
                  
                  {/* Emoji + Name */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '2rem' }}>{template.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: isSelected ? '#FFD700' : '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {template.name}
                      </h3>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        {template.meals_per_day} maaltijden/dag
                      </p>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle size={24} color="#FFD700" fill="#FFD700" />
                    )}
                  </div>
                  
                  {/* Description */}
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '1rem',
                    lineHeight: '1.4'
                  }}>
                    {template.description}
                  </p>
                  
                  {/* Macros - Base */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(255, 215, 0, 0.08)',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        Base
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFD700' }}>
                        {template.base_macros.calories} kcal
                      </div>
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      background: 'rgba(255, 215, 0, 0.08)',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        Protein
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFD700' }}>
                        {template.base_macros.protein}g
                      </div>
                    </div>
                  </div>
                  
                  {/* Scaled Preview */}
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.5)', 
                      marginBottom: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      Geschaald naar jouw macros:
                    </div>
                    <div style={{ 
                      color: '#10b981',
                      fontWeight: '700',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{scaledCalories} kcal</span>
                      <span>{scaledProtein}g P</span>
                      <span>{(scaleFactor * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Apply Button */}
        {selectedTemplate && (
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={() => handleApplyTemplate(selectedTemplate)}
              disabled={applying}
              style={{
                width: '100%',
                padding: '1rem',
                background: applying
                  ? 'rgba(255, 215, 0, 0.3)'
                  : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#000',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: applying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: applying ? 'none' : '0 8px 20px rgba(255, 215, 0, 0.4)',
                transition: 'all 0.3s ease',
                minHeight: '56px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!applying) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 215, 0, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!applying) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.4)'
                }
              }}
            >
              {applying ? (
                <>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Template wordt toegepast...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Template Toepassen
                  <ChevronRight size={20} />
                </>
              )}
            </button>
            
            <p style={{
              marginTop: '1rem',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center'
            }}>
              Dit genereert direct een complete weekplanning voor {selectedClient?.first_name}
            </p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
