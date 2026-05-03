// src/modules/productivity/components/kanban/StartTaskModal.jsx
// Popup om taak te starten — tijd aanpassen en bevestigen

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, Clock } from 'lucide-react'

const PRESETS = [5, 15, 25, 30, 45, 60, 90]

export default function StartTaskModal({ task, isMobile, onStart, onClose }) {
  const [minutes, setMinutes] = useState(task.estimated_minutes || 25)

  const handleStart = () => {
    if (!minutes || minutes < 1) return
    onStart(minutes)
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 10000, padding: isMobile ? 0 : '1.5rem' }}
    >
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: isMobile ? '12px 12px 0 0' : '12px',
        width: '100%', maxWidth: '360px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Play size={13} color="#10b981" />
          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </span>
          <button onClick={onClose}
            style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={12} />
          </button>
        </div>

        {/* Tijdkiezer */}
        <div style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={8} /> HOELANG?
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {PRESETS.map(p => (
              <button key={p} onClick={() => setMinutes(p)}
                style={{ padding: '0.3rem 0.5rem', background: minutes === p ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${minutes === p ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '5px', color: minutes === p ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {p < 60 ? `${p}m` : `${p / 60}u`}
              </button>
            ))}
          </div>

          {/* Custom invoer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '1rem' }}>
            <Clock size={11} color="rgba(255,255,255,0.2)" />
            <input
              type="number" min="1" max="480" value={minutes}
              onChange={(e) => setMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: '800', width: '60px' }}
            />
            <span style={{ fontSize: '0.6rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>minuten</span>
          </div>

          {/* Timer preview */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#10b981', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {String(Math.floor(minutes)).padStart(2, '0')}:00
            </div>
          </div>

          {/* Start */}
          <button onClick={handleStart}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.75rem', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <Play size={16} /> Start — {minutes < 60 ? `${minutes} min` : `${minutes / 60}u`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
