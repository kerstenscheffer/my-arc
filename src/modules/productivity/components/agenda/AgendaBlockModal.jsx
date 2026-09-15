// src/modules/productivity/components/agenda/AgendaBlockModal.jsx
// Edit/create modal for a single reserved block in the agenda
// (lunch, coaching, custom pinned slot). Mirrors the look of
// AgendaTaskModal so the two feel like siblings.

import { useEffect, useState } from 'react'
import { Trash2, Calendar, Clock, Coffee, Users, Palette } from 'lucide-react'
import { DAYS } from './agendaConstants'
import { Venster, VensterKop, VensterVoet, Keuzevak, Kopje, Knop } from '../../../../components/arc-ui'
import { keuzeSelect } from '../../../../components/arc-tokens'

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

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={440} zIndex={2147483400}>
      <VensterKop
        isMobile={isMobile}
        titel={isNew ? 'Nieuw blok' : 'Blok bewerken'}
        onClose={onClose}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.15rem' }}>
        {/* Het label is het onderwerp: groot, zonder kader. */}
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Lunch, coaching, focusblok"
          style={{
            width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900,
            letterSpacing: '-0.025em',
          }}
        />
        <div style={{ height: 2, marginTop: 8, marginBottom: isMobile ? '1rem' : '1.15rem', borderRadius: 2, background: color }} />

        {/* Dag, start en einde naast elkaar. */}
        <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.7rem', marginBottom: isMobile ? '0.85rem' : '1rem' }}>
          <Keuzevak Icon={Calendar} label="Dag" isMobile={isMobile}>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={keuzeSelect}>
              {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Keuzevak>
          <Keuzevak Icon={Clock} label="Start" isMobile={isMobile}>
            <input type="time" step={600} value={startTime} onChange={(e) => setStartTime(e.target.value)} style={keuzeSelect} />
          </Keuzevak>
          <Keuzevak Icon={Clock} label="Einde" isMobile={isMobile}>
            <input type="time" step={600} value={endTime} onChange={(e) => setEndTime(e.target.value)} style={keuzeSelect} />
          </Keuzevak>
        </div>

        {/* Soort blok: het verschil is of taken er overheen mogen. */}
        <Kopje Icon={Coffee} tekst="Soort" />
        <div style={{ display: 'flex', gap: 6, marginBottom: isMobile ? '0.85rem' : '1rem' }}>
          {[
            { v: 'pauze',    Icon: Coffee, kop: 'Pauze',    sub: 'blokkeert taken' },
            { v: 'coaching', Icon: Users,  kop: 'Coaching', sub: 'taken mogen erover' },
          ].map(o => {
            const aan = type === o.v
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => setType(o.v)}
                style={{
                  flex: 1, minWidth: 0, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.55rem 0.7rem', minHeight: 46, borderRadius: 10,
                  background: aan ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
                }}
              >
                <o.Icon size={15} color={aan ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, color: aan ? '#fff' : 'rgba(255,255,255,0.7)' }}>{o.kop}</span>
                  <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{o.sub}</span>
                </span>
              </button>
            )
          })}
        </div>

        <Kopje Icon={Palette} tekst="Kleur" />
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {COLORS.map(c => {
            const aan = color === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                style={{
                  width: 30, height: 30, padding: 0, background: c.value, borderRadius: 8,
                  border: aan ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              />
            )
          })}
        </div>

        {error && (
          <div style={{
            marginTop: '0.85rem', padding: '0.5rem 0.7rem', borderRadius: 8,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700,
          }}>{error}</div>
        )}
      </div>

      <VensterVoet isMobile={isMobile}>
        {!isNew && onDelete && (
          <Knop soort="gevaar" breedte={44} titel="Blok verwijderen" onClick={handleDelete} disabled={saving}>
            <Trash2 size={15} />
          </Knop>
        )}
        <Knop soort="stil" flex={1} onClick={onClose}>Annuleer</Knop>
        <Knop soort="primair" flex={2} onClick={handleSave} disabled={saving}>
          {saving ? 'Bezig…' : 'Opslaan'}
        </Knop>
      </VensterVoet>
    </Venster>
  )
}
