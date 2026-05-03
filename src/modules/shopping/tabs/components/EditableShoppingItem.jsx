// src/modules/shopping/tabs/components/EditableShoppingItem.jsx - V3 CLEAN
import React, { useState } from 'react'
import { Check, Plus, Minus, Trash2 } from 'lucide-react'

export default function EditableShoppingItem({ 
  item, 
  checked, 
  editedAmount,
  onCheck, 
  onAmountChange,
  onDelete,
  color,
  gradient,
  isMobile,
  delay = 0
}) {
  if (!item) return null

  const [localAmount, setLocalAmount] = useState(editedAmount || item.displayAmount || item.totalAmount)

  const handleIncrement = () => {
    const newAmount = localAmount + 50
    setLocalAmount(newAmount)
    onAmountChange(item.id, newAmount)
  }

  const handleDecrement = () => {
    const newAmount = Math.max(0, localAmount - 50)
    setLocalAmount(newAmount)
    onAmountChange(item.id, newAmount)
  }

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setLocalAmount(value)
    onAmountChange(item.id, value)
  }

  const originalAmount = item.displayAmount || item.totalAmount
  const costPerUnit = (item.estimatedCost || 0) / originalAmount
  const editedCost = localAmount * costPerUnit

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.375rem' : '0.5rem',
      padding: isMobile ? '0.5rem 0' : '0.625rem 0',
      minHeight: '40px',
      opacity: checked ? 0.45 : 1,
      transition: 'opacity 0.2s ease'
    }}>
      {/* Checkbox */}
      <div
        onClick={onCheck}
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '5px',
          background: checked ? color : 'transparent',
          border: checked 
            ? `1px solid ${color}` 
            : '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
          transition: 'all 0.2s ease'
        }}
      >
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>

      {/* Name + cost */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: checked ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: '600',
          textDecoration: checked ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {item.name}
        </div>
        <div style={{
          color: checked ? 'rgba(255, 255, 255, 0.2)' : color,
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: '800',
          marginTop: '0.1rem'
        }}>
          €{editedCost.toFixed(2)}
        </div>
      </div>

      {/* Amount controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        flexShrink: 0
      }}>
        {/* Minus */}
        <button
          onClick={handleDecrement}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '5px',
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Minus size={11} color="#ef4444" strokeWidth={2.5} />
        </button>

        {/* Input */}
        <input
          type="number"
          value={Math.round(localAmount)}
          onChange={handleInputChange}
          style={{
            width: isMobile ? '48px' : '56px',
            height: '26px',
            padding: '0 0.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
            color: '#fff',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            textAlign: 'center',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = color
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          }}
        />

        {/* Unit */}
        <span style={{
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.5rem',
          fontWeight: '600',
          minWidth: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {item.unit}
        </span>

        {/* Plus */}
        <button
          onClick={handleIncrement}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '5px',
            background: 'transparent',
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={11} color={color} strokeWidth={2.5} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(item.id)}
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '5px',
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            transition: 'all 0.2s ease',
            marginLeft: '0.125rem'
          }}
        >
          <Trash2 size={11} color="#ef4444" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
