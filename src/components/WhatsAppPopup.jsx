import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'

export default function WhatsAppPopup({ isMobile }) {
  const [showPopup, setShowPopup] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(false)

  // Show popup logic
  useEffect(() => {
    // Clear for testing
    localStorage.removeItem('whatsapp-popup-dismissed')
    
    const dismissed = localStorage.getItem('whatsapp-popup-dismissed')
    if (dismissed) {
      setShowFloatingButton(true)
      return
    }

    console.log('WhatsApp popup: Starting timer...')

    // Show popup after user scrolls past About section
    const handleScroll = () => {
      const aboutSection = document.getElementById('section-about')
      if (aboutSection) {
        const aboutTop = aboutSection.offsetTop
        const scrollPosition = window.scrollY + window.innerHeight
        
        // Trigger when user scrolls past about section
        if (scrollPosition > aboutTop + 200 && !dismissed) {
          console.log('WhatsApp popup: About section scroll triggered')
          setShowPopup(true)
          setIsAnimatingIn(true)
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }

    // Fallback timer (15 seconds)
    const timer = setTimeout(() => {
      if (!dismissed) {
        console.log('WhatsApp popup: Fallback timer triggered')
        setShowPopup(true)
        setIsAnimatingIn(true)
      }
    }, 15000)

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleWhatsAppClick = () => {
    const phoneNumber = "+31631388756"
    const message = "Hoii Kersten! Ik was net op je site en wilde graag een vraag stellen..."
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
    handleClosePopup()
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setShowFloatingButton(true)
    localStorage.setItem('whatsapp-popup-dismissed', 'true')
  }

  const handleFloatingClick = () => {
    const phoneNumber = "+31631388756"
    const message = "Hoii Kersten! Ik zou graag meer informatie over je coaching!"
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`
    
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {/* Personal Message Popup */}
      {showPopup && (
        <>
          {/* Subtle overlay */}
          <div 
            onClick={handleClosePopup}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              opacity: isAnimatingIn ? 1 : 0,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {/* Message Container - Slide in from right */}
          <div style={{
            position: 'fixed',
            bottom: isMobile ? '2rem' : '3rem',
            right: isMobile ? '1rem' : '2rem',
            zIndex: 1001,
            width: isMobile ? '320px' : '400px',
            maxWidth: isMobile ? 'calc(100vw - 2rem)' : '400px',
            opacity: isAnimatingIn ? 1 : 0,
            transform: isAnimatingIn 
              ? 'translateX(0)' 
              : 'translateX(100%)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}>
            
            {/* Personal Message Card - Homepage styling */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '20px',
              padding: isMobile ? '1.5rem' : '2rem',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
            }}>
              
              {/* Close button */}
              <button
                onClick={handleClosePopup}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <X size={16} color="rgba(255, 255, 255, 0.7)" />
              </button>

              {/* Kersten's Photo */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  flexShrink: 0
                }}>
                  <img
                    src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/3_principes_5.png?v=1758796003"
                    alt="Kersten"
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
                          background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%);
                          display: flex;
                          alignItems: center;
                          justifyContent: center;
                          fontSize: 1.5rem;
                          fontWeight: 700;
                          color: #fff;
                        ">K</div>
                      `
                    }}
                  />
                </div>

                {/* Message Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: isMobile ? '1rem 1.1rem' : '1.1rem 1.4rem',
                    position: 'relative',
                    maxWidth: '100%'
                  }}>
                    {/* Speech bubble tail */}
                    <div style={{
                      position: 'absolute',
                      left: '-8px',
                      top: '12px',
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderRight: '8px solid rgba(255, 255, 255, 0.05)'
                    }} />

                    <p style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      color: '#fff',
                      lineHeight: '1.4',
                      margin: '0 0 0.75rem 0',
                      fontWeight: '500',
                      wordWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      Hoii, ik zie dat je op mijn site zit. Laat me je helpen door snel je vragen te beantwoorden via WhatsApp.
                    </p>
                    
                    <p style={{
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      color: 'rgba(16, 185, 129, 0.9)',
                      lineHeight: '1.3',
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      Waar heb jij moeite mee?
                    </p>
                  </div>

                  {/* Kersten label */}
                  <div style={{
                    marginTop: '0.4rem',
                    marginLeft: '1rem'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '600'
                    }}>
                      Kersten
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'rgba(16, 185, 129, 0.8)',
                      marginLeft: '0.5rem'
                    }}>
                      • Online nu
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA Button */}
              <button
                onClick={handleWhatsAppClick}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.3)'
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
                <MessageCircle size={20} />
                <span>Stel mijn vraag</span>
              </button>

              {/* Footer disclaimer */}
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                marginTop: '1rem',
                marginBottom: 0,
                lineHeight: '1.3'
              }}>
                100% gratis • Geen verplichtingen
              </p>
            </div>
          </div>
        </>
      )}

      {/* Floating WhatsApp Button */}
      {showFloatingButton && (
        <button
          onClick={handleFloatingClick}
          style={{
            position: 'fixed',
            bottom: isMobile ? '1.5rem' : '2rem',
            right: isMobile ? '1.5rem' : '2rem',
            width: isMobile ? '56px' : '60px',
            height: isMobile ? '56px' : '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 0 rgba(37, 211, 102, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            animation: 'pulse 2s infinite'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(37, 211, 102, 0.6), 0 0 0 0 rgba(37, 211, 102, 0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 0 rgba(37, 211, 102, 0.7)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <MessageCircle size={isMobile ? 28 : 32} color="#fff" />
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 0 rgba(37, 211, 102, 0.7);
          }
          70% {
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 10px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4), 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
      `}</style>
    </>
  )
}
