// src/modules/progress/components/ChartContextHeader.jsx
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'

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
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        borderRadius: isMobile ? '12px' : '14px',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid rgba(249, 115, 22, 0.2)',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.25rem',
      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      marginBottom: isMobile ? '0.75rem' : '1rem',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
        opacity: 0.6
      }} />

      {/* Exercise name + Metric */}
      <div style={{
        marginBottom: '0.75rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          fontWeight: '800',
          color: '#f97316',
          marginBottom: '0.25rem',
          letterSpacing: '-0.02em',
          textShadow: '0 0 20px rgba(249, 115, 22, 0.3)'
        }}>
          {metricName}
        </div>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '600'
        }}>
          {exerciseName}
        </div>
      </div>

      {/* Stats badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {/* Current Value */}
        <div style={{
          background: 'rgba(23, 23, 23, 0.6)',
          borderRadius: '10px',
          padding: isMobile ? '0.75rem' : '0.875rem',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600',
            marginBottom: '0.35rem'
          }}>
            Huidig
          </div>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            color: '#f97316',
            letterSpacing: '-0.02em',
            textShadow: '0 0 15px rgba(249, 115, 22, 0.3)'
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
            background: 'rgba(23, 23, 23, 0.6)',
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '0.35rem'
            }}>
              Vorige
            </div>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '-0.02em'
            }}>
              {previousValue}{unit}
            </div>
          </div>
        )}

        {/* Change Badge */}
        {change !== 0 && previousValue !== null && previousValue !== undefined && (
          <div style={{
            background: `linear-gradient(135deg, ${trendColor}25 0%, ${trendColor}15 100%)`,
            borderRadius: '10px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            border: `1px solid ${trendColor}40`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${trendColor} 50%, transparent 100%)`,
              opacity: 0.6
            }} />

            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <TrendIcon size={isMobile ? 11 : 12} color={trendColor} />
              Verandering
            </div>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              color: trendColor,
              letterSpacing: '-0.02em',
              textShadow: `0 0 15px ${trendColor}40`,
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.4rem'
            }}>
              <span>{isPositive ? '+' : ''}{change}{unit}</span>
              {percentChange !== 0 && (
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  fontWeight: '700',
                  opacity: 0.8
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
