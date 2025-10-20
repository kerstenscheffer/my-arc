import React, { useState, useEffect } from 'react'
import { Gift, Utensils, Users, Trophy, Dumbbell, Pill, PiggyBank, ArrowRight } from 'lucide-react'

// Import all bonus components from bonuses folder
import BonusMealPrep from './bonuses/BonusMealPrep'
import BonusFitnessFoundations from './bonuses/BonusFitnessFoundations'
import BonusChallenge from './bonuses/BonusChallenge'
import BonusWorkoutArchitect from './bonuses/BonusWorkoutArchitect'
import BonusSupplements from './bonuses/BonusSupplements'
import BonusMoneySaver from './bonuses/BonusMoneySaver'

export default function BonusOffersSection({ isMobile: propIsMobile, onScrollNext, onOpenCalendly }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [currentBonus, setCurrentBonus] = useState(0)
  const [hoveredButton, setHoveredButton] = useState(null)
  const [isCtaHovered, setIsCtaHovered] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  // All 6 bonus offers configuration
  const bonusOffers = [
    {
      component: BonusMealPrep,
      icon: Utensils,
      title: 'Meal Prep Mastery',
      value: '€247',
      description: 'Complete video cursus voor efficiënte meal prep',
      color: '#10b981'
    },
    {
      component: BonusFitnessFoundations,
      icon: Users,
      title: 'YOUR ARC Lifetime',
      value: '€597',
      description: 'Levenslang toegang tot alle updates',
      color: '#E3B505'
    },
    {
      component: BonusChallenge,
      icon: Trophy,
      title: 'Challenge Hacks',
      value: '€147',
      description: 'Gegarandeerd je challenge winnen',
      color: '#dc2626'
    },
    {
      component: BonusWorkoutArchitect,
      icon: Dumbbell,
      title: 'Workout Architect',
      value: '€147',
      description: 'Bouw workouts zoals een pro',
      color: '#f97316'
    },
    {
      component: BonusSupplements,
      icon: Pill,
      title: 'Supplement Guide',
      value: '€397',
      description: 'Welke supplementen echt werken',
      color: '#8b5cf6'
    },
    {
      component: BonusMoneySaver,
      icon: PiggyBank,
      title: 'Budget Methode',
      value: '€547',
      description: 'Gezond eten voor €50/week',
      color: '#F59E0B'
    }
  ]

  const totalValue = bonusOffers.reduce((sum, offer) => {
    return sum + parseInt(offer.value.replace('€', ''))
  }, 0)

  const CurrentBonusComponent = bonusOffers[currentBonus].component

  return (
    <section 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        position: 'relative',
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        overflow: 'hidden'
      }}
    >
      {/* Background effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center top, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-15%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0, 0, 0, 0.9) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 30s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 185, 129, 0.05) 100%)',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            borderRadius: '100px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(16, 185, 129, 0.1)'
          }}>
            <Gift size={isMobile ? 16 : 18} color="#10b981" />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: '#10b981',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Exclusief Voor Jou
            </span>
          </div>

          <h2 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontWeight: '900',
            lineHeight: '0.95',
            marginBottom: '1rem',
            letterSpacing: '-0.03em'
          }}>
            <span style={{
              display: 'block',
              fontSize: isMobile ? '1.5rem' : '2rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Plus...
            </span>
            <span style={{
              display: 'block',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 30px rgba(16, 185, 129, 0.4))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}>
              6 POWER BONUSSEN
            </span>
          </h2>

          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '400',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Ter waarde van{' '}
            <span style={{
              color: '#10b981',
              fontWeight: '800',
              fontSize: isMobile ? '1.5rem' : '2rem',
              textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
            }}>
              €{totalValue}
            </span>
            {' '}volledig{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: '800'
            }}>
              GRATIS
            </span>
            {' '}erbij
          </p>
        </div>

        {/* Bonus selector grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
        }}>
          {bonusOffers.map((offer, index) => {
            const Icon = offer.icon
            const isSelected = currentBonus === index
            const isHovered = hoveredButton === index
            
            return (
              <button
                key={index}
                onClick={() => setCurrentBonus(index)}
                onMouseEnter={() => setHoveredButton(index)}
                onMouseLeave={() => setHoveredButton(null)}
                onTouchStart={() => isMobile && setCurrentBonus(index)}
                style={{
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${offer.color}40 0%, ${offer.color}20 100%)`
                    : isHovered
                    ? `linear-gradient(135deg, ${offer.color}15 0%, rgba(0, 0, 0, 0.95) 100%)`
                    : 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
                  border: isSelected 
                    ? `3px solid ${offer.color}`
                    : isHovered
                    ? `2px solid ${offer.color}80`
                    : `2px solid rgba(255, 255, 255, 0.2)`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isSelected 
                    ? `0 15px 40px ${offer.color}50, inset 0 2px 0 rgba(255, 255, 255, 0.2)`
                    : isHovered
                    ? `0 10px 30px ${offer.color}30`
                    : '0 5px 20px rgba(0, 0, 0, 0.6)',
                  transform: isSelected 
                    ? 'translateY(-4px) scale(1.03)' 
                    : isHovered 
                    ? 'translateY(-2px) scale(1.01)' 
                    : 'translateY(0)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: isMobile ? '100px' : '110px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Active indicator */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: offer.color,
                    boxShadow: `0 0 10px ${offer.color}, 0 0 20px ${offer.color}60`,
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <Icon 
                    size={isMobile ? 24 : 28}
                    color={isSelected ? offer.color : isHovered ? `${offer.color}CC` : 'rgba(255, 255, 255, 0.7)'}
                    style={{
                      filter: isSelected ? `drop-shadow(0 0 10px ${offer.color}60)` : 'none',
                      transition: 'all 0.3s ease',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                </div>
                
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '800',
                  color: isSelected ? offer.color : isHovered ? `${offer.color}CC` : 'rgba(255, 255, 255, 0.95)',
                  marginBottom: '0.25rem',
                  transition: 'all 0.3s ease',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.1'
                }}>
                  {offer.title}
                </div>
                
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: isSelected ? '#10b981' : isHovered ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.5)',
                  fontWeight: '700',
                  transition: 'all 0.3s ease'
                }}>
                  Waarde: {offer.value}
                </div>
              </button>
            )
          })}
        </div>

        {/* Current bonus display */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 185, 129, 0.03) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: isMobile ? '1.5rem' : '2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(16, 185, 129, 0.05)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <CurrentBonusComponent isMobile={isMobile} isVisible={isVisible} />
        </div>

        {/* CTA Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <button
            onClick={onOpenCalendly}
            onMouseEnter={() => setIsCtaHovered(true)}
            onMouseLeave={() => setIsCtaHovered(false)}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
            style={{
              backgroundImage: isCtaHovered 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(16, 185, 129, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
              backgroundSize: '200% 100%',
              backgroundPosition: isCtaHovered ? '0% 50%' : '100% 50%',
              backgroundColor: 'transparent',
              border: isCtaHovered ? '2px solid #10b981' : '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              color: isCtaHovered ? '#fff' : '#10b981',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isCtaHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
              boxShadow: isCtaHovered 
                ? '0 25px 50px rgba(16, 185, 129, 0.4), 0 0 100px rgba(16, 185, 129, 0.3)'
                : '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 60px rgba(16, 185, 129, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden',
              textShadow: isCtaHovered ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 0 20px rgba(16, 185, 129, 0.5)'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-30%',
              width: '50%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transform: 'rotate(35deg)',
              animation: isCtaHovered ? 'glide 2s ease-in-out infinite' : 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <span style={{ position: 'relative', zIndex: 1 }}>
              Claim Deze Bonussen Nu
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

        {/* Total Value Summary */}
        <div style={{
          padding: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderRadius: '24px',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
          backdropFilter: 'blur(30px)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(16, 185, 129, 0.15), inset 0 2px 0 rgba(16, 185, 129, 0.1)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '900',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Alles Bij Elkaar
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '2rem' : '3rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem'
              }}>
                Bonus Waarde
              </div>
              <div style={{
                fontSize: isMobile ? '2rem' : '3rem',
                fontWeight: '900',
                color: '#10b981',
                textShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
              }}>
                €{totalValue}
              </div>
            </div>

            <div style={{
              fontSize: isMobile ? '2rem' : '3rem',
              color: 'rgba(255, 255, 255, 0.3)'
            }}>
              +
            </div>

            <div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem'
              }}>
                YOUR ARC Programma
              </div>
              <div style={{
                fontSize: isMobile ? '2rem' : '3rem',
                fontWeight: '900',
                color: '#10b981',
                textShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
              }}>
                €2.426
              </div>
            </div>

            <div style={{
              fontSize: isMobile ? '2rem' : '3rem',
              color: 'rgba(255, 255, 255, 0.3)'
            }}>
              =
            </div>

            <div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem',
                textDecoration: 'line-through'
              }}>
                €{totalValue + 2426}
              </div>
              <div style={{
                fontSize: isMobile ? '2.5rem' : '4rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textTransform: 'uppercase'
              }}>
                €197/m
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
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
