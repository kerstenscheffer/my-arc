// src/modules/productivity/components/kanban/TaskTimer.jsx
// VERSION 2.0 - Logt verstreken tijd bij afronden/stoppen

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, Pause, Play } from 'lucide-react'

export default function TaskTimer({ task, onComplete, onStop, isMobile, productivityService, coachId }) {
  const totalSeconds = (task.session_minutes || task.estimated_minutes || 25) * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)
  const startedAt = useRef(Date.now())
  const pausedSeconds = useRef(0)
  const pausedAt = useRef(null)

  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current)
      pausedAt.current = Date.now()
      return
    }
    if (pausedAt.current) {
      pausedSeconds.current += (Date.now() - pausedAt.current) / 1000
      pausedAt.current = null
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [paused])

  const getSpentMinutes = () => {
    const elapsed = (Date.now() - startedAt.current) / 1000
    const active = elapsed - pausedSeconds.current - (pausedAt.current ? (Date.now() - pausedAt.current) / 1000 : 0)
    return Math.max(1, Math.round(active / 60))
  }

  const handleComplete = async () => {
    clearInterval(intervalRef.current)
    const mins = getSpentMinutes()
    if (productivityService && coachId) {
      await productivityService.logTime(coachId, task.id, task.title, task.category, mins)
    }
    onComplete(mins)
  }

  const handleStop = async () => {
    clearInterval(intervalRef.current)
    const mins = getSpentMinutes()
    if (mins >= 1 && productivityService && coachId) {
      await productivityService.logTime(coachId, task.id, task.title, task.category, mins)
    }
    onStop()
  }

  const pct = Math.round((secondsLeft / totalSeconds) * 100)
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isLow = secondsLeft < 60
  const isDone = secondsLeft === 0
  const timerColor = isDone ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '80px' : '24px',
      right: isMobile ? '12px' : '24px',
      width: isMobile ? '220px' : '260px',
      background: '#0a0a0a',
      border: `1px solid ${timerColor}30`,
      borderLeft: `3px solid ${timerColor}`,
      borderRadius: '10px',
      overflow: 'hidden',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      transform: 'translateZ(0)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: paused ? '#6b7280' : timerColor, animation: paused ? 'none' : 'tPulse 1.5s ease infinite', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.65rem', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </span>
        <button onClick={handleStop}
          style={{ padding: '2px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation' }}>
          <X size={12} />
        </button>
      </div>

      {/* Timer */}
      <div style={{ padding: '0.625rem 0.625rem 0.375rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: timerColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '0.5rem 0 0.25rem' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: '2px', transition: 'width 1s linear' }} />
        </div>
        <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {isDone ? 'TIJD OP' : paused ? 'GEPAUZEERD' : `${pct}% OVER`}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0.375rem 0.625rem 0.625rem' }}>
        <button onClick={() => setPaused(p => !p)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation' }}>
          {paused ? <><Play size={11} /> Hervat</> : <><Pause size={11} /> Pauze</>}
        </button>
        <button onClick={handleComplete}
          style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', padding: '0.4rem', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <CheckCircle size={11} /> Afronden
        </button>
      </div>

      <style>{`
        @keyframes tPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>,
    document.body
  )
}
