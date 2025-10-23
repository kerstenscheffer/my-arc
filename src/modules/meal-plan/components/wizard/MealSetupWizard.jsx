// src/modules/meal-plan/components/wizard/MealSetupWizard.jsx
// MAIN ORCHESTRATOR - Meal Setup Wizard

import { useState } from 'react'
import WizardLayout from './shared/WizardLayout'
import Slide1Intro from './slides/Slide1Intro'
import Slide2MacroGoals from './slides/Slide2MacroGoals'
import Slide3MealStructure from './slides/Slide3MealStructure'
import Slide4ProteinPicker from './slides/Slide4ProteinPicker'
import Slide5CarbPicker from './slides/Slide5CarbPicker'
import Slide6MealPrepIntro from './slides/Slide6MealPrepIntro'

export default function MealSetupWizard({ db, client, onComplete, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)
  
  // Wizard state - alle data die we verzamelen
  const [wizardData, setWizardData] = useState({
    // Slide 3: Meal structure
    mealStructure: null, // { id, meals, snacks, ... }
    
    // Slide 4: Proteins
    selectedProteins: [], // Array of UUIDs
    
    // Slide 5: Carbs
    selectedCarbs: [], // Array of UUIDs
    
    // Slide 7: Meal prep (placeholder for now)
    weeklyPrepMeals: [],
    weeklyPrepConfig: {
      portions: 7,
      cookDay: 'sunday'
    },
    dailyPrepMeals: []
  })
  
  const totalSlides = 6 // For now, without Slide7
  
  // Update wizard data helper
  const updateWizardData = (key, value) => {
    setWizardData(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Validation per slide
  const canGoNext = () => {
    switch (currentSlide) {
      case 1: // Intro - altijd next
        return true
      case 2: // Macro goals - altijd next (read-only)
        return true
      case 3: // Meal structure
        return wizardData.mealStructure !== null
      case 4: // Proteins
        return wizardData.selectedProteins.length === 3
      case 5: // Carbs
        return wizardData.selectedCarbs.length === 3
      case 6: // Meal prep intro - altijd next
        return true
      default:
        return true
    }
  }
  
  // Navigation handlers
  const handleNext = async () => {
    if (currentSlide === totalSlides) {
      // Last slide - save and complete
      await handleComplete()
    } else {
      setCurrentSlide(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const handlePrev = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  // Save wizard data to database
  const handleComplete = async () => {
    try {
      setIsLoading(true)
      setSaveError(null)
      
      console.log('💾 Saving wizard data:', wizardData)
      
      // Prepare data for client_meal_plans.generation_settings
      const generationSettings = {
        wizard_completed: true,
        completed_at: new Date().toISOString(),
        meal_structure: {
          id: wizardData.mealStructure?.id,
          meals: wizardData.mealStructure?.meals,
          snacks: wizardData.mealStructure?.snacks
        },
        preferred_proteins: wizardData.selectedProteins,
        preferred_carbs: wizardData.selectedCarbs,
        meal_prep_config: {
          weekly_prep_meals: wizardData.weeklyPrepMeals,
          weekly_prep_config: wizardData.weeklyPrepConfig,
          daily_prep_meals: wizardData.dailyPrepMeals
        }
      }
      
      // Check if client already has an active meal plan
      const { data: existingPlan, error: checkError } = await db.supabase
        .from('client_meal_plans')
        .select('id')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw checkError
      }
      
      if (existingPlan) {
        // Update existing plan's generation_settings
        const { error: updateError } = await db.supabase
          .from('client_meal_plans')
          .update({ 
            generation_settings: generationSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id)
        
        if (updateError) throw updateError
        
        console.log('✅ Updated existing meal plan generation settings')
      } else {
        // Create new placeholder meal plan with settings
        const { error: insertError } = await db.supabase
          .from('client_meal_plans')
          .insert({
            client_id: client.id,
            template_name: 'Wizard Setup - ' + new Date().toLocaleDateString('nl-NL'),
            is_active: true,
            ai_generated: false, // Will be true when AI generates the actual plan
            generation_settings: generationSettings,
            daily_calories: client.target_calories || 2200,
            daily_protein: client.target_protein || 165,
            daily_carbs: client.target_carbs || 250,
            daily_fat: client.target_fat || 70,
            created_via: 'wizard'
          })
        
        if (insertError) throw insertError
        
        console.log('✅ Created new meal plan with generation settings')
      }
      
      // Success - call completion handler
      if (onComplete) {
        onComplete(wizardData)
      }
      
    } catch (error) {
      console.error('❌ Save wizard data failed:', error)
      setSaveError(error.message || 'Er ging iets mis bij het opslaan')
      setIsLoading(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 10000,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            
            // Touch optimization
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ✕
        </button>
      )}
      
      {/* Error Display */}
      {saveError && (
        <div style={{
          position: 'fixed',
          top: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          maxWidth: '90%',
          width: '400px',
          padding: '1rem 1.5rem',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          color: '#fff',
          textAlign: 'center',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
            ⚠️ Opslaan mislukt
          </div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            {saveError}
          </div>
        </div>
      )}
      
      {/* Wizard Layout with Slides */}
      <WizardLayout
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoNext={canGoNext()}
        canGoPrev={currentSlide > 1}
        isLoading={isLoading}
      >
        {/* Slide 1: Intro */}
        {currentSlide === 1 && (
          <Slide1Intro client={client} />
        )}
        
        {/* Slide 2: Macro Goals */}
        {currentSlide === 2 && (
          <Slide2MacroGoals client={client} />
        )}
        
        {/* Slide 3: Meal Structure */}
        {currentSlide === 3 && (
          <Slide3MealStructure
            client={client}
            selectedStructure={wizardData.mealStructure}
            onStructureSelect={(structure) => updateWizardData('mealStructure', structure)}
          />
        )}
        
        {/* Slide 4: Protein Picker */}
        {currentSlide === 4 && (
          <Slide4ProteinPicker
            db={db}
            selectedProteins={wizardData.selectedProteins}
            onProteinsSelect={(proteins) => updateWizardData('selectedProteins', proteins)}
          />
        )}
        
        {/* Slide 5: Carbs Picker */}
        {currentSlide === 5 && (
          <Slide5CarbPicker
            db={db}
            selectedCarbs={wizardData.selectedCarbs}
            onCarbsSelect={(carbs) => updateWizardData('selectedCarbs', carbs)}
          />
        )}
        
        {/* Slide 6: Meal Prep Intro */}
        {currentSlide === 6 && (
          <Slide6MealPrepIntro />
        )}
        
        {/* Slide 7: Meal Prep Builder - TODO */}
        {/* {currentSlide === 7 && (
          <Slide7MealPrepBuilder
            db={db}
            wizardData={wizardData}
            onPrepDataUpdate={(key, value) => updateWizardData(key, value)}
          />
        )} */}
      </WizardLayout>
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
