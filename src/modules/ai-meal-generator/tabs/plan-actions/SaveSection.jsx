// src/modules/ai-meal-generator/tabs/plan-actions/SaveSection.jsx
// CRITICAL COMPONENT: Handles saving AI meal plans to database - FIXED

import { useState } from 'react'
import { Save, CheckCircle, AlertCircle, Database, Clock } from 'lucide-react'

export default function SaveSection({
  db,
  selectedClient,
  generatedPlan,
  planModifications,
  dailyTargets,        // FIX: Added dailyTargets prop
  mealsPerDay,         // FIX: Added mealsPerDay prop
  saved,
  setSaved,
  isMobile
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [planName, setPlanName] = useState('')
  const [makeActive, setMakeActive] = useState(true)
  
  // Get modified plan with any changes from PlanAnalyzer
  const getFinalPlan = () => {
    if (!generatedPlan?.weekPlan) return null
    
    // Apply modifications if any exist
    const finalWeekPlan = generatedPlan.weekPlan.map((day, index) => {
      if (planModifications && planModifications[index]) {
        return planModifications[index]
      }
      return day
    })
    
    return {
      ...generatedPlan,
      weekPlan: finalWeekPlan
    }
  }
  
  // Main save function - saves to client_meal_plans table
  const handleSavePlan = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    
    try {
      // Get final plan with modifications
      const finalPlan = getFinalPlan()
      if (!finalPlan) {
        throw new Error('No plan to save')
      }
      
      // Prepare week structure for database (JSONB format)
      const weekStructure = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      finalPlan.weekPlan.forEach((day, index) => {
        const dayName = days[index]
        
        // FIX: Calculate actual scale factors based on totals vs raw meal calories
        const dayMeals = [day.breakfast, day.lunch, day.dinner, ...day.snacks].filter(Boolean)
        const rawDayTotal = dayMeals.reduce((sum, meal) => sum + (meal.originalCalories || meal.calories || 0), 0)
        const actualDayTotal = day.totals?.kcal || rawDayTotal
        const globalDayScale = rawDayTotal > 0 ? actualDayTotal / rawDayTotal : 1
        
        console.log(`Day ${dayName}: Raw ${Math.round(rawDayTotal)} → Target ${Math.round(actualDayTotal)} = ${(globalDayScale * 100).toFixed(0)}% scale`)
        
        // Extract meal IDs and CALCULATED scaling factors
        weekStructure[dayName] = {
          breakfast: day.breakfast ? {
            meal_id: day.breakfast.id,
            meal_name: day.breakfast.name,
            calories: Math.round((day.breakfast.originalCalories || day.breakfast.calories) * globalDayScale),
            protein: Math.round((day.breakfast.protein || 0) * globalDayScale),
            carbs: Math.round((day.breakfast.carbs || 0) * globalDayScale),
            fat: Math.round((day.breakfast.fat || 0) * globalDayScale),
            scale_factor: globalDayScale
          } : null,
          lunch: day.lunch ? {
            meal_id: day.lunch.id,
            meal_name: day.lunch.name,
            calories: Math.round((day.lunch.originalCalories || day.lunch.calories) * globalDayScale),
            protein: Math.round((day.lunch.protein || 0) * globalDayScale),
            carbs: Math.round((day.lunch.carbs || 0) * globalDayScale),
            fat: Math.round((day.lunch.fat || 0) * globalDayScale),
            scale_factor: globalDayScale
          } : null,
          dinner: day.dinner ? {
            meal_id: day.dinner.id,
            meal_name: day.dinner.name,
            calories: Math.round((day.dinner.originalCalories || day.dinner.calories) * globalDayScale),
            protein: Math.round((day.dinner.protein || 0) * globalDayScale),
            carbs: Math.round((day.dinner.carbs || 0) * globalDayScale),
            fat: Math.round((day.dinner.fat || 0) * globalDayScale),
            scale_factor: globalDayScale
          } : null,
          snacks: day.snacks.map(snack => snack ? {
            meal_id: snack.id,
            meal_name: snack.name,
            calories: Math.round((snack.originalCalories || snack.calories) * globalDayScale),
            protein: Math.round((snack.protein || 0) * globalDayScale),
            carbs: Math.round((snack.carbs || 0) * globalDayScale),
            fat: Math.round((snack.fat || 0) * globalDayScale),
            scale_factor: globalDayScale
          } : null).filter(Boolean),
          totals: day.totals,
          accuracy: day.accuracy
        }
      })
      
      // Prepare save data - FIX: Use dailyTargets prop instead of finalPlan.dailyTargets
      const saveData = {
        client_id: selectedClient.id,
        template_name: planName || `AI Plan - ${new Date().toLocaleDateString('nl-NL')}`,
        week_structure: weekStructure,
        daily_calories: dailyTargets?.calories || 2000,     // FIX: Use dailyTargets prop
        daily_protein: dailyTargets?.protein || 150,        // FIX: Use dailyTargets prop
        daily_carbs: dailyTargets?.carbs || 200,            // FIX: Use dailyTargets prop
        daily_fat: dailyTargets?.fat || 67,                 // FIX: Use dailyTargets prop
        is_active: makeActive,
        start_date: new Date().toISOString().split('T')[0],
        // Store AI metadata
        ai_generated: true,
        ai_settings: {
          meals_per_day: mealsPerDay || finalPlan.clientProfile?.meals_per_day || 4,  // FIX: Use mealsPerDay prop
          primary_goal: finalPlan.clientProfile?.primary_goal || 'maintain',
          excluded_ingredients: finalPlan.ingredientPreferences?.excluded || 0,
          selected_ingredients: finalPlan.ingredientPreferences?.selected || 0,
          ai_score: finalPlan.aiAnalysis?.averageScore || 0
        }
      }
      
      console.log('💾 Saving meal plan:', saveData)
      console.log('📊 Daily targets being saved:', {
        calories: saveData.daily_calories,
        protein: saveData.daily_protein,
        carbs: saveData.daily_carbs,
        fat: saveData.daily_fat
      })
      
      // Use AI service to save (it has the save method)
      const aiService = await db.getAIMealPlanningService()
      
      // FIX: Pass the correct targets to savePlan
      const planWithCorrectTargets = {
        ...finalPlan,
        dailyTargets: {
          kcal: dailyTargets.calories,
          protein: dailyTargets.protein,
          carbs: dailyTargets.carbs,
          fat: dailyTargets.fat
        }
      }
      
      const result = await aiService.savePlan(planWithCorrectTargets, selectedClient.id, saveData.template_name)
      
      if (result) {
        setSaved(true)
        console.log('✅ Plan saved successfully:', result)
        
        // Keep saved state for 5 seconds
        setTimeout(() => setSaved(false), 5000)
      }
    } catch (error) {
      console.error('❌ Error saving plan:', error)
      setError(error.message || 'Kon plan niet opslaan')
    } finally {
      setSaving(false)
    }
  }
  
  // Quick save without options
  const handleQuickSave = async () => {
    await handleSavePlan()
  }
  
  return (
    <>
      {/* Save Status Messages */}
      {saved && (
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease'
        }}>
          <CheckCircle size={24} style={{ color: '#10b981' }} />
          <div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#10b981'
            }}>
              Plan succesvol opgeslagen!
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '0.25rem'
            }}>
              {selectedClient?.first_name} kan het plan nu bekijken in de app
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={24} style={{ color: '#ef4444' }} />
          <div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#ef4444'
            }}>
              Fout bij opslaan
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '0.25rem'
            }}>
              {error}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Save Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Database size={18} />
          Activeer Plan voor Client
        </h3>
        
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '1.5rem'
        }}>
          Sla het AI-gegenereerde plan op in de database. Dit maakt het direct zichtbaar voor {selectedClient?.first_name} in de client app.
        </p>
        
        {/* Plan Name Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.5)',
            display: 'block',
            marginBottom: '0.5rem'
          }}>
            Plan Naam (optioneel)
          </label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder={`AI Plan - ${new Date().toLocaleDateString('nl-NL')}`}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        {/* Make Active Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={makeActive}
            onChange={(e) => setMakeActive(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          />
          <span style={{
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            Direct activeren als huidig plan
            <span style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '0.25rem'
            }}>
              Dit vervangt het huidige actieve plan van de client
            </span>
          </span>
        </label>
        
        {/* Save Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {/* Primary Save Button */}
          <button
            onClick={handleQuickSave}
            disabled={saving || saved}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: saving || saved
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              cursor: saving || saved ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minHeight: '48px',
              touchAction: 'manipulation',
              transition: 'all 0.3s ease',
              boxShadow: saving || saved
                ? 'none'
                : '0 10px 25px rgba(16, 185, 129, 0.25)'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : saved ? (
              <>
                <CheckCircle size={20} />
                Opgeslagen!
              </>
            ) : (
              <>
                <Save size={20} />
                Plan Opslaan
              </>
            )}
          </button>
          
          {/* Save as Template Button */}
          <button
            disabled={saving || saved}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              color: '#8b5cf6',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: saving || saved ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minHeight: '48px',
              touchAction: 'manipulation',
              opacity: saving || saved ? 0.5 : 1
            }}
          >
            <Clock size={20} />
            Opslaan als Template
          </button>
        </div>
        
        {/* Info Text */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <strong>💡 Tip:</strong> Het plan wordt opgeslagen in de <code>client_meal_plans</code> tabel 
          met alle AI-optimalisaties en aanpassingen die je hebt gemaakt.
        </div>
        
        {/* Debug - Show what's being saved */}
        {process.env.NODE_ENV === 'development' && dailyTargets && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: 'rgba(139, 92, 246, 0.7)',
            fontFamily: 'monospace'
          }}>
            Saving with targets: {dailyTargets.calories} kcal, {dailyTargets.protein}g P, {dailyTargets.carbs}g C, {dailyTargets.fat}g F
          </div>
        )}
      </div>
      
      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
