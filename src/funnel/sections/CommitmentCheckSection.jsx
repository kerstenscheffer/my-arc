// ========================================
// 📁 src/funnel/sections/CommitmentCheckSection.jsx
// COMMITMENT CHECKPOINT - Hero-style glassmorphic
// Visual support voor "1-10 schaal" vraag
// ========================================
import React from 'react'

export default function CommitmentCheckSection({ isMobile, onNavigate }) {

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      
      {/* Subtle golden gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(255, 186, 9, 0.02) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: isMobile ? '100%' : '700px',
        width: '100%',
        zIndex: 1
      }}>

        {/* Content - Direct without card wrapper */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center'
        }}>

          {/* Main Question */}
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '900',
            lineHeight: 1.2,
            marginBottom: isMobile ? '3rem' : '4rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 12px rgba(255, 186, 9, 0.15))'
          }}>
            Hoe goed sluit dit aan<br />
            op jouw situatie?
          </h1>

          {/* CTA Button */}
          <button
            onClick={() => onNavigate && onNavigate(3)}
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
            style={{
              background: 'rgba(255, 186, 9, 0.08)',
              border: '1px solid rgba(255, 186, 9, 0.15)',
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: '#d4a006',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.15) 100%)'
              e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.3)'
              e.currentTarget.style.color = '#ffba09'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 186, 9, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 186, 9, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.15)'
              e.currentTarget.style.color = '#d4a006'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            Bekijk Garanties
          </button>

        </div>
      </div>
    </section>
  )
}
