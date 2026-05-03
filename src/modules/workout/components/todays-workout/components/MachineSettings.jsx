// src/modules/workout/components/todays-workout/components/MachineSettings.jsx
import { useState } from 'react'
import { Settings, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'

const SETTING_FIELDS = [
  { key: 'seat', label: 'Zitpositie', placeholder: 'bv. stand 3' },
  { key: 'back', label: 'Rugleuning', placeholder: 'bv. stand 5' },
  { key: 'weight_arm', label: 'Gewichtsarm', placeholder: 'bv. stand 2' },
  { key: 'pad', label: 'Kussen/pad', placeholder: 'bv. stand 1' },
  { key: 'cable_height', label: 'Kabelhoogte', placeholder: 'bv. laagste stand' },
  { key: 'notes', label: 'Notitie', placeholder: 'bv. voeten iets naar buiten' }
]

export default function MachineSettings({ value = {}, onChange, previousSettings, isMobile, onSave }) {
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
