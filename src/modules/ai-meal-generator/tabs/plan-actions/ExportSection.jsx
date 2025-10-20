// src/modules/ai-meal-generator/tabs/plan-actions/ExportSection.jsx
// Handles all export functionality (PDF, text, shopping list)

import { Copy, FileText, ShoppingCart, Printer } from 'lucide-react'
import { generateTextVersion, generateShoppingListText } from './utils/textGenerator'

export default function ExportSection({
  generatedPlan,
  exportOptions,
  setExportOptions,
  isMobile
}) {
  // Copy plan to clipboard
  const handleCopyToClipboard = () => {
    const text = generateTextVersion(generatedPlan, exportOptions)
    navigator.clipboard.writeText(text).then(() => {
      // Could show success toast
      console.log('✅ Plan copied to clipboard')
    })
  }
  
  // Generate shopping list
  const handleShoppingList = () => {
    if (!generatedPlan?.stats?.shoppingList) {
      alert('Genereer eerst een shopping list in tab 3')
      return
    }
    
    const shoppingText = generateShoppingListText(generatedPlan.stats.shoppingList)
    navigator.clipboard.writeText(shoppingText).then(() => {
      console.log('✅ Shopping list copied to clipboard')
    })
  }
  
  // PDF generation (placeholder - needs library)
  const handlePDFExport = () => {
    console.log('PDF export not yet implemented')
    alert('PDF export komt binnenkort!')
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
            body { font-family: Arial, sans-serif; padding: 20px; }
            pre { white-space: pre-wrap; }
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
          Boodschappenlijst
        </button>
        
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <FileText size={18} />
          Download PDF
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
            transition: 'all 0.3s ease'
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
    </div>
  )
}
