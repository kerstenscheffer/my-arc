// src/modules/progress-photos/components/ChallengeProgressBanner.jsx
import React from 'react'
import { Camera, Scale, Trophy, Calendar, AlertCircle, CheckCircle, Target } from 'lucide-react'

export default function ChallengeProgressBanner({ 
  challengeData,
  weightStats,
  fridayData,
  photoCount,
  client,
  onScrollToPhotos,
  onScrollToWeight,
  isMobile 
}) {
  const { 
    currentWeek = 1, 
    totalWeeks = 8, 
    completedWeeks = 0,
    daysUntilFriday = 0,
    dayNumber = 1,
    isCompliant = false 
  } = challengeData || {}

  // Weight data
  const currentWeight = weightStats?.current || client?.current_weight || 0
  const weightLoss = weightStats?.totalChange || 0
  const fridayWeighIns = fridayData?.friday_count || 0

  // Progress calculation
  const weekProgress = (completedWeeks / totalWeeks) * 100
  const isCurrentWeekComplete = completedWeeks >= currentWeek

  // Stats for challenge
  const stats = [
    {
      icon: CheckCircle,
      value: `${completedWeeks}/8`,
      label: "Friday Sets",
      color: completedWeeks >= currentWeek - 1 ? '#10b981' : '#f97316',
      tooltip: "Complete front & side photos"
    },
    {
      icon: Camera,
      value: photoCount || 0,
      label: "Totaal Foto's",
      color: '#8b5cf6'
    },
    {
      icon: Scale,
      value: `${weightLoss.toFixed(1)} kg`,
      label: weightLoss < 0 ? "Verloren" : "Verschil",
      color: weightLoss < 0 ? '#10b981' : '#3b82f6'
    }
  ]

  // Urgency color based on days until Friday
  const getUrgencyColor = () => {
    if (daysUntilFriday === 0) return '#dc2626' // Red - Today!
    if (daysUntilFriday === 1) return '#f97316' // Orange - Tomorrow
    if (daysUntilFriday === 2) return '#fbbf24' // Yellow - 2 days
    return '#10b981' // Green - 3+ days
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.1) 10px,
          rgba(255,255,255,0.1) 20px
        )`,
        pointerEvents: 'none'
      }} />

      {/* Trophy decoration */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-5%',
        opacity: 0.1
      }}>
        <Trophy size={200} color="white" />
      </div>

      {/* Header with Week Info */}
      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '0.25rem'
            }}>
              8-Week Challenge
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Week {currentWeek} van {totalWeeks}
              </span>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                background: isCompliant ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                borderRadius: '6px',
                color: isCompliant ? '#34d399' : '#fb923c',
                border: `1px solid ${isCompliant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(249, 115, 22, 0.3)'}`,
                fontWeight: '600'
              }}>
                {isCompliant ? 'ON TRACK' : 'CATCH UP'}
              </span>
            </div>
          </div>
          
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.25rem'
            }}>
              Dag {dayNumber}
            </div>
          </div>
        </div>

        {/* Friday Urgency Alert */}
        {daysUntilFriday <= 3 && !isCurrentWeekComplete && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: `${getUrgencyColor()}20`,
            borderRadius: '8px',
            border: `1px solid ${getUrgencyColor()}40`,
            marginTop: '0.75rem'
          }}>
            <AlertCircle size={16} color={getUrgencyColor()} />
            <span style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'white',
              fontWeight: '600'
            }}>
              {daysUntilFriday === 0 
                ? '⚡ VANDAAG Friday photos uploaden!' 
                : daysUntilFriday === 1
                  ? 'Morgen is Friday photo dag!'
                  : `${daysUntilFriday} dagen tot Friday deadline`
              }
            </span>
          </div>
        )}
      </div>

      {/* Week Progress Bar */}
      <div style={{
        marginBottom: '1.25rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Challenge Progress
          </span>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'white'
          }}>
            {weekProgress.toFixed(0)}%
          </span>
        </div>
        
        {/* Week indicators */}
        <div style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '0.5rem'
        }}>
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '6px',
                background: idx < completedWeeks 
                  ? '#10b981'
                  : idx < currentWeek 
                    ? 'rgba(249, 115, 22, 0.5)'
                    : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <span>Week 1</span>
          <span>Week 8</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: '1.25rem'
      }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: isMobile ? '0.75rem 0.5rem' : '1rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <Icon 
                size={isMobile ? 16 : 18} 
                color={stat.color} 
                style={{ marginBottom: '0.25rem' }}
              />
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '0.1rem'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <button
          onClick={onScrollToPhotos}
          style={{
            background: daysUntilFriday === 0 
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
            border: 'none',
            borderRadius: '12px',
            padding: isMobile ? '0.875rem' : '1rem',
            color: 'white',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '48px',
            transition: 'all 0.3s ease',
            boxShadow: daysUntilFriday === 0 
              ? '0 4px 12px rgba(251, 191, 36, 0.4)' 
              : '0 4px 12px rgba(0, 0, 0, 0.2)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            animation: daysUntilFriday === 0 ? 'pulse 2s ease-in-out infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Camera size={18} />
          {daysUntilFriday === 0 ? 'Upload Friday Photos!' : 'Upload Photos'}
        </button>

        <button
          onClick={onScrollToWeight}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
            border: 'none',
            borderRadius: '12px',
            padding: isMobile ? '0.875rem' : '1rem',
            color: 'white',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '48px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Scale size={18} />
          Log Weight
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
