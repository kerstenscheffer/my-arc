import useIsMobile from '../../../hooks/useIsMobile'
// src/modules/workout/components/WorkoutCard.jsx
import { Activity, CheckCircle, ChevronRight, Clock, Target } from 'lucide-react'

export default function WorkoutCard({ 
  day, 
  workout, 
  isToday, 
  isCompleted, 
  onClick 
}) {
  const isMobile = useIsMobile()
  
  return (
    <div
      onClick={onClick}
      style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: isToday 
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)'
          : isCompleted
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
        border: `1px solid ${
          isToday 
            ? 'rgba(249, 115, 22, 0.2)' 
            : isCompleted
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(249, 115, 22, 0.1)'
        }`,
        borderRadius: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        marginBottom: '0.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)'
        e.currentTarget.style.borderColor = isToday 
          ? 'rgba(249, 115, 22, 0.3)'
          : isCompleted 
            ? 'rgba(16, 185, 129, 0.25)'
            : 'rgba(249, 115, 22, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)'
        e.currentTarget.style.borderColor = isToday 
          ? 'rgba(249, 115, 22, 0.2)' 
          : isCompleted
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(249, 115, 22, 0.1)'
      }}
    >
      {/* Orange accent line */}
      {isToday && (
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
      
      {/* Green accent line for completed */}
      {isCompleted && !isToday && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
        }} />
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        paddingLeft: (isToday || isCompleted) ? '0.5rem' : 0
      }}>
        {/* Icon container */}
        <div style={{
          width: isMobile ? '42px' : '48px',
          height: isMobile ? '42px' : '48px',
          borderRadius: '12px',
          background: isToday 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)'
            : isCompleted
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative'
        }}>
          {isCompleted ? (
            <CheckCircle 
              size={isMobile ? 20 : 22} 
              color="#10b981"
              strokeWidth={2.5}
            />
          ) : (
            <Activity 
              size={isMobile ? 20 : 22} 
              color={isToday ? '#f97316' : 'rgba(249, 115, 22, 0.7)'}
              strokeWidth={2}
            />
          )}
          
          {/* Today indicator dot */}
          {isToday && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f97316',
              boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
              animation: 'pulse 2s infinite'
            }} />
          )}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1 }}>
          {/* Day label */}
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: isToday 
              ? '#f97316' 
              : isCompleted 
                ? '#10b981'
                : 'rgba(255,255,255,0.5)',
            marginBottom: '0.2rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {day}
            {isToday && (
              <span style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                padding: '0.15rem 0.4rem',
                borderRadius: '6px',
                fontWeight: '800'
              }}>
                TODAY
              </span>
            )}
            {isCompleted && (
              <span style={{
                fontSize: '0.65rem',
                color: '#10b981'
              }}>
                • DONE
              </span>
            )}
          </div>
          
          {/* Workout name */}
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            color: '#fff',
            fontWeight: '700',
            marginBottom: '0.3rem'
          }}>
            {workout.name}
          </div>
          
          {/* Workout details */}
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem' 
            }}>
              <Target size={12} />
              {workout.focus}
            </span>
            {workout.duration && (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem' 
              }}>
                <Clock size={12} />
                {workout.duration}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Arrow indicator */}
      <ChevronRight 
        size={18} 
        color={
          isToday 
            ? 'rgba(249, 115, 22, 0.5)' 
            : isCompleted
              ? 'rgba(16, 185, 129, 0.5)'
              : 'rgba(249, 115, 22, 0.3)'
        }
      />
      
      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
          }
        }
      `}</style>
    </div>
  )
}
