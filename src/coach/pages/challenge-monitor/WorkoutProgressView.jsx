// src/coach/pages/challenge-monitor/WorkoutProgressView.jsx
//
// De workouts van één deelnemer, sessie voor sessie.
//
// Las workout_completions: die tabel is sinds 9 juni 2026 leeg gebleven, dus
// dit scherm stond op nul terwijl er wel getraind werd. En het rekende met
// "24 workouts in 8 weken", los van welke challenge er loopt.
//
// De regel én de losse sessies komen nu uit get_challenge_stand — dezelfde
// bron als de banner erboven en het deelnemersoverzicht. Rekent dit scherm
// zelf, dan zie je hier een ander getal dan in de tabel, en gaat het over geld.

import { useEffect, useState } from 'react'
import { Dumbbell, Check, X, AlertTriangle } from 'lucide-react'
import { EISEN, haalStand } from '../../../modules/challenge-monitor/challengeEisen'

const EIS = EISEN.find(e => e.key === 'workouts')

export default function WorkoutProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [stand, setStand] = useState(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    let afgebroken = false
    setLaden(true)
    haalStand(db, challengeData ? { ...challengeData, client_id: client?.id } : null)
      .then(s => { if (!afgebroken) setStand(s) })
      .catch(e => console.error('Workout-stand laden mislukt:', e))
      .finally(() => { if (!afgebroken) setLaden(false) })
    return () => { afgebroken = true }
  }, [client?.id, challengeData?.id, challengeData?.end_date])

  if (laden) return <Kader><div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Workouts ophalen…</div></Kader>
  if (!stand) return <Kader><div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Geen gegevens.</div></Kader>

  const { geldig = 0, sessies = 0, onbepaald = 0, dagen = [] } = stand.workouts || {}
  const start = new Date(`${stand.periode.start}T00:00:00`)
  const weekVan = (datum) => Math.floor((new Date(`${datum}T00:00:00`) - start) / 604800000) + 1

  // Per week groeperen zodat je in één oogopslag ziet wáár het misging.
  const perWeek = new Map()
  dagen.forEach(d => {
    const wk = weekVan(d.datum)
    if (!perWeek.has(wk)) perWeek.set(wk, [])
    perWeek.get(wk).push(d)
  })

  return (
    <Kader>
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? 8 : 12, marginBottom: '1.4rem',
      }}>
        <Vak label={`van de ${EIS.nodig} nodig`} waarde={geldig} kleur={geldig >= EIS.nodig ? '#10b981' : '#f97316'} isMobile={isMobile} />
        <Vak label="sessies gestart" waarde={sessies} isMobile={isMobile} />
        <Vak label="telde niet mee" waarde={sessies - geldig} isMobile={isMobile} />
      </div>

      {onbepaald > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: '1.1rem',
          fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b',
        }}>
          <AlertTriangle size={13} />
          {onbepaald} sessie{onbepaald === 1 ? '' : 's'} zonder herleidbaar schema: het aantal geplande sets is onbekend, dus die kunnen niet worden beoordeeld.
        </div>
      )}

      {dagen.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
          Nog geen workouts gestart in deze periode.
        </div>
      ) : (
        [...perWeek.keys()].sort((a, b) => a - b).map(wk => (
          <div key={wk} style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
            }}>
              Week {wk} · {perWeek.get(wk).filter(d => d.telt).length} van {perWeek.get(wk).length} geldig
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {perWeek.get(wk).map(d => {
                const pct = d.gepland > 0 ? Math.round((d.gedaan / d.gepland) * 100) : null
                return (
                  <div key={d.datum} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.5rem 0.7rem', borderRadius: 8,
                    background: d.telt ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                  }}>
                    {d.telt
                      ? <Check size={14} color="#10b981" strokeWidth={3} />
                      : <X size={14} color="rgba(255,255,255,0.25)" strokeWidth={3} />}
                    <div style={{ color: '#fff', fontWeight: 700, minWidth: isMobile ? 78 : 104 }}>
                      {new Date(`${d.datum}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                      {d.gepland > 0 ? `${d.gedaan} van ${d.gepland} sets` : `${d.gedaan} sets · plan onbekend`}
                    </div>
                    {pct !== null && (
                      <div style={{
                        fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                        color: d.telt ? '#10b981' : 'rgba(255,255,255,0.4)',
                      }}>{pct}%</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: '0.8rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>
        Een workout telt mee vanaf 70% van de geplande sets. {EIS.uitleg}.
      </div>
    </Kader>
  )
}

function Kader({ children }) {
  const isMobile = window.innerWidth <= 768
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.03) 100%)',
      borderRadius: 16, padding: isMobile ? '1.1rem' : '1.5rem',
      border: '1px solid rgba(249,115,22,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.1rem' }}>
        <Dumbbell size={18} color="#f97316" />
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Workouts</div>
      </div>
      {children}
    </div>
  )
}

function Vak({ label, waarde, kleur = '#fff', isMobile }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', borderRadius: 12,
      padding: isMobile ? '0.7rem 0.5rem' : '0.9rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {waarde}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
