// src/modules/weight-tracker/components/WeightProgressRing.jsx
// v15.2 - Flush button styling, matching de rest van de pagina (geen dikke gevulde cards meer)

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'

const MIN = 30
const MAX = 200
const ITEM_W = 72
const valToIdx = (v) => Math.round((parseFloat(v) - MIN) * 10)
const idxToVal = (i) => Math.round((MIN * 10 + i)) / 10
const TOTAL = valToIdx(MAX) + 1

function HorizontalPicker({ value, onChange, disabled }) {
  const isMobile = window.innerWidth <= 768
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const [idx, setIdx] = useState(() => valToIdx(value))
  const [scrollerW, setScrollerW] = useState(0)
  const programmatic = useRef(false)
  const scrollEndTimer = useRef(null)
  const idxRef = useRef(idx)
  idxRef.current = idx

  const spacerW = Math.max(0, scrollerW / 2 - ITEM_W / 2)

  const goTo = useCallback((i, smooth = false) => {
    if (!ref.current || scrollerW === 0) return
    programmatic.current = true
    ref.current.scrollTo({ left: i * ITEM_W, behavior: smooth ? 'smooth' : 'auto' })
    setTimeout(() => { programmatic.current = false }, smooth ? 400 : 50)
  }, [scrollerW])

  useEffect(() => {
    if (!wrapRef.current) return
    const measure = () => {
      const w = wrapRef.current?.offsetWidth || 0
      setScrollerW(w)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrapRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (scrollerW === 0) return
    goTo(idxRef.current, false)
  }, [scrollerW, goTo])

  useEffect(() => {
    const newIdx = valToIdx(value)
    if (newIdx !== idxRef.current) {
      setIdx(newIdx)
      goTo(newIdx, false)
    }
  }, [value, goTo])

  const onScroll = useCallback(() => {
    if (!ref.current || scrollerW === 0 || disabled) return
    if (programmatic.current) return

    const i = Math.max(0, Math.min(TOTAL - 1, Math.round(ref.current.scrollLeft / ITEM_W)))
    if (i !== idxRef.current) {
      setIdx(i)
      onChange(idxToVal(i))
      if (navigator.vibrate) navigator.vibrate(5)
    }

    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => {
      if (!ref.current) return
      const finalIdx = Math.max(0, Math.min(TOTAL - 1, Math.round(ref.current.scrollLeft / ITEM_W)))
      goTo(finalIdx, true)
    }, 150)
  }, [scrollerW, onChange, goTo, disabled])

  const tapItem = (i) => {
    if (disabled) return
    setIdx(i)
    onChange(idxToVal(i))
    if (navigator.vibrate) navigator.vibrate(8)
    goTo(i, true)
  }

  const current = idxToVal(idx)
  const scrollerH = isMobile ? 56 : 64

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      minWidth: 0,
      contain: 'layout',
      opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.2s ease',
      pointerEvents: disabled ? 'none' : 'auto',
    }}>

      {/* Huidig getal */}
      <div style={{
        textAlign: 'center',
        fontSize: isMobile ? '2.2rem' : '2.8rem',
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: '0.75rem',
      }}>
        {current.toFixed(1)}
        <span style={{ fontSize: '0.38em', color: 'rgba(255,215,0,0.4)', marginLeft: '0.2rem' }}>kg</span>
      </div>

      {/* Scroller */}
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          height: `${scrollerH}px`,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(50% - ${ITEM_W / 2}px)`, width: '1px', background: 'rgba(255,215,0,0.3)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(50% + ${ITEM_W / 2}px)`, width: '1px', background: 'rgba(255,215,0,0.3)', zIndex: 3, pointerEvents: 'none' }} />

        <div
          ref={ref}
          onScroll={onScroll}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ flexShrink: 0, width: `${spacerW}px` }} />
          {Array.from({ length: TOTAL }, (_, i) => {
            const sel = i === idx
            return (
              <div
                key={i}
                onClick={() => tapItem(i)}
                style={{
                  flexShrink: 0, width: `${ITEM_W}px`, height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  fontSize: sel ? (isMobile ? '1.2rem' : '1.4rem') : (isMobile ? '0.75rem' : '0.85rem'),
                  fontWeight: sel ? '800' : '400',
                  color: sel ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  userSelect: 'none',
                  transition: 'font-size 0.15s ease, color 0.15s ease',
                }}
              >
                {idxToVal(i).toFixed(1)}
              </div>
            )
          })}
          <div style={{ flexShrink: 0, width: `${spacerW}px` }} />
        </div>
      </div>

      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}

export default function WeightProgressRing({
  weight = 70, onWeightChange, onSave, saving = false,
  todayEntry = null, isFriday = false, isMobile = false,
  // legacy props (niet meer gebruikt)
  progressPercent, targetWeight,
}) {
  const alreadyLogged = !!todayEntry
  const [editing, setEditing] = useState(!alreadyLogged)
  const originalWeight = useRef(weight)

  useEffect(() => {
    if (alreadyLogged) setEditing(false)
    else setEditing(true)
  }, [alreadyLogged])

  const adjust = (delta) => {
    const newVal = Math.max(MIN, Math.min(MAX, weight + delta))
    const rounded = Math.round(newVal * 10) / 10
    onWeightChange(rounded)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const startEdit = () => {
    originalWeight.current = weight
    setEditing(true)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const cancelEdit = () => {
    onWeightChange(originalWeight.current)
    setEditing(false)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const handleSave = () => {
    onSave()
  }

  const showSavedState = alreadyLogged && !editing
  const showEditMode = alreadyLogged && editing
  const showInitialSave = !alreadyLogged

  // Shared button label styling (alle action rows)
  const labelStyle = {
    fontSize: isMobile ? '0.65rem' : '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      contain: 'layout',
      padding: isMobile ? '0.875rem 1rem 0' : '1rem 1.5rem 0',
    }}>
      <HorizontalPicker
        value={weight}
        onChange={onWeightChange}
        disabled={showSavedState}
      />

      {/* Fine-tune ±0.1 — alleen wanneer aanpassen mogelijk */}
      {!showSavedState && (
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          marginTop: '0.625rem',
          justifyContent: 'center',
          maxWidth: '100%',
        }}>
          {[-0.1, +0.1].map((d) => (
            <button key={d} onClick={() => adjust(d)} style={{
              width: isMobile ? '64px' : '72px',
              height: '32px',
              flexShrink: 0,
              padding: 0,
              background: 'rgba(255,215,0,0.04)',
              border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: '6px',
              color: 'rgba(255,215,0,0.55)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}>{d > 0 ? `+${d}` : d}</button>
          ))}
        </div>
      )}

      {/* Action row — flush, edge-to-edge, geen rounded card */}
      <div style={{
        marginTop: showSavedState ? '0.875rem' : '0.75rem',
        marginLeft: isMobile ? '-1rem' : '-1.5rem',
        marginRight: isMobile ? '-1rem' : '-1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* INITIAL SAVE — single flush button */}
        {showInitialSave && (
          <button onClick={handleSave} disabled={saving} style={{
            display: 'block',
            width: '100%',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'transparent',
            border: 'none',
            color: '#FFD700',
            cursor: saving ? 'default' : 'pointer',
            minHeight: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            opacity: saving ? 0.5 : 1,
            ...labelStyle,
          }}>
            {saving ? 'Opslaan...' : 'Gewicht Opslaan'}
          </button>
        )}

        {/* SAVED STATE — flush 2-column rij, vertical divider */}
        {showSavedState && (
          <div style={{ display: 'flex', minHeight: '48px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
              color: '#10b981',
              ...labelStyle,
            }}>
              <Check size={isMobile ? 12 : 13} strokeWidth={2.5} />
              <span>Opgeslagen</span>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <button onClick={startEdit} style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
              background: 'transparent',
              border: 'none',
              color: '#FFD700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              ...labelStyle,
            }}>
              <Pencil size={isMobile ? 11 : 12} strokeWidth={2.5} />
              <span>Aanpassen</span>
            </button>
          </div>
        )}

        {/* EDIT MODE — flush 2-column rij */}
        {showEditMode && (
          <div style={{ display: 'flex', minHeight: '48px' }}>
            <button onClick={cancelEdit} disabled={saving} style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              cursor: saving ? 'default' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving ? 0.5 : 1,
              ...labelStyle,
            }}>
              <X size={isMobile ? 11 : 12} strokeWidth={2.5} />
              <span>Annuleren</span>
            </button>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
              background: 'transparent',
              border: 'none',
              color: '#FFD700',
              cursor: saving ? 'default' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              opacity: saving ? 0.5 : 1,
              ...labelStyle,
            }}>
              {saving ? 'Opslaan...' : 'Update Gewicht'}
            </button>
          </div>
        )}
      </div>

      {saving && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0' }}>
          <Loader2 size={11} color="rgba(255,215,0,0.5)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bezig...</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
