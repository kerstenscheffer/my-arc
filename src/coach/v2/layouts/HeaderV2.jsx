// src/coach/v2/layouts/HeaderV2.jsx
import { Menu, X, LogOut, Bell } from 'lucide-react'

export default function HeaderV2({ 
  user, 
  currentView, 
  currentTheme, 
  isMobile, 
  mobileMenuOpen, 
  setMobileMenuOpen, 
  onLogout 
}) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${currentTheme.borderActive}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), ${currentTheme.glow}`
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '1.25rem 2rem',
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              color: '#fff'
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        
        {/* Logo */}
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.3rem' : '1.75rem',
            fontWeight: '900',
            backgroundImage: currentTheme.gradient,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-0.02em',
            display: 'inline-block'
          }}>
            MY ARC COACH V2
          </h1>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
            fontWeight: '500'
          }}>
            Professional Training System
          </p>
        </div>
        
        {/* Desktop Actions */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <Bell size={20} />
            </button>
            
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                margin: 0
              }}>
                {user?.email}
              </p>
            </div>
            
            <button
              onClick={onLogout}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <LogOut size={18} />
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
