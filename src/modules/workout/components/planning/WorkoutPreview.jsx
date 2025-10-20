// src/modules/workout/components/planning/WorkoutPreview.jsx
// PREMIUM STYLING - Visual Workout Info 🔥

import { Target, Dumbbell } from 'lucide-react'

export default function WorkoutPreview({ selectedData, isMobile }) {
  if (!selectedData || selectedData.type !== 'workout') return null
  
  return (
    <div style={{
      marginTop: isMobile ? '0.75rem' : '0.875rem',
      padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)',
      backdropFilter: 'blur(5px)',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      borderRadius: '10px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle left accent */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '30%',
        bottom: '30%',
        width: '2px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(249, 115, 22, 0.5) 50%, transparent 100%)'
      }} />
      
      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.625rem' : '0.75rem',
        paddingLeft: isMobile ? '0.5rem' : '0.625rem'
      }}>
        {/* Focus indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          flex: 1
        }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Target size={11} color="#f97316" />
          </div>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {selectedData.focus}
          </span>
        </div>
        
        {/* Exercise count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem',
          background: 'rgba(249, 115, 22, 0.12)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '6px',
          flexShrink: 0
        }}>
          <Dumbbell size={11} color="#f97316" />
          <span>{selectedData.exercises}</span>
        </div>
      </div>
    </div>
  )
}
