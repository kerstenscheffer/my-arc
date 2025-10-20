import { useState, useEffect } from 'react'
import { X, Calendar, Info, Check, Euro, Users } from 'lucide-react'

export default function AffiliateCalendlyModal({ 
  isOpen, 
  onClose, 
  isMobile
}) {
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  
  // Affiliate Partner Call URL
  const calendlyUrl = 'https://calendly.com/kerstenscheffer/affiliate-onboarding-met-kersten'

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
        ">💰</div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #FFD700;
          white-space: nowrap;
          animation: celebrateText 1s ease-out;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        ">Partner Call Geboekt!</div>
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
        border: '1px solid rgba(255, 215, 0, 0.25)',
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        height: isMobile ? '85vh' : 'auto',
        maxHeight: isMobile ? '85vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.05)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.05) 100%)',
          padding: isMobile ? '1.25rem' : '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isMobile ? '24px 24px 0 0' : '20px 20px 0 0',
          borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.4rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={isMobile ? 18 : 20} style={{ color: '#FFD700' }} />
              Boek Je Partner Call
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '500'
            }}>
              15 minuten onboarding • Start direct met verdienen
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              color: '#FFD700',
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
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)'
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
          {/* Quick Benefits */}
          <div style={{
            marginBottom: isMobile ? '1rem' : '1.25rem',
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.15)',
            borderRadius: '10px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            {[
              { icon: Euro, text: '€200/klant' },
              { icon: Users, text: '20% korting' },
              { icon: Check, text: 'Direct starten' }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <item.icon size={16} color="#FFD700" />
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '500'
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Success Message */}
          {bookingComplete && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'fadeIn 0.5s ease'
            }}>
              <Check size={20} style={{ color: '#FFD700' }} />
              <p style={{
                color: '#FFD700',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                margin: 0
              }}>
                Top! Je partner call is gepland. Check je mail voor alle details!
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
              border: '1px solid rgba(255, 215, 0, 0.15)',
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
                  border: '3px solid rgba(255, 215, 0, 0.2)',
                  borderTopColor: '#FFD700',
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

          {/* Info Text */}
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
              💡 Na het gesprek krijg je direct je kortingscode en dashboard toegang
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
