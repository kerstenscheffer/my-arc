// src/modules/public-intake/components/IntakeSelect.jsx
// Option grid with stock photos, dropdown, slider, date picker — no emojis
import React, { useState, useMemo } from 'react'

// ============================================
// DROPDOWN SELECT
// ============================================
export function IntakeSelect({ label, value, onChange, options, error, required, isMobile }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.35rem'
      }}>
        {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
      </label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{
        width: '100%',
        padding: isMobile ? '0.65rem 0.75rem' : '0.7rem 0.85rem',
        background: '#111',
        border: `1px solid ${error ? '#dc2626' : value ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 0,
        color: value ? '#FFD700' : 'rgba(255,255,255,0.3)',
        fontSize: isMobile ? '16px' : '0.9rem',
        fontWeight: value ? 800 : 600,
        outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
        WebkitAppearance: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.3)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `right ${isMobile ? '0.75rem' : '0.85rem'} center`
      }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#111', color: '#fff' }}>{o.label}</option>
        ))}
      </select>
      {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.25rem' }}>{error}</div>}
    </div>
  )
}

// ============================================
// OPTION GRID — with optional stock photos, no emojis
// ============================================
export function IntakeOptionGrid({ label, value, onChange, options, columns = 2, error, required, isMobile }) {
  const cols = isMobile ? Math.min(columns, 2) : columns

  return (
    <div>
      <label style={{
        display: 'block', fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: 800, color: '#fff',
        letterSpacing: '0.01em',
        marginBottom: '0.5rem'
      }}>
        {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
      </label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: isMobile ? '0.5rem' : '0.6rem'
      }}>
        {options.map((o) => {
          const active = value === o.value
          return (
            <button key={o.value} onClick={() => onChange(o.value)} style={{
              padding: 0,
              background: active ? 'rgba(255,215,0,0.06)' : '#0a0a0a',
              border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 0,
              color: active ? '#FFD700' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              overflow: 'hidden', position: 'relative',
              transform: 'translateZ(0)'
            }}
              onTouchStart={e => { if (!active) e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {/* Stock photo if provided */}
              {o.image && (
                <div style={{
                  width: '100%', height: isMobile ? '70px' : '80px',
                  backgroundImage: `url(${o.image})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: active
                      ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)'
                  }} />
                  {active && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: 'linear-gradient(90deg, #FFD700, #FFA500)'
                    }} />
                  )}
                </div>
              )}

              {/* Text content */}
              <div style={{
                padding: isMobile ? '0.5rem 0.6rem' : '0.6rem 0.7rem',
                display: 'flex', flexDirection: 'column', gap: '0.15rem'
              }}>
                {/* Icon if provided (no image fallback) */}
                {o.icon && !o.image && (
                  <o.icon
                    size={isMobile ? 16 : 18}
                    color={active ? '#FFD700' : 'rgba(255,255,255,0.3)'}
                    style={{ marginBottom: '0.15rem' }}
                  />
                )}
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: active ? 800 : 700,
                  color: active ? '#FFD700' : '#fff',
                  lineHeight: 1.2
                }}>{o.label}</span>
                {o.sub && (
                  <span style={{
                    fontSize: isMobile ? '0.5rem' : '0.52rem',
                    color: active ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)',
                    fontWeight: 500, lineHeight: 1.3
                  }}>{o.sub}</span>
                )}
              </div>

              {/* Active check indicator */}
              {active && !o.image && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)'
                }} />
              )}
            </button>
          )
        })}
      </div>
      {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.3rem' }}>{error}</div>}
    </div>
  )
}

// ============================================
// SLIDER
// ============================================
export function IntakeSlider({ label, value, onChange, min = 1, max = 10, step = 1, suffix = '', isMobile }) {
  const pct = ((value || min) - min) / (max - min) * 100

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>{label}</label>
        <span style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 900, color: '#FFD700', lineHeight: 1
        }}>
          {value || min}
          <span style={{ fontSize: '0.5rem', fontWeight: 600, opacity: 0.5, marginLeft: '0.1rem' }}>{suffix}</span>
        </span>
      </div>

      {/* Custom slider track */}
      <div style={{ position: 'relative', height: '28px', display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '3px',
          background: 'rgba(255,255,255,0.06)', borderRadius: '2px'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            borderRadius: '2px', transition: 'width 0.1s ease'
          }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value || min}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{
            width: '100%', height: '28px', cursor: 'pointer',
            WebkitAppearance: 'none', appearance: 'none',
            background: 'transparent', position: 'relative', zIndex: 2,
            touchAction: 'manipulation'
          }}
        />
      </div>

      {/* Min/max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
        <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>{min}</span>
        <span style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>{max}</span>
      </div>
    </div>
  )
}

// ============================================
// DATE PICKER — Native date on mobile, dropdowns on desktop
// ============================================
export function IntakeDatePicker({ label, value, onChange, error, required, isMobile }) {
  // For mobile: use native date input (best UX — native scroll picker)
  // For desktop: 3 dropdowns
  const [focused, setFocused] = useState(false)

  if (isMobile) {
    const hasValue = !!value
    return (
      <div>
        <label style={{
          display: 'block', fontSize: '0.55rem',
          fontWeight: 700, color: focused ? '#FFD700' : 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          marginBottom: '0.3rem'
        }}>
          {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
        </label>
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          max={`${new Date().getFullYear() - 12}-12-31`}
          min={`${new Date().getFullYear() - 80}-01-01`}
          style={{
            width: '100%',
            padding: '0.7rem 0.75rem',
            background: focused ? 'rgba(255,215,0,0.03)' : hasValue ? '#0d0d0d' : '#111',
            border: `1px solid ${error ? '#dc2626' : focused ? '#FFD700' : hasValue ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderLeft: hasValue || focused ? '3px solid #FFD700' : `1px solid ${error ? '#dc2626' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 0,
            color: hasValue ? '#FFD700' : 'rgba(255,255,255,0.15)',
            fontSize: '16px', fontWeight: hasValue ? 800 : 400,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            WebkitAppearance: 'none', appearance: 'none',
            colorScheme: 'dark'
          }}
        />
        {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.2rem' }}>{error}</div>}
      </div>
    )
  }

  // Desktop: 3 dropdowns
  const parsed = useMemo(() => {
    if (!value) return { day: '', month: '', year: '' }
    const d = new Date(value)
    if (isNaN(d)) return { day: '', month: '', year: '' }
    return { day: String(d.getDate()), month: String(d.getMonth() + 1), year: String(d.getFullYear()) }
  }, [value])

  const [day, setDay] = useState(parsed.day)
  const [month, setMonth] = useState(parsed.month)
  const [year, setYear] = useState(parsed.year)

  const handleChange = (newDay, newMonth, newYear) => {
    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = currentYear - 12; y >= currentYear - 80; y--) years.push(y)

  const months = [
    { v: '1', l: 'Jan' }, { v: '2', l: 'Feb' }, { v: '3', l: 'Mrt' },
    { v: '4', l: 'Apr' }, { v: '5', l: 'Mei' }, { v: '6', l: 'Jun' },
    { v: '7', l: 'Jul' }, { v: '8', l: 'Aug' }, { v: '9', l: 'Sep' },
    { v: '10', l: 'Okt' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' }
  ]

  const daysInMonth = month && year ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31
  const days = []
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectStyle = (hasVal) => ({
    flex: 1,
    padding: '0.7rem 0.5rem',
    background: hasVal ? '#0d0d0d' : '#111',
    border: `1px solid ${error ? '#dc2626' : hasVal ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 0,
    color: hasVal ? '#FFD700' : 'rgba(255,255,255,0.15)',
    fontSize: '0.85rem', fontWeight: hasVal ? 800 : 400,
    fontStyle: hasVal ? 'normal' : 'italic',
    outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
    WebkitAppearance: 'none', appearance: 'none',
    textAlign: 'center',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='rgba(255,255,255,0.2)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.4rem center'
  })

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.6rem',
        fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.3rem'
      }}>
        {label}{required && <span style={{ color: '#FFD700', marginLeft: '0.2rem', fontSize: '0.5rem' }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        <select value={day} onChange={e => { setDay(e.target.value); handleChange(e.target.value, month, year) }} style={selectStyle(!!day)}>
          <option value="" style={{ background: '#111', color: 'rgba(255,255,255,0.3)' }}>Dag</option>
          {days.map(d => <option key={d} value={String(d)} style={{ background: '#111', color: '#fff' }}>{d}</option>)}
        </select>
        <select value={month} onChange={e => { setMonth(e.target.value); handleChange(day, e.target.value, year) }} style={selectStyle(!!month)}>
          <option value="" style={{ background: '#111', color: 'rgba(255,255,255,0.3)' }}>Maand</option>
          {months.map(m => <option key={m.v} value={m.v} style={{ background: '#111', color: '#fff' }}>{m.l}</option>)}
        </select>
        <select value={year} onChange={e => { setYear(e.target.value); handleChange(day, month, e.target.value) }} style={selectStyle(!!year)}>
          <option value="" style={{ background: '#111', color: 'rgba(255,255,255,0.3)' }}>Jaar</option>
          {years.map(y => <option key={y} value={String(y)} style={{ background: '#111', color: '#fff' }}>{y}</option>)}
        </select>
      </div>
      {error && <div style={{ fontSize: '0.45rem', color: '#dc2626', fontWeight: 700, marginTop: '0.2rem' }}>{error}</div>}
    </div>
  )
}
