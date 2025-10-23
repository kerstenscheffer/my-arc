// src/modules/meal-plan/components/wizard/MealSetupWizardV2.jsx
// NIEUWE VERSIE - Kersten's Persoonlijke Aanpak
import React, { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react'

// Import slides
import Slide1Goals from './slides/Slide1Goals'
import Slide2MealFrequency from './slides/Slide2MealFrequency'
import Slide4ProteinPicker from './slides/Slide4ProteinPicker'
import Slide5CarbPicker from './slides/Slide5CarbPicker'
import Slide6MealPrep from './slides/Slide6MealPrep'

export default function MealSetupWizardV2({
  isOpen,
  onClose,
  onComplete,
  client,
  db,
  isMobile
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    mealFrequency: {
      meals: 3,
      snacks: 1
    },
    proteinSources: [],
    carbSources: [],
    mealPrepPlan: {
      batchCooking: false,
      dailyPrep: [],
      portionSize: 1
    }
  })

  const totalSteps = 5

  useEffect(() => {
    if (isOpen) {
      loadExistingData()
    }
  }, [isOpen])

  const loadExistingData = async () => {
    try {
      // Load existing wizard data if any
      const { data, error } = await db.supabase
        .from('client_meal_setup_data')
        .select('*')
        .eq('client_id', client.id)
        .single()

      if (data && !error) {
        setWizardData(data.wizard_data || wizardData)
      }
    } catch (error) {
      console.log('No existing data, starting fresh')
    }
  }

  const saveProgress = async () => {
    try {
      await db.supabase
        .from('client_meal_setup_data')
        .upsert({
          client_id: client.id,
          wizard_data: wizardData,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Goals - always can proceed
        return true
      case 2: // Meal Frequency - always can proceed
        return true
      case 3: // Protein Sources - need at least 3
        return wizardData.proteinSources.filter(Boolean).length === 3
      case 4: // Carb Sources - need at least 3
        return wizardData.carbSources.filter(Boolean).length === 3
      case 5: // Meal Prep - optional, always can proceed
        return true
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (canProceed()) {
      await saveProgress()
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    try {
      // Save final data
      await saveProgress()

      // Mark wizard as completed
      await db.supabase
        .from('clients')
        .update({
          has_completed_meal_setup: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)

      // Call completion callback
      onComplete?.()
      onClose()
    } catch (error) {
      console.error('Failed to complete wizard:', error)
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.')
    }
  }

  const updateWizardData = (key, value) => {
    setWizardData(prev => ({
      ...prev,
      [key]: value
    }))
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
        width: isMobile ? '95%' : '1000px',
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
                🧙 Meal Setup Wizard - Kersten's Methode
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
          {/* STEP 1: GOALS */}
          {currentStep === 1 && (
            <Slide1Goals
              client={client}
              isMobile={isMobile}
            />
          )}

          {/* STEP 2: MEAL FREQUENCY */}
          {currentStep === 2 && (
            <Slide2MealFrequency
              data={wizardData}
              onUpdate={(freq) => updateWizardData('mealFrequency', freq)}
              isMobile={isMobile}
            />
          )}

          {/* STEP 3: PROTEIN SOURCES */}
          {currentStep === 3 && (
            <Slide4ProteinPicker
              data={wizardData}
              onUpdate={(proteins) => updateWizardData('proteinSources', proteins)}
              db={db}
              isMobile={isMobile}
            />
          )}

          {/* STEP 4: CARB SOURCES */}
          {currentStep === 4 && (
            <Slide5CarbPicker
              data={wizardData}
              onUpdate={(carbs) => updateWizardData('carbSources', carbs)}
              db={db}
              isMobile={isMobile}
            />
          )}

          {/* STEP 5: MEAL PREP */}
          {currentStep === 5 && (
            <Slide6MealPrep
              data={wizardData}
              onUpdate={(plan) => updateWizardData('mealPrepPlan', plan)}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '1rem'
        }}>
          {currentStep > 1 && (
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
          )}

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                flex: currentStep === 1 ? 1 : 2,
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
          ) : (
            <button
              onClick={handleComplete}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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
              <Check size={18} />
              Voltooi Setup
            </button>
          )}
        </div>
      </div>
    </>
  )
}
