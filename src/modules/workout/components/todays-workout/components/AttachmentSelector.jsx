// src/modules/workout/components/todays-workout/components/AttachmentSelector.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, Check } from 'lucide-react'
import { ATTACHMENTS, getAttachment, getExerciseAttachmentDefaults } from '../../../constants/attachments'

export default function AttachmentSelector({ suggested, value, onChange, isMobile, exerciseName }) {
  const [showPicker, setShowPicker] = useState(false)

  // Haal defaults op voor deze oefening
  const defaults = getExerciseAttachmentDefaults(exerciseName)
  const autoDefault = defaults?.default
  const availableIds = defaults?.available || null // null = alles tonen

  // Actieve attachment: expliciet gekozen > coach suggested > auto default
  const activeId = value || suggested || autoDefault
  const current = getAttachment(activeId)
  const isDefault = !value && !suggested && !!autoDefault
  const isSuggested = !value && !!suggested

  // Filter beschikbare attachments
  const visibleAttachments = availableIds
    ? ATTACHMENTS.filter(a => availableIds.includes(a.id))
    : ATTACHMENTS

  return (
    <>
      {/* Compact blokje */}
      <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Materiaal
          {isSuggested && <span style={{ marginLeft: '0.4rem', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>· aanbevolen door coach</span>}
          {isDefault && <span style={{ marginLeft: '0.4rem', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>· standaard voor deze oefening</span>}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.15s ease' }}
          onTouchStart={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
          onTouchEnd={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          {current ? (
            <>
              {/* Foto */}
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundImage: `url(${current.img})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, opacity: 0.75 }} />
              {/* Naam */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '700', color: '#fff' }}>{current.nl}</div>
                {isSuggested && <div style={{ fontSize: '0.58rem', color: 'rgba(255,215,0,0.4)', fontWeight: '600', marginTop: '0.1rem' }}>Aanbevolen</div>}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, textAlign: 'left', fontSize: isMobile ? '0.82rem' : '0.87rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
              Selecteer materiaal...
            </div>
          )}
          <ChevronDown size={14} color="rgba(255,255,255,0.25)" strokeWidth={2.5} />
        </button>
      </div>

      {/* Picker modal */}
      {showPicker && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPicker(false) }}>

          <div style={{ width: '100%', maxWidth: '500px', background: '#0a0a0a', borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kies materiaal</div>
              <button onClick={() => setShowPicker(false)} style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.875rem 1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                {visibleAttachments.map(attachment => {
                  const isSelected = activeId === attachment.id
                  const isSug = (suggested === attachment.id && !value) || (autoDefault === attachment.id && !value && !suggested)
                  return (
                    <button
                      key={attachment.id}
                      onClick={() => { onChange(attachment.id); setShowPicker(false) }}
                      style={{ background: isSelected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)', border: `${isSelected ? '2' : '1'}px solid ${isSelected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', padding: '0.625rem 0.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', position: 'relative', transition: 'all 0.15s ease' }}>

                      {/* Aanbevolen badge */}
                      {isSug && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,215,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={8} color="#000" strokeWidth={3} />
                        </div>
                      )}

                      {/* Foto */}
                      <div style={{ width: '52px', height: '52px', borderRadius: '6px', backgroundImage: `url(${attachment.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: isSelected ? 0.9 : 0.55 }} />

                      {/* Naam */}
                      <div style={{ fontSize: '0.62rem', fontWeight: '700', color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.3 }}>
                        {attachment.nl}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
