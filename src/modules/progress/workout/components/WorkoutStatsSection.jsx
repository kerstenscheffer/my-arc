// src/modules/progress/workout/components/WorkoutStatsSection.jsx
// STATS DASHBOARD - Premium stats header card

import { Flame, Activity, TrendingUp, Clock } from 'lucide-react'
import { THEME } from '../WorkoutLogModule'

export default function WorkoutStatsSection({ stats, isMobile }) {
  const statItems = [
    { 
      label: 'Streak', 
      value: stats?.streak || 0, 
      unit: 'd', 
      color: THEME.primary, 
      icon: Flame 
    },
    { 
      label: 'Deze Week', 
      value: stats?.totalWorkouts || 0, 
      unit: '', 
      color: '#10b981', 
      icon: Activity 
    },
    { 
      label: 'Volume', 
      value: Math.round((stats?.weeklyVolume || 0) / 100) / 10, 
      unit: 'k', 
      color: '#8b5cf6', 
      icon: TrendingUp 
    },
    { 
      label: 'Tijd', 
      value: stats?.totalMinutes || 0, 
      unit: 'm', 
      color: '#ec4899', 
      icon: Clock 
    }
  ]

  return (
    <div style={{
      background: THEME.cardGradient,
      borderRadius: '20px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: `1px solid ${THEME.border}`,
      marginBottom: '1.5rem',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-30%',
        width: '150%',
        height: '150%',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '3px',
            height: '24px',
            background: THEME.gradient,
            borderRadius: '2px'
          }} />
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            background: THEME.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            margin: 0
          }}>
            Workout Dashboard
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {statItems.map((stat, i) => (
            <div 
              key={i} 
              style={{
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}08 100%)`,
                borderRadius: '14px',
                padding: isMobile ? '0.875rem 0.5rem' : '1rem 0.75rem',
                textAlign: 'center',
                border: `1px solid ${stat.color}20`,
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: stat.color
              }} />
              
              <stat.icon 
                size={isMobile ? 14 : 16} 
                color={stat.color} 
                style={{ 
                  marginBottom: '0.5rem',
                  opacity: 0.8
                }} 
              />
              <div style={{ 
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.125rem'
              }}>
                {stat.value}{stat.unit}
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
