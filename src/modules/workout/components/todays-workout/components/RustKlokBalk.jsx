// src/modules/workout/components/todays-workout/components/RustKlokBalk.jsx
//
// De rustklok buiten het log-scherm: de balk op de workout-pagina, en de pil
// op een video die het beeld vult.

import { X } from 'lucide-react'
import { createPortal } from '../../../../../client/paginaPortal'
import { useRustKlok, stopRustKlok, klokTekst } from '../rustKlok'

const GROEN = '#10b981'

export default function RustKlokBalk() {
  const { klok, over } = useRustKlok()
  if (!klok) return null

  const voorbij = over <= 0
  const kleur = voorbij ? GROEN : '#fff'
  const pct = Math.max(0, Math.min(100, (over / Math.max(1, klok.totaal)) * 100))

  return createPortal(
    // Boven de zwevende navigatie (bottom 22, zIndex 101), onder het log-scherm (10000).
    <div style={{
      position: 'fixed', left: 10, right: 10, bottom: 92, zIndex: 102,
      maxWidth: 480, margin: '0 auto', overflow: 'hidden',
      background: 'rgba(10,10,10,0.96)', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 14, boxShadow: '0 14px 40px rgba(0,0,0,0.6)',
    }}>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: kleur, transition: 'width 0.25s linear' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.45rem 0.45rem 0.45rem 0.85rem' }}>
        <div style={{
          fontSize: '1.3rem', fontWeight: 900, color: kleur, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', flexShrink: 0,
        }}>
          {klokTekst(over)}
        </div>
        <div style={{
          flex: 1, minWidth: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {voorbij ? 'Rust voorbij' : 'Rust'} · {klok.oefening}
        </div>
        <button
          onClick={stopRustKlok}
          aria-label="Rustklok stoppen"
          title="Rustklok stoppen"
          style={{
            width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11,
            color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>,
    document.body
  )
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
