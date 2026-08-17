// src/modules/manual-workout-builder/components/BuilderExerciseCard.jsx
// Compacte oefening-kaart in de builder: foto + naam + read-only stats +
// één "Bewerken"-knop. Alle bewerking (sets/reps/rust/RIR/apparaat/notitie,
// of cardio-velden) gebeurt in een groter modal — zo blijft de pagina rustig.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Video, Trash2, ChevronUp, ChevronDown, Dumbbell, Pencil, X } from 'lucide-react'
import useExerciseImage from '../hooks/useExerciseImage'

const CARDIO_PRESETS = [
  'Wandelen', 'Hardlopen', 'Fietsen', 'Zwemmen', 'Roeien', 'Crosstrainer', 'HIIT',
  'Steady State Cardio', 'Spinning', 'Stairmaster', 'Skippen', 'Boksen',
  'Wandelen op helling', 'Sprints', 'Zwemmen (baantjes)', 'Fietsen (buiten)',
  'Hometrainer', 'Airbike', 'SkiErg', 'Roeien (interval)', 'Zone 2 Cardio',
]
const CARDIO_INTENSITIES = ['Rustig', 'Matig', 'Intensief']
// Volledige apparaten-lijst voor de dropdown — vrije tekst blijft ook mogelijk
// (bv. "Kettlebell 16 kg"). Gegroepeerd van vrij → machines.
const EQUIPMENT_OPTIONS = [
  'Bodyweight', 'Dumbbell', 'Barbell', 'Kettlebell', 'EZ-bar', 'Trap bar',
  'Weerstandsband', 'Kabel', 'Smith machine', 'Machine (algemeen)',
  'Leg press', 'Hack squat', 'Leg extension', 'Leg curl', 'Calf raise machine',
  'Chest press machine', 'Pec deck', 'Shoulder press machine',
  'Lat pulldown', 'Seated row', 'Assisted pull-up machine',
  'Hip thrust machine', 'Glute kickback machine', 'Preacher curl',
  'Pull-up bar', 'Dip station', 'Halterbank', 'Gewichtsschijf', 'Medicine ball',
  'TRX / suspension', 'Verzwaringsvest',
]

export default function BuilderExerciseCard({
  exercise, index, total, isMobile, db, client, onField, onMove, onDelete, onVideo,
}) {
  const { imageUrl, loadingImage, hasVideo } = useExerciseImage(exercise, db, client)
  const photoSize = isMobile ? 52 : 62
  const hasVid = hasVideo || !!exercise.video_url
  const isCardio = exercise.type === 'cardio'
  const [editing, setEditing] = useState(false)

  const stop = (e) => e.stopPropagation()
  const ctrlBtn = (color, bg = 'transparent', border = 'none') => ({
    background: bg, border, borderRadius: 8, cursor: 'pointer', padding: 0, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, touchAction: 'manipulation', flexShrink: 0,
  })

  // Read-only samenvatting van de stats.
  const statText = isCardio
    ? [exercise.duration, exercise.distance, exercise.intensity].filter(Boolean).join(' · ') || 'Cardio'
    : `${exercise.sets ?? 3} × ${exercise.reps ?? '10'}  ·  ${exercise.rust ?? exercise.rest ?? '90s'} rust`

  return (
    <div onClick={stop} style={{
      background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
      overflow: 'hidden', display: 'flex', alignItems: 'stretch', flexShrink: 0, minWidth: 0,
    }}>
      {hasVid && <div style={{ width: 2, background: 'linear-gradient(180deg, transparent, rgba(255,215,0,0.5), transparent)', flexShrink: 0 }} />}

      {/* Foto — tik om video te koppelen */}
      <div onClick={(e) => { stop(e); onVideo() }} style={{
        width: photoSize, flexShrink: 0, position: 'relative', overflow: 'hidden',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 1 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
        {loadingImage && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'mwb-spin 0.7s linear infinite' }} />
          </div>
        )}
        <div style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 4, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{index + 1}</span>
        </div>
        {hasVid && !loadingImage && (
          <div style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="6" height="6" viewBox="0 0 10 10" fill="rgba(0,0,0,0.85)"><polygon points="2,1 9,5 2,9" /></svg>
          </div>
        )}
      </div>

      {/* Info — read-only */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.55rem' : '0.45rem 0.7rem', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? '0.86rem' : '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em', minWidth: 0 }}>
            {exercise.name || (isCardio ? 'Cardio' : 'Oefening')}
          </span>
          {(exercise.primairSpieren || exercise.muscle || isCardio) && (
            <span style={{ flexShrink: 0, fontSize: '0.5rem', fontWeight: 900, color: '#000', background: isCardio ? '#f87171' : '#FFD700', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {isCardio ? 'Cardio' : (exercise.primairSpieren || exercise.muscle)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{statText}</span>
          {!isCardio && exercise.equipment && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 5, padding: '1px 6px' }}>
              <Dumbbell size={10} /> {exercise.equipment}
            </span>
          )}
        </div>
      </div>

      {/* Volgorde — dun kolommetje */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
        <button onClick={(e) => { stop(e); onMove('up') }} disabled={index === 0}
          style={{ ...ctrlBtn('rgba(255,255,255,0.55)'), width: 24, height: 22, opacity: index === 0 ? 0.2 : 0.6, cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
          <ChevronUp size={15} />
        </button>
        <button onClick={(e) => { stop(e); onMove('down') }} disabled={index === total - 1}
          style={{ ...ctrlBtn('rgba(255,255,255,0.55)'), width: 24, height: 22, opacity: index === total - 1 ? 0.2 : 0.6, cursor: index === total - 1 ? 'not-allowed' : 'pointer' }}>
          <ChevronDown size={15} />
        </button>
      </div>

      {/* Bewerken + verwijderen */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, flexShrink: 0, padding: '0 8px 0 4px' }}>
        <button onClick={(e) => { stop(e); setEditing(true) }} title="Bewerken"
          style={ctrlBtn('#FFD700', 'rgba(255,215,0,0.12)', '1px solid rgba(255,215,0,0.35)')}>
          <Pencil size={14} />
        </button>
        <button onClick={(e) => { stop(e); onDelete() }} title="Verwijder oefening"
          style={ctrlBtn('#ef4444', 'rgba(239,68,68,0.1)', '1px solid rgba(239,68,68,0.25)')}>
          <Trash2 size={14} />
        </button>
      </div>

      {editing && (
        <ExerciseEditModal
          exercise={exercise} isCardio={isCardio} isMobile={isMobile}
          hasVid={hasVid} onField={onField} onVideo={onVideo}
          onClose={() => setEditing(false)}
        />
      )}

      <style>{`@keyframes mwb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Bewerk-modal ────────────────────────────────────────────────────────────
function ExerciseEditModal({ exercise, isCardio, isMobile, hasVid, onField, onVideo, onClose }) {
  const [cardioMenu, setCardioMenu] = useState(false)
  const label = { fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5, display: 'block' }
  const input = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 600, padding: '0.55rem 0.7rem', outline: 'none', fontFamily: 'inherit' }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: isMobile ? '92vh' : '88vh', display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,215,0,0.22)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? 'calc(0.8rem + env(safe-area-inset-top)) 0.9rem 0.7rem' : '0.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {exercise.name || (isCardio ? 'Cardio' : 'Oefening')} bewerken
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          {isCardio ? (
            <>
              <div style={{ position: 'relative' }}>
                <label style={label}>Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={exercise.name ?? ''} onChange={(e) => onField('name', e.target.value)} placeholder="Cardio type" style={input} />
                  <button onClick={() => setCardioMenu(o => !o)} style={{ flexShrink: 0, width: 42, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronDown size={16} style={{ transform: cardioMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>
                </div>
                {cardioMenu && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 5, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: 220, overflowY: 'auto' }}>
                    {CARDIO_PRESETS.map(p => (
                      <button key={p} onClick={() => { onField('name', p); setCardioMenu(false) }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.55rem 0.7rem', background: exercise.name === p ? 'rgba(248,113,113,0.12)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: exercise.name === p ? '#f87171' : 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>{p}</button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={label}>Duur</label><input value={exercise.duration ?? ''} onChange={(e) => onField('duration', e.target.value)} placeholder="20 min" style={input} /></div>
                <div><label style={label}>Afstand</label><input value={exercise.distance ?? ''} onChange={(e) => onField('distance', e.target.value)} placeholder="5 km" style={input} /></div>
              </div>
              <div><label style={label}>Intensiteit</label>
                <select value={exercise.intensity ?? 'Matig'} onChange={(e) => onField('intensity', e.target.value)} style={{ ...input, cursor: 'pointer', appearance: 'auto' }}>
                  {CARDIO_INTENSITIES.map(i => <option key={i} value={i} style={{ background: '#1a1a1a' }}>{i}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem' }}>
                <div><label style={label}>Sets</label><input type="number" min={1} max={30} value={exercise.sets ?? 3} onChange={(e) => onField('sets', parseInt(e.target.value) || 1)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
                <div><label style={label}>Reps</label><input value={exercise.reps ?? '10'} onChange={(e) => onField('reps', e.target.value)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
                <div><label style={label}>Rust</label><input value={exercise.rust ?? exercise.rest ?? '90s'} onChange={(e) => onField('rust', e.target.value)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
                <div><label style={label}>RIR</label><input value={exercise.rpe ?? ''} onChange={(e) => onField('rpe', e.target.value)} placeholder="7-8" style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
              </div>

              <div>
                <label style={label}>Apparaat / uitvoering</label>
                {/* Dropdown met alle apparaten/machines — kies er een; het veld
                    eronder blijft vrij te typen voor specifieks (bv. gewicht). */}
                <select value="" onChange={(e) => { if (e.target.value) onField('equipment', e.target.value) }}
                  style={{ ...input, cursor: 'pointer', appearance: 'auto', color: 'rgba(255,255,255,0.85)' }}>
                  <option value="" style={{ background: '#1a1a1a' }}>Kies apparaat / machine…</option>
                  {EQUIPMENT_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#1a1a1a' }}>{o}</option>)}
                </select>
                <input value={exercise.equipment ?? ''} onChange={(e) => onField('equipment', e.target.value)} placeholder='Gekozen apparaat — of typ vrij, bv. "Smith machine" / "Kettlebell 16 kg"' style={{ ...input, marginTop: 8 }} />
              </div>

              <div><label style={label}>Notitie</label>
                <textarea value={exercise.notes ?? ''} onChange={(e) => onField('notes', e.target.value)} placeholder="Coach-notitie / techniek-tip…" rows={3} style={{ ...input, resize: 'vertical', lineHeight: 1.45 }} />
              </div>
            </>
          )}

          {/* Video koppelen */}
          <button onClick={() => { onVideo(); onClose() }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '0.7rem', borderRadius: 10, background: hasVid ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hasVid ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.12)'}`, color: hasVid ? '#FFD700' : 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
            <Video size={15} /> {hasVid ? 'Video bewerken' : 'Video koppelen'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: isMobile ? '0.75rem 1rem calc(0.9rem + env(safe-area-inset-bottom))' : '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '0.7rem', borderRadius: 10, background: 'rgba(255,215,0,0.16)', border: '1px solid rgba(255,215,0,0.4)', color: '#FFD700', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>Klaar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
