// src/modules/meal-plan/components/MacroOverview.jsx
// 🎯 v2.3 - CLEAN: Neutral palette, green only on ring + completion
// Props: { consumed, targets, isMobile }

import React, { useState } from 'react'
import { Flame, Beef, Wheat, Droplet, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MacroOverview({ consumed, targets, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  const [currentStat, setCurrentStat] = useState(0)
  const [touchStart, setTouchStart] = useState(null)

  const c = {
    calories: Math.round(consumed?.calories || 0),
    protein: Math.round(consumed?.protein || 0),
    carbs: Math.round(consumed?.carbs || 0),
    fat: Math.round(consumed?.fat || 0)
  }
  const t = {
    calories: Math.round(targets?.calories || 0),
    protein: Math.round(targets?.protein || 0),
    carbs: Math.round(targets?.carbs || 0),
    fat: Math.round(targets?.fat || 0)
  }

  const statConfigs = [
    {
      type: 'calories',
      icon: Flame,
      title: 'Calorieën',
      consumed: c.calories,
      target: t.calories,
      unit: 'KCAL',
      getSubtext: () => {
        const remaining = Math.max(0, t.calories - c.calories)
        return remaining > 0 ? `Nog ${remaining} kcal te gaan` : 'Doel bereikt!'
      }
    },
    {
      type: 'protein',
      icon: Beef,
      title: 'Eiwitten',
      consumed: c.protein,
      target: t.protein,
      unit: 'G',
      getSubtext: () => {
        const remaining = Math.max(0, t.protein - c.protein)
        return remaining > 0 ? `Nog ${remaining}g te gaan` : 'Doel bereikt!'
      }
    },
    {
      type: 'carbs',
      icon: Wheat,
      title: 'Koolhydraten',
      consumed: c.carbs,
      target: t.carbs,
      unit: 'G',
      getSubtext: () => {
        const remaining = Math.max(0, t.carbs - c.carbs)
        return remaining > 0 ? `Nog ${remaining}g te gaan` : 'Doel bereikt!'
      }
    },
    {
      type: 'fat',
      icon: Droplet,
      title: 'Vetten',
      consumed: c.fat,
      target: t.fat,
      unit: 'G',
      getSubtext: () => {
        const remaining = Math.max(0, t.fat - c.fat)
        return remaining > 0 ? `Nog ${remaining}g te gaan` : 'Doel bereikt!'
      }
    }
  ]

  const current = statConfigs[currentStat]
  const percentage = current.target > 0
    ? Math.min(100, Math.round((current.consumed / current.target) * 100))
    : 0

  const handlePrev = () => setCurrentStat(p => p === 0 ? statConfigs.length - 1 : p - 1)
  const handleNext = () => setCurrentStat(p => p === statConfigs.length - 1 ? 0 : p + 1)

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? handleNext() : handlePrev()
    }
    setTouchStart(null)
  }

  const Icon = current.icon
  const ringSize = isMobile ? 80 : 100
  const strokeWidth = isMobile ? 5 : 6
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const isComplete = percentage >= 90

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: isMobile ? '0.75rem 0.75rem' : '1rem 1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Main layout: arrow | ring | content | arrow */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '1.25rem',
        overflow: 'hidden'
      }}>
        {/* Nav arrow left */}
        <button
          onClick={handlePrev}
          style={{
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px',
            padding: 0,
            transition: 'all 0.2s ease'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Progress Ring */}
        <div style={{
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          position: 'relative',
          flexShrink: 0
        }}>
          <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(16, 185, 129, 0.08)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: isComplete
                  ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'
                  : 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.2))'
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
              size={isMobile ? 12 : 14}
              color={isComplete ? '#10b981' : 'rgba(16, 185, 129, 0.5)'}
              strokeWidth={2}
              style={{ marginBottom: '0.1rem' }}
            />
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '900',
              color: isComplete ? '#10b981' : '#fff',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              textShadow: isComplete ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
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
          gap: '0.25rem',
          overflow: 'hidden'
        }}>
          {/* Title badge */}
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1
          }}>
            Macro Target
          </div>

          {/* Macro name — white */}
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1.05rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {current.title}
          </div>

          {/* Subtext */}
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.73rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.3)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {current.getSubtext()}
          </div>

          {/* Consumed vs Target */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: isMobile ? '0.5rem' : '1rem',
            marginTop: '0.15rem',
            flexWrap: 'nowrap',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', flexShrink: 0 }}>
              <span style={{
                fontSize: isMobile ? '1.1rem' : '1.35rem',
                fontWeight: '900',
                color: '#fff',
                letterSpacing: '-0.02em'
              }}>
                {current.consumed}
              </span>
              <span style={{
                fontSize: isMobile ? '0.5rem' : '0.6rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.2)',
                textTransform: 'uppercase'
              }}>
                {current.unit}
              </span>
            </div>

            <div style={{
              width: '1px',
              height: isMobile ? '14px' : '18px',
              background: 'rgba(255, 255, 255, 0.08)',
              flexShrink: 0
            }} />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', flexShrink: 0 }}>
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.95rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.2)',
                letterSpacing: '-0.02em'
              }}>
                {current.target}
              </span>
              <span style={{
                fontSize: isMobile ? '0.45rem' : '0.55rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.12)',
                textTransform: 'uppercase'
              }}>
                {current.unit} DOEL
              </span>
            </div>
          </div>
        </div>

        {/* Nav arrow right */}
        <button
          onClick={handleNext}
          style={{
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px',
            padding: 0,
            transition: 'all 0.2s ease'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dot indicators — neutral, active is white */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.35rem',
        marginTop: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {statConfigs.map((config, i) => (
          <button
            key={config.type}
            onClick={() => setCurrentStat(i)}
            style={{
              width: i === currentStat ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === currentStat ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        ))}
      </div>
    </div>
  )
}
