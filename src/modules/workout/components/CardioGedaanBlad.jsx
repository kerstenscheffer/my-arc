// src/modules/workout/components/CardioGedaanBlad.jsx
//
// Tik op een cardiotegel die op Gedaan staat: wat is er gelogd? Grote
// cijfers (minuten, kcal, zwaarte, km) en de mogelijkheid de log weg te
// halen als die per ongeluk was.

import { useState } from 'react'
import { Trash2, Watch } from 'lucide-react'
import BladModal from './todays-workout/components/BladModal'
import { cardioFoto } from '../utils/workoutFoto'
import CardioService from '../services/CardioService'

const ZWAARTE = { rustig: 'Rustig', gemiddeld: 'Gemiddeld', pittig: 'Pittig', vol_gas: 'Vol gas' }
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function CardioGedaanBlad({ log, soort, gepland, db, isMobile, onClose, onVerwijderd }) {
  const [bezig, setBezig] = useState(false)
  if (!log) return null
  const datum = log.logged_date ? new Date(String(log.logged_date).slice(0, 10) + 'T12:00:00') : null
  const tijd = log.created_at ? new Date(log.created_at) : null
  const sport = log.cardio_type || soort || 'Cardio'
  const cijfers = [
    { waarde: log.duration_minutes || 0, label: 'minuten', sub: gepland ? `gepland ${gepland}` : null },
    { waarde: log.calories ? nl(log.calories) : '–', label: 'kcal', sub: log.calories ? (log.calories_source === 'horloge' ? 'horloge' : 'schatting') : null },
    { waarde: ZWAARTE[log.intensity] || '–', label: 'zwaarte', sub: null },
    ...(log.distance_km ? [{ waarde: String(log.distance_km).replace('.', ','), label: 'km', sub: null }] : []),
  ]

  const verwijder = async () => {
    if (bezig) return
    setBezig(true)
    try {
      const ok = await CardioService.deleteLog(log.id, db)
      if (!ok) throw new Error('niet verwijderd')
      if (navigator.vibrate) navigator.vibrate(25)
      onVerwijderd?.()
      onClose()
    } catch (e) { alert('Verwijderen mislukt: ' + (e?.message || 'onbekende fout')) }
    finally { setBezig(false) }
  }

  return (
    <BladModal open titel={sport} onClose={onClose} zIndex={10600}>
      <div style={{ position: 'relative', height: isMobile ? 120 : 150, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cardioFoto(sport)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.85) 100%)' }} />
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gedaan</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
            {datum ? datum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}{tijd ? ` · gelogd om ${tijd.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cijfers.length}, 1fr)`, gap: 8, marginBottom: 14 }}>
        {cijfers.map(c => (
          <div key={c.label} style={{ textAlign: 'center', padding: '0.7rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.waarde}</div>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{c.label}</div>
            {c.sub && <div style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{c.sub === 'horloge' && <Watch size={9} />}{c.sub}</div>}
          </div>
        ))}
      </div>

      {log.notes && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.4 }}>{log.notes}</div>}

      <button onClick={verwijder} disabled={bezig} style={{
        width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)',
        fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <Trash2 size={14} strokeWidth={2.6} /> {bezig ? 'Bezig…' : 'Log verwijderen'}
      </button>
    </BladModal>
  )
}
