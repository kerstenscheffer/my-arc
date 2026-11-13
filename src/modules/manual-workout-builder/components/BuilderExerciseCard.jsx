// src/modules/manual-workout-builder/components/BuilderExerciseCard.jsx
// Compacte oefening-kaart in de builder: foto + naam + read-only stats +
// één "Bewerken"-knop. Alle bewerking (sets/reps/rust/RIR/apparaat/notitie,
// of cardio-velden) gebeurt in een groter modal — zo blijft de pagina rustig.
import { useState, useEffect } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import { Video, Trash2, ChevronDown, Dumbbell, Pencil, X, GripVertical, ArrowLeftRight, Zap } from 'lucide-react'
import useExerciseImage from '../hooks/useExerciseImage'
import OefeningThumb from '../../workout/components/OefeningThumb'
import { LABEL as SPIER_LABEL, KEUZE as SPIER_KEUZE, spierVan } from '../spierGroepen'
import { KOPPEN, kopVan } from '../koppen'

// Module-level cache — one DB query per session, shared across all exercise cards
const _equipCache = { data: null, promise: null }

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
  exercise, index, isMobile, db, client, greep, onField, onDelete, onVideo, onSwap, geselecteerd = false,
  // Zelfde vorm als de maaltijdkaart in de Plan Analyzer: foto links met het
  // nummer, naam en sets rechts, en een knoppenrij eronder.
  kaartStijl = false,
  // Alle dagen naast elkaar (10 nov 2026): kleine letters, smalle knoppenrij.
  compact = false,
}) {
  const { imageUrls, loadingImage, hasVideo } = useExerciseImage(exercise, db, client)
  const photoSize = isMobile ? 64 : 76
  const hasVid = hasVideo || !!exercise.video_url
  const isCardio = exercise.type === 'cardio'
  const [editing, setEditing] = useState(false)
  const [coachEquip, setCoachEquip] = useState(_equipCache.data ?? [])

  useEffect(() => {
    if (_equipCache.data) { setCoachEquip(_equipCache.data); return }
    if (!_equipCache.promise) {
      _equipCache.promise = db.supabase
        .from('custom_exercises').select('equipment').is('client_id', null)
        .then(({ data }) => {
          const opts = [...new Set((data ?? []).map(r => r.equipment).filter(Boolean))]
          _equipCache.data = opts
          return opts
        })
    }
    _equipCache.promise.then(opts => setCoachEquip(opts))
  }, [db])

  const stop = (e) => e.stopPropagation()
  const ctrlBtn = (color, bg = 'transparent', border = 'none') => ({
    background: bg, border, borderRadius: 8, cursor: 'pointer', padding: 0, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, touchAction: 'manipulation', flexShrink: 0,
  })

  // Read-only samenvatting van de stats.
  const statText = isCardio
    ? [exercise.duration, exercise.distance, exercise.intensity].filter(Boolean).join(' · ') || 'Cardio'
    : `${exercise.sets ?? 2} × ${exercise.reps ?? '8-12'}  ·  ${exercise.rust ?? exercise.rest ?? '2 min'} rust`

  if (compact) {
    const DIV = 'rgba(255,255,255,0.06)'
    const actie = (kleur) => ({
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0.3rem 0.3rem',
      background: 'transparent', border: 'none', color: kleur || 'rgba(255,255,255,0.7)', fontSize: '0.66rem', fontWeight: 800,
      cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    })
    return (
      // Herschikken alleen via het greepje: de rest van de kaart is voor
      // selecteren door te slepen (ManualWorkoutBuilder, alle dagen).
      <div onClick={stop} style={{
        margin: '0 0.6rem', minWidth: 0, overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none',
        background: geselecteerd ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${geselecteerd ? '#fff' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, padding: 5 }}>
          <div data-geen-sleep onClick={(e) => { stop(e); onVideo() }} title={hasVid ? 'Video bekijken' : 'Video koppelen'} style={{
            width: 38, height: 38, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: 7, background: '#1a1a1a', cursor: 'pointer',
          }}>
            <OefeningThumb bronnen={imageUrls} naam={exercise.name} compact style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)' }} />
            <span style={{ position: 'absolute', left: 4, bottom: 2, fontSize: '0.62rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{index + 1}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ minWidth: 0, fontSize: '0.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {exercise.name || (isCardio ? 'Cardio' : 'Oefening')}
              </span>
              {exercise.power && <span style={{ flexShrink: 0, fontSize: '0.52rem', fontWeight: 900, color: '#000', background: '#fff', padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>Power</span>}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>
              {isCardio ? statText : <><b style={{ color: '#fff', fontWeight: 800 }}>{exercise.sets ?? 2}</b> × {exercise.reps ?? '8-12'} · {exercise.rust ?? exercise.rest ?? '2 min'}</>}
            </div>
          </div>
          <div {...greep} data-greep title="Slepen om te verplaatsen" style={{ ...greep?.style, width: 20, alignSelf: 'stretch', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <GripVertical size={14} strokeWidth={2.4} />
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: `1px solid ${DIV}` }}>
          <button onClick={(e) => { stop(e); onVideo() }} title={hasVid ? 'Video' : 'Video koppelen'} style={actie()}><Video size={14} /></button>
          <div style={{ width: 1, background: DIV }} />
          <button onClick={(e) => { stop(e); setEditing(true) }} title="Bewerken" style={actie()}><Pencil size={13} /></button>
          <div style={{ width: 1, background: DIV }} />
          {onSwap && <>
            <button onClick={(e) => { stop(e); onSwap() }} title="Wisselen" style={actie()}><ArrowLeftRight size={13} /></button>
            <div style={{ width: 1, background: DIV }} />
          </>}
          <button onClick={(e) => { stop(e); onDelete() }} title="Verwijderen" style={actie('#ef4444')}><Trash2 size={13} /></button>
        </div>
        {editing && (
          <ExerciseEditModal
            exercise={exercise} isCardio={isCardio} isMobile={isMobile}
            hasVid={hasVid} onField={onField} onVideo={onVideo}
            coachEquip={coachEquip}
            onClose={() => setEditing(false)}
          />
        )}
      </div>
    )
  }

  if (kaartStijl) {
    const m = isMobile
    // Twee regels tekst: de foto hoeft niet hoger dan dat.
    const foto = m ? 60 : 66
    const DIV = 'rgba(255,255,255,0.06)'
    const actie = (kleur) => ({
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: m ? '0.4rem 0.3rem' : '0.45rem 0.4rem', background: 'transparent', border: 'none',
      color: kleur || 'rgba(255,255,255,0.75)', fontSize: m ? '0.7rem' : '0.74rem', fontWeight: 800,
      cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    })
    return (
      <div {...greep} onClick={stop} style={{
        ...greep?.style,
        margin: m ? '0 0.5rem' : '0 0.75rem',
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
          {/* Foto: tik = video bekijken of koppelen. */}
          <div data-geen-sleep onClick={(e) => { stop(e); onVideo() }} title={hasVid ? 'Video bekijken' : 'Video koppelen'} style={{
            width: foto, height: foto, flexShrink: 0, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#1a1a1a',
          }}>
            <OefeningThumb bronnen={imageUrls} naam={exercise.name} compact style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)' }} />
            {loadingImage && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'mwb-spin 0.7s linear infinite' }} />
              </div>
            )}
            <span style={{ position: 'absolute', left: 6, bottom: 5, fontSize: '0.72rem', fontWeight: 900, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{index + 1}</span>
            {hasVid && !loadingImage && (
              <span style={{ position: 'absolute', right: 5, bottom: 5, width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#000"><polygon points="2,1 9,5 2,9" /></svg>
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: m ? '0.4rem 0.65rem' : '0.45rem 0.85rem' }}>
            {/* Spiergroep en apparaat achter de naam, niet op een eigen regel:
                zo blijft de kaart twee regels hoog. */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ flexShrink: 1, minWidth: 0, fontSize: m ? '0.95rem' : '1.02rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {exercise.name || (isCardio ? 'Cardio' : 'Oefening')}
              </span>
              {exercise.power && <span style={{ flexShrink: 0, alignSelf: 'center', fontSize: '0.52rem', fontWeight: 900, color: '#000', background: '#fff', padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>Power</span>}
              {(exercise.primairSpieren || exercise.muscle || (!isCardio && exercise.equipment)) && (
                <span style={{ flexShrink: 100, minWidth: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>
                  {[exercise.primairSpieren || exercise.muscle, !isCardio && exercise.equipment].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
              {isCardio ? (
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{statText}</span>
              ) : (<>
                {[{ v: exercise.sets ?? 2, l: 'sets' }, { v: exercise.reps ?? '8-12', l: 'reps' }, { v: exercise.rust ?? exercise.rest ?? '2 min', l: 'rust' }].map(x => (
                  <span key={x.l} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>{x.v}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{x.l}</span>
                  </span>
                ))}
              </>)}
            </div>
          </div>

          {/* De hele kaart is de greep; dit is alleen de hint. */}
          <div aria-hidden style={{ width: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)' }}>
            <GripVertical size={16} strokeWidth={2.4} />
          </div>
        </div>

        <div style={{ display: 'flex', borderTop: `1px solid ${DIV}` }}>
          <button onClick={(e) => { stop(e); onVideo() }} style={actie()}><Video size={m ? 13 : 14} /> {hasVid ? 'Video' : 'Video +'}</button>
          <div style={{ width: 1, background: DIV }} />
          <button onClick={(e) => { stop(e); setEditing(true) }} style={actie()}><Pencil size={m ? 13 : 14} /> Edit</button>
          <div style={{ width: 1, background: DIV }} />
          <button onClick={(e) => { stop(e); onDelete() }} style={actie('#ef4444')}><Trash2 size={m ? 13 : 14} /> Wis</button>
        </div>

        {editing && (
          <ExerciseEditModal
            exercise={exercise} isCardio={isCardio} isMobile={isMobile}
            hasVid={hasVid} onField={onField} onVideo={onVideo}
            coachEquip={coachEquip}
            onClose={() => setEditing(false)}
          />
        )}
        <style>{`@keyframes mwb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      {...greep}
      onClick={stop}
      style={{
        ...greep?.style,
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
        overflow: 'hidden', display: 'flex', alignItems: 'stretch', flexShrink: 0, minWidth: 0,
      }}
    >

      {/* Foto — tik om video te koppelen */}
      <div data-geen-sleep onClick={(e) => { stop(e); onVideo() }} style={{
        width: photoSize, flexShrink: 0, position: 'relative', overflow: 'hidden',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <OefeningThumb bronnen={imageUrls} naam={exercise.name} compact={photoSize < 70} style={{ position: 'absolute', inset: 0, background: 'transparent' }} />
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
          <div style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="6" height="6" viewBox="0 0 10 10" fill="rgba(0,0,0,0.85)"><polygon points="2,1 9,5 2,9" /></svg>
          </div>
        )}
      </div>

      {/* Info — read-only */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.4rem 0.55rem' : '0.45rem 0.7rem', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? '0.92rem' : '0.98rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.015em', minWidth: 0 }}>
            {exercise.name || (isCardio ? 'Cardio' : 'Oefening')}
          </span>
          {(exercise.primairSpieren || exercise.muscle || isCardio) && (
            <span style={{ flexShrink: 0, fontSize: '0.52rem', fontWeight: 900, color: isCardio ? '#f87171' : 'rgba(255,255,255,0.7)', background: 'transparent', border: `1px solid ${isCardio ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.22)'}`, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {isCardio ? 'Cardio' : (exercise.primairSpieren || exercise.muscle)}
            </span>
          )}
          {exercise.power && (
            <span style={{ flexShrink: 0, fontSize: '0.52rem', fontWeight: 900, color: '#000', background: '#fff', padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1.2 }}>Power</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{statText}</span>
          {!isCardio && exercise.equipment && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 5, padding: '1px 6px' }}>
              <Dumbbell size={10} /> {exercise.equipment}
            </span>
          )}
        </div>
      </div>

      {/* Hint dat de kaart te verslepen is; de hele kaart is de greep. */}
      <div aria-hidden style={{ width: 22, alignSelf: 'stretch', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.28)' }}>
        <GripVertical size={16} strokeWidth={2.4} />
      </div>

      {/* Bewerken + verwijderen */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, flexShrink: 0, padding: '0 8px 0 4px' }}>
        <button onClick={(e) => { stop(e); setEditing(true) }} title="Bewerken"
          style={ctrlBtn('#fff', 'transparent', '1px solid rgba(255,255,255,0.2)')}>
          <Pencil size={14} />
        </button>
        <button onClick={(e) => { stop(e); onDelete() }} title="Verwijder oefening"
          style={ctrlBtn('rgba(255,255,255,0.55)', 'transparent', '1px solid rgba(255,255,255,0.14)')}>
          <Trash2 size={14} />
        </button>
      </div>

      {editing && (
        <ExerciseEditModal
          exercise={exercise} isCardio={isCardio} isMobile={isMobile}
          hasVid={hasVid} onField={onField} onVideo={onVideo}
          coachEquip={coachEquip}
          onClose={() => setEditing(false)}
        />
      )}

      <style>{`@keyframes mwb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Bewerk-modal ────────────────────────────────────────────────────────────
// coachEquip = de zelf toegevoegde apparaten uit custom_exercises. Die state
// leeft in BuilderExerciseCard en moet hier expliciet naar binnen: de datalist
// hieronder gebruikte 'm, maar hij stond niet in scope → ReferenceError zodra
// je een oefening opende. Default op [] zodat de datalist ook werkt voordat de
// lijst geladen is.
function ExerciseEditModal({ exercise, isCardio, isMobile, hasVid, onField, onVideo, onClose, coachEquip = [] }) {
  const modalHost = useModalHost()
  const [cardioMenu, setCardioMenu] = useState(false)
  const label = { fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5, display: 'block' }
  const input = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 600, padding: '0.55rem 0.7rem', outline: 'none', fontFamily: 'inherit' }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: isMobile ? '92vh' : '88vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
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
              {/* Naam en spiergroep zelf aanpassen (10 nov 2026): de bibliotheek
                  zet soms de verkeerde spier (Calf extension stond op Chest). */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1.6, minWidth: 0 }}>
                  <label style={label}>Naam</label>
                  <input value={exercise.name ?? ''} onChange={(e) => onField('name', e.target.value)} placeholder="Naam van de oefening" style={input} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={label}>Spiergroep</label>
                  <select value={spierVan(exercise) === 'onbekend' ? '' : spierVan(exercise)} onChange={(e) => onField('primairSpieren', e.target.value)}
                    style={{ ...input, colorScheme: 'dark', cursor: 'pointer' }}>
                    <option value="">Kies…</option>
                    {SPIER_KEUZE.map(k => <option key={k} value={k}>{SPIER_LABEL[k]}</option>)}
                    {spierVan(exercise) !== 'onbekend' && !SPIER_KEUZE.includes(spierVan(exercise)) && <option value={spierVan(exercise)}>{spierVan(exercise)}</option>}
                  </select>
                </div>
              </div>
              {/* Kop / deel binnen de spiergroep: automatisch uit de naam, of vastzetten. */}
              {KOPPEN[spierVan(exercise)] && (
                <div>
                  <label style={label}>Kop / deel</label>
                  <select value={exercise.kop || ''} onChange={(e) => onField('kop', e.target.value || null)} style={{ ...input, colorScheme: 'dark', cursor: 'pointer' }}>
                    <option value="">Automatisch{kopVan({ ...exercise, kop: null }) ? ` (${KOPPEN[spierVan(exercise)].koppen.find(([k]) => k === kopVan({ ...exercise, kop: null }))?.[1]})` : ' (beide koppen)'}</option>
                    {KOPPEN[spierVan(exercise)].koppen.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem' }}>
                <div><label style={label}>Sets</label><input type="number" min={1} max={30} value={exercise.sets ?? 3} onChange={(e) => onField('sets', parseInt(e.target.value) || 1)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
                <div><label style={label}>Reps</label><input value={exercise.reps ?? '10'} onChange={(e) => onField('reps', e.target.value)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
                <div><label style={label}>Rust</label><input value={exercise.rust ?? exercise.rest ?? '2 min'} onChange={(e) => onField('rust', e.target.value)} style={{ ...input, textAlign: 'center', padding: '0.55rem 0.3rem' }} /></div>
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
                <datalist id="bec-equipment-list">
                  {[...new Set([...EQUIPMENT_OPTIONS, ...coachEquip])].map(o => <option key={o} value={o} />)}
                </datalist>
                <input value={exercise.equipment ?? ''} onChange={(e) => onField('equipment', e.target.value)} placeholder='Gekozen apparaat — of typ vrij, bv. "Smith machine" / "Kettlebell 16 kg"' list="bec-equipment-list" style={{ ...input, marginTop: 8 }} />
              </div>

              {/* Power (13 nov 2026): eigen blok en eigen log bij de klant. */}
              <button type="button" onClick={() => { const aan = !exercise.power; onField('power', aan); if (aan) onField('reps', '2-4') }} aria-pressed={!!exercise.power} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.6rem 0.75rem', textAlign: 'left',
                background: exercise.power ? '#fff' : 'transparent', color: exercise.power ? '#000' : '#fff',
                border: `1px solid ${exercise.power ? '#fff' : 'rgba(255,255,255,0.18)'}`, borderRadius: 10,
                fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation',
              }}>
                <Zap size={16} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900 }}>Power-oefening</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, opacity: 0.65 }}>Komt bij de klant in het blok Power: 30 tot 50% van zijn max, 2 tot 4 snelle herhalingen, snelheid per set gelogd</span>
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>{exercise.power ? 'Aan' : 'Uit'}</span>
              </button>

              <div><label style={label}>{exercise.power ? 'Instructie voor de klant' : 'Notitie'}</label>
                <textarea value={exercise.notes ?? ''} onChange={(e) => onField('notes', e.target.value)} placeholder={exercise.power ? 'Bv. "Spring zo hoog als je kan, land zacht, reset tussen elke herhaling"' : 'Coach-notitie / techniek-tip…'} rows={3} style={{ ...input, resize: 'vertical', lineHeight: 1.45 }} />
              </div>
            </>
          )}

          {/* Video koppelen */}
          <button onClick={() => { onVideo(); onClose() }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '0.7rem', borderRadius: 10, background: hasVid ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hasVid ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`, color: '#fff', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>
            <Video size={15} /> {hasVid ? 'Video bewerken' : 'Video koppelen'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: isMobile ? '0.75rem 1rem calc(0.9rem + env(safe-area-inset-bottom))' : '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '0.7rem', borderRadius: 10, background: '#fff', border: '1px solid #fff', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}>Klaar</button>
        </div>
      </div>
    </div>,
    modalHost
  )
}
