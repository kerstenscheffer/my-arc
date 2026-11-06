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

export default function CallBlad({ call }) {
  if (!call) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {BLOKKEN.filter(([id]) => heeft(call[id])).map(([id, titel]) => (
        <div key={id}>
          <div style={LABEL}>{titel}</div>
          {Array.isArray(call[id])
            ? call[id].map((r, i) => <div key={i} style={{ ...REGEL, marginTop: 2 }}>→ {r}</div>)
            : <div style={{ ...REGEL, ...(id === 'doel' ? { fontWeight: 900 } : null) }}>{call[id]}</div>}
        </div>
      ))}
    </div>
  )
}
