// src/modules/coach-command-center/components/insight/GetalWiel.jsx
//
// Een getal kiezen door te scrollen, in stappen. Zelfde beweging als het
// tijdwiel bij de klant-agenda: je draait tot de goede waarde in de band staat.
//
// Waarom niet gewoon een invoerveld: macro's stel je bij in stappen van vijftig
// of vijf, niet op de kcal nauwkeurig. Met een wiel doe je "iets minder" in één
// beweging zonder het hele getal opnieuw te typen — en je ziet meteen waar je
// vandaan kwam.

import { useEffect, useRef } from 'react'

const REGEL = 34

export default function GetalWiel({ waarde, min, max, stap, eenheid, kleur = '#fff', onKies }) {
  const wielRef = useRef(null)
  const timer = useRef(null)

  const opties = []
  for (let v = min; v <= max; v += stap) opties.push(v)
  const index = Math.max(0, Math.round((waarde - min) / stap))

  useEffect(() => {
    const el = wielRef.current
    if (!el) return
    const doel = index * REGEL
    if (Math.abs(el.scrollTop - doel) < 2) return
    const id = requestAnimationFrame(() => { el.scrollTop = doel })
    return () => cancelAnimationFrame(id)
  }, [index])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Pas vastklikken als het scrollen stilligt; anders vuurt elke frame een
  // wijziging af en flikkert alles eromheen mee.
  const opScroll = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const el = wielRef.current
      if (!el) return
      const i = Math.max(0, Math.min(opties.length - 1, Math.round(el.scrollTop / REGEL)))
      if (opties[i] !== waarde) onKies(opties[i])
    }, 90)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={wielRef}
        onScroll={opScroll}
        style={{
          height: REGEL * 5, overflowY: 'auto',
          scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)',
        }}
      >
        <div style={{ paddingTop: REGEL * 2, paddingBottom: REGEL * 2 }}>
          {opties.map(v => {
            const aan = v === waarde
            return (
              <div
                key={v}
                onClick={() => onKies(v)}
                style={{
                  height: REGEL, scrollSnapAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontSize: aan ? '1rem' : '0.82rem',
                  fontWeight: aan ? 900 : 700,
                  color: aan ? kleur : 'rgba(255,255,255,0.3)',
                  fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                {v.toLocaleString('nl-NL')}
                {aan && eenheid && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>{eenheid}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div aria-hidden style={{
        position: 'absolute', left: 0, right: 0, top: REGEL * 2, height: REGEL,
        borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
