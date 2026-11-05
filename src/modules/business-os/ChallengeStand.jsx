// src/modules/business-os/ChallengeStand.jsx
//
// Eén regel met wat de challenge in totaal oplevert. Staat bij Gino's Omzet en op het
// omzetscherm in Leads, zodat Kersten en Marcel dezelfde getallen zien.

import { useEffect, useState } from 'react'
import { colors } from '../../ui/tokens'
import { haalChallengeGeld } from './challengeGeld'

const G = colors.success
const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`

// Challenge in totaal: wat al van jou is en wat nog kan veranderen. Dezelfde cijfers als Klanten.
export default function ChallengeStand({ isMobile }) {
  const [geld, setGeld] = useState(null)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    let weg = false
    haalChallengeGeld().then(g => { if (!weg) setGeld(g) }, () => {})
    return () => { weg = true }
  }, [])
  if (!geld) return null
  const vakken = [
    ['zeker', 'Zeker', geld.zeker, G],
    ['toegezegd', 'Toegezegd', geld.toegezegd, '#fff'],
    ['onzeker', 'Onzeker', geld.onzeker, '#f59e0b'],
    ['refund', 'Refunds', geld.refund, '#fff'],
  ]
  const lijst = open && geld.lijsten[open]
  return (
    <div style={{ flexShrink: 0, marginTop: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'auto repeat(4, minmax(0, 1fr))', gap: '10px 24px', alignItems: 'baseline' }}>
        <div title={`${geld.aantal} challenges, ${euro(geld.verkocht)} verkocht. Totaal, niet per maand.`} style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', gridColumn: isMobile ? '1 / -1' : 'auto', whiteSpace: 'nowrap' }}>Challenge totaal</div>
        {vakken.map(([k, label, v, kleur]) => (
          <button key={k} type="button" aria-expanded={open === k} onClick={() => setOpen(o => (o === k ? null : k))} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: 0, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums' }}>{euro(v)}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
          </button>
        ))}
      </div>
      {lijst && (
        <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
          {lijst.length === 0 && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Niemand</div>}
          {lijst.map(x => (
            <div key={x.id} style={{ display: 'flex', gap: 10, padding: '2px 0', fontSize: 12.5, fontWeight: 800, color: '#fff' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.naam}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, whiteSpace: 'nowrap' }}>{x.sub}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{euro(x.bedrag)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
