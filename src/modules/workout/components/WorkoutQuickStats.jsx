// src/modules/workout/components/WorkoutQuickStats.jsx
// 🎯 COMPACT HORIZONTAL - Ring left, stats right, full width

import React, { useState } from 'react'
import { Dumbbell, TrendingUp, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import useWorkoutStats from '../hooks/useWorkoutStats'

export default function WorkoutQuickStats({ client, schema, db, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  const [currentStat, setCurrentStat] = useState(0)
  const { stats, loading } = useWorkoutStats(client, schema, db)
  
  // Touch swipe
  const [touchStart, setTouchStart] = useState(null)

  const statConfigs = [
    {
      type: 'exercisePR',
      icon: Dumbbell,
      title: 'Exercise PR',
      getValue: () => stats.exercisePR.current,
      getTarget: () => stats.exercisePR.target,
      getLabel: () => stats.exercisePR.exercise,
      getUnit: () => 'KG',
      getTargetUnit: () => 'KG',
      getSubtext: () => stats.exercisePR.lastValue > 0 
        ? `Vorige: ${stats.exercisePR.lastValue}kg` 
        : 'Nog geen data'
    },
    {
      type: 'weekProgress',
      icon: TrendingUp,
      title: 'Week Progress',
      getValue: () => stats.weekProgress.completed,
      getTarget: () => stats.weekProgress.total,
      getLabel: () => 'Workouts',
      getUnit: () => '',
      getTargetUnit: () => '',
      getSubtext: () => 'Deze week'
    },
    {
      type: 'todayPlan',
      icon: Calendar,
      title: "Today's Plan",
      getValue: () => stats.todayPlan.exercises,
      getTarget: () => 10,
      getLabel: () => stats.todayPlan.name,
      getUnit: () => 'oef.',
      getTargetUnit: () => 'oef.',
      getSubtext: () => stats.todayPlan.minutes > 0 
        ? `~${stats.todayPlan.minutes} min` 
        : 'Geen workout vandaag'
    },
    {
      type: 'totalVolume',
      icon: Activity,
      title: 'Volume',
      getValue: () => stats.totalVolume.current,
      getTarget: () => stats.totalVolume.target,
      getLabel: () => 'Totaal gewicht',
      getUnit: () => 'KG',
      getTargetUnit: () => 'KG',
      getSubtext: () => 'Deze week'
    }
  ]

  const currentConfig = statConfigs[currentStat]
  const currentValue = currentConfig.getValue()
  const targetValue = currentConfig.getTarget()
  const percentage = targetValue > 0 
    ? Math.min(100, Math.round((currentValue / targetValue) * 100))
    : 0

  const handlePrev = () => setCurrentStat(p => p === 0 ? statConfigs.length - 1 : p - 1)
  const handleNext = () => setCurrentStat(p => p === statConfigs.length - 1 ? 0 : p + 1)
  
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext()
      else handlePrev()
    }
    setTouchStart(null)
  }

  if (loading) {
    return (
      <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(255, 215, 0, 0.15)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  const Icon = currentConfig.icon
  const ringSize = isMobile ? 100 : 120
  const strokeWidth = 6
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        borderBottom: '1px solid rgba(255, 215, 0, 0.08)',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
        position: 'relative'
      }}
    >
      {/* Main layout: ring left, content right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Nav arrow left */}
        <button
          onClick={handlePrev}
          style={{
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.12)',
            borderRadius: '8px',
            color: 'rgba(255, 215, 0, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronLeft size={isMobile ? 14 : 16} />
        </button>
        
        {/* Progress Ring — compact */}
        <div style={{
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          position: 'relative',
          flexShrink: 0
        }}>
          <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
            {/* BG ring */}
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none"
              stroke="rgba(255, 215, 0, 0.08)"
              strokeWidth={strokeWidth}
            />
            {/* Progress ring */}
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none"
              stroke={percentage >= 90 ? '#10b981' : '#FFD700'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: percentage >= 90
                  ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))'
                  : 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.3))'
              }}
            />
          </svg>
          {/* Center content */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon 
              size={isMobile ? 14 : 16} 
              color={percentage >= 90 ? '#10b981' : '#FFD700'}
              strokeWidth={2}
              style={{ marginBottom: '0.15rem', opacity: 0.6 }}
            />
            <div style={{
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '900',
              color: percentage >= 90 ? '#10b981' : '#FFD700',
              lineHeight: 1,
              letterSpacing: '-0.03em'
            }}>
              {percentage}%
            </div>
          </div>
        </div>
        
        {/* Stats content — right side */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem'
        }}>
          {/* Title badge */}
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: '700',
            color: 'rgba(255, 215, 0, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1
          }}>
            {currentConfig.title}
          </div>
          
          {/* Label (exercise name etc) */}
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '800',
            color: '#FFD700',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentConfig.getLabel()}
          </div>
          
          {/* Subtext */}
          <div style={{
            fontSize: isMobile ? '0.68rem' : '0.73rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1
          }}>
            {currentConfig.getSubtext()}
          </div>
          
          {/* Current vs Target inline */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: isMobile ? '0.75rem' : '1rem',
            marginTop: '0.2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{
                fontSize: isMobile ? '1.2rem' : '1.35rem',
                fontWeight: '900',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                {currentValue}
              </span>
              <span style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase'
              }}>
                {currentConfig.getUnit()}
              </span>
            </div>
            
            <div style={{
              width: '1px',
              height: isMobile ? '16px' : '18px',
              background: 'rgba(255, 215, 0, 0.12)'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.25)',
                letterSpacing: '-0.02em'
              }}>
                {targetValue}
              </span>
              <span style={{
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.15)',
                textTransform: 'uppercase'
              }}>
                {currentConfig.getTargetUnit()} DOEL
              </span>
            </div>
          </div>
        </div>
        
        {/* Nav arrow right */}
        <button
          onClick={handleNext}
          style={{
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.12)',
            borderRadius: '8px',
            color: 'rgba(255, 215, 0, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ChevronRight size={isMobile ? 14 : 16} />
        </button>
      </div>
      
      {/* Dot indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.35rem',
        marginTop: isMobile ? '0.6rem' : '0.75rem'
      }}>
        {statConfigs.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStat(i)}
            style={{
              width: i === currentStat ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === currentStat ? '#FFD700' : 'rgba(255, 215, 0, 0.15)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation'
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
