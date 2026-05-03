// ========================================
// 📁 src/lead-magnet/components/LeadModal.jsx
// Lead capture — chat bubble + WhatsApp only
// ========================================
import { useState, useEffect } from 'react'

export default function LeadModal({ isMobile, persona, onClose }) {
  const [showBubble2, setShowBubble2] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShowBubble2(true), 800)
    const t2 = setTimeout(() => setShowButton(true), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '2rem'
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)'
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        borderRadius: isMobile ? '20px 20px 0 0' : '20px',
        background: '#111',
        boxShadow: '0 -10px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header bar */}
        <div style={{
          padding: isMobile ? '1rem 1.25rem' : '1.1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            <img
              src="/coach-modal.png"
              alt="Kersten"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: '700', color: '#fff' }}>Kersten</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>MY ARC Coach</div>
          </div>
          <div style={{
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e'
          }} />
        </div>

        {/* Chat area */}
        <div style={{
          padding: isMobile ? '1.25rem 1rem 1.5rem' : '1.5rem 1.25rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}>
          {/* Bubble 1 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img
                src="/coach-modal.png"
                alt="K"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '16px 16px 16px 4px',
              padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.1rem',
              maxWidth: '85%'
            }}>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: '#fff',
                fontWeight: '500',
                lineHeight: 1.45,
                margin: 0
              }}>
                Hey! 👋 Ik heb je persoonlijke vetverlies plan klaarstaan.
              </p>
            </div>
          </div>

          {/* Bubble 2 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            opacity: showBubble2 ? 1 : 0,
            transform: showBubble2 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease',
            marginLeft: '36px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '16px 16px 16px 4px',
              padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.1rem',
              maxWidth: '85%'
            }}>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: '#fff',
                fontWeight: '500',
                lineHeight: 1.45,
                margin: 0
              }}>
                Stuur me even <strong>"MIJN ROUTE"</strong> via WhatsApp, dan stuur ik 'm je direct toe! 👇
              </p>
            </div>
          </div>

          {/* WhatsApp button */}
          <div style={{
            opacity: showButton ? 1 : 0,
            transform: showButton ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease',
            marginTop: '0.5rem'
          }}>
            <a
              href="https://wa.me/31631388756?text=MIJN%20ROUTE"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 500)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: isMobile ? '1rem' : '1.1rem',
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '0.92rem' : '0.95rem',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(37,211,102,0.4)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Stuur bericht via WhatsApp
            </a>

            <p style={{
              textAlign: 'center',
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.2)',
              fontWeight: '500',
              marginTop: '0.75rem'
            }}>Duurt 2 seconden · Je ontvangt je plan direct</p>
          </div>
        </div>
      </div>
    </div>
  )
}
