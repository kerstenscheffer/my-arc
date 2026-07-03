// src/client/components/CheckinModal.jsx
// Full-screen overlay that wraps the existing ClientCheckinForm.
// The form already has its own thank-you state — we just close shortly
// after a successful submit.

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import ClientCheckinForm from '../../modules/client-checkin/ClientCheckinForm'

export default function CheckinModal({ isOpen, onClose, onSubmitted, client, db, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768

  // The "Sluiten"-button in the top bar is always available, so the user can
  // dismiss the modal at any time. The underlying ClientCheckinForm shows a
  // thank-you screen after submit; if/when we want auto-close, we'd need to
  // pass an onSubmitted callback into the form. For now: explicit close.

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'checkinFadeIn 0.2s ease',
      }}
    >
      {/* Top bar with close */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.625rem 0.875rem',
        borderBottom: '1px solid rgba(255, 215, 0, 0.18)',
        paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: 800,
          color: '#FFD700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Wekelijkse check-in
        </div>
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '8px',
            color: '#FFD700',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Form body — scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <ClientCheckinForm
          db={db}
          client={client}
          onClose={onClose}
          onSubmitted={() => {
            onSubmitted?.()
            // Modal sluit niet automatisch — zo blijft het succes-scherm
            // (handled door form) zichtbaar tot user 'Sluit' tikt.
          }}
        />
      </div>

      <style>{`
        @keyframes checkinFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
