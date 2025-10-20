import { useState, useEffect } from 'react'
import { ArrowRight, Clock, Users } from 'lucide-react'

export default function FinalPushSection({ isMobile, scrollToCTA, isCurrentSection, openCalendly }) {
  const [showContent, setShowContent] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59 })
  const [spotsLeft] = useState(7)
  
  useEffect(() => {
    if (isCurrentSection) {
      setTimeout(() => setShowContent(true), 300)
    }
  }, [isCurrentSection])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59 }
        }
        return prev
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      background: '#000'
    }}>
      
      <div style={{
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        {/* Final question */}
        <div style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s ease'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: '800',
            color: '#fff',
            lineHeight: '1.1',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            De Vraag Is
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            fontWeight: '300'
          }}>
            Hoelang wacht je nog?
          </p>
        </div>

        {/* Time passing */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 0.5s'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Volgend jaar ben je weer een jaar ouder.<br />
            Met hetzelfde lichaam. Dezelfde excuses.
          </p>
          
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.35rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500'
          }}>
            Of niet.
          </p>
        </div>

        {/* Urgency elements */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 0.8s'
        }}>
          <div style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Clock size={20} color="rgba(255, 255, 255, 0.4)" />
            <div style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '0.25rem'
              }}>
                Prijs stijgt over
              </p>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                color: '#fff',
                fontWeight: '600',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
              </p>
            </div>
          </div>

          <div style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Users size={20} color="rgba(255, 255, 255, 0.4)" />
            <div style={{ textAlign: 'left' }}>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '0.25rem'
              }}>
                Plekken over
              </p>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                color: '#fff',
                fontWeight: '600'
              }}>
                {spotsLeft} van 10
              </p>
            </div>
          </div>
        </div>

        {/* Pricing reveal */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 1s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '0.5rem'
          }}>
            Jouw investering
          </p>
          
          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            €297
          </div>
          
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1.5rem'
          }}>
            Eenmalig. 8 weken. Alles inclusief.
          </p>

          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.3)',
            fontStyle: 'italic'
          }}>
            (Dat is €37 per week. Minder dan je weekend uitgeven.)
          </p>
        </div>

        {/* Two choices */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 1.3s'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1.5rem'
          }}>
            Je hebt 2 opties
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontWeight: '600'
              }}>1.</span>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: '1.5'
              }}>
                Blijf doen wat je deed. Blijf krijgen wat je kreeg.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <span style={{
                color: '#fff',
                fontWeight: '600'
              }}>2.</span>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.5',
                fontWeight: '500'
              }}>
                Neem verantwoordelijkheid. Start vandaag.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 1.5s'
        }}>
          <button
            onClick={openCalendly}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '0',
              padding: isMobile ? '1.25rem 3rem' : '1.5rem 4rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '56px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
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
            <span>Start Nu</span>
            <ArrowRight size={20} />
          </button>
          
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '1rem'
          }}>
            (Intake gesprek binnen 24 uur)
          </p>
        </div>

        {/* Final reminder */}
        <div style={{
          marginTop: isMobile ? '4rem' : '5rem',
          paddingTop: isMobile ? '2rem' : '3rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          opacity: showContent ? 1 : 0,
          transition: 'opacity 1s ease 2s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontStyle: 'italic'
          }}>
            "De beste tijd om te beginnen was gisteren.<br />
            De tweede beste tijd is nu."
          </p>
        </div>
      </div>
    </section>
  )
}
