// src/modules/progress/workout/components/WorkoutTemplatesSection.jsx
// WORKOUT TEMPLATES - Premium structured workout templates

import { Sparkles, Play } from 'lucide-react'
import { THEME } from '../WorkoutLogModule'

export default function WorkoutTemplatesSection({ onStartWorkout, isMobile }) {
  
  const getWorkoutTemplates = () => [
    {
      id: 'upper',
      name: 'Upper Body',
      emoji: '💪',
      duration: 45,
      color: '#dc2626',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 10, rest: 90 },
        { name: 'Shoulder Press', sets: 3, reps: 12, rest: 60 },
        { name: 'Bent Over Row', sets: 3, reps: 10, rest: 90 },
        { name: 'Bicep Curls', sets: 3, reps: 12, rest: 45 }
      ]
    },
    {
      id: 'lower',
      name: 'Lower Body',
      emoji: '🦵',
      duration: 50,
      color: '#7c3aed',
      exercises: [
        { name: 'Squats', sets: 4, reps: 10, rest: 120 },
        { name: 'Romanian Deadlift', sets: 3, reps: 8, rest: 90 },
        { name: 'Leg Press', sets: 3, reps: 12, rest: 90 },
        { name: 'Calf Raises', sets: 4, reps: 15, rest: 45 }
      ]
    },
    {
      id: 'hiit',
      name: 'HIIT Cardio',
      emoji: '🔥',
      duration: 30,
      color: '#059669',
      exercises: [
        { name: 'Burpees', sets: 4, reps: 10, rest: 30 },
        { name: 'Mountain Climbers', sets: 4, reps: 20, rest: 30 },
        { name: 'Jump Squats', sets: 4, reps: 15, rest: 30 }
      ]
    }
  ]

  return (
    <div style={{
      marginBottom: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        paddingLeft: '0.5rem'
      }}>
        <Sparkles size={18} color={THEME.primary} />
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0
        }}>
          Start Structured Workout
        </h3>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {getWorkoutTemplates().map(template => (
          <button
            key={template.id}
            onClick={() => onStartWorkout(template)}
            style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: THEME.cardGradient,
              border: `1px solid ${template.color}22`,
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateY(0)',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 32px ${template.color}33`
                e.currentTarget.style.borderColor = `${template.color}44`
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0px)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = `${template.color}22`
              }
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
                e.currentTarget.style.boxShadow = `0 8px 20px ${template.color}22`
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: `linear-gradient(180deg, ${template.color} 0%, ${template.color}66 100%)`
            }} />
            
            <div style={{
              width: isMobile ? '50px' : '60px',
              height: isMobile ? '50px' : '60px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${template.color}44, ${template.color}22)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              flexShrink: 0,
              boxShadow: `0 8px 20px ${template.color}33`
            }}>
              {template.emoji}
            </div>
            
            <div style={{ 
              flex: 1, 
              textAlign: 'left', 
              paddingLeft: isMobile ? '0.25rem' : '0.5rem' 
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.375rem'
              }}>
                {template.name}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '0.25rem'
              }}>
                {template.exercises.length} oefeningen • {template.duration} min
              </div>
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: template.color,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Ready to start
              </div>
            </div>
            
            <div style={{
              width: isMobile ? '44px' : '48px',
              height: isMobile ? '44px' : '48px',
              minHeight: '44px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${template.color}, ${template.color}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${template.color}44`
            }}>
              <Play size={isMobile ? 18 : 20} color="#fff" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
