// src/modules/lead-management/components/kanban/DueCallsModal.jsx
// Pop-up bij het openen van het lead-systeem met de ingeplande calls waarvan
// datum+tijd voorbij zijn en die nog niet zijn afgehandeld. 2-staps per call:
//   Stap 1: Gevoerd / Niet gevoerd
//   Stap 2: (gevoerd) Sale / Sale verloren · (niet gevoerd) No show / Verplaatst
// Elke keuze bubbelt via onOutcome(dc, kind, extra) naar de KanbanBoard.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Phone, Check, XCircle, Trophy, CalendarClock, UserX, CalendarX } from 'lucide-react'

const inp = (flex) => ({ flex, padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#1a1a1a', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' })
const chip = (color) => ({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.6rem', borderRadius: 9, border: `1px solid ${color}55`, background: `${color}18`, color, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' })

function DueCallItem({ dc, onOutcome }) {
  const [step, setStep] = useState(1)         // 1 | 'h' (gevoerd) | 'n' (niet gevoerd)
  const [reschedule, setReschedule] = useState(false)
  const [date, setDate] = useState(dc.callDate || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(dc.callTime || new Date().toTimeString().slice(0, 5))

  const fmt = () => {
    try {
      return new Date(`${dc.callDate}T${dc.callTime || '00:00'}:00`).toLocaleString('nl-NL', {
        day: 'numeric', month: 'short',
        hour: dc.callTime ? '2-digit' : undefined, minute: dc.callTime ? '2-digit' : undefined,
      })
    } catch { return dc.callDate }
  }

  return (
    <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Phone size={14} color="#06b6d4" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dc.leadName || 'Lead'}</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Call was: {fmt()}</div>
        </div>
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={chip('#10b981')} onClick={() => setStep('h')}><Check size={14} /> Gevoerd</button>
          <button style={chip('#ef4444')} onClick={() => setStep('n')}><XCircle size={14} /> Niet gevoerd</button>
        </div>
      )}

      {step === 'h' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={chip('#FFD700')} onClick={() => onOutcome(dc, 'sale')}><Trophy size={14} /> Sale</button>
          <button style={chip('#ef4444')} onClick={() => onOutcome(dc, 'saleLost')}><XCircle size={14} /> Sale verloren</button>
        </div>
      )}

      {step === 'n' && !reschedule && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={chip('#f97316')} onClick={() => onOutcome(dc, 'noShow')}><UserX size={14} /> No show</button>
          <button style={chip('#a855f7')} onClick={() => onOutcome(dc, 'afgezegd')}><CalendarX size={14} /> Afgezegd</button>
          <button style={chip('#06b6d4')} onClick={() => setReschedule(true)}><CalendarClock size={14} /> Verplaatst</button>
        </div>
      )}

      {step === 'n' && reschedule && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp(2)} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inp(1)} />
          </div>
          <button style={{ ...chip('#06b6d4'), width: '100%' }} onClick={() => onOutcome(dc, 'reschedule', { callDate: date || null, callTime: time || null })}>
            <CalendarClock size={14} /> Opnieuw inplannen
          </button>
        </div>
      )}
    </div>
  )
}

export default function DueCallsModal({ dueCalls, onOutcome, onClose }) {
  const list = dueCalls || []
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0d0d0d', border: '1px solid rgba(6,182,212,0.35)', borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarClock size={16} color="#06b6d4" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#fff' }}>Openstaande call{list.length === 1 ? '' : 's'}</div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Hoe ging de call? · {list.length} open</div>
          </div>
          <button onClick={onClose} title="Later" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {list.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
              🎉 Geen openstaande calls — alles is afgehandeld.
            </div>
          ) : (
            list.map(dc => <DueCallItem key={dc.movementId} dc={dc} onOutcome={onOutcome} />)
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
