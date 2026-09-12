// src/modules/workout/components/todays-workout/components/MachineSettings.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react'

const SETTING_FIELDS = [
  { key: 'seat', label: 'Zitpositie', placeholder: 'bv. stand 3' },
  { key: 'back', label: 'Rugleuning', placeholder: 'bv. stand 5' },
  { key: 'weight_arm', label: 'Gewichtsarm', placeholder: 'bv. stand 2' },
  { key: 'pad', label: 'Kussen/pad', placeholder: 'bv. stand 1' },
  { key: 'cable_height', label: 'Kabelhoogte', placeholder: 'bv. laagste stand' },
  { key: 'notes', label: 'Notitie', placeholder: 'bv. voeten iets naar buiten' }
]

// `compact` = als knopje in de apparatuur-kolom naast de oefeningtitel. De
// velden openen dan in een blad onderaan het scherm, zodat de kop zijn hoogte
// houdt.
export default function MachineSettings({ value = {}, onChange, previousSettings, isMobile, onSave, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasPrevious = previousSettings && Object.values(previousSettings).some(v => v)
  const hasCurrentValues = Object.values(value).some(v => v)

  const handleChange = (newSettings) => {
    onChange(newSettings)
    setSaved(false)
  }

  const handleSave = async () => {
    if (onSave) {
      await onSave(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const velden = (
    <>
      {hasPrevious && (
        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Vorige sessie</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SETTING_FIELDS.filter(f => previousSettings[f.key]).map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{f.label}:</span>
                <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{previousSettings[f.key]}</span>
              </div>
            ))}
          </div>
          <button onClick={() => handleChange({ ...previousSettings })}
            style={{ marginTop: '0.5rem', padding: '0.35rem 0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation' }}>
            Zelfde instelling gebruiken
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {SETTING_FIELDS.filter(f => f.key !== 'notes').map(f => (
          <div key={f.key}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{f.label}</div>
            <input type="text" value={value[f.key] || ''} onChange={(e) => handleChange({ ...value, [f.key]: e.target.value })} placeholder={f.placeholder}
              style={{ width: '100%', padding: '0.45rem 0.55rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '0.625rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Notitie</div>
        <input type="text" value={value.notes || ''} onChange={(e) => handleChange({ ...value, notes: e.target.value })} placeholder="bv. voeten iets naar buiten, smalle grip"
          style={{ width: '100%', padding: '0.45rem 0.55rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
      </div>

      <button onClick={handleSave}
        style={{ width: '100%', padding: '0.65rem', background: saved ? 'rgba(16,185,129,0.12)' : '#fff', border: `1px solid ${saved ? 'rgba(16,185,129,0.35)' : '#fff'}`, borderRadius: 10, color: saved ? '#10b981' : '#0a0a0a', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        {saved ? <><CheckCircle size={13} strokeWidth={2.5} />Opgeslagen</> : 'Opslaan'}
      </button>
    </>
  )

  if (compact) {
    return (
      <>
        <button
          onClick={() => setExpanded(true)}
          title="Machine-instellingen"
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%', minHeight: 44,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${hasCurrentValues ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, padding: '0.3rem 0.5rem', cursor: 'pointer',
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={15} color={hasCurrentValues ? '#FFD700' : 'rgba(255,255,255,0.5)'} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
              Instellingen
            </div>
            <div style={{ fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 800, color: hasCurrentValues ? '#fff' : 'rgba(255,255,255,0.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasCurrentValues ? 'Ingevuld' : hasPrevious ? 'Vorige er nog' : 'Leeg'}
            </div>
          </div>
          <ChevronDown size={14} color="rgba(255,255,255,0.3)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
        </button>

        {expanded && createPortal(
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false) }}>
            <div style={{ width: '100%', maxWidth: 500, background: '#0a0a0a', borderRadius: '16px 16px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Machine-instellingen</div>
                <button onClick={() => setExpanded(false)} aria-label="Sluit" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}>
                {velden}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>

      <button onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Settings size={11} color={hasCurrentValues ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.25)'} strokeWidth={2} />
          <span style={{ fontSize: '0.6rem', fontWeight: '700', color: hasCurrentValues ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Machine instellingen
          </span>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <CheckCircle size={10} color="#10b981" strokeWidth={2.5} />
              <span style={{ fontSize: '0.55rem', color: '#10b981', fontWeight: '700' }}>Opgeslagen</span>
            </div>
          )}
          {hasPrevious && !expanded && !saved && (
            <span style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', fontStyle: 'italic' }}>· vorige sessie beschikbaar</span>
          )}
        </div>
        {expanded
          ? <ChevronUp size={13} color="rgba(255,255,255,0.2)" strokeWidth={2.5} />
          : <ChevronDown size={13} color="rgba(255,255,255,0.2)" strokeWidth={2.5} />}
      </button>

      {expanded && (
        <div style={{ padding: isMobile ? '0 1rem 0.875rem' : '0 1.25rem 1rem' }}>

          {hasPrevious && (
            <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Vorige sessie</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {SETTING_FIELDS.filter(f => previousSettings[f.key]).map(f => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>{f.label}:</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontFamily: 'monospace' }}>{previousSettings[f.key]}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => handleChange({ ...previousSettings })}
                style={{ marginTop: '0.5rem', padding: '0.25rem 0.625rem', background: 'transparent', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '5px', color: 'rgba(255,215,0,0.5)', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Zelfde instelling gebruiken
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {SETTING_FIELDS.filter(f => f.key !== 'notes').map(f => (
              <div key={f.key}>
                <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{f.label}</div>
                <input type="text" value={value[f.key] || ''} onChange={(e) => handleChange({ ...value, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.75rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '0.625rem' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Notitie</div>
            <input type="text" value={value.notes || ''} onChange={(e) => handleChange({ ...value, notes: e.target.value })} placeholder="bv. voeten iets naar buiten, smalle grip"
              style={{ width: '100%', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: '#fff', fontSize: '0.75rem', fontWeight: '500', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button onClick={handleSave}
            style={{ width: '100%', padding: '0.5rem', background: saved ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${saved ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', color: saved ? '#10b981' : 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease' }}>
            {saved ? <><CheckCircle size={12} strokeWidth={2.5} />Opgeslagen!</> : 'Instellingen opslaan'}
          </button>
        </div>
      )}
    </div>
  )
}
