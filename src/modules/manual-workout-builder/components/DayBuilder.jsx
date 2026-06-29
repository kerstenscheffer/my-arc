// src/modules/manual-workout-builder/components/DayBuilder.jsx
import { useState } from 'react'
import { Trash2, Copy, Plus, Edit2, ChevronDown, ChevronUp, X, GripVertical, Dumbbell, Target, Clock } from 'lucide-react'

export default function DayBuilder({
  day,
  dayNumber,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  isMobile
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [tempName, setTempName] = useState(day.name)
  const [tempFocus, setTempFocus] = useState(day.focus)
  const [collapsed, setCollapsed] = useState(false)

  const handleSaveName = () => {
    onUpdate({ ...day, name: tempName || `Dag ${dayNumber}` })
    setEditingName(false)
  }

  const handleSaveFocus = () => {
    onUpdate({ ...day, focus: tempFocus || '' })
    setEditingFocus(false)
  }

  const handleCancelName = () => {
    setTempName(day.name)
    setEditingName(false)
  }

  const handleCancelFocus = () => {
    setTempFocus(day.focus)
    setEditingFocus(false)
  }

  const moveExercise = (index, direction) => {
    const newExercises = [...day.exercises]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newExercises.length) return

    ;[newExercises[index], newExercises[newIndex]] =
    [newExercises[newIndex], newExercises[index]]

    onUpdate({ ...day, exercises: newExercises })
  }

  const totalVolume = day.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)

  return (
    <div
      onClick={onActivate}
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '14px',
        border: `1px solid ${isActive ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
        padding: isMobile ? '1rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(4px)'
          e.currentTarget.style.borderColor = isActive
            ? 'rgba(249, 115, 22, 0.5)'
            : 'rgba(255, 255, 255, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateX(0)'
          e.currentTarget.style.borderColor = isActive
            ? 'rgba(249, 115, 22, 0.3)'
            : 'rgba(255, 255, 255, 0.08)'
        }
      }}
    >
      {/* Left accent bar */}
      {isActive && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
          boxShadow: '2px 0 8px rgba(249, 115, 22, 0.3)'
        }} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        paddingLeft: isActive ? '0.5rem' : 0,
        marginBottom: collapsed ? 0 : '1rem'
      }}>
        {/* Icon container with day number */}
        <div style={{
          width: isMobile ? '42px' : '48px',
          height: isMobile ? '42px' : '48px',
          borderRadius: '12px',
          background: isActive
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{
            color: isActive ? '#f97316' : 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '800'
          }}>
            {dayNumber}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* DAG label */}
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: isActive ? '#f97316' : 'rgba(255, 255, 255, 0.4)',
            marginBottom: '0.2rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            DAG {dayNumber}
            {isActive && (
              <span style={{
                fontSize: '0.6rem',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                padding: '0.1rem 0.35rem',
                borderRadius: '6px',
                fontWeight: '800',
                color: '#fff'
              }}>
                ACTIEF
              </span>
            )}
          </div>

          {/* Name editing */}
          {editingName ? (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.4rem'
            }} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Bijv: PUSH A, LEGS, UPPER BODY..."
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') handleCancelName()
                }}
              />
              <button onClick={handleSaveName} style={{ padding: '0.5rem', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '8px', color: '#f97316', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✓</button>
              <button onClick={handleCancelName} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                color: day.name ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                margin: 0,
                flex: 1
              }}>
                {day.name || 'Klik om naam in te voeren...'}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingName(true); setTempName(day.name) }}
                style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {/* Focus editing */}
          {editingFocus ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
              <Target size={12} color="rgba(255, 255, 255, 0.4)" />
              <input
                type="text"
                value={tempFocus}
                onChange={(e) => setTempFocus(e.target.value)}
                placeholder="Bijv: chest, shoulders, triceps"
                autoFocus
                style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '6px', padding: '0.4rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: isMobile ? '0.8rem' : '0.85rem' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFocus(); if (e.key === 'Escape') handleCancelFocus() }}
              />
              <button onClick={handleSaveFocus} style={{ padding: '0.4rem', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '6px', color: '#f97316', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✓</button>
              <button onClick={handleCancelFocus} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', minWidth: '28px', minHeight: '28px' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Target size={12} color="rgba(255, 255, 255, 0.4)" />
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: day.focus ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', flex: 1 }}>
                {day.focus || 'Klik om spiergroepen toe te voegen...'}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setEditingFocus(true); setTempFocus(day.focus) }} style={{ padding: '0.2rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Edit2 size={12} />
              </button>
            </div>
          )}

          {/* Stats — WorkoutCard style */}
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Dumbbell size={12} />
              {day.exercises.length} oefeningen
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Target size={12} />
              {totalVolume} sets
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              {day.geschatteTijd}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed) }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '36px' }}
          >
            {collapsed ? <ChevronDown size={18} color="rgba(255,255,255,0.4)" /> : <ChevronUp size={18} color="rgba(255,255,255,0.4)" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '36px' }}
          >
            <Copy size={16} color="rgba(139, 92, 246, 0.6)" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Weet je zeker dat je deze dag wilt verwijderen?')) onDelete() }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '36px' }}
          >
            <Trash2 size={16} color="rgba(239, 68, 68, 0.7)" />
          </button>
        </div>
      </div>

      {/* Exercises List */}
      {!collapsed && (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginTop: '0.75rem',
            marginBottom: '0.75rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: day.exercises.length > 4 ? '0.5rem' : 0
          }}>
            {day.exercises.map((exercise, index) => (
              <div key={exercise.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.75rem',
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => { if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
              >
                {/* Subtle left line */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: '2px',
                  background: 'linear-gradient(180deg, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0.1) 100%)'
                }} />

                {/* Drag handle */}
                <div style={{ cursor: 'grab', padding: '0.2rem', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)', paddingLeft: '0.5rem' }}>
                  <GripVertical size={14} />
                </div>

                {/* Exercise info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#fff', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exercise.name}
                  </div>
                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '0.5rem' }}>
                    <span><strong style={{ color: '#f97316' }}>{exercise.sets}</strong> sets</span>
                    <span><strong style={{ color: '#f97316' }}>{exercise.reps}</strong> reps</span>
                    <span>{exercise.rust || '90s'} rust</span>
                  </div>
                </div>

                {/* Move buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'up') }} disabled={index === 0} style={{ background: 'transparent', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.25 : 0.6, padding: '0.1rem', color: 'rgba(255,255,255,0.7)' }}>▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'down') }} disabled={index === day.exercises.length - 1} style={{ background: 'transparent', border: 'none', cursor: index === day.exercises.length - 1 ? 'not-allowed' : 'pointer', opacity: index === day.exercises.length - 1 ? 0.25 : 0.6, padding: '0.1rem', color: 'rgba(255,255,255,0.7)' }}>▼</button>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteExercise(exercise.id) }}
                  style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30px', minWidth: '30px' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {day.exercises.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                Nog geen oefeningen toegevoegd
              </div>
            )}
          </div>

          {/* Add Exercise Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddExercise() }}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.35)'
              }
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Plus size={16} />
            Oefening Toevoegen
          </button>
        </>
      )}
    </div>
  )
}
