// ========================================
// 📁 src/lead-magnet/components/floating-coach/CalendlyModal.jsx
// Fullscreen Calendly booking modal — premium styling
// ========================================
import { useState, useEffect } from 'react'
import { GOLD, GOLD_DARK, XIcon } from './constants'

// Inline icons
const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
)
const GiftSmallIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
)

export default function CalendlyModal({ isMobile, onClose, calendlyUrl, name }) {
  const [bookingComplete, setBookingComplete] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fullUrl = `${calendlyUrl}?hide_gdpr_banner=1&background_color=0a0a0a&text_color=ffffff&primary_color=ffba09&name=${encodeURIComponent(name || '')}`

  // Load Calendly script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="calendly.com"]')
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      script.onload = () => setTimeout(() => setLoaded(true), 1500)
      document.body.appendChild(script)
    } else {
      setTimeout(() => setLoaded(true), 1500)
    }
  }, [])

  // Listen for booking completion + escape key
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== 'https://calendly.com') return
      if (e.data?.event === 'calendly.event_scheduled') {
        setBookingComplete(true)
        setTimeout(() => onClose(), 3000)
      }
    }
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('message', handleMessage)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  // ══════ SUCCESS STATE ══════
  if (bookingComplete) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          textAlign: 'center', padding: '2rem',
          animation: 'scaleIn 0.4s ease',
          maxWidth: '340px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)',
            border: '2px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircleIcon size={32} />
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.2rem' : '1.4rem',
            fontWeight: '800', color: '#fff',
            margin: '0 0 0.5rem'
          }}>
            Je call is geboekt!
          </h3>
          <p style={{
            fontSize: isMobile ? '0.82rem' : '0.88rem',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: '500', lineHeight: 1.5, margin: '0 0 1rem'
          }}>
            Check je mail voor de bevestiging. Ik spreek je snel!
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.6rem 1rem',
            background: 'rgba(255,186,9,0.06)',
            border: '1px solid rgba(255,186,9,0.1)',
            borderRadius: '10px'
          }}>
            <GiftSmallIcon size={14} />
            <span style={{
              fontSize: isMobile ? '0.72rem' : '0.76rem',
              color: GOLD, fontWeight: '700'
            }}>
              Eat Better, Spend Less systeem staat klaar
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ══════ MAIN MODAL ══════
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : '1rem',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        borderRadius: isMobile ? '20px 20px 0 0' : '16px',
        border: '1px solid rgba(255,186,9,0.1)',
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        height: isMobile ? '90vh' : 'auto',
        maxHeight: isMobile ? '90vh' : '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' : 'scaleIn 0.3s ease',
        overflow: 'hidden'
      }}>
        {/* Gold accent line */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`
        }} />

        {/* Header with coach photo */}
        <div style={{
          padding: isMobile ? '0.85rem 1.1rem' : '1rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(255,186,9,0.2)'
            }}>
              <img src="/coach-modal.png" alt="Kersten"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '0.92rem' : '1rem',
                fontWeight: '800', color: '#fff', margin: 0
              }}>
                Kies een moment
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: isMobile ? '0.68rem' : '0.72rem',
                fontWeight: '500', margin: '0.1rem 0 0'
              }}>
                15 min · gratis · vrijblijvend
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', minWidth: '44px', minHeight: '44px'
          }}>
            <XIcon size={16} />
          </button>
        </div>

        {/* Calendly embed */}
        <div style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div
            className="calendly-inline-widget"
            data-url={fullUrl}
            style={{
              minWidth: '320px',
              height: isMobile ? '520px' : '600px',
              background: '#0a0a0a',
              position: 'relative'
            }}
          >
            {!loaded && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)', textAlign: 'center',
                zIndex: 1
              }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '2.5px solid rgba(255,186,9,0.1)',
                  borderTopColor: GOLD, borderRadius: '50%',
                  animation: 'spin 1s linear infinite', margin: '0 auto'
                }} />
                <p style={{
                  color: 'rgba(255,255,255,0.25)',
                  marginTop: '0.75rem', fontSize: '0.78rem', fontWeight: '500'
                }}>Kalender laden...</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar — bonus reminder */}
        <div style={{
          padding: isMobile ? '0.65rem 1.1rem' : '0.75rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          flexShrink: 0
        }}>
          <GiftSmallIcon size={13} />
          <span style={{
            fontSize: isMobile ? '0.68rem' : '0.72rem',
            color: 'rgba(255,255,255,0.35)', fontWeight: '600'
          }}>
            Bonus: <span style={{ color: GOLD, fontStyle: 'italic', fontWeight: '700' }}>Eat Better, Spend Less</span> bij starten deze week
          </span>
        </div>
      </div>
    </div>
  )
}
