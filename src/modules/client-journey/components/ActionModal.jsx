// ============================================
// 📁 FILE: src/modules/client-journey/components/ActionModal.jsx
// Modal for add/edit actions
// ============================================
import React, { useState } from 'react'
import { X, Save } from 'lucide-react'
import { G, ACTION_TYPES, lbl, inp } from '../journeyConfig'

export default function ActionModal({ action, weekNumber, dayNumber, isMobile, onSave, onClose }) {
  const [title, setTitle] = useState(action?.title || '')
  const [desc, setDesc] = useState(action?.description || '')
  const [type, setType] = useState(action?.action_type || 'task')

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111', border: `1px solid ${G.border}`,
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        width: isMobile ? '100%' : '480px', maxHeight: '85vh', overflow: 'auto',
        padding: isMobile ? '1.25rem 1rem 2rem' : '1.5rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ color: G.text, fontSize: '1rem', fontWeight: '700', margin: 0 }}>
            {action?.id ? 'Bewerken' : 'Nieuwe actie'}
          </h3>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={16} color={G.textMuted} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Type selector */}
          <div>
            <label style={lbl}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
              {Object.entries(ACTION_TYPES).map(([k, c]) => {
                const I = c.icon, sel = type === k
                return (
                  <button key={k} onClick={() => setType(k)} style={{
                    padding: '0.35rem 0.6rem', borderRadius: '6px',
                    background: sel ? `${c.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${sel ? `${c.color}50` : G.border}`,
                    color: sel ? c.color : G.textMuted,
                    fontSize: '0.7rem', fontWeight: sel ? '600' : '400',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}>
                    <I size={12} />{c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={lbl}>Titel</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Wat moet er gebeuren?" style={inp(isMobile)} autoFocus />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Beschrijving</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Extra details..." rows={3} style={{ ...inp(isMobile), resize: 'vertical', minHeight: '70px' }} />
          </div>

          {/* Save */}
          <button
            onClick={() => onSave({ ...action, title, description: desc, action_type: type, week_number: weekNumber, day_number: dayNumber || 0 })}
            disabled={!title.trim()}
            style={{
              padding: '0.75rem', border: 'none', borderRadius: '10px',
              background: title.trim() ? G.gradient : 'rgba(255,255,255,0.05)',
              color: title.trim() ? '#000' : G.textDim,
              fontWeight: '700', cursor: title.trim() ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Save size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {action?.id ? 'Opslaan' : 'Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
