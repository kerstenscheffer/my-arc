// src/modules/manual-workout-builder/components/DayBuilder.jsx
import { useState } from 'react'
import { Trash2, Copy, Plus, Edit2, ChevronDown, ChevronUp, Dumbbell, Target, Clock, Heart, BookmarkPlus } from 'lucide-react'
import ExerciseVideoEditor from './ExerciseVideoEditor'
import BuilderExerciseCard from './BuilderExerciseCard'

export default function DayBuilder({
  day, dayNumber, isActive, onActivate, onUpdate, onDelete, onDuplicate, onSaveTemplate,
  onAddExercise, onAddCardio, onUpdateExercise, onDeleteExercise, isMobile, db, client
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [tempName, setTempName] = useState(day.name)
  const [tempFocus, setTempFocus] = useState(day.focus)
  const [collapsed, setCollapsed] = useState(false)
  // Which exercise's video is being edited via the popup modal. Tracks
  // the whole exercise object so the modal can show name + current
  // video_url / thumbnail_url without an extra fetch.
  const [videoEditing, setVideoEditing] = useState(null)

  const handleSaveName = () => { onUpdate({ ...day, name: tempName || `Dag ${dayNumber}` }); setEditingName(false) }
  const handleSaveFocus = () => { onUpdate({ ...day, focus: tempFocus || '' }); setEditingFocus(false) }
  const handleCancelName = () => { setTempName(day.name); setEditingName(false) }
  const handleCancelFocus = () => { setTempFocus(day.focus); setEditingFocus(false) }

  const moveExercise = (index, direction) => {
    const newExercises = [...day.exercises]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newExercises.length) return
    ;[newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]]
    onUpdate({ ...day, exercises: newExercises })
  }

  const handleExerciseField = (exerciseId, field, value) => {
    const updated = day.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex)
    onUpdate({ ...day, exercises: updated })
  }

  const totalVolume = day.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)

  // Compacte icon-knop (leadsysteem-stijl) voor de dag-acties.
  const iconBtn = {
    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div
      onClick={onActivate}
      style={{
        // Actief = rustig/clean (bold wit accent), niet goud.
        background: isActive ? 'rgba(255,255,255,0.05)' : '#141414',
        borderRadius: '16px',
        border: `1px solid ${isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: 'none',
        padding: isMobile ? '1rem' : '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
      onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.borderColor = isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)' } }}
    >
      {/* Witte accentlijn links wanneer actief */}
      {isActive && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#fff' }} />
      )}

      {/* ═══ Header — compact, max 2 regels (leadsysteem-stijl) ═══ */}
      <div style={{ marginBottom: collapsed ? 0 : '0.85rem' }}>

        {/* Regel 1: dagnr + naam + spiergroep · acties */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          {/* Dagnummer */}
          <span style={{ flexShrink: 0, minWidth: 24, height: 24, padding: '0 6px', borderRadius: 6, background: isActive ? '#fff' : 'rgba(255,255,255,0.08)', color: isActive ? '#000' : 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dayNumber}</span>

          {/* Naam — tap-to-edit */}
          {editingName ? (
            <input value={tempName} autoFocus onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName() }}
              placeholder="PUSH A, LEGS…"
              style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '0.3rem 0.5rem', color: '#fff', fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, outline: 'none' }} />
          ) : (
            <span onClick={(e) => { e.stopPropagation(); setEditingName(true); setTempName(day.name) }}
              style={{ flex: 1, minWidth: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: day.name ? '#fff' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', letterSpacing: '-0.01em' }}>
              {day.name || 'Naam…'}
            </span>
          )}

          {/* Spiergroep-pill — tap-to-edit */}
          {editingFocus ? (
            <input value={tempFocus} autoFocus onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTempFocus(e.target.value)} onBlur={handleSaveFocus}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFocus(); if (e.key === 'Escape') handleCancelFocus() }}
              placeholder="chest, triceps…"
              style={{ flexShrink: 1, minWidth: 0, maxWidth: 130, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '0.25rem 0.45rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', fontWeight: 700, outline: 'none' }} />
          ) : (
            <span onClick={(e) => { e.stopPropagation(); setEditingFocus(true); setTempFocus(day.focus) }} title="Spiergroep"
              style={{ flexShrink: 0, maxWidth: isMobile ? 90 : 150, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase', color: day.focus ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '0.2rem 0.45rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
              {day.focus || 'Spiergroep'}
            </span>
          )}

          {/* Acties — compacte icon-knoppen */}
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }} style={iconBtn}>
              {collapsed ? <ChevronDown size={16} color="rgba(255,255,255,0.55)" /> : <ChevronUp size={16} color="rgba(255,255,255,0.55)" />}
            </button>
            {onSaveTemplate && (
              <button onClick={(e) => { e.stopPropagation(); onSaveTemplate() }} title="Bewaar als dag-template" style={iconBtn}>
                <BookmarkPlus size={15} color="#FFD700" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} title="Dupliceren" style={iconBtn}>
              <Copy size={15} color="rgba(255,255,255,0.45)" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (confirm('Weet je zeker dat je deze dag wilt verwijderen?')) onDelete() }} title="Verwijderen" style={iconBtn}>
              <Trash2 size={15} color="#ef4444" />
            </button>
          </div>
        </div>

        {/* Regel 2: flush stat-bar (oefeningen · sets · minuten) */}
        {!collapsed && (
          <div style={{ display: 'flex', marginTop: '0.7rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { v: day.exercises.length, l: 'Oefeningen' },
              { v: totalVolume, l: 'Sets' },
              { v: parseInt(day.geschatteTijd) || 60, l: 'Min' },
            ].map((s, i) => (
              <div key={s.l} style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.5rem 0.4rem' : '0.55rem 0.6rem', borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercises */}
      {!collapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', marginBottom: '1rem', maxHeight: isMobile ? '400px' : '440px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingRight: day.exercises.length > 5 ? '0.4rem' : 0 }}>
            {day.exercises.map((exercise, index) => (
              <BuilderExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                total={day.exercises.length}
                isMobile={isMobile}
                db={db}
                client={client}
                onField={(field, value) => handleExerciseField(exercise.id, field, value)}
                onMove={(dir) => moveExercise(index, dir)}
                onDelete={() => onDeleteExercise(exercise.id)}
                onVideo={() => setVideoEditing(exercise)}
              />
            ))}

            {day.exercises.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                Nog geen oefeningen toegevoegd
              </div>
            )}
          </div>

          {/* Add Exercise + Add Cardio — rustige leadsysteem-knoppen */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={(e) => { e.stopPropagation(); onAddExercise() }}
              style={{ flex: 1, padding: '0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '42px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
              <Plus size={16} color="#FFD700" />Oefening
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAddCardio && onAddCardio() }}
              style={{ flex: 1, padding: '0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '42px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
              <Heart size={15} color="#f87171" />Cardio
            </button>
          </div>
        </>
      )}

      {/* Exercise video editor — pops up when the coach taps the video
          button on any exercise row. Writes directly to the exercises
          table; the client workout view already shows a play button when
          video_url is set so no other wiring is needed. */}
      <ExerciseVideoEditor
        isOpen={!!videoEditing}
        exercise={videoEditing}
        isMobile={isMobile}
        onClose={() => setVideoEditing(null)}
        onSaved={(updated) => {
          // Reflect locally on the row so the icon turns red without a
          // full reload of the parent state.
          if (onUpdateExercise) {
            onUpdateExercise(updated.id, {
              video_url: updated.video_url,
              thumbnail_url: updated.thumbnail_url,
            })
          }
        }}
      />
    </div>
  )
}
