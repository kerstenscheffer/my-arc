// src/modules/productivity/components/agenda/AgendaTaskModal.jsx
// Detail+edit modal for an agenda task — title, description, steps view,
// day/time edit, estimated minutes. Save persists via productivityService.

import { useState, useEffect } from 'react'
import { Trash2, Check, Calendar, Clock, CheckCircle2, Timer, MessageSquare } from 'lucide-react'
import { DAYS, timeToMinutes, minutesToTime, START_HOUR, END_HOUR } from './agendaConstants'
import { Venster, VensterKop, VensterVoet, Keuzevak, Kopje, Stat, Punt, Chip, Knop } from '../ui'
import { keuzeSelect } from '../uiTokens'

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120]

export default function AgendaTaskModal({ task, isMobile, onClose, onSave, onDelete, onComplete }) {
  const [title, setTitle] = useState(task.title || '')
  const [description, setDescription] = useState(task.description || '')
  const [day, setDay] = useState(task.scheduled_day || '')
  const [startTime, setStartTime] = useState(task.scheduled_start_time?.slice(0, 5) || '')
  const [estMins, setEstMins] = useState(task.estimated_minutes || 60)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Keep end-time derived from start + duration. Display-only.
  const endTime = (() => {
    if (!startTime) return ''
    const sm = timeToMinutes(startTime)
    if (sm == null) return ''
    return minutesToTime(sm + (parseInt(estMins, 10) || 60))
  })()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Titel is verplicht'); return }
    setSaving(true)
    setError(null)
    try {
      const updates = {
        title: title.trim(),
        description: description.trim() || null,
        estimated_minutes: parseInt(estMins, 10) || null,
      }
      // Day + times are coupled — only persist when both present.
      if (day && startTime) {
        const sm = timeToMinutes(startTime)
        if (sm == null || sm < 0 || sm > (END_HOUR - START_HOUR) * 60) {
          setError(`Tijd moet tussen ${String(START_HOUR).padStart(2,'0')}:00 en ${String(END_HOUR).padStart(2,'0')}:00`)
          setSaving(false); return
        }
        updates.scheduled_day = day
        updates.scheduled_start_time = startTime
        updates.scheduled_end_time   = minutesToTime(sm + (parseInt(estMins, 10) || 60))
      } else if (!day && !startTime) {
        // Explicit unschedule.
        updates.scheduled_day = null
        updates.scheduled_start_time = null
        updates.scheduled_end_time   = null
      }
      await onSave(task.id, updates)
      onClose()
    } catch (e) {
      console.error('Save task failed:', e)
      setError('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Taak verwijderen?')) return
    setSaving(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (e) {
      console.error(e)
      setError('Verwijderen mislukt')
    } finally { setSaving(false) }
  }

  // Mark task as completed via the existing kanban complete-flow. This is
  // the same path the kanban card uses, so reflections (if enabled) fire.
  const handleComplete = async () => {
    if (!onComplete) return
    setSaving(true); setError(null)
    try {
      await onComplete(task.id)
      onClose()
    } catch (e) {
      console.error('Complete failed:', e)
      setError('Voltooien mislukt')
    } finally { setSaving(false) }
  }

  const stepsArr = Array.isArray(task.steps) ? task.steps : []

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={520} zIndex={10000}>
      <VensterKop isMobile={isMobile} titel="Taak bewerken" onClose={onClose} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Titel groot bovenaan, met de stand eronder. */}
        <div style={{ padding: isMobile ? '0.9rem 1rem 0.75rem' : '1rem 1.15rem 0.85rem' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wat is de taak?"
            style={{
              width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900,
              letterSpacing: '-0.025em',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Stat waarde={estMins || '—'} eenheid="min" />
            {day && startTime && <><Punt /><Stat waarde={startTime} eenheid={endTime ? `tot ${endTime}` : ''} /></>}
            {stepsArr.length > 0 && <><Punt /><Stat waarde={stepsArr.length} eenheid={stepsArr.length === 1 ? 'stap' : 'stappen'} /></>}
          </div>
        </div>

        {/* Dag en starttijd naast elkaar. */}
        <div style={{ display: 'flex', gap: isMobile ? '0.6rem' : '0.8rem', padding: isMobile ? '0 1rem 0.85rem' : '0 1.15rem 1rem' }}>
          <Keuzevak Icon={Calendar} label="Dag" isMobile={isMobile}>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={keuzeSelect}>
              <option value="">Niet gepland</option>
              {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Keuzevak>
          <Keuzevak Icon={Clock} label="Starttijd" isMobile={isMobile}>
            <input type="time" step={900} value={startTime} onChange={(e) => setStartTime(e.target.value)} style={keuzeSelect} />
          </Keuzevak>
        </div>

        {/* Duur als chips; de eindtijd volgt vanzelf. */}
        <div style={{ padding: isMobile ? '0 1rem 0.85rem' : '0 1.15rem 1rem' }}>
          <Kopje Icon={Timer} tekst="Geschatte duur" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {DURATION_PRESETS.map(m => (
              <Chip key={m} actief={parseInt(estMins, 10) === m} onClick={() => setEstMins(m)}>
                {m}m
              </Chip>
            ))}
            <input
              type="number" min="5" max="480" step="5" placeholder="eigen"
              value={DURATION_PRESETS.includes(parseInt(estMins, 10)) ? '' : (estMins || '')}
              onChange={(e) => setEstMins(e.target.value ? parseInt(e.target.value, 10) : '')}
              style={{
                width: 62, minHeight: 30, padding: '0 0.6rem', borderRadius: 999,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '0.7rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          {endTime && day && (
            <div style={{ marginTop: 7, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
              Eindigt om {endTime}
            </div>
          )}
        </div>

        {/* Beschrijving */}
        <div style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem' }}>
          <Kopje Icon={MessageSquare} tekst="Notitie" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Context, links, details"
            rows={3}
            style={{
              width: '100%', padding: '0.6rem 0.7rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', outline: 'none',
              resize: 'none', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Stappen — alleen tonen, aanvinken gebeurt op de kaart. */}
        {stepsArr.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {stepsArr.map((st, i) => (
              <div key={st.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isMobile ? '0.55rem 1rem' : '0.6rem 1.15rem',
                borderBottom: i < stepsArr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${st.done ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                  background: st.done ? '#10b981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {st.done && <Check size={10} color="#000" strokeWidth={3.5} />}
                </div>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 600,
                  color: st.done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                  textDecoration: st.done ? 'line-through' : 'none',
                }}>
                  {st.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            margin: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem',
            padding: '0.5rem 0.7rem', borderRadius: 8,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700,
          }}>
            {error}
          </div>
        )}
      </div>

      <VensterVoet isMobile={isMobile}>
        <Knop soort="gevaar" breedte={44} titel="Taak verwijderen" onClick={handleDelete} disabled={saving}>
          <Trash2 size={15} />
        </Knop>
        <Knop soort="stil" flex={1} onClick={onClose}>Sluiten</Knop>
        {onComplete && (
          <Knop soort="goed" flex={1} titel="Markeer als voltooid" onClick={handleComplete} disabled={saving}>
            <CheckCircle2 size={14} />
            Voltooi
          </Knop>
        )}
        <Knop soort="primair" flex={2} onClick={handleSave} disabled={saving || !title.trim()}>
          <Check size={14} strokeWidth={3} />
          {saving ? 'Opslaan…' : 'Opslaan'}
        </Knop>
      </VensterVoet>
    </Venster>
  )
}
