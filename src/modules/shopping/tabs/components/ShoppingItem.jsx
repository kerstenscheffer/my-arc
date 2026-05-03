// src/modules/shopping/tabs/components/ShoppingItem.jsx - V4 EXPAND LONG NAMES
import React, { useState } from 'react'
import { Check } from 'lucide-react'

const TRUNCATE_LENGTH = 28

export default function ShoppingItem({ 
  item, 
  checked, 
  onCheck, 
  color,
  isMobile,
  delay = 0
}) {
  const [expanded, setExpanded] = useState(false)
  if (!item) return null

  const name = item.name || ''
  const isTooLong = name.length > TRUNCATE_LENGTH
  const displayName = isTooLong && !expanded
    ? name.slice(0, TRUNCATE_LENGTH).trimEnd() + '…'
    : name

  const handleNameClick = (e) => {
    if (isTooLong) {
      e.stopPropagation()
      setExpanded(prev => !prev)
    }
  }

  return (
    <div
      onClick={onCheck}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: isMobile ? '0.5rem' : '0.625rem',
        padding: isMobile ? '0.4rem 0' : '0.5rem 0',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '36px',
        opacity: checked ? 0.45 : 1,
        transition: 'opacity 0.2s ease'
      }}
    >
      {/* Checkbox */}
      <div style={{
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
        flexShrink: 0,
        marginTop: '1px',
        transition: 'all 0.2s ease'
      }}>
        {checked && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>

      {/* Name — expandable */}
      <span
        onClick={handleNameClick}
        style={{
          flex: 1,
          color: checked ? 'rgba(255, 255, 255, 0.3)' : '#fff',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: '600',
          textDecoration: checked ? 'line-through' : 'none',
          minWidth: 0,
          wordBreak: 'break-word',
          lineHeight: '1.35',
          borderBottom: isTooLong ? `1px dashed rgba(255,255,255,0.15)` : 'none',
          cursor: isTooLong ? 'pointer' : 'inherit'
        }}
      >
        {displayName}
      </span>

      {/* Amount */}
      <span style={{
        color: checked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {Math.round(item.displayAmount || item.totalAmount)}{item.unit}
      </span>

      {/* Cost */}
      <span style={{
        color: checked ? 'rgba(255, 255, 255, 0.2)' : color,
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: '800',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: '36px',
        textAlign: 'right',
        marginTop: '2px'
      }}>
        €{(item.estimatedCost || 0).toFixed(2)}
      </span>
    </div>
  )
}
