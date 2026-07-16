// src/modules/manual-workout-builder/components/DayBuilder.jsx
import { useState } from 'react'
import { Trash2, Copy, Plus, Edit2, ChevronDown, ChevronUp, Dumbbell, Target, Clock, Heart } from 'lucide-react'
import ExerciseVideoEditor from './ExerciseVideoEditor'
import BuilderExerciseCard from './BuilderExerciseCard'

export default function DayBuilder({
  day, dayNumber, isActive, onActivate, onUpdate, onDelete, onDuplicate,
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

  return (
    <div
      onClick={onActivate}
      style={{
        background: isActive ? 'rgba(255,215,0,0.06)' : '#141414',
        borderRadius: '16px',
        border: `1px solid ${isActive ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isActive ? '0 6px 18px rgba(255,215,0,0.18)' : 'none',
        padding: isMobile ? '1rem' : '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)' } }}
      onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = isActive ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.12)' } }}
    >
      {/* Oranje accentlijn links wanneer actief — zoals de workout-cards */}
      {isActive && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, #FFD700 0%, #D4AF37 100%)', boxShadow: '2px 0 8px rgba(255,215,0,0.4)' }} />
      )}

      {/* Day badge */}
      <div style={{ position: 'absolute', top: '-10px', left: '16px', background: isActive ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)' : '#1e1e1e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', color: isActive ? '#000' : '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        DAG {dayNumber}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: collapsed ? 0 : '1rem' }}>
        <div style={{ flex: 1 }}>

          {/* Name */}
          {editingName ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Bijv: PUSH A, LEGS..." autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName() }} />
              <button onClick={handleSaveName} style={{ padding: '0.5rem', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '8px', color: '#FFD700', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✓</button>
              <button onClick={handleCancelName} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '700', color: day.name ? '#fff' : 'rgba(255,255,255,0.3)', margin: 0, flex: 1 }}>
                {day.name || 'Klik om naam in te voeren...'}
              </h3>
              <button onClick={(e) => { e.stopPropagation(); setEditingName(true); setTempName(day.name) }} style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Edit2 size={16} />
              </button>
            </div>
          )}

          {/* Focus */}
          {editingFocus ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <Target size={14} color="rgba(255,255,255,0.5)" />
              <input type="text" value={tempFocus} onChange={(e) => setTempFocus(e.target.value)} placeholder="Bijv: chest, shoulders, triceps" autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '6px', padding: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.8rem' : '0.85rem', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFocus(); if (e.key === 'Escape') handleCancelFocus() }} />
              <button onClick={handleSaveFocus} style={{ padding: '0.4rem', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '6px', color: '#FFD700', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✓</button>
              <button onClick={handleCancelFocus} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Target size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: day.focus ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)', flex: 1 }}>
                {day.focus || 'Klik om spiergroepen toe te voegen...'}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setEditingFocus(true); setTempFocus(day.focus) }} style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Dumbbell size={12} />{day.exercises.length} oefeningen</span>
            <span>{totalVolume} sets</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} />{day.geschatteTijd}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}>
            {collapsed ? <ChevronDown size={20} color="rgba(255,255,255,0.5)" /> : <ChevronUp size={20} color="rgba(255,255,255,0.5)" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}>
            <Copy size={18} color="rgba(255,255,255,0.45)" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Weet je zeker dat je deze dag wilt verwijderen?')) onDelete() }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}>
            <Trash2 size={18} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Exercises */}
      {!collapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', marginBottom: '1rem', maxHeight: '460px', overflowY: 'auto', paddingRight: day.exercises.length > 4 ? '0.5rem' : 0 }}>
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

          {/* Add Exercise + Add Cardio */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={(e) => { e.stopPropagation(); onAddExercise() }}
              style={{ flex: 1, padding: '0.75rem', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.08)'}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={18} />Oefening
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAddCardio && onAddCardio() }}
              style={{ flex: 1, padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <Heart size={16} />Cardio
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
