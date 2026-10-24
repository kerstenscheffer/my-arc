// src/modules/coach-command-center/components/insight/KolomKop.jsx
//
// Eén kopbalk per kolom in Coach Inzicht, overal even hoog: icoon, titel,
// en rechts wat de kolom zelf het belangrijkst vindt (plan, aantal, knoppen),
// dan het kruisje. Stond eerder per kolom anders: een kleine algemene kop met
// daaronder nog een eigen kop of knoppenrij van wisselende hoogte.
//
// De kolom levert die inhoud met <KolomKopInhoud>. Staat de kolom onder een
// KolomKop (desktop, meerdere kolommen), dan komt de inhoud in de balk;
// anders (mobiel, of maar één kolom) staat hij als eigen regel bovenaan.

import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { KOP_HOOGTE } from './kolomKopStijl'

const KopVak = createContext(null)

export function KolomKop({ icon: Icoon, titel, onVerberg, children }) {
  const [vak, setVak] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{
        flexShrink: 0, height: KOP_HOOGTE, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 0.4rem 0 0.75rem',
        background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {Icoon && <Icoon size={14} color="#fff" strokeWidth={2.4} style={{ flexShrink: 0 }} />}
        <span style={{ flexShrink: 0, fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{titel}</span>
        {/* Het vak voor de inhoud van de kolom. */}
        <div ref={setVak} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, overflow: 'hidden' }} />
        {onVerberg && (
          <button onClick={onVerberg} title={`${titel} verbergen`} aria-label={`${titel} verbergen`} style={{
            flexShrink: 0, width: 26, height: 26, padding: 0, borderRadius: 7, background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <KopVak.Provider value={vak || false}>{children}</KopVak.Provider>
      </div>
    </div>
  )
}

// Inhoud voor in de kopbalk. Zonder balk: een eigen regel van dezelfde hoogte.
export function KolomKopInhoud({ children }) {
  const vak = useContext(KopVak)
  if (vak) return createPortal(children, vak)
  if (vak === false) return null // balk is er, vak nog niet gemeten
  return (
    <div style={{
      flexShrink: 0, minHeight: KOP_HOOGTE, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
      padding: '0 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}
