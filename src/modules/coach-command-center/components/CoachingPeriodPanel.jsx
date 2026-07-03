// src/modules/coach-command-center/components/CoachingPeriodPanel.jsx
// Compacte strip in ClientInsightModal die de coaching-periode tracket:
//   - Voortgang (X / Y weken) + progress bar
//   - Eind-datum (rekening houdend met opgenomen pauzedagen)
//   - Pauzeer / Hervat / Beëindig acties
//   - Setup-mode wanneer er nog geen start_date is
//
// State zit op clients.coaching_* — updates lopen via supabase + parent
// onClientUpdate zodat de modal direct ververst.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Clock, Play, Pause, Square, Settings, Check, X, AlertCircle,
  Calendar, Hourglass,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const DURATION_PRESETS = [4, 8, 12, 16, 26, 52]

// Hoe heeft de client betaald? Sla op in clients.payment_plan (bestaande TEXT).
const PAYMENT_OPTIONS = [
  { id: 'prepaid',      label: 'In één keer',     short: 'Prepaid',  color: '#10b981' },
  { id: 'monthly',      label: 'Maandelijks',     short: 'Maandelijks', color: '#3b82f6' },
  { id: 'two_terms',    label: '2 termijnen',     short: '2× betaling', color: '#8b5cf6' },
  { id: 'three_terms',  label: '3 termijnen',     short: '3× betaling', color: '#a855f7' },
]
const paymentMeta = (id) => PAYMENT_OPTIONS.find(p => p.id === id)

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

// Bereken: eind-datum, weken-gedaan, weken-totaal, weken-resterend, percentage
function computePeriod(client) {
  const start = client.coaching_start_date
  const weeks = client.coaching_total_weeks
  const pausedDays = client.coaching_paused_days_total || 0
  const status = client.coaching_status || 'active'
  const pausedAt = client.coaching_paused_at

  if (!start || !weeks) return null

  const startMs = new Date(start + 'T00:00:00').getTime()
  const totalDurationDays = weeks * 7 + pausedDays
  const endMs = startMs + totalDurationDays * 86400000

  // Een "freeze" punt: bij pause stopt de teller bij paused_at.
  const nowMs = status === 'paused' && pausedAt
    ? new Date(pausedAt).getTime()
    : Date.now()

  const elapsedDays = Math.max(0, (nowMs - startMs) / 86400000 - pausedDays)
  const remainingDays = Math.max(0, (endMs - nowMs) / 86400000)
  const totalDays = weeks * 7

  const pct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))

  return {
    startDate: start,
    endDate: new Date(endMs).toISOString().split('T')[0],
    weeksDone: Math.floor(elapsedDays / 7),
    daysDoneRemainder: Math.floor(elapsedDays % 7),
    weeksTotal: weeks,
    weeksRemaining: Math.ceil(remainingDays / 7),
    pct,
    isOver: nowMs >= endMs,
  }
}

export default function CoachingPeriodPanel({ client, coachId, isMobile, onClientUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draftStart, setDraftStart] = useState(client.coaching_start_date || new Date().toISOString().split('T')[0])
  const [draftWeeks, setDraftWeeks] = useState(client.coaching_total_weeks || 12)
  const [draftPayment, setDraftPayment] = useState(client.payment_plan || '')
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [busy, setBusy] = useState(false)

  const period = computePeriod(client)
  const status = client.coaching_status || 'active'

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveSetup = async () => {
    if (!draftStart || !draftWeeks || draftWeeks <= 0) return
    setBusy(true)
    try {
      // Sync goal_deadline mee zodat de Doelen-tab + de rode plan-lijn in
      // de gewicht-grafiek automatisch op het einde van het traject vallen.
      // Verstoort niet als de coach later handmatig een andere deadline
      // zet — pas bij de volgende period-save wordt het weer gelijkgetrokken.
      const startMs = new Date(draftStart + 'T00:00:00').getTime()
      const weeks = parseInt(draftWeeks, 10)
      const trajectEnd = new Date(startMs + weeks * 7 * 86400000).toISOString().split('T')[0]
      const payload = {
        coaching_start_date: draftStart,
        coaching_total_weeks: weeks,
        coaching_status: 'active',
        coaching_paused_at: null,
        coaching_pause_reason: null,
        payment_plan: draftPayment || null,
        goal_deadline: trajectEnd,
      }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.(payload)
      setEditing(false)
    } catch (err) {
      console.error('Save coaching period failed:', err)
      alert('Opslaan mislukt')
    } finally { setBusy(false) }
  }

  const pause = async () => {
    setBusy(true)
    const pausedAt = new Date().toISOString()
    const reason = pauseReason.trim() || null
    try {
      const payload = {
        coaching_status: 'paused',
        coaching_paused_at: pausedAt,
        coaching_pause_reason: reason,
      }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      // Audit row
      await supabase.from('coaching_pauses').insert({
        client_id: client.id, coach_id: coachId, paused_at: pausedAt, reason,
      })
      onClientUpdate?.(payload)
      setShowPauseModal(false)
      setPauseReason('')
    } catch (err) {
      console.error('Pause failed:', err); alert('Pauzeren mislukt')
    } finally { setBusy(false) }
  }

  const resume = async () => {
    if (!client.coaching_paused_at) return
    setBusy(true)
    try {
      const pausedDays = Math.max(0, Math.floor((Date.now() - new Date(client.coaching_paused_at).getTime()) / 86400000))
      const newPausedTotal = (client.coaching_paused_days_total || 0) + pausedDays
      const payload = {
        coaching_status: 'active',
        coaching_paused_at: null,
        coaching_pause_reason: null,
        coaching_paused_days_total: newPausedTotal,
      }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      // Close the open audit row
      await supabase.from('coaching_pauses')
        .update({ resumed_at: new Date().toISOString() })
        .eq('client_id', client.id)
        .is('resumed_at', null)
      onClientUpdate?.(payload)
    } catch (err) {
      console.error('Resume failed:', err); alert('Hervatten mislukt')
    } finally { setBusy(false) }
  }

  const endCoaching = async () => {
    if (!window.confirm('Coaching beëindigen voor deze client?')) return
    setBusy(true)
    try {
      const payload = {
        coaching_status: 'ended',
        coaching_paused_at: null,
        coaching_pause_reason: null,
      }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.(payload)
    } catch (err) {
      console.error('End coaching failed:', err); alert('Beëindigen mislukt')
    } finally { setBusy(false) }
  }

  const reopenCoaching = async () => {
    setBusy(true)
    try {
      const payload = { coaching_status: 'active' }
      const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.(payload)
    } catch (err) {
      console.error('Reopen failed:', err)
    } finally { setBusy(false) }
  }

  // ── Setup-mode ────────────────────────────────────────────────────────────
  if (!period || editing) {
    return (
      <div style={panelShell()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
          <Clock size={13} color="#FFD700" />
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {editing ? 'Coaching-periode aanpassen' : 'Coaching-periode instellen'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Rij 1: startdatum + weken */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 160px' }}>
              <FieldLabel>Startdatum</FieldLabel>
              <input
                type="date" value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <FieldLabel>Hoeveel weken gekocht?</FieldLabel>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {DURATION_PRESETS.map(w => {
                  const active = parseInt(draftWeeks, 10) === w
                  return (
                    <button
                      key={w} onClick={() => setDraftWeeks(w)}
                      style={{
                        padding: '0.35rem 0.55rem',
                        background: active ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '5px',
                        color: active ? '#FFD700' : 'rgba(255,255,255,0.55)',
                        fontSize: '0.7rem', fontWeight: '800',
                        cursor: 'pointer', minHeight: '30px',
                      }}
                    >{w}w</button>
                  )
                })}
                <input
                  type="number" min="1" max="104" value={draftWeeks}
                  onChange={(e) => setDraftWeeks(e.target.value)}
                  style={{ ...inputStyle, width: '70px', textAlign: 'center', padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                />
              </div>
            </div>
          </div>

          {/* Rij 2: betaalmethode */}
          <div>
            <FieldLabel>Hoe heeft hij betaald?</FieldLabel>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {PAYMENT_OPTIONS.map(opt => {
                const active = draftPayment === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDraftPayment(active ? '' : opt.id)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      background: active ? `${opt.color}1f` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? `${opt.color}66` : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '6px',
                      color: active ? opt.color : 'rgba(255,255,255,0.55)',
                      fontSize: '0.72rem', fontWeight: active ? '900' : '700',
                      cursor: 'pointer', minHeight: '32px',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rij 3: knoppen */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            {editing && (
              <button onClick={() => setEditing(false)} style={secondaryBtnStyle}>Annuleer</button>
            )}
            <button
              onClick={saveSetup}
              disabled={busy || !draftStart || !draftWeeks}
              style={primaryBtnStyle(busy || !draftStart || !draftWeeks)}
            >
              <Check size={13} strokeWidth={2.8} />
              {busy ? 'Opslaan…' : (editing ? 'Wijziging opslaan' : 'Start coaching')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── View-mode ─────────────────────────────────────────────────────────────
  const STATUS_META = {
    active: { color: '#10b981', label: 'Loopt', icon: Play },
    paused: { color: '#f59e0b', label: 'Gepauzeerd', icon: Pause },
    ended:  { color: '#6b7280', label: 'Beëindigd', icon: Square },
  }
  const sm = STATUS_META[status] || STATUS_META.active
  const StatusIcon = sm.icon
  const overdue = period.isOver && status !== 'ended'
  const barColor = overdue ? '#ef4444' : status === 'paused' ? '#f59e0b' : '#10b981'

  return (
    <>
      <div style={panelShell(status)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.25rem 0.55rem',
            background: `${sm.color}1a`, border: `1px solid ${sm.color}55`,
            borderRadius: '999px',
            color: sm.color,
            fontSize: '0.6rem', fontWeight: '800',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            flexShrink: 0,
          }}>
            <StatusIcon size={10} strokeWidth={2.8} />
            {sm.label}
          </div>

          {/* Voortgang + progress bar */}
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.01em' }}>
                {period.weeksDone} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '600', fontSize: '0.7rem' }}>/ {period.weeksTotal}</span> <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: '700', fontSize: '0.65rem' }}>weken</span>
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: '700', color: overdue ? '#ef4444' : 'rgba(255,255,255,0.45)' }}>
                {overdue
                  ? 'Periode voorbij'
                  : status === 'paused'
                    ? `Pauze loopt (${period.weeksRemaining}w rest)`
                    : `nog ~${period.weeksRemaining} weken`}
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${period.pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${barColor}aa 0%, ${barColor} 100%)`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Datums + payment badge + acties */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Calendar size={8} /> Start: {formatDate(period.startDate)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Hourglass size={8} /> Eind: {formatDate(period.endDate)}
              </span>
            </div>
            {client.payment_plan && paymentMeta(client.payment_plan) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.2rem 0.5rem',
                background: `${paymentMeta(client.payment_plan).color}18`,
                border: `1px solid ${paymentMeta(client.payment_plan).color}45`,
                borderRadius: '999px',
                color: paymentMeta(client.payment_plan).color,
                fontSize: '0.55rem', fontWeight: '900',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {paymentMeta(client.payment_plan).short}
              </span>
            )}
            {status === 'active' && (
              <button onClick={() => setShowPauseModal(true)} disabled={busy} style={actionBtnStyle('#f59e0b')}>
                <Pause size={11} /> Pauzeer
              </button>
            )}
            {status === 'paused' && (
              <button onClick={resume} disabled={busy} style={actionBtnStyle('#10b981')}>
                <Play size={11} /> Hervat
              </button>
            )}
            {status !== 'ended' && (
              <button onClick={endCoaching} disabled={busy} style={actionBtnStyle('#ef4444', true)}>
                <Square size={11} />
              </button>
            )}
            {status === 'ended' && (
              <button onClick={reopenCoaching} disabled={busy} style={actionBtnStyle('#10b981')}>
                <Play size={11} /> Heropen
              </button>
            )}
            <button onClick={() => setEditing(true)} style={actionBtnStyle('rgba(255,255,255,0.5)', true)} title="Periode aanpassen">
              <Settings size={11} />
            </button>
          </div>
        </div>

        {/* Pauze-reden banner */}
        {status === 'paused' && client.coaching_pause_reason && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: '6px',
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <AlertCircle size={11} color="#f59e0b" />
            <span style={{ color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.55rem', letterSpacing: '0.06em' }}>Reden:</span>
            <span>{client.coaching_pause_reason}</span>
          </div>
        )}
      </div>

      {/* PAUSE MODAL */}
      {showPauseModal && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowPauseModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 11000,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{
            width: '100%', maxWidth: '480px',
            background: '#0a0a0a',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pause size={14} color="#f59e0b" />
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>Coaching pauzeren</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowPauseModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                De gepauzeerde dagen worden bovenop de eind-datum opgeteld zodra je hervat.
              </div>
              <FieldLabel>Reden (optioneel)</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                {['Vakantie', 'Blessure', 'Ziekte', 'Persoonlijk', 'Drukke periode'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setPauseReason(preset)}
                    style={{
                      padding: '0.3rem 0.55rem',
                      background: pauseReason === preset ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${pauseReason === preset ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '5px',
                      color: pauseReason === preset ? '#f59e0b' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer',
                    }}
                  >{preset}</button>
                ))}
              </div>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Of typ een eigen reden…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '70px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.7rem' }}>
                <button onClick={() => setShowPauseModal(false)} style={{ ...secondaryBtnStyle, flex: 1 }}>Annuleer</button>
                <button
                  onClick={pause}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.85rem',
                    background: '#f59e0b', border: 'none', borderRadius: '7px',
                    color: '#000', fontSize: '0.82rem', fontWeight: '900',
                    cursor: busy ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    minHeight: '38px',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <Pause size={13} strokeWidth={2.8} />
                  {busy ? 'Pauzeren…' : 'Pauzeer'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
function panelShell(status) {
  const tint = status === 'paused' ? '#f59e0b' : status === 'ended' ? '#6b7280' : '#FFD700'
  return {
    padding: '0.55rem 0.75rem',
    background: `linear-gradient(135deg, ${tint}0d 0%, transparent 100%)`,
    border: `1px solid ${tint}33`,
    borderLeft: `3px solid ${tint}`,
    borderRadius: '8px',
    margin: '0.5rem 1rem',
  }
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.55rem', fontWeight: '800',
      color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '0.25rem',
    }}>{children}</div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#fff', fontSize: '0.82rem', fontWeight: '500',
  outline: 'none', boxSizing: 'border-box',
}

const primaryBtnStyle = (disabled) => ({
  padding: '0.5rem 0.9rem',
  background: disabled ? 'rgba(255,215,0,0.15)' : '#FFD700',
  border: 'none', borderRadius: '7px',
  color: disabled ? 'rgba(255,215,0,0.4)' : '#000',
  fontSize: '0.8rem', fontWeight: '900',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.3rem',
  minHeight: '36px',
})

const secondaryBtnStyle = {
  padding: '0.45rem 0.8rem',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '7px',
  color: 'rgba(255,255,255,0.55)',
  fontSize: '0.75rem', fontWeight: '700',
  cursor: 'pointer', minHeight: '34px',
}

const actionBtnStyle = (color, iconOnly) => ({
  padding: iconOnly ? '0.35rem 0.45rem' : '0.35rem 0.6rem',
  background: `${color}15`,
  border: `1px solid ${color}40`,
  borderRadius: '6px',
  color,
  fontSize: '0.62rem', fontWeight: '800',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  minHeight: '28px',
  whiteSpace: 'nowrap',
})
