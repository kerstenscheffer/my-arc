import React, { useState, useEffect } from 'react'
import { Users, Dumbbell, Utensils, Target, Phone, Smartphone, Brain, Zap, Gift, Plus } from 'lucide-react'

export default function ValueStackComplete({ isMobile: propIsMobile, onScrollNext, onOpenCalendly }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
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

  // 9 hoofdcomponenten van YOUR ARC
  const valueCards = [
    {
      icon: Phone,
      badge: "Waarde: €297",
      title: "6 Coaching Calls Per Maand",
      description: "Persoonlijke begeleiding met gratis bonus calls wanneer nodig.",
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)'
    },
    {
      icon: Dumbbell,
      badge: "Waarde: €197",
      title: "Volledig Persoonlijk Workout Plan",
      description: "Custom training dat perfect in jouw week past. Voor het leven, niet voor 2 weken.",
      gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)'
    },
    {
      icon: Utensils,
      badge: "Waarde: €197",
      title: "Volledig Persoonlijk Maaltijdplan",
      description: "Eten wat je lekker vindt én je doelen haalt. Flexibel en vol te houden.",
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(5, 150, 105, 0.02) 100%)'
    },
    {
      icon: Brain,
      badge: "Waarde: €147",
      title: "Done WITH You Meal Prepping",
      description: "Samen je meal prep systeem opzetten. Ondersteuning, tips & tricks.",
      gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
    },
    {
      icon: Users,
      badge: "Waarde: €97",
      title: "Done WITH You Boodschappen",
      description: "Slimmer, sneller en goedkoper boodschappen doen met begeleiding.",
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%)'
    },
    {
      icon: Smartphone,
      badge: "Waarde: €497",
      title: "Onbeperkt MY ARC App Toegang",
      description: "ALLE features, workouts, meal plans, tracking - alles in één app.",
      gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.07) 0%, rgba(16, 185, 129, 0.03) 100%)'
    },
    {
      icon: Target,
      badge: "Waarde: €297",
      title: "24/7 Accountability Coaching",
      description: "Je coach monitort je progressie bijna dagelijks. Nooit meer alleen.",
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
    },
    {
      icon: Zap,
      badge: "Waarde: €97",
      title: "Persoonlijke Supplementen Advies",
      description: "Op maat advies met kortingen bij partners. Bespaar direct geld.",
      gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)'
    },
    {
      icon: Gift,
      badge: "Waarde: €900+",
      title: "MY ARC Affiliatie Programma",
      description: "Verdien je complete programma terug door vrienden te helpen starten.",
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)'
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
      {/* Floating green orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.04) 0%, transparent 70%)',
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          filter: 'drop-shadow(0 2px 20px rgba(16, 185, 129, 0.3))'
        }}>
          De 9 Onderdelen YOUR ARC Subscriptie
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(16, 185, 129, 0.7)',
          fontWeight: '300',
          letterSpacing: '0.02em'
        }}>
          Alles Wat Je Nodig Hebt Voor Jouw Transformatie
        </p>
      </div>

      {/* Value cards - 3 columns on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '2rem',
        maxWidth: '1100px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        position: 'relative'
      }}>
        {valueCards.map((card, index) => {
          const Icon = card.icon
          const isHovered = hoveredCard === index
          const isLastInRow = !isMobile && (index + 1) % 3 === 0
          const isLastRow = index >= 6
          const showPlusAfter = !isLastInRow && index !== 8
          const showPlusBelow = isMobile && index !== 8
          
          return (
            <React.Fragment key={index}>
              <div
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onTouchStart={() => isMobile && setHoveredCard(index)}
                onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(null), 300)}
                style={{
                  background: card.gradient,
                  border: `1px solid ${isHovered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)'}`,
                  borderRadius: isMobile ? '16px' : '20px',
                  padding: isMobile ? '1.25rem' : '2rem',
                  position: 'relative',
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)',
                  opacity: isVisible ? 1 : 0,
                  animation: `fadeInUp 0.6s ${index * 0.1}s forwards`,
                  boxShadow: isHovered 
                    ? '0 20px 40px rgba(16, 185, 129, 0.2)' 
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
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '100px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: '700',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  letterSpacing: '0.02em'
                }}>
                  {card.badge}
                </div>

                {/* Title with icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.75rem' : '1rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    width: isMobile ? '32px' : '40px',
                    height: isMobile ? '32px' : '40px',
                    minWidth: isMobile ? '32px' : '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    flexShrink: 0
                  }}>
                    <Icon 
                      size={isMobile ? 18 : 22} 
                      color="#10b981"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'
                      }}
                    />
                  </div>
                  
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.25rem',
                    fontWeight: '700',
                    color: '#10b981',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.3'
                  }}>
                    {card.title}
                  </h3>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: isMobile ? '0.8rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {card.description}
                </p>

                {/* Plus symbol - desktop horizontal */}
                {!isMobile && showPlusAfter && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-2rem',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}>
                    <Plus 
                      size={22}
                      style={{
                        color: '#ef4444',
                        filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
                        fontWeight: '900',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </div>

              {/* Plus symbol - mobile vertical */}
              {isMobile && showPlusBelow && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0.5rem 0',
                  opacity: isVisible ? 1 : 0,
                  animation: `fadeInUp 0.6s ${index * 0.1 + 0.05}s forwards`
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                  }}>
                    <Plus 
                      size={20}
                      style={{
                        color: '#ef4444',
                        filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
                        fontWeight: '900',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                      strokeWidth={3}
                    />
                  </div>
                </div>
              )}

              {/* Plus symbol - between rows on desktop */}
              {!isMobile && !isLastRow && index === 2 && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2.75rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}>
                  <Plus 
                    size={22}
                    style={{
                      color: '#ef4444',
                      filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
                      fontWeight: '900',
                      animation: 'pulse 2s ease-in-out infinite',
                      transform: 'rotate(90deg)'
                    }}
                    strokeWidth={3}
                  />
                </div>
              )}
              {!isMobile && !isLastRow && index === 5 && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2.75rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}>
                  <Plus 
                    size={22}
                    style={{
                      color: '#ef4444',
                      filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
                      fontWeight: '900',
                      animation: 'pulse 2s ease-in-out infinite',
                      transform: 'rotate(90deg)'
                    }}
                    strokeWidth={3}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Total value reveal */}
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '2rem' : '3rem',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: isMobile ? '20px' : '24px',
        border: '2px solid rgba(16, 185, 129, 0.2)',
        maxWidth: '600px',
        width: '100%',
        backdropFilter: 'blur(20px)',
        opacity: totalRevealed ? 1 : 0,
        transform: totalRevealed ? 'scale(1)' : 'scale(0.9)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '1rem',
          textDecoration: 'line-through',
          fontWeight: '300'
        }}>
          Totale Waarde: €2.426 Per Maand
        </div>

        <div style={{
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          filter: 'drop-shadow(0 4px 30px rgba(16, 185, 129, 0.4))',
          letterSpacing: '-0.02em'
        }}>
          Jouw Prijs: €197/maand
        </div>

        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(16, 185, 129, 0.8)',
          fontStyle: 'italic',
          fontWeight: '500',
          letterSpacing: '0.02em'
        }}>
          92% korting op de echte waarde
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
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  )
}
