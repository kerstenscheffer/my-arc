// src/modules/workout/components/todays-workout/components/RustKlokBalk.jsx
//
// De rustklok buiten het log-scherm: de balk op de workout-pagina, en de pil
// op een video die het beeld vult.

import { Suspense, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import lazy from '../../../../../lazyMetHerlaad'
import { createPortal } from '../../../../../client/paginaPortal'
import { useRustKlok, stopRustKlok, klokTekst, vraagOefeningOpen } from '../rustKlok'

// Lui: het log-scherm importeert zelf de pil uit dit bestand.
const ExerciseLogModal = lazy(() => import('./ExerciseLogModal'))

const GROEN = '#10b981'

export default function RustKlokBalk({ db, client }) {
  const { klok, over } = useRustKlok()
  // Het log-scherm dat de balk zelf opent als de kaart van de oefening niet op
  // het scherm staat. Blijft open als de klok intussen stopt.
  const [los, setLos] = useState(null)
  const losScherm = los && db && client ? (
    <Suspense fallback={null}>
      <ExerciseLogModal db={db} client={client} exercise={los} onClose={() => setLos(null)} />
    </Suspense>
  ) : null
  if (!klok) return losScherm

  const naarOefening = () => {
    if (vraagOefeningOpen(klok.oefening)) return
    setLos(klok.oef || { name: klok.oefening, sets: 3, reps: 10 })
  }

  const voorbij = over <= 0
  // Op wit: zwart, en een donkerder groen dan op de zwarte schermen (leesbaar).
  const kleur = voorbij ? '#059669' : '#0a0a0a'
  const pct = Math.max(0, Math.min(100, (over / Math.max(1, klok.totaal)) * 100))

  return <>{losScherm}{createPortal(
    // Boven de zwevende navigatie (bottom 22, zIndex 101), onder het log-scherm (10000).
    // Wit, net als de plusknop en "Training afronden" (12 nov 2026, Kersten:
    // de drie liepen niet samen). Staat de plusknop er (oefeningenlijst open),
    // dan staat de klok er rechts naast op dezelfde hoogte in plaats van eroverheen.
    <div className="rust-klok-balk" style={{
      position: 'fixed', left: 10, right: 10, bottom: 92, zIndex: 102,
      maxWidth: 480, margin: '0 auto', overflow: 'hidden',
      background: '#fff', border: 'none',
      borderRadius: 18, boxShadow: '0 14px 36px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <style>{`
        body.oef-plusknop .rust-klok-balk { left: 104px !important; right: 12px !important; margin: 0 !important; bottom: calc(env(safe-area-inset-bottom, 0px) + 35px) !important; }
        @media (min-width: 769px) { body.oef-plusknop .rust-klok-balk { left: 124px !important; bottom: calc(env(safe-area-inset-bottom, 0px) + 43px) !important; } }
      `}</style>
      <div style={{ height: 3, background: 'rgba(10,10,10,0.08)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, transition: 'width 0.25s linear' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.45rem 0.45rem 0.85rem' }}>
        {/* Klok en naam zijn samen één knop: terug naar de oefening. */}
        <button
          onClick={naarOefening}
          aria-label={`Naar ${klok.oefening}`}
          style={{
            flex: 1, minWidth: 0, minHeight: 36, display: 'flex', alignItems: 'center', gap: 12,
            padding: 0, background: 'transparent', border: 'none', textAlign: 'left',
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            fontSize: '1.3rem', fontWeight: 900, color: kleur, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', flexShrink: 0,
          }}>
            {klokTekst(over)}
          </span>
          <span style={{
            flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(10,10,10,0.6)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {voorbij ? 'Rust voorbij' : 'Rust'} · {klok.oefening}
          </span>
          <ChevronRight size={16} strokeWidth={2.8} color="rgba(10,10,10,0.5)" style={{ flexShrink: 0 }} />
        </button>
        <button
          onClick={stopRustKlok}
          aria-label="Rustklok stoppen"
          title="Rustklok stoppen"
          style={{
            width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,10,10,0.07)', border: 'none', borderRadius: 12,
            color: '#0a0a0a', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={16} strokeWidth={2.8} />
        </button>
      </div>
    </div>,
    document.body
  )}</>
}

export function RustKlokPil({ style }) {
  const { klok, over } = useRustKlok()
  if (!klok) return null
  return (
    <div
      aria-label="Rustklok"
      style={{
        position: 'absolute', zIndex: 2, pointerEvents: 'none',
        height: 38, padding: '0 0.7rem', borderRadius: 12,
        display: 'flex', alignItems: 'center',
        background: 'rgba(10,10,10,0.88)', border: '1px solid rgba(255,255,255,0.2)',
        color: over <= 0 ? GROEN : '#fff', fontSize: '0.92rem', fontWeight: 900,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {klokTekst(over)}
    </div>
  )
}
