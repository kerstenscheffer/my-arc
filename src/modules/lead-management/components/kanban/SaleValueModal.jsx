// src/modules/lead-management/components/kanban/SaleValueModal.jsx
// Opent wanneer een lead naar een sale-sectie is verplaatst: coach vult de
// order-waarde in (voor de omzet-statistiek). Portal + hoge z-index + korte
// guard tegen mobiele click-through (zelfde patroon als AddLeadModal).
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Euro } from 'lucide-react'

export default function SaleValueModal({ isMobile, leadName, onSave, onClose }) {
  const [value, setValue] = useState('')
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  const submit = () => {
    const num = parseFloat(String(value).replace(',', '.'))
    onSave(isNaN(num) ? null : num)
  }

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }}
      onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#111', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>🎉 Nieuwe sale!</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            Order-waarde van {leadName || 'deze lead'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.8rem 1rem', borderRadius: 12, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.03)', marginBottom: '1rem' }}>
            <Euro size={18} color="#FFD700" />
            <input
              type="number" inputMode="decimal" autoFocus value={value}
              onChange={e => setValue(e.target.value)} placeholder="Bijv. 597"
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Overslaan</button>
            <button onClick={submit} style={{ flex: 2, padding: '0.85rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD700, #D4AF37)', color: '#000', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>Opslaan</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
