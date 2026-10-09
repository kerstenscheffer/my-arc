// src/modules/workout/components/week-schedule/TrainingInfoBlad.jsx
//
// Inkijkje in een training die je (nog) niet kunt openen: een komende week
// kun je wel indelen, maar niet loggen. Tik op een tegel toont dan de
// oefeningen met sets, reps en rust, zodat je weet wat er op die dag staat
// (9 okt 2026). Zelfde blad als de historie en het krachtoverzicht.

import BladModal from '../todays-workout/components/BladModal'
import useOefeningFotos from '../../utils/useOefeningFotos'
import { cardioFoto } from '../../utils/workoutFoto'

export default function TrainingInfoBlad({ open, training, db, isMobile, onClose }) {
  const oef = Array.isArray(training?.exercises) ? training.exercises : []
  const fotoVan = useOefeningFotos(db, oef.map(e => e?.name).filter(Boolean))
  if (!open) return null
  const titel = (training?.name || training?.focus || 'Training').trim()
  return (
    <BladModal open={open} titel={titel} onClose={onClose} zIndex={2147483500}>
      <div style={{ padding: isMobile ? '0.75rem 1rem 1.25rem' : '1rem 1.25rem 1.5rem' }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
          {oef.length} {oef.length === 1 ? 'oefening' : 'oefeningen'}{training?.focus && training?.name ? ` · ${training.focus}` : ''}
        </div>
        {oef.length === 0 && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen oefeningen in deze training.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {oef.map((e, i) => (
            <div key={`${e.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${fotoVan(e.name)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.56rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {[e.sets ? `${e.sets} × ${e.reps || '?'}` : null, e.rust ? `${e.rust} rust` : null, e.equipment].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BladModal>
  )
}

// Zelfde inkijkje voor een cardioblok: sport, tijd, duur, en of het elke
// week of eenmalig is.
export function CardioInfoBlad({ open, cardio, isMobile, onClose }) {
  if (!open || !cardio) return null
  const regels = [
    ['Tijd', cardio.tijd || '–'],
    ['Duur', cardio.duur ? `${cardio.duur} min` : '–'],
    ['Herhaling', cardio.eenmalig ? 'Alleen deze week' : 'Elke week'],
  ]
  return (
    <BladModal open={open} titel={cardio.soort || 'Cardio'} onClose={onClose} zIndex={2147483500}>
      <div style={{ padding: isMobile ? '0.75rem 1rem 1.25rem' : '1rem 1.25rem 1.5rem' }}>
        <div style={{ width: '100%', height: isMobile ? 140 : 170, borderRadius: 14, backgroundImage: `url(${cardioFoto(cardio.soort)})`, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {regels.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </BladModal>
  )
}
