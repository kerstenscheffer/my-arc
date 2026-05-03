// src/modules/qualification-funnel/components/CalendlyStep.jsx
import { useState, useEffect } from 'react'
import { Calendar, Clock, Check, ArrowLeft } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

export default function CalendlyStep({ onNext, onBack, isMobile }) {
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  
  // MY ARC Calendly URL
  const calendlyUrl = 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call'

  // Load Calendly script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="calendly.com"]')
    
    if (existingScript && window.Calendly) {
      setCalendlyLoaded(true)
      initCalendly()
    } else if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      
      script.onload = () => {
        setCalendlyLoaded(true)
        initCalendly()
      }
      
      document.body.appendChild(script)
    }
  }, [])

  const initCalendly = () => {
    setTimeout(() => {
      const widget = document.querySelector('.calendly-inline-widget')
      if (widget && window.Calendly) {
        try {
          window.Calendly.initInlineWidget({
            url: calendlyUrl,
            parentElement: widget,
            prefill: {},
            utm: {}
          })
        } catch (error) {
          console.error('Calendly init error:', error)
        }
      }
    }, 200)
  }

  // Listen for booking completion
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== 'https://calendly.com') return
      
      if (e.data?.event === 'calendly.event_scheduled') {
        setBookingComplete(true)
        celebrateBooking()
        setTimeout(() => {
          onNext({ booked: true })
        }, 2500)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onNext])

  // Success celebration
  const celebrateBooking = () => {
    const celebration = document.createElement('div')
    celebration.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100000;
        animation: celebrateScale 1.2s ease-out;
        pointer-events: none;
      ">
        <div style="
          font-size: ${isMobile ? '60px' : '80px'};
          animation: celebrateRotate 1.2s ease-out;
          filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
        ">💪</div>
        <div style="
          position: absolute;
          top: 120%;
          left: 50%;
          transform: translateX(-50%);
          font-size: ${isMobile ? '1.25rem' : '1.5rem'};
          font-weight: 800;
          background: linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
          animation: celebrateText 1.2s ease-out;
          text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
          letter-spacing: 0.05em;
        ">GEPLAND!</div>
      </div>
      <style>
        @keyframes celebrateScale {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes celebrateRotate {
          0% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes celebrateText {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          60% { opacity: 0; }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      </style>
    `
    document.body.appendChild(celebration)
    setTimeout(() => celebration.remove(), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: funnelTheme.black,
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        borderBottom: `1px solid ${funnelTheme.borderSubtle}`,
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: funnelTheme.textMuted,
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              padding: 0,
              marginBottom: isMobile ? '1.25rem' : '1.5rem',
              transition: 'color 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = funnelTheme.gold}
            onMouseLeave={(e) => e.currentTarget.style.color = funnelTheme.textMuted}
          >
            <ArrowLeft size={16} />
            Terug
          </button>
          
          {/* Title */}
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '800',
            color: funnelTheme.textPrimary,
            marginBottom: '0.75rem',
            lineHeight: '1.2',
            letterSpacing: '-0.02em'
          }}>
            Plan je{' '}
            <span style={commonStyles.goldText}>
              gratis
            </span>
            {' '}strategie call
          </h1>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: funnelTheme.textSecondary,
            marginBottom: isMobile ? '1rem' : '1.25rem',
            lineHeight: '1.5'
          }}>
            30 minuten. Geen bullshit. We kijken of MY ARC bij je past.
          </p>
          
          {/* Info badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(212, 175, 55, 0.1)',
              border: `1px solid ${funnelTheme.borderGold}`
            }}>
              <Clock size={14} color={funnelTheme.gold} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: funnelTheme.gold,
                fontWeight: '600'
              }}>
                30 min intake
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${funnelTheme.borderSubtle}`
            }}>
              <Calendar size={14} color={funnelTheme.textMuted} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: funnelTheme.textSecondary,
                fontWeight: '500'
              }}>
                Video call
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          
          {/* Success message */}
          {bookingComplete && (
            <div style={{
              marginBottom: '1.5rem',
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: 'rgba(212, 175, 55, 0.1)',
              border: `1px solid ${funnelTheme.borderGold}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              animation: 'fadeIn 0.5s ease'
            }}>
              <Check size={24} color={funnelTheme.gold} />
              <div>
                <p style={{
                  color: funnelTheme.gold,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700',
                  margin: '0 0 0.25rem 0'
                }}>
                  Perfect!
                </p>
                <p style={{
                  color: funnelTheme.textSecondary,
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  margin: 0
                }}>
                  Check je mail voor alle details.
                </p>
              </div>
            </div>
          )}
          
          {/* Reality check quote */}
          <div style={{
            marginBottom: isMobile ? '1.5rem' : '2rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderLeft: `2px solid ${funnelTheme.borderGold}`
          }}>
            <p style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: funnelTheme.textSecondary,
              lineHeight: '1.5',
              margin: 0,
              fontStyle: 'italic'
            }}>
              "Je verleden kun je niet veranderen. Je toekomst wel."
            </p>
          </div>
          
          {/* Calendly Widget */}
          <div 
            className="calendly-inline-widget"
            data-url={calendlyUrl}
            style={{
              minWidth: '320px',
              height: isMobile ? '550px' : '650px',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              background: funnelTheme.black,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Loading State */}
            {!calendlyLoaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: `2px solid ${funnelTheme.borderSubtle}`,
                  borderTopColor: funnelTheme.gold,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
                <p style={{
                  color: funnelTheme.textMuted,
                  marginTop: '1.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '500'
                }}>
                  Laden...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
