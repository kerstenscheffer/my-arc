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
        width: isMobile ? '56px' : '64px',
        height: isMobile ? '56px' : '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: 'none',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.7)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        zIndex: 100,
        animation: 'pulse 2s infinite',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.5), 0 0 0 0 rgba(16, 185, 129, 0.7)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.7)'
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <Plus size={isMobile ? 28 : 32} color="#fff" strokeWidth={3} />
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 20px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </button>
  )
}
