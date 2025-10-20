// src/modules/progress-photos/components/PhotoStats.jsx
import React from 'react'
import { TrendingUp, Calendar, Image, Award, Camera, Utensils, Dumbbell, Trophy } from 'lucide-react'

export default function PhotoStats({ 
  weeklyStats = {}, 
  todayData = {},
  isMobile = false 
}) {
  const {
    meal = 0,
    workout = 0,
    progress = 0,
    victory = 0,
    total = 0,
    activeDays = 0,
    dailyAverage = 0,
    current_week = 0
  } = weeklyStats

  const { counts = {} } = todayData
  const todayTotal = counts.total || 0

  return (
    <div style={{
      marginTop: '0.5rem'
    }}>
      {/* Header */}
      <div style={{
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        color: 'rgba(139, 92, 246, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '600',
        marginBottom: '0.75rem',
        padding: '0 0.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <TrendingUp size={14} color="#8b5cf6" opacity={0.7} />
        Statistieken
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        {/* Vandaag */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.75rem' : '1rem',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <Calendar size={isMobile ? 14 : 16} color="#8b5cf6" opacity={0.7} style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#8b5cf6',
            lineHeight: 1
          }}>
            {todayTotal}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(139, 92, 246, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.25rem'
          }}>
            Vandaag
          </div>
        </div>

        {/* Deze Week */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.75rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <Image size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}>
            {current_week || total}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.25rem'
          }}>
            Deze Week
          </div>
        </div>

        {/* Actieve Dagen */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.75rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <Award size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}>
            {activeDays}/7
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.25rem'
          }}>
            Actief
          </div>
        </div>

        {/* Gemiddeld */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
          borderRadius: '10px',
          padding: isMobile ? '0.75rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}>
          <TrendingUp size={isMobile ? 14 : 16} color="rgba(255, 255, 255, 0.5)" style={{ marginBottom: '0.25rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: 'white',
            lineHeight: 1
          }}>
            {dailyAverage}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.25rem'
          }}>
            Gem/Dag
          </div>
        </div>
      </div>

      {/* Type Breakdown - Compact */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '1rem',
        border: '1px solid rgba(139, 92, 246, 0.08)'
      }}>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(139, 92, 246, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
          fontWeight: '600'
        }}>
          Type Verdeling
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem'
        }}>
          {[
            { type: 'Progressie', count: progress, color: '#8b5cf6', icon: Camera },
            { type: 'Maaltijd', count: meal, color: '#10b981', icon: Utensils },
            { type: 'Workout', count: workout, color: '#f97316', icon: Dumbbell },
            { type: 'Victory', count: victory, color: '#fbbf24', icon: Trophy }
          ].map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.type}
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '0.5rem' : '0.625rem',
                  background: `linear-gradient(135deg, ${item.color}10 0%, ${item.color}05 100%)`,
                  borderRadius: '8px',
                  border: `1px solid ${item.color}20`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${item.color}40`
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${item.color}20`
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Icon size={isMobile ? 14 : 16} color={item.color} opacity={0.7} style={{ marginBottom: '0.25rem' }} />
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700',
                  color: item.color,
                  lineHeight: 1
                }}>
                  {item.count}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  color: `${item.color}80`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  marginTop: '0.125rem',
                  fontWeight: '500'
                }}>
                  {item.type}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
