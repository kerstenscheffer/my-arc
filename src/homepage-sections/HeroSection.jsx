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
        gap: isMobile ? '4rem' : '6rem',
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
            Snel & Zeker fit worden?
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
            Krijg hulp van een coach die 6+ jaar actief is in de fitness industrie.
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

        {/* Right: Simple Kersten representation */}
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'flex-end',
          opacity: visibleElements >= 3 ? 1 : 0,
          transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.6s'
        }}>
          <div style={{
            width: isMobile ? '240px' : '320px',
            height: isMobile ? '300px' : '400px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(59, 130, 246, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Kersten Photo */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
              <div style={{
                width: isMobile ? '200px' : '280px',
                height: isMobile ? '200px' : '280px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Ontwerp_zonder_titel_48.png?v=1757850545"
                  alt="Kersten - Personal Coach"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    // Fallback to circle with K if image fails to load
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `
                      <div style="
                        width: 100px;
                        height: 100px;
                        borderRadius: 50%;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%);
                        display: flex;
                        alignItems: center;
                        justifyContent: center;
                        fontSize: 2.2rem;
                        fontWeight: 800;
                        color: #fff;
                      ">K</div>
                    `
                  }}
                />
              </div>
              
              <div style={{
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.25rem'
                }}>
                  Kersten
                </p>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '400'
                }}>
                  Jouw Personal Coach
                </p>
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
