// src/modules/content-batches/components/DynamicItemsBuilder.jsx
// Stap 2 (custom formats): render per batch-item exact de velden die in het
// gekozen format zijn gedefinieerd. Waarden komen in item.fieldValues[key].
// De waarde van het EERSTE veld wordt ook als item.title bewaard, zodat de
// kaart een titel heeft en de "compleet"-check werkt.

import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, Plus, X } from 'lucide-react'
import { GOLD } from '../../output-planning/components/week-planning/constants'

// Haal een leesbare string uit een veldwaarde (string of array) voor titel/label.
function toText(raw) {
  if (Array.isArray(raw)) return (raw.find(v => v && String(v).trim()) || '')
  return typeof raw === 'string' ? raw : (raw == null ? '' : String(raw))
}

export default function DynamicItemsBuilder({ format, items, onItemsChange, isMobile = false }) {
  const [expanded, setExpanded] = useState(0)
  const fields = format?.fields || []
  const firstKey = fields[0]?.key

  const setValue = (index, key, value) => {
    const next = [...items]
    const fv = { ...(next[index].fieldValues || {}), [key]: value }
    next[index] = { ...next[index], fieldValues: fv }
    // Eerste veld = titel van het item (voor kaart-label + compleet-check).
    if (key === firstKey) next[index].title = toText(value)
    onItemsChange(next)
  }

  const itemLabel = (item, i) => {
    const v = toText(item.fieldValues?.[firstKey])
    return v.trim() ? v : `Item ${i + 1}`
  }
  const isComplete = (item) => toText(item.fieldValues?.[firstKey]).trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
          Vul {items.length} items in
        </h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
          Format: <span style={{ color: format?.color || GOLD.primary, fontWeight: 700 }}>{format?.name}</span> · {fields.length} velden
        </p>
      </div>

      {/* Voortgang */}
      <div style={{ padding: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
          <span>Voortgang</span>
          <span>{items.filter(isComplete).length} / {items.length} compleet</span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${(items.filter(isComplete).length / Math.max(items.length, 1)) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD.primary}, ${GOLD.secondary})`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {items.map((item, index) => {
        const open = expanded === index
        const complete = isComplete(item)
        return (
          <div key={index} style={{
            background: complete ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${complete ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div onClick={() => setExpanded(open ? -1 : index)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', cursor: 'pointer' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: complete ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${complete ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: complete ? '#FFD700' : 'rgba(255,255,255,0.6)',
              }}>{complete ? '✓' : index + 1}</div>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 600, color: complete ? '#FFD700' : 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {itemLabel(item, index)}
              </span>
              {open ? <ChevronUp size={18} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.5)" />}
            </div>

            {open && (
              <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingTop: '1rem' }}>
                {fields.map((f, fi) => (
                  <FieldInput key={f.key} field={f} isFirst={fi === 0}
                    value={item.fieldValues?.[f.key]}
                    onChange={(v) => setValue(index, f.key, v)} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldInput({ field, value, onChange, isFirst }) {
  const label = (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: isFirst ? 800 : 600, color: isFirst ? GOLD.primary : 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
      {field.label}{isFirst ? ' *' : ''}
    </label>
  )

  if (field.type === 'textarea') {
    return <div>{label}<textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} placeholder={field.label} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} /></div>
  }
  if (field.type === 'date') {
    return <div>{label}<input type="date" value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...input, cursor: 'pointer' }} /></div>
  }
  if (field.type === 'select') {
    return <div>{label}
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
        <option value="">— kies —</option>
        {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  }
  if (field.type === 'list') {
    const rows = Array.isArray(value) && value.length ? value : ['']
    const setRow = (i, v) => onChange(rows.map((x, idx) => idx === i ? v : x))
    const addRow = () => onChange([...rows, ''])
    const removeRow = (i) => { const next = rows.filter((_, idx) => idx !== i); onChange(next.length ? next : ['']) }
    return <div>{label}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, textAlign: 'right', color: GOLD.primary, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}.</span>
            <input value={it} onChange={e => setRow(i, e.target.value)} placeholder={`Punt ${i + 1}`} style={{ ...input, flex: 1 }} />
            <button onClick={() => removeRow(i)} title="Regel verwijderen" style={{ width: 30, height: 30, flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
          </div>
        ))}
        <button onClick={addRow} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', background: 'rgba(255,215,0,0.08)', border: `1px dashed ${GOLD.border || 'rgba(255,215,0,0.3)'}`, borderRadius: 6, color: GOLD.primary, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}><Plus size={13} /> Regel toevoegen</button>
      </div>
    </div>
  }
  if (field.type === 'checklist') {
    const checked = Array.isArray(value) ? value : []
    const toggle = (opt) => onChange(checked.includes(opt) ? checked.filter(x => x !== opt) : [...checked, opt])
    return <div>{label}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(field.options || []).map(o => {
          const on = checked.includes(o)
          return (
            <button key={o} onClick={() => toggle(o)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.6rem',
              background: on ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${on ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 6, cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: on ? '#FFD700' : 'transparent', border: on ? 'none' : '2px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <Check size={12} strokeWidth={3} color="#000" />}
              </span>
              <span style={{ fontSize: '0.82rem', color: on ? '#fff' : 'rgba(255,255,255,0.7)' }}>{o}</span>
            </button>
          )
        })}
        {(!field.options || field.options.length === 0) && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Geen opties ingesteld voor dit veld.</span>}
      </div>
    </div>
  }
  // default: text
  return <div>{label}<input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.label} style={input} /></div>
}

const input = { width: '100%', boxSizing: 'border-box', padding: '0.7rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.88rem', outline: 'none' }
