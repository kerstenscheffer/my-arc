// src/modules/meal-plan/components/GramInvoer.jsx
// Gedeeld door het info-blad (wisselen / coach-maaltijden) en het
// portiescherm bij loggen.
import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { stukTekst } from './food-log/portionPresets'

// Hoeveelheid aanpassen in het info-blad: min, getal, plus. Tikken op de kaart
// zelf doet niets, dus de knoppen houden hun klik voor zich.
// Met `stuk` (1 sneetje = 35 g) verspringt hij per stuk en staat eronder
// hoeveel stuks het is.
export default function GramInvoer({ waarde, eenheid, stap, zet, stuk = null }) {
  const knop = {
    width: 26, height: 26, borderRadius: 8, padding: 0,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const stop = (e) => e.stopPropagation()
  const stuks = stukTekst(Number(waarde) || 0, stuk)
  return (
    <div onClick={stop} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <button style={knop} aria-label="Minder" onClick={(e) => { stop(e); zet(Math.max(0, (Number(waarde) || 0) - stap)) }}>
        <Minus size={13} strokeWidth={3} />
      </button>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <input
          type="number" inputMode="numeric" value={waarde}
          onClick={stop}
          onChange={(e) => zet(e.target.value === '' ? 0 : Number(e.target.value))}
          style={{
            width: 46, textAlign: 'right', background: 'transparent', border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.25)', color: '#fff',
            fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none', padding: '2px 0',
          }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{eenheid}</span>
      </div>
      <button style={knop} aria-label="Meer" onClick={(e) => { stop(e); zet((Number(waarde) || 0) + stap) }}>
        <Plus size={13} strokeWidth={3} />
      </button>
    </div>
    {stuks && (
      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', paddingRight: 31 }}>
        {stuks}
      </div>
    )}
    </div>
  )
}
