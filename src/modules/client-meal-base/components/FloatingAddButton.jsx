// src/modules/client-meal-base/components/FloatingAddButton.jsx
import { Plus } from 'lucide-react'

export default function FloatingAddButton({ onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: isMobile ? '5rem' : '2rem',
        right: isMobile ? '1rem' : '2rem',
        width: isMobile ? '60px' : '68px',
        height: isMobile ? '60px' : '68px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: 'none',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'visible'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.6), 0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.92)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {/* Animated Pulse Ring */}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        borderRadius: '50%',
        border: '2px solid rgba(16, 185, 129, 0.6)',
        animation: 'pulseRing 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        pointerEvents: 'none'
      }} />
      
      {/* Inner Glow Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      {/* Plus Icon with Glow */}
      <Plus 
        size={isMobile ? 30 : 34} 
        color="#fff" 
        strokeWidth={3}
        style={{ 
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      
      <style>{`
        @keyframes pulseRing {
          0% {
            transform: scale(0.95);
            opacity: 1;
            border-width: 2px;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.3;
            border-width: 1px;
          }
          100% {
            transform: scale(0.95);
            opacity: 1;
            border-width: 2px;
          }
        }
      `}</style>
    </button>
  )
}
