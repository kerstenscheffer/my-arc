import React, { useState, useEffect } from 'react'
import { Gift, Star, Sparkles, Crown, Utensils, Users, Trophy, Dumbbell, Pill, PiggyBank } from 'lucide-react'

// Import all bonus components
import BonusMealPrep from '../components/bonuses/BonusMealPrep'
import BonusFitnessFoundations from '../components/bonuses/BonusFitnessFoundations'
import BonusChallenge from '../components/bonuses/BonusChallenge'
import BonusWorkoutArchitect from '../components/bonuses/BonusWorkoutArchitect'
import BonusSupplements from '../components/bonuses/BonusSupplements'
import BonusMoneySaver from '../components/bonuses/BonusMoneySaver'

export default function BonusOffersSection({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [currentBonus, setCurrentBonus] = useState(0)
  const [hoveredButton, setHoveredButton] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  // All bonus offers configuration with Lucide icons
  const bonusOffers = [
    {
      component: BonusMealPrep,
      title: 'Meal Prep Masterplan',
      tagline: 'Nooit Meer Denken',
      color: '#10b981',
      Icon: Utensils
    },
    {
      component: BonusFitnessFoundations,
      title: 'YOUR ARC App',
      tagline: '6 Maanden Premium',
      color: '#3b82f6',
      Icon: Users
    },
    {
      component: BonusChallenge,
      title: '6-Maanden Transformatie Playbook',
      tagline: 'Bewezen Strategie',
      color: '#dc2626',
      Icon: Trophy
    },
    {
      component: BonusWorkoutArchitect,
      title: 'Workout Architect',
      tagline: 'Bouw Je Eigen Plan',
      color: '#f97316',
      Icon: Dumbbell
    },
    {
      component: BonusSupplements,
      title: 'No-Bullshit Supplement Gids',
      tagline: 'Wat Werkt Echt',
      color: '#8b5cf6',
      Icon: Pill
    },
    {
      component: BonusMoneySaver,
      title: 'Slimme Boodschappen Methode',
      tagline: '€30-50/Week Bespaard',
      color: '#F59E0B',
      Icon: PiggyBank
    }
  ]

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
      {/* Subtle background orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-15%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'float 30s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 35s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Main container */}
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
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(59, 130, 246, 0.05) 100%)',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            borderRadius: '100px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(59, 130, 246, 0.1)'
          }}>
            <Sparkles size={isMobile ? 16 : 18} color="#3b82f6" />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: '#3b82f6',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Exclusief Bonuspakket
            </span>
            <Sparkles size={isMobile ? 14 : 16} color="#3b82f6" />
          </div>

          <h2 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontWeight: '900',
            lineHeight: '1',
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
              Maar Dat Is Nog Niet Alles...
            </span>
            <span style={{
              display: 'block',
              color: '#fff'
            }}>
              6 PREMIUM BONUSSEN
            </span>
          </h2>

          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '400',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Alles wat je nodig hebt om te slagen.{' '}
            <span style={{
              color: '#10b981',
              fontWeight: '700'
            }}>
              Gratis erbij.
            </span>
          </p>
        </div>

        {/* Compact Bonus selector buttons */}
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
            const IconComponent = offer.Icon
            return (
              <button
                key={index}
                onClick={() => setCurrentBonus(index)}
                onMouseEnter={() => setHoveredButton(index)}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: currentBonus === index 
                    ? `linear-gradient(135deg, ${offer.color}40 0%, ${offer.color}20 100%)`
                    : hoveredButton === index
                    ? `linear-gradient(135deg, ${offer.color}15 0%, rgba(0, 0, 0, 0.95) 100%)`
                    : 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
                  border: currentBonus === index 
                    ? `3px solid ${offer.color}`
                    : hoveredButton === index
                    ? `2px solid ${offer.color}80`
                    : `2px solid rgba(255, 255, 255, 0.2)`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: currentBonus === index 
                    ? `0 15px 40px ${offer.color}50, inset 0 2px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px ${offer.color}30`
                    : hoveredButton === index
                    ? `0 10px 30px ${offer.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                    : '0 5px 20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  transform: currentBonus === index 
                    ? 'translateY(-4px) scale(1.03)' 
                    : hoveredButton === index 
                    ? 'translateY(-2px) scale(1.01)' 
                    : 'translateY(0)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: isMobile ? '100px' : '110px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = currentBonus === index 
                      ? 'translateY(-4px) scale(1.03)' 
                      : 'translateY(0)'
                  }
                }}
              >
                {/* Active indicator pulse */}
                {currentBonus === index && (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      right: '-2px',
                      bottom: '-2px',
                      background: `linear-gradient(135deg, ${offer.color}, transparent)`,
                      borderRadius: '16px',
                      opacity: 0.3,
                      animation: 'pulse 2s ease-in-out infinite',
                      pointerEvents: 'none'
                    }} />
                    
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-30%',
                      width: '60%',
                      height: '200%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
                      transform: 'rotate(35deg)',
                      animation: 'glide 2s ease-in-out infinite',
                      pointerEvents: 'none'
                    }} />
                  </>
                )}

                {/* Hover glow effect */}
                {hoveredButton === index && currentBonus !== index && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(circle, ${offer.color}20 0%, transparent 70%)`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <IconComponent 
                    size={isMobile ? 24 : 28}
                    color={currentBonus === index 
                      ? offer.color 
                      : hoveredButton === index
                      ? `${offer.color}CC`
                      : 'rgba(255, 255, 255, 0.7)'}
                    style={{
                      filter: currentBonus === index 
                        ? `drop-shadow(0 0 10px ${offer.color}60)` 
                        : 'none',
                      transition: 'all 0.3s ease',
                      transform: currentBonus === index ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                </div>
                
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  fontWeight: '800',
                  color: currentBonus === index 
                    ? offer.color 
                    : hoveredButton === index
                    ? `${offer.color}CC`
                    : 'rgba(255, 255, 255, 0.95)',
                  marginBottom: '0.25rem',
                  transition: 'all 0.3s ease',
                  letterSpacing: '-0.01em',
                  textShadow: currentBonus === index 
                    ? `0 0 20px ${offer.color}60`
                    : 'none',
                  lineHeight: '1.1'
                }}>
                  {offer.title}
                </div>
                
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  color: currentBonus === index 
                    ? offer.color
                    : hoveredButton === index
                    ? `${offer.color}BB`
                    : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  opacity: 0.9
                }}>
                  {offer.tagline}
                </div>

                {/* Active badge */}
                {currentBonus === index && (
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
              </button>
            )
          })}
        </div>

        {/* Current bonus display */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(59, 130, 246, 0.03) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '1.5rem' : '2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle glow inside */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${bonusOffers[currentBonus].color}08 0%, transparent 70%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />
          
          <CurrentBonusComponent isMobile={isMobile} isVisible={isVisible} />
        </div>

        {/* Bottom CTA text */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          textAlign: 'center',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
        }}>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            color: '#fff',
            fontWeight: '700',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em'
          }}>
            Dit Krijg Je Erbij. Gratis. Gewoon Omdat Het Werkt.
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            Niks meer, niks minder. Alles wat je nodig hebt om te slagen.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
      `}</style>
    </section>
  )
}
