// src/modules/ai-meal-generator/tabs/plan-analyzer/ToevoegVenster.jsx
//
// Zwevend venster om snel maaltijden aan een dag toe te voegen (18 nov 2026).
// Binnenin staat het zoek- en logscherm van de klant in coach-stand
// (FoodLogModal, coachModus): geen klantgegevens, alleen producten en de
// coach-maaltijden uit de database. Wat je kiest wordt niet gelogd maar aan
// de open dag toegevoegd. Het venster blokkeert niets: je sleept het aan de kop naast je
// plan en blijft toevoegen tot je het sluit. De plek wordt onthouden.
//
// De plaatsing gaat met transform: daardoor blijft alles wat binnenin
// `position: fixed` gebruikt (het logscherm zelf, de portiekiezer) binnen het
// venster in plaats van over het hele scherm te vallen.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, GripHorizontal } from 'lucide-react'
import FoodLogModal from '../../../meal-plan/components/food-log/FoodLogModal'

const SLEUTEL = 'pa_toevoegvenster'
const BREED = 430
const binnen = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max))

export default function ToevoegVenster({ db, dagNaam = '', onKies, onNieuweMaaltijd = null, onClose }) {
  const hoog = Math.min(720, window.innerHeight - 40)
  const [plek, setPlek] = useState(() => {
    let p = null
    try { p = JSON.parse(localStorage.getItem(SLEUTEL) || 'null') } catch { /* geen opslag */ }
    const x = Number.isFinite(p?.x) ? p.x : window.innerWidth - BREED - 24
    const y = Number.isFinite(p?.y) ? p.y : 20
    return { x: binnen(x, 8, window.innerWidth - BREED - 8), y: binnen(y, 8, window.innerHeight - 80) }
  })
  const sleep = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(plek)) } catch { /* geen opslag */ }
  }, [plek])

  const start = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return
    e.preventDefault()
    sleep.current = { dx: e.clientX - plek.x, dy: e.clientY - plek.y }
    const beweeg = (ev) => {
      if (!sleep.current) return
      setPlek({
        x: binnen(ev.clientX - sleep.current.dx, 8 - BREED + 120, window.innerWidth - 120),
        y: binnen(ev.clientY - sleep.current.dy, 0, window.innerHeight - 44),
      })
    }
    const los = () => {
      sleep.current = null
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', los)
    }
    window.addEventListener('pointermove', beweeg)
    window.addEventListener('pointerup', los)
  }

  return createPortal(
    <div style={{
      position: 'fixed', left: 0, top: 0, zIndex: 9000, width: BREED, maxWidth: 'calc(100vw - 16px)', height: hoog,
      transform: `translate3d(${plek.x}px, ${plek.y}px, 0)`,
      display: 'flex', flexDirection: 'column', background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 24px 70px rgba(0,0,0,0.75)',
    }}>
      <div onPointerDown={start} style={{
        flexShrink: 0, height: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px 0 12px',
        background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.12)', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none',
      }}>
        <GripHorizontal size={15} color="rgba(255,255,255,0.5)" />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Toevoegen{dagNaam ? ` aan ${dagNaam.toLowerCase()}` : ''}
        </span>
        <button onClick={onClose} aria-label="Sluiten" title="Sluiten" style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 7, background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={17} strokeWidth={2.8} />
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <FoodLogModal isOpen inVenster coachModus client={null} db={db} startTab="search" onClose={onClose} onKies={onKies} onNieuweMaaltijd={onNieuweMaaltijd} />
      </div>
    </div>,
    document.body,
  )
}
