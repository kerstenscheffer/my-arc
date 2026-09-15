// src/modules/productivity/components/FloatingPanel.jsx
// Compact chip (icon + label + badge) that expands into a floating panel.
// The panel is draggable by its header so the user can park it anywhere on
// the page — same pattern as CoachingLogModal. The chip itself can act as
// a drop-target so e.g. drag-to-unschedule keeps working even when the
// panel is collapsed.

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, GripHorizontal } from 'lucide-react'

export default function FloatingPanel({
  icon: Icon,
  label,
  badge,
  iconColor = '#10b981',
  accent = '#10b981',
  panelWidth = 320,
  panelMaxHeight = '70vh',
  align = 'right',          // initial side the panel hugs when first opened
  onDragOver, onDrop,
  isMobile = false,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}) {
  const [openInternal, setOpenInternal] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : openInternal
  const setOpen = (v) => {
    if (!isControlled) setOpenInternal(v)
    onOpenChange?.(v)
  }

  const chipRef = useRef(null)

  // Drag state — panel uses absolute pixel coords once positioned.
  const [pos, setPos] = useState(null) // { x, y } or null until first open
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // On open: anchor the panel to the chip on first open, then keep its
  // position across opens so the user's chosen spot is remembered.
  useEffect(() => {
    if (!open) return
    if (pos) return // user already positioned it; respect that
    const el = chipRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const w = isMobile ? Math.min(window.innerWidth - 16, panelWidth) : panelWidth
    const initialX = align === 'right'
      ? Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width - w))
      : Math.max(8, r.left)
    const initialY = Math.min(r.top + r.height + 6, window.innerHeight - 100)
    setPos({ x: initialX, y: initialY })
  }, [open, pos, align, isMobile, panelWidth])

  // ── Drag handlers ──
  const onDragStart = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: cx - (pos?.x ?? 0), y: cy - (pos?.y ?? 0) }
    setIsDragging(true)
  }, [pos, isMobile])

  const onDragMove = useCallback((e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setPos({
      x: Math.max(0, Math.min(window.innerWidth  - panelWidth,    cx - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 60,            cy - dragOffset.current.y)),
    })
  }, [panelWidth])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup',   onDragEnd)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend',  onDragEnd)
    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('mouseup',   onDragEnd)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('touchend',  onDragEnd)
    }
  }, [isDragging, onDragMove, onDragEnd])

  return (
    <>
      <button
        ref={chipRef}
        onClick={() => setOpen(!open)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        title={label}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0 0.75rem',
          minHeight: 30,
          background: open ? '#fff' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? '#fff' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 999,
          color: open ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
          fontSize: '0.68rem', fontWeight: 800,
          letterSpacing: '-0.005em',
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        }}
      >
        {Icon && <Icon size={12} strokeWidth={2.6} color={open ? '#0a0a0a' : iconColor} />}
        <span>{label}</span>
        {badge != null && (
          <span style={{
            padding: '1px 6px',
            background: open ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)',
            color: open ? '#0a0a0a' : 'rgba(255,255,255,0.7)',
            borderRadius: 999, fontSize: '0.6rem', fontWeight: 900,
            minWidth: 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
          }}>
            {badge}
          </span>
        )}
        <ChevronDown
          size={11}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s', opacity: 0.55,
          }}
        />
      </button>

      {open && pos && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: isMobile ? 0 : pos.x,
            top:  isMobile ? 0 : pos.y,
            width: isMobile ? '100vw' : panelWidth,
            maxHeight: isMobile ? '100dvh' : panelMaxHeight,
            zIndex: 2147483000,
            isolation: 'isolate',
            background: '#0a0a0a',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: isMobile ? 0 : 14,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column',
            cursor: isDragging ? 'grabbing' : 'default',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {/* Header — grab handle */}
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.6rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
              cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
              touchAction: 'none',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            {!isMobile && <GripHorizontal size={11} color="rgba(255,255,255,0.3)" />}
            {Icon && <Icon size={12} strokeWidth={2.6} color={accent} />}
            <span style={{ flex: 1, fontSize: '0.74rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
              {label}
              {badge != null && (
                <span style={{
                  marginLeft: 6, padding: '1px 5px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.65)',
                  borderRadius: 999, fontSize: '0.58rem', fontWeight: 800,
                }}>{badge}</span>
              )}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                width: 26, height: 26, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <X size={11} />
            </button>
          </div>
          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
