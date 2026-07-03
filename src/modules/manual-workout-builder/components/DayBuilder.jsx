// src/modules/manual-workout-builder/components/DayBuilder.jsx
import { useState } from 'react'
import { Trash2, Copy, Plus, Edit2, ChevronDown, ChevronUp, X, GripVertical, Dumbbell, Target, Clock, Video, Activity } from 'lucide-react'
import { ATTACHMENTS } from '../../workout/constants/attachments'
import ExerciseVideoEditor from './ExerciseVideoEditor'

export default function DayBuilder({
  day, dayNumber, isActive, onActivate, onUpdate, onDelete, onDuplicate,
  onAddExercise, onUpdateExercise, onDeleteExercise, isMobile
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

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '5px',
    color: '#FFD700',
    fontSize: isMobile ? '0.75rem' : '0.8rem',
    fontWeight: '800',
    textAlign: 'center',
    outline: 'none',
    padding: '0.2rem 0.25rem',
    touchAction: 'manipulation'
  }

  return (
    <div
      onClick={onActivate}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(234,88,12,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(23,23,23,0.9) 0%, rgba(10,10,10,0.9) 100%)',
        backdropFilter: 'blur(10px)', borderRadius: '14px',
        border: `1px solid ${isActive ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.1)'}`,
        padding: isMobile ? '1rem' : '1.25rem', cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)' } }}
      onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = isActive ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.1)' } }}
    >
      {/* Oranje accentlijn links wanneer actief — zoals de workout-cards */}
      {isActive && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)', boxShadow: '2px 0 8px rgba(249,115,22,0.3)' }} />
      )}

      {/* Day badge */}
      <div style={{ position: 'absolute', top: '-10px', left: '16px', background: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        DAG {dayNumber}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: collapsed ? 0 : '1rem' }}>
        <div style={{ flex: 1 }}>

          {/* Name */}
          {editingName ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Bijv: PUSH A, LEGS..." autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName() }} />
              <button onClick={handleSaveName} style={{ padding: '0.5rem', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', color: '#f97316', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✓</button>
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
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', padding: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.8rem' : '0.85rem', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFocus(); if (e.key === 'Escape') handleCancelFocus() }} />
              <button onClick={handleSaveFocus} style={{ padding: '0.4rem', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', color: '#f97316', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✓</button>
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
            <Copy size={18} color="rgba(139,92,246,0.7)" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Weet je zeker dat je deze dag wilt verwijderen?')) onDelete() }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}>
            <Trash2 size={18} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Exercises */}
      {!collapsed && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: day.exercises.length > 4 ? '0.5rem' : 0 }}>
            {day.exercises.map((exercise, index) => (
              <div key={exercise.id} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.75rem', background: 'linear-gradient(135deg, rgba(23,23,23,0.9) 0%, rgba(10,10,10,0.9) 100%)', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.1)' }}>

                {/* Genummerde oranje badge — zoals de exercise-card op de workout-pagina */}
                <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                  {index + 1}
                </div>

                {/* Naam + inline inputs */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '0.35rem', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <Target size={12} color="#f97316" style={{ flexShrink: 0 }} />
                    <input type="number" min={1} max={20} value={exercise.sets || 3}
                      onChange={(e) => handleExerciseField(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                      style={{ ...inputStyle, width: '36px' }} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>sets</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>×</span>
                    <Activity size={12} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <input type="text" value={exercise.reps || '10'}
                      onChange={(e) => handleExerciseField(exercise.id, 'reps', e.target.value)}
                      style={{ ...inputStyle, width: '44px' }} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>reps</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', margin: '0 0.1rem' }}>·</span>
                    <Clock size={12} color="#10b981" style={{ flexShrink: 0 }} />
                    <input type="text" value={exercise.rust || exercise.rest || '90s'}
                      onChange={(e) => handleExerciseField(exercise.id, 'rust', e.target.value)}
                      style={{ ...inputStyle, width: '44px', color: 'rgba(255,255,255,0.45)' }} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600' }}>rust</span>
                  </div>

                  {/* Suggested attachment */}
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} onClick={(e) => e.stopPropagation()}>
                    {(() => { const att = ATTACHMENTS.find(a => a.id === exercise.suggested_attachment); return att ? <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundImage: `url(${att.img})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, opacity: 0.55 }} /> : null })()}
                    <select value={exercise.suggested_attachment || ''} onChange={(e) => handleExerciseField(exercise.id, 'suggested_attachment', e.target.value || null)}
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)', color: exercise.suggested_attachment ? 'rgba(255,215,0,0.55)' : 'rgba(255,255,255,0.2)', fontSize: '0.6rem', fontWeight: '600', outline: 'none', cursor: 'pointer', padding: '0.1rem 0', maxWidth: '140px' }}>
                      <option value="">+ Materiaal aanbevelen</option>
                      {ATTACHMENTS.map(a => <option key={a.id} value={a.id}>{a.nl}</option>)}
                    </select>
                  </div>
                </div>

                {/* Volgorde knoppen */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'up') }} disabled={index === 0}
                    style={{ background: 'transparent', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.25 : 0.6, padding: '0.1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', lineHeight: 1, minWidth: '20px', minHeight: '20px' }}>▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'down') }} disabled={index === day.exercises.length - 1}
                    style={{ background: 'transparent', border: 'none', cursor: index === day.exercises.length - 1 ? 'not-allowed' : 'pointer', opacity: index === day.exercises.length - 1 ? 0.25 : 0.6, padding: '0.1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', lineHeight: 1, minWidth: '20px', minHeight: '20px' }}>▼</button>
                </div>

                {/* Video editor — paste URL + thumbnail; lights up red when set. */}
                <button
                  onClick={(e) => { e.stopPropagation(); setVideoEditing(exercise) }}
                  title={exercise.video_url ? 'Video bewerken' : 'Video toevoegen'}
                  style={{
                    padding: '0.4rem',
                    background: exercise.video_url ? 'rgba(239,68,68,0.12)' : 'rgba(255,215,0,0.08)',
                    border: `1px solid ${exercise.video_url ? 'rgba(239,68,68,0.4)' : 'rgba(255,215,0,0.25)'}`,
                    borderRadius: 6,
                    color: exercise.video_url ? '#ef4444' : 'rgba(255,215,0,0.7)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 30, minWidth: 30, flexShrink: 0, touchAction: 'manipulation',
                  }}
                >
                  <Video size={13} />
                </button>

                {/* Delete */}
                <button onClick={(e) => { e.stopPropagation(); onDeleteExercise(exercise.id) }}
                  style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px', minWidth: '30px', flexShrink: 0, touchAction: 'manipulation' }}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {day.exercises.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                Nog geen oefeningen toegevoegd
              </div>
            )}
          </div>

          {/* Add Exercise */}
          <button onClick={(e) => { e.stopPropagation(); onAddExercise() }}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', color: '#f97316', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={18} />Oefening Toevoegen
          </button>
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
