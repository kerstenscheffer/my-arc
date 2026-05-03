// src/modules/manual-workout-builder/components/DayBuilder.jsx
import { useState } from 'react'
import { Trash2, Copy, Plus, Edit2, ChevronDown, ChevronUp, X, GripVertical, Dumbbell, Target, Clock } from 'lucide-react'
import { ATTACHMENTS } from '../../workout/constants/attachments'

export default function DayBuilder({
  day, dayNumber, isActive, onActivate, onUpdate, onDelete, onDuplicate,
  onAddExercise, onUpdateExercise, onDeleteExercise, isMobile
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [tempName, setTempName] = useState(day.name)
  const [tempFocus, setTempFocus] = useState(day.focus)
  const [collapsed, setCollapsed] = useState(false)

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
        background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)' : 'rgba(17,17,17,0.8)',
        backdropFilter: 'blur(20px)', borderRadius: '16px',
        border: isActive ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
        padding: isMobile ? '1rem' : '1.25rem', cursor: 'pointer', transition: 'all 0.3s ease',
        position: 'relative', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => { if (!isActive && !isMobile) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)' }}
      onMouseLeave={(e) => { if (!isActive && !isMobile) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Day badge */}
      <div style={{ position: 'absolute', top: '-10px', left: '16px', background: isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        DAG {dayNumber}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: collapsed ? 0 : '1rem' }}>
        <div style={{ flex: 1 }}>

          {/* Name */}
          {editingName ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Bijv: PUSH A, LEGS..." autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelName() }} />
              <button onClick={handleSaveName} style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✓</button>
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
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.8rem' : '0.85rem', outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFocus(); if (e.key === 'Escape') handleCancelFocus() }} />
              <button onClick={handleSaveFocus} style={{ padding: '0.4rem', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✓</button>
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
              <div key={exercise.id} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Grip */}
                <div style={{ cursor: 'grab', padding: '0.25rem', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  <GripVertical size={14} />
                </div>

                {/* Naam + inline inputs */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#fff', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exercise.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <input type="number" min={1} max={20} value={exercise.sets || 3}
                      onChange={(e) => handleExerciseField(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                      style={{ ...inputStyle, width: '36px' }} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>sets</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>×</span>
                    <input type="text" value={exercise.reps || '10'}
                      onChange={(e) => handleExerciseField(exercise.id, 'reps', e.target.value)}
                      style={{ ...inputStyle, width: '44px' }} onClick={(e) => e.stopPropagation()} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>reps</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', margin: '0 0.1rem' }}>·</span>
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
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <Plus size={18} />Oefening Toevoegen
          </button>
        </>
      )}
    </div>
  )
}
