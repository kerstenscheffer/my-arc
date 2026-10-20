// src/client/components/useVensterOpen.js
//
// Staat er een venster (modal) open? Voor zwevende dingen onderin het
// klantscherm (waterfles, videobalk) die onder een venster horen te blijven.
//
// Waarom niet gewoon een lagere z-index: het voedingsscherm is zelf een vaste
// laag (z-index 1) en de vensters daarin zitten in die laag opgesloten. Ze
// komen nooit boven iets uit dat daarbuiten staat, hoe hoog hun eigen z-index
// ook is. Dus kijken we zelf: een vaste laag met z-index >= 1000 die het
// grootste deel van het scherm bedekt, telt als open venster.
//
// Snelheid: dit draait bij elke DOM-wijziging in de hele app. Vroeger deed
// elk toegevoegd element een getComputedStyle (dwingt een stijlberekening af),
// wat de app tijdens intensief gebruik steeds trager maakte. Nu:
//   - wijzigingen worden per frame gebundeld (requestAnimationFrame);
//   - alleen elementen die zelf al 'fixed' zeggen (inline stijl of de
//     Tailwind-klasse) krijgen de dure meting.
// Eén gedeelde observer voor alle gebruikers van de hook.

import { useEffect, useState } from 'react'

const isVenster = (el) => {
  if (!(el instanceof HTMLElement)) return false
  if (el.style.position !== 'fixed' && !el.classList.contains('fixed')) return false
  const cs = getComputedStyle(el)
  if (cs.position !== 'fixed') return false
  const z = parseInt(cs.zIndex, 10)
  if (!(z >= 1000)) return false
  const r = el.getBoundingClientRect()
  return r.width >= window.innerWidth * 0.6 && r.height >= window.innerHeight * 0.5
}

const vensters = new Set()
const luisteraars = new Set()
let mo = null
let toegevoegd = []
let verwijderd = false
let frame = 0
let laatst = false

const verwerk = () => {
  frame = 0
  const nieuw = toegevoegd
  toegevoegd = []
  nieuw.forEach(n => {
    if (!(n instanceof HTMLElement) || !n.isConnected) return
    if (isVenster(n)) vensters.add(n)
    for (const c of n.children) if (isVenster(c)) vensters.add(c)
  })
  if (verwijderd) {
    verwijderd = false
    vensters.forEach(el => { if (!el.isConnected) vensters.delete(el) })
  }
  const open = vensters.size > 0
  if (open !== laatst) {
    laatst = open
    luisteraars.forEach(f => f(open))
  }
}

const start = () => {
  mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach(n => { if (n instanceof HTMLElement) toegevoegd.push(n) })
      if (m.removedNodes.length && vensters.size) verwijderd = true
    }
    if (!frame && (toegevoegd.length || verwijderd)) frame = requestAnimationFrame(verwerk)
  })
  mo.observe(document.body, { childList: true, subtree: true })
}

export default function useVensterOpen() {
  const [open, setOpen] = useState(laatst)
  useEffect(() => {
    luisteraars.add(setOpen)
    if (!mo) start()
    setOpen(laatst)
    return () => {
      luisteraars.delete(setOpen)
      if (!luisteraars.size && mo) {
        mo.disconnect(); mo = null
        if (frame) cancelAnimationFrame(frame)
        frame = 0; toegevoegd = []; verwijderd = false; vensters.clear(); laatst = false
      }
    }
  }, [])
  return open
}
