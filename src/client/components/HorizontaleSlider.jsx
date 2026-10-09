// src/client/components/HorizontaleSlider.jsx
//
// Horizontale slider zoals de gewichtsslider op de trackingpagina
// (WeightProgressRing → HorizontalPicker): je sleept door een rij waarden, het
// gekozen getal staat groot in het midden, de rest klein en vervaagt naar de
// randen. Klikt vast op de dichtstbijzijnde waarde en tikt licht bij elke stap.
//
// Algemeen: `waarden` is elke lijst (tijden, uren, kilo's), `toon` maakt er
// tekst van.

import { useCallback, useEffect, useRef, useState } from 'react'

export default function HorizontaleSlider({ waarden, waarde, onChange, toon = (v) => String(v), itemBreedte = 72, hoogte = 86 }) {
  const ref = useRef(null)
  const wrapRef = useRef(null)
  const vindIdx = useCallback((v) => {
    let beste = 0, afstand = Infinity
    waarden.forEach((w, i) => { const a = Math.abs(Number(w) - Number(v)); if (a < afstand || w === v) { afstand = w === v ? -1 : a; beste = i } })
    return beste
  }, [waarden])
  const [idx, setIdx] = useState(() => vindIdx(waarde))
  const [breedte, setBreedte] = useState(0)
  const programmatisch = useRef(false)
  const eindTimer = useRef(null)
  const idxRef = useRef(idx)
  idxRef.current = idx
  const TOTAAL = waarden.length
  const spacer = Math.max(0, breedte / 2 - itemBreedte / 2)

  const ga = useCallback((i, zacht = false) => {
    if (!ref.current || breedte === 0) return
    programmatisch.current = true
    ref.current.scrollTo({ left: i * itemBreedte, behavior: zacht ? 'smooth' : 'auto' })
    setTimeout(() => { programmatisch.current = false }, zacht ? 400 : 50)
  }, [breedte, itemBreedte])

  useEffect(() => {
    if (!wrapRef.current) return
    const meet = () => setBreedte(wrapRef.current?.offsetWidth || 0)
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { if (breedte) ga(idxRef.current, false) }, [breedte, ga])
  useEffect(() => {
    const n = vindIdx(waarde)
    if (n !== idxRef.current) { setIdx(n); ga(n, false) }
  }, [waarde, vindIdx, ga])

  const opScroll = useCallback(() => {
    if (!ref.current || !breedte || programmatisch.current) return
    const i = Math.max(0, Math.min(TOTAAL - 1, Math.round(ref.current.scrollLeft / itemBreedte)))
    if (i !== idxRef.current) {
      setIdx(i)
      onChange(waarden[i])
      if (navigator.vibrate) navigator.vibrate(5)
    }
    if (eindTimer.current) clearTimeout(eindTimer.current)
    eindTimer.current = setTimeout(() => {
      if (!ref.current) return
      ga(Math.max(0, Math.min(TOTAAL - 1, Math.round(ref.current.scrollLeft / itemBreedte))), true)
    }, 150)
  }, [breedte, TOTAAL, itemBreedte, onChange, waarden, ga])

  const tik = (i) => { setIdx(i); onChange(waarden[i]); if (navigator.vibrate) navigator.vibrate(8); ga(i, true) }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', minWidth: 0, height: hoogte, overflow: 'hidden', contain: 'layout' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, #0a0a0a, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div
        ref={ref}
        onScroll={opScroll}
        className="arc-hslider"
        style={{
          position: 'absolute', inset: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}
      >
        <div style={{ flexShrink: 0, width: spacer }} />
        {waarden.map((w, i) => {
          const sel = i === idx
          return (
            <div
              key={i}
              onClick={() => tik(i)}
              style={{
                flexShrink: 0, width: itemBreedte, height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none', fontVariantNumeric: 'tabular-nums',
                fontSize: sel ? '2.1rem' : '0.8rem', fontWeight: sel ? 900 : 600,
                letterSpacing: sel ? '-0.03em' : 0,
                color: sel ? '#fff' : 'rgba(255,255,255,0.25)',
                transition: 'font-size 0.15s ease, color 0.15s ease',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {toon(w)}
            </div>
          )
        })}
        <div style={{ flexShrink: 0, width: spacer }} />
      </div>
      <style>{'.arc-hslider::-webkit-scrollbar{display:none}'}</style>
    </div>
  )
}
