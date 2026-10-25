// src/modules/weight-tracker/components/WeightProgressRing.jsx
// v15.2 - Flush button styling, matching de rest van de pagina (geen dikke gevulde cards meer)

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { CircleCheck, Loader2, X } from 'lucide-react'

const MIN = 30
const MAX = 200
const ITEM_W = 72
const valToIdx = (v) => Math.round((parseFloat(v) - MIN) * 10)
const idxToVal = (i) => Math.round((MIN * 10 + i)) / 10
const TOTAL = valToIdx(MAX) + 1

// `gelogd`: groen vinkje rechtsboven het gekozen getal. Alleen zolang het
// getal gelijk is aan wat er gelogd staat; sleep je weg, dan verdwijnt het.
function HorizontalPicker({ value, onChange, disabled, gelogd = false }) {
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
  // Compact: het getal past ruim, meer hoogte is alleen lege ruimte.
  const scrollerH = isMobile ? 62 : 74

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
        {/* Vinkje in een rondje, half over de rechterbovenhoek van het getal. */}
        {gelogd && (
          <div style={{
            position: 'absolute', top: isMobile ? 6 : 8,
            left: `calc(50% + ${isMobile ? 22 : 28}px)`,
            zIndex: 4, pointerEvents: 'none', display: 'flex',
            background: '#0a0a0a', borderRadius: 999,
          }}>
            <CircleCheck size={isMobile ? 20 : 22} strokeWidth={2.8} color="#10b981" />
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
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
  // Losse knop die rechts naast de fijnregel-rij komt te staan (de omtrek-knop
  // op de trackingpagina). Hier, en niet los in de pagina, omdat het bij het
  // weegmoment hoort: je stapt van de weegschaal en pakt het meetlint.
  extraKnop = null,
  // legacy props (niet meer gebruikt)
  progressPercent, targetWeight,
}) {
  // Gelogd: de slider blijft gewoon te slepen. Wijkt het getal af van wat er
  // staat, dan vragen we of je echt wilt wijzigen; anders staat er alleen het
  // groene vinkje en geen knoppen, zodat het blok smal blijft.
  const alreadyLogged = !!todayEntry
  const gelogdGewicht = alreadyLogged ? Number(todayEntry.weight) : null
  const gewijzigd = alreadyLogged && Math.abs(weight - gelogdGewicht) >= 0.05

  const adjust = (delta) => {
    const newVal = Math.max(MIN, Math.min(MAX, weight + delta))
    const rounded = Math.round(newVal * 10) / 10
    onWeightChange(rounded)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const cancelEdit = () => {
    onWeightChange(gelogdGewicht)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const handleSave = () => {
    onSave()
  }

  const showEditMode = gewijzigd
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
      // Geen randen meer om de slider: die sneden het blok los van de rest
      // terwijl de zwarte ruimte het werk al doet.
      // Krap boven: de regel van de coach staat er vlak boven en samen namen ze
      // een half scherm zwart in beslag.
      marginTop: isMobile ? '0.5rem' : '0.75rem',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      contain: 'layout',
      padding: isMobile ? '0.25rem 1rem 0' : '0.35rem 1.5rem 0',
    }}>
      {/* De knop staat naast de slider, op dezelfde hoogte: de slider houdt
          eerder op aan de rechterkant en laat die ruimte vrij. Het gekozen
          getal blijft midden in wat er van de slider overblijft. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <HorizontalPicker
            value={weight}
            onChange={onWeightChange}
            gelogd={alreadyLogged && !gewijzigd}
          />
        </div>
        {/* Over de volle hoogte van de slider en tegen de rechterrand, zoals
            het vaste blok naast de tempo-strook. */}
        {extraKnop && (
          <div style={{ flexShrink: 0, alignSelf: 'stretch', display: 'flex', marginRight: isMobile ? '-1rem' : '-1.5rem' }}>
            {extraKnop}
          </div>
        )}
      </div>

      {/* Fijnregelen ±0.1 — alleen zolang er nog niet gelogd is */}
      {showInitialSave && (
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
        marginTop: '0.75rem',
        marginLeft: isMobile ? '-1rem' : '-1.5rem',
        marginRight: isMobile ? '-1rem' : '-1.5rem',
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

        {/* Weggesleept van het gelogde getal: eerst vragen. */}
        {showEditMode && (
          <>
          <div style={{
            textAlign: 'center', fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 800, color: '#fff',
          }}>
            Gewicht wijzigen van {gelogdGewicht.toFixed(1)} naar {weight.toFixed(1)} kg?
          </div>
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
              {saving ? 'Opslaan...' : 'Wijzigen'}
            </button>
          </div>
          </>
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
