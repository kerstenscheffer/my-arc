import React, { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Shield } from 'lucide-react'
import CalendlyModal from '../components/CalendlyModal'

export default function GuaranteesSection({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)
  const [visibleCard, setVisibleCard] = useState(-1)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 300)
    
    // Progressive card reveal
    const cardTimers = []
    for (let i = 0; i <= 2; i++) {
      cardTimers.push(
        setTimeout(() => setVisibleCard(i), 600 + (i * 200))
      )
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      cardTimers.forEach(clearTimeout)
    }
  }, [])

  const guarantees = [
    {
      icon: Trophy,
      badge: "GARANTIE #1",
      title: "Till The Goal",
      description: "We werken samen tot je doel gehaald is. 6 maanden? 8 maanden? 10 maanden? We stoppen pas als JIJ wint."
    },
    {
      icon: CheckCircle,
      badge: "GARANTIE #2",
      title: "Niet Geleverd? Geld Terug",
      description: "Vind je dat ik niet lever? Direct je geld terug. Geen vragen gesteld, 100% refund."
    },
    {
      icon: Shield,
      badge: "GARANTIE #3",
      title: "Win Your Money Back",
      description: "Haal je doel + voldoe aan voorwaarden = €150 cash + €150 store credit. Tot €300 terug."
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
        {/* Red orbs - KEPT */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '-15%',
          width: isMobile ? '300px' : '500px',
          height: isMobile ? '300px' : '500px',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(153, 27, 27, 0.05) 0%, transparent 70%)',
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
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(239, 68, 68, 0.7)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            Jouw zekerheid
          </p>

          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 20px rgba(220, 38, 38, 0.3))'
          }}>
            3 IJzersterke Garanties
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Jouw Succes Is Gegarandeerd
          </p>
        </div>

        {/* Guarantee cards - Sharp corners, kept glows */}
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
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(220, 38, 38, 0.03) 100%)',
                  border: `2px solid ${isHovered ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.2)'}`,
                  borderRadius: '0', // SHARP CORNERS
                  padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
                  position: 'relative',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  opacity: visibleCard >= index ? 1 : 0,
                  boxShadow: isHovered 
                    ? '0 25px 50px rgba(220, 38, 38, 0.3), 0 0 80px rgba(220, 38, 38, 0.2)' // KEPT GLOWS
                    : '0 10px 30px rgba(0, 0, 0, 0.5)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Red badge - sharp */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  padding: isMobile ? '0.35rem 1rem' : '0.4rem 1.2rem',
                  borderRadius: '0', // SHARP
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontWeight: '800',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)', // KEPT GLOW
                  letterSpacing: '0.1em'
                }}>
                  {guarantee.badge}
                </div>

                {/* Icon with red glow - KEPT */}
                <div style={{
                  width: isMobile ? '60px' : '70px',
                  height: isMobile ? '60px' : '70px',
                  borderRadius: '0', // SHARP
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  boxShadow: '0 8px 25px rgba(220, 38, 38, 0.15), inset 0 1px 0 rgba(220, 38, 38, 0.1)' // KEPT GLOW
                }}>
                  <Icon 
                    size={isMobile ? 30 : 35} 
                    color="#ef4444"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))' // KEPT GLOW
                    }}
                  />
                </div>

                {/* Content */}
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                  filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.2))' // KEPT GLOW
                }}>
                  {guarantee.title}
                </h3>

                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6',
                  textAlign: 'center',
                  margin: 0,
                  fontWeight: '300'
                }}>
                  {guarantee.description}
                </p>

                {/* Hover glow - KEPT */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '150%',
                    height: '150%',
                    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 60%)',
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
          opacity: visibleCard >= 2 ? 1 : 0,
          transform: visibleCard >= 2 ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
        }}>
          <div style={{
            width: '60px',
            height: '1px',
            background: 'rgba(220, 38, 38, 0.3)',
            margin: '0 auto 2rem'
          }} />

          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.375rem',
            color: '#ef4444',
            fontWeight: '600',
            letterSpacing: '0.02em',
            marginBottom: '0.5rem',
            filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.4))' // KEPT GLOW
          }}>
            Van 8-weken momentum naar lifetime transformation.
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic',
            fontWeight: '300'
          }}>
            Geen tijdslimiet. Alleen resultaten.
          </p>
        </div>

        {/* CTA Button - sharp */}
        <button
          onClick={() => setShowCalendlyModal(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(220, 38, 38, 0.4), 0 0 100px rgba(220, 38, 38, 0.3)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7)'
            e.currentTarget.style.color = '#ef4444'
          }}
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
            border: '2px solid rgba(220, 38, 38, 0.4)',
            borderRadius: '0', // SHARP
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            position: 'relative',
            overflow: 'hidden',
            opacity: visibleCard >= 2 ? 1 : 0,
            animation: visibleCard >= 2 ? 'none' : 'fadeInUp 0.8s 1.2s forwards'
          }}
        >
          <Shield size={isMobile ? 20 : 24} style={{ 
            position: 'relative',
            zIndex: 1
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>
            Start Je Till The Goal Journey
          </span>
        </button>

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
