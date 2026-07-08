// src/modules/content-batches/components/FormatBuilderModal.jsx
// Bouw een eigen, herbruikbaar batch-format: naam, kleur en zelf-gedefinieerde
// velden (korte regel / lang tekstvak / keuzelijst / datum / checklist).
// Opslaan → verschijnt voortaan in de format-kiezer van "Nieuwe batch".

import { useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import BatchService from '../BatchService'
import { FIELD_TYPES, slugifyFieldKey, FORMAT_COLORS } from '../fieldTypes'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function FormatBuilderModal({ isOpen, onClose, onSaved, db, isMobile = false, existing = null }) {
  const [name, setName] = useState(existing?.name || '')
  const [color, setColor] = useState(existing?.color || FORMAT_COLORS[0])
  // fields in de UI: { label, type, optionsText } (optionsText = komma-gescheiden voor select/checklist)
  const [fields, setFields] = useState(() =>
    (existing?.fields || []).map(f => ({
      label: f.label || '',
      type: f.type || 'text',
      optionsText: Array.isArray(f.options) ? f.options.join(', ') : '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const addField = () => setFields(prev => [...prev, { label: '', type: 'text', optionsText: '' }])
  const updateField = (i, patch) => setFields(prev => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i))
  const moveField = (i, dir) => setFields(prev => {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= prev.length) return prev
    const copy = [...prev]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    return copy
  })

  const canSave = name.trim() && fields.length > 0 && fields.every(f => f.label.trim())

  const handleSave = async () => {
    if (!canSave) { setError('Geef het format een naam en minstens één veld met een naam.'); return }
    setSaving(true); setError(null)
    try {
      const user = await db.getCurrentUser()
      const svc = new BatchService(db.supabase)
      const builtFields = fields.map((f, i) => {
        const field = { key: slugifyFieldKey(f.label, i), label: f.label.trim(), type: f.type }
        if (f.type === 'select' || f.type === 'checklist') {
          field.options = f.optionsText.split(',').map(o => o.trim()).filter(Boolean)
        }
        return field
      })
      let saved
      if (existing?.id) {
        saved = await svc.updateFormat(existing.id, { name: name.trim(), color, fields: builtFields })
      } else {
        saved = await svc.createFormat(user.id, { name: name.trim(), color, fields: builtFields })
      }
      onSaved?.(saved)
      onClose?.()
    } catch (e) {
      console.error('Format opslaan mislukt:', e)
      setError('Opslaan mislukt: ' + (e.message || 'onbekende fout'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 2100, padding: isMobile ? 0 : '2rem',
    }}>
      <div style={{
        width: isMobile ? '100%' : '90%', maxWidth: 620,
        maxHeight: isMobile ? '92vh' : '90vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        border: `1px solid ${GOLD.border}`, borderRadius: isMobile ? '16px 16px 0 0' : 16,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: `1px solid ${GOLD.border}`,
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
        }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: GOLD.primary }}>
            {existing ? 'Format bewerken' : 'Nieuw format'}
          </h2>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Naam */}
          <div>
            <label style={label}>Naam van het format</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Talking Head Review" style={input} autoFocus />
          </div>

          {/* Kleur */}
          <div>
            <label style={label}>Kleur (accent op de agenda-kaart)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMAT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} title={c} style={{
                  width: 30, height: 30, borderRadius: 8, background: c, cursor: 'pointer',
                  border: color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </div>

          {/* Velden */}
          <div>
            <label style={label}>Velden ({fields.length})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.map((f, i) => (
                <div key={i} style={{
                  padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GripVertical size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Veld {i + 1}</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => moveField(i, 'up')} disabled={i === 0} style={miniBtn(i === 0)}><ChevronUp size={13} /></button>
                    <button onClick={() => moveField(i, 'down')} disabled={i === fields.length - 1} style={miniBtn(i === fields.length - 1)}><ChevronDown size={13} /></button>
                    <button onClick={() => removeField(i)} style={{ ...miniBtn(false), color: '#ef4444' }}><Trash2 size={13} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px', gap: 8 }}>
                    <input value={f.label} onChange={e => updateField(i, { label: e.target.value })} placeholder="Veldnaam (bv. Hoek)" style={input} />
                    <select value={f.type} onChange={e => updateField(i, { type: e.target.value })} style={{ ...input, cursor: 'pointer' }}>
                      {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  {(f.type === 'select' || f.type === 'checklist') && (
                    <input value={f.optionsText} onChange={e => updateField(i, { optionsText: e.target.value })}
                      placeholder="Opties, komma-gescheiden (bv. Ja, Nee, Misschien)" style={input} />
                  )}
                </div>
              ))}
            </div>
            <button onClick={addField} style={{
              marginTop: 10, width: '100%', padding: '0.7rem', background: 'rgba(255,215,0,0.08)',
              border: `1px dashed ${GOLD.border}`, borderRadius: 8, color: GOLD.primary,
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Plus size={15} /> Veld toevoegen
            </button>
          </div>

          {error && <div style={{ padding: '0.7rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.8rem' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '1rem 1.25rem', borderTop: `1px solid ${GOLD.border}`, background: 'rgba(0,0,0,0.3)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Annuleren</button>
          <button onClick={handleSave} disabled={!canSave || saving} style={{
            flex: 2, padding: '0.8rem', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem',
            background: (canSave && !saving) ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)` : 'rgba(255,255,255,0.1)',
            color: (canSave && !saving) ? '#000' : 'rgba(255,255,255,0.4)',
            cursor: (canSave && !saving) ? 'pointer' : 'not-allowed',
          }}>{saving ? 'Opslaan…' : (existing ? 'Format opslaan' : 'Format aanmaken')}</button>
        </div>
      </div>
    </div>
  )
}

const iconBtn = { width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const label = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }
const input = { width: '100%', boxSizing: 'border-box', padding: '0.7rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.88rem', outline: 'none' }
const miniBtn = (disabled) => ({ width: 26, height: 26, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 5, color: disabled ? '#333' : 'rgba(255,255,255,0.6)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 })
