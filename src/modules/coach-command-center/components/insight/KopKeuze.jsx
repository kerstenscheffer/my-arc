// src/modules/coach-command-center/components/insight/KopKeuze.jsx
//
// Een kop die tegelijk de keuze is: je leest wat er staat en klikt erop om het
// te veranderen. Vervangt de rijen pillen die hier stonden — acht knoppen voor
// twee keuzes is acht dingen om te lezen.
//
// Hier lag eerst een onzichtbare `<select>` over de tekst, zodat je het
// keuzemenu van het toestel zelf kreeg. Dat werkte op een telefoon, maar het
// menu van de browser wordt geplaatst buiten de layout om: in een geschaald
// venster (de device-modus van Chrome, een webview met zoom) opende het een
// halve pagina hoger dan de knop. Vandaar een eigen menu, in een portal met
// vaste coördinaten uit getBoundingClientRect — dat volgt de knop altijd, ook
// binnen een blok met overflow: hidden.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export default function KopKeuze({ waarde, opties, onKies, groot = false, kleur = '#fff' }) {
  const knopRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [plek, setPlek] = useState(null)   // { top, left, breedte }

  const huidig = opties.find(o => o.id === waarde)

  // Waar het menu komt: onder de knop, en als daar geen ruimte is erboven.
  const meet = () => {
    const el = knopRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const hoogteSchatting = Math.min(opties.length, 8) * 38 + 8
    const onder = window.innerHeight - r.bottom
    const naarBoven = onder < hoogteSchatting && r.top > hoogteSchatting
    setPlek({
      top: naarBoven ? r.top - hoogteSchatting - 4 : r.bottom + 4,
      left: Math.max(8, Math.min(r.left, window.innerWidth - 220)),
      breedte: Math.max(r.width + 24, 150),
    })
  }

  useLayoutEffect(() => { if (open) meet() }, [open])

  // Scrollen of draaien terwijl het menu openstaat: dan klopt de plek niet meer.
  // Meebewegen is hier verkeerd — je hebt de knop uit beeld gescrold — dus hij
  // gaat gewoon dicht.
  useEffect(() => {
    if (!open) return undefined
    const dicht = () => setOpen(false)
    const opToets = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('scroll', dicht, true)
    window.addEventListener('resize', dicht)
    window.addEventListener('keydown', opToets)
    return () => {
      window.removeEventListener('scroll', dicht, true)
      window.removeEventListener('resize', dicht)
      window.removeEventListener('keydown', opToets)
    }
  }, [open])

  return (
    <>
      <button
        ref={knopRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3,
          flexShrink: 0, padding: 0, background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{
          fontSize: groot ? '0.9rem' : '0.78rem', fontWeight: 900, color: kleur,
          letterSpacing: '-0.02em', whiteSpace: 'nowrap',
        }}>
          {huidig?.label || opties[0]?.label}
        </span>
        <ChevronDown size={groot ? 14 : 12} strokeWidth={3} color="rgba(255,255,255,0.45)" />
      </button>

      {open && plek && createPortal(
        <>
          {/* Naast het menu tikken sluit het. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 2147483400, background: 'transparent' }}
          />
          <div
            role="listbox"
            style={{
              position: 'fixed', top: plek.top, left: plek.left, minWidth: plek.breedte,
              maxHeight: '60vh', overflowY: 'auto',
              zIndex: 2147483401,
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: 4,
              boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            }}
          >
            {opties.map(o => {
              const aan = o.id === waarde
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={aan}
                  onClick={() => { setOpen(false); onKies(o.id) }}
                  style={{
                    width: '100%', minHeight: 34,
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 0.55rem', borderRadius: 7,
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none', color: aan ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.78rem', fontWeight: aan ? 900 : 700,
                    fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ width: 13, flexShrink: 0 }}>
                    {aan && <Check size={13} strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              )
            })}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
