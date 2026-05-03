// src/modules/ai-meal-generator/tabs/plan-actions/ExportSection.jsx
// COMPLETE VERSION - Met timing EN training_day indicator

import { Copy, FileText, ShoppingCart, Printer, Download } from 'lucide-react'
import { generateTextVersion, generateShoppingListText } from './utils/textGenerator'
import { openShoppingListForPrint } from '../../ShoppingListHTMLGenerator'
import { openMealPlanForPrint } from '../../mealplanhtmlgenerator'

export default function ExportSection({
  generatedPlan,
  exportOptions,
  setExportOptions,
  actualAverages,
  hasScaling,
  isMobile
}) {
  // Copy plan to clipboard
  const handleCopyToClipboard = () => {
    const text = generateTextVersion(generatedPlan, exportOptions)
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ Plan copied to clipboard')
      const button = event.currentTarget
      const originalText = button.innerHTML
      button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Gekopieerd!'
      setTimeout(() => {
        button.innerHTML = originalText
      }, 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
      alert('Kopiëren mislukt. Probeer opnieuw.')
    })
  }
  
  // Generate shopping list text
  const handleShoppingList = () => {
    const shoppingList = generatedPlan?.stats?.shoppingList?.formatted || generatedPlan?.stats?.shoppingList
    
    if (!shoppingList) {
      alert('Shopping list niet beschikbaar. Genereer eerst een plan.')
      return
    }
    
    const shoppingText = generateShoppingListText(shoppingList)
    navigator.clipboard.writeText(shoppingText).then(() => {
      console.log('✅ Shopping list copied to clipboard')
      const button = event.currentTarget
      const originalText = button.innerHTML
      button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Gekopieerd!'
      setTimeout(() => {
        button.innerHTML = originalText
      }, 2000)
    })
  }
  
  // NEW: Premium Meal Plan PDF with ingredients + training day indicator
  const handleMealPlanPDF = async () => {
    try {
      console.log('📄 Generating Meal Plan PDF...')
      
      // Prepare the meal plan data
      const mealPlanData = {
        id: generatedPlan.id || 'temp-plan',
        week_structure: {},
        daily_calories: generatedPlan.dailyTargets?.kcal,
        daily_protein: generatedPlan.dailyTargets?.protein,
        daily_carbs: generatedPlan.dailyTargets?.carbs,
        daily_fat: generatedPlan.dailyTargets?.fat
      }
      
      // Convert weekPlan to week_structure format
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      
      generatedPlan.weekPlan.forEach((day, index) => {
        // ✅ CRITICAL: Preserve is_training_day from day object
        const isTrainingDay = day.is_training_day !== undefined 
          ? day.is_training_day 
          : (index < 5) // Fallback: Ma-Vr = training
        
        console.log(`📅 Building ${dayNames[index]}: is_training_day = ${isTrainingDay}`)
        
        mealPlanData.week_structure[dayNames[index]] = {
          is_training_day: isTrainingDay,  // ✅ ADD THIS!
          breakfast: day.breakfast ? {
            meal_id: day.breakfast.id,
            meal_name: day.breakfast.name,
            calories: day.breakfast.calories,
            protein: day.breakfast.protein,
            carbs: day.breakfast.carbs,
            fat: day.breakfast.fat,
            scale_factor: day.breakfast.scaleFactor || day.breakfast.scale_factor || 1,
            timing: day.breakfast.timing,
            function: day.breakfast.function,
            icon: day.breakfast.icon
          } : null,
          lunch: day.lunch ? {
            meal_id: day.lunch.id,
            meal_name: day.lunch.name,
            calories: day.lunch.calories,
            protein: day.lunch.protein,
            carbs: day.lunch.carbs,
            fat: day.lunch.fat,
            scale_factor: day.lunch.scaleFactor || day.lunch.scale_factor || 1,
            timing: day.lunch.timing,
            function: day.lunch.function,
            icon: day.lunch.icon
          } : null,
          dinner: day.dinner ? {
            meal_id: day.dinner.id,
            meal_name: day.dinner.name,
            calories: day.dinner.calories,
            protein: day.dinner.protein,
            carbs: day.dinner.carbs,
            fat: day.dinner.fat,
            scale_factor: day.dinner.scaleFactor || day.dinner.scale_factor || 1,
            timing: day.dinner.timing,
            function: day.dinner.function,
            icon: day.dinner.icon
          } : null,
          snacks: (day.snacks || []).map(snack => snack ? {
            meal_id: snack.id,
            meal_name: snack.name,
            calories: snack.calories,
            protein: snack.protein,
            carbs: snack.carbs,
            fat: snack.fat,
            scale_factor: snack.scaleFactor || snack.scale_factor || 1,
            timing: snack.timing,
            function: snack.function,
            icon: snack.icon
          } : null).filter(Boolean),
          totals: day.totals || {}
        }
      })
      
      console.log('✅ Week structure built')
      console.log('🔍 Monday is_training_day:', mealPlanData.week_structure.monday.is_training_day)
      console.log('🔍 Tuesday is_training_day:', mealPlanData.week_structure.tuesday.is_training_day)
      
      // Generate week range
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekRange = `${today.toLocaleDateString('nl-NL')} - ${nextWeek.toLocaleDateString('nl-NL')}`
      
      // Get client name
      const clientName = generatedPlan.clientProfile?.first_name || 'Client'
      
      // Open premium PDF
      await openMealPlanForPrint(mealPlanData, clientName, weekRange)
      
      console.log('✅ PDF generation complete')
      
    } catch (error) {
      console.error('❌ Meal plan PDF generation failed:', error)
      alert('PDF generatie mislukt. Probeer opnieuw.')
    }
  }
  
  // Shopping List PDF (existing HTML version)
  const handleShoppingListPDF = () => {
    const shoppingData = generatedPlan?.stats?.shoppingList
    const shoppingList = shoppingData?.formatted || shoppingData
    
    if (!shoppingList || !shoppingList.ingredients || shoppingList.ingredients.length === 0) {
      alert('Geen shopping list beschikbaar. Genereer eerst een plan.')
      return
    }
    
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const weekRange = `${today.toLocaleDateString('nl-NL')} - ${nextWeek.toLocaleDateString('nl-NL')}`
    const clientName = generatedPlan.clientProfile?.first_name || 'Client'
    
    openShoppingListForPrint(shoppingList, clientName, weekRange)
  }
  
  // Print preview
  const handlePrint = () => {
    const text = generateTextVersion(generatedPlan, exportOptions)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Meal Plan - ${generatedPlan.clientProfile?.first_name || 'Client'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            pre { 
              white-space: pre-wrap;
              font-family: monospace;
              line-height: 1.5;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '1rem' : '1.25rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: '600',
        color: '#3b82f6',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <FileText size={18} />
        Export Opties
      </h3>
      
      {/* Export Settings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {Object.entries({
          includeMacros: 'Inclusief macro\'s',
          includeShoppingList: 'Inclusief boodschappenlijst',
          includeRecipes: 'Inclusief recepten',
          includePrices: 'Inclusief prijzen'
        }).map(([key, label]) => (
          <label key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <input
              type="checkbox"
              checked={exportOptions[key]}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                [key]: e.target.checked
              })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            {label}
          </label>
        ))}
      </div>
      
      {/* Export Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        <button
          onClick={handleCopyToClipboard}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            color: '#8b5cf6',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Copy size={18} />
          Kopieer als Tekst
        </button>
        
        <button
          onClick={handleShoppingList}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            color: '#f59e0b',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <ShoppingCart size={18} />
          Kopieer Shopping List
        </button>
        
        <button
          onClick={handleMealPlanPDF}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '10px',
            color: '#ec4899',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Download size={18} />
          Download Meal Plan PDF
        </button>
        
        <button
          onClick={handleShoppingListPDF}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <ShoppingCart size={18} />
          Download Shopping PDF
        </button>
        
        <button
          onClick={handlePrint}
          style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            color: '#3b82f6',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            transition: 'all 0.3s ease',
            gridColumn: isMobile ? '1' : 'span 2'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Printer size={18} />
          Print Preview (Tekst)
        </button>
      </div>
      
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.5'
      }}>
        💡 <strong>Nieuw:</strong> Timing + training dag indicator worden correct doorgegeven naar PDF! 
        Ma-Vr = training, Za-Zo = rust.
      </div>
    </div>
  )
}
