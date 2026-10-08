// src/modules/manual-workout-builder/components/KlantCardioOverzicht.jsx
//
// Cardio van de klant, compact in het hoofdgebied van de Workout Builder.
// Cardio is ook een workout: een klant zonder krachtplan maar mét hardlopen
// en CrossFit (Martijn, 8 okt 2026) toonde alleen "Nog geen dagen". Zelfde
// bron als het weekrooster en de Cardio-knop: client_agenda_blocks.

import { useEffect, useState } from 'react'
import { Heart, Plus } from 'lucide-react'
import CardioService from '../../workout/services/CardioService'
import { DAGEN_WEEK } from '../../workout/cardioSoorten'
import { cardioFoto } from '../../workout/utils/workoutFoto'

const DAG_VOLGORDE = DAGEN_WEEK.map(d => d.id)
const kort = (dag) => DAGEN_WEEK.find(d => d.id === dag)?.kort || dag
const fmtWeek = (iso) => { try { return new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return iso } }

export default function KlantCardioOverzicht({ client, db, isMobile = false, refreshKey = 0, onOpen }) {
  const [blokken, setBlokken] = useState([])

  useEffect(() => {
    if (!client?.id) { setBlokken([]); return }
    let weg = false
    const laad = async () => {
      const lijst = await CardioService.getBlokken(client.id, db, CardioService.maandagIso())
      if (!weg) setBlokken(lijst.sort((a, b) => DAG_VOLGORDE.indexOf(a.day) - DAG_VOLGORDE.indexOf(b.day) || String(a.tijd).localeCompare(String(b.tijd))))
    }
    laad()
    window.addEventListener('myarc:cardio-changed', laad)
    return () => { weg = true; window.removeEventListener('myarc:cardio-changed', laad) }
  }, [client?.id, db, refreshKey])

  if (!client?.id || blokken.length === 0) return null

  const vast = blokken.filter(b => !b.week_start)
  const eenmalig = blokken.filter(b => !!b.week_start)
  const perSoort = [...new Set(vast.map(b => b.soort))].map(s => ({ soort: s, blokken: vast.filter(b => b.soort === s) }))

  const Regel = ({ soort, sub, dagen, extra }) => (
    <button onClick={onOpen} title="Cardio aanpassen" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#fff', width: '100%', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 8, backgroundImage: `url(${cardioFoto(soort)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{soort}</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{sub}{extra ? <span style={{ color: '#06b6d4', fontWeight: 800 }}> · {extra}</span> : null}</div>
      </div>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: isMobile ? 120 : 200 }}>
        {dagen.map((d, i) => (
          <span key={i} style={{ padding: '2px 7px', borderRadius: 6, background: '#fff', color: '#000', fontSize: '0.64rem', fontWeight: 900 }}>{d}</span>
        ))}
      </div>
    </button>
  )

  return (
    <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <Heart size={11} strokeWidth={2.8} /> Cardio van {client.first_name || 'de klant'}
        </div>
        <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: '2px 4px', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900, color: '#fff', cursor: 'pointer', touchAction: 'manipulation' }}>
          <Plus size={12} strokeWidth={3} /> Inplannen
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
        {perSoort.map(g => (
          <Regel key={g.soort} soort={g.soort}
            sub={[g.blokken[0]?.tijd, g.blokken[0]?.duur ? `${g.blokken[0].duur} min` : null, 'elke week'].filter(Boolean).join(' · ')}
            dagen={g.blokken.map(b => kort(b.day))} />
        ))}
        {eenmalig.map(b => (
          <Regel key={b.id} soort={b.soort}
            sub={[b.tijd, b.duur ? `${b.duur} min` : null].filter(Boolean).join(' · ')}
            extra={`week van ${fmtWeek(b.week_start)}`}
            dagen={[kort(b.day)]} />
        ))}
      </div>
    </div>
  )
}
