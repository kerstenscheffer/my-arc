// src/modules/public-intake/components/IntakeField.jsx
// v3 — Clear placeholder vs value distinction, phone country code, sharp edges
import React, { useState } from 'react'

// Shared input style
const inputBase = (m, error, hasValue, focused) => ({
  width: '100%',
  padding: m ? '0.7rem 0.75rem' : '0.75rem 0.85rem',
  background: focused ? 'rgba(255,215,0,0.03)' : hasValue ? '#0d0d0d' : '#111',
  border: `1px solid ${error ? '#dc2626' : focused ? '#FFD700' : hasValue ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
  borderLeft: hasValue && !error ? '3px solid #FFD700' : focused ? '3px solid #FFD700' : `1px solid ${error ? '#dc2626' : 'rgba(255,255,255,0.06)'}`,
  borderRadius: 0,
  color: hasValue ? '#FFD700' : '#fff',
  fontSize: m ? '16px' : '0.9rem',
  fontWeight: hasValue ? 800 : 500,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  WebkitAppearance: 'none', appearance: 'none'
})

const AUTOCOMPLETE_MAP = {
  first_name: 'given-name',
  last_name: 'family-name',
  email: 'email',
  phone: 'tel',
  date_of_birth: 'bday'
}

export default function IntakeField({
  label, value, onChange, onBlur, error, required,
  type = 'text', placeholder, multiline, half,
  min, max, step, isMobile, fieldName, autoComplete
}) {
  const [focused, setFocused] = useState(false)
  const hasValue = !!(value && String(value).trim())
  const ac = autoComplete || AUTOCOMPLETE_MAP[fieldName] || 'off'

  const content = (
    <div style={half ? { flex: 1, minWidth: 0 } : undefined}>
      <label style={{
        display: 'block', fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: 700, color: focused ? '#FFD700' : 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.3rem'
      }}>
        {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value || ''} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (onBlur) onBlur() }}
          placeholder={placeholder} rows={2}
          style={{
            ...inputBase(isMobile, error, hasValue, focused),
            resize: 'none', lineHeight: 1.5
          }}
          autoComplete={ac}
        />
      ) : (
        <input
          type={type} value={value || ''} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (onBlur) onBlur() }}
          placeholder={placeholder}
          min={min} max={max} step={step}
          style={inputBase(isMobile, error, hasValue, focused)}
          autoComplete={ac}
          name={fieldName || undefined}
        />
      )}
      {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.2rem' }}>{error}</div>}

      {/* Inline style for placeholder color — CSS pseudo-elements can't be done inline */}
      <style>{`
        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,0.15) !important;
          font-weight: 400 !important;
          font-style: italic !important;
        }
      `}</style>
    </div>
  )

  return content
}

// ============================================
// PHONE FIELD — Country code selector + number
// ============================================
export function IntakePhoneField({ label, value, onChange, error, required, isMobile }) {
  const [focused, setFocused] = useState(false)

  // Parse existing value into country + number
  const parsePhone = (val) => {
    if (!val) return { country: '+31', number: '' }
    const str = String(val).trim()
    if (str.startsWith('+32')) return { country: '+32', number: str.slice(3).trim() }
    if (str.startsWith('+31')) return { country: '+31', number: str.slice(3).trim() }
    if (str.startsWith('06')) return { country: '+31', number: str }
    if (str.startsWith('04')) return { country: '+32', number: str }
    return { country: '+31', number: str }
  }

  const parsed = parsePhone(value)
  const [country, setCountry] = useState(parsed.country)
  const hasValue = !!(parsed.number && parsed.number.trim())

  const handleCountryChange = (c) => {
    setCountry(c)
    onChange(parsed.number ? `${c} ${parsed.number}` : '')
  }

  const handleNumberChange = (num) => {
    onChange(num ? `${country} ${num}` : '')
  }

  return (
    <div>
      <label style={{
        display: 'block', fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: 700, color: focused ? '#FFD700' : 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.3rem'
      }}>
        {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Country code */}
        <select value={country} onChange={e => handleCountryChange(e.target.value)} style={{
          width: isMobile ? '72px' : '80px',
          padding: isMobile ? '0.7rem 0.4rem' : '0.75rem 0.5rem',
          background: '#0a0a0a',
          border: `1px solid ${error ? '#dc2626' : focused ? '#FFD700' : hasValue ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
          borderRight: 'none',
          borderRadius: 0,
          color: '#FFD700', fontSize: isMobile ? '14px' : '0.8rem', fontWeight: 800,
          outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
          WebkitAppearance: 'none', appearance: 'none',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <option value="+31" style={{ background: '#111', color: '#fff' }}>+31 NL</option>
          <option value="+32" style={{ background: '#111', color: '#fff' }}>+32 BE</option>
        </select>

        {/* Phone number */}
        <input
          type="tel"
          value={parsed.number}
          onChange={e => handleNumberChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="6 12345678"
          style={{
            flex: 1, minWidth: 0,
            padding: isMobile ? '0.7rem 0.75rem' : '0.75rem 0.85rem',
            background: focused ? 'rgba(255,215,0,0.03)' : hasValue ? '#0d0d0d' : '#111',
            border: `1px solid ${error ? '#dc2626' : focused ? '#FFD700' : hasValue ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderLeft: hasValue || focused ? '2px solid #FFD700' : `1px solid ${error ? '#dc2626' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 0,
            color: hasValue ? '#FFD700' : '#fff',
            fontSize: isMobile ? '16px' : '0.9rem',
            fontWeight: hasValue ? 800 : 500,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            WebkitAppearance: 'none', appearance: 'none'
          }}
          autoComplete="tel"
          name="phone"
        />
      </div>
      {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.2rem' }}>{error}</div>}
    </div>
  )
}

export { inputBase as fieldStyles }
