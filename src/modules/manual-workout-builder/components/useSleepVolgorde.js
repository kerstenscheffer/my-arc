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
  // Laatste stand ook in een ref: bij loslaten lezen we 'naar' hieruit. Eerst
  // stond opVolgorde ín de updater van setSleep, en die draait tijdens het
  // renderen; dan zet de ouder state midden in een render van DayBuilder.
  const sleepRef = useRef(null)
  sleepRef.current = sleep
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

  // Loslaten vangen we op het venster op, niet alleen op de kaart (13 nov 2026).
  // Liet je de muis los naast de kaart voordat de sleep echt begon, dan kwam er
  // geen pointerup aan: de start bleef staan en de kaart sprong later aan je
  // muis vast zonder dat je een knop indrukte.
  const opVolgordeRef = useRef(opVolgorde)
  opVolgordeRef.current = opVolgorde
  const luisteraars = useRef(null)
  const stopLuisteren = () => {
    const l = luisteraars.current
    if (!l) return
    window.removeEventListener('pointerup', l.los, true)
    window.removeEventListener('pointercancel', l.weg, true)
    window.removeEventListener('blur', l.weg)
    luisteraars.current = null
  }
  const annuleer = () => {
    const s = start.current
    if (s?.timer) clearTimeout(s.timer)
    try { if (s?.actief) s.el?.releasePointerCapture?.(s.pointerId) } catch { /* al losgelaten */ }
    start.current = null
    bezigRef.current = false
    stopLuisteren()
    setSleep(null)
  }
  const laatLos = () => {
    const s = start.current
    stopLuisteren()
    if (!s) return
    if (s.timer) clearTimeout(s.timer)
    start.current = null
    if (!s.actief) return // gewone tik
    try { s.el?.releasePointerCapture?.(s.pointerId) } catch { /* al losgelaten */ }
    const cur = sleepRef.current
    setSleep(null)
    // Pas na de klik die op het loslaten volgt weer vrijgeven: die klik mag niets openen.
    setTimeout(() => { bezigRef.current = false }, 0)
    if (cur && cur.naar !== s.van) opVolgordeRef.current(s.van, cur.naar)
  }
  const startLuisteren = () => {
    stopLuisteren()
    luisteraars.current = { los: () => laatLos(), weg: () => annuleer() }
    window.addEventListener('pointerup', luisteraars.current.los, true)
    window.addEventListener('pointercancel', luisteraars.current.weg, true)
    window.addEventListener('blur', luisteraars.current.weg)
  }
  useEffect(() => stopLuisteren, [])

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
      startLuisteren()
      if (e.pointerType === 'mouse') {
        // Pas optillen na een paar pixels, zodat een klik een klik blijft.
        return
      }
      start.current.timer = setTimeout(til, VINGER_VASTHOUD)
    },
    onPointerMove: (e) => {
      const s = start.current
      if (!s) return
      // Muis beweegt zonder ingedrukte knop: het loslaten is gemist. Afronden.
      if (e.pointerType === 'mouse' && e.buttons === 0) { laatLos(); return }
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
    onPointerUp: () => laatLos(),
    onPointerCancel: annuleer,
    // De foto in de kaart niet als plaatje laten wegslepen door de browser.
    onDragStart: (e) => e.preventDefault(),
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
