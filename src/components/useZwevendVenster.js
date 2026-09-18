// src/components/useZwevendVenster.js
//
// Een venster dat naast je werk blijft staan: te verslepen aan zijn kop, te
// vergroten aan zijn hoek, in te klappen tot alleen de balk. Geen gedimde
// achtergrond, dus de pagina eronder blijft gewoon bruikbaar.
//
// Zoals het logboek in Coach Command werkt. Die heeft zijn eigen kopie van
// deze logica; dit is de gedeelde versie voor de vensters die daarna kwamen.
//
// Op een telefoon gebeurt er niets van dit alles: daar vult het venster het
// scherm en is verslepen zinloos.

import { useCallback, useEffect, useRef, useState } from 'react'

const MIN = { w: 320, h: 300 }

const midden = (grootte) => ({
  x: Math.max(12, Math.round((window.innerWidth - grootte.w) / 2)),
  y: Math.max(20, Math.round((window.innerHeight - grootte.h) / 2)),
})

export default function useZwevendVenster({ isMobile, standaard = { w: 480, h: 680 } }) {
  const [grootte, setGrootte] = useState(() => (
    isMobile
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: standaard.w, h: Math.min(standaard.h, window.innerHeight - 40) }
  ))
  const [plek, setPlek] = useState(() => (isMobile ? { x: 0, y: 0 } : midden(standaard)))
  const [ingeklapt, setIngeklapt] = useState(false)
  const [sleept, setSleept] = useState(false)
  const [schaalt, setSchaalt] = useState(false)
  const sleepOffset = useRef({ x: 0, y: 0 })
  const schaalStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const punt = (e) => ({
    x: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
    y: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
  })

  const sleepStart = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    const p = punt(e)
    sleepOffset.current = { x: p.x - plek.x, y: p.y - plek.y }
    setSleept(true)
  }, [plek, isMobile])

  const sleepBeweeg = useCallback((e) => {
    const p = punt(e)
    setPlek({
      // Nooit helemaal buiten beeld: de kop moet aanklikbaar blijven.
      x: Math.max(0, Math.min(window.innerWidth - grootte.w, p.x - sleepOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 60, p.y - sleepOffset.current.y)),
    })
  }, [grootte])

  const schaalStarten = useCallback((e) => {
    if (isMobile) return
    e.preventDefault(); e.stopPropagation()
    const p = punt(e)
    schaalStart.current = { x: p.x, y: p.y, w: grootte.w, h: grootte.h }
    setSchaalt(true)
  }, [grootte, isMobile])

  const schaalBeweeg = useCallback((e) => {
    const p = punt(e)
    setGrootte({
      w: Math.max(MIN.w, schaalStart.current.w + p.x - schaalStart.current.x),
      h: Math.max(MIN.h, schaalStart.current.h + p.y - schaalStart.current.y),
    })
  }, [])

  useEffect(() => {
    if (!sleept && !schaalt) return
    const beweeg = sleept ? sleepBeweeg : schaalBeweeg
    const stop = () => { setSleept(false); setSchaalt(false) }
    window.addEventListener('mousemove', beweeg)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchmove', beweeg, { passive: false })
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', beweeg)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchmove', beweeg)
      window.removeEventListener('touchend', stop)
    }
  }, [sleept, schaalt, sleepBeweeg, schaalBeweeg])

  const herstel = useCallback(() => {
    if (isMobile) return
    const g = { w: standaard.w, h: Math.min(standaard.h, window.innerHeight - 40) }
    setGrootte(g)
    setPlek(midden(g))
    setIngeklapt(false)
  }, [isMobile, standaard.w, standaard.h])

  // Alles wat het venster zelf aan style nodig heeft, zodat de aanroeper
  // alleen nog zijn eigen kleuren toevoegt.
  const vensterStijl = {
    position: 'fixed',
    left: isMobile ? 0 : plek.x,
    top: isMobile ? 0 : plek.y,
    width: isMobile ? '100vw' : grootte.w,
    height: isMobile ? '100dvh' : (ingeklapt ? 'auto' : grootte.h),
    zIndex: 2147483000,
    isolation: 'isolate',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: 'translateZ(0)',
    cursor: sleept ? 'grabbing' : 'default',
  }

  // Op de kop plakken: daarmee versleep je het venster.
  const sleepHandvat = isMobile ? {} : {
    onMouseDown: sleepStart,
    onTouchStart: sleepStart,
    style: { cursor: sleept ? 'grabbing' : 'grab', userSelect: 'none' },
  }

  // Op het hoekje rechtsonder plakken.
  const formaatHandvat = isMobile ? null : {
    onMouseDown: schaalStarten,
    onTouchStart: schaalStarten,
  }

  return { plek, grootte, ingeklapt, setIngeklapt, sleept, schaalt, herstel, vensterStijl, sleepHandvat, formaatHandvat }
}
