// src/modules/manual-workout-builder/components/BuilderExerciseCard.jsx
// Oefening-kaart in de builder — visueel identiek aan de client-workout-kaart
// (foto + nummerbadge + naam + spiergroep-badge + sets/reps), maar met
// coach-bewerking: sets/reps/rust aanpasbaar, materiaal-suggestie, volgorde,
// video koppelen en verwijderen.
import { Video, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { ATTACHMENTS } from '../../workout/constants/attachments'
import useExerciseImage from '../hooks/useExerciseImage'

export default function BuilderExerciseCard({
  exercise, index, total, isMobile, db, client, onField, onMove, onDelete, onVideo,
}) {
  const { imageUrl, loadingImage, hasVideo } = useExerciseImage(exercise, db, client)
  const photoSize = isMobile ? 64 : 76
  const hasVid = hasVideo || !!exercise.video_url

  const statInput = {
    width: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7, color: '#FFD700', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800,
    textAlign: 'center', outline: 'none', padding: '3px 2px', touchAction: 'manipulation',
    fontVariantNumeric: 'tabular-nums',
  }
  const statLbl = { fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }

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

          {/* Bewerkbare sets / reps / rust */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="number" min={1} max={20} value={exercise.sets ?? 3} onClick={stop}
                onChange={(e) => onField('sets', parseInt(e.target.value) || 1)} style={statInput} />
              <span style={statLbl}>sets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="text" value={exercise.reps ?? '10'} onClick={stop}
                onChange={(e) => onField('reps', e.target.value)} style={{ ...statInput, width: 48 }} />
              <span style={statLbl}>reps</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="text" value={exercise.rust ?? exercise.rest ?? '90s'} onClick={stop}
                onChange={(e) => onField('rust', e.target.value)} style={{ ...statInput, width: 48, color: 'rgba(255,255,255,0.6)' }} />
              <span style={statLbl}>rust</span>
            </div>
          </div>

          {/* Materiaal-suggestie */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={stop}>
            {(() => { const att = ATTACHMENTS.find(a => a.id === exercise.suggested_attachment); return att ? <div style={{ width: 15, height: 15, borderRadius: 3, backgroundImage: `url(${att.img})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, opacity: 0.6 }} /> : null })()}
            <select value={exercise.suggested_attachment || ''} onChange={(e) => onField('suggested_attachment', e.target.value || null)}
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', color: exercise.suggested_attachment ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.28)', fontSize: '0.62rem', fontWeight: 600, outline: 'none', cursor: 'pointer', padding: '2px 0', maxWidth: 150 }}>
              <option value="">+ Materiaal aanbevelen</option>
              {ATTACHMENTS.map(a => <option key={a.id} value={a.id}>{a.nl}</option>)}
            </select>
          </div>
        </div>

        {/* Volgorde */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, flexShrink: 0, paddingRight: 6 }}>
          <button onClick={(e) => { stop(e); onMove('up') }} disabled={index === 0}
            style={{ background: 'transparent', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.2 : 0.55, padding: 2, color: 'rgba(255,255,255,0.7)', display: 'flex', minWidth: 26, minHeight: 26, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronUp size={16} />
          </button>
          <button onClick={(e) => { stop(e); onMove('down') }} disabled={index === total - 1}
            style={{ background: 'transparent', border: 'none', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.2 : 0.55, padding: 2, color: 'rgba(255,255,255,0.7)', display: 'flex', minWidth: 26, minHeight: 26, alignItems: 'center', justifyContent: 'center' }}>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Actie-rij: video koppelen + verwijderen */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={(e) => { stop(e); onVideo() }} style={{
          flex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38,
          background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          color: hasVid ? '#FFD700' : 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
        }}>
          <Video size={13} /> {hasVid ? 'Video ✓' : 'Video'}
        </button>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
        <button onClick={(e) => { stop(e); onDelete() }} style={{
          flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38,
          background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          color: 'rgba(239,68,68,0.75)', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
        }}>
          <Trash2 size={13} /> Verwijder
        </button>
      </div>

      <style>{`@keyframes mwb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
