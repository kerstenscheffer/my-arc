import React, { useState, useEffect } from 'react'
import { Shield, Target, Users, ArrowRight } from 'lucide-react'

export default function GuaranteesSection({ isMobile: propIsMobile, onScrollNext, onOpenCalendly }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isButtonHovered, setIsButtonHovered] = useState(false)

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
      icon: Shield,
      badge: "GARANTIE #1",
      title: "Niet Fit, Maar Geld Terug",
      description: "Eerste 28 dagen volledig geld terug als je vindt dat ik niet mijn 110% geef om jou naar je doel te helpen."
    },
    {
      icon: Target,
      badge: "GARANTIE #2",
      title: "Hit The Goal & Win",
      description: "Haal een doel en win geld in store credits voor externe motivatie. Beloon jezelf voor succes."
    },
    {
      icon: Users,
      badge: "GARANTIE #3",
      title: "Breng Je Vrienden, Verdien Cash",
      description: "Krijg €75 euro voor elk persoon die je binnenbrengt voor minimaal 1 maand. Win-win voor iedereen."
    }
  ]

  return (
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
      {/* Green orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-15%',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.03) 0%, transparent 70%)',
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          filter: 'drop-shadow(0 2px 20px rgba(16, 185, 129, 0.3))'
        }}>
          3 Garanties Die Je Beschermen
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(16, 185, 129, 0.7)',
          fontWeight: '300',
          letterSpacing: '0.02em'
        }}>
          100% risico-vrij, 100% in jouw voordeel
        </p>
      </div>

      {/* Guarantee cards */}
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
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: `2px solid ${isHovered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)'}`,
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
                  ? '0 25px 50px rgba(16, 185, 129, 0.25), 0 0 80px rgba(16, 185, 129, 0.15)' 
                  : '0 10px 30px rgba(0, 0, 0, 0.5)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '0.4rem 1.2rem',
                borderRadius: '100px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '800',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                letterSpacing: '0.1em'
              }}>
                {guarantee.badge}
              </div>

              {/* Icon */}
              <div style={{
                width: isMobile ? '60px' : '70px',
                height: isMobile ? '60px' : '70px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(16, 185, 129, 0.1)'
              }}>
                <Icon 
                  size={isMobile ? 30 : 35} 
                  color="#10b981"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))'
                  }}
                />
              </div>

              {/* Content */}
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '1rem',
                textAlign: 'center',
                letterSpacing: '-0.01em',
                filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))'
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

              {/* Hover glow */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '150%',
                  height: '150%',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
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
          color: '#10b981',
          fontWeight: '600',
          letterSpacing: '0.02em',
          marginBottom: '0.5rem',
          filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.4))'
        }}>
          Geen kleine lettertjes. Geen gedoe. Je bent beschermd.
        </p>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Dit is hoe zeker ik ben dat YOUR ARC voor jou werkt
        </p>
      </div>

      {/* CTA Button - Hero Style */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={onOpenCalendly}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
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
            backgroundImage: isButtonHovered 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(16, 185, 129, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
            backgroundSize: '200% 100%',
            backgroundPosition: isButtonHovered ? '0% 50%' : '100% 50%',
            backgroundColor: 'transparent',
            border: isButtonHovered 
              ? '2px solid #10b981'
              : '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            color: isButtonHovered ? '#fff' : '#10b981',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isButtonHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
            boxShadow: isButtonHovered 
              ? '0 25px 50px rgba(16, 185, 129, 0.4), 0 0 100px rgba(16, 185, 129, 0.3)'
              : '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 60px rgba(16, 185, 129, 0.15)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            position: 'relative',
            overflow: 'hidden',
            textShadow: isButtonHovered 
              ? '0 2px 4px rgba(0, 0, 0, 0.3)'
              : '0 0 20px rgba(16, 185, 129, 0.5)'
          }}
        >
          {/* Gliding shine effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-30%',
            width: '50%',
            height: '200%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transform: 'rotate(35deg)',
            animation: isButtonHovered ? 'glide 2s ease-in-out infinite' : 'glide 4s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
          
          <span style={{ position: 'relative', zIndex: 1 }}>
            Start Zonder Risico
          </span>
          <ArrowRight 
            size={isMobile ? 20 : 24} 
            style={{ 
              position: 'relative',
              zIndex: 1,
              animation: 'slideRight 2s ease-in-out infinite'
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
        
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>
    </section>
  )
}
