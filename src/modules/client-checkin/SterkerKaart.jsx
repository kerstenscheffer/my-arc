// src/modules/client-checkin/SterkerKaart.jsx
//
// Eén oefening waarop de klant sterker werd, als kaart. Bewust dezelfde
// opbouw als ExerciseCard in de log-modal: foto links over de volle hoogte,
// gedimd met een donkere laag eroverheen, tekst rechts. Wie de workout-pagina
// kent, herkent dit meteen als "een oefening".

import { useEffect, useState } from 'react'
import { colors, radius, space } from '../../ui/tokens'
import { laadOefeningFoto, getFallbackImage } from '../workout/utils/oefeningFoto'

const nl = (n) => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)

export default function SterkerKaart({ oefening, vorig, nu, pct, db, clientId, isMobile }) {
  const [foto, setFoto] = useState(() => getFallbackImage({ name: oefening }))
  const fotoBreedte = isMobile ? 62 : 72

  useEffect(() => {
    let weg = false
    laadOefeningFoto(db, { name: oefening }, clientId).then(url => { if (!weg && url) setFoto(url) })
    return () => { weg = true }
  }, [db, oefening, clientId])

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: colors.surface,
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: radius.btn, overflow: 'hidden',
    }}>
      {/* Foto over de volle hoogte, zelfde dimming als de log-modal. */}
      <div style={{ width: fotoBreedte, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.6,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      </div>

      <div style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: space[3],
        padding: `${space[3]}px ${space[3]}px`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {oefening}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textSecondary, marginTop: space[1], fontVariantNumeric: 'tabular-nums' }}>
            {nl(vorig)} → {nl(nu)} kg
          </div>
        </div>
        <div style={{
          fontSize: 15, fontWeight: 800, color: colors.success,
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          +{pct}%
        </div>
      </div>
    </div>
  )
}
