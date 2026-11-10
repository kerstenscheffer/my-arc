// src/modules/manual-workout-builder/components/SpierOverzicht.jsx
//
// Uitklapbaar overzicht onder de weektotalen (10 nov 2026): per lichaamsdeel een
// tabelletje met elke spiergroep (sets, doel, herstel, advies) en daaronder zijn
// koppen met directe sets. In één oogopslag, zonder elke spier aan te klikken.

import { HerstelStip } from './HerstelSpieren'
import { spierLabel } from '../spierGroepen'

const getal = (v) => String(Math.round(v * 10) / 10).replace('.', ',')
const PIJL = { omhoog: ['↑', '#10b981'], omlaag: ['↓', '#ef4444'], 'let op': ['!', '#f59e0b'] }

// blokken: [[titel, [spier...]]], sets: { spier: { frac } }, advies/herstel per spier.
export default function SpierOverzicht({ blokken, sets, advies = {}, herstel = {} }) {
  const kol = { fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginTop: 10 }}>
      {blokken.map(([titel, spieren]) => (
        <div key={titel} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.55rem 0.7rem 0.6rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{titel}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {spieren.map(k => {
                const a = advies[k]
                const p = a && PIJL[a.oordeel]
                return [
                  <tr key={k}>
                    <td style={{ padding: '3px 0', fontSize: '0.8rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                      {spierLabel(k)}<HerstelStip stand={herstel[k]?.stand} maat={6} />
                      {p && <span title={a.tekst} style={{ marginLeft: 4, fontWeight: 900, color: p[1] }}>{p[0]}</span>}
                    </td>
                    <td style={{ ...kol, fontSize: '0.82rem', fontWeight: 900, color: '#fff' }}>{getal(sets[k]?.frac || 0)}</td>
                    <td style={{ ...kol, width: 64, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                      {a?.range ? `/ ${getal(a.range[0])}–${getal(a.range[1])}` : ''}
                    </td>
                  </tr>,
                  ...(a?.koppen || []).map(kp => (
                    <tr key={`${k}-${kp.label}`}>
                      <td style={{ padding: '1px 0 1px 12px', fontSize: '0.72rem', fontWeight: 700, color: kp.sets === 0 ? '#f59e0b' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{kp.label}</td>
                      <td style={{ ...kol, fontSize: '0.74rem', fontWeight: 800, color: kp.sets === 0 ? '#f59e0b' : 'rgba(255,255,255,0.8)' }}>{kp.sets}</td>
                      <td />
                    </tr>
                  )),
                ]
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
