// src/modules/challenges/components/ChallengeHeader.jsx
// Challenge Modal Header Component
// Kersten - 28 Augustus 2025

import { X, Target } from 'lucide-react'

export default function ChallengeHeader({ challenge, onClose, isMobile, theme }) {
  return (
    <div style={{
      background: theme.gradient,
      backgroundSize: '200% 100%',
      animation: 'gradientShift 8s ease-in-out infinite',
      padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      borderRadius: isMobile ? '24px 24px 0 0' : '24px 24px 0 0'
    }}>
      
      {/* Decorative circle */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 11
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <X size={20} color="#fff" strokeWidth={2.5} />
      </button>
      
      {/* Header Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: '900',
          color: '#fff',
          marginBottom: '0.75rem',
          paddingRight: '50px',
          letterSpacing: '-0.02em',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          lineHeight: 1.2
        }}>
          <Target size={isMobile ? 24 : 28} color="#fff" style={{ marginRight: '0.75rem' }} />
          {challenge.title || challenge.name}
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: 1.5,
          fontWeight: '500'
        }}>
          {challenge.description}
        </p>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
