// src/modules/coach-command-center/components/insight/StappenInsight.jsx
//
// Stappen van de klant in de Training-kolom van Coach Insight: het dagdoel dat
// jij zet, en wat hij de afgelopen week liep.
//
// Staat bij cardio en niet bij voeding, want het is hetzelfde gesprek: hoeveel
// beweegt hij buiten de training om.

import { useCallback, useEffect, useState } from 'react'
import { Footprints } from 'lucide-react'
import StappenService, { STANDAARD_DOEL } from '../../../steps/StappenService'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function StappenInsight({ db, client, isMobile }) {
  const [dagen, setDagen] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [bezig, setBezig] = useState(false)
  const [bewaard, setBewaard] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const [rijen, d] = await Promise.all([
      StappenService.haalDagen(db, client.id, 7),
      StappenService.haalDoel(db, client.id),
    ])
    setDagen(rijen)
    setDoel(d)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  const zet = async (nieuw) => {
    const waarde = Math.max(1000, Math.min(50000, nieuw))
    setDoel(waarde)
    setBezig(true)
    try {
      await StappenService.zetDoel(db, client.id, waarde)
      setBewaard(true)
      setTimeout(() => setBewaard(false), 1400)
    } catch (e) {
      console.error('Stappendoel opslaan mislukt:', e)
    } finally {
      setBezig(false)
    }
  }

  const vandaag = dagen[dagen.length - 1]
  const gelogd = dagen.filter(d => d.steps > 0)
  const gemiddeld = gelogd.length
    ? Math.round(gelogd.reduce((s, d) => s + d.steps, 0) / gelogd.length)
    : 0

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Footprints size={13} color="#fff" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Stappen · doel per dag
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            {vandaag?.steps ? `Vandaag ${nl(vandaag.steps)}` : 'Vandaag nog niets'}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {gemiddeld ? ` · gem. ${nl(gemiddeld)} over ${gelogd.length} ${gelogd.length === 1 ? 'dag' : 'dagen'}` : ' · nog niets gelogd'}
            </span>
          </div>
          {bewaard && (
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginTop: 1 }}>Doel bewaard</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: bezig ? 0.5 : 1 }}>
          <button onClick={() => zet(doel - 1000)} aria-label="Minder" style={knop}>−</button>
          <span style={{
            minWidth: 52, textAlign: 'center',
            fontSize: '0.85rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums',
          }}>
            {nl(doel)}
          </span>
          <button onClick={() => zet(doel + 1000)} aria-label="Meer" style={knop}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', alignItems: 'flex-end' }}>
        {dagen.map((d, i) => {
          const pct = doel > 0 ? Math.min(100, (d.steps / doel) * 100) : 0
          return (
            <div key={d.iso} style={{ flex: 1, textAlign: 'center' }}>
              <div
                title={`${d.iso}: ${nl(d.steps)} stappen${d.source ? ` (${d.source})` : ''}`}
                style={{
                  height: 26, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'flex-end',
                }}
              >
                <div style={{
                  width: '100%', height: `${pct}%`,
                  background: d.steps >= doel && doel > 0 ? '#10b981' : 'rgba(255,255,255,0.45)',
                }} />
              </div>
              <div style={{
                marginTop: 2, fontSize: '0.52rem', fontWeight: 800,
                color: i === dagen.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
                textTransform: 'uppercase',
              }}>
                {d.dag}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const knop = {
  width: 26, height: 26, padding: 0, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 900, lineHeight: 1,
  cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
