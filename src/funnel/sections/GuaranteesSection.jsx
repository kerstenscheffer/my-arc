// ========================================
// 📁 src/funnel/sections/GuaranteesSection.jsx
// PREMIUM GUARANTEES + 6-TERMIJNEN PRICING
// Gold-brown theme + compact layout
// ========================================
import React, { useState, useEffect } from 'react'
import { Target, Shield, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

export default function GuaranteesSection({ onScrollNext, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredPricing, setHoveredPricing] = useState(false)
  const [hoveredButtonSave, setHoveredButtonSave] = useState(false)
  const [hoveredButtonStart, setHoveredButtonStart] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  const guarantees = [
    {
      icon: Target,
      title: "Geen Deadline, Wel Resultaat",
      description: "We stoppen pas als je 5-8kg droog hebt bereikt. Geen tijdslimiet, geen stress. Gewoon doorgaan tot je er bent."
    },
    {
      icon: Shield,
      title: "28 Dagen Proberen",
      description: "Probeer het 4 weken. Past het toch niet bij je? Direct je volledige investering terug.",
      moneyBack: true
    }
  ]

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
          marginBottom: isMobile ? '2.5rem' : '3rem',
          maxWidth: '900px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.75rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 12px rgba(255, 186, 9, 0.15))'
          }}>
            Risicovrij Starten
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 160, 6, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Resultaat is gegarandeerd & 28 dagen geld terug garantie
          </p>
        </div>

        {/* 6-TERMIJNEN PRICING CARD - TOP */}
        <div style={{
          maxWidth: '650px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          position: 'relative',
          zIndex: 2
        }}>
          <div
            onMouseEnter={() => setHoveredPricing(true)}
            onMouseLeave={() => setHoveredPricing(false)}
            onTouchStart={() => isMobile && setHoveredPricing(true)}
            onTouchEnd={() => isMobile && setTimeout(() => setHoveredPricing(false), 300)}
            style={{
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.8) 100%)',
              border: `2px solid ${hoveredPricing ? 'rgba(255, 186, 9, 0.5)' : 'rgba(255, 186, 9, 0.3)'}`,
              borderRadius: '20px',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              position: 'relative',
              cursor: 'pointer',
              transform: hoveredPricing ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(12px)',
              boxShadow: hoveredPricing 
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

            {/* Title above price */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem',
              position: 'relative',
              zIndex: 2
            }}>
              Maandelijks Betalen
            </h3>

            {/* Price - LEFT ALIGNED */}
            <div style={{
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 186, 9, 0.15)',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Price with inline total */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                <span style={{
                  fontSize: isMobile ? '2.75rem' : '3.25rem',
                  fontWeight: '900',
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  €175
                </span>
                <span style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600'
                }}>
                  /€1050 totaal
                </span>
              </div>
            </div>

            {/* Features - SIMPLIFIED */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 2
            }}>
              {[
                '6 maanden volledige begeleiding',
                'Geen deadline, wel resultaat',
                '28 Dagen Proberen'
              ].map((feature, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginBottom: idx === 2 ? 0 : '0.875rem',
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
            {hoveredPricing && (
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

        {/* Guarantee cards - COMPACT */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.25rem' : '2rem',
          maxWidth: '900px',
          width: '100%',
          marginBottom: isMobile ? '2.5rem' : '3.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          {guarantees.map((guarantee, index) => {
            const Icon = guarantee.icon
            const isHovered = hoveredCard === index
            
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onTouchStart={() => isMobile && setHoveredCard(index)}
                onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(null), 300)}
                style={{
                  background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.8) 100%)',
                  border: `2px solid ${isHovered ? 'rgba(255, 186, 9, 0.5)' : 'rgba(255, 186, 9, 0.15)'}`,
                  borderRadius: '20px',
                  padding: isMobile ? '1.5rem 1.25rem' : '2rem 1.5rem',
                  position: 'relative',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(12px)',
                  opacity: isVisible ? 1 : 0,
                  animation: `fadeInUp 0.6s ${0.4 + index * 0.2}s forwards`,
                  boxShadow: isHovered 
                    ? '0 25px 50px rgba(255, 186, 9, 0.25), 0 0 80px rgba(255, 186, 9, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)' 
                    : '0 8px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
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
                  opacity: 0.6,
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
                  background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.06) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }} />

                {/* Large number background */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  fontSize: isMobile ? '80px' : '100px',
                  fontWeight: '900',
                  color: 'rgba(255, 186, 9, 0.03)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  {index + 1}
                </div>

                {/* Icon with golden glow - ROUND */}
                <div style={{
                  width: isMobile ? '56px' : '64px',
                  height: isMobile ? '56px' : '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  border: '1px solid rgba(255, 186, 9, 0.3)',
                  boxShadow: '0 0 20px rgba(255, 186, 9, 0.3), inset 0 1px 0 rgba(255, 186, 9, 0.1)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <Icon 
                    size={isMobile ? 26 : 30} 
                    color="#ffba09"
                    strokeWidth={2.5}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(255, 186, 9, 0.5))'
                    }}
                  />
                </div>

                {/* Money back indicator */}
                {guarantee.moneyBack && (
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '0.875rem' : '1.25rem',
                    left: isMobile ? '0.875rem' : '1.25rem',
                    background: 'rgba(255, 186, 9, 0.1)',
                    border: '1px solid rgba(255, 186, 9, 0.3)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.75rem',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '800',
                    color: '#ffba09',
                    letterSpacing: '0.05em',
                    zIndex: 3,
                    backdropFilter: 'blur(8px)'
                  }}>
                    100% TERUG
                  </div>
                )}

                {/* Content */}
                <h3 style={{
                  fontSize: isMobile ? '1.125rem' : '1.35rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.875rem',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                  filter: 'drop-shadow(0 0 8px rgba(255, 186, 9, 0.2))',
                  position: 'relative',
                  zIndex: 2
                }}>
                  {guarantee.title}
                </h3>

                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0,
                  position: 'relative',
                  zIndex: 2
                }}>
                  {guarantee.description}
                </p>

                {/* Subtle hover glow */}
                {isHovered && (
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
            )
          })}
        </div>

        {/* Dual CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1rem' : '1.5rem',
          maxWidth: '700px',
          width: '100%',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Button 1: Bespaar 💰 */}
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate(4) // Go to FinalCTASection (full pricing)
              }
            }}
            onMouseEnter={() => setHoveredButtonSave(true)}
            onMouseLeave={() => setHoveredButtonSave(false)}
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
              flex: 1,
              background: hoveredButtonSave
                ? 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.15) 100%)'
                : 'rgba(255, 186, 9, 0.08)',
              border: `1px solid ${hoveredButtonSave ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: hoveredButtonSave ? '#ffba09' : '#d4a006',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredButtonSave ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hoveredButtonSave
                ? '0 4px 12px rgba(255, 186, 9, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.01em'
            }}
          >
            <Sparkles size={isMobile ? 18 : 20} />
            <span>Bespaar €300</span>
            <ArrowRight 
              size={isMobile ? 18 : 20} 
              style={{
                transition: 'transform 0.3s ease',
                transform: hoveredButtonSave ? 'translateX(4px)' : 'translateX(0)'
              }}
            />
          </button>

          {/* Button 2: Begin Nu 🚀 */}
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate(6) // Go to ClientWelcomeSection
              } else {
                const section = document.getElementById('section-6')
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }
            }}
            onMouseEnter={() => setHoveredButtonStart(true)}
            onMouseLeave={() => setHoveredButtonStart(false)}
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
              flex: 1,
              background: hoveredButtonStart
                ? 'rgba(255, 255, 255, 0.05)'
                : 'transparent',
              border: `1px solid ${hoveredButtonStart ? 'rgba(255, 186, 9, 0.2)' : 'rgba(255, 186, 9, 0.15)'}`,
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              color: hoveredButtonStart ? 'rgba(255, 186, 9, 0.9)' : 'rgba(255, 186, 9, 0.6)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.625rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredButtonStart ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hoveredButtonStart
                ? '0 4px 12px rgba(255, 186, 9, 0.1)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.01em'
            }}
          >
            <span>Begin Nu</span>
            <ArrowRight 
              size={isMobile ? 18 : 20} 
              style={{
                transition: 'transform 0.3s ease',
                transform: hoveredButtonStart ? 'translateX(4px)' : 'translateX(0)'
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
