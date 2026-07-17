// src/modules/manual-workout-builder/components/DayTemplatePickerModal.jsx
// Kies bij "+ Dag" een lege dag óf een opgeslagen dag-template (bv. "Push dag").
// Een template laadt de dag meteen met alle oefeningen.
import { X, Plus, Dumbbell, Trash2 } from 'lucide-react'

export default function DayTemplatePickerModal({
  templates = [], onPickEmpty, onPickTemplate, onDeleteTemplate, onClose, isMobile,
}) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        width: isMobile ? '100%' : '440px', maxHeight: isMobile ? '85vh' : '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff' }}>Dag toevoegen</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', minHeight: 32, minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.75rem' }}>
          {/* Lege dag */}
          <button
            onClick={onPickEmpty}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 1rem', marginBottom: '0.6rem',
              background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,215,0,0.14)', border: '1px solid rgba(255,215,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={18} color="#FFD700" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFD700' }}>Lege dag</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Begin met een lege dag</div>
            </div>
          </button>

          {/* Kop templates */}
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '0.5rem 0.5rem 0.4rem' }}>
            Dag-templates {templates.length > 0 ? `(${templates.length})` : ''}
          </div>

          {templates.length === 0 && (
            <div style={{ padding: '1.25rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Nog geen dag-templates. Bouw een dag en klik op het bewaar-icoon in de dag-kop om 'm als template op te slaan.
            </div>
          )}

          {templates.map((tpl) => {
            const count = Array.isArray(tpl.exercises) ? tpl.exercises.length : 0
            return (
              <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <button
                  onClick={() => onPickTemplate(tpl)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', minWidth: 0,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell size={16} color="rgba(255,255,255,0.7)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {count} oefening{count === 1 ? '' : 'en'}{tpl.focus ? ` · ${tpl.focus}` : ''}
                    </div>
                  </div>
                </button>
                {onDeleteTemplate && (
                  <button
                    onClick={() => onDeleteTemplate(tpl)}
                    title="Template verwijderen"
                    style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
