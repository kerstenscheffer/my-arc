// src/modules/shopping/tabs/components/CompactShoppingCategory.jsx
//
// Eén categorie in de boodschappenlijst: een dikke witte kop met de teller en
// het bedrag, daaronder de regels met een hairline ertussen. Geen kader om de
// categorie en geen kleurstreep meer — dezelfde opzet als de maaltijden op de
// Meal-pagina, waar de foto op de regel het werk doet en niet een gekleurd vak.

import React from 'react'
import { CheckCircle2, Circle, Pencil, Check } from 'lucide-react'
import ShoppingItem from './ShoppingItem'
import EditableShoppingItem from './EditableShoppingItem'
import { CATEGORY_CONFIG } from '../../constants/shoppingConstants'

const LIJN = 'rgba(255,255,255,0.07)'

const rondKnop = (aan) => ({
  width: 34, height: 34, borderRadius: 10, padding: 0, flexShrink: 0,
  background: aan ? '#fff' : 'transparent',
  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.18)'}`,
  color: aan ? '#0a0a0a' : '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function CompactShoppingCategory({
  category, items, checkedItems, editedAmounts, deletedItems, editMode,
  onCheckItem, onCheckAll, onAmountChange, onDeleteItem, onToggleEditMode,
  isMobile,
}) {
  if (!items || items.length === 0) return null
  const visibleItems = items.filter(item => !deletedItems?.includes(item.id))
  if (visibleItems.length === 0) return null

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  const allChecked = visibleItems.every(item => checkedItems[item?.id])
  const someChecked = visibleItems.some(item => checkedItems[item?.id]) && !allChecked
  const checkedCount = visibleItems.filter(item => checkedItems[item?.id]).length

  const totalCost = visibleItems.reduce((sum, item) => {
    const original = item.displayAmount || item.totalAmount || 1
    const amount = editedAmounts[item.id] !== undefined ? editedAmounts[item.id] : original
    return sum + amount * ((item.estimatedCost || 0) / original)
  }, 0)

  const zij = isMobile ? '1rem' : '1.5rem'

  return (
    <div style={{ marginTop: isMobile ? '1.4rem' : '1.7rem' }}>
      {/* Kop */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: `0 ${zij} 0.55rem`,
        borderBottom: `1px solid ${LIJN}`,
      }}>
        <span style={{
          flex: 1, minWidth: 0, color: '#fff',
          fontSize: isMobile ? '1.02rem' : '1.12rem', fontWeight: 900,
          letterSpacing: '-0.02em',
        }}>
          {config.label}
        </span>
        <span style={{
          fontSize: isMobile ? '0.74rem' : '0.78rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums',
        }}>
          {checkedCount}/{visibleItems.length}
        </span>
        <span style={{
          fontSize: isMobile ? '0.9rem' : '0.96rem', fontWeight: 900, color: '#fff',
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em', marginRight: 4,
        }}>
          €{totalCost.toFixed(0)}
        </span>
        <button onClick={() => onToggleEditMode(category)} aria-label="Bewerken" style={rondKnop(editMode)}>
          {editMode ? <Check size={15} strokeWidth={3} /> : <Pencil size={14} strokeWidth={2.4} />}
        </button>
        <button onClick={onCheckAll} aria-label="Alles afvinken" style={rondKnop(allChecked)}>
          {allChecked
            ? <CheckCircle2 size={16} strokeWidth={2.8} />
            : someChecked
              ? <Circle size={15} strokeWidth={2.6} fill="#fff" fillOpacity={0.35} />
              : <Circle size={15} strokeWidth={2.4} />}
        </button>
      </div>

      {/* Regels */}
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: `0 ${zij}`,
            borderBottom: index < visibleItems.length - 1 ? `1px solid ${LIJN}` : 'none',
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
              isMobile={isMobile}
            />
          ) : (
            <ShoppingItem
              item={{
                ...item,
                displayAmount: editedAmounts[item.id] !== undefined ? editedAmounts[item.id] : item.displayAmount,
                estimatedCost: editedAmounts[item.id] !== undefined
                  ? (editedAmounts[item.id] / (item.displayAmount || item.totalAmount || 1)) * (item.estimatedCost || 0)
                  : item.estimatedCost,
              }}
              checked={checkedItems[item.id]}
              onCheck={() => onCheckItem(item.id)}
              isMobile={isMobile}
            />
          )}
        </div>
      ))}
    </div>
  )
}
