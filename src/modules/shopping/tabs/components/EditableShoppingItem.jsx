// src/modules/shopping/tabs/components/EditableShoppingItem.jsx
//
// Dezelfde regel als ShoppingItem, maar dan in bewerkstand: foto en naam blijven
// staan, rechts komen min/plus, een invoerveld en verwijderen. Alles wit op
// zwart — de rode min-knop van vroeger schreeuwde harder dan wat hij deed.

import React, { useState } from 'react'
import { Check, Plus, Minus, Trash2 } from 'lucide-react'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'

const knop = (extra = {}) => ({
  width: 30, height: 30, borderRadius: 9, padding: 0,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  outline: 'none', flexShrink: 0,
  ...extra,
})

export default function EditableShoppingItem({
  item, checked, editedAmount, onCheck, onAmountChange, onDelete, isMobile,
}) {
  const [localAmount, setLocalAmount] = useState(
    editedAmount ?? item?.displayAmount ?? item?.totalAmount ?? 0
  )
  if (!item) return null

  const zet = (n) => {
    const v = Math.max(0, n)
    setLocalAmount(v)
    onAmountChange(item.id, v)
  }

  const originalAmount = item.displayAmount || item.totalAmount || 1
  const costPerUnit = (item.estimatedCost || 0) / originalAmount
  const editedCost = localAmount * costPerUnit
  const foto = foodImageFallback(item.name, null, 120)
  const maat = isMobile ? 46 : 52

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: isMobile ? 10 : 14,
      padding: isMobile ? '0.6rem 0' : '0.7rem 0',
      minHeight: maat + 16,
      opacity: checked ? 0.4 : 1,
      transition: 'opacity 0.2s ease',
    }}>
      <div
        onClick={onCheck}
        style={{
          width: maat, height: maat, borderRadius: 12, flexShrink: 0, cursor: 'pointer',
          backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundColor: '#1a1a1a', position: 'relative',
          filter: checked ? 'grayscale(1)' : 'none',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {checked && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 12,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={18} color="#fff" strokeWidth={3.2} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#fff', fontSize: isMobile ? '0.9rem' : '0.96rem',
          fontWeight: 900, letterSpacing: '-0.015em', lineHeight: 1.25,
          textDecoration: checked ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        <div style={{
          marginTop: 3, color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.74rem' : '0.78rem', fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          €{editedCost.toFixed(2)}
        </div>
      </div>

      {/* Hoeveelheid: min · veld · eenheid · plus · weg */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <button onClick={() => zet(localAmount - 50)} aria-label="Minder" style={knop()}>
          <Minus size={13} strokeWidth={2.8} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={Math.round(localAmount)}
          onChange={(e) => zet(parseFloat(e.target.value) || 0)}
          style={{
            width: isMobile ? 50 : 58, height: 30, padding: '0 0.25rem',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 9, color: '#fff', fontSize: '0.78rem', fontWeight: 900,
            textAlign: 'center', outline: 'none', fontFamily: 'inherit',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span style={{
          color: 'rgba(255,255,255,0.45)', fontSize: '0.62rem', fontWeight: 800,
          minWidth: 16, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {item.unit}
        </span>
        <button onClick={() => zet(localAmount + 50)} aria-label="Meer" style={knop()}>
          <Plus size={13} strokeWidth={2.8} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          aria-label="Verwijderen"
          style={knop({ color: 'rgba(255,255,255,0.55)', marginLeft: 2 })}
        >
          <Trash2 size={13} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
