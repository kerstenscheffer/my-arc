// src/modules/lead-magnet/components/MessageCard.jsx
// REUSABLE MESSAGE CARD - Tap-to-copy met feedback

import { Copy, CheckCircle } from 'lucide-react'

export default function MessageCard({ 
  message, 
  onCopy, 
  isCopied, 
  color = '#10b981',
  showCategory = false,
  categoryLabel = null,
  trigger = null,
  triggerLabel = null 
}) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div
      onClick={() => onCopy(message.text, message.id)}
      style={{
        background: isCopied 
          ? `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)`
          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: isCopied 
          ? `1px solid ${color}`
          : `1px solid rgba(255, 255, 255, 0.1)`,
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '1rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isCopied 
          ? `0 8px 24px ${color}40, inset 0 1px 0 rgba(255, 255, 255, 0.08)`
          : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isMobile && !isCopied) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.7) 100%)'
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
          e.currentTarget.style.boxShadow = `0 8px 24px ${color}20, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile && !isCopied) {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)'
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }
      }}
    >
      {/* Shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
            {/* Label */}
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: color,
              textShadow: `0 0 8px ${color}60`
            }}>
              {message.label}
            </div>
            
            {/* Category (search results) */}
            {showCategory && categoryLabel && (
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                📍 {categoryLabel}
              </div>
            )}
            
            {/* Trigger indicator */}
            {trigger && triggerLabel && (
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '700',
                color: trigger === '🟢' ? '#10b981' : '#f59e0b',
                background: trigger === '🟢' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                border: `1px solid ${trigger === '🟢' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                width: 'fit-content'
              }}>
                {trigger} {triggerLabel}
              </div>
            )}
          </div>
          
          {/* Copy icon */}
          <div style={{
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '8px',
            background: isCopied ? `rgba(16, 185, 129, 0.2)` : `${color}20`,
            border: `1px solid ${isCopied ? color : `${color}40`}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCopied ? `0 0 12px ${color}60` : 'none',
            transition: 'all 0.3s ease'
          }}>
            {isCopied ? (
              <CheckCircle 
                size={isMobile ? 14 : 16} 
                color={color}
                strokeWidth={2.5}
                style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
              />
            ) : (
              <Copy 
                size={isMobile ? 14 : 16} 
                color={color}
                strokeWidth={2.5}
                style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
              />
            )}
          </div>
        </div>
        
        {/* Message text */}
        <div style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.9)',
          lineHeight: '1.6',
          marginBottom: isCopied ? '0.75rem' : 0
        }}>
          {message.text}
        </div>
        
        {/* Copied feedback */}
        {isCopied && (
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            ✓ GEKOPIEERD!
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
