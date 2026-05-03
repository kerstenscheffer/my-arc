// src/modules/nutrition-intake/components/PreferenceSection.jsx
// v2 — Direct checkboxes, no accept/customize flow
// Items are shown immediately with checkmarks, tap to toggle
// Explicit "Opslaan" button to advance
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

export default function PreferenceSection({
  title, subtitle, stepNumber, items = [], value, onChange, onComplete, isMobile,
  hideHeader = false, showAdditions = true, showNotes = true, customLabels = {}
}) {
  // Start with all items selected (checked)
  const [removals, setRemovals] = useState([])
  const [additions, setAdditions] = useState('')
  const [notes, setNotes] = useState('')

  const labels = {
    removeTitle: customLabels.removeTitle || 'Tap om uit te sluiten',
    addTitle: customLabels.addTitle || 'Mis je iets? Voeg toe',
    notesTitle: customLabels.notesTitle || 'Opmerkingen',
    ...customLabels
  }

  useEffect(() => {
    if (value) {
      setRemovals(value.removals || [])
      setAdditions(value.additions?.join(', ') || '')
      setNotes(value.notes || '')
    }
  }, [value])

  const handleToggle = (itemId) => {
    setRemovals(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId])
  }

  const handleConfirm = () => {
    const addArr = additions.split(',').map(s => s.trim()).filter(Boolean)
    onChange({
      standard_list: items.map(i => i.name),
      removals,
      additions: addArr,
      notes: notes || null
    })
  }

  const activeCount = items.length - removals.length
  const addCount = additions.split(',').filter(s => s.trim()).length

  return (
    <div>
      {/* Header */}
      {!hideHeader && (
        <div style={{ padding: r(isMobile, '0.75rem 1rem', '1rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
            <span style={{ fontSize: '0.45rem', fontWeight: 700, color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stap {stepNumber}</span>
            {value && <span style={{ fontSize: '0.45rem', fontWeight: 700, color: t.colors.green, textTransform: 'uppercase' }}>{'\u2713'} Klaar</span>}
          </div>
          <div style={{ fontSize: r(isMobile, '0.95rem', '1.05rem'), fontWeight: 800, color: t.colors.white }}>{title}</div>
          {subtitle && <div style={{ fontSize: r(isMobile, '0.6rem', '0.65rem'), color: t.colors.textSecondary, marginTop: '0.1rem' }}>{subtitle}</div>}
        </div>
      )}

      {/* Status bar */}
      <div style={{
        padding: r(isMobile, '0.35rem 1rem', '0.4rem 1.25rem'),
        background: t.colors.goldBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${t.colors.border}`
      }}>
        <span style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.gold }}>{labels.removeTitle}</span>
        <span style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 800, color: t.colors.textSecondary }}>{activeCount}/{items.length}</span>
      </div>

      {/* Items — direct toggleable */}
      {items.map((item, index) => {
        const isRemoved = removals.includes(item.id)
        return (
          <div key={item.id} onClick={() => handleToggle(item.id)} style={{
            display: 'flex',
            padding: r(isMobile, '0.55rem 1rem', '0.65rem 1.25rem'),
            borderBottom: index < items.length - 1 ? `1px solid ${t.colors.border}` : 'none',
            gap: r(isMobile, '0.5rem', '0.6rem'), alignItems: 'center',
            opacity: isRemoved ? 0.35 : 1, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'opacity 0.2s ease'
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '4px',
              border: `2px solid ${isRemoved ? t.colors.red : t.colors.gold}`,
              background: isRemoved ? 'transparent' : t.colors.gold,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s ease'
            }}>
              {!isRemoved && <span style={{ fontSize: '11px', fontWeight: 800, color: '#000' }}>{'\u2713'}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: 700,
                color: isRemoved ? t.colors.textMuted : t.colors.white,
                textDecoration: isRemoved ? 'line-through' : 'none', lineHeight: 1.2
              }}>{item.name}</div>
              {item.reason && <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), color: t.colors.textMuted, marginTop: '0.05rem' }}>{item.reason}</div>}
            </div>
            {isRemoved && <span style={{ fontSize: '0.5rem', fontWeight: 700, color: t.colors.red, textTransform: 'uppercase', flexShrink: 0 }}>Uit</span>}
          </div>
        )
      })}

      {/* Additions */}
      {showAdditions && (
        <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
          <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.gold, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{labels.addTitle}</div>
          <input type="text" value={additions} onChange={(e) => setAdditions(e.target.value)}
            placeholder="Scheid met komma's: Tonijn, Kalkoen, Tofu"
            style={{
              width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
              background: t.colors.inputBg, border: `1px solid ${additions ? 'rgba(255,215,0,0.25)' : t.colors.borderVisible}`,
              borderRadius: '8px', color: additions ? '#FFD700' : t.colors.white,
              fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: additions ? 800 : 600,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
            }}
            onFocus={e => { e.target.style.borderColor = '#FFD700' }}
            onBlur={e => { e.target.style.borderColor = additions ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)' }}
          />
          {addCount > 0 && <div style={{ marginTop: '0.2rem', fontSize: '0.5rem', color: t.colors.green, fontWeight: 700 }}>+{addCount} toegevoegd</div>}
        </div>
      )}

      {/* Notes */}
      {showNotes && (
        <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
          <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{labels.notesTitle}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Specifieke wensen of opmerkingen..."
            rows={2} style={{
              width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
              background: t.colors.inputBg, border: `1px solid ${t.colors.borderVisible}`,
              borderRadius: '8px', color: t.colors.white,
              fontSize: r(isMobile, '0.8rem', '0.85rem'), fontFamily: 'inherit',
              outline: 'none', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box'
            }}
            onFocus={e => { e.target.style.borderColor = '#FFD700' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </div>
      )}

      {/* Confirm — explicit advance */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={handleConfirm} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '8px', color: '#FFD700',
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: 'pointer', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>OPSLAAN EN DOOR</button>
      </div>
    </div>
  )
}
