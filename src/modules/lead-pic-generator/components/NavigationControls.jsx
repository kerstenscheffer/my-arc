// src/modules/lead-pic-generator/components/NavigationControls.jsx
import React from 'react'

export default function NavigationControls({ currentSlide, setCurrentSlide, isMobile }) {
  
  if (!isMobile) return null
  
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '1.5rem'
    }}>
      <button
        onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
        disabled={currentSlide === 0}
        style={{
          padding: '0.75rem 1.5rem',
          background: currentSlide === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
          opacity: currentSlide === 0 ? 0.3 : 1,
          fontSize: '0.9rem',
          fontWeight: '600',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
      >
        Vorige
      </button>
      <button
        onClick={() => setCurrentSlide(Math.min(2, currentSlide + 1))}
        disabled={currentSlide === 2}
        style={{
          padding: '0.75rem 1.5rem',
          background: currentSlide === 2 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          cursor: currentSlide === 2 ? 'not-allowed' : 'pointer',
          opacity: currentSlide === 2 ? 0.3 : 1,
          fontSize: '0.9rem',
          fontWeight: '600',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
      >
        Volgende
      </button>
    </div>
  )
}
