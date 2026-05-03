// src/modules/workout/components/quick-stats/StatRing.jsx
// 🎯 REUSABLE PROGRESS RING - Gold themed

import React from 'react'

export default function StatRing({ 
  percentage, 
  currentValue, 
  targetValue, 
  unit,
  Icon,
  leftLabel = 'Huidig',
  rightLabel = 'Doel',
  isMobile 
}) {
  // Ring dimensions
  const ringSize = isMobile ? 140 : 180
  const strokeWidth = isMobile ? 8 : 10
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '1rem' : '2rem',
      position: 'relative',
      zIndex: 2
    }}>
      {/* Left Label - Current */}
      <div style={{
        textAlign: 'right',
        minWidth: isMobile ? '60px' : '80px'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          color: '#FFD700',
          lineHeight: 1,
          marginBottom: '0.125rem',
          textShadow: '0 0 12px rgba(255, 215, 0, 0.5)'
        }}>
          {currentValue}
        </div>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '700',
          color: 'rgba(255, 215, 0, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.125rem'
        }}>
          {unit}
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {leftLabel}
        </div>
      </div>

      {/* Central Progress Ring */}
      <div style={{
        position: 'relative',
        width: ringSize,
        height: ringSize,
        flexShrink: 0
      }}>
        <svg
          width={ringSize}
          height={ringSize}
          style={{
            transform: 'rotate(-90deg)',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 215, 0, 0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
            }}
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content with icon */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '100%'
        }}>
          {Icon && (
            <Icon 
              size={isMobile ? 24 : 32} 
              color="#FFD700"
              style={{
                marginBottom: '0.5rem',
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))'
              }}
            />
          )}
          <div style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '900',
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
          }}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* Right Label - Target */}
      <div style={{
        textAlign: 'left',
        minWidth: isMobile ? '60px' : '80px'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1,
          marginBottom: '0.125rem'
        }}>
          {targetValue}
        </div>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.125rem'
        }}>
          {unit}
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {rightLabel}
        </div>
      </div>
    </div>
  )
}
