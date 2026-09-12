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

function HorizontalPicker({ value, onChange, disabled, savedLabel = false, onEdit = null }) {
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

  // Hoger dan eerst: het gekozen getal ís nu de kop, dus dat mag groot.
  const scrollerH = isMobile ? 86 : 100

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      minWidth: 0,
      contain: 'layout',
      // Geen faded look meer bij disabled — het getal moet er prominent
      // blijven uitspringen. Alleen interactie uit.
      transition: 'opacity 0.2s ease',
      pointerEvents: disabled ? 'none' : 'auto',
    }}>

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
        {/* Vinkje: opgeslagen. Stond eerder als "Opgeslagen"-pill naast een
            tweede, groot getal boven de schuif. */}
        {savedLabel && (
          <div style={{
            position: 'absolute', top: '50%', left: `calc(50% + ${ITEM_W / 2}px + 10px)`,
            transform: 'translateY(-50%)', zIndex: 4, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', color: '#fff',
          }}>
            <Check size={isMobile ? 18 : 20} strokeWidth={3.2} />
          </div>
        )}
        {/* Potlood linksonder aan het gelogde getal, in plaats van een brede
            "Aanpassen"-knop die als los onderdeel voelde. */}
        {savedLabel && onEdit && (
          <button
            onClick={onEdit}
            aria-label="Gewicht aanpassen"
            style={{
              position: 'absolute', bottom: 4, left: `calc(50% - ${ITEM_W / 2}px - 34px)`,
              zIndex: 4, width: 30, height: 30, padding: 0,
              background: 'transparent', border: 'none', borderRadius: 8,
              color: '#fff', opacity: 0.75,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', pointerEvents: 'auto',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Pencil size={15} strokeWidth={2.6} />
          </button>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(50% - ${ITEM_W / 2}px)`, width: '1.5px', background: 'rgba(255,255,255,0.55)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(50% + ${ITEM_W / 2}px)`, width: '1.5px', background: 'rgba(255,255,255,0.55)', zIndex: 3, pointerEvents: 'none' }} />

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
                  fontSize: sel ? (isMobile ? '2.1rem' : '2.5rem') : (isMobile ? '0.8rem' : '0.9rem'),
                  fontWeight: sel ? 900 : 600,
                  letterSpacing: sel ? '-0.03em' : 0,
                  color: sel ? '#fff' : 'rgba(255,255,255,0.25)',
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
        savedLabel={showSavedState}
        onEdit={startEdit}
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
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.25)',
              borderRadius: 9,
              color: '#fff',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: 900,
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
            color: '#fff',
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
              color: '#fff',
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
          <Loader2 size={11} color="rgba(255,255,255,0.5)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bezig…</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
