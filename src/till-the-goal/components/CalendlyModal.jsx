import { useState, useEffect } from 'react'
import { X, Calendar, Info, Check } from 'lucide-react'

export default function CalendlyModal({ 
  isOpen, 
  onClose, 
  isMobile
}) {
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  
  // Fixed Calendly URL
  const calendlyUrl = 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call'

  // Load and initialize Calendly
  useEffect(() => {
    if (!isOpen) return

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="calendly.com"]')
    
    if (existingScript && window.Calendly) {
      // Script already loaded, just initialize
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
      // Load script for first time
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      
      script.onload = () => {
        setCalendlyLoaded(true)
        
        // Initialize after script loads
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
      
      script.onerror = (error) => {
        console.error('Failed to load Calendly:', error)
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
        }, 2000)
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

  // Celebration animation
  const celebrateBooking = () => {
    const celebration = document.createElement('div')
    celebration.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100000;
        animation: celebrateScale 1s ease-out;
        pointer-events: none;
      ">
        <div style="
          font-size: 100px;
          animation: celebrateRotate 1s ease-out;
        ">🏆</div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #ef4444;
          white-space: nowrap;
          animation: celebrateText 1s ease-out;
          text-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
        ">Gesprek Gepland!</div>
      </div>
      <style>
        @keyframes celebrateScale {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes celebrateRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes celebrateText {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(20px); }
          100% { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        }
      </style>
    `
    document.body.appendChild(celebration)
    setTimeout(() => celebration.remove(), 1500)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
        borderRadius: isMobile ? '24px 24px 0 0' : '20px',
        border: '1px solid rgba(220, 38, 38, 0.25)',
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        height: isMobile ? '85vh' : 'auto',
        maxHeight: isMobile ? '85vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(220, 38, 38, 0.05)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(220, 38, 38, 0.05) 100%)',
          padding: isMobile ? '1.25rem' : '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isMobile ? '24px 24px 0 0' : '20px 20px 0 0',
          borderBottom: '1px solid rgba(220, 38, 38, 0.15)',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.4rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={isMobile ? 18 : 20} style={{ color: '#ef4444' }} />
              Plan Je Vervolgtraject
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '500'
            }}>
              Till The Goal Intake Gesprek
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(220, 38, 38, 0.05) 100%)'
            }}
          >
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* Info Box */}
          <div style={{
            marginBottom: isMobile ? '1rem' : '1.25rem',
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(153, 27, 27, 0.02) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.15)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <Info size={isMobile ? 16 : 18} style={{
              color: '#ef4444',
              flexShrink: 0
            }} />
            <div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                lineHeight: '1.4',
                margin: 0
              }}>
                Bespreek je vervolgtraject • Direct bevestiging • Week 6-8 timing
              </p>
            </div>
          </div>

          {/* Success Message */}
          {bookingComplete && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'fadeIn 0.5s ease'
            }}>
              <Check size={20} style={{ color: '#ef4444' }} />
              <p style={{
                color: '#ef4444',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                margin: 0
              }}>
                Perfect! Je gesprek is gepland. Check je mail voor de details!
              </p>
            </div>
          )}

          {/* Calendly Widget Container */}
          <div 
            className="calendly-inline-widget"
            data-url={calendlyUrl}
            style={{
              minWidth: '320px',
              height: isMobile ? '450px' : '600px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              background: '#0a0a0a',
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
                  border: '3px solid rgba(220, 38, 38, 0.2)',
                  borderTopColor: '#ef4444',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '1rem',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  Kalender laden...
                </p>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div style={{
            marginTop: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '0.6rem' : '0.75rem',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              💡 Tip: Scroll voor meer tijdslots • Kies wat het beste past
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
