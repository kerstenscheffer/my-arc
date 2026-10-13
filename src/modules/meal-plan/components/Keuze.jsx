// src/modules/meal-plan/components/Keuze.jsx
//
// Gedeeld keuzemenu voor de voedingsschermen: de gekozen waarde als losse
// tekst met een pijltje, en een eigen menu eronder. Zat eerst in
// AIAlternativesModal; het log-venster gebruikt dezelfde vorm.
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

// Eén keuze: de gekozen waarde als losse tekst met een pijltje. Eigen menu in
// plaats van een <select>: de systeem-dropdown van de browser is een klein wit
// lijstje dat niets met de app te maken heeft, en hij opende bovenaan het
// scherm in plaats van onder de knop.
// `vast`: op eigen breedte (voor een rij menu's naast elkaar); anders deelt
// hij de ruimte gelijk met zijn buren, zoals in het wisselvenster.
function Keuze({ waarde, opties, zet, isMobile, uitlijning = 'links', vast = false }) {
  const [open, setOpen] = useState(false)
  const [plek, setPlek] = useState(null)
  const knopRef = useRef(null)
  const menuRef = useRef(null)
  const gekozen = opties.find(o => o.id === waarde) || opties[0]

  // Het menu hangt via een portal aan <body> met vaste positie. Absoluut onder
  // de knop viel het in de Command-filterbalk onder de klantkaarten (eigen
  // stapelcontext); zo ligt het altijd bovenop.
  useLayoutEffect(() => {
    if (!open || !knopRef.current) return
    const r = knopRef.current.getBoundingClientRect()
    const top = r.bottom + 4
    setPlek({
      top,
      ...(uitlijning === 'rechts' ? { right: Math.max(8, window.innerWidth - r.right) } : { left: Math.max(8, r.left) }),
      maxHeight: Math.max(120, Math.min(280, window.innerHeight - top - 12)),
    })
  }, [open, uitlijning])

  // Scrollt of verschuift de pagina, dan klopt de plek niet meer: dicht.
  // Scrollen binnen het menu zelf telt niet.
  useEffect(() => {
    if (!open) return
    const dicht = (e) => { if (!menuRef.current?.contains(e.target)) setOpen(false) }
    const weg = () => setOpen(false)
    window.addEventListener('scroll', dicht, true)
    window.addEventListener('resize', weg)
    return () => {
      window.removeEventListener('scroll', dicht, true)
      window.removeEventListener('resize', weg)
    }
  }, [open])

  return (
    <div style={{ flex: vast ? '0 0 auto' : 1, minWidth: 0, position: 'relative' }}>
      <button
        ref={knopRef}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          padding: isMobile ? '0.35rem 0.3rem' : '0.4rem 0.4rem',
          background: 'transparent', border: 'none',
          fontFamily: 'inherit', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{
          fontSize: isMobile ? '0.68rem' : '0.74rem',
          fontWeight: 800, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          minWidth: 0,
        }}>
          {gekozen?.label}
        </span>
        <ChevronDown
          size={12} strokeWidth={2.8}
          style={{
            color: 'rgba(255,255,255,0.45)', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && plek && createPortal(
        <>
          {/* Vangt de tik naast het menu op. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 100000 }}
          />
          <div ref={menuRef} style={{
            position: 'fixed', zIndex: 100001,
            top: plek.top,
            ...(plek.right != null ? { right: plek.right } : { left: plek.left }),
            minWidth: 168,
            // Lange lijsten (sporten, templates) scrollen binnen het menu in
            // plaats van onder de rand van het venster te verdwijnen.
            maxHeight: plek.maxHeight, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
            padding: 4,
          }}>
            {opties.map(o => {
              const aan = o.id === waarde
              return (
                <button
                  key={o.id}
                  onClick={() => { zet(o.id); setOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '0.5rem 0.6rem',
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none', borderRadius: 8,
                    color: aan ? '#fff' : 'rgba(255,255,255,0.62)',
                    fontSize: isMobile ? '0.74rem' : '0.78rem',
                    fontWeight: aan ? 900 : 700,
                    fontFamily: 'inherit', textAlign: 'left',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Check
                    size={12} strokeWidth={3}
                    style={{ flexShrink: 0, opacity: aan ? 1 : 0 }}
                  />
                  {o.label}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default Keuze
