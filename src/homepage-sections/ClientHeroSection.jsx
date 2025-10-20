import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ClientHeroSection({ isMobile, onScrollNext }) {
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 3; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 600)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      position: 'relative',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)'
    }}>
      
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.02) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1000px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
        gap: isMobile ? '2.5rem' : '3rem',
        alignItems: 'center'
      }}>
        
        {/* Left: Content */}
        <div style={{
          textAlign: isMobile ? 'center' : 'left'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            letterSpacing: '-0.02em',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Jouw Beste Shape Ooit Bereiken?
          </h1>
          
          {/* Subtitle */}
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.5',
            marginBottom: isMobile ? '3rem' : '4rem',
            fontWeight: '400',
            opacity: visibleElements >= 1 ? 1 : 0,
            transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.2s'
          }}>
            Krijg hulp van een coach die 6+ jaar actief is in bodybuilding en endurance training.
          </p>

          {/* CTA Button */}
          <button
            onClick={onScrollNext}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '1rem 3.5rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)',
              opacity: visibleElements >= 2 ? 1 : 0,
              transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '0.4s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.25)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
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
          >
            <span>Laat me zien hoe</span>
            <ChevronDown size={isMobile ? 18 : 20} />
          </button>
        </div>

        {/* Right: Coach Profile */}
        <div style={{
          opacity: visibleElements >= 3 ? 1 : 0,
          transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.6s',
          display: 'flex',
          justifyContent: 'center'
        }}>
          
          {/* Single Coach Image */}
          <div style={{
            position: 'relative',
            maxWidth: isMobile ? '280px' : '320px',
            width: '100%'
          }}>
            {/* Coach Label - Glassmorphism */}
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(59, 130, 246, 0.8) 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              color: '#fff',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              zIndex: 2,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}>
              COACH KERSTEN
            </div>
            
            <div style={{
              width: '100%',
              aspectRatio: '3/4',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              position: 'relative'
            }}>
              <img
                src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/3_principes_7.png?v=1758820160"
                alt="Coach Kersten"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentNode.innerHTML = `
                    <div style="
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.6) 100%);
                      display: flex;
                      alignItems: center;
                      justifyContent: center;
                      fontSize: 2rem;
                      fontWeight: 700;
                      color: #fff;
                    ">K</div>
                  `
                }}
              />
              
              {/* Specialiteiten Overlay - Glassmorphism */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(15px)',
                border: '1px solid transparent',
                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.7) 100%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                borderRadius: '0 0 18px 18px'
              }}>
                <div style={{
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.5rem',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Specialiteiten
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    flexWrap: 'wrap'
                  }}>
                    {['Spieropbouw', 'Voeding', 'Mindset'].map((specialty) => (
                      <span key={specialty} style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        color: '#fff',
                        fontWeight: '600',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)',
                        whiteSpace: 'nowrap'
                      }}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '2rem' : '3rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: 0.3,
        animation: 'gentlePulse 3s infinite'
      }}>
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: '500'
        }}>
          Scroll
        </span>
        <ChevronDown 
          size={14} 
          color="rgba(255, 255, 255, 0.4)"
        />
      </div>

      <style>{`
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </section>
  )
}
