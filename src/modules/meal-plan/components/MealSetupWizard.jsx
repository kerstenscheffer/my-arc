// src/modules/meal-plan/components/MealSetupWizard.jsx
// VERSION: 2.0.0 - AI Generation Enabled (2025-10-22)
import React, { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Zap, AlertCircle } from 'lucide-react'
import StandardFoodsSection from '../../client-meal-base/components/StandardFoodsSection'
import AICustomMealBuilder from './AICustomMealBuilder'
import AIFavoritesModal from './AIFavoritesModal'
import { getAIMealPlanningService } from '../../ai-meal-generator/AIMealPlanningService'

console.log('🔍 [WIZARD] MealSetupWizard.jsx loaded - VERSION 2.0.0 - AI Generation Enabled')

export default function MealSetupWizard({
  isOpen,
  onClose,
  onComplete,
  client,
  db,
  isMobile
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    standardFoods: null,
    customMeals: [],
    preferences: {
      mealsPerDay: 4,
      varietyLevel: 'medium'
    },
    weekStructure: null
  })
  
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)
  const [showMealBuilder, setShowMealBuilder] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  
  const totalSteps = 7
  
  useEffect(() => {
    if (isOpen) {
      loadExistingData()
    }
  }, [isOpen])
  
  const loadExistingData = async () => {
    try {
      const standardFoods = await db.getClientStandardFoods(client.id)
      const customMeals = await db.getClientCustomMeals(client.id)
      
      setWizardData(prev => ({
        ...prev,
        standardFoods,
        customMeals
      }))
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
  
  const canProceed = () => {
    if (currentStep === 2) {
      // Check proteins filled (at least 2)
      const proteins = wizardData.standardFoods?.protein?.filter(p => p?.meal)
      return proteins && proteins.length >= 2
    }
    if (currentStep === 3) {
      // Check carbs filled (at least 2)
      const carbs = wizardData.standardFoods?.carbs?.filter(c => c?.meal)
      return carbs && carbs.length >= 2
    }
    if (currentStep === 4) {
      // Meal preps optional
      return true
    }
    if (currentStep === 5) {
      // Check custom meals (at least 3)
      return wizardData.customMeals.length >= 3
    }
    if (currentStep === 6) {
      // Check preferences selected
      return wizardData.preferences.mealsPerDay > 0
    }
    return true
  }
  
  const handleNext = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const handleGenerateWeek = async () => {
    console.log('='.repeat(80))
    console.log('🚀 [WIZARD] ===== STARTING MEAL PLAN GENERATION =====')
    console.log('='.repeat(80))
    console.log('🔍 [WIZARD] handleGenerateWeek() called at:', new Date().toISOString())
    console.log('📍 [WIZARD] Current step:', currentStep)

    setLoading(true)
    setError(null)
    setLoadingMessage('Voorkeuren voorbereiden...')

    try {
      // Step 1: Extract selected ingredients from standard foods
      console.log('📊 [WIZARD] Extracting selected ingredients...')
      const selectedProteins = (wizardData.standardFoods?.protein || [])
        .filter(item => item?.meal?.id)
        .map(item => ({
          id: item.meal.id,
          name: item.meal.name,
          type: 'protein'
        }))

      const selectedCarbs = (wizardData.standardFoods?.carbs || [])
        .filter(item => item?.meal?.id)
        .map(item => ({
          id: item.meal.id,
          name: item.meal.name,
          type: 'carb'
        }))

      const selectedMealPreps = (wizardData.standardFoods?.meal_prep || [])
        .filter(item => item?.meal?.id)
        .map(item => ({
          id: item.meal.id,
          name: item.meal.name,
          type: 'meal_prep'
        }))

      const selectedIngredients = [
        ...selectedProteins,
        ...selectedCarbs,
        ...selectedMealPreps
      ]

      console.log('✅ [WIZARD] Selected ingredients:', {
        proteins: selectedProteins.length,
        carbs: selectedCarbs.length,
        mealPreps: selectedMealPreps.length,
        total: selectedIngredients.length
      })

      // Step 2: Get AI Meal Planning Service
      console.log('🤖 [WIZARD] Initializing AI Meal Planning Service...')
      setLoadingMessage('AI service initialiseren...')
      const aiService = getAIMealPlanningService(db.supabase)

      // Step 3: Get client profile
      console.log('👤 [WIZARD] Loading client profile...')
      setLoadingMessage('Profiel laden...')
      const clientProfile = await aiService.ensureClientProfile(client)

      console.log('✅ [WIZARD] Client profile loaded:', {
        name: clientProfile.first_name,
        targetCalories: clientProfile.target_calories,
        targetProtein: clientProfile.target_protein_g,
        mealsPerDay: wizardData.preferences.mealsPerDay
      })

      // Update profile with wizard preferences
      clientProfile.meals_per_day = wizardData.preferences.mealsPerDay

      // Step 4: Generate AI Week Plan
      console.log('🎯 [WIZARD] Generating AI week plan...')
      setLoadingMessage('AI genereert je week plan...')

      const generationOptions = {
        days: 7,
        variationLevel: wizardData.preferences.varietyLevel || 'medium',
        avoidDuplicates: true,
        selectedIngredients: selectedIngredients,
        excludedIngredients: [],
        mealPreferences: {
          mealsPerDay: wizardData.preferences.mealsPerDay,
          varietyLevel: wizardData.preferences.varietyLevel
        }
      }

      console.log('📋 [WIZARD] Generation options:', generationOptions)

      const aiPlan = await aiService.generateWeekPlan(clientProfile, generationOptions)

      console.log('✅ [WIZARD] AI Plan generated successfully:', {
        daysGenerated: aiPlan.weekPlan.length,
        dailyTargets: aiPlan.dailyTargets,
        stats: aiPlan.stats
      })

      // Step 5: Save plan to database
      console.log('💾 [WIZARD] Saving plan to database...')
      setLoadingMessage('Plan opslaan...')

      const savedPlan = await aiService.savePlan(
        aiPlan,
        client.id,
        `Wizard Setup - ${new Date().toLocaleDateString('nl-NL')}`
      )

      console.log('✅ [WIZARD] Plan saved with ID:', savedPlan.id)

      // Step 6: Store week structure in wizard data
      setWizardData(prev => ({
        ...prev,
        weekStructure: savedPlan.week_structure,
        generatedPlan: aiPlan
      }))

      console.log('='.repeat(80))
      console.log('🎉 [WIZARD] ===== GENERATION COMPLETE! =====')
      console.log('='.repeat(80))
      console.log('📍 [WIZARD] Moving to review step (Step 7)...')
      setCurrentStep(7) // Go to review

    } catch (error) {
      console.log('='.repeat(80))
      console.error('❌ [WIZARD] ===== GENERATION FAILED =====')
      console.error('❌ [WIZARD] Error:', error)
      console.error('❌ [WIZARD] Error message:', error.message)
      console.error('❌ [WIZARD] Error stack:', error.stack)
      console.log('='.repeat(80))
      setError(error.message || 'Er is iets misgegaan bij het genereren van je plan')
    } finally {
      setLoading(false)
      setLoadingMessage('')
      console.log('🏁 [WIZARD] handleGenerateWeek() function ended')
    }
  }

  const handleComplete = async () => {
    console.log('✅ [WIZARD] Completing wizard setup...')

    try {
      // Mark wizard as completed
      console.log('📝 [WIZARD] Marking wizard as completed in database...')
      const { error } = await db.supabase
        .from('clients')
        .update({ has_completed_meal_setup: true })
        .eq('id', client.id)

      if (error) {
        console.error('❌ [WIZARD] Failed to mark wizard complete:', error)
        throw error
      }

      console.log('✅ [WIZARD] Wizard marked as completed')
      console.log('🎊 [WIZARD] Setup complete! Closing wizard...')

      onComplete()
      onClose()
    } catch (error) {
      console.error('❌ [WIZARD] Error completing wizard:', error)
      setError('Kon wizard niet afronden. Probeer het opnieuw.')
    }
  }
  
  const handleSetFood = async (category, slotNumber) => {
    setShowFavoritesModal(true)
    // Store selection context for callback
    window._standardFoodContext = { category, slotNumber }
  }
  
  const handleRemoveFood = async (category, slotNumber) => {
    await db.removeStandardFood(client.id, category, slotNumber)
    await loadExistingData()
  }
  
  const handleMealSelected = async (meal) => {
    const { category, slotNumber } = window._standardFoodContext || {}
    if (category && slotNumber) {
      // Save standard food
      await db.supabase
        .from('ai_client_standard_foods')
        .upsert({
          client_id: client.id,
          category,
          slot_number: slotNumber,
          custom_meal_id: meal.id
        })
      
      await loadExistingData()
      setShowFavoritesModal(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 9998
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '95%' : '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '20px' : '24px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Progress */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                🧙 Meal Setup Wizard
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                marginTop: '0.25rem'
              }}>
                Stap {currentStep} van {totalSteps}
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: idx < currentStep
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '2rem'
        }}>
          {/* STEP 1: WELKOM */}
          {currentStep === 1 && (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
              <h3 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                Welkom bij je Meal Planner!
              </h3>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.6,
                marginBottom: '2rem'
              }}>
                We gaan in 6 stappen je complete week plannen. Dit maakt meal preppen super simpel en zorgt dat je altijd weet wat je moet eten.
              </p>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'left',
                marginBottom: '2rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '0.75rem'
                }}>
                  ✨ Wat ga je instellen:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <li style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    🥩 3 Vaste eiwitbronnen
                  </li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    🍚 3 Vaste koolhydraten
                  </li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    🍱 3 Meal prep gerechten
                  </li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    ⭐ Extra variatie maaltijden
                  </li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    🤖 AI genereert je complete week
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* STEP 2: STANDARD PROTEINS */}
          {currentStep === 2 && (
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                🥩 Kies je 3 vaste eiwitbronnen
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem'
              }}>
                Dit zijn de eiwitten die je vaak eet en makkelijk meal prept. Minimaal 2 required.
              </p>
              
              <StandardFoodsSection
                standardFoods={wizardData.standardFoods || {}}
                onSetFood={handleSetFood}
                onRemoveFood={handleRemoveFood}
                isMobile={isMobile}
              />
            </div>
          )}
          
          {/* STEP 3: STANDARD CARBS */}
          {currentStep === 3 && (
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                🍚 Kies je vaste koolhydraten
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem'
              }}>
                Je basis carbs die je vaak gebruikt. Minimaal 2 required.
              </p>
              
              <StandardFoodsSection
                standardFoods={wizardData.standardFoods || {}}
                onSetFood={handleSetFood}
                onRemoveFood={handleRemoveFood}
                isMobile={isMobile}
              />
            </div>
          )}
          
          {/* STEP 4: MEAL PREPS */}
          {currentStep === 4 && (
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                🍱 Meal prep gerechten (optioneel)
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem'
              }}>
                Grote batches die je makkelijk kunt maken voor meerdere dagen.
              </p>
              
              <StandardFoodsSection
                standardFoods={wizardData.standardFoods || {}}
                onSetFood={handleSetFood}
                onRemoveFood={handleRemoveFood}
                isMobile={isMobile}
              />
            </div>
          )}
          
          {/* STEP 5: CUSTOM MEALS */}
          {currentStep === 5 && (
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                ⭐ Extra variatie maaltijden
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1rem'
              }}>
                Voeg minimaal 3 extra maaltijden toe voor meer variatie.
              </p>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  ✅ {wizardData.customMeals.length} / 3 meals
                </div>
              </div>
              
              <button
                onClick={() => setShowMealBuilder(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                + Voeg Meal Toe
              </button>
              
              {/* Show existing meals */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                {wizardData.customMeals.map(meal => (
                  <div
                    key={meal.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}
                  >
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}>
                      {meal.name}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {meal.calories} kcal • {meal.protein}g P
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* STEP 6: PREFERENCES */}
          {currentStep === 6 && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                ⚙️ Jouw voorkeuren
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '2rem'
              }}>
                Hoe wil je dat AI je week plant?
              </p>
              
              {/* Meals per day */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '1rem'
                }}>
                  Maaltijden per dag
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem'
                }}>
                  {[3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setWizardData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, mealsPerDay: num }
                      }))}
                      style={{
                        padding: '1.5rem',
                        background: wizardData.preferences.mealsPerDay === num
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: wizardData.preferences.mealsPerDay === num
                          ? '2px solid #10b981'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '2rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Variety level */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '1rem'
                }}>
                  Variatie niveau
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem'
                }}>
                  {[
                    { value: 'low', label: 'Laag' },
                    { value: 'medium', label: 'Gemiddeld' },
                    { value: 'high', label: 'Hoog' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setWizardData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, varietyLevel: option.value }
                      }))}
                      style={{
                        padding: '1rem',
                        background: wizardData.preferences.varietyLevel === option.value
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: wizardData.preferences.varietyLevel === option.value
                          ? '2px solid #10b981'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#ef4444',
                      marginBottom: '0.25rem'
                    }}>
                      Generatie Mislukt
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Status Display */}
              {loading && loadingMessage && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    borderTopColor: '#10b981',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#10b981',
                    fontWeight: '500'
                  }}>
                    {loadingMessage}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  console.log('🖱️  [WIZARD] "Genereer Mijn Week!" button clicked')
                  handleGenerateWeek()
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  marginTop: '2rem',
                  background: loading
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <Zap size={20} />
                {loading ? 'Bezig met genereren...' : 'Genereer Mijn Week!'}
              </button>
            </div>
          )}
          
          {/* STEP 7: REVIEW */}
          {currentStep === 7 && (
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                Je week is klaar!
              </h3>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '2rem'
              }}>
                Je gepersonaliseerde meal plan is succesvol gegenereerd en opgeslagen.
              </p>

              {/* Plan Summary */}
              {wizardData.generatedPlan && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#10b981',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    📊 Plan Overzicht
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                        Dagelijks Doel
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {wizardData.generatedPlan.dailyTargets.kcal} kcal
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                        Eiwit Doel
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {wizardData.generatedPlan.dailyTargets.protein}g
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                        Maaltijden per Dag
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {wizardData.preferences.mealsPerDay}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
                        Variatie Niveau
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', textTransform: 'capitalize' }}>
                        {wizardData.preferences.varietyLevel}
                      </div>
                    </div>
                  </div>

                  {wizardData.generatedPlan.stats && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '0.5rem'
                      }}>
                        Plan Nauwkeurigheid
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        {wizardData.generatedPlan.stats.averageAccuracy}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={loading}
                style={{
                  padding: '1.25rem 3rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <Check size={20} />
                {loading ? 'Bezig...' : 'Start met Mijn Plan'}
              </button>

              {error && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#ef4444'
                }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Navigation */}
        {currentStep < 7 && currentStep > 1 && (
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={18} />
              Terug
            </button>
            
            <button
              onClick={currentStep === 6 ? null : handleNext}
              disabled={!canProceed()}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: canProceed()
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Volgende
              <ArrowRight size={18} />
            </button>
          </div>
        )}
        
        {currentStep === 1 && (
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Start Setup
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showFavoritesModal && (
        <AIFavoritesModal
          isOpen={showFavoritesModal}
          onClose={() => setShowFavoritesModal(false)}
          onSelect={handleMealSelected}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      {showMealBuilder && (
        <AICustomMealBuilder
          isOpen={showMealBuilder}
          onClose={() => {
            setShowMealBuilder(false)
            loadExistingData()
          }}
          db={db}
          client={client}
          isMobile={isMobile}
        />
      )}
    </>
  )
}
