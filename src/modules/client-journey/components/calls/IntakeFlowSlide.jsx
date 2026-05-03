// src/modules/client-journey/components/calls/IntakeFlowSlide.jsx
// v3 — lokale state voor tekstveld, pills onafhankelijk
import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { C } from './IntakeCallHelpers'

export function FlowQuestion({ question, contextItems = [], suggestions = [], value = '', onChange, isMobile }) {
  // Lokale state voor tekstveld — altijd leeg bij mount
  // Pills komen uit value, vrije tekst is altijd lokaal
  const [localText, setLocalText] = useState('')

  // Reset bij nieuwe vraag
  const prevQuestion = React.useRef(question)
  if (prevQuestion.current !== question) {
    prevQuestion.current = question
    setLocalText('')
  }

  const selected = value.split(' · ').filter(p => suggestions.includes(p))

  const togglePill = (pill) => {
    const curPills = value.split(' · ').filter(p => suggestions.includes(p))
    const exists = curPills.includes(pill)
    const nextPills = exists ? curPills.filter(p => p !== pill) : [...curPills, pill]
    const parts = [...nextPills, ...(localText ? [localText] : [])].filter(Boolean)
    onChange(parts.join(' · '))
  }

  const handleFreeText = (e) => {
    const text = e.target.value
    setLocalText(text)
    const curPills = value.split(' · ').filter(p => suggestions.includes(p))
    const parts = [...curPills, ...(text ? [text] : [])].filter(Boolean)
    onChange(parts.join(' · '))
  }

  return (
    <div style={{ padding: isMobile ? '1rem 0.75rem' : '1.25rem 1rem' }}>

      {/* Context — flush tabel, geen pills */}
      {contextItems.length > 0 && (
        <div style={{
          marginBottom: '0.875rem',
          border: '1px solid rgba(255,215,0,0.08)',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {contextItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.3rem 0.5rem',
              borderBottom: i < contextItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
            }}>
              <span style={{
                fontSize: '0.38rem', fontWeight: 700,
                color: 'rgba(255,215,0,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                flexShrink: 0, minWidth: '52px',
                marginTop: '0.1rem'
              }}>{item.label}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.4
              }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vraag */}
      <div style={{
        fontSize: isMobile ? '1.05rem' : '1.15rem',
        fontWeight: 800, color: C.text,
        lineHeight: 1.3, marginBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>{question}</div>

      {/* Pills */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {suggestions.map((s, i) => {
            const active = selected.includes(s)
            return (
              <button key={i} onClick={() => togglePill(s)} style={{
                padding: isMobile ? '0.35rem 0.625rem' : '0.3rem 0.6rem',
                background: active ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '20px',
                color: active ? C.gold : 'rgba(255,255,255,0.35)',
                fontSize: isMobile ? '0.68rem' : '0.72rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                transition: 'all 0.15s ease',
                minHeight: '32px'
              }}>
                {active && <Check size={10} color={C.gold} strokeWidth={2.5} />}
                {s}
              </button>
            )
          })}
        </div>
      )}

      {/* Vrij tekstveld — eigen state, altijd bewerkbaar */}
      <input
        type="text"
        value={localText}
        onChange={handleFreeText}
        placeholder="Of typ zelf..."
        style={{
          width: '100%',
          padding: '0.35rem 0',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${localText ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
          color: localText ? C.text : 'rgba(255,255,255,0.3)',
          fontSize: '0.72rem',
          fontWeight: 500,
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          borderRadius: 0,
          WebkitAppearance: 'none'
        }}
      />
    </div>
  )
}

export function DeliveryPicker({ options, value = '', onChange, isMobile }) {
  const selected = value ? value.split('\n').filter(Boolean) : []

  const toggle = (opt) => {
    const exists = selected.includes(opt)
    const next = exists ? selected.filter(s => s !== opt) : [...selected, opt]
    onChange(next.join('\n'))
  }

  const customValue = selected.find(s => !options.includes(s)) || ''
  const setCustom = (v) => {
    const fixed = selected.filter(s => options.includes(s))
    if (v.trim()) onChange([...fixed, v].join('\n'))
    else onChange(fixed.join('\n'))
  }

  return (
    <div style={{ padding: isMobile ? '0 0.75rem 0.75rem' : '0 1rem 1rem' }}>
      <div style={{
        fontSize: '0.42rem', fontWeight: 700,
        color: 'rgba(255,215,0,0.45)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '0.5rem'
      }}>WAT GA IK VOOR JOU DOEN</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {options.map((opt, i) => {
          const active = selected.includes(opt)
          return (
            <button key={i} onClick={() => toggle(opt)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.625rem',
              background: active ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '6px', cursor: 'pointer', textAlign: 'left', width: '100%',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease'
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                background: active ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {active && <Check size={8} color={C.gold} strokeWidth={3} />}
              </div>
              <span style={{
                fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: active ? 700 : 500,
                color: active ? C.gold : 'rgba(255,255,255,0.4)'
              }}>{opt}</span>
            </button>
          )
        })}

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 0.625rem',
          borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '0.1rem'
        }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
            background: customValue ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${customValue ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {customValue && <Check size={8} color={C.gold} strokeWidth={3} />}
          </div>
          <input
            type="text"
            value={customValue}
            onChange={e => setCustom(e.target.value)}
            placeholder="Anders, namelijk..."
            style={{
              flex: 1, padding: '0.1rem 0',
              background: 'transparent', border: 'none',
              color: customValue ? C.gold : 'rgba(255,255,255,0.25)',
              fontSize: '0.72rem', fontWeight: customValue ? 700 : 500,
              outline: 'none', fontFamily: 'inherit', borderRadius: 0
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function FlowNav({ onBack, onNext, nextLabel = 'VOLGENDE', isLast = false, isMobile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: isMobile ? '0.5rem 0.75rem 0.75rem' : '0.5rem 1rem 1rem',
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: '36px', height: '36px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px',
          color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <ChevronLeft size={14} />
        </button>
      )}
      <button onClick={onNext} style={{
        flex: 1, padding: '0.5rem',
        background: isLast ? 'rgba(16,185,129,0.08)' : 'transparent',
        border: `1px solid ${isLast ? 'rgba(16,185,129,0.2)' : 'rgba(255,215,0,0.15)'}`,
        borderRadius: '6px',
        color: isLast ? C.green : C.gold,
        fontSize: '0.65rem', fontWeight: 700,
        cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent', minHeight: '38px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
        letterSpacing: '0.04em', textTransform: 'uppercase'
      }}>
        {nextLabel} {!isLast && <ChevronRight size={11} />}
      </button>
    </div>
  )
}
