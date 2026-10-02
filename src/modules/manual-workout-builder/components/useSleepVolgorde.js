// src/modules/manual-workout-builder/components/useSleepVolgorde.js
//
// Oefeningen vastpakken en slepen om de volgorde te veranderen — de héle
// kaart is de greep, niet een knopje aan de zijkant.
//
// Geen bibliotheek: HTML5 drag-and-drop werkt niet op een telefoon, en de
// coach bouwt plannen net zo vaak op zijn iPad als op zijn Mac. Pointer events
// doen muis en vinger hetzelfde. Omdat de hele kaart pakbaar is, moeten tik en
// scroll blijven werken:
//
//   muis   → slepen begint pas na 6 px beweging; een klik blijft een klik.
//   vinger → even vasthouden (220 ms) tilt de kaart op; beweeg je eerder, dan
//            is het scrollen en doen we niets. Tijdens het slepen houdt een
//            niet-passieve touchmove-listener op de lijst de pagina stil —
//            dat is de enige manier om iOS Safari van scrollen af te houden
//            zonder touch-action: none, wat alle scrollen zou doden.
//
// Knoppen, velden en de foto in de kaart zijn uitgezonderd: daar begint geen
// sleep, anders kun je niets meer aanklikken.
//
// Gebruik:
//   const sleep = useSleepVolgorde(aantal, (van, naar) => herschik(van, naar))
//   <div ref={sleep.lijstRef}>
//     <div data-sleep-index={i} style={sleep.kaartStijl(i)}>
//       <Kaart greep={sleep.greep(i)} />   // spreidt greep over zijn buitenste div
//
// gap: de afstand tussen kaarten in de lijst, zodat de andere kaarten precies
// één plek opschuiven.

import { useRef, useState, useCallback, useEffect } from 'react'

const MUIS_DREMPEL = 6      // px voordat een muissleep begint
const VINGER_VASTHOUD = 220 // ms vasthouden voordat de kaart optilt
const VINGER_SCROLL = 8     // px beweging binnen die tijd = scrollen, geen sleep

const INTERACTIEF = 'button, input, textarea, select, a, [data-geen-sleep]'

export default function useSleepVolgorde(aantal, opVolgorde, { gap = 10 } = {}) {
  const lijstRef = useRef(null)
  const [sleep, setSleep] = useState(null) // { van, naar, dy, hoogte }
  const bezigRef = useRef(false)
  const start = useRef(null)               // { y, x, van, hoogte, el, pointerId, timer, actief }

  // iOS blijft scrollen op een touchmove tenzij een niet-passieve listener
  // preventDefault roept. React's onTouchMove is passief, dus zelf aanhaken.
  useEffect(() => {
    const el = lijstRef.current
    if (!el) return undefined
    const rem = (e) => { if (bezigRef.current) e.preventDefault() }
    el.addEventListener('touchmove', rem, { passive: false })
    return () => el.removeEventListener('touchmove', rem)
  }, [])

  const middens = () => {
    const el = lijstRef.current
    if (!el) return []
    return Array.from(el.children)
      .filter(c => c.dataset && c.dataset.sleepIndex !== undefined)
      .map(c => {
        const r = c.getBoundingClientRect()
        return { index: Number(c.dataset.sleepIndex), midden: r.top + r.height / 2, hoogte: r.height }
      })
  }

  const til = () => {
    const s = start.current
    if (!s || s.actief) return
    s.actief = true
    bezigRef.current = true
    s.el?.setPointerCapture?.(s.pointerId)
    if (navigator.vibrate) navigator.vibrate(12)
    setSleep({ van: s.van, naar: s.van, dy: 0, hoogte: s.hoogte })
  }

  const annuleer = () => {
    const s = start.current
    if (s?.timer) clearTimeout(s.timer)
    start.current = null
    bezigRef.current = false
    setSleep(null)
  }

  const greep = useCallback((index) => ({
    onPointerDown: (e) => {
      if (aantal < 2) return
      if (e.button != null && e.button !== 0) return
      if (e.target.closest?.(INTERACTIEF)) return
      const m = middens()
      const eigen = m.find(x => x.index === index)
      start.current = {
        y: e.clientY, x: e.clientX, van: index, hoogte: eigen?.hoogte || 0,
        el: e.currentTarget, pointerId: e.pointerId, timer: null, actief: false,
      }
      if (e.pointerType === 'mouse') {
        // Pas optillen na een paar pixels, zodat een klik een klik blijft.
        return
      }
      start.current.timer = setTimeout(til, VINGER_VASTHOUD)
    },
    onPointerMove: (e) => {
      const s = start.current
      if (!s) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (!s.actief) {
        const afstand = Math.hypot(dx, dy)
        if (e.pointerType === 'mouse') {
          if (afstand >= MUIS_DREMPEL) til()
          else return
        } else {
          // Bewogen vóór het vasthouden om was: dit is scrollen.
          if (afstand >= VINGER_SCROLL) { annuleer(); return }
          return
        }
      }
      e.preventDefault()
      const m = middens()
      const eigen = m.find(x => x.index === s.van)
      if (!eigen) return
      const mijnMidden = eigen.midden + dy
      let naar = s.van
      for (const x of m) {
        if (x.index === s.van) continue
        if (x.index < s.van && mijnMidden < x.midden) naar = Math.min(naar, x.index)
        if (x.index > s.van && mijnMidden > x.midden) naar = Math.max(naar, x.index)
      }
      setSleep({ van: s.van, naar, dy, hoogte: s.hoogte })
    },
    onPointerUp: (e) => {
      const s = start.current
      if (!s) return
      if (s.timer) clearTimeout(s.timer)
      if (!s.actief) { start.current = null; return } // gewone tik
      e.currentTarget.releasePointerCapture?.(e.pointerId)
      const { van } = s
      start.current = null
      bezigRef.current = false
      setSleep(cur => {
        if (cur && cur.naar !== van) opVolgorde(van, cur.naar)
        return null
      })
    },
    onPointerCancel: annuleer,
    // Een klik die het einde van een sleep is, mag niets openen.
    onClickCapture: (e) => { if (bezigRef.current) { e.stopPropagation(); e.preventDefault() } },
    style: { cursor: sleep ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none' },
  }), [aantal, opVolgorde, sleep])

  // Stijl voor de kaart op plek `index`: de gesleepte volgt de vinger, de
  // rest schuift één kaarthoogte op als hij eroverheen is getrokken.
  const kaartStijl = useCallback((index) => {
    if (!sleep) return { transition: 'transform 0.18s ease' }
    const { van, naar, dy, hoogte } = sleep
    if (index === van) {
      return {
        transform: `translateY(${dy}px) scale(1.02)`,
        zIndex: 5, position: 'relative',
        boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
        transition: 'none',
      }
    }
    if (van < naar && index > van && index <= naar) return { transform: `translateY(-${hoogte + gap}px)`, transition: 'transform 0.18s ease' }
    if (van > naar && index >= naar && index < van) return { transform: `translateY(${hoogte + gap}px)`, transition: 'transform 0.18s ease' }
    return { transition: 'transform 0.18s ease' }
  }, [sleep, gap])

  return { lijstRef, greep, kaartStijl, bezig: !!sleep }
}
