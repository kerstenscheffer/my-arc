import React, { useState, useEffect } from 'react'

export default function ValueStackComplete({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [totalRevealed, setTotalRevealed] = useState(false)
  const [visibleCard, setVisibleCard] = useState(-1)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    const totalTimer = setTimeout(() => setTotalRevealed(true), 1600)
    
    // Progressive card reveal
    const cardTimers = []
    for (let i = 0; i <= 3; i++) {
      cardTimers.push(
        setTimeout(() => setVisibleCard(i), 400 + (i * 200))
      )
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      clearTimeout(totalTimer)
      cardTimers.forEach(clearTimeout)
    }
  }, [])

  const valueCards = [
    {
      photoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', // Coaching/gym foto
      badge: "Minimaal 6 maanden",
      title: "Till The Goal Begeleiding",
      description: "We stoppen pas als jij je doel hebt gehaald. Geen tijdslimiet, alleen resultaten."
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', // Phone/contact foto
      badge: "12+ calls",
      title: "Structureel Contact",
      description: "Minimaal 2x per maand contact. Bijsturen, motiveren, blijven optimaliseren."
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400', // App/mobile foto
      badge: "6+ maanden",
      title: "Complete MY ARC Toegang",
      description: "Workout tracking, voeding, progressie, data inzichten. Alles in één systeem."
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400', // Success/trophy foto
      badge: "Tot €300 terug",
      title: "Win Your Money Back",
      description: "Haal je doel + voldoe aan voorwaarden = €150 cash + €150 credit terug."
    }
  ]

  return (
    <section 
      style={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Subtle red ambient */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.03) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
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
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(239, 68, 68, 0.7)',
          marginBottom: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: '500'
        }}>
          Wat je krijgt
        </p>

        <h2 style={{
          fontSize: isMobile ? '2rem' : '3.5rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          Voor 6+ Maanden
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '300',
          letterSpacing: '0.02em'
        }}>
          Van Momentum Naar Lifetime Resultaten
        </p>
      </div>

      {/* Value cards with photos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '1.5rem' : '2rem',
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem'
      }}>
        {valueCards.map((card, index) => {
          const isHovered = hoveredCard === index
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onTouchStart={() => isMobile && setHoveredCard(index)}
              onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(null), 300)}
              style={{
                background: 'transparent',
                border: `1px solid ${isHovered ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.15)'}`,
                borderRadius: '0',
                padding: isMobile ? '1rem' : '2rem',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                opacity: visibleCard >= index ? 1 : 0,
                animation: visibleCard >= index ? 'none' : 'fadeInUp 0.6s forwards',
                animationDelay: `${index * 0.2}s`,
                boxShadow: isHovered 
                  ? '0 10px 30px rgba(220, 38, 38, 0.1)' 
                  : 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                flexDirection: 'row',
                gap: isMobile ? '0.75rem' : '1.5rem',
                alignItems: 'flex-start'
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: isMobile ? '10px' : '20px',
                background: '#dc2626',
                padding: isMobile ? '0.3rem 0.75rem' : '0.4rem 1rem',
                borderRadius: '0',
                fontSize: isMobile ? '0.65rem' : '0.8rem',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                {card.badge}
              </div>

              {/* Photo - larger, on the left */}
              <div style={{
                width: isMobile ? '70px' : '120px',
                height: isMobile ? '70px' : '120px',
                borderRadius: '0',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(220, 38, 38, 0.2)',
                background: '#0a0a0a'
              }}>
                <img 
                  src={card.photoUrl}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(100%) brightness(0.7)'
                  }}
                />
              </div>

              {/* Content - on the right */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.375rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: isMobile ? '0.5rem' : '0.75rem',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.2'
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: isMobile ? '0.8rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.5',
                  margin: 0,
                  fontWeight: '300',
                  flex: 1
                }}>
                  {card.description}
                </p>

                {/* Bottom label */}
                <div style={{
                  marginTop: isMobile ? '0.5rem' : '1rem',
                  paddingTop: isMobile ? '0.5rem' : '1rem',
                  borderTop: '1px solid rgba(220, 38, 38, 0.1)',
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  color: 'rgba(239, 68, 68, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '600'
                }}>
                  Inclusief
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total reveal */}
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '2rem' : '3rem',
        background: 'transparent',
        borderRadius: '0',
        border: '1px solid rgba(220, 38, 38, 0.2)',
        maxWidth: '600px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        opacity: totalRevealed ? 1 : 0,
        transform: totalRevealed ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginBottom: '1rem',
          textDecoration: 'line-through',
          fontWeight: '300',
          letterSpacing: '0.05em'
        }}>
          Normale Waarde: €3000+ Voor 6 Maanden
        </div>

        <div style={{
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          fontWeight: '900',
          color: '#dc2626',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          textShadow: '0 0 40px rgba(220, 38, 38, 0.2)'
        }}>
          €550-€600
        </div>

        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(239, 68, 68, 0.7)',
          fontStyle: 'italic',
          fontWeight: '400',
          letterSpacing: '0.02em'
        }}>
          *Win tot €300 terug bij succes
        </div>
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
      `}</style>
    </section>
  )
}
