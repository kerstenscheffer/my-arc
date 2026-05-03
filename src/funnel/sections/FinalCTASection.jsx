// ========================================
// 📁 src/funnel/sections/FinalCTASection.jsx
// PRICING SECTION - Only "Vooraf Betalen" option
// Gold-brown theme + single "Wat Nu" CTA
// ========================================
import React, { useState, useEffect } from 'react'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function FinalCTASection({ onScrollNext, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(false)
  const [hoveredButton, setHoveredButton] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  const scrollToClientWelcome = () => {
    if (onNavigate) {
      onNavigate(6) // Go to ClientWelcomeSection
    } else {
      const section = document.getElementById('section-6')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <>
      <section 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          position: 'relative',
          padding: isMobile ? '3rem 1rem' : '5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Subtle golden orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '-15%',
          width: isMobile ? '300px' : '500px',
          height: isMobile ? '300px' : '500px',
          background: 'radial-gradient(circle, rgba(255, 186, 9, 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 30s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '-15%',
          width: isMobile ? '350px' : '550px',
          height: isMobile ? '350px' : '550px',
          background: 'radial-gradient(circle, rgba(212, 160, 6, 0.03) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'float 35s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          maxWidth: '800px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 12px rgba(255, 186, 9, 0.15))'
          }}>
            Bespaar €300
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 160, 6, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Vooraf betalen in plaats van in termijnen
          </p>
        </div>

        {/* Single Pricing Card - Vooraf Betalen */}
        <div style={{
          maxWidth: '600px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4rem',
          position: 'relative',
          zIndex: 2
        }}>
          <div
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
            onTouchStart={() => isMobile && setHoveredCard(true)}
            onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(false), 300)}
            style={{
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.8) 100%)',
              border: `2px solid ${hoveredCard ? 'rgba(255, 186, 9, 0.5)' : 'rgba(255, 186, 9, 0.3)'}`,
              borderRadius: '20px',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              position: 'relative',
              cursor: 'pointer',
              transform: hoveredCard ? 'translateY(-12px) scale(1.03)' : 'translateY(0) scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(12px)',
              opacity: isVisible ? 1 : 0,
              animation: 'fadeInUp 0.6s 0.2s forwards',
              boxShadow: hoveredCard 
                ? '0 30px 60px rgba(255, 186, 9, 0.3), 0 0 100px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                : '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              overflow: 'hidden'
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
              opacity: 0.8,
              borderRadius: '20px 20px 0 0',
              zIndex: 3
            }} />

            {/* Shine overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.08) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Badge */}
            <div style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
              padding: '0.4rem 1.2rem',
              borderRadius: '100px',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '800',
              color: '#000',
              boxShadow: '0 4px 20px rgba(255, 186, 9, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              letterSpacing: '0.1em',
              marginBottom: '1.5rem',
              position: 'relative',
              zIndex: 2
            }}>
              BESTE DEAL
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
              position: 'relative',
              zIndex: 2
            }}>
              Vooraf Betalen
            </h3>

            {/* Price - LEFT ALIGNED with floating savings badge on RIGHT */}
            <div style={{
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid rgba(255, 186, 9, 0.15)',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Price with inline total */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                marginBottom: '0.125rem',
                position: 'relative'
              }}>
                <span style={{
                  fontSize: isMobile ? '2.75rem' : '3.25rem',
                  fontWeight: '900',
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  €125
                </span>
                <span style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600'
                }}>
                  /€750 totaal
                </span>

                {/* Savings badge - FLOATING RIGHT */}
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '-0.25rem',
                  padding: '0.1rem 0.4rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '4px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  transform: 'translateY(-2px)'
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.55rem' : '0.6rem',
                    color: '#10b981',
                    fontWeight: '700',
                    letterSpacing: '0',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                  }}>
                    ✓ Bespaar €300
                  </span>
                </div>
              </div>
              
              {/* Per maand */}
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '600'
              }}>
                per maand
              </div>
            </div>

            {/* Features */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 2
            }}>
              {[
                '6 maanden volledige begeleiding',
                '€300 goedkoper dan 6 termijnen',
                'Direct toegang tot alles',
                'Meeste waarde voor je geld'
              ].map((feature, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginBottom: '0.875rem',
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(255, 186, 9, 0.1)',
                    border: '1px solid rgba(255, 186, 9, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <CheckCircle size={12} color="#ffba09" strokeWidth={2.5} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Hover glow */}
            {hoveredCard && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150%',
                height: '150%',
                background: 'radial-gradient(circle, rgba(255, 186, 9, 0.1) 0%, transparent 60%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                animation: 'pulse 2s ease-in-out infinite',
                zIndex: 0
              }} />
            )}
          </div>
        </div>

        {/* Single CTA Button - Wat Nu */}
        <div style={{
          maxWidth: '400px',
          width: '100%',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
          position: 'relative',
          zIndex: 2
        }}>
          <button
            onClick={scrollToClientWelcome}
            onMouseEnter={() => setHoveredButton(true)}
            onMouseLeave={() => setHoveredButton(false)}
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
              width: '100%',
              background: hoveredButton
                ? 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.15) 100%)'
                : 'rgba(255, 186, 9, 0.08)',
              border: `1px solid ${hoveredButton ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: hoveredButton ? '#ffba09' : '#d4a006',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredButton ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hoveredButton
                ? '0 4px 12px rgba(255, 186, 9, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.01em'
            }}
          >
            <span>Wat Nu</span>
            <ArrowRight 
              size={isMobile ? 18 : 20} 
              style={{
                transition: 'transform 0.3s ease',
                transform: hoveredButton ? 'translateX(4px)' : 'translateX(0)'
              }}
            />
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
          
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(30px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </section>
    </>
  )
}
