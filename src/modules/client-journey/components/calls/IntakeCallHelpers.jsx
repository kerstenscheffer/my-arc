// src/modules/client-journey/components/calls/IntakeCallHelpers.jsx
// Shared components for intake call — follows MY ARC Styling Doc exactly
import React from 'react'

// ── COLORS (from styling doc) ──
export const C = {
  gold: '#FFD700', darkGold: '#D4AF37',
  green: '#10b981', blue: '#3b82f6', red: '#ef4444', amber: '#f59e0b', purple: '#a855f7',
  bg: '#0a0a0a', card: '#111',
  text: '#fff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)',
  borderSub: 'rgba(255,255,255,0.04)',
  borderFaint: 'rgba(255,255,255,0.03)',
  goldBorder: 'rgba(255,215,0,0.15)',
  goldBg: 'rgba(255,215,0,0.02)'
}

// ── FLUSH STAT BAR (styling doc §4) ──
export function StatBar({ stats, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${C.borderSub}`
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1, textAlign: 'center',
          padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem',
          borderRight: i < stats.length - 1 ? `1px solid ${C.borderSub}` : 'none'
        }}>
          <div style={{
            fontSize: isMobile ? '0.4rem' : '0.45rem', fontWeight: 700,
            color: C.text25, textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '0.1rem'
          }}>{s.label}</div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: 800, color: s.color || C.text, lineHeight: 1
          }}>
            {s.value ?? '—'}
            {s.unit && <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4, marginLeft: '0.05rem' }}>{s.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── DATA ROW (label + value, divider-based, styling doc §4) ──
export function DataRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '0.3rem 0',
      borderBottom: `1px solid ${C.borderFaint}`
    }}>
      <span style={{
        fontSize: '0.4rem', fontWeight: 700, color: C.text25,
        textTransform: 'uppercase', letterSpacing: '0.05em'
      }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: color || C.text }}>{value}</span>
    </div>
  )
}

// ── QUESTION BLOCK (vraag + notitie textarea) ──
export function QuestionBlock({ q, value, onChange, prefill, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{
        fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 700,
        color: C.text, lineHeight: 1.35, marginBottom: '0.3rem'
      }}>{q}</div>
      {prefill && (
        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 600,
          color: C.gold, marginBottom: '0.25rem',
          display: 'flex', alignItems: 'center', gap: '0.3rem'
        }}>
          <span style={{ fontSize: '0.4rem', color: C.text25, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FORMULIER</span>
          {prefill}
        </div>
      )}
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="Antwoord / notitie..." rows={2}
        style={{
          width: '100%', padding: '0.3rem 0', background: 'transparent',
          border: 'none', borderBottom: `1px solid ${C.borderSub}`,
          color: C.text, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          resize: 'none', lineHeight: 1.5, borderRadius: 0
        }}
      />
    </div>
  )
}

// ── SECTION HEADER (collapsible block title with optional hero image) ──
export function BlockHeader({ title, icon: Icon, color, expanded, onToggle, badge, image }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.borderSub}` }}>
      {/* Hero image when expanded */}
      {expanded && image && (
        <div style={{
          position: 'relative', height: '80px', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover', backgroundPosition: 'center'
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
          }} />
          <div style={{
            position: 'absolute', bottom: '0.4rem', left: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            {Icon && <Icon size={14} color={color || C.gold} />}
            <span style={{
              fontSize: '0.4rem', fontWeight: 700, color: color || C.gold,
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>{title}</span>
            {badge && <span style={{ fontSize: '0.4rem', color: C.text25 }}>{badge}</span>}
          </div>
        </div>
      )}
      {/* Collapsed header */}
      {(!expanded || !image) && (
        <button onClick={onToggle} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          background: expanded ? C.goldBg : 'transparent',
          border: 'none', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {Icon && <Icon size={14} color={expanded ? (color || C.gold) : 'rgba(255,255,255,0.3)'} />}
            <span style={{
              fontSize: '0.4rem', fontWeight: 700, color: expanded ? C.text : C.text50,
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {badge && <span style={{ fontSize: '0.4rem', color: C.text25 }}>{badge}</span>}
            <span style={{ fontSize: '0.5rem', color: C.text25 }}>{expanded ? '▼' : '▶'}</span>
          </div>
        </button>
      )}
      {/* Clickable overlay on expanded image */}
      {expanded && image && (
        <button onClick={onToggle} style={{
          position: 'absolute', top: 0, right: '0.5rem', marginTop: '0.3rem',
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '4px',
          padding: '0.15rem 0.3rem', color: C.text25, fontSize: '0.4rem',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>▼</button>
      )}
    </div>
  )
}

// ── NOTE FIELD (simple labeled textarea) ──
export function NoteField({ label, value, onChange, placeholder, color, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{
        fontSize: '0.4rem', fontWeight: 700, color: color || C.blue,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem'
      }}>{label}</div>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Notitie...'} rows={2}
        style={{
          width: '100%', padding: '0.25rem 0', background: 'transparent',
          border: 'none', borderBottom: `1px solid ${C.borderSub}`,
          color: C.text, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          resize: 'none', lineHeight: 1.5, borderRadius: 0
        }}
      />
    </div>
  )
}

// ── SUGGESTION LIST ──
export function Suggestions({ items, isMobile }) {
  if (!items?.length) return null
  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
      <div style={{
        fontSize: '0.4rem', fontWeight: 700, color: C.text25,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem'
      }}>SUGGESTIES</div>
      {items.map((s, i) => (
        <div key={i} style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 400,
          color: C.text25, lineHeight: 1.6, padding: '0.1rem 0'
        }}>{s}</div>
      ))}
    </div>
  )
}

// ── LABEL HELPERS ──
export const labels = {
  goal: g => ({ fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw', recomp: 'Recomp', general_fitness: 'Fitter', maintain: 'Onderhoud' })[g] || g || '—',
  coaching: c => ({ direct: 'Hard & direct', motivating: 'Motiverend', data_driven: 'Data-driven', relaxed: 'Relaxed' })[c] || c || '—',
  experience: e => ({ beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' })[e] || e || '—',
  split: s => ({ push_pull_legs: 'PPL', upper_lower: 'Upper/Lower', full_body: 'Full Body', bro_split: 'Bro Split', no_preference: 'Geen voorkeur', dont_know: 'Weet niet' })[s] || s || '—',
  focus: f => ({ strength: 'Kracht', hypertrophy: 'Spiergroei', mix: 'Mix', no_preference: 'Geen voorkeur' })[f] || f || '—',
  activity: a => ({ sedentary: 'Sedentair', lightly_active: 'Licht actief', moderately_active: 'Matig actief', very_active: 'Zeer actief' })[a] || a || '—'
}
