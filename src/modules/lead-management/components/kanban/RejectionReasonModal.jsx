// src/modules/lead-management/components/kanban/RejectionReasonModal.jsx
// Opent wanneer een lead naar een "Call afgewezen"-sectie is verplaatst: coach
// kiest de reden van afwijzing (voor de stats-breakdown). Portal + hoge z-index
// + korte guard tegen mobiele click-through (zelfde patroon als SaleValueModal).
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, PhoneOff } from 'lucide-react'

const PRESET_REASONS = [
  'Te duur / budget',
  'Geen tijd / te druk',
  'Geen interesse (meer)',
  'Wil eerst zelf proberen',
]

export default function RejectionReasonModal({ isMobile, leadName, onSave, onClose }) {
  const modalHost = useModalHost()
  const [selected, setSelected] = useState(null)
  const [other, setOther] = useState('')
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  const submit = () => {
    const reason = selected === '__other__'
      ? (other.trim() || 'Anders')
      : (selected || (other.trim() || null))
    onSave(reason)
  }

  const chip = (active) => ({
    display: 'inline-flex', alignItems: 'center', textAlign: 'left',
    padding: '0.6rem 0.75rem', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 700,
    background: active ? 'rgba(249,115,22,0.16)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#fb923c' : 'rgba(255,255,255,0.7)',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }}
      onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#111', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <PhoneOff size={18} color="#fb923c" />
          <h3 style={{ margin: 0, flex: 1, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>Call afgewezen</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
            Waarom wees {leadName || 'deze lead'} de call af?
          </label>
          <div style={{ display: 'grid', gap: 8, marginBottom: '0.9rem' }}>
            {PRESET_REASONS.map(r => (
              <div key={r} onClick={() => { setSelected(r); setOther('') }} style={chip(selected === r)}>{r}</div>
            ))}
            <div onClick={() => setSelected('__other__')} style={chip(selected === '__other__')}>Anders…</div>
          </div>
          {selected === '__other__' && (
            <input
              type="text" autoFocus value={other}
              onChange={e => setOther(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="Typ de reden…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid rgba(249,115,22,0.35)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: '0.9rem' }}
            />
          )}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Overslaan</button>
            <button onClick={submit} disabled={!selected && !other.trim()} style={{ flex: 2, padding: '0.85rem', borderRadius: 10, border: 'none', background: (!selected && !other.trim()) ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontWeight: 900, cursor: (!selected && !other.trim()) ? 'not-allowed' : 'pointer', opacity: (!selected && !other.trim()) ? 0.6 : 1, touchAction: 'manipulation' }}>Opslaan</button>
          </div>
        </div>
      </div>
    </div>,
    modalHost
  )
}
