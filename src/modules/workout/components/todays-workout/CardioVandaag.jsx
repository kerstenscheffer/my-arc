// src/modules/workout/components/todays-workout/CardioVandaag.jsx
//
// Cardio van de gekozen dag bovenaan de workout-pagina, naast (of in plaats
// van) de training. Stond eerder alleen als tegel in het weekrooster, zodat
// een dag met alleen hardlopen bovenaan "Geen workout gepland" liet zien
// (8 okt 2026). Dezelfde bron als het rooster: client_agenda_blocks met
// label "Cardio · <soort>" en de logs uit CardioService.

import { Check, HeartPulse, ChevronRight } from 'lucide-react'
import { cardioFoto } from '../../utils/workoutFoto'

const logCardio = (c) => {
  window.dispatchEvent(new CustomEvent('myarc:cardio-log', { detail: { soort: c.soort, minuten: c.duur, datum: c.datum } }))
  if (navigator.vibrate) navigator.vibrate(15)
}

// `volledig` = als kop van de pagina (foto met titel), wanneer er geen
// training is. Anders een compacte kaart onder de trainingskaart.
export default function CardioVandaag({ lijst, isMobile, volledig = false }) {
  if (!lijst?.length) return null

  if (volledig) {
    const c = lijst[0]
    return (
      <div style={{ position: 'relative', width: '100%', height: isMobile ? 200 : 250 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cardioFoto(c.soort)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0) 32%, rgba(10,10,10,0.78) 70%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: isMobile ? 10 : 14, padding: isMobile ? '0 1rem' : '0 1.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.gedaan ? '#10b981' : 'rgba(255,255,255,0.7)', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
              {c.gedaan ? '✓ Gedaan' : 'Cardio'}
            </div>
            <div style={{ fontSize: isMobile ? '1.7rem' : '2.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {c.soort}
            </div>
            <div style={{ marginTop: 4, fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
              {[c.tijd, c.duur ? `${c.duur} min` : null].filter(Boolean).join(' · ')}
              {lijst.length > 1 && ` · +${lijst.length - 1} meer`}
            </div>
          </div>
          {!c.gedaan && (
            <button onClick={() => logCardio(c)} style={{
              flexShrink: 0, minHeight: 44, padding: '0 1.1rem', borderRadius: 999, border: 'none',
              background: '#fff', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              Loggen <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', marginTop: isMobile ? 10 : 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lijst.map(c => (
        <div key={c.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 8, borderRadius: 14,
          background: c.gedaan ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${c.gedaan ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.12)'}`,
        }}>
          <div style={{ width: isMobile ? 60 : 72, height: isMobile ? 60 : 72, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${cardioFoto(c.soort)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.gedaan ? '#10b981' : 'rgba(255,255,255,0.55)' }}>
              {c.gedaan ? <Check size={11} strokeWidth={3.5} /> : <HeartPulse size={11} strokeWidth={2.6} />} {c.gedaan ? 'Gedaan' : 'Cardio'}
            </div>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.soort}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {[c.tijd, c.duur ? `${c.duur} min` : null].filter(Boolean).join(' · ')}
            </div>
          </div>
          {!c.gedaan && (
            <button onClick={() => logCardio(c)} aria-label={`${c.soort} loggen`} style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: '#fff', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
