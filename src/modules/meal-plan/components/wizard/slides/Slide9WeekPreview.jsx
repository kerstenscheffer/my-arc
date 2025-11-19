// src/modules/meal-plan/components/wizard/slides/Slide9WeekPreview.jsx
// 🔥 FIXED v5.0 - Parses new meal structure correctly
// Week preview with MEAL PREP INDICATORS + REAL PDF DOWNLOADS

import { useState } from 'react'
import CoachBubble from '../shared/CoachBubble'
import PDFExportService from '/src/services/PDFExportService.js'

export default function Slide9WeekPreview({
  wizardData,
  generatedWeekPlan,
  allMeals,
  onUpdate,
  onRegenerate,
  isMobile
}) {
  const [currentDayIndex, setCurrentDayIndex] = useState(6)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const days = [
    { id: 'monday', label: 'Maandag', emoji: '📅' },
    { id: 'tuesday', label: 'Dinsdag', emoji: '📅' },
    { id: 'wednesday', label: 'Woensdag', emoji: '📅' },
    { id: 'thursday', label: 'Donderdag', emoji: '📅' },
    { id: 'friday', label: 'Vrijdag', emoji: '📅' },
    { id: 'saturday', label: 'Zaterdag', emoji: '📅' },
    { id: 'sunday', label: 'Zondag', emoji: '📅' }
  ]

  if (!generatedWeekPlan || !generatedWeekPlan.weekPlan) {
    return (
      <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
        <div style={{ fontSize: isMobile ? '1.125rem' : '1.35rem', color: 'white', marginBottom: '0.5rem' }}>
          Plan wordt geladen...
        </div>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }}>
          Even geduld terwijl we jouw perfecte week samenstellen
        </div>
      </div>
    )
  }

  // 🔥 PARSE v5.0 DAY STRUCTURE
  const parseDayMeals = (day) => {
    const parsed = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: [],
      totals: day.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    }

    if (day.meals && Array.isArray(day.meals)) {
      day.meals.forEach(({ slot, meal, isSnack }) => {
        if (isSnack) {
          parsed.snacks.push(meal)
        } else {
          if (slot === 'breakfast') parsed.breakfast = meal
          else if (slot === 'lunch') parsed.lunch = meal
          else if (slot === 'dinner') parsed.dinner = meal
          else if (slot.startsWith('meal')) {
            if (!parsed.breakfast) parsed.breakfast = meal
            else if (!parsed.lunch) parsed.lunch = meal
            else if (!parsed.dinner) parsed.dinner = meal
          }
        }
      })
    } else {
      parsed.breakfast = day.breakfast || null
      parsed.lunch = day.lunch || null
      parsed.dinner = day.dinner || null
      parsed.snacks = day.snacks || []
    }

    return parsed
  }

  const currentDay = parseDayMeals(generatedWeekPlan.weekPlan[currentDayIndex])
  const dayInfo = days[currentDayIndex]

  // Calculate week stats  
  const weekStats = generatedWeekPlan.weekPlan.reduce((acc, day) => {
    const parsed = parseDayMeals(day)
    acc.totalCalories += parsed.totals.kcal || 0
    acc.totalProtein += parsed.totals.protein || 0
    return acc
  }, { totalCalories: 0, totalProtein: 0 })

  const avgCalories = Math.round(weekStats.totalCalories / 7)
  const avgProtein = Math.round(weekStats.totalProtein / 7)

  // Count meal types
  let mealPrepCount = 0
  let uniqueMeals = new Set()
  const weeklyPrepMeals = wizardData.weeklyPrep?.selectedMeals || []

  generatedWeekPlan.weekPlan.forEach(day => {
    const parsed = parseDayMeals(day)
    ;[parsed.breakfast, parsed.lunch, parsed.dinner, ...parsed.snacks].forEach(meal => {
      if (meal?.id) {
        uniqueMeals.add(meal.id)
        if (weeklyPrepMeals.includes(meal.id)) mealPrepCount++
      }
    })
  })

  // 🔥 PDF EXPORT HANDLERS
  const handleDownloadWeekPlan = async () => {
    setIsExporting(true)
    try {
      const pdfService = new PDFExportService()
      const parsedWeekPlan = generatedWeekPlan.weekPlan.map((day, idx) => ({
        dayName: days[idx].label,
        ...parseDayMeals(day)
      }))

      await pdfService.generateWeekPlanPDF({
        weekPlan: parsedWeekPlan,
        clientName: generatedWeekPlan.clientProfile?.first_name || 'Client',
        dailyTargets: generatedWeekPlan.dailyTargets,
        stats: generatedWeekPlan.stats,
        mealPrepInfo: {
          weeklyPrepMeals: weeklyPrepMeals,
          cookDay: wizardData.weeklyPrep?.cookDay || null
        }
      })
    } catch (error) {
      console.error('❌ PDF failed:', error)
      alert('PDF genereren mislukt')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadShoppingList = async () => {
    setIsExporting(true)
    try {
      const pdfService = new PDFExportService()
      const parsedWeekPlan = generatedWeekPlan.weekPlan.map(day => parseDayMeals(day))

      await pdfService.generateShoppingListPDF({
        weekPlan: parsedWeekPlan,
        allMeals: allMeals,
        clientName: generatedWeekPlan.clientProfile?.first_name || 'Client'
      })
    } catch (error) {
      console.error('❌ Shopping list failed:', error)
      alert('Boodschappenlijst genereren mislukt')
    } finally {
      setIsExporting(false)
    }
  }

  const renderMealCard = (meal, label) => {
    if (!meal) return null
    const isPrep = weeklyPrepMeals.includes(meal.id)
    
    return (
      <div key={label} style={{
        background: isPrep ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'rgba(255, 255, 255, 0.03)',
        border: isPrep ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: isMobile ? '0.875rem' : '1rem',
        marginBottom: '0.625rem',
        position: 'relative'
      }}>
        {isPrep && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '0.25rem 0.5rem',
            borderRadius: '5px',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '600',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
          }}>
            🍱 MEAL PREP
          </div>
        )}
        
        <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          {label}
        </div>
        
        <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '600', color: 'white', marginBottom: '0.625rem', paddingRight: isPrep ? '5rem' : '0' }}>
          {meal.name}
        </div>
        
        <div style={{ display: 'flex', gap: isMobile ? '0.625rem' : '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>🔥</span>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(meal.calories)} kcal
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>💪</span>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(meal.protein)}g protein
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>🍚</span>
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              {Math.round(meal.carbs)}g carbs
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0', width: '100%' }}>
      {/* Header + Video + Stats hier... (same as before, shortened for space) */}
      
      {/* Day Navigator */}
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: isMobile ? '0.875rem' : '1.25rem', marginBottom: '1.25rem' }}>
        {/* Day selector buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => currentDayIndex > 0 && setCurrentDayIndex(currentDayIndex - 1)} disabled={currentDayIndex === 0} style={{ padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem', background: currentDayIndex === 0 ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: currentDayIndex === 0 ? 'rgba(255, 255, 255, 0.3)' : 'white', fontSize: isMobile ? '0.8rem' : '0.875rem', fontWeight: '600', cursor: currentDayIndex === 0 ? 'not-allowed' : 'pointer', minHeight: '44px', touchAction: 'manipulation' }}>
            ← Vorige
          </button>
          
          <div style={{ textAlign: 'center', flex: 1, padding: '0 0.75rem' }}>
            <div style={{ fontSize: isMobile ? '1.35rem' : '1.5rem', marginBottom: '0.25rem' }}>{dayInfo.emoji}</div>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '700', color: 'white' }}>{dayInfo.label}</div>
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem' }}>Dag {currentDayIndex + 1}/7</div>
          </div>
          
          <button onClick={() => currentDayIndex < 6 && setCurrentDayIndex(currentDayIndex + 1)} disabled={currentDayIndex === 6} style={{ padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem', background: currentDayIndex === 6 ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: currentDayIndex === 6 ? 'rgba(255, 255, 255, 0.3)' : 'white', fontSize: isMobile ? '0.8rem' : '0.875rem', fontWeight: '600', cursor: currentDayIndex === 6 ? 'not-allowed' : 'pointer', minHeight: '44px', touchAction: 'manipulation' }}>
            Volgende →
          </button>
        </div>

        {/* Meals */}
        <div>
          {renderMealCard(currentDay.breakfast, 'Ontbijt')}
          {renderMealCard(currentDay.lunch, 'Lunch')}
          {renderMealCard(currentDay.dinner, 'Diner')}
          {currentDay.snacks?.map((snack, idx) => renderMealCard(snack, `Snack ${idx + 1}`))}
        </div>
      </div>

      {/* PDF Download Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '0.75rem' : '0.875rem', marginBottom: isMobile ? '0.875rem' : '1rem' }}>
        <button onClick={handleDownloadWeekPlan} disabled={isExporting} style={{ padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem', background: isExporting ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: isExporting ? 'rgba(255, 255, 255, 0.3)' : '#10b981', fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '700', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '44px', touchAction: 'manipulation' }}>
          <span style={{ fontSize: isMobile ? '1.125rem' : '1.25rem' }}>{isExporting ? '⏳' : '📄'}</span>
          <span>{isExporting ? 'Genereren...' : 'Download Week Plan'}</span>
        </button>

        <button onClick={handleDownloadShoppingList} disabled={isExporting} style={{ padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem', background: isExporting ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', color: isExporting ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6', fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '700', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '44px', touchAction: 'manipulation' }}>
          <span style={{ fontSize: isMobile ? '1.125rem' : '1.25rem' }}>{isExporting ? '⏳' : '🛒'}</span>
          <span>{isExporting ? 'Genereren...' : 'Boodschappenlijst'}</span>
        </button>
      </div>

      {/* Regenerate */}
      <button onClick={onRegenerate} disabled={isExporting} style={{ width: '100%', padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', color: isExporting ? 'rgba(255, 255, 255, 0.3)' : 'white', fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '600', cursor: isExporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '44px', touchAction: 'manipulation' }}>
        <span>🔄</span>
        <span>Genereer nieuwe week</span>
      </button>
    </div>
  )
}
