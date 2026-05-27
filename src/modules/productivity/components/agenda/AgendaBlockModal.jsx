// src/modules/productivity/components/agenda/AgendaBlockModal.jsx
// Edit/create modal for a single reserved block in the agenda
// (lunch, coaching, custom pinned slot). Mirrors the look of
// AgendaTaskModal so the two feel like siblings.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Save, Calendar, Clock, Coffee, Users } from 'lucide-react'
import { DAYS } from './agendaConstants'

const COLORS = [
  { value: '#64748b', label: 'Grijs' },
  { value: '#0ea5e9', label: 'Blauw' },
  { value: '#10b981', label: 'Groen' },
  { value: '#f59e0b', label: 'Oranje' },
  { value: '#a855f7', label: 'Paars' },
  { value: '#ef4444', label: 'Rood' },
]

export default function AgendaBlockModal({
  block, isMobile, defaultDay, defaultStartTime, defaultEndTime,
  onClose, onSave, onDelete,
}) {
  const isNew = !block?.id

  const [label, setLabel] = useState(block?.label || (isNew ? 'Nieuw blok' : ''))
  const [day, setDay] = useState(block?.day || defaultDay || 'monday')
  const [startTime, setStartTime] = useState((block?.start_time || defaultStartTime || '12:00').slice(0, 5))
  const [endTime, setEndTime] = useState((block?.end_time || defaultEndTime || '13:00').slice(0, 5))
  const [type, setType] = useState(block?.type || 'pauze')
  const [color, setColor] = useState(block?.color || '#64748b')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Auto-tune the colour when toggling type so coaching ↔ pauze visually
  // separates without forcing the coach to pick a colour manually.
  useEffect(() => {
    if (!block?.color) {
      setColor(type === 'coaching' ? '#0ea5e9' : '#64748b')
    }
  }, [type, block?.color])

  const handleSave = async () => {
    if (!label.trim()) { setError('Label is verplicht'); return }
    if (endTime <= startTime) { setError('Eindtijd moet na starttijd liggen'); return }
    setSaving(true); setError(null)
    try {
      await onSave({
        ...(block?.id ? { id: block.id } : {}),
        label: label.trim(),
        day,
        start_time: startTime,
        end_time: endTime,
        type,
        color,
      })
      onClose()
    } catch (e) {
      console.error('Save block failed:', e)
      setError(e?.message || 'Opslaan mislukt')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!onDelete || !block?.id) return
    if (!window.confirm(`Blok "${label}" verwijderen?`)) return
    setSaving(true)
    try { await onDelete(block.id); onClose() }
    catch (e) { setError(e?.message || 'Verwijderen mislukt'); setSaving(false) }
  }

  const sheet = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(6px)', zIndex: 2147483400,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '16px 16px 0 0' : 12,
        display: 'flex', flexDirection: 'column',
        maxHeight: isMobile ? '92vh' : '85vh',
        overflow: 'hidden',
      }}>
        <div style={{
          flexShrink: 0,
          padding: 'calc(0.7rem + env(safe-area-inset-top)) 1rem 0.7rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {type === 'coaching' ? <Users size={16} color={color} /> : <Coffee size={16} color={color} />}
          <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
            {isNew ? 'Nieuw blok' : 'Blok bewerken'}
          </div>
          <button onClick={onClose} style={iconBtn} title="Sluiten">
            <X size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <Field label="Label">
            <input
              autoFocus value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="bv. Lunch, Coaching, Focus"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <Field label="Dag" icon={<Calendar size={11} />}>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={inputStyle}>
                {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Start" icon={<Clock size={11} />}>
              <input type="time" step={600} value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Einde" icon={<Clock size={11} />}>
              <input type="time" step={600} value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <Field label="Type">
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { v: 'pauze',    Icon: Coffee, label: 'Pauze — blokkeert taken' },
                { v: 'coaching', Icon: Users,  label: 'Coaching — taken mogen overheen' },
              ].map(({ v, Icon, label: lbl }) => {
                const active = type === v
                return (
                  <button key={v} type="button" onClick={() => setType(v)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 0.7rem', minHeight: 42,
                      background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                      border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 7,
                      color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.72rem', fontWeight: active ? 800 : 600,
                      cursor: 'pointer', touchAction: 'manipulation',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={13} color={active ? color : 'rgba(255,255,255,0.5)'} />
                    {lbl}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Kleur">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => {
                const active = color === c.value
                return (
                  <button key={c.value} type="button" onClick={() => setColor(c.value)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: c.value,
                      border: active ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', touchAction: 'manipulation',
                      boxShadow: active ? `0 0 0 2px ${c.value}55` : 'none',
                    }}
                    title={c.label}
                  />
                )
              })}
            </div>
          </Field>

          {error && (
            <div style={{
              padding: '0.5rem 0.7rem', borderRadius: 6,
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
              fontSize: '0.78rem', fontWeight: 600,
            }}>{error}</div>
          )}
        </div>

        <div style={{
          flexShrink: 0, padding: '0.7rem 1rem calc(0.85rem + env(safe-area-inset-bottom))',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {!isNew && onDelete && (
            <button onClick={handleDelete} disabled={saving} style={{
              ...iconBtn, padding: '0.55rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }} title="Verwijderen">
              <Trash2 size={14} />
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            padding: '0.55rem 0.95rem',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, color: 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', minHeight: 36,
          }}>
            Annuleer
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '0.55rem 1.05rem', minHeight: 36,
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            background: saving ? `${color}55` : color,
            border: 'none', borderRadius: 6,
            color: '#fff', fontSize: '0.78rem', fontWeight: 800,
            cursor: saving ? 'wait' : 'pointer',
          }}>
            <Save size={13} /> {saving ? 'Bezig…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}

function Field({ label, icon, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.6rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        {icon}{label}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem', minHeight: 40,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
  outline: 'none',
}
const iconBtn = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: 'none',
  borderRadius: 6, color: '#fff', cursor: 'pointer', touchAction: 'manipulation',
}
