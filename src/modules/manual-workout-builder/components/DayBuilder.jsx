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
  
  // Save handlers from v1 (working)
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
  
  // Move exercise up/down
  const moveExercise = (index, direction) => {
    const newExercises = [...day.exercises]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newExercises.length) return
    
    [newExercises[index], newExercises[newIndex]] = 
    [newExercises[newIndex], newExercises[index]]
    
    onUpdate({ ...day, exercises: newExercises })
  }
  
  // Calculate stats
  const totalVolume = day.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
  
  return (
    <div 
      onClick={onActivate}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: isActive 
          ? '2px solid rgba(16, 185, 129, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        padding: isMobile ? '1rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isMobile) {
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isMobile) {
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
        }
      }}
    >
      {/* Day number badge */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '16px',
        background: isActive 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}>
        DAG {dayNumber}
      </div>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: collapsed ? 0 : '1rem'
      }}>
        <div style={{ flex: 1 }}>
          {/* Name editing */}
          {editingName ? (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.5rem'
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
                  border: '1px solid rgba(16, 185, 129, 0.3)',
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
              <button
                onClick={handleSaveName}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  cursor: 'pointer',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
              >
                ✓
              </button>
              <button
                onClick={handleCancelName}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: day.name ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                margin: 0,
                flex: 1
              }}>
                {day.name || 'Klik om naam in te voeren...'}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingName(true)
                  setTempName(day.name)
                }}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
          
          {/* Focus editing */}
          {editingFocus ? (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }} onClick={(e) => e.stopPropagation()}>
              <Target size={14} color="rgba(255, 255, 255, 0.5)" />
              <input
                type="text"
                value={tempFocus}
                onChange={(e) => setTempFocus(e.target.value)}
                placeholder="Bijv: chest, shoulders, triceps"
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveFocus()
                  if (e.key === 'Escape') handleCancelFocus()
                }}
              />
              <button
                onClick={handleSaveFocus}
                style={{
                  padding: '0.4rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  minWidth: '28px',
                  minHeight: '28px'
                }}
              >
                ✓
              </button>
              <button
                onClick={handleCancelFocus}
                style={{
                  padding: '0.4rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  minWidth: '28px',
                  minHeight: '28px'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <Target size={14} color="rgba(255, 255, 255, 0.5)" />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: day.focus ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                flex: 1
              }}>
                {day.focus || 'Klik om spiergroepen toe te voegen...'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingFocus(true)
                  setTempFocus(day.focus)
                }}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Dumbbell size={12} />
              {day.exercises.length} oefeningen
            </span>
            <span>{totalVolume} sets</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              {day.geschatteTijd}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(!collapsed)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            {collapsed ? (
              <ChevronDown size={20} color="rgba(255, 255, 255, 0.5)" />
            ) : (
              <ChevronUp size={20} color="rgba(255, 255, 255, 0.5)" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <Copy size={18} color="rgba(139, 92, 246, 0.7)" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Weet je zeker dat je deze dag wilt verwijderen?')) {
                onDelete()
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            <Trash2 size={18} color="#ef4444" />
          </button>
        </div>
      </div>
      
      {/* Exercises List */}
      {!collapsed && (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '1rem',
            marginBottom: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: day.exercises.length > 4 ? '0.5rem' : 0
          }}>
            {day.exercises.map((exercise, index) => (
              <div key={exercise.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {/* Drag handle */}
                <div style={{
                  cursor: 'grab',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(255, 255, 255, 0.3)'
                }}>
                  <GripVertical size={16} />
                </div>
                
                {/* Exercise info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {exercise.name}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {exercise.sets}×{exercise.reps} • {exercise.rest || '90s'} rust
                  </div>
                </div>
                
                {/* Move buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveExercise(index, 'up')
                    }}
                    disabled={index === 0}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      opacity: index === 0 ? 0.3 : 1,
                      padding: '0.125rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveExercise(index, 'down')
                    }}
                    disabled={index === day.exercises.length - 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: index === day.exercises.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: index === day.exercises.length - 1 ? 0.3 : 1,
                      padding: '0.125rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    ▼
                  </button>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteExercise(exercise.id)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '32px',
                    minWidth: '32px'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {day.exercises.length === 0 && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                Nog geen oefeningen toegevoegd
              </div>
            )}
          </div>
          
          {/* Add Exercise Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddExercise()
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Plus size={18} />
            Oefening Toevoegen
          </button>
        </>
      )}
    </div>
  )
}
