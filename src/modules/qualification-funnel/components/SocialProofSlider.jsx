// src/modules/qualification-funnel/components/SocialProofSlider.jsx
import { useState, useEffect } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

// Placeholder transformations - Replace with real data
const transformations = [
  {
    id: 1,
    name: 'Mike, 34',
    quote: 'Van 94kg naar 78kg in 12 weken. Nooit gedacht dat het mogelijk was.',
    stat: '-16kg',
    duration: '12 weken',
    // Replace with actual before/after images
    beforeImage: null,
    afterImage: null
  },
  {
    id: 2,
    name: 'Thomas, 28',
    quote: 'Eindelijk een sixpack. Na jaren falen was dit de doorbraak.',
    stat: '-22% vet',
    duration: '10 weken',
    beforeImage: null,
    afterImage: null
  },
  {
    id: 3,
    name: 'Dennis, 41',
    quote: 'Op mijn 41e in de beste vorm van mijn leven. Leeftijd is geen excuus.',
    stat: '+8kg spier',
    duration: '16 weken',
    beforeImage: null,
    afterImage: null
  },
  {
    id: 4,
    name: 'Kevin, 31',
    quote: 'Geen diëten meer. Geen jojo. Dit is een lifestyle geworden.',
    stat: '-19kg',
    duration: '14 weken',
    beforeImage: null,
    afterImage: null
  }
]

export default function SocialProofSlider({ onNext, isMobile }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % transformations.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const goToPrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + transformations.length) % transformations.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [])

  const current = transformations[currentIndex]

  return (
    <div style={commonStyles.container(isMobile)}>
      
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
          <span style={{
            fontSize: '0.75rem',
            color: funnelTheme.gold,
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Stap 3 van 3
          </span>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
        </div>
        
        {/* Headline */}
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          color: funnelTheme.textPrimary,
          marginBottom: isMobile ? '0.5rem' : '0.75rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
          Dit zijn mannen die{' '}
          <span style={commonStyles.goldText}>JA</span>
          {' '}zeiden:
        </h2>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: funnelTheme.textMuted,
          marginBottom: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center'
        }}>
          Echte resultaten. Echte mensen. Geen excuses.
        </p>
        
        {/* Transformation Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${funnelTheme.borderSubtle}`,
          borderRadius: '0',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          position: 'relative',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease',
          opacity: isAnimating ? 0.5 : 1
        }}>
          
          {/* Gold accent line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: funnelTheme.goldGradient
          }} />
          
          {/* Before/After placeholder */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            {/* Before */}
            <div style={{
              flex: 1,
              aspectRatio: '3/4',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {current.beforeImage ? (
                <img 
                  src={current.beforeImage} 
                  alt="Before"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: funnelTheme.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Before
                </span>
              )}
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '0.5rem' : '0.75rem',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: funnelTheme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: 'rgba(0,0,0,0.7)',
                padding: '0.25rem 0.5rem'
              }}>
                Voor
              </div>
            </div>
            
            {/* After */}
            <div style={{
              flex: 1,
              aspectRatio: '3/4',
              background: 'rgba(212, 175, 55, 0.05)',
              border: `1px solid ${funnelTheme.borderGold}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {current.afterImage ? (
                <img 
                  src={current.afterImage} 
                  alt="After"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: funnelTheme.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  After
                </span>
              )}
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '0.5rem' : '0.75rem',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: funnelTheme.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: 'rgba(0,0,0,0.7)',
                padding: '0.25rem 0.5rem'
              }}>
                Na
              </div>
            </div>
          </div>
          
          {/* Stats row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '2rem' : '3rem',
            marginBottom: isMobile ? '1.25rem' : '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '800',
                color: funnelTheme.gold,
                margin: 0,
                lineHeight: 1
              }}>
                {current.stat}
              </p>
              <p style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: funnelTheme.textMuted,
                margin: 0,
                marginTop: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Resultaat
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '800',
                color: funnelTheme.textPrimary,
                margin: 0,
                lineHeight: 1
              }}>
                {current.duration}
              </p>
              <p style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: funnelTheme.textMuted,
                margin: 0,
                marginTop: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Tijdsduur
              </p>
            </div>
          </div>
          
          {/* Quote */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <Quote 
              size={isMobile ? 16 : 20} 
              color={funnelTheme.gold}
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <div>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: funnelTheme.textSecondary,
                margin: 0,
                lineHeight: '1.5',
                fontStyle: 'italic'
              }}>
                "{current.quote}"
              </p>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: funnelTheme.gold,
                margin: 0,
                marginTop: '0.5rem',
                fontWeight: '600'
              }}>
                — {current.name}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation dots & arrows */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          {/* Prev arrow */}
          <button
            onClick={goToPrev}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderGold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderSubtle
            }}
          >
            <ChevronLeft size={20} color={funnelTheme.textMuted} />
          </button>
          
          {/* Dots */}
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {transformations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: index === currentIndex ? '24px' : '8px',
                  height: '8px',
                  background: index === currentIndex ? funnelTheme.gold : funnelTheme.borderSubtle,
                  border: 'none',
                  borderRadius: '0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
            ))}
          </div>
          
          {/* Next arrow */}
          <button
            onClick={goToNext}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderGold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderSubtle
            }}
          >
            <ChevronRight size={20} color={funnelTheme.textMuted} />
          </button>
        </div>
        
        {/* CTA Button */}
        <button
          onClick={onNext}
          style={{
            ...commonStyles.goldButton(isMobile),
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = funnelTheme.shadowGoldStrong
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = funnelTheme.shadowGold
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Ik wil dit ook
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}
