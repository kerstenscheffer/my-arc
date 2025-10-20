// src/modules/manual-workout-builder/components/ExerciseCard.jsx
import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react'

export default function ExerciseCard({ 
  exercise, 
  index,
  totalExercises,
  onUpdate, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isMobile 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    sets: exercise.sets,
    reps: exercise.reps,
    rust: exercise.rust,
    rpe: exercise.rpe,
    notes: exercise.notes || ''
  })
  
  const saveEdits = () => {
    onUpdate(editData)
    setIsEditing(false)
  }
  
  const cancelEdits = () => {
    setEditData({
      sets: exercise.sets,
      reps: exercise.reps,
      rust: exercise.rust,
      rpe: exercise.rpe,
      notes: exercise.notes || ''
    })
    setIsEditing(false)
  }
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: isMobile ? '0.75rem' : '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'all 0.3s ease'
    }}>
      {/* Order Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp()
          }}
          disabled={index === 0}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            opacity: index === 0 ? 0.3 : 1,
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '30px',
            minWidth: '30px'
          }}
        >
          <ChevronUp size={16} color="rgba(255, 255, 255, 0.5)" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown()
          }}
          disabled={index === totalExercises - 1}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: index === totalExercises - 1 ? 'not-allowed' : 'pointer',
            opacity: index === totalExercises - 1 ? 0.3 : 1,
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '30px',
            minWidth: '30px'
          }}
        >
          <ChevronDown size={16} color="rgba(255, 255, 255, 0.5)" />
        </button>
      </div>
      
      {/* Exercise Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '600',
            minWidth: '20px'
          }}>
            {index + 1}.
          </span>
          
          <h4 style={{
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            margin: 0,
            flex: 1
          }}>
            {exercise.name}
          </h4>
          
          {exercise.equipment && (
            <span style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              color: '#8b5cf6',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '500'
            }}>
              {exercise.equipment}
            </span>
          )}
        </div>
        
        {isEditing ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <div>
              <label style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                display: 'block',
                marginBottom: '0.25rem'
              }}>
                Sets
              </label>
              <input
                type="number"
                value={editData.sets}
                onChange={(e) => setEditData({ ...editData, sets: parseInt(e.target.value) || 0 })}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                display: 'block',
                marginBottom: '0.25rem'
              }}>
                Reps
              </label>
              <input
                type="text"
                value={editData.reps}
                onChange={(e) => setEditData({ ...editData, reps: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="8-12"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                display: 'block',
                marginBottom: '0.25rem'
              }}>
                Rust
              </label>
              <input
                type="text"
                value={editData.rust}
                onChange={(e) => setEditData({ ...editData, rust: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="2 min"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
                display: 'block',
                marginBottom: '0.25rem'
              }}>
                RPE
              </label>
              <input
                type="text"
                value={editData.rpe}
                onChange={(e) => setEditData({ ...editData, rpe: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="7-8"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '1rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <span>
              <strong style={{ color: '#10b981' }}>{exercise.sets}</strong> sets
            </span>
            <span>
              <strong style={{ color: '#10b981' }}>{exercise.reps}</strong> reps
            </span>
            <span>
              <strong style={{ color: '#10b981' }}>{exercise.rust}</strong> rust
            </span>
            <span>
              RPE <strong style={{ color: '#10b981' }}>{exercise.rpe}</strong>
            </span>
          </div>
        )}
        
        {isEditing && (
          <div style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Notes..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}
            />
          </div>
        )}
        
        {!isEditing && exercise.notes && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            margin: '0.5rem 0 0 0',
            fontStyle: 'italic'
          }}>
            {exercise.notes}
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.25rem'
      }}>
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                saveEdits()
              }}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '36px',
                minWidth: '36px'
              }}
            >
              <Check size={16} color="#10b981" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                cancelEdits()
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '36px',
                minWidth: '36px'
              }}
            >
              <X size={16} color="rgba(255, 255, 255, 0.5)" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
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
                minHeight: '36px',
                minWidth: '36px'
              }}
            >
              <Edit2 size={16} color="rgba(255, 255, 255, 0.5)" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
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
                minHeight: '36px',
                minWidth: '36px'
              }}
            >
              <Trash2 size={16} color="#ef4444" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
