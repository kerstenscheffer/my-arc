// src/modules/challenge-monitor/ChallengeEisenRegel.jsx
//
// De zes challenge-eisen van één klant, alleen voor de coach. Rekent uit de startdatum van
// het traject en maakt bewust GEEN rij in challenge_assignments: precies die rij zet bij de
// klant de trofee met challenge-stand aan, ook in oude app-versies. Dit component schrijft niets.

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { haalEisen } from './challengeCoach'

export function EisenLijst({ eisen }) {
  // Welke uitleg open staat. Een klik en geen hover: op de telefoon is er geen hover.
  const [uitleg, setUitleg] = useState(null)
  if (!eisen) return null
  const open = eisen.regels.find(r => r.key === uitleg)
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>
        {eisen.regels.map(r => (
          <span key={r.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', color: r.gehaald ? '#10b981' : '#fff' }}>
            {r.label} {r.waarde}/{r.nodig}{r.gepland ? ` (+${r.gepland} gepland)` : ''}
            <button
              type="button"
              onClick={() => setUitleg(k => (k === r.key ? null : r.key))}
              aria-label={`Wat telt mee bij ${r.label}?`}
              aria-expanded={uitleg === r.key}
              title={r.uitleg}
              style={{ display: 'inline-flex', padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: uitleg === r.key ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              <Info size={12} strokeWidth={2.6} />
            </button>
          </span>
        ))}
        {eisen.voorbij && (
          <span style={{ whiteSpace: 'nowrap', color: eisen.alles ? '#f59e0b' : 'rgba(255,255,255,0.6)' }}>
            {eisen.alles ? 'Recht op borg terug' : 'Geen recht op borg terug'}
          </span>
        )}
      </div>
      {open && (
        <div style={{ marginTop: 5, maxWidth: 560, fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.45, color: 'rgba(255,255,255,0.85)', whiteSpace: 'normal' }}>
          <strong style={{ fontWeight: 900, color: '#fff' }}>{open.label}: {open.uitleg}.</strong> {open.info}
          {open.key === 'calls' && ' Voor jou geteld uit Zoom en je agenda, omdat die oude telling niet meer wordt gevuld.'}
        </div>
      )}
    </div>
  )
}

// Voor Coach Inzicht: alleen bij een challenge-traject (6 weken).
export default function ChallengeEisenRegel({ client }) {
  const [eisen, setEisen] = useState(null)
  const isChallenge = Number(client?.coaching_total_weeks) === 6
  useEffect(() => {
    if (!isChallenge) return undefined
    let weg = false
    haalEisen(client).then(e => { if (!weg) setEisen(e) }, () => {})
    return () => { weg = true }
  }, [client?.id, client?.coaching_start_date, isChallenge]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!isChallenge || !eisen) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '6px 0' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>Challenge {eisen.behaald}/{eisen.totaal}</span>
      <EisenLijst eisen={eisen} />
    </div>
  )
}
