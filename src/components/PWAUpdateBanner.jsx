import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import db from '../services/DatabaseService'

export default function PWAUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [updateUrl, setUpdateUrl] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Legacy hard-coded URL check (PWA deploy migrations)
  const OUDE_URL = 'workapp-ewgnzwdtf-myarc.vercel.app'
  const NIEUWE_URL = 'workapp-lb83xkpx7-myarc.vercel.app'

  useEffect(() => {
    // Check Supabase app_config for a forced update (works in native + PWA)
    db.getAppConfig().then(config => {
      if (config?.force_update) {
        setForceUpdate(true)
        setUpdateUrl(config.current_url || '')
        setUpdateMessage(config.message || 'Er is een nieuwe versie beschikbaar. Update de app om door te gaan.')
      }
    }).catch(() => {})

    // Legacy: check if running on the old Vercel deployment URL
    if (window.location.hostname === OUDE_URL) {
      const dismissed = localStorage.getItem('update_dismissed')
      if (dismissed !== new Date().toDateString()) setShowBanner(true)
    }

    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('update_dismissed', new Date().toDateString())
    setShowBanner(false)
  }

  // Force-update: non-dismissible full-screen overlay
  if (forceUpdate) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.97)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '20px',
          padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
          maxWidth: '420px',
          width: '100%',
        }}>
          <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{
            color: '#FFD700',
            fontSize: isMobile ? '1.4rem' : '1.8rem',
            fontWeight: 900,
            marginBottom: '0.75rem',
          }}>
            Update vereist
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: isMobile ? '0.95rem' : '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            {updateMessage}
          </p>
          {updateUrl && (
            <a
              href={updateUrl}
              style={{
                display: 'inline-block',
                padding: '1rem 2.5rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#000',
                fontWeight: 900,
                fontSize: '1rem',
                borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              }}
            >
              App updaten →
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      color: 'white',
      padding: isMobile ? '1rem' : '1.5rem',
      zIndex: 99999,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      borderBottom: '2px solid #7f1d1d',
      animation: 'slideDown 0.5s ease-out'
    }}>
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255, 255, 255, 0.2)',
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
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)' }}
      >
        <X size={18} />
      </button>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
        paddingRight: '40px'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem'
        }}>
          🚀 Nieuwe MY ARC Versie Beschikbaar!
        </h2>

        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          marginBottom: '1rem',
          opacity: 0.95
        }}>
          Voor de beste ervaring en laatste features, installeer de nieuwe versie:
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: '1rem',
          textAlign: 'left'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            marginBottom: '0.75rem',
            fontWeight: '600'
          }}>
            📱 Stappen om te updaten:
          </p>
          <ol style={{
            margin: 0,
            paddingLeft: '1.5rem',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            lineHeight: '1.6'
          }}>
            <li>Verwijder huidige MY ARC app van je home screen</li>
            <li>Klik op onderstaande link</li>
            <li>Klik op "Delen" icoon (iOS) of 3 puntjes menu (Android)</li>
            <li>Kies "Toevoegen aan beginscherm"</li>
          </ol>
        </div>

        <a
          href={`https://${NIEUWE_URL}`}
          style={{
            display: 'inline-block',
            padding: isMobile ? '0.875rem 2rem' : '1rem 3rem',
            background: 'white',
            color: '#dc2626',
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.1rem',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)'
          }}
        >
          Ga naar nieuwe MY ARC →
        </a>

        <p style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          marginTop: '1rem',
          opacity: 0.7
        }}>
          Je gegevens blijven bewaard. Dit duurt 30 seconden.
        </p>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
