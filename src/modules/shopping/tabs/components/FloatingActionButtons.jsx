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
      exportText += `${config.label.toUpperCase()}\n`
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

  return (
    <div style={{
      position: 'fixed',
      bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? 92 : 32}px)`,
      left: isMobile ? 18 : 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 100,
    }}>
      {/* Add Item — primaire actie, gouden gradient pill */}
      <button
        onClick={onAddItem}
        aria-label="Eigen ingredient toevoegen"
        style={{
          width: isMobile ? 64 : 72,
          height: isMobile ? 64 : 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
          border: 'none',
          color: '#0a0a0a',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 0,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 14px 36px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Plus size={isMobile ? 26 : 30} strokeWidth={3} />
        <span style={{
          fontSize: '0.52rem', fontWeight: 900,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginTop: -2, lineHeight: 1,
        }}>
          Eigen
        </span>
      </button>

      {/* Export / Delen — secundair, donker glass */}
      <button
        onClick={handleExport}
        aria-label="Boodschappenlijst delen"
        style={{
          width: isMobile ? 54 : 60,
          height: isMobile ? 54 : 60,
          borderRadius: '50%',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(255,215,0,0.55)',
          color: '#FFD700',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 6px 18px rgba(255,215,0,0.18), 0 4px 12px rgba(0,0,0,0.45)',
        }}
      >
        <Share2 size={isMobile ? 20 : 22} strokeWidth={2.4} />
        {weekMultiplier > 1 && (
          <div style={{
            position: 'absolute',
            top: -4, right: -4,
            minWidth: 22, height: 22,
            padding: '0 6px',
            borderRadius: 11,
            background: '#FFD700',
            border: '2px solid #0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 900,
            color: '#0a0a0a',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {weekMultiplier}w
          </div>
        )}
      </button>
    </div>
  )
}
