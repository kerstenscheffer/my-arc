// src/modules/progress/workout/components/SetInput.jsx
const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
  success: '#10b981'
}

export default function SetInput({
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
      gap: isMobile ? '0.75rem' : '1rem',
      padding: isMobile ? '1rem' : '1.25rem',
      backgroundColor: completed ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: completed ? `2px solid ${THEME.success}` : '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.3s ease'
    }}>
      {/* Set Number */}
      <div style={{
        width: isMobile ? '40px' : '50px',
        height: isMobile ? '40px' : '50px',
        borderRadius: '50%',
        background: completed ? THEME.success : THEME.gradient,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: isMobile ? '1rem' : '1.25rem'
      }}>
        {setNumber}
      </div>

      {/* Weight Input */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Gewicht (kg)
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => onWeightChange(Math.max(0, weight - 2.5))}
            disabled={completed}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              cursor: completed ? 'not-allowed' : 'pointer',
              opacity: completed ? 0.5 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            -
          </button>
          <input
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
            disabled={completed}
            style={{
              width: isMobile ? '60px' : '70px',
              padding: '0.5rem',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 'bold',
              opacity: completed ? 0.5 : 1
            }}
          />
          <button
            onClick={() => onWeightChange(weight + 2.5)}
            disabled={completed}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              cursor: completed ? 'not-allowed' : 'pointer',
              opacity: completed ? 0.5 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Reps Input */}
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Herhalingen
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => onRepsChange(Math.max(1, reps - 1))}
            disabled={completed}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              cursor: completed ? 'not-allowed' : 'pointer',
              opacity: completed ? 0.5 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            -
          </button>
          <input
            type="number"
            value={reps}
            onChange={(e) => onRepsChange(parseInt(e.target.value) || 1)}
            disabled={completed}
            style={{
              width: isMobile ? '60px' : '70px',
              padding: '0.5rem',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: 'bold',
              opacity: completed ? 0.5 : 1
            }}
          />
          <button
            onClick={() => onRepsChange(reps + 1)}
            disabled={completed}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              cursor: completed ? 'not-allowed' : 'pointer',
              opacity: completed ? 0.5 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={onComplete}
        disabled={completed}
        style={{
          width: isMobile ? '50px' : '60px',
          height: isMobile ? '50px' : '60px',
          borderRadius: '12px',
          background: completed ? THEME.success : THEME.gradient,
          border: 'none',
          color: 'white',
          fontSize: isMobile ? '1.5rem' : '2rem',
          cursor: completed ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {completed ? '✓' : '○'}
      </button>
    </div>
  )
}
