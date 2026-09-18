// src/client/components/TijdWiel.jsx
//
// Een tijd kiezen zoals je een wekker zet: draaien tot de goede regel in de
// band staat. Gebruikt in de agenda (één blok verzetten) en in je dagindeling
// (de vaste tijden), zodat het overal dezelfde beweging is.

import { useEffect, useRef } from 'react'
import { STAP, tijdTekst } from './tijdHelpers'

const REGEL = 40                            // hoogte van één regel
const AANTAL = (24 * 60) / STAP             // 00:00 t/m 23:55

const LIJN = 'rgba(255,255,255,0.08)'

export default function TijdWiel({ waarde, onKies, regels = 5 }) {
  const wielRef = useRef(null)
  const scrollTimer = useRef(null)
  // Springt het wiel omdat wíj hem zetten, dan hoort dat niet als keuze terug
  // te komen; anders schiet hij bij het openen naar de dichtstbijzijnde regel.
  const zelfGezet = useRef(false)

  useEffect(() => {
    const el = wielRef.current
    if (!el) return
    const doel = Math.round(waarde / STAP) * REGEL
    if (Math.abs(el.scrollTop - doel) < 2) return
    zelfGezet.current = true
    const id = requestAnimationFrame(() => { el.scrollTop = doel })
    return () => cancelAnimationFrame(id)
  }, [waarde])

  useEffect(() => () => { if (scrollTimer.current) clearTimeout(scrollTimer.current) }, [])

  // Pas vastklikken als het scrollen stilligt; anders staat er tijdens het
  // draaien elke frame een ander getal en flikkert alles eromheen mee.
  const opScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const el = wielRef.current
      if (!el) return
      zelfGezet.current = false
      const i = Math.max(0, Math.min(AANTAL - 1, Math.round(el.scrollTop / REGEL)))
      const m = i * STAP
      if (m !== waarde) onKies(m)
    }, 90)
  }

  const rand = Math.floor(regels / 2)

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={wielRef}
        onScroll={opScroll}
        style={{
          height: REGEL * regels, overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%)',
        }}
      >
        <div style={{ paddingTop: REGEL * rand, paddingBottom: REGEL * rand }}>
          {Array.from({ length: AANTAL }, (_, i) => {
            const m = i * STAP
            const actief = m === waarde
            return (
              <div
                key={m}
                onClick={() => {
                  const el = wielRef.current
                  if (el) el.scrollTo({ top: i * REGEL, behavior: 'smooth' })
                  onKies(m)
                }}
                style={{
                  height: REGEL, scrollSnapAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: actief ? '1.05rem' : '0.9rem',
                  fontWeight: actief ? 900 : 700,
                  color: actief ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                {tijdTekst(m)}
              </div>
            )
          })}
        </div>
      </div>
      <div aria-hidden style={{
        position: 'absolute', left: 0, right: 0, top: REGEL * rand, height: REGEL,
        borderTop: `1px solid ${LIJN}`, borderBottom: `1px solid ${LIJN}`,
        pointerEvents: 'none',
      }} />
    </div>
  )
}
