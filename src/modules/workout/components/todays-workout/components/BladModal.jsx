// src/modules/workout/components/todays-workout/components/BladModal.jsx
//
// Het blad dat vanaf de onderkant openschuift. Eén component voor de
// machine-instellingen, de notitie en de historie, zodat die drie zich
// hetzelfde gedragen: tikken naast het blad sluit het, het blad groeit mee
// met zijn inhoud tot 80% van het scherm, en daarna scrollt de inhoud.
//
// Waarom niet inline in het log-scherm: die panelen duwden de gelogde sets
// naar beneden, precies waar je tijdens het loggen naar kijkt.

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function BladModal({ open, titel, onClose, children, zIndex = 10001 }) {
  if (!open) return null

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 500,
        background: '#0a0a0a',
        borderRadius: '16px 16px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
            {titel}
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{
            width: 36, height: 36, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '1rem 1.25rem',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
        }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
