import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Check } from 'lucide-react'

export default function CalendlyModal({ 
  isOpen, 
  onClose, 
  isMobile
}) {
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  
  // MY ARC Calendly URL
  const calendlyUrl = 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call'

  // Load and initialize Calendly
  useEffect(() => {
    if (!isOpen) return

    const existingScript = document.querySelector('script[src*="calendly.com"]')
    
    if (existingScript && window.Calendly) {
      setCalendlyLoaded(true)
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
    } else if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      
      script.onload = () => {
        setCalendlyLoaded(true)
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
      
      document.body.appendChild(script)
    }
  }, [isOpen])

  // Listen for booking events
  useEffect(() => {
    if (!isOpen) return

    const handleMessage = (e) => {
      if (e.origin !== 'https://calendly.com') return
      
      if (e.data?.event === 'calendly.event_scheduled') {
        setBookingComplete(true)
        celebrateBooking()
        setTimeout(() => {
          onClose()
          setBookingComplete(false)
        }, 3000)
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

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
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
        ">💪</div>
        <div style="
          position: absolute;
          top: 120%;
          left: 50%;
          transform: translateX(-50%);
          font-size: ${isMobile ? '1.25rem' : '1.5rem'};
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          animation: celebrateText 1.2s ease-out;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          letter-spacing: 0.05em;
        ">GESPREK GEPLAND!</div>
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

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.97)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: '#000',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isMobile ? '20px 20px 0 0' : '0',
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        height: isMobile ? '90vh' : 'auto',
        maxHeight: isMobile ? '90vh' : '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.8)',
        animation: isMobile ? 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease'
      }}>
        
        {/* Header - Confrontational */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: isMobile ? '1.5rem 1.25rem' : '2rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: isMobile ? '20px 20px 0 0' : '0',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
                lineHeight: '1.1'
              }}>
                Laatste Stap
              </h2>
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1rem',
                lineHeight: '1.4'
              }}>
                Kies je moment. Start je transformatie.
              </p>
              
              {/* What happens */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <Clock size={isMobile ? 16 : 18} color="rgba(255, 255, 255, 0.4)" />
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  30 min intake gesprek
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Calendar size={isMobile ? 16 : 18} color="rgba(255, 255, 255, 0.4)" />
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  Binnen 24 uur bevestigd
                </span>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '0',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
                marginLeft: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          
          {/* Success Message */}
          {bookingComplete && (
            <div style={{
              marginBottom: '1.5rem',
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              animation: 'fadeIn 0.5s ease'
            }}>
              <Check size={24} style={{ 
                color: '#fff',
                flexShrink: 0
              }} />
              <div>
                <p style={{
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700',
                  margin: '0 0 0.25rem 0'
                }}>
                  Perfect!
                </p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  margin: 0
                }}>
                  Check je mail voor alle details.
                </p>
              </div>
            </div>
          )}

          {/* Reality check */}
          <div style={{
            marginBottom: isMobile ? '1.5rem' : '2rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderLeft: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.5',
              margin: '0 0 1rem 0'
            }}>
              Je hebt net 20 minuten besteed aan het lezen van deze pagina.
            </p>
            <p style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: '1.5',
              margin: 0
            }}>
              Besteed er nog 30 seconden aan om je gesprek in te plannen.<br />
              Of blijf doen wat je deed.
            </p>
          </div>

          {/* Calendly Widget Container */}
          <div 
            className="calendly-inline-widget"
            data-url={calendlyUrl}
            style={{
              minWidth: '320px',
              height: isMobile ? '500px' : '600px',
              borderRadius: '0',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#000',
              position: 'relative'
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
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '1.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '500'
                }}>
                  Laden...
                </p>
              </div>
            )}
          </div>

          {/* Bottom reminder */}
          <div style={{
            marginTop: isMobile ? '1rem' : '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.4)',
              margin: 0,
              fontStyle: 'italic'
            }}>
              Je verleden kun je niet veranderen.<br />
              Je toekomst wel.
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
