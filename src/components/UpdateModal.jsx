// src/components/UpdateModal.jsx
import { useState, useEffect } from 'react'
import { X, Rocket, ChevronRight } from 'lucide-react'

export default function UpdateModal({ db }) {
  const [showModal, setShowModal] = useState(false)
  const [config, setConfig] = useState(null)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    checkForUpdate()
  }, [])

  const checkForUpdate = async () => {
    try {
      // Skip if already dismissed this session
      if (sessionStorage.getItem('update-dismissed')) {
        console.log('Update already dismissed this session')
        return
      }

      // Skip on localhost
      if (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1') {
        console.log('Skipping update check on localhost')
        return
      }

      // Get config from Supabase
      const appConfig = await db.getAppConfig()
      if (!appConfig || !appConfig.current_url) {
        console.log('No app config found in database')
        return
      }

      // Clean URLs - remove whitespace, protocol, trailing slash
      const cleanUrl = (url) => {
        if (!url) return ''
        return url
          .trim()                          // Remove whitespace
          .replace(/^https?:\/\//, '')     // Remove protocol
          .replace(/\/$/, '')               // Remove trailing slash
          .toLowerCase()                    // Lowercase
      }

      const currentUrl = cleanUrl(window.location.origin)
      const latestUrl = cleanUrl(appConfig.current_url)

      console.log('🔍 Version Check:')
      console.log('Current (raw):', window.location.origin)
      console.log('Latest (raw):', appConfig.current_url)
      console.log('Current (clean):', currentUrl)
      console.log('Latest (clean):', latestUrl)
      console.log('Are they equal?:', currentUrl === latestUrl)

      // Show modal ONLY if URLs are different
      if (currentUrl !== latestUrl) {
        console.log('🚀 NEW VERSION AVAILABLE - Showing update modal')
        setConfig(appConfig)
        setShowModal(true)
      } else {
        console.log('✅ Already on latest version - No modal needed')
      }
    } catch (error) {
      console.error('❌ Update check failed:', error)
    }
  }

  const handleUpdate = () => {
    if (config?.current_url) {
      console.log('Navigating to new version:', config.current_url)
      window.location.href = config.current_url
    }
  }

  const handleDismiss = () => {
    console.log('User dismissed update modal')
    sessionStorage.setItem('update-dismissed', 'true')
    setShowModal(false)
  }

  // Don't render if no update needed
  if (!showModal || !config) {
    return null
  }

  // Convert YouTube URL to embed format with autoplay
  const getYouTubeEmbedUrl = (url) => {
    // Extract video ID from various YouTube URL formats
    const videoId = 'Hx5nf0TQzLE' // Hardcoded for now
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '90%' : '400px',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 20px 60px rgba(16, 185, 129, 0.3)',
        zIndex: 9999,
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: isMobile ? '1.5rem' : '2rem',
          position: 'relative'
        }}>
          {/* Close button */}
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <X size={18} color="white" />
          </button>

          {/* Icon and title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Rocket size={28} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                fontWeight: '800',
                color: 'white',
                margin: 0
              }}>
                Update Beschikbaar!
              </h2>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0.25rem 0 0 0'
              }}>
                Versie {config.version || 'Nieuw'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: isMobile ? '0.95rem' : '1rem',
            lineHeight: '1.6',
            margin: '0 0 1.5rem 0'
          }}>
            {config.message || 'Er is een nieuwe versie van MY ARC beschikbaar met verbeteringen en nieuwe features!'}
          </p>

          {/* YouTube Video Embed - 1:1 aspect ratio with autoplay */}
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '100%', // 1:1 aspect ratio for shorts
            marginBottom: '1.5rem',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              src={getYouTubeEmbedUrl('https://youtube.com/shorts/Hx5nf0TQzLE')}
              title="Hoe installeer je de nieuwe MY ARC app"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Instruction text under video */}
          <p style={{
            color: 'rgba(16, 185, 129, 0.9)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            textAlign: 'center',
            margin: '0 0 1.5rem 0',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            📱 Bekijk hoe je de nieuwe app installeert
          </p>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexDirection: 'column'
          }}>
            {/* Update button */}
            <button
              onClick={handleUpdate}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                color: 'white',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
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
              Update Nu
              <ChevronRight size={18} />
            </button>

            {/* Later button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '0.875rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              Later Herinneren
            </button>
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
          from { 
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}
