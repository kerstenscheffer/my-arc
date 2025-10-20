// src/components/PWAInstaller.jsx
import { useState, useEffect } from 'react'
import { Download, X, Smartphone, RefreshCw } from 'lucide-react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true
    setIsInstalled(isStandalone)
    
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show install prompt after 30 seconds on first visit
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
      if (!hasSeenPrompt && !isStandalone) {
        setTimeout(() => {
          setShowInstallPrompt(true)
          localStorage.setItem('pwa-prompt-seen', 'true')
        }, 30000)
      }
    }
    
    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }
    
    // Listen for service worker updates
    const handleMessage = (event) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        setShowUpdatePrompt(true)
      }
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    navigator.serviceWorker?.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }
  
  const handleUpdateClick = () => {
    window.location.reload()
  }
  
  // Don't show if already installed
  if (isInstalled) return null
  
  // iOS specific prompt
  if (isIOS && showInstallPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        maxWidth: isMobile ? '90%' : '400px',
        width: '100%',
        zIndex: 1000,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.1)',
        animation: 'slideUp 0.5s ease-out'
      }}>
        <button
          onClick={() => setShowInstallPrompt(false)}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.25rem',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s'
          }}
        >
          <X size={16} />
        </button>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <Smartphone size={24} color="#10b981" style={{ marginTop: '0.25rem' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.125rem',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Installeer MY ARC
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.875rem' : '0.9rem',
              lineHeight: '1.5',
              marginBottom: '0.75rem'
            }}>
              Tik op <span style={{ color: '#10b981' }}>Delen</span> en dan <span style={{ color: '#10b981' }}>Zet op beginscherm</span> voor de beste ervaring
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Android/Desktop install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '80px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        maxWidth: isMobile ? '90%' : '400px',
        width: '100%',
        zIndex: 1000,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.1)',
        animation: 'slideUp 0.5s ease-out'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <Download size={24} color="#10b981" style={{ marginTop: '0.25rem' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.125rem',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Installeer MY ARC App
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.875rem' : '0.9rem',
              lineHeight: '1.5',
              marginBottom: '1rem'
            }}>
              Krijg snelle toegang en offline functionaliteit
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleInstallClick}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Installeer
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
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
  
  // Update prompt
  if (showUpdatePrompt) {
    return (
      <div style={{
        position: 'fixed',
        top: isMobile ? '60px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.98) 0%, rgba(37, 99, 235, 0.98) 100%)',
        borderRadius: '12px',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
        animation: 'slideDown 0.5s ease-out'
      }}>
        <RefreshCw size={20} color="#fff" />
        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>
          Nieuwe versie beschikbaar!
        </span>
        <button
          onClick={handleUpdateClick}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Update
        </button>
      </div>
    )
  }
  
  return null
}

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `
  document.head.appendChild(style)
}
