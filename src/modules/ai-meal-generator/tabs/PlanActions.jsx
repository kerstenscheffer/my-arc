// src/modules/ai-meal-generator/tabs/PlanActions.jsx
// TAB 5: Save & Export Plan Actions - FIXED WITH DAILY TARGETS

import { useState, useEffect } from 'react'
import { Save, Download, Send, Info, AlertCircle } from 'lucide-react'
import SaveSection from './plan-actions/SaveSection'
import ExportSection from './plan-actions/ExportSection'
import ShareSection from './plan-actions/ShareSection'

export default function PlanActions({
  db,
  selectedClient,
  generatedPlan,
  planModifications,
  dailyTargets,    // FIX: Added dailyTargets prop
  mealsPerDay,     // FIX: Added mealsPerDay prop
  isMobile
}) {
  // States
  const [saved, setSaved] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeMacros: true,
    includeShoppingList: true,
    includeRecipes: false,
    includePrices: false,
    useScaledValues: true // Always use scaled values
  })
  const [emailAddress, setEmailAddress] = useState(selectedClient?.email || '')
  const [shareMessage, setShareMessage] = useState('')
  const [actualAverages, setActualAverages] = useState(null)
  
  // Calculate actual averages from scaled values
  useEffect(() => {
    if (generatedPlan?.weekPlan) {
      calculateActualAverages()
    }
  }, [generatedPlan])
  
  const calculateActualAverages = () => {
    if (!generatedPlan?.weekPlan) return
    
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalMeals = 0
    
    generatedPlan.weekPlan.forEach(day => {
      // Use the day totals which already include scaling
      if (day.totals) {
        totalCalories += day.totals.kcal || 0
        totalProtein += day.totals.protein || 0
        totalCarbs += day.totals.carbs || 0
        totalFat += day.totals.fat || 0
      }
      
      // Count meals
      const slots = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
      slots.forEach(slot => {
        if (day[slot]) totalMeals++
      })
      if (day.snacks && Array.isArray(day.snacks)) {
        totalMeals += day.snacks.filter(Boolean).length
      }
    })
    
    // Calculate daily averages
    const avgCalories = Math.round(totalCalories / 7)
    const avgProtein = Math.round(totalProtein / 7)
    const avgCarbs = Math.round(totalCarbs / 7)
    const avgFat = Math.round(totalFat / 7)
    
    setActualAverages({
      calories: avgCalories,
      protein: avgProtein,
      carbs: avgCarbs,
      fat: avgFat,
      totalMeals: totalMeals
    })
  }
  
  if (!generatedPlan?.weekPlan) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Save size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>Genereer en analyseer eerst een plan</p>
      </div>
    )
  }
  
  // Check if plan has scaling
  const hasScaling = generatedPlan.weekPlan.some(day => {
    return ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3'].some(slot => {
      const meal = day[slot]
      return meal && meal.scale_factor && meal.scale_factor !== 1.0
    })
  })
  
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
          <Save size={24} style={{ color: '#ec4899' }} />
          Opslaan & Exporteren
        </h2>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          Sla het plan op en deel het met {selectedClient?.first_name}
        </p>
      </div>
      
      {/* Scaling Notice */}
      {hasScaling && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
            <strong style={{ color: '#f59e0b' }}>Porties zijn aangepast!</strong>
            <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
              Dit plan bevat geschaalde maaltijden om je macro targets te halen. 
              Alle waardes die worden opgeslagen zijn de aangepaste porties.
            </div>
          </div>
        </div>
      )}
      
      {/* Save Section - MOST IMPORTANT - FIX: Pass dailyTargets */}
      <SaveSection
        db={db}
        selectedClient={selectedClient}
        generatedPlan={generatedPlan}
        planModifications={planModifications}
        dailyTargets={dailyTargets}        // FIX: Pass dailyTargets to SaveSection
        mealsPerDay={mealsPerDay}           // FIX: Pass mealsPerDay to SaveSection
        saved={saved}
        setSaved={setSaved}
        actualAverages={actualAverages}
        isMobile={isMobile}
      />
      
      {/* Export Section */}
      <ExportSection
        generatedPlan={generatedPlan}
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
        actualAverages={actualAverages}
        hasScaling={hasScaling}
        isMobile={isMobile}
      />
      
      {/* Share Section */}
      <ShareSection
        selectedClient={selectedClient}
        emailAddress={emailAddress}
        setEmailAddress={setEmailAddress}
        shareMessage={shareMessage}
        setShareMessage={setShareMessage}
        actualAverages={actualAverages}
        isMobile={isMobile}
      />
      
      {/* Actual Values Summary */}
      {actualAverages && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <h4 style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Info size={18} />
            Werkelijke Plan Waardes (met scaling)
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
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. Calorieën
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#fff',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                {actualAverages.calories}
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>kcal/dag</span>
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. Eiwit
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                {actualAverages.protein}
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>g/dag</span>
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. Koolh.
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                {actualAverages.carbs}
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>g/dag</span>
              </div>
            </div>
            
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. Vet
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700',
                color: '#10b981',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.25rem'
              }}>
                {actualAverages.fat}
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>g/dag</span>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <span>
              <strong style={{ color: '#10b981' }}>Totaal:</strong> 7 dagen • {actualAverages.totalMeals} maaltijden
            </span>
            {hasScaling && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(245, 158, 11, 0.2)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#f59e0b'
              }}>
                SCALED
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Comparison with Original Targets - FIX: Use dailyTargets prop */}
      {dailyTargets && actualAverages && (
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <strong>Target vs Werkelijk:</strong>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <div>
                Target: {dailyTargets.calories} kcal/dag
              </div>
              <div style={{ 
                color: Math.abs(actualAverages.calories - dailyTargets.calories) < 50 
                  ? '#10b981' 
                  : '#f59e0b'
              }}>
                Werkelijk: {actualAverages.calories} kcal/dag
              </div>
              <div>
                Target: {dailyTargets.protein}g eiwit/dag
              </div>
              <div style={{ 
                color: Math.abs(actualAverages.protein - dailyTargets.protein) < 10 
                  ? '#10b981' 
                  : '#f59e0b'
              }}>
                Werkelijk: {actualAverages.protein}g eiwit/dag
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug info - only in development */}
      {process.env.NODE_ENV === 'development' && dailyTargets && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'rgba(139, 92, 246, 0.7)',
          fontFamily: 'monospace'
        }}>
          <div>Daily Targets from Tab 1:</div>
          <div>Calories: {dailyTargets.calories} | Protein: {dailyTargets.protein} | Carbs: {dailyTargets.carbs} | Fat: {dailyTargets.fat}</div>
          <div>Meals per day: {mealsPerDay}</div>
        </div>
      )}
    </div>
  )
}
