// src/modules/progress/workout/components/QuickSetInputRow.jsx
// REUSABLE SET INPUT ROW - Voor quick log en active workout

import { THEME } from '../WorkoutLogModule'

export default function QuickSetInputRow({
  setNumber,
  weight,
  reps,
  completed,
  onWeightChange,
  onRepsChange,
  onComplete,
  isMobile
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '0.75rem',
      padding: isMobile ? '0.875rem' : '1rem',
      backgroundColor: completed ? 'rgba(16,185,129,0.1)' : 'rgba(15, 23, 42, 0.6)',
      borderRadius: '16px',
      border: completed 
        ? `2px solid ${THEME.success}` 
        : '1px solid rgba(249, 115, 22, 0.1)',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      <div style={{
        width: isMobile ? '36px' : '40px',
        height: isMobile ? '36px' : '40px',
        minHeight: '44px',
        minWidth: '44px',
        borderRadius: '12px',
        background: completed ? THEME.success : THEME.gradient,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: isMobile ? '0.9rem' : '1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        {setNumber}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          kg
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
          disabled={completed}
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem' : '0.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            opacity: completed ? 0.6 : 1,
            outline: 'none',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(148, 163, 184, 0.8)',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          fontWeight: '600'
        }}>
          reps
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => onRepsChange(parseInt(e.target.value) || 1)}
          disabled={completed}
          style={{
            width: '100%',
            padding: isMobile ? '0.4rem' : '0.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            opacity: completed ? 0.6 : 1,
            outline: 'none',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        />
      </div>

      <button
        onClick={onComplete}
        style={{
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          minHeight: '44px',
          minWidth: '44px',
          borderRadius: '12px',
          background: completed ? THEME.success : THEME.gradient,
          border: 'none',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transform: completed ? 'scale(1.05)' : 'scale(1)'
        }}
        onTouchStart={(e) => {
          if (isMobile && !completed) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile && !completed) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {completed ? '✓' : '○'}
      </button>
    </div>
  )
}
