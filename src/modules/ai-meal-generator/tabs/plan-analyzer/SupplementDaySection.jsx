// src/modules/ai-meal-generator/tabs/plan-analyzer/SupplementDaySection.jsx
//
// Supplementen in de dagweergave, als kaarten in dezelfde vorm als de
// maaltijden — alleen staat er "Supplementen" waar bij een maaltijd "Lunch"
// staat. Zo leest de dag als één lijst in plaats van maaltijden plus een
// vreemd lijstje eronder.
//
// Eén kaart per moment: drie pillen om 07:00 zijn één handeling voor de klant.
// Supplementen zonder bruikbaar tijdstip ("flexible") krijgen een eigen kaart
// achteraan — een verzonnen tijd zou erger zijn dan geen tijd.
//
// Alleen-lezen. Toewijzen per dag gebeurt in het Supplementen-paneel naast
// Opslaan; twee plekken die hetzelfde bewerken lopen uit elkaar.

import { groepeerPerMoment, doseringTekst, geldtOpDag } from '../../../supplements/utils/supplementSchedule'

export default function SupplementDaySection({ supplementen, maaltijdTijden, dagSleutel, isMobile }) {
  const m = isMobile
  const vandaag = (supplementen || []).filter(s => geldtOpDag(s, dagSleutel))
  if (!vandaag.length) return null

  const momenten = groepeerPerMoment(vandaag, maaltijdTijden)
  if (!momenten.length) return null

  const fotoFormaat = m ? 70 : 80

  return (
    <>
      {momenten.map((moment, i) => (
        <div key={i} style={{
          // Zelfde zwevende kaart als MealCard, zodat de dag één ritme houdt.
          margin: m ? '0 0.5rem 0.45rem' : '0 0.75rem 0.55rem',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex', alignItems: 'stretch', minWidth: 0,
        }}>
          {/* Waar een maaltijd z'n foto heeft, staan hier de emoji's. Een
              stockfoto van pillen zegt minder dan de iconen zelf. */}
          <div style={{
            width: fotoFormaat, height: fotoFormaat, flexShrink: 0,
            background: 'rgba(34,197,94,0.10)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 2, padding: 4,
          }}>
            {moment.items.slice(0, 4).map((s, j) => (
              <span key={j} style={{ fontSize: moment.items.length > 2 ? '1rem' : '1.5rem', lineHeight: 1 }}>
                {s.emoji || '💊'}
              </span>
            ))}
          </div>

          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: m ? '0.45rem 0.7rem 0.4rem' : '0.55rem 0.95rem 0.5rem',
          }}>
            {/* Kopregel — staat waar bij een maaltijd het slot staat. Wit,
                niet goud: het is een ander soort regel dan een maaltijd. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 800, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, opacity: 0.85,
              }}>
                Supplementen
              </span>
              <span style={{ flex: 1 }} />
              <span style={{
                fontSize: '0.55rem', fontWeight: 700,
                color: moment.minuten == null ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)',
              }}>
                {moment.minuten == null ? 'flexibel' : moment.label}
              </span>
            </div>

            {moment.items.map((s, j) => {
              const dosering = doseringTekst(s)
              return (
                <div key={j} style={{
                  display: 'flex', alignItems: 'baseline', gap: 6,
                  marginTop: j === 0 ? 0 : 2,
                }}>
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: m ? '0.82rem' : '0.9rem', fontWeight: 800, color: '#fff',
                    letterSpacing: '-0.015em', lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {s.name}
                  </span>
                  {dosering && (
                    <span style={{
                      flexShrink: 0,
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
    </>
  )
}
