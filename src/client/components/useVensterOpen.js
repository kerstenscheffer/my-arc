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

import { useEffect, useState } from 'react'

export default function useVensterOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const isVenster = (el) => {
      if (!(el instanceof HTMLElement)) return false
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed') return false
      const z = parseInt(cs.zIndex, 10)
      if (!(z >= 1000)) return false
      const r = el.getBoundingClientRect()
      return r.width >= window.innerWidth * 0.6 && r.height >= window.innerHeight * 0.5
    }
    const kandidaten = (node) => (node instanceof HTMLElement) ? [node, ...node.children] : []
    const vensters = new Set()
    const mo = new MutationObserver((muts) => {
      let gewijzigd = false
      muts.forEach(m => {
        m.addedNodes.forEach(n => kandidaten(n).forEach(el => { if (isVenster(el)) { vensters.add(el); gewijzigd = true } }))
        m.removedNodes.forEach(n => { vensters.forEach(el => { if (n === el || (n instanceof HTMLElement && n.contains(el))) { vensters.delete(el); gewijzigd = true } }) })
      })
      if (gewijzigd) setOpen(vensters.size > 0)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  return open
}
