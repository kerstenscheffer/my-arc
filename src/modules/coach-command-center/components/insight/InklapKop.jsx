// src/modules/coach-command-center/components/insight/InklapKop.jsx
//
// Kopje dat een sectie in Coach Inzicht in- en uitklapt, met het aantal
// erachter. Standaard dicht; de keuze blijft per sectie onthouden.
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// eslint-disable-next-line react-refresh/only-export-components -- hook hoort bij dit kopje
export function useInklap(sleutel, standaardOpen = false) {
  const opslag = `myarc_inzicht_open_${sleutel}`
  const [open, setOpen] = useState(() => {
    try { const v = localStorage.getItem(opslag); return v == null ? standaardOpen : v === '1' } catch { return standaardOpen }
  })
  const wissel = () => setOpen(o => {
    try { localStorage.setItem(opslag, o ? '0' : '1') } catch { /* private mode */ }
    return !o
  })
  return [open, wissel]
}

export default function InklapKop({ titel, aantal, open, onWissel }) {
  return (
    <button onClick={onWissel} aria-expanded={open} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '0.6rem 0.9rem 0.45rem', background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>
      <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{titel}</span>
      {aantal > 0 && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{aantal}</span>}
      <ChevronDown size={15} strokeWidth={2.6} color="rgba(255,255,255,0.55)" style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
    </button>
  )
}
