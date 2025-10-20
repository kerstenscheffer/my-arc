// src/modules/progress-photos/components/GeneralProgressBanner.jsx
import React from 'react'
import { Camera, Scale, TrendingDown, Target, ChevronRight, Activity } from 'lucide-react'

export default function GeneralProgressBanner({ 
  weightStats, 
  photoCount, 
  client,
  onScrollToPhotos,
  onScrollToWeight,
  isMobile 
}) {
  // Calculate weight loss
  const weightLoss = weightStats?.totalChange || 0
  const currentWeight = weightStats?.current || client?.current_weight || 0
  const goalWeight = client?.goal_weight || client?.target_weight || 0
  const startWeight = client?.start_weight || 0
  
  // Progress calculation
  const totalToLose = Math.abs(goalWeight - startWeight)
  const lostSoFar = Math.abs(currentWeight - startWeight)
  const progressPercent = totalToLose > 0 ? Math.min(100, (lostSoFar / totalToLose) * 100) : 0

  // Determine progress color
  const getProgressColor = (percent) => {
    if (percent >= 80) return '#10b981'
    if (percent >= 50) return '#3b82f6'
    return '#f97316'
  }

  const progressColor = getProgressColor(progressPercent)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
      borderRadius: isMobile ? '14px' : '16px',
      padding: isMobile ? '0.875rem' : '1.25rem',
      marginBottom: '0.5rem', // Minimal spacing
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)'
      }} />

      {/* Compact Header */}
      <div style={{ 
        marginBottom: isMobile ? '0.75rem' : '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '700',
            color: 'white',
            marginBottom: '0.15rem'
          }}>
            Jouw Transformatie
          </h2>
          <p style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Week {Math.ceil((Date.now() - new Date(client?.created_at || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000))} van je reis
          </p>
        </div>
        
        {/* Progress percentage badge */}
        {progressPercent > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${progressColor}15 0%, ${progressColor}08 100%)`,
            border: `1px solid ${progressColor}25`,
            borderRadius: '8px',
            padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Activity size={14} color={progressColor} />
            <span style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              color: progressColor
            }}>
              {progressPercent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Inline Stats - No separate containers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 2fr 1.5fr',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Photo Stats Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.625rem' : '0.875rem',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={onScrollToPhotos}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.25)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.15)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <div style={{
            width: isMobile ? '36px' : '42px',
            height: isMobile ? '36px' : '42px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={isMobile ? 18 : 20} color="#8b5cf6" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: '#8b5cf6',
              lineHeight: 1
            }}>
              {photoCount || 0}
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(139, 92, 246, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.1rem'
            }}>
              Foto's
            </div>
          </div>
          <ChevronRight size={16} color="rgba(139, 92, 246, 0.4)" />
        </div>

        {/* Weight Stats Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.625rem' : '0.875rem',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.75rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={onScrollToWeight}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.25)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.15)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <div style={{
            width: isMobile ? '36px' : '42px',
            height: isMobile ? '36px' : '42px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scale size={isMobile ? 18 : 20} color="#3b82f6" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: '#3b82f6',
              lineHeight: 1
            }}>
              {currentWeight.toFixed(1)}
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(59, 130, 246, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.1rem'
            }}>
              kg huidig
            </div>
          </div>
          <ChevronRight size={16} color="rgba(59, 130, 246, 0.4)" />
        </div>

        {/* Progress Card */}
        <div style={{
          background: weightLoss < 0 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)'
            : 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(249, 115, 22, 0.03) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.625rem' : '0.875rem',
          border: `1px solid ${weightLoss < 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)'}`,
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <TrendingDown 
            size={isMobile ? 16 : 18} 
            color={weightLoss < 0 ? '#10b981' : '#f97316'} 
            style={{ marginBottom: '0.25rem' }}
          />
          <div style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: weightLoss < 0 ? '#10b981' : '#f97316',
            lineHeight: 1
          }}>
            {weightLoss > 0 ? '+' : ''}{weightLoss.toFixed(1)} kg
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: weightLoss < 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(249, 115, 22, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.1rem'
          }}>
            {weightLoss < 0 ? 'verloren' : 'verschil'}
          </div>
        </div>
      </div>

      {/* Slim Progress Bar */}
      {progressPercent > 0 && (
        <div style={{
          height: '4px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: isMobile ? '0.5rem' : '0.75rem'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${progressColor} 0%, ${progressColor}dd 100%)`,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: progressPercent > 50 ? `0 0 8px ${progressColor}40` : 'none'
          }} />
        </div>
      )}
    </div>
  )
}
