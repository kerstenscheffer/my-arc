// src/modules/public-intake/components/phase1/FlowStep.jsx
// Gedeelde UI primitieven voor de conversational intake flow
// Gebruikt door alle phase1 Flow componenten

import React, { useState } from 'react'

// ── Typografie ────────────────────────────────────────────────────────────────

export function Q({ children, isMobile }) {
  return (
    <div style={{
      fontSize: isMobile ? '1.15rem' : '1.25rem',
      fontWeight: 800, color: '#fff',
      lineHeight: 1.3, marginBottom: '0.6rem'
    }}>{children}</div>
  )
}

export function Hint({ children, isMobile }) {
  return (
    <div style={{
      fontSize: isMobile ? '0.72rem' : '0.75rem',
      color: 'rgba(255,255,255,0.35)',
      fontWeight: 500, lineHeight: 1.5,
      marginBottom: '0.6rem', marginTop: '-0.3rem'
    }}>{children}</div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.45rem', fontWeight: 800,
      color: 'rgba(255,215,0,0.5)',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      marginBottom: '0.5rem'
    }}>{children}</div>
  )
}

// ── Knoppen ───────────────────────────────────────────────────────────────────

export function NextBtn({ onClick, label = 'VOLGENDE →', disabled, isMobile }) {
  return (
    <button
      onClick={disabled ? null : onClick}
      style={{
        width: '100%',
        padding: isMobile ? '0.85rem' : '0.9rem',
        background: disabled
          ? 'rgba(255,215,0,0.04)'
          : 'linear-gradient(90deg, #FFD700, #FFA500)',
        border: disabled ? '1px solid rgba(255,215,0,0.1)' : 'none',
        borderRadius: '8px',
        color: disabled ? 'rgba(255,215,0,0.2)' : '#000',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: 800, letterSpacing: '0.02em',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', marginTop: '0.5rem',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease'
      }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >{label}</button>
  )
}

export function BackBtn({ onBack }) {
  if (!onBack) return null
  return (
    <button onClick={onBack} style={{
      background: 'transparent', border: 'none',
      color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem',
      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      padding: '0.1rem 0', marginBottom: '0.4rem',
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
    }}>← Terug</button>
  )
}

export function SkipBtn({ onClick, label, isMobile }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none',
      color: 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.65rem' : '0.68rem',
      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      padding: '0.2rem 0', marginTop: '0.1rem',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
    }}>{label || 'Overslaan →'}</button>
  )
}

// ── Grote keuze-optie ─────────────────────────────────────────────────────────

export function BigOption({ label, sub, onClick, selected, isMobile, color }) {
  const accentColor = color || '#FFD700'
  return (
    <button onClick={onClick} style={{
      width: '100%',
      padding: isMobile ? '0.85rem 1rem' : '0.95rem 1rem',
      background: selected ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
      border: `1px solid ${selected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
      borderLeft: selected ? `3px solid ${accentColor}` : '1px solid rgba(255,255,255,0.07)',
      borderRadius: selected ? '0 8px 8px 0' : '8px',
      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.15s ease'
    }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? accentColor : 'rgba(255,255,255,0.15)'}`,
        background: selected ? accentColor : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease'
      }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: 700,
          color: selected ? '#FFD700' : 'rgba(255,255,255,0.85)',
          lineHeight: 1.25
        }}>{label}</div>
        {sub && (
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.68rem',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 500, marginTop: '0.2rem', lineHeight: 1.4
          }}>{sub}</div>
        )}
      </div>
    </button>
  )
}

// ── 2-kolom optie grid (voor kortere opties) ──────────────────────────────────

export function OptionGrid({ options, value, onChange, isMobile, columns = 2 }) {
  const cols = isMobile ? Math.min(columns, 2) : columns
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0.3rem'
    }}>
      {options.map(opt => {
        const isSelected = value === opt.value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: isMobile ? '0.7rem 0.5rem' : '0.75rem 0.6rem',
            background: isSelected ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
            border: `1px solid ${isSelected ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '8px',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease'
          }}>
            <div style={{
              fontSize: isMobile ? '0.78rem' : '0.82rem',
              fontWeight: isSelected ? 800 : 600,
              color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.75)',
              lineHeight: 1.25, marginBottom: opt.sub ? '0.15rem' : 0
            }}>
              {isSelected && '✓ '}{opt.label}
            </div>
            {opt.sub && (
              <div style={{
                fontSize: isMobile ? '0.58rem' : '0.6rem',
                color: 'rgba(255,255,255,0.25)', fontWeight: 500, lineHeight: 1.3
              }}>{opt.sub}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Tekstveld ─────────────────────────────────────────────────────────────────

export function TextField({ placeholder, value, onChange, multiline, isMobile, autoFocus }) {
  const [focused, setFocused] = useState(false)
  const base = {
    width: '100%', boxSizing: 'border-box',
    padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
    background: focused ? 'rgba(255,215,0,0.03)' : '#0d0d0d',
    border: `1px solid ${focused ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderLeft: focused ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem',
    fontWeight: 500, fontFamily: 'inherit', outline: 'none',
    transition: 'all 0.15s ease'
  }
  if (multiline) return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder} rows={3}
      autoFocus={autoFocus}
      style={{ ...base, resize: 'none', lineHeight: 1.6 }}
    />
  )
  return (
    <input
      type="text" value={value || ''}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={base}
    />
  )
}

// ── Getal input ───────────────────────────────────────────────────────────────

export function NumberField({ placeholder, value, onChange, unit, min, max, isMobile }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="number" value={value || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        min={min} max={max}
        style={{
          flex: 1,
          padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
          background: focused ? 'rgba(255,215,0,0.03)' : '#0d0d0d',
          border: `1px solid ${focused ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderLeft: focused ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: value ? '#FFD700' : '#fff',
          fontSize: isMobile ? '1.2rem' : '1.3rem',
          fontWeight: value ? 800 : 500,
          fontFamily: 'inherit', outline: 'none',
          WebkitAppearance: 'none', appearance: 'none',
          MozAppearance: 'textfield',
          transition: 'all 0.15s ease'
        }}
      />
      {unit && (
        <span style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255,255,255,0.3)', fontWeight: 600
        }}>{unit}</span>
      )}
    </div>
  )
}

// ── Dag selector ──────────────────────────────────────────────────────────────

const ALL_DAYS = ['ma','di','wo','do','vr','za','zo']
const DAY_LABELS = { ma:'Ma', di:'Di', wo:'Wo', do:'Do', vr:'Vr', za:'Za', zo:'Zo' }

export function DayPicker({ selected, onToggle, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: '0.2rem' }}>
      {ALL_DAYS.map(day => {
        const isSelected = selected.includes(day)
        return (
          <button key={day} onClick={() => onToggle(day)} style={{
            flex: 1, padding: isMobile ? '0.65rem 0' : '0.7rem 0',
            background: isSelected ? 'rgba(255,215,0,0.1)' : '#0d0d0d',
            border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '8px',
            color: isSelected ? '#FFD700' : 'rgba(255,255,255,0.35)',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: isSelected ? 800 : 600,
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease', minHeight: '44px'
          }}>
            {DAY_LABELS[day]}
          </button>
        )
      })}
    </div>
  )
}

// ── Slider ────────────────────────────────────────────────────────────────────

export function Slider({ label, value, onChange, min, max, step = 1, suffix, isMobile }) {
  const pct = ((value || min) - min) / (max - min) * 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: isMobile ? '1.4rem' : '1.5rem', fontWeight: 900, color: '#FFD700', lineHeight: 1 }}>
          {value || min}
          {suffix && <span style={{ fontSize: '0.6rem', opacity: 0.5, marginLeft: '0.15rem' }}>{suffix}</span>}
        </div>
      </div>
      <div style={{ position: 'relative', height: '32px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '2px' }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value || min}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{ width: '100%', height: '32px', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', background: 'transparent', position: 'relative', zIndex: 2, touchAction: 'manipulation' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem' }}>
        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>{min}</span>
        <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.15)', fontWeight: 600 }}>{max}</span>
      </div>
    </div>
  )
}

// ── Foto option grid (voor doel, activiteit etc.) ─────────────────────────────

export function PhotoGrid({ options, value, onChange, isMobile, columns = 2 }) {
  const cols = isMobile ? 2 : columns
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? '0.4rem' : '0.5rem' }}>
      {options.map(opt => {
        const isSelected = value === opt.value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: 0, background: isSelected ? 'rgba(255,215,0,0.06)' : '#0a0a0a',
            border: `1px solid ${isSelected ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'left', overflow: 'hidden', position: 'relative',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease'
          }}>
            {opt.image && (
              <div style={{
                width: '100%', height: isMobile ? '70px' : '80px',
                backgroundImage: `url(${opt.image})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isSelected
                    ? 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2))'
                    : 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3))'
                }} />
                {isSelected && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #FFD700, #FFA500)' }} />
                )}
              </div>
            )}
            <div style={{ padding: isMobile ? '0.5rem 0.6rem' : '0.6rem 0.7rem' }}>
              <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: isSelected ? 800 : 700, color: isSelected ? '#FFD700' : '#fff', lineHeight: 1.2, marginBottom: '0.1rem' }}>
                {opt.label}
              </div>
              {opt.sub && (
                <div style={{ fontSize: isMobile ? '0.52rem' : '0.55rem', color: isSelected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                  {opt.sub}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Progress bar bovenaan ─────────────────────────────────────────────────────

export function FlowProgress({ sections, currentSection, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginBottom: '0.75rem' }}>
      {sections.map((label, i) => {
        const isDone = i < currentSection
        const isCurrent = i === currentSection
        return (
          <React.Fragment key={label}>
            <div style={{
              padding: '0.22rem 0.6rem',
              background: isDone ? 'rgba(16,185,129,0.08)' : isCurrent ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isCurrent ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: '20px', fontSize: '0.48rem', fontWeight: 800,
              color: isDone ? '#10b981' : isCurrent ? '#FFD700' : 'rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap'
            }}>
              {isDone ? `✓ ${label}` : label}
            </div>
            {i < sections.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Schaal 1-10 ───────────────────────────────────────────────────────────────
// Tien knoppen i.p.v. een slider: op een telefoon is tikken preciezer dan
// slepen, en je ziet meteen wat je gekozen hebt zonder het handvat vast te
// houden. Twee rijen van vijf zodat elke knop een fatsoenlijk raakvlak houdt.
export function SchaalTien({ value, onChange, laag = 'Heel laag', hoog = 'Heel hoog', isMobile }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: isMobile ? 5 : 6 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const aan = Number(value) === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                padding: isMobile ? '0.75rem 0' : '0.8rem 0',
                background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                fontSize: isMobile ? '1rem' : '1.05rem',
                fontWeight: 900, fontFamily: 'inherit',
                cursor: 'pointer', minHeight: 44,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.12s ease',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem',
        fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
      }}>
        <span>1 · {laag}</span>
        <span>10 · {hoog}</span>
      </div>
    </div>
  )
}
