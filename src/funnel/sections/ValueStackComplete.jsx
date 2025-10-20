import React, { useState, useEffect } from 'react'
import { Users, Dumbbell, Utensils, Target } from 'lucide-react'

export default function ValueStackComplete({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [totalRevealed, setTotalRevealed] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    const totalTimer = setTimeout(() => setTotalRevealed(true), 800)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      clearTimeout(totalTimer)
    }
  }, [])

  const valueCards = [
    {
      icon: Users,
      badge: "Waarde: €197",
      title: "1-op-1 Persoonlijke Begeleiding",
      description: "Jouw journey volledig afgestemd op jouw behoeften. We pakken samen je probleemgebieden aan.",
      gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)'
    },
    {
      icon: Dumbbell,
      badge: "Waarde: €147",
      title: "Persoonlijk Workout Systeem",
      description: "Custom workout plan dat bij jouw leven past. Voor het leven, niet voor 2 weken.",
      gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(184, 150, 15, 0.02) 100%)'
    },
    {
      icon: Utensils,
      badge: "Waarde: €147",
      title: "Maaltijdplan Op Maat",
      description: "Eten wat je lekker vindt én je doelen haalt. Flexibel en vol te houden.",
      gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.07) 0%, rgba(212, 175, 55, 0.02) 100%)'
    },
    {
      icon: Target,
      badge: "Waarde: €106",
      title: "Jouw Stok Achter De Deur",
      description: "We vinden wat jou motiveert en bouwen daarop. Nooit meer opgeven.",
      gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(255, 215, 0, 0.02) 100%)'
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
      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '3rem' : '4rem',
        maxWidth: '800px',
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
          Wat Krijg Je Allemaal?
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(212, 175, 55, 0.7)',
          fontWeight: '300',
          letterSpacing: '0.02em'
        }}>
          Jouw Complete 8-Weken Transformatie Pakket
        </p>
      </div>

      {/* Value cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '1.5rem' : '2rem',
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem'
      }}>
        {valueCards.map((card, index) => {
          const Icon = card.icon
          const isHovered = hoveredCard === index
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onTouchStart={() => isMobile && setHoveredCard(index)}
              onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(null), 300)}
              style={{
                background: card.gradient,
                border: `1px solid ${isHovered ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.15)'}`,
                borderRadius: isMobile ? '16px' : '20px',
                padding: isMobile ? '1.5rem' : '2rem',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                opacity: isVisible ? 1 : 0,
                animation: `fadeInUp 0.6s ${index * 0.1}s forwards`,
                boxShadow: isHovered 
                  ? '0 20px 40px rgba(212, 175, 55, 0.2)' 
                  : '0 10px 30px rgba(0, 0, 0, 0.5)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Value badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                padding: '0.4rem 1rem',
                borderRadius: '100px',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: '700',
                color: '#000',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                letterSpacing: '0.02em'
              }}>
                {card.badge}
              </div>

              {/* Icon */}
              <div style={{
                width: isMobile ? '50px' : '60px',
                height: isMobile ? '50px' : '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                <Icon 
                  size={isMobile ? 24 : 28} 
                  color="#D4AF37"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))'
                  }}
                />
              </div>

              {/* Content */}
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.375rem',
                fontWeight: '700',
                color: '#FFD700',
                marginBottom: '0.75rem',
                letterSpacing: '-0.01em'
              }}>
                {card.title}
              </h3>

              <p style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.6',
                margin: 0
              }}>
                {card.description}
              </p>

              {/* "Voor 8 weken" label */}
              <div style={{
                marginTop: '1rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(212, 175, 55, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '600'
              }}>
                Voor 8 weken
              </div>
            </div>
          )
        })}
      </div>

      {/* Total reveal */}
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '2rem' : '3rem',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)',
        borderRadius: isMobile ? '20px' : '24px',
        border: '2px solid rgba(255, 215, 0, 0.2)',
        maxWidth: '600px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        opacity: totalRevealed ? 1 : 0,
        transform: totalRevealed ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 20px 50px rgba(212, 175, 55, 0.15)'
      }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '1rem',
          textDecoration: 'line-through',
          fontWeight: '300'
        }}>
          Normale Kosten: €1597+ Voor Alles
        </div>

        <div style={{
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 4px 30px rgba(255, 215, 0, 0.4))',
          letterSpacing: '-0.02em'
        }}>
          Jouw  Investering: €297*
        </div>

        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(212, 175, 55, 0.8)',
          fontStyle: 'italic',
          fontWeight: '500',
          letterSpacing: '0.02em'
        }}>
          *Je wint alles terug bij succes
        </div>
      </div>





      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.06; }
          50% { transform: translateY(-30px) scale(1.05); opacity: 0.08; }
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
      `}</style>
    </section>
  )
}
