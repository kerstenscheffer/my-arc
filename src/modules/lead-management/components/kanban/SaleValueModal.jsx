// src/modules/lead-management/components/kanban/SaleValueModal.jsx
//
// Het venster dat opent als je een lead naar een sale-sectie sleept. Het
// formulier erin is hetzelfde als in de call-lijst (SaleForm), zodat de vraag
// maar op één manier gesteld wordt en er maar één plek is om te wijzigen.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X } from 'lucide-react'
import SaleForm from './SaleForm'

// Naam van de vaste partner (later aanpasbaar via localStorage).
const PARTNER_NAME = (() => {
  try { return localStorage.getItem('lead_partner_name') || 'Marcel' } catch { return 'Marcel' }
})()

export default function SaleValueModal({ isMobile, leadName, partnerName = PARTNER_NAME, onSave, onClose }) {
  const modalHost = useModalHost()
  // Korte guard tegen mobiele click-through: een tik die het venster opent mag
  // niet meteen het venster ernaast sluiten.
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  return createPortal(
    <div
      onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483550,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
      }}
    >
      <div style={{
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, width: '100%', maxWidth: 420,
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 70px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.15rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Sale
            </div>
            <div style={{
              fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {leadName || 'deze lead'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{
            width: 30, height: 30, flexShrink: 0, borderRadius: 8,
            background: 'transparent', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={17} strokeWidth={3} />
          </button>
        </div>

        <div style={{ padding: isMobile ? '1rem' : '1.15rem' }}>
          <SaleForm
            leadName={leadName}
            partnerName={partnerName}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    modalHost
  )
}
