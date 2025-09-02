// src/modules/progress/workout/components/RestTimer.jsx
import { useState, useEffect } from 'react'

const THEME = {
  primary: '#f97316',
  gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)'
}

export default function RestTimer({ seconds, onSkip }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!seconds || seconds <= 0) return
    setTimeLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || isPaused) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          if (onSkip) onSkip()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, isPaused, onSkip])

  if (!timeLeft || timeLeft <= 0) return null

  const minutes = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = ((seconds - timeLeft) / seconds) * 100

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Timer Circle */}
      <div style={{
        position: 'relative',
        width: '200px',
        height: '200px'
      }}>
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)'
          }}
          width="200"
          height="200"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="95"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="95"
            stroke={THEME.primary}
            strokeWidth="10"
            fill="none"
            strokeDasharray="597"
            strokeDashoffset={597 * (1 - progress / 100)}
            style={{
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>

        {/* Timer Display */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'monospace'
          }}>
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <div style={{
            color: THEME.primary,
            fontSize: '1rem',
            marginTop: '0.5rem',
            fontWeight: '600'
          }}>
            Rust Tijd
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isPaused ? '▶️ Hervat' : '⏸ Pauze'}
        </button>

        <button
          onClick={() => setTimeLeft(prev => prev + 30)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          +30s
        </button>

        <button
          onClick={onSkip}
          style={{
            padding: '0.75rem 1.5rem',
            background: THEME.gradient,
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          Skip ⏭
        </button>
      </div>

      {/* Motivational Text */}
      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}>
          💪 Gebruik deze tijd om te hydrateren en je voor te bereiden op de volgende set!
        </p>
      </div>
    </div>
  )
}
