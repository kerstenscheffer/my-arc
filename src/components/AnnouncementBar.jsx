import { useState, useEffect } from 'react'
import { Users, Menu, X } from 'lucide-react'
import DatabaseService from '../services/DatabaseService'

export default function AnnouncementBar({ isMobile, onOpenModal }) {
  const [spots, setSpots] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const db = DatabaseService

  useEffect(() => {
    // Load spots data
    loadSpots()
    
    // Subscribe to real-time updates
    const spotsService = db.getSpotsService()
    const subscription = spotsService.subscribeToSpots((newData) => {
      setSpots(newData)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSpots = async () => {
    const spotsService = db.getSpotsService()
    const data = await spotsService.getCurrentSpots()
    setSpots(data)
  }

  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Over"
        : `${spotsLeft} Plekken Over`
    : "Laden..."

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const handleLoginClick = (e) => {
    e.stopPropagation()
    window.location.href = '/login'
  }

  const handleAnnouncementClick = (e) => {
    // Don't trigger modal if clicking on menu area
    if (e.target.closest('.hamburger-menu')) return
    onOpenModal()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
      backdropFilter: 'blur(12px)',
      border: 'none',
      borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
    onClick={handleAnnouncementClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.1) 100%)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
    }}
    onTouchStart={(e) => {
      if (isMobile) {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)'
      }
    }}
    onTouchEnd={(e) => {
      if (isMobile) {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
      }
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        position: 'relative'
      }}>
        
        {/* Hamburger Menu */}
        <div className="hamburger-menu" style={{ position: 'relative' }}>
          <button
            onClick={handleMenuClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            {menuOpen ? (
              <X size={isMobile ? 18 : 20} color="#fff" />
            ) : (
              <Menu size={isMobile ? 18 : 20} color="#fff" />
            )}
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              minWidth: isMobile ? '140px' : '160px',
              overflow: 'hidden'
            }}>
              <button
                onClick={handleLoginClick}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  e.currentTarget.style.color = '#10b981'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#fff'
                }}
              >
                Login
              </button>
            </div>
          )}
        </div>

        {/* Content - flex grow to fill space */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.5rem' : '0.75rem',
          flex: 1
        }}>
          {/* Main text */}
          <span style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '600',
            color: '#fff',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap'
          }}>
            Claim 8 weken gratis
          </span>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: isMobile ? '12px' : '14px',
            background: 'rgba(255, 255, 255, 0.3)',
            flexShrink: 0
          }} />

          {/* Spots display with live indicator */}
          {spots?.is_active && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users 
                size={isMobile ? 14 : 16} 
                color={spotsLeft <= 3 ? '#ef4444' : 'rgba(16, 185, 129, 0.8)'} 
              />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: spotsLeft <= 3 ? '700' : '600',
                color: spotsLeft <= 3 ? '#ef4444' : '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}>
                {spotsText}
                {spotsLeft > 0 && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: spotsLeft <= 3 ? '#ef4444' : '#10b981',
                      animation: 'blink 1.5s infinite'
                    }} />
                    <span style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      fontWeight: '600',
                      opacity: 0.8,
                      letterSpacing: '0.05em'
                    }}>
                      LIVE
                    </span>
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
