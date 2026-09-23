// src/modules/lead-management/components/kanban/SaleLostReasonModal.jsx
// Opent wanneer een lead naar een "Sale verloren"-sectie is verplaatst: coach
// kiest de objectie / reden waarom de sale niet doorging (voor de stats-breakdown).
// Kloon van RejectionReasonModal — reden landt op de laatste lead_movements-rij
// via leadService.setMovementRejectionReason.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, XCircle } from 'lucide-react'

const PRESET_REASONS = [
  'Te duur / budget',
  'Twijfel / partner overleggen',
  'Geen commitment',
  'Timing niet goed',
  'Ghosted / geen reactie meer',
]

const chip = (active) => ({
  display: 'inline-flex', alignItems: 'center', textAlign: 'left',
  padding: '0.6rem 0.75rem', borderRadius: 10, cursor: 'pointer',
  fontSize: '0.82rem', fontWeight: 700,
  background: active ? 'rgba(239,68,68,0.16)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
  color: active ? '#f87171' : 'rgba(255,255,255,0.7)',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

// De reden-keuze zelf. Eén component, meerdere plekken — als los venster na
// het slepen naar "Sale verloren", en in de call-lijst na "Verloren" of na
// "Afgezegd", zodat daar geen tweede venster overheen springt.
//   onSave(reason)  — reason is null bij "Overslaan"
//   onBack          — optioneel; toont een "Terug"-knop i.p.v. alleen overslaan
//   vraag / opties  — andere vraag met andere antwoorden (bv. een afzegging)
export function SaleLostReasonForm({ leadName, onSave, onBack, compact = false, vraag, opties }) {
  const lijst = opties || PRESET_REASONS
  const [selected, setSelected] = useState(null)
  const [other, setOther] = useState('')
  const leeg = !selected && !other.trim()

  const submit = () => {
    const reason = selected === '__other__'
      ? (other.trim() || 'Anders')
      : (selected || (other.trim() || null))
    onSave(reason)
  }

  const knopPad = compact ? '0.65rem' : '0.85rem'
  const secundair = { flex: 1, padding: knopPad, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation' }

  return (
    <div>
      <label style={{ display: 'block', fontSize: compact ? '0.66rem' : '0.8rem', fontWeight: compact ? 700 : 600, color: compact ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)', marginBottom: compact ? 6 : 10 }}>
        {vraag || `Wat was de objectie bij ${leadName || 'deze lead'}?`}
      </label>
      <div style={{ display: 'grid', gap: compact ? 6 : 8, marginBottom: compact ? '0.6rem' : '0.9rem' }}>
        {lijst.map(r => (
          <div key={r} onClick={() => { setSelected(r); setOther('') }} style={chip(selected === r)}>{r}</div>
        ))}
        <div onClick={() => setSelected('__other__')} style={chip(selected === '__other__')}>Anders…</div>
      </div>
      {selected === '__other__' && (
        <input
          type="text" autoFocus value={other}
          onChange={e => setOther(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Typ de objectie…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: compact ? '0.6rem' : '0.9rem' }}
        />
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
        {onBack && <button onClick={onBack} style={secundair}>Terug</button>}
        <button onClick={() => onSave(null)} style={secundair}>Overslaan</button>
        <button onClick={submit} disabled={leeg} style={{ flex: 2, padding: knopPad, borderRadius: 10, border: 'none', background: leeg ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 900, fontFamily: 'inherit', cursor: leeg ? 'not-allowed' : 'pointer', opacity: leeg ? 0.6 : 1, touchAction: 'manipulation' }}>Opslaan</button>
      </div>
    </div>
  )
}

export default function SaleLostReasonModal({ isMobile, leadName, onSave, onClose }) {
  const modalHost = useModalHost()
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }}
      onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#111', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <XCircle size={18} color="#f87171" />
          <h3 style={{ margin: 0, flex: 1, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>Sale verloren</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          <SaleLostReasonForm
            leadName={leadName}
            onSave={(reason) => (reason ? onSave(reason) : onClose())}
          />
        </div>
      </div>
    </div>,
    modalHost
  )
}
