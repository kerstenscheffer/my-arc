// src/modules/shopping/tabs/components/FloatingActionButtons.jsx - V3 CLEAN
import React from 'react'
import { Share2, Plus } from 'lucide-react'
import { 
  CATEGORY_CONFIG, 
  categorizeIngredient, 
  formatAmount,
  getIngredientDisplayName 
} from '../../constants/shoppingConstants'

export default function FloatingActionButtons({ 
  shoppingData, 
  weekMultiplier = 1,
  onAddItem, 
  isMobile 
}) {
  const handleExport = async () => {
    if (!shoppingData?.items?.length) {
      alert('Geen items om te exporteren')
      return
    }

    const multipliedItems = shoppingData.items.map(item => {
      const displayName = getIngredientDisplayName(item)
      const properCategory = categorizeIngredient(displayName)
      return {
        ...item,
        name: displayName,
        category: properCategory,
        displayAmount: (item.displayAmount || item.totalAmount) * weekMultiplier,
        estimatedCost: (item.estimatedCost || 0) * weekMultiplier
      }
    })

    const groupedByCategory = {}
    multipliedItems.forEach(item => {
      const category = item.category || 'other'
      if (!groupedByCategory[category]) groupedByCategory[category] = []
      groupedByCategory[category].push(item)
    })

    const categoryOrder = ['protein', 'carbs', 'vegetables', 'fruit', 'dairy', 'fats', 'sauces', 'other']
    const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    })

    let exportText = `BOODSCHAPPENLIJST - ${weekMultiplier} ${weekMultiplier === 1 ? 'Week' : 'Weken'}\n`
    exportText += `${new Date().toLocaleDateString('nl-NL')}\n\n`

    sortedCategories.forEach(category => {
      const items = groupedByCategory[category]
      const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
      exportText += `${config.emoji} ${config.label.toUpperCase()}\n`
      items.forEach(item => {
        const formattedAmount = formatAmount(item.displayAmount, item.unit)
        exportText += `- ${item.name} ${formattedAmount}\n`
      })
      exportText += `\n`
    })

    const totalCost = multipliedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
    exportText += `Totaal: €${totalCost.toFixed(2)} · ${multipliedItems.length} items\n`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boodschappenlijst - ${weekMultiplier}w`,
          text: exportText
        })
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard(exportText)
      }
    } else {
      copyToClipboard(exportText)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Gekopieerd!')
    }).catch(() => {
      alert('Kon niet kopiëren')
    })
  }

  const btnBase = {
    width: isMobile ? '44px' : '48px',
    height: isMobile ? '44px' : '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative'
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '80px' : '2rem',
      right: isMobile ? '0.75rem' : '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 100
    }}>
      {/* Export */}
      <button
        onClick={handleExport}
        style={{
          ...btnBase,
          background: '#111',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }}
      >
        <Share2 size={16} color="#3b82f6" strokeWidth={2} />
        {weekMultiplier > 1 && (
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#3b82f6',
            border: '2px solid #000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.5rem',
            fontWeight: '800',
            color: '#fff'
          }}>
            {weekMultiplier}
          </div>
        )}
      </button>

      {/* Add Item */}
      <button
        onClick={onAddItem}
        style={{
          ...btnBase,
          background: '#111',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}
      >
        <Plus size={16} color="#10b981" strokeWidth={2} />
      </button>
    </div>
  )
}
