// src/modules/productivity/components/kanban/FloatingTaskTimer.jsx
// Draggable floating timer — zichtbaar op elke pagina in CoachHub
// Patroon exact gebaseerd op ClientContextPanel draggable widget

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, Pause, Play, GripVertical, Minus, Maximize2, Timer } from 'lucide-react'

const DEFAULT_POS = { x: window.innerWidth - 300, y: 80 }

export default function FloatingTaskTimer({ task, sessionMinutes, onComplete, onStop, isMobile }) {
  const totalSeconds = (sessionMinutes || task?.estimated_minutes || 25) * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [paused, setPaused] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState(DEFAULT_POS)
  const [isDragging, setIsDragging] = useState(false)

  const intervalRef = useRef(null)
  const startedAt = useRef(Date.now())
  const pausedSeconds = useRef(0)
  const pausedAt = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Timer tick
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

  // Drag
  const onDragStart = useCallback((e) => {
    e.preventDefault()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y }
    setIsDragging(true)
  }, [pos])

  const onDragMove = useCallback((e) => {
    if (!isDragging) return
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    const newX = Math.max(0, Math.min(window.innerWidth - 280, clientX - dragOffset.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, clientY - dragOffset.current.y))
    setPos({ x: newX, y: newY })
  }, [isDragging])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend', onDragEnd)
    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('mouseup', onDragEnd)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('touchend', onDragEnd)
    }
  }, [isDragging, onDragMove, onDragEnd])

  const getSpentMinutes = () => {
    const elapsed = (Date.now() - startedAt.current) / 1000
    const activePaused = pausedSeconds.current + (pausedAt.current ? (Date.now() - pausedAt.current) / 1000 : 0)
    return Math.max(1, Math.round((elapsed - activePaused) / 60))
  }

  const handleComplete = () => {
    clearInterval(intervalRef.current)
    onComplete(getSpentMinutes())
  }

  const handleStop = () => {
    clearInterval(intervalRef.current)
    onStop(getSpentMinutes())
  }

  const pct = Math.round((secondsLeft / totalSeconds) * 100)
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isLow = secondsLeft > 0 && secondsLeft < 60
  const isDone = secondsLeft === 0
  const timerColor = isDone ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'

  if (!task) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      left: pos.x,
      top: pos.y,
      width: '280px',
      zIndex: 9999,
      background: '#0a0a0a',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${timerColor}`,
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      transform: 'translateZ(0)',
      cursor: isDragging ? 'grabbing' : 'default',
      userSelect: 'none'
    }}>

      {/* Accent line */}
      <div style={{ height: '2px', background: timerColor, opacity: 0.6 }} />

      {/* Header — drag handle */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.5rem 0.625rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: 'grab'
        }}
      >
        <GripVertical size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
        <Timer size={11} color={timerColor} style={{ flexShrink: 0 }} />
        <span style={{
          flex: 1, fontSize: '0.7rem', fontWeight: '700', color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(p => !p) }}
            style={iconBtnStyle}
          >
            <Minus size={9} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setPos(DEFAULT_POS) }}
            style={iconBtnStyle}
          >
            <Maximize2 size={9} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStop() }}
            style={iconBtnStyle}
          >
            <X size={9} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Timer display */}
          <div style={{ padding: '0.75rem 0.625rem 0.375rem', textAlign: 'center' }}>
            {/* Circulaire progress */}
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 0.5rem' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={timerColor} strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: timerColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: paused ? '#6b7280' : timerColor, animation: paused ? 'none' : 'ftPulse 1.5s ease infinite' }} />
              <span style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isDone ? 'TIJD OP' : paused ? 'GEPAUZEERD' : `${pct}% OVER`}
              </span>
            </div>
          </div>

          {/* Category badge */}
          {task.category && (
            <div style={{ textAlign: 'center', paddingBottom: '0.375rem' }}>
              <span style={{ padding: '1px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', fontSize: '0.45rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>
                {task.category}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.375rem', padding: '0.375rem 0.625rem 0.625rem' }}>
            <button
              onClick={() => setPaused(p => !p)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                padding: '0.4rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation'
              }}
            >
              {paused ? <><Play size={11} /> Hervat</> : <><Pause size={11} /> Pauze</>}
            </button>
            <button
              onClick={handleComplete}
              style={{
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                padding: '0.4rem', background: '#10b981', border: 'none',
                borderRadius: '6px', color: '#fff', fontSize: '0.6rem', fontWeight: '700',
                cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              <CheckCircle size={11} /> Afronden
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes ftPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      `}</style>
    </div>,
    document.body
  )
}

const iconBtnStyle = {
  width: '20px', height: '20px', borderRadius: '3px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  padding: 0, flexShrink: 0
}
