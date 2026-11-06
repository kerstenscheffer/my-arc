// src/modules/business-os/CallBlad.jsx
//
// Gino's voorbereiding van een check-in call (skill Call-voorbereiding,
// checkin_ronde_items.suggesties.call). Gedeeld door de popup in het
// Klanten-paneel en het Logboek in Coach Inzicht, zodat beide hetzelfde tonen.
// Oudere rondes hebben alleen sinds/open/vragen; die blijven werken.

import { colors } from '../../ui/tokens'
import { BLOKKEN, heeft } from './callBladData'

const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 4 }
const REGEL = { fontSize: '0.8rem', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.45 }

// Eén regel in Gino's stijl: groen pijltje, "Label:" vet, daarna de tekst.
function Regel({ tekst }) {
  const m = String(tekst).match(/^([^:]{1,40}):\s+([\s\S]+)$/)
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4, ...REGEL, fontWeight: 600 }}>
      <span style={{ color: colors.success, fontWeight: 900, flexShrink: 0 }}>→</span>
      <span>{m ? <><b style={{ fontWeight: 900 }}>{m[1]}:</b> {m[2]}</> : tekst}</span>
    </div>
  )
}

export default function CallBlad({ call }) {
  if (!call) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {BLOKKEN.filter(([id]) => heeft(call[id])).map(([id, titel]) => (
        <div key={id}>
          <div style={LABEL}>{titel}</div>
          {Array.isArray(call[id])
            ? call[id].map((r, i) => <Regel key={i} tekst={r} />)
            : <div style={REGEL}>{call[id]}</div>}
        </div>
      ))}
    </div>
  )
}
