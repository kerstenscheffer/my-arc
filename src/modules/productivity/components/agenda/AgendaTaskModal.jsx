// src/modules/productivity/components/agenda/AgendaTaskModal.jsx
// Detail+edit modal for an agenda task — title, description, steps view,
// day/time edit, estimated minutes. Save persists via productivityService.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Check, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { DAYS, timeToMinutes, minutesToTime, START_HOUR, END_HOUR } from './agendaConstants'

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

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '520px',
        maxHeight: isMobile ? '92vh' : '85vh',
        background: '#111',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: isMobile ? '14px 14px 0 0' : '14px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
            Taak bewerken
          </div>
          <button onClick={onClose} style={iconBtnStyle} aria-label="Sluiten">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {/* Title */}
          <Field label="Titel">
            <input
              type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wat is de taak?"
              style={inputStyle}
            />
          </Field>

          {/* Description */}
          <Field label="Beschrijving">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optioneel — context, links, notes…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
            />
          </Field>

          {/* Day + start time + estimated mins */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Dag" icon={Calendar}>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Niet gepland —</option>
                {DAYS.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Starttijd" icon={Clock}>
              <input
                type="time" value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={900} // 15-min steps
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Duration presets */}
          <Field label="Geschatte duur">
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {DURATION_PRESETS.map(m => {
                const active = parseInt(estMins, 10) === m
                return (
                  <button
                    key={m}
                    onClick={() => setEstMins(m)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '6px',
                      color: active ? '#10b981' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.7rem', fontWeight: '700',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      minHeight: '32px',
                    }}
                  >
                    {m} min
                  </button>
                )
              })}
              <input
                type="number" min="5" max="480" step="5"
                value={estMins}
                onChange={(e) => setEstMins(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="Eigen"
                style={{ ...inputStyle, width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
              />
            </div>
            {endTime && day && (
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem' }}>
                Eindigt om {endTime}
              </div>
            )}
          </Field>

          {/* Steps (read-only checklist for now) */}
          {stepsArr.length > 0 && (
            <Field label={`Stappen (${stepsArr.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {stepsArr.map((s, i) => (
                  <div key={s.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 0.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                  }}>
                    <div style={{
                      width: '14px', height: '14px',
                      borderRadius: '3px',
                      border: `1px solid ${s.done ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                      background: s.done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {s.done && <Check size={9} color="#000" strokeWidth={3} />}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: s.done ? 'rgba(255,255,255,0.35)' : '#fff',
                      textDecoration: s.done ? 'line-through' : 'none',
                      flex: 1,
                    }}>
                      {s.text}
                    </span>
                  </div>
                ))}
              </div>
            </Field>
          )}

          {error && (
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '6px',
              color: '#fca5a5',
              fontSize: '0.7rem', fontWeight: '600',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleDelete}
            disabled={saving}
            style={{
              ...iconBtnStyle,
              padding: '0.55rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }}
            aria-label="Verwijderen"
          >
            <Trash2 size={14} />
          </button>
          {onComplete && (
            <button
              onClick={handleComplete}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.55rem 0.85rem',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '6px',
                color: '#10b981',
                fontSize: '0.75rem', fontWeight: '800',
                cursor: saving ? 'not-allowed' : 'pointer',
                minHeight: '36px',
              }}
              title="Markeer als voltooid"
            >
              <CheckCircle2 size={14} strokeWidth={2.6} />
              Voltooi
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.75rem', fontWeight: '700',
              cursor: 'pointer',
              minHeight: '36px',
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            style={{
              padding: '0.55rem 1.1rem',
              background: saving || !title.trim() ? 'rgba(16,185,129,0.15)' : '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: saving || !title.trim() ? 'rgba(16,185,129,0.5)' : '#fff',
              fontSize: '0.75rem', fontWeight: '800',
              cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              minHeight: '36px',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <Check size={14} strokeWidth={2.8} />
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: '0.35rem',
      }}>
        {Icon && <Icon size={10} />}
        {label}
      </div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: '500',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const iconBtnStyle = {
  width: '32px', height: '32px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}
