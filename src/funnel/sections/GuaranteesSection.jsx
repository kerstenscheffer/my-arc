import React, { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Shield } from 'lucide-react'
import GoldenCTAButton from '../components/GoldenCTAButton'
import CalendlyModal from '../components/CalendlyModal'

export default function GuaranteesSection({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

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
      icon: Trophy,
      badge: "GARANTIE #1",
      title: "Haal Je Doel = Geld Terug",
      description: "Bereik je realistische 8-weken doel en krijg je volledige investering terug. Zo simpel is het."
    },
    {
      icon: CheckCircle,
      badge: "GARANTIE #2",
      title: "Voldoe Aan De Voorwaarden = Geld Terug",
      description: "24 workouts, 45 dagen voeding bijhouden, 8 check-ins. Doe wat werkt, krijg alles terug."
    },
    {
      icon: Shield,
      badge: "GARANTIE #3",
      title: "4 Weken 'Niet Tevreden' Garantie",
      description: "Ben je na 4 weken niet overtuigd? Direct je geld terug, geen vragen."
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
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.04) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'float 35s ease-in-out infinite reverse',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          maxWidth: '900px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.3))'
          }}>
            3 IJzersterke Garanties - Je Kunt Niet Verliezen
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(212, 175, 55, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Ik neem alle risico weg, jij focust op resultaat
          </p>
        </div>

        {/* Guarantee cards - Clean golden design */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          maxWidth: '1100px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4rem'
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
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)',
                  border: `2px solid ${isHovered ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.15)'}`,
                  borderRadius: '20px',
                  padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
                  position: 'relative',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  opacity: isVisible ? 1 : 0,
                  animation: `fadeInUp 0.6s ${index * 0.15}s forwards`,
                  boxShadow: isHovered 
                    ? '0 25px 50px rgba(255, 215, 0, 0.25), 0 0 80px rgba(255, 215, 0, 0.15)' 
                    : '0 10px 30px rgba(0, 0, 0, 0.5)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Golden badge */}
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  padding: '0.4rem 1.2rem',
                  borderRadius: '100px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '800',
                  color: '#000',
                  boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
                  letterSpacing: '0.1em'
                }}>
                  {guarantee.badge}
                </div>

                {/* Icon with golden glow */}
                <div style={{
                  width: isMobile ? '60px' : '70px',
                  height: isMobile ? '60px' : '70px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.04) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  boxShadow: '0 8px 25px rgba(255, 215, 0, 0.1), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
                }}>
                  <Icon 
                    size={isMobile ? 30 : 35} 
                    color="#D4AF37"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.5))'
                    }}
                  />
                </div>

                {/* Content */}
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.2))'
                }}>
                  {guarantee.title}
                </h3>

                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0
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
                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom text */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
        }}>
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.375rem',
            color: '#D4AF37',
            fontWeight: '600',
            letterSpacing: '0.02em',
            marginBottom: '0.5rem',
            filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))'
          }}>
            Geen kleine lettertjes. Geen gedoe. 100% risico-vrij.
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            Je hebt letterlijk niets te verliezen
          </p>
        </div>

        {/* CTA Button */}
        <GoldenCTAButton 
          onClick={() => setShowCalendlyModal(true)}
          text="Claim Je Plek Zonder Risico"
          icon={Shield}
          isMobile={isMobile}
        />

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

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
