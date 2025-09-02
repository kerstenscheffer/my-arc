import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Share, Plus } from 'lucide-react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after 10 seconds on first visit
      const hasSeenPrompt = localStorage.getItem('my-arc-pwa-prompt-seen')
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowInstallPrompt(true)
          localStorage.setItem('my-arc-pwa-prompt-seen', 'true')
        }, 10000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS doesn't support beforeinstallprompt
    if (isIOS && !window.navigator.standalone) {
      const hasSeenIOSPrompt = localStorage.getItem('my-arc-ios-prompt-seen')
      if (!hasSeenIOSPrompt) {
        setTimeout(() => {
          setShowIOSPrompt(true)
          localStorage.setItem('my-arc-ios-prompt-seen', 'true')
        }, 10000)
      }
    }

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ PWA installed')
    } else {
      console.log('❌ PWA installation declined')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setShowIOSPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem('my-arc-prompt-dismissed', Date.now())
  }

  // Don't show if already installed or recently dismissed
  if (isInstalled) return null
  
  const dismissed = localStorage.getItem('my-arc-prompt-dismissed')
  if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : '20px',
        left: isMobile ? '10px' : '20px',
        right: isMobile ? '10px' : 'auto',
        maxWidth: isMobile ? 'auto' : '380px',
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid #10b981',
        padding: '1.25rem',
        boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
        zIndex: 1000,
        animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.7)" />
        </button>

        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Smartphone size={24} color="#fff" />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Install MY ARC
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.4',
              marginBottom: '1rem'
            }}>
              Krijg de volledige app ervaring! Installeer MY ARC op je {isMobile ? 'telefoon' : 'apparaat'} voor snellere toegang en offline features.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={handleInstallClick}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
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
                <Download size={18} />
                Installeer Nu
              </button>
              
              <button
                onClick={handleDismiss}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // iOS Install Instructions
  if (showIOSPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '10px',
        right: '10px',
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid #10b981',
        padding: '1.25rem',
        boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
        zIndex: 1000,
        animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.7)" />
        </button>

        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Smartphone size={20} />
          Install MY ARC op iOS
        </h3>
        
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Share size={16} color="#10b981" />
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              1. Tap op de <strong>Deel</strong> knop onderaan
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={16} color="#10b981" />
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              2. Kies <strong>"Zet op beginscherm"</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Add animations via useEffect to avoid multiple style tags
  useEffect(() => {
    const styleId = 'pwa-installer-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return null
}
