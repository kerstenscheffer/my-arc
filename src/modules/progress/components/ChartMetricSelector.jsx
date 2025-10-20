// src/modules/progress/components/ChartMetricSelector.jsx
import { TrendingUp, BarChart3, Layers, Repeat, Dumbbell, Calendar } from 'lucide-react'

export default function ChartMetricSelector({ activeMetric, onSelectMetric, disabled = false }) {
  const isMobile = window.innerWidth <= 768

  const metrics = [
    {
      id: '1rm',
      label: '1RM',
      description: 'One Rep Max',
      icon: Dumbbell,
      color: '#f97316'
    },
    {
      id: 'volume',
      label: 'Volume',
      description: 'Totaal KG',
      icon: BarChart3,
      color: '#3b82f6'
    },
    {
      id: 'maxWeight',
      label: 'Max KG',
      description: 'Zwaarste Set',
      icon: TrendingUp,
      color: '#10b981'
    },
    {
      id: 'totalSets',
      label: 'Sets',
      description: 'Totaal Sets',
      icon: Layers,
      color: '#8b5cf6'
    },
    {
      id: 'totalReps',
      label: 'Reps',
      description: 'Totaal Reps',
      icon: Repeat,
      color: '#ec4899'
    },
    {
      id: 'frequency',
      label: 'Frequentie',
      description: 'Per Week',
      icon: Calendar,
      color: '#f59e0b'
    }
  ]

  return (
    <div style={{
      marginBottom: isMobile ? '1rem' : '1.25rem'
    }}>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.75rem'
      }}>
        Selecteer Metric
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {metrics.map((metric) => {
          const Icon = metric.icon
          const isActive = activeMetric === metric.id

          return (
            <button
              key={metric.id}
              onClick={() => !disabled && onSelectMetric(metric.id)}
              disabled={disabled}
              style={{
                padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
                background: isActive
                  ? `linear-gradient(135deg, ${metric.color}25 0%, ${metric.color}15 100%)`
                  : 'rgba(23, 23, 23, 0.6)',
                border: isActive
                  ? `1px solid ${metric.color}40`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
                opacity: disabled ? 0.5 : 1,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !disabled && !isActive) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}08 100%)`
                  e.currentTarget.style.border = `1px solid ${metric.color}30`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !isActive) {
                  e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile && !disabled) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {/* Top accent line for active */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${metric.color} 50%, transparent 100%)`,
                  opacity: 0.6
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px',
                borderRadius: '8px',
                background: isActive ? `${metric.color}20` : 'rgba(255, 255, 255, 0.05)',
                border: isActive ? `1px solid ${metric.color}30` : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 0 15px ${metric.color}30` : 'none'
              }}>
                <Icon 
                  size={isMobile ? 16 : 18} 
                  color={isActive ? metric.color : 'rgba(255, 255, 255, 0.5)'}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${metric.color}60)` : 'none'
                  }}
                />
              </div>

              {/* Label */}
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '700',
                color: isActive ? metric.color : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                letterSpacing: '-0.01em',
                textShadow: isActive ? `0 0 15px ${metric.color}40` : 'none'
              }}>
                {metric.label}
              </div>

              {/* Description */}
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {metric.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
