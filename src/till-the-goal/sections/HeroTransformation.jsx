import React, { useState, useEffect } from 'react'
import { ArrowDown } from 'lucide-react'

export default function HeroTransformation({ isMobile, onScrollNext }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showCTA, setShowCTA] = useState(false)

  // Progressive text reveal - MY ARC style
  useEffect(() => {
    const timers = []
    
    // Title lines
    timers.push(setTimeout(() => setVisibleLines(1), 400))   // "6 MAANDEN"
    timers.push(setTimeout(() => setVisibleLines(2), 1200))  // "TILL THE GOAL"
    timers.push(setTimeout(() => setVisibleLines(3), 2000))  // Subtitle
    timers.push(setTimeout(() => setVisibleLines(4), 2800))  // Trust items
    timers.push(setTimeout(() => setShowCTA(true), 3600))    // CTA
    
    return () => timers.forEach(clearTimeout)
  }, [])

  const trustItems = [
    'Till The Goal garantie',
    'Win tot €300 terug',
    'Momentum op maximum'
  ]

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      position: 'relative',
      background: '#000',
      overflow: 'hidden'
    }}>
      
      {/* Zeer subtiele rode ambient glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.02) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        
        {/* Premium label - clean */}
        <div style={{
          marginBottom: isMobile ? '2rem' : '3rem',
          opacity: visibleLines >= 1 ? 1 : 0,
          transform: visibleLines >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <span style={{
            background: 'transparent',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '0',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '600',
            color: 'rgba(239, 68, 68, 0.9)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>
            Exclusief Voor Challenge Deelnemers
          </span>
        </div>

        {/* Main title - progressive reveal */}
        <div style={{
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          {/* Line 1: "6 MAANDEN" */}
          <h1 style={{
            fontSize: isMobile ? '3.5rem' : '6rem',
            fontWeight: '900',
            lineHeight: '0.95',
            marginBottom: '0.5rem',
            letterSpacing: '-0.03em',
            color: '#dc2626',
            opacity: visibleLines >= 1 ? 1 : 0,
            transform: visibleLines >= 1 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            textShadow: '0 0 40px rgba(220, 38, 38, 0.3), 0 0 80px rgba(220, 38, 38, 0.15)'
          }}>
            6 MAANDEN
          </h1>

          {/* Line 2: "TILL THE GOAL" */}
          <h2 style={{
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.95)',
            opacity: visibleLines >= 2 ? 1 : 0,
            transform: visibleLines >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '-0.01em'
          }}>
            TILL THE GOAL
          </h2>
        </div>

        {/* Divider */}
        <div style={{
          width: '60px',
          height: '1px',
          background: 'rgba(220, 38, 38, 0.3)',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '3rem',
          opacity: visibleLines >= 3 ? 1 : 0,
          transition: 'opacity 1s ease'
        }} />

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: '700px',
          margin: '0 auto',
          marginBottom: isMobile ? '3rem' : '4rem',
          lineHeight: '1.4',
          fontWeight: '300',
          opacity: visibleLines >= 3 ? 1 : 0,
          transform: visibleLines >= 3 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          We stoppen pas als{' '}
          <span style={{ 
            color: '#ef4444',
            fontWeight: '500'
          }}>
            jij wint
          </span>
          . Een systeem dat je lange termijn doel garandeert.
        </p>

        {/* Trust indicators - staggered reveal */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {trustItems.map((text, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                opacity: visibleLines >= 4 ? 1 : 0,
                transform: visibleLines >= 4 ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.2}s`
              }}
            >
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#dc2626'
              }} />
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '400',
                letterSpacing: '0.01em'
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button - clean minimal */}
        <div style={{
          opacity: showCTA ? 1 : 0,
          transform: showCTA ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <button
            onClick={onScrollNext}
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
              background: 'transparent',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '0',
              padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(239, 68, 68, 0.9)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.7)'
              e.currentTarget.style.color = '#ef4444'
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.4)'
              e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span>Ontdek Het Aanbod</span>
            <ArrowDown 
              size={isMobile ? 16 : 18} 
              style={{ 
                animation: 'gentleBounce 2s ease-in-out infinite'
              }} 
            />
          </button>
        </div>

        {/* Tiny hint text */}
        <p style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.3)',
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: showCTA ? 1 : 0,
          transition: 'opacity 1s ease 0.5s',
          letterSpacing: '0.05em',
          fontWeight: '300'
        }}>
          Van 8-weken momentum naar lifetime transformatie
        </p>
      </div>

      {/* Bottom fade for depth */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Animations */}
      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
      `}</style>
    </section>
  )
}
