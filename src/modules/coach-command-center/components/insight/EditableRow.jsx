// src/modules/coach-command-center/components/insight/EditableRow.jsx
//
// Eén regel van de klantkaart: label links, waarde rechts, klik om te wijzigen.
// Stond in ClientDataColumn; sinds het doelen-paneel een eigen bestand heeft
// gebruiken twee kolommen hem, en dan hoort hij niet meer in één van de twee
// te wonen.

import React, { useState } from 'react'
import { Check, X, Edit3 } from 'lucide-react'
import { C } from './insightTokens'

export default function EditableRow({ label, value, field, type = 'text', options, suffix, isMobile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  // options mag strings bevatten of {value,label}-paren; met paren slaan we de
  // canonieke waarde op maar tonen we Nederlandse tekst.
  const opties = (options || []).map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  const leeg = value === null || value === undefined || value === ''
  const gekozen = opties.find(o => o.value === String(value))
  const display = leeg ? null : (gekozen ? gekozen.label : String(value))
  const rauw = leeg ? '' : String(value)

  const startEdit = () => {
    setDraft(rauw)
    setEditing(true)
  }

  const cancel = () => { setEditing(false); setDraft('') }

  const save = async () => {
    setSaving(true)
    let parsed = draft.trim()
    if (type === 'number') parsed = parsed === '' ? null : parseFloat(parsed) || null
    else if (type === 'integer') parsed = parsed === '' ? null : parseInt(parsed, 10) || null
    else if (parsed === '') parsed = null
    await onSave(field, parsed)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ padding: isMobile ? '0.5rem 0.85rem' : '0.55rem 1rem', borderBottom: `1px solid ${C.borderItem}`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', color: C.text50, letterSpacing: '-0.01em', fontWeight: '800', flexShrink: 0, minWidth: isMobile ? '60px' : '70px' }}>{label}</span>
        {options ? (
          <select value={draft} onChange={e => setDraft(e.target.value)} autoFocus style={{
            flex: 1, padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.gold}40`, borderRadius: '4px', color: '#fff',
            fontSize: isMobile ? '0.82rem' : '0.88rem', outline: 'none', fontFamily: 'inherit'
          }}>
            <option value="" style={{ background: '#111' }}>—</option>
            {opties.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
          </select>
        ) : (
          <input
            autoFocus type={type === 'number' || type === 'integer' ? 'number' : 'text'}
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            style={{
              flex: 1, padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${C.gold}40`, borderRadius: '4px', color: '#fff',
              fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', outline: 'none', fontFamily: 'inherit',
              minWidth: 0
            }}
          />
        )}
        <button onClick={save} disabled={saving} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', border: `1px solid rgba(16,185,129,0.3)`, color: C.green, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <Check size={10} />
        </button>
        <button onClick={cancel} style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <X size={10} />
        </button>
      </div>
    )
  }

  return (
    <div onClick={startEdit} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: isMobile ? '0.55rem 0.85rem' : '0.6rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.1s ease', gap: '0.75rem',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', color: C.text50, letterSpacing: '-0.01em', fontWeight: '800', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '800', color: display ? C.text : C.text15, textAlign: 'right', wordBreak: 'break-word', letterSpacing: '-0.01em' }}>
        {display ? `${display}${suffix || ''}` : '—'}
      </span>
    </div>
  )
}
