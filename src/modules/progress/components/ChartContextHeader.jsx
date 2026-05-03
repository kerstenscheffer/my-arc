// src/modules/progress/components/ChartContextHeader.jsx
// 🏆 GOLD THEME
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function ChartContextHeader({ 
  exerciseName, 
  metricName, 
  currentValue, 
  previousValue, 
  unit = '',
  loading = false 
}) {
  const isMobile = window.innerWidth <= 768

  // Calculate change
  const change = currentValue && previousValue ? currentValue - previousValue : 0
  const percentChange = previousValue && previousValue !== 0 
    ? ((change / previousValue) * 100).toFixed(1)
    : 0

  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  // Determine trend color
  const trendColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#94a3b8'
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)', // GOLD
        borderRadius: isMobile ? '10px' : '12px',
        border: '1px solid rgba(255, 215, 0, 0.2)', // GOLD
        marginBottom: isMobile ? '0.75rem' : '1rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60px'
      }}>
        <div style={{
          width: isMobile ? '20px' : '24px',
          height: isMobile ? '20px' : '24px',
          border: '2px solid rgba(255, 215, 0, 0.2)', // GOLD
          borderTopColor: '#FFD700', // GOLD
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '0.75rem' : '1rem',
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)', // GOLD
      borderRadius: isMobile ? '10px' : '12px',
      border: '1px solid rgba(255, 215, 0, 0.2)', // GOLD
      marginBottom: isMobile ? '0.75rem' : '1rem',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent line - GOLD */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)', // GOLD
        opacity: 0.6,
        zIndex: 10
      }} />

      {/* Header - Exercise + Metric */}
      <div style={{
        marginBottom: isMobile ? '0.625rem' : '0.75rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'baseline',
        gap: isMobile ? '0.125rem' : '0.5rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          fontWeight: '800',
          color: '#FFD700', // GOLD
          letterSpacing: '-0.015em',
          textShadow: '0 0 16px rgba(255, 215, 0, 0.25)' // GOLD
        }}>
          {metricName}
        </div>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.55)',
          fontWeight: '600',
          letterSpacing: '0.01em'
        }}>
          {exerciseName}
        </div>
      </div>

      {/* Stats Badges - COMPACT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem'
      }}>
        {/* Current Value - GOLD */}
        <div style={{
          background: 'rgba(23, 23, 23, 0.7)',
          borderRadius: isMobile ? '8px' : '10px',
          padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
          border: '1px solid rgba(255, 215, 0, 0.2)', // GOLD
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.575rem' : '0.625rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '700',
            marginBottom: isMobile ? '0.25rem' : '0.3rem'
          }}>
            Huidig
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: '800',
            color: '#FFD700', // GOLD
            letterSpacing: '-0.02em',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.3)', // GOLD
            lineHeight: 1
          }}>
            {currentValue !== null && currentValue !== undefined 
              ? `${currentValue}${unit}` 
              : '-'
            }
          </div>
        </div>

        {/* Previous Value */}
        {previousValue !== null && previousValue !== undefined && (
          <div style={{
            background: 'rgba(23, 23, 23, 0.5)',
            borderRadius: isMobile ? '8px' : '10px',
            padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.575rem' : '0.625rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              marginBottom: isMobile ? '0.25rem' : '0.3rem'
            }}>
              Vorige
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.65)',
              letterSpacing: '-0.015em',
              lineHeight: 1
            }}>
              {previousValue}{unit}
            </div>
          </div>
        )}

        {/* Change Badge - Keeps green/red for trend */}
        {change !== 0 && previousValue !== null && previousValue !== undefined && (
          <div style={{
            background: `linear-gradient(135deg, ${trendColor}20 0%, ${trendColor}12 100%)`,
            borderRadius: isMobile ? '8px' : '10px',
            padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
            border: `1px solid ${trendColor}35`,
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Accent line - trend color (green/red) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${trendColor} 50%, transparent 100%)`,
              opacity: 0.5,
              zIndex: 10
            }} />

            <div style={{
              fontSize: isMobile ? '0.575rem' : '0.625rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700',
              marginBottom: isMobile ? '0.25rem' : '0.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendIcon size={isMobile ? 10 : 11} color={trendColor} strokeWidth={2.5} />
              Trend
            </div>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              fontWeight: '800',
              color: trendColor,
              letterSpacing: '-0.015em',
              textShadow: `0 0 12px ${trendColor}30`,
              display: 'flex',
              alignItems: 'baseline',
              gap: isMobile ? '0.3rem' : '0.375rem',
              lineHeight: 1
            }}>
              <span>{isPositive ? '+' : ''}{change}{unit}</span>
              {percentChange != 0 && (
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.725rem',
                  fontWeight: '700',
                  opacity: 0.75
                }}>
                  ({isPositive ? '+' : ''}{percentChange}%)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
