// Confirmation prompt that fires when a user deletes or shortens a
// recurring task. Asks whether the action should apply to ONLY this date
// or to the ENTIRE recurrence. Returns the chosen scope via onChoose.

import { createPortal } from 'react-dom'
import { Repeat, Calendar, X } from 'lucide-react'

export default function RecurringActionPrompt({
  action,           // 'delete' | 'shorten'
  dateLabel,        // human-readable date string for the "only this" option
  onChoose,         // (scope: 'only-this' | 'all') => void
  onCancel,
}) {
  const isDelete = action === 'delete'
  const title = isDelete ? 'Recurring task verwijderen?' : 'Recurring task aanpassen?'
  const onlyLabel = isDelete ? 'Alleen deze datum verwijderen' : 'Alleen deze datum aanpassen'
  const allLabel  = isDelete ? 'Hele reeks verwijderen' : 'Hele reeks aanpassen'

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2147483640, padding: '1rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Repeat size={14} color="#FFD700" />
            <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
              {title}
            </span>
          </div>
          <button onClick={onCancel} style={iconCloseStyle}>
            <X size={13} />
          </button>
        </div>

        {/* Choices */}
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => onChoose('only-this')}
            style={choiceBtnStyle('#10b981')}
          >
            <Calendar size={14} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{onlyLabel}</span>
              {dateLabel && (
                <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 600 }}>{dateLabel}</span>
              )}
            </div>
          </button>

          <button
            onClick={() => onChoose('all')}
            style={choiceBtnStyle(isDelete ? '#ef4444' : '#FFD700')}
          >
            <Repeat size={14} />
            <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{allLabel}</span>
          </button>

          <button
            onClick={onCancel}
            style={{
              padding: '0.6rem', marginTop: '0.25rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annuleer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const iconCloseStyle = {
  width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
}

const choiceBtnStyle = (accent) => ({
  padding: '0.7rem 0.85rem',
  display: 'flex', alignItems: 'center', gap: '0.6rem',
  background: `${accent}15`,
  border: `1px solid ${accent}40`,
  borderRadius: 8,
  color: accent,
  fontSize: '0.85rem',
  cursor: 'pointer', textAlign: 'left',
  touchAction: 'manipulation',
})
