// src/modules/ai-meal-generator/tabs/plan-analyzer/SupplementDaySection.jsx
//
// Kopje "Supplementen" onder de maaltijden in de dagweergave.
//
// Groepeert op moment: drie pillen om 07:00 zijn één regel, geen drie. Een
// supplement dat "bij het ontbijt" hoort pakt de kloktijd van het ontbijt van
// díe dag, zodat de lijst meeschuift als de coach een maaltijd verzet.
//
// Bewust alleen-lezen. Instellen gebeurt in de Supplementen-tab; twee plekken
// die hetzelfde bewerken lopen gegarandeerd uit elkaar.

import { Pill } from 'lucide-react'
import { groepeerPerMoment, doseringTekst } from '../../../supplements/utils/supplementSchedule'

export default function SupplementDaySection({ supplementen, maaltijdTijden, isMobile }) {
  if (!supplementen?.length) return null
  const momenten = groepeerPerMoment(supplementen, maaltijdTijden)
  if (!momenten.length) return null

  const m = isMobile

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: m ? '0.7rem 0.75rem 0.45rem' : '0.8rem 1rem 0.5rem',
      }}>
        <Pill size={15} strokeWidth={2.6} color="#fff" />
        <span style={{ fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Supplementen
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
          {supplementen.length} totaal
        </span>
      </div>

      {momenten.map((moment, i) => (
        <div key={i} style={{
          display: 'flex', gap: m ? 8 : 12,
          padding: m ? '0.4rem 0.75rem' : '0.45rem 1rem',
          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
        }}>
          {/* Tijd — vaste breedte zodat de namen links uitlijnen */}
          <div style={{
            flexShrink: 0, width: m ? 46 : 56, paddingTop: 1,
            fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 900,
            color: moment.minuten == null ? 'rgba(255,255,255,0.35)' : '#fff',
            letterSpacing: '-0.02em',
          }}>
            {moment.label}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {moment.items.map((s, j) => {
              const dosering = doseringTekst(s)
              return (
                <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {s.emoji && <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{s.emoji}</span>}
                  <span style={{
                    fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 800, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.name}
                  </span>
                  {dosering && (
                    <span style={{
                      marginLeft: 'auto', flexShrink: 0,
                      fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 800,
                      color: 'rgba(255,255,255,0.55)',
                    }}>
                      {dosering}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
