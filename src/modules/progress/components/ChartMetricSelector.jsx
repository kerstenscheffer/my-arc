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
      color: '#10b981'
    },
    {
      id: 'maxWeight',
      label: 'Max KG',
      description: 'Zwaarste Set',
      icon: TrendingUp,
      color: '#ef4444'
    },
    {
      id: 'totalSets',
      label: 'Sets',
      description: 'Totaal Sets',
      icon: Layers,
      color: '#3b82f6'
    },
    {
      id: 'totalReps',
      label: 'Reps',
      description: 'Totaal Reps',
      icon: Repeat,
      color: '#a855f7'
    },
    {
      id: 'frequency',
      label: 'Frequentie',
      description: 'Sessies',
      icon: Calendar,
      color: '#f97316'
    }
  ]

  return (
    <div style={{
      marginTop: isMobile ? '1rem' : '1.25rem'
    }}>
      {/* Header */}
      <div style={{
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: '700',
        color: 'rgba(249, 115, 22, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: isMobile ? '0.625rem' : '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}>
        <BarChart3 
          size={isMobile ? 10 : 11} 
          style={{
            filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))'
          }}
        />
        Selecteer Metric
      </div>

      {/* 2x3 Grid - ALWAYS 3 COLUMNS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.625rem'
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
                padding: isMobile ? '0.625rem 0.375rem' : '0.75rem 0.5rem',
                background: isActive
                  ? `linear-gradient(135deg, ${metric.color}20 0%, ${metric.color}10 100%)`
                  : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.6) 100%)',
                border: isActive
                  ? `1px solid ${metric.color}35`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: isMobile ? '8px' : '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? '0.375rem' : '0.5rem',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
                opacity: disabled ? 0.4 : 1,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: isMobile ? '72px' : '88px',
                transform: 'translateZ(0)',
                boxShadow: isActive 
                  ? `0 2px 12px ${metric.color}15` 
                  : '0 1px 4px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !disabled && !isActive) {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${metric.color}12 0%, ${metric.color}06 100%)`
                  e.currentTarget.style.border = `1px solid ${metric.color}25`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 16px ${metric.color}15`
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !isActive) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.6) 100%)'
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2)'
                }
              }}
              onTouchStart={(e) => {
                if (isMobile && !disabled) {
                  e.currentTarget.style.transform = 'scale(0.96)'
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
                  opacity: 0.6,
                  zIndex: 10
                }} />
              )}

              {/* Icon Container */}
              <div style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                borderRadius: isMobile ? '6px' : '8px',
                background: isActive 
                  ? `${metric.color}18` 
                  : 'rgba(255, 255, 255, 0.04)',
                border: isActive 
                  ? `1px solid ${metric.color}30` 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 0 12px ${metric.color}25` : 'none',
                backdropFilter: 'blur(4px)'
              }}>
                <Icon 
                  size={isMobile ? 14 : 16} 
                  color={isActive ? metric.color : 'rgba(255, 255, 255, 0.5)'}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${metric.color}50)` : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {/* Label */}
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '700',
                color: isActive ? metric.color : 'rgba(255, 255, 255, 0.75)',
                textAlign: 'center',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                textShadow: isActive ? `0 0 12px ${metric.color}35` : 'none',
                transition: 'all 0.3s ease'
              }}>
                {metric.label}
              </div>

              {/* Description */}
              <div style={{
                fontSize: isMobile ? '0.575rem' : '0.625rem',
                color: isActive 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(255, 255, 255, 0.45)',
                textAlign: 'center',
                fontWeight: '500',
                letterSpacing: '0.01em',
                lineHeight: 1.2
              }}>
                {metric.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Disabled hint */}
      {disabled && (
        <div style={{
          marginTop: isMobile ? '0.625rem' : '0.75rem',
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: isMobile ? '8px' : '10px',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          fontWeight: '500',
          fontStyle: 'italic'
        }}>
          Selecteer eerst een specifieke oefening
        </div>
      )}
    </div>
  )
}
