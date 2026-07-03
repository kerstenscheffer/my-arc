// src/modules/shopping/tabs/components/CompactShoppingCategory.jsx - V5 FULL WIDTH
import React from 'react'
import { CheckCircle2, Circle, Edit3, Check } from 'lucide-react'
import ShoppingItem from './ShoppingItem'
import EditableShoppingItem from './EditableShoppingItem'
import { CATEGORY_CONFIG } from '../../constants/shoppingConstants'

// Foto-headers + emoji's verwijderd op verzoek — pagina moet minder ruis
// hebben en een duidelijke lijst-uitstraling.

export default function CompactShoppingCategory({ 
  category, 
  items, 
  checkedItems, 
  editedAmounts,
  deletedItems,
  editMode,
  onCheckItem, 
  onCheckAll,
  onAmountChange,
  onDeleteItem,
  onToggleEditMode,
  service,
  isMobile,
  delay = 0
}) {
  if (!items || items.length === 0) return null
  
  const visibleItems = items.filter(item => !deletedItems?.includes(item.id))
  if (visibleItems.length === 0) return null
  
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  const allChecked = visibleItems.every(item => checkedItems[item?.id])
  const someChecked = visibleItems.some(item => checkedItems[item?.id]) && !allChecked
  const checkedCount = visibleItems.filter(item => checkedItems[item?.id]).length
  
  const totalCost = visibleItems.reduce((sum, item) => {
    const amount = editedAmounts[item.id] !== undefined 
      ? editedAmounts[item.id] 
      : (item.displayAmount || item.totalAmount)
    const originalAmount = item.displayAmount || item.totalAmount
    const costPerUnit = (item.estimatedCost || 0) / originalAmount
    return sum + (amount * costPerUnit)
  }, 0)

  return (
    <div style={{
      marginTop: isMobile ? '1.25rem' : '1.5rem',
      background: '#0a0a0a',
      border: 'none',
      overflow: 'hidden',
      transform: 'translateZ(0)',
    }}>
      {/* Schoon list-header — geen foto, geen emoji */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 10,
        padding: isMobile ? '0.7rem 1rem 0.6rem' : '0.85rem 1.5rem 0.7rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 4, height: 22, borderRadius: 2,
          background: config.color, flexShrink: 0,
        }} />
        <span style={{
          color: '#fff',
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: 900,
          flex: 1, minWidth: 0,
          letterSpacing: '-0.015em',
        }}>
          {config.label}
        </span>
        <span style={{
          fontSize: isMobile ? '0.72rem' : '0.78rem',
          color: 'rgba(255,255,255,0.65)',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {checkedCount}/{visibleItems.length}
        </span>
        <span style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: config.color,
          fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.015em',
        }}>
          €{totalCost.toFixed(0)}
        </span>
        <button onClick={() => onToggleEditMode(category)} style={{
          width: 32, height: 32, borderRadius: 8, padding: 0,
          background: editMode ? `${config.color}22` : 'transparent',
          border: `1px solid ${editMode ? `${config.color}55` : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', flexShrink: 0,
          color: editMode ? config.color : 'rgba(255,255,255,0.7)',
        }}>
          {editMode ? <Check size={14} strokeWidth={2.6} /> : <Edit3 size={14} strokeWidth={2.2} />}
        </button>
        <button onClick={onCheckAll} style={{
          width: 32, height: 32, borderRadius: 8, padding: 0,
          background: allChecked ? `${config.color}22` : 'transparent',
          border: `1px solid ${allChecked ? `${config.color}55` : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', flexShrink: 0,
        }}>
          {allChecked
            ? <CheckCircle2 size={14} color={config.color} strokeWidth={2.6} />
            : someChecked
              ? <Circle size={14} color={config.color} strokeWidth={2.6} fill={config.color} fillOpacity={0.35} />
              : <Circle size={14} color="rgba(255,255,255,0.45)" strokeWidth={2.2} />}
        </button>
      </div>

      {/* ITEMS */}
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: isMobile ? '0 0.75rem' : '0 1rem',
            borderBottom: index < visibleItems.length - 1 
              ? '1px solid rgba(255, 255, 255, 0.03)' 
              : 'none'
          }}
        >
          {editMode ? (
            <EditableShoppingItem
              item={item}
              checked={checkedItems[item.id]}
              editedAmount={editedAmounts[item.id]}
              onCheck={() => onCheckItem(item.id)}
              onAmountChange={onAmountChange}
              onDelete={onDeleteItem}
              color={config.color}
              gradient={config.gradient}
              isMobile={isMobile}
            />
          ) : (
            <ShoppingItem
              item={{
                ...item,
                displayAmount: editedAmounts[item.id] !== undefined 
                  ? editedAmounts[item.id] 
                  : item.displayAmount,
                estimatedCost: editedAmounts[item.id] !== undefined
                  ? (editedAmounts[item.id] / (item.displayAmount || item.totalAmount)) * (item.estimatedCost || 0)
                  : item.estimatedCost
              }}
              checked={checkedItems[item.id]}
              onCheck={() => onCheckItem(item.id)}
              color={config.color}
              isMobile={isMobile}
            />
          )}
        </div>
      ))}
    </div>
  )
}
