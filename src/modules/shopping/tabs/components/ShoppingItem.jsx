// src/modules/shopping/tabs/components/ShoppingItem.jsx
import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

export default function ShoppingItem({ 
  item, 
  checked, 
  onCheck, 
  color, 
  gradient, 
  isMobile,
  delay 
}) {
  if (!item) return null

  return (
    <div
      onClick={onCheck}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.75rem' : '0.875rem',
        background: checked 
          ? 'rgba(255, 255, 255, 0.02)' 
          : 'transparent',
        borderRadius: isMobile ? '10px' : '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: checked ? 0.6 : 1,
        marginBottom: isMobile ? '0.375rem' : '0.5rem',
        transform: 'translateZ(0)'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.transform = 'translateX(4px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.background = checked ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
          e.currentTarget.style.transform = 'translateX(0)'
        }
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {/* Checkbox icon */}
      <div
        style={{
          width: isMobile ? '28px' : '32px',
          height: isMobile ? '28px' : '32px',
          borderRadius: '7px',
          background: checked 
            ? gradient 
            : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${checked ? color : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: checked ? `0 0 12px ${color}66` : 'none'
        }}
      >
        {checked ? (
          <CheckCircle2 size={isMobile ? 14 : 16} color="white" strokeWidth={2.5} />
        ) : (
          <Circle size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.3)" strokeWidth={2} />
        )}
      </div>

      {/* Item details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: 'white',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          letterSpacing: '-0.01em',
          marginBottom: '0.125rem',
          textDecoration: checked ? 'line-through' : 'none',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {item.name}
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: isMobile ? '0.75rem' : '0.8125rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>
            {item.displayAmount || item.totalAmount} {item.unit}
          </span>
          {item.estimatedCost > 0 && (
            <>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
              <span style={{ color: color }}>
                €{item.estimatedCost.toFixed(2)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Subtle indicator line on right */}
      <div style={{
        width: '2px',
        height: isMobile ? '20px' : '24px',
        background: checked ? gradient : 'rgba(255, 255, 255, 0.1)',
        borderRadius: '1px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0
      }} />
    </div>
  )
}
