import React from 'react'
import { Edit3 } from 'lucide-react'

export default function LogMealButton({ onClick }) {
  const isMobile = window.innerWidth <= 768

  return (
    <button
      onClick={onClick}
      style={{
        // Layout
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '1rem' : '1.25rem',
        width: '100%',
        
        // Background & Border
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: isMobile ? '14px' : '16px',
        
        // Effects
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        
        // Interaction
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        
        // Position for overlay
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.12) 100%)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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
      {/* Top glow overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Icon container */}
      <div style={{
        width: isMobile ? '44px' : '52px',
        height: isMobile ? '44px' : '52px',
        borderRadius: isMobile ? '12px' : '14px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1
      }}>
        <Edit3 
          size={isMobile ? 22 : 26} 
          color="#10b981"
          style={{ 
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
          }}
        />
      </div>

      {/* Text content */}
      <div style={{ 
        flex: 1, 
        textAlign: 'left',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: '800',
          color: '#10b981',
          marginBottom: '0.15rem',
          letterSpacing: '-0.01em'
        }}>
          📝 Log wat je gegeten hebt
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '500',
          lineHeight: 1.4
        }}>
          Houd je voeding bij
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        color: 'rgba(16, 185, 129, 0.6)',
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '300',
        position: 'relative',
        zIndex: 1,
        transition: 'transform 0.3s ease'
      }}>
        →
      </div>
    </button>
  )
}
