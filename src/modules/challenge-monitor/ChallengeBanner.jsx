// src/modules/challenge-monitor/ChallengeBanner.jsx
//
// De challenge-stand van één deelnemer. Zelfde component voor de klant (op
// Home) en voor de coach (in de challenge-hub) — het enige verschil is de
// aanspreekvorm.
//
// Vervangt twee eerdere banners van elk ~900 regels die allebei hun eigen
// tellingen deden op tabellen die niet meer gevuld worden: workout_completions
// (dood sinds 9 juni 2026) en ai_meal_progress. Die lieten daardoor 0/24 zien
// terwijl er wél getraind was. De getallen komen nu uit get_challenge_stand,
// dezelfde bron als het deelnemersoverzicht.

import { useEffect, useState } from 'react'
import { Trophy, Activity, Utensils, Weight, Camera, Phone, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { EISEN, waardenUit, allesGehaald, challengeNaam, haalDeelname, haalStand, tijdlijn } from './challengeEisen'

const GOUD = '#FFD700'
const GROEN = '#10b981'

const ICONEN = {
  workouts: Activity,
  wegingen: Weight,
  voeding: Utensils,
  checkins: ClipboardCheck,
  fotos: Camera,
  calls: Phone,
}

export default function ChallengeBanner({ db, client, isCoachView = false, refreshKey }) {
  const isMobile = window.innerWidth <= 768
  const [deelname, setDeelname] = useState(null)
  const [stand, setStand] = useState(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    let afgebroken = false
    const laad = async () => {
      try {
        const d = await haalDeelname(db, client?.id)
        if (afgebroken) return
        setDeelname(d)
        const s = d ? await haalStand(db, d) : null
        if (!afgebroken) setStand(s)
      } catch (e) {
        console.error('Challenge-stand laden mislukt:', e)
      } finally {
        if (!afgebroken) setLaden(false)
      }
    }
    laad()
    return () => { afgebroken = true }
  }, [client?.id, refreshKey])

  // Geen deelname is geen storing: dan hoort er simpelweg geen banner te staan.
  if (laden || !deelname || !stand) return null

  const w = waardenUit(stand)
  const gehaald = allesGehaald(stand)
  const behaaldAantal = EISEN.filter(e => w[e.key] >= e.nodig).length
  const { dag, totaal, resterend } = tijdlijn(deelname)
  const onbepaald = stand?.workouts?.onbepaald || 0

  return (
    <div style={{
      background: gehaald
        ? 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0.05) 100%)'
        : 'linear-gradient(135deg, rgba(255,215,0,0.09) 0%, rgba(212,175,55,0.04) 100%)',
      border: `1px solid ${gehaald ? 'rgba(16,185,129,0.3)' : 'rgba(255,215,0,0.22)'}`,
      borderRadius: isMobile ? 16 : 20,
      padding: isMobile ? '1.1rem' : '1.5rem',
      marginBottom: isMobile ? '1rem' : '1.5rem',
    }}>
      {/* Kop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.2rem' }}>
        <Trophy size={isMobile ? 22 : 26} color={gehaald ? GROEN : GOUD} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 900,
            color: gehaald ? GROEN : GOUD, letterSpacing: '-0.02em',
          }}>
            {challengeNaam(deelname.challenge_type)}
          </div>
          <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
            {behaaldAantal}/{EISEN.length} eisen behaald
            {deelname.is_paused && <span style={{ color: '#f97316', marginLeft: 8, fontWeight: 800 }}>· GEPAUZEERD</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {resterend}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {resterend === 1 ? 'dag te gaan' : 'dagen te gaan'}
          </div>
        </div>
      </div>

      {/* Voortgangsbalk over de looptijd, zodat "nog 4 van de 14" iets betekent */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, margin: `${isMobile ? '0.9rem' : '1.1rem'} 0` }}>
        <div style={{
          width: `${Math.min(100, (dag / Math.max(1, totaal)) * 100)}%`, height: '100%',
          background: gehaald ? GROEN : GOUD, borderRadius: 2, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* De zes eisen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
        gap: isMobile ? 8 : 10,
      }}>
        {EISEN.map(e => {
          const val = w[e.key]
          const ok = val >= e.nodig
          const Icoon = ICONEN[e.key]
          return (
            <div key={e.key} title={e.uitleg} style={{
              background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: isMobile ? '0.6rem 0.4rem' : '0.75rem 0.5rem',
              textAlign: 'center',
            }}>
              <Icoon size={isMobile ? 14 : 16} color={ok ? GROEN : 'rgba(255,255,255,0.35)'} style={{ marginBottom: 4 }} />
              <div style={{
                fontSize: isMobile ? '0.88rem' : '0.98rem', fontWeight: 900,
                color: ok ? GROEN : '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              }}>
                {val}<span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>/{e.nodig}</span>
              </div>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2,
              }}>
                {e.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Uitkomst in gewone taal. Bij geld wil je geen balkje moeten uitleggen. */}
      <div style={{
        marginTop: isMobile ? '0.9rem' : '1.1rem',
        fontSize: isMobile ? '0.76rem' : '0.82rem', fontWeight: 700,
        color: gehaald ? GROEN : 'rgba(255,255,255,0.55)',
      }}>
        {gehaald
          ? (isCoachView ? 'Alle eisen gehaald — inleg gaat terug.' : 'Alle eisen gehaald. Je krijgt je inleg terug 💪')
          : (isCoachView
              ? `Nog ${EISEN.length - behaaldAantal} eis${EISEN.length - behaaldAantal === 1 ? '' : 'en'} open.`
              : `Nog ${EISEN.length - behaaldAantal} eis${EISEN.length - behaaldAantal === 1 ? '' : 'en'} te gaan — dag ${dag} van ${totaal}.`)}
      </div>

      {/* Workouts zonder herleidbaar schema apart melden. Stil als "niet
          gehaald" wegzetten zou een lager cijfer geven dan verdiend. */}
      {onbepaald > 0 && (
        <div style={{
          marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.68rem', fontWeight: 600, color: '#f59e0b',
        }}>
          <AlertTriangle size={12} />
          {onbepaald} workout{onbepaald === 1 ? '' : 's'} zonder herleidbaar schema — niet meegeteld.
        </div>
      )}
    </div>
  )
}
