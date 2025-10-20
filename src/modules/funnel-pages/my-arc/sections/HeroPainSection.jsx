import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function HeroPainSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showButton, setShowButton] = useState(false)

  // Fade in text regel voor regel
  useEffect(() => {
    if (!isCurrentSection) return

    const timers = []
    for (let i = 0; i <= 5; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i)
          if (i === 5) {
            setTimeout(() => setShowButton(true), 800)
          }
        }, i * 800)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [isCurrentSection])

  const lines = [
    { text: "Je bent niet fit", delay: 0 },
    { text: "Niemand zegt het", delay: 1 },
    { text: "Maar iedereen ziet het", delay: 2 },
    { text: "Tijd om te veranderen", delay: 3, highlight: true },
    { text: "Tijd om ze trots te maken", delay: 4 },
    { text: "Tijd om het om te draaien", delay: 5, big: true }
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
      
      {/* Subtle dark gradient voor diepte */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.01) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        
        {/* Text lines */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {lines.map((line, index) => (
            <p
              key={index}
              style={{
                fontSize: line.big 
                  ? (isMobile ? '2rem' : '3rem')
                  : (isMobile ? '1.5rem' : '2.25rem'),
                fontWeight: line.big ? '800' : '400',
                lineHeight: '1.3',
                margin: line.delay === 3 ? (isMobile ? '2rem 0' : '3rem 0') : '0',
                marginBottom: isMobile ? '0.75rem' : '1rem',
                color: line.highlight 
                  ? 'rgba(255, 255, 255, 0.95)'
                  : line.big
                    ? '#fff'
                    : 'rgba(255, 255, 255, 0.7)',
                opacity: visibleLines >= line.delay ? 1 : 0,
                transform: visibleLines >= line.delay 
                  ? 'translateY(0)' 
                  : 'translateY(20px)',
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {line.text}
            </p>
          ))}
        </div>

        {/* Divider line */}
        <div style={{
          width: '60px',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '3rem',
          opacity: showButton ? 1 : 0,
          transition: 'opacity 1s ease'
        }} />

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: isMobile ? '2rem' : '3rem',
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transition: '0.5s',
          fontWeight: '400',
          letterSpacing: '0.02em'
        }}>
          Tijd voor verandering.
        </p>

        {/* CTA Button */}
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
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0',
            padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: showButton ? 1 : 0,
            transform: showButton ? 'translateY(0)' : 'translateY(20px)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            Bekijk hoe
          </span>
          <ChevronDown 
            size={isMobile ? 16 : 18} 
            style={{ 
              position: 'relative',
              zIndex: 1,
              animation: 'gentleBounce 2s ease-in-out infinite'
            }} 
          />
        </button>

        {/* Tiny hint text */}
        <p style={{
          fontSize: isMobile ? '0.7rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.2)',
          marginTop: isMobile ? '3rem' : '4rem',
          opacity: showButton ? 1 : 0,
          transition: 'opacity 1s ease',
          transition: '1s',
          letterSpacing: '0.05em'
        }}>
          8 weken verwijderd van "fuck, goed bezig man"
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
