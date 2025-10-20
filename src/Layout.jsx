import { useState, useEffect } from 'react'
import { Menu, X, Users, ChevronRight } from 'lucide-react'
import DatabaseService from './services/DatabaseService'

export default function Layout({ children, currentPage = 'home', onOpenModal }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [spots, setSpots] = useState(null)
  const db = DatabaseService

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load spots data
  useEffect(() => {
    loadSpots()
    
    const spotsService = db.getSpotsService()
    const subscription = spotsService.subscribeToSpots((newData) => {
      setSpots(newData)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSpots = async () => {
    try {
      const spotsService = db.getSpotsService()
      const data = await spotsService.getCurrentSpots()
      setSpots(data)
    } catch (error) {
      console.error('Error loading spots:', error)
    }
  }

  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Over"
        : `${spotsLeft} Plekken Over`
    : "Laden..."

  const menuItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'about', label: 'Over MY ARC', href: '/#transformations' },
    { id: 'program', label: 'Programma', href: '/#program' },
    { id: 'start', label: 'Start Nu', href: '/my-arc', isPrimary: true },
    { id: 'login', label: 'Inloggen', href: '/login' }
  ]

  const handleNavigate = (href) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '')
      const element = document.getElementById(`section-${sectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      window.location.href = href
    }
    setMobileMenuOpen(false)
  }

  const handleAnnouncementClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Announcement clicked', onOpenModal) // Debug log
    if (onOpenModal && typeof onOpenModal === 'function') {
      onOpenModal()
    } else {
      console.error('onOpenModal is not a function:', onOpenModal)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      position: 'relative'
    }}>
      
      {/* Announcement Bar - Top Fixed */}
      <div 
        onClick={handleAnnouncementClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.1) 100%)'
            e.currentTarget.style.transform = 'scale(1.01)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)'
            e.currentTarget.style.transform = 'scale(0.99)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)'
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          
          {/* Main text */}
          <span style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '600',
            color: '#fff',
            letterSpacing: '0.02em',
            pointerEvents: 'none'
          }}>
            Claim 8 weken gratis
          </span>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: isMobile ? '12px' : '14px',
            background: 'rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none'
          }} />

          {/* Spots display with live indicator */}
          {spots?.is_active && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none'
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
                gap: '0.5rem'
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

          {/* Click indicator */}
          <ChevronRight 
            size={isMobile ? 16 : 18} 
            color="rgba(255, 255, 255, 0.6)"
            style={{
              animation: 'gentlePulse 2s ease-in-out infinite',
              pointerEvents: 'none',
              flexShrink: 0
            }}
          />
        </div>
      </div>

      {/* Main Header - Positioned below announcement */}
      <header style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
        position: 'fixed',
        top: isMobile ? '48px' : '56px',
        left: 0,
        right: 0,
        zIndex: 999,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '0.875rem 1rem' : '1rem 2rem',
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                position: 'absolute',
                left: '1rem',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'rgba(255, 255, 255, 0.8)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          {/* Logo */}
          <div 
            onClick={() => handleNavigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <h1 style={{
              fontSize: isMobile ? '1.2rem' : '1.6rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: '#10b981',
              margin: 0,
              letterSpacing: '-0.02em',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1.03)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            >
              MY ARC
            </h1>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  style={{
                    background: item.isPrimary 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
                      : 'transparent',
                    border: '1px solid transparent',
                    color: item.isPrimary 
                      ? '#fff' 
                      : currentPage === item.id 
                        ? 'rgba(16, 185, 129, 0.9)' 
                        : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem',
                    fontWeight: item.isPrimary ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: item.isPrimary 
                      ? '0.6rem 1.4rem' 
                      : '0.5rem 0.9rem',
                    borderRadius: '8px',
                    boxShadow: item.isPrimary 
                      ? '0 4px 15px rgba(16, 185, 129, 0.15)' 
                      : 'none',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (item.isPrimary) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.25)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
                    } else {
                      e.currentTarget.style.color = 'rgba(16, 185, 129, 0.9)'
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                      e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item.isPrimary) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.15)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
                    } else {
                      e.currentTarget.style.color = currentPage === item.id 
                        ? 'rgba(16, 185, 129, 0.9)' 
                        : 'rgba(255, 255, 255, 0.7)'
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.border = '1px solid transparent'
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Mobile Sliding Menu */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? 0 : '-100%',
          width: '280px',
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(16, 185, 129, 0.15)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 998,
          padding: '1.5rem',
          paddingTop: '7rem',
          boxShadow: mobileMenuOpen ? '10px 0 40px rgba(0, 0, 0, 0.4)' : 'none'
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.href)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  background: item.isPrimary 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)' 
                    : currentPage === item.id 
                      ? 'rgba(16, 185, 129, 0.08)' 
                      : 'transparent',
                  border: item.isPrimary 
                    ? 'none' 
                    : currentPage === item.id 
                      ? '1px solid rgba(16, 185, 129, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  color: item.isPrimary 
                    ? '#fff' 
                    : currentPage === item.id 
                      ? 'rgba(16, 185, 129, 0.9)' 
                      : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: item.isPrimary ? '600' : currentPage === item.id ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: item.isPrimary ? '0 4px 15px rgba(16, 185, 129, 0.15)' : 'none'
                }}
                onTouchStart={(e) => {
                  if (!item.isPrimary) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    e.currentTarget.style.color = 'rgba(16, 185, 129, 0.9)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (!item.isPrimary) {
                    setTimeout(() => {
                      e.currentTarget.style.background = currentPage === item.id 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : 'transparent'
                      e.currentTarget.style.color = currentPage === item.id 
                        ? 'rgba(16, 185, 129, 0.9)' 
                        : 'rgba(255, 255, 255, 0.7)'
                    }, 150)
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 997,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Main Content */}
      <main style={{ 
        paddingTop: isMobile ? '104px' : '112px',
        minHeight: 'calc(100vh - 104px)'
      }}>
        {children}
      </main>

      {/* Global Styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        body {
          background: #000;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        
        * {
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes gentlePulse {
          0%, 100% { opacity: 0.6; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}
