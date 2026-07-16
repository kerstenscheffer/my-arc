// src/modules/manual-workout-builder/components/BuilderExerciseCard.jsx
// Oefening-kaart in de builder — visueel identiek aan de client-workout-kaart
// (foto + nummerbadge + naam + spiergroep-badge + sets/reps), maar met
// coach-bewerking: sets/reps/rust aanpasbaar, materiaal-suggestie, volgorde,
// video koppelen en verwijderen.
import { Video, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import useExerciseImage from '../hooks/useExerciseImage'

// Snelkeuzes voor cardio (zelfde set als de client-side CardioLogSection).
const CARDIO_PRESETS = ['Wandelen', 'Hardlopen', 'Fietsen', 'Zwemmen', 'Roeien', 'Crosstrainer', 'HIIT']
const CARDIO_INTENSITIES = ['Rustig', 'Matig', 'Intensief']

export default function BuilderExerciseCard({
  exercise, index, total, isMobile, db, client, onField, onMove, onDelete, onVideo,
}) {
  const { imageUrl, loadingImage, hasVideo } = useExerciseImage(exercise, db, client)
  const photoSize = isMobile ? 64 : 76
  const hasVid = hasVideo || !!exercise.video_url

  const statInput = {
    width: 30, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#FFD700', fontSize: '0.72rem', fontWeight: 800,
    textAlign: 'center', outline: 'none', padding: '2px 1px', touchAction: 'manipulation',
    fontVariantNumeric: 'tabular-nums',
  }
  const statLbl = { fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.03em' }
  const ctrlBtn = (color) => ({ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, minHeight: 30, touchAction: 'manipulation' })

  const stop = (e) => e.stopPropagation()

  return (
    <div onClick={stop} style={{
      background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Gouden lijn bovenaan wanneer er een video gekoppeld is */}
      {hasVid && <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)' }} />}

      {/* Hoofdrij: foto + info + volgorde */}
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>

        {/* Foto — tik om video te koppelen/bewerken */}
        <div onClick={(e) => { stop(e); onVideo() }} style={{
          width: photoSize, height: photoSize, flexShrink: 0, position: 'relative',
          overflow: 'hidden', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.6 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
          {loadingImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'mwb-spin 0.7s linear infinite' }} />
            </div>
          )}

          {/* Nummerbadge linksboven */}
          <div style={{ position: 'absolute', top: 4, left: 4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{index + 1}</span>
          </div>

          {/* Play-badge rechtsonder wanneer er video is */}
          {hasVid && !loadingImage && (
            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
              <svg width="6" height="6" viewBox="0 0 10 10" fill="rgba(0,0,0,0.85)"><polygon points="2,1 9,5 2,9" /></svg>
            </div>
          )}
        </div>

        {/* Info-kolom */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.8rem', gap: 6 }}>
          {exercise.type === 'cardio' ? (
            <>
              {/* Cardio-naam met snelkeuze-presets (datalist = presets + vrij typen) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <input list="mwb-cardio-presets" value={exercise.name ?? ''} onClick={stop}
                  onChange={(e) => onField('name', e.target.value)} placeholder="Cardio type"
                  style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 800, padding: '3px 6px', outline: 'none' }} />
                <datalist id="mwb-cardio-presets">
                  {CARDIO_PRESETS.map(p => <option key={p} value={p} />)}
                </datalist>
                <span style={{ flexShrink: 0, fontSize: isMobile ? '0.52rem' : '0.55rem', fontWeight: 900, color: '#000', background: '#f87171', padding: '2px 7px', borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                  Cardio
                </span>
              </div>

              {/* Duur / afstand / intensiteit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="text" value={exercise.duration ?? ''} onClick={stop} placeholder="20 min"
                    onChange={(e) => onField('duration', e.target.value)} style={{ ...statInput, width: 48, color: '#fff' }} />
                  <span style={statLbl}>duur</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="text" value={exercise.distance ?? ''} onClick={stop} placeholder="5 km"
                    onChange={(e) => onField('distance', e.target.value)} style={{ ...statInput, width: 42, color: 'rgba(255,255,255,0.6)' }} />
                  <span style={statLbl}>afst.</span>
                </div>
                <select value={exercise.intensity ?? 'Matig'} onClick={stop}
                  onChange={(e) => onField('intensity', e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#f87171', fontSize: '0.6rem', fontWeight: 800, padding: '3px 4px', outline: 'none', cursor: 'pointer' }}>
                  {CARDIO_INTENSITIES.map(i => <option key={i} value={i} style={{ background: '#141414' }}>{i}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Naam + spiergroep-badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em', minWidth: 0 }}>
                  {exercise.name}
                </span>
                {(exercise.primairSpieren || exercise.muscle) && (
                  <span style={{ flexShrink: 0, fontSize: isMobile ? '0.52rem' : '0.55rem', fontWeight: 900, color: '#000', background: '#FFD700', padding: '2px 7px', borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                    {exercise.primairSpieren || exercise.muscle}
                  </span>
                )}
              </div>

              {/* Bewerkbare sets / reps / rust — compact */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="number" min={1} max={20} value={exercise.sets ?? 3} onClick={stop}
                    onChange={(e) => onField('sets', parseInt(e.target.value) || 1)} style={statInput} />
                  <span style={statLbl}>sets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="text" value={exercise.reps ?? '10'} onClick={stop}
                    onChange={(e) => onField('reps', e.target.value)} style={{ ...statInput, width: 38 }} />
                  <span style={statLbl}>reps</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <input type="text" value={exercise.rust ?? exercise.rest ?? '90s'} onClick={stop}
                    onChange={(e) => onField('rust', e.target.value)} style={{ ...statInput, width: 40, color: 'rgba(255,255,255,0.6)' }} />
                  <span style={statLbl}>rust</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Volgorde */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, flexShrink: 0 }}>
          <button onClick={(e) => { stop(e); onMove('up') }} disabled={index === 0}
            style={{ ...ctrlBtn('rgba(255,255,255,0.6)'), opacity: index === 0 ? 0.2 : 0.6, minHeight: 24, cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
            <ChevronUp size={16} />
          </button>
          <button onClick={(e) => { stop(e); onMove('down') }} disabled={index === total - 1}
            style={{ ...ctrlBtn('rgba(255,255,255,0.6)'), opacity: index === total - 1 ? 0.2 : 0.6, minHeight: 24, cursor: index === total - 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Video koppelen + verwijderen */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, flexShrink: 0, padding: '0 8px 0 4px' }}>
          <button onClick={(e) => { stop(e); onVideo() }} title={hasVid ? 'Video bewerken' : 'Video toevoegen'}
            style={ctrlBtn(hasVid ? '#FFD700' : 'rgba(255,255,255,0.5)')}>
            <Video size={16} />
          </button>
          <button onClick={(e) => { stop(e); onDelete() }} title="Verwijder oefening"
            style={{ ...ctrlBtn('#ef4444'), background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <style>{`@keyframes mwb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
