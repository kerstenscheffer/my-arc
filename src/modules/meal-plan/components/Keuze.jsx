// src/modules/meal-plan/components/Keuze.jsx
//
// Gedeeld keuzemenu voor de voedingsschermen: de gekozen waarde als losse
// tekst met een pijltje, en een eigen menu eronder. Zat eerst in
// AIAlternativesModal; het log-venster gebruikt dezelfde vorm.
import React, { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// Eén keuze: de gekozen waarde als losse tekst met een pijltje. Eigen menu in
// plaats van een <select>: de systeem-dropdown van de browser is een klein wit
// lijstje dat niets met de app te maken heeft, en hij opende bovenaan het
// scherm in plaats van onder de knop.
function Keuze({ waarde, opties, zet, isMobile, uitlijning = 'links' }) {
  const [open, setOpen] = useState(false)
  const gekozen = opties.find(o => o.id === waarde) || opties[0]

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <button
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

      {open && (
        <>
          {/* Vangt de tik naast het menu op. */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', zIndex: 41,
            ...(uitlijning === 'rechts' ? { right: 0 } : { left: 0 }),
            minWidth: 168,
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            boxShadow: '0 18px 44px rgba(0,0,0,0.7)',
            overflow: 'hidden',
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
        </>
      )}
    </div>
  )
}

export default Keuze
