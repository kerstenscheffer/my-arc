// src/modules/shopping/tabs/components/ShoppingActions.jsx - OPTIMIZED
import React from 'react'
import { Share2, RefreshCw } from 'lucide-react'

export default function ShoppingActions({ 
  onShare, 
  onRefresh, 
  saving, 
  hasChanges, 
  saveSuccess, 
  isMobile 
}) {
  // 🔥 COMPACT: Alleen share en refresh (save is floating button)
  const actions = [
    {
      icon: Share2,
      label: 'Delen',
      onClick: onShare,
      color: '#3b82f6'
    },
    {
      icon: RefreshCw,
      label: 'Vernieuwen',
      onClick: onRefresh,
      color: '#6b7280'
    }
  ]

  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? '0.5rem' : '0.625rem',
      marginBottom: isMobile ? '0.75rem' : '1rem'
    }}>
      {actions.map((action) => {
        const Icon = action.icon
        
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.6) 0%, rgba(23, 23, 23, 0.4) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: isMobile ? '10px' : '12px',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '0.375rem' : '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transform: 'translateZ(0)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateZ(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
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
            {/* Icon */}
            <Icon 
              size={isMobile ? 14 : 16} 
              color="rgba(255, 255, 255, 0.7)"
              strokeWidth={2.5}
            />

            {/* Label - alleen op desktop */}
            {!isMobile && (
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8125rem',
                fontWeight: '700',
                letterSpacing: '-0.01em'
              }}>
                {action.label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
