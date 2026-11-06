// src/modules/business-os/CallBlad.jsx
//
// Gino's voorbereiding van een check-in call (skill Call-voorbereiding,
// checkin_ronde_items.suggesties.call), in de volgorde van de call. Gedeeld
// door de popup in het Klanten-paneel en het Logboek in Coach Inzicht.
// Alles als pijltjes-regels ("Label: waarde"), geen vakjes. Oudere rondes met
// losse zinnen blijven leesbaar.

import { colors } from '../../ui/tokens'
import { BLOKKEN, heeft } from './callBladData'

const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 2 }
const REGEL = { fontSize: '0.8rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.45 }
const KLEUR = { aandacht: colors.danger, vervolg: '#f59e0b', goed: colors.success }

// Eén regel in Gino's stijl: groen pijltje, "Label:" vet, daarna de tekst.
function Regel({ tekst }) {
  const m = String(tekst).match(/^([^:]{1,40}):\s+([\s\S]+)$/)
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 4, ...REGEL }}>
      <span style={{ color: colors.success, fontWeight: 900, flexShrink: 0 }}>→</span>
      <span>{m ? <><b style={{ fontWeight: 900 }}>{m[1]}:</b> {m[2]}</> : tekst}</span>
    </div>
  )
}

const regels = (v) => (Array.isArray(v) ? v : heeft(v) ? [v] : [])

// status: { groep, reden, actie } uit dezelfde ronde (optioneel).
export default function CallBlad({ call, status = null }) {
  const c = call || {}
  const statusRegels = status ? [status.reden && `Status: ${status.reden}`, status.actie && `Zo help je: ${status.actie}`].filter(Boolean) : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {statusRegels.length > 0 && (
        <div>
          <div style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: KLEUR[status.groep] || colors.textMuted }} />Status
          </div>
          {statusRegels.map((r, i) => <Regel key={i} tekst={r} />)}
        </div>
      )}
      {BLOKKEN.map(({ id, titel, vast = [] }) => {
        const extra = id === 'afsluiten'
          ? [heeft(c.volgende_call) ? `Volgende call: ${c.volgende_call}` : 'Volgende call: inplannen, gaat het goed over 2 weken, niet goed over 1 week']
          : []
        const lijst = [...vast, ...regels(c[id]), ...extra]
        if (!lijst.length) return null
        return (
          <div key={id}>
            <div style={LABEL}>{titel}</div>
            {lijst.map((r, i) => <Regel key={i} tekst={r} />)}
          </div>
        )
      })}
    </div>
  )
}
