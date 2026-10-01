// src/client/components/CheckinModal.jsx
// Full-screen overlay that wraps the existing ClientCheckinForm.
// The form already has its own thank-you state — we just close shortly
// after a successful submit.

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import ClientCheckinForm from '../../modules/client-checkin/ClientCheckinForm'
import { laatsteZaterdag } from '../../modules/weight-tracker/utils/coachingBand'

// "wk 39 · 20 t/m 26 sep" — de week waar de check-in over gaat, die tot en
// met de afgelopen zaterdag loopt. Zelfde ankerpunt als de terugblik en als
// de gewicht-header in coach insight.
const periodeLabel = () => {
  const tot = new Date(`${laatsteZaterdag()}T00:00:00`)
  const van = new Date(tot.getTime() - 6 * 86400000)
  const d = new Date(tot)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const week = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)
  const kort = (x) => x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  return `wk ${week} · ${kort(van)} t/m ${kort(tot)}`
}

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
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em',
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          Wekelijkse check-in
          {/* Over welke week gaat dit. Hier in de kop, zodat het boven elk
              scherm van het formulier blijft staan en niet alleen boven de
              terugblik. De week loopt tot en met de afgelopen zaterdag. */}
          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            {' · '}{periodeLabel()}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none',
            border: 'none',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
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
        display: 'flex', flexDirection: 'column',
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
