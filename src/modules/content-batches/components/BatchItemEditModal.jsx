// src/modules/content-batches/components/BatchItemEditModal.jsx
// Bewerk de ingevulde velden van een batch-item OP BASIS VAN het custom format
// (dynamisch). Slaat field_values + title (= eerste veld) op via onSave.

import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'

const GOLD = { primary: '#FFD700', border: 'rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.1)' }
const input = { width: '100%', boxSizing: 'border-box', padding: '0.7rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.88rem', outline: 'none' }

export default function BatchItemEditModal({ isOpen, onClose, onSave, item, format, isMobile = false }) {
  const fields = format?.fields || []
  const [values, setValues] = useState(() => ({ ...(item?.field_values || {}) }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !item) return null

  const setVal = (key, v) => setValues(prev => ({ ...prev, [key]: v }))

  const firstKey = fields[0]?.key
  const titleFrom = (vals) => {
    const raw = firstKey ? vals[firstKey] : null
    const s = Array.isArray(raw) ? raw.find(Boolean) : raw
    return (s && String(s).trim()) ? String(s) : (item.title || '')
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      await onSave(item.id, { field_values: values, title: titleFrom(values) })
      onClose()
    } catch (e) {
      setError('Opslaan mislukt: ' + (e.message || 'onbekende fout'))
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2200, padding: isMobile ? 0 : '2rem' }}>
      <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 560, maxHeight: isMobile ? '92vh' : '88vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: `1px solid ${GOLD.border}`, borderRadius: isMobile ? '16px 16px 0 0' : 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${GOLD.border}`, background: `linear-gradient(135deg, ${(format?.color || GOLD.primary)}18 0%, rgba(0,0,0,0.3) 100%)` }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Item bewerken{format?.name ? ` · ${format.name}` : ''}</h3>
          <button onClick={onClose} style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fields.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Dit item heeft geen custom format om te bewerken.</div>}
          {fields.map((f, i) => (
            <FieldInput key={f.key} field={f} isFirst={i === 0} value={values[f.key]} onChange={(v) => setVal(f.key, v)} />
          ))}
          {error && <div style={{ padding: '0.7rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.8rem' }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '1rem 1.25rem', borderTop: `1px solid ${GOLD.border}`, background: 'rgba(0,0,0,0.3)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Annuleren</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1.6, padding: '0.8rem', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem', background: saving ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${GOLD.primary} 0%, #FFA500 100%)`, color: saving ? 'rgba(255,255,255,0.4)' : '#000', cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange, isFirst }) {
  const label = <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: isFirst ? 800 : 700, color: isFirst ? GOLD.primary : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.4rem' }}>{field.label}</label>

  if (field.type === 'textarea') return <div>{label}<textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} /></div>
  if (field.type === 'date') return <div>{label}<input type="date" value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...input, cursor: 'pointer' }} /></div>
  if (field.type === 'select') return <div>{label}<select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...input, cursor: 'pointer' }}><option value="">— kies —</option>{(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select></div>
  if (field.type === 'checklist') {
    const checked = Array.isArray(value) ? value : []
    const toggle = (o) => onChange(checked.includes(o) ? checked.filter(x => x !== o) : [...checked, o])
    return <div>{label}<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{(field.options || []).map(o => {
      const on = checked.includes(o)
      return <button key={o} onClick={() => toggle(o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.6rem', background: on ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${on ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 6, cursor: 'pointer', textAlign: 'left' }}><span style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: on ? '#10b981' : 'transparent', border: on ? 'none' : '2px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Check size={12} strokeWidth={3} color="#000" />}</span><span style={{ fontSize: '0.82rem', color: on ? '#fff' : 'rgba(255,255,255,0.7)' }}>{o}</span></button>
    })}</div></div>
  }
  if (field.type === 'list') {
    const rows = Array.isArray(value) && value.length ? value : ['']
    const setRow = (i, v) => onChange(rows.map((x, idx) => idx === i ? v : x))
    const addRow = () => onChange([...rows, ''])
    const removeRow = (i) => { const next = rows.filter((_, idx) => idx !== i); onChange(next.length ? next : ['']) }
    return <div>{label}<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 20, textAlign: 'right', color: GOLD.primary, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}.</span>
          <input value={it} onChange={e => setRow(i, e.target.value)} placeholder={`Punt ${i + 1}`} style={{ ...input, flex: 1 }} />
          <button onClick={() => removeRow(i)} style={{ width: 30, height: 30, flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
        </div>
      ))}
      <button onClick={addRow} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', background: 'rgba(255,215,0,0.08)', border: `1px dashed ${GOLD.border}`, borderRadius: 6, color: GOLD.primary, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}><Plus size={13} /> Regel toevoegen</button>
    </div></div>
  }
  return <div>{label}<input type="text" value={value || ''} onChange={e => onChange(e.target.value)} style={input} /></div>
}
