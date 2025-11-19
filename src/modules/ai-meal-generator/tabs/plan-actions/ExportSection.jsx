// src/modules/ai-meal-generator/tabs/plan-actions/ExportSection.jsx
// UPGRADED VERSION - Working PDF exports with jsPDF + HTML Shopping List

import { Copy, FileText, ShoppingCart, Printer, Download } from 'lucide-react'
import { generateTextVersion, generateShoppingListText } from './utils/textGenerator'
import { openShoppingListForPrint } from '../../ShoppingListHTMLGenerator'

// Import jsPDF - Will be added via CDN or npm
// For now, we'll use a dynamic import approach

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
      // Show temporary success message
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
    // ✅ FORMATTER SUPPORT: Check for formatted first, fallback to raw
    const shoppingList = generatedPlan?.stats?.shoppingList?.formatted || generatedPlan?.stats?.shoppingList
    
    if (!shoppingList) {
      alert('Shopping list niet beschikbaar. Genereer eerst een plan.')
      return
    }
    
    const shoppingText = generateShoppingListText(shoppingList)
    navigator.clipboard.writeText(shoppingText).then(() => {
      console.log('✅ Shopping list copied to clipboard')
    })
  }
  
  // PDF Export - Week Plan
  const handlePDFExport = async () => {
    try {
      // Load jsPDF dynamically
      const jsPDF = await loadJsPDF()
      if (!jsPDF) {
        alert('PDF library kon niet worden geladen. Probeer opnieuw.')
        return
      }
      
      // Generate PDF
      const pdf = new jsPDF.default('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let currentY = 20
      
      // ===== HEADER =====
      pdf.setFillColor(16, 185, 129) // MY ARC green
      pdf.rect(0, 0, pageWidth, 15, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('MY ARC - Week Meal Plan', pageWidth / 2, 10, { align: 'center' })
      
      currentY = 25
      
      // ===== CLIENT INFO =====
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Client: ${generatedPlan.clientProfile?.first_name || 'Unknown'} ${generatedPlan.clientProfile?.last_name || ''}`, 15, currentY)
      
      currentY += 7
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`, 15, currentY)
      
      currentY += 10
      
      // ===== MACRO TARGETS =====
      pdf.setFillColor(240, 240, 240)
      pdf.rect(15, currentY, pageWidth - 30, 20, 'F')
      
      currentY += 6
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Dagelijkse Targets:', 20, currentY)
      
      currentY += 6
      pdf.setFont('helvetica', 'normal')
      const targets = [
        `Calorieën: ${actualAverages?.calories || generatedPlan.dailyTargets?.kcal || 'N/A'} kcal`,
        `Eiwit: ${actualAverages?.protein || generatedPlan.dailyTargets?.protein || 'N/A'}g`,
        `Koolhydraten: ${actualAverages?.carbs || generatedPlan.dailyTargets?.carbs || 'N/A'}g`,
        `Vetten: ${actualAverages?.fat || generatedPlan.dailyTargets?.fat || 'N/A'}g`
      ]
      pdf.text(targets.join(' • '), 20, currentY)
      
      currentY += 15
      
      // ===== SCALING NOTICE =====
      if (hasScaling) {
        pdf.setFillColor(245, 158, 11, 30) // Orange tint
        pdf.rect(15, currentY, pageWidth - 30, 12, 'F')
        pdf.setFontSize(9)
        pdf.setTextColor(245, 158, 11)
        pdf.text('⚠ Dit plan bevat geschaalde porties om macro targets te halen', 20, currentY + 6)
        pdf.setTextColor(0, 0, 0)
        currentY += 18
      }
      
      // ===== WEEK PLAN =====
      const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
      
      generatedPlan.weekPlan.forEach((day, dayIndex) => {
        // Check if we need a new page
        if (currentY > pageHeight - 50) {
          pdf.addPage()
          currentY = 20
        }
        
        // Day header
        pdf.setFillColor(16, 185, 129)
        pdf.rect(15, currentY, pageWidth - 30, 8, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text(days[dayIndex], 20, currentY + 5.5)
        
        // Day totals
        const totalsText = `${day.totals?.kcal || 0} kcal • ${day.totals?.protein || 0}g P • ${day.totals?.carbs || 0}g C • ${day.totals?.fat || 0}g F`
        pdf.setFontSize(9)
        pdf.text(totalsText, pageWidth - 20, currentY + 5.5, { align: 'right' })
        
        currentY += 12
        pdf.setTextColor(0, 0, 0)
        
        // Meals for the day
        const slots = ['breakfast', 'lunch', 'dinner']
        const slotLabels = ['Ontbijt', 'Lunch', 'Diner']
        
        slots.forEach((slot, slotIndex) => {
          const meal = day[slot]
          if (!meal) return
          
          // Check page break
          if (currentY > pageHeight - 30) {
            pdf.addPage()
            currentY = 20
          }
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${slotLabels[slotIndex]}:`, 20, currentY)
          
          pdf.setFont('helvetica', 'normal')
          const mealName = meal.name || 'Unknown Meal'
          const scaledIndicator = meal.scale_factor && meal.scale_factor !== 1.0 ? ` (${Math.round(meal.scale_factor * 100)}%)` : ''
          pdf.text(mealName + scaledIndicator, 45, currentY)
          
          currentY += 5
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`${meal.calories || 0} kcal • ${meal.protein || 0}g P • ${meal.carbs || 0}g C • ${meal.fat || 0}g F`, 45, currentY)
          pdf.setTextColor(0, 0, 0)
          
          currentY += 6
        })
        
        // Snacks
        if (day.snacks && day.snacks.length > 0) {
          if (currentY > pageHeight - 30) {
            pdf.addPage()
            currentY = 20
          }
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.text('Snacks:', 20, currentY)
          currentY += 5
          
          day.snacks.forEach(snack => {
            if (!snack) return
            
            pdf.setFont('helvetica', 'normal')
            pdf.text(`• ${snack.name || 'Unknown'}`, 25, currentY)
            currentY += 5
            pdf.setFontSize(8)
            pdf.setTextColor(100, 100, 100)
            pdf.text(`${snack.calories || 0} kcal • ${snack.protein || 0}g P`, 27, currentY)
            pdf.setTextColor(0, 0, 0)
            currentY += 5
          })
        }
        
        currentY += 8 // Space before next day
      })
      
      // ===== FOOTER =====
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Pagina ${i} van ${totalPages} • MY ARC Meal Plan Generator`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      }
      
      // Save PDF
      const clientName = generatedPlan.clientProfile?.first_name || 'Client'
      const filename = `MY_ARC_MealPlan_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(filename)
      
      console.log('✅ Week plan PDF generated:', filename)
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error)
      alert('PDF generatie mislukt: ' + error.message)
    }
  }
  
  // PDF Export - Shopping List (HTML VERSION)
  const handleShoppingListPDF = () => {
    // Get shopping data
    const shoppingData = generatedPlan?.stats?.shoppingList
    const shoppingList = shoppingData?.formatted || shoppingData
    
    if (!shoppingList || !shoppingList.ingredients || shoppingList.ingredients.length === 0) {
      alert('Geen shopping list beschikbaar. Genereer eerst een plan.')
      return
    }
    
    // Generate week range
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const weekRange = `${today.toLocaleDateString('nl-NL')} - ${nextWeek.toLocaleDateString('nl-NL')}`
    
    // Get client name
    const clientName = generatedPlan.clientProfile?.first_name || 'Client'
    
    // Open HTML for print
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
  
  // Helper: Load jsPDF dynamically
  const loadJsPDF = async () => {
    try {
      // Check if already loaded
      if (window.jspdf) {
        return window.jspdf
      }
      
      // Load from CDN
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.onload = () => {
          console.log('✅ jsPDF loaded')
          resolve(window.jspdf)
        }
        script.onerror = () => {
          console.error('❌ Failed to load jsPDF')
          reject(new Error('Failed to load PDF library'))
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error('Error loading jsPDF:', error)
      return null
    }
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
        
        {/* MAIN PDF BUTTON - Week Plan */}
        <button
          onClick={handlePDFExport}
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
          Download Week Plan PDF
        </button>
        
        {/* NEW BUTTON - Shopping List PDF (PREMIUM) */}
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
        
        {/* Keep Print button */}
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
            gridColumn: isMobile ? '1' : 'span 2' // Full width on last row
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
          Print Preview
        </button>
      </div>
      
      {/* Info text */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.5'
      }}>
        💡 <strong>Tip:</strong> Shopping lijst opent in een nieuw venster. Gebruik browser print functie (Ctrl+P) 
        om als PDF op te slaan. Bevat MY ARC styling, bespaartips en praktische hoeveelheden!
      </div>
    </div>
  )
}
