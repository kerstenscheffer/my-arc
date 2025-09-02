import React from 'react'
import { Activity, Target, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatsCards({ stats, client, isMobile, theme }) {
  const calculateBMI = () => {
    if (!stats?.current || !client?.height) return null
    const heightInM = client.height / 100
    return (stats.current / (heightInM * heightInM)).toFixed(1)
  }
  
  const getBMICategory = (bmi) => {
    if (!bmi) return null
    if (bmi < 18.5) return { label: 'Ondergewicht', color: theme.warning }
    if (bmi < 25) return { label: 'Gezond', color: theme.success }
    if (bmi < 30) return { label: 'Overgewicht', color: theme.warning }
    return { label: 'Obesitas', color: theme.danger }
  }
  
  const getTrend = () => {
    if (!stats?.weekChange) return null
    if (Math.abs(stats.weekChange) < 0.1) return { icon: Minus, color: '#fff', text: 'Stabiel' }
    if (stats.weekChange > 0) return { icon: TrendingUp, color: theme.danger, text: `+${stats.weekChange} kg` }
    return { icon: TrendingDown, color: theme.success, text: `${stats.weekChange} kg` }
  }
  
  const bmi = calculateBMI()
  const bmiCategory = getBMICategory(bmi)
  const trend = getTrend()
  
  const cards = [
    {
      icon: Activity,
      title: 'BMI Score',
      value: bmi || '--',
      subtitle: bmiCategory?.label,
      color: bmiCategory?.color || theme.primary,
      gradient: true
    },
    {
      icon: Target,
      title: 'Doel',
      value: `${client?.goal_weight || '--'} kg`,
      subtitle: stats?.current && client?.goal_weight 
        ? `${Math.abs(stats.current - client.goal_weight).toFixed(1)} kg te gaan`
        : 'Stel een doel',
      color: theme.primary
    },
    {
      icon: trend?.icon || TrendingUp,
      title: 'Week Trend',
      value: trend?.text || 'Geen data',
      subtitle: 'Afgelopen 7 dagen',
      color: trend?.color || theme.primary
    },
    {
      icon: Brain,
      title: 'AI Predictie',
      value: stats?.prediction ? `${stats.prediction.change > 0 ? '+' : ''}${stats.prediction.change} kg` : '--',
      subtitle: stats?.prediction ? `in ${stats.prediction.timeframe} dagen` : 'Meer data nodig',
      color: theme.primary,
      accent: true
    }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem',
      marginBottom: '1.5rem'
    }}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            background: card.gradient 
              ? `linear-gradient(135deg, ${card.color}22 0%, ${card.color}11 100%)`
              : 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.25rem',
            border: card.accent ? `1px solid ${card.color}33` : '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: isMobile ? '100px' : '120px'
          }}
        >
          {/* Background decoration */}
          {card.accent && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: card.color,
              opacity: 0.1
            }} />
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.5rem'
          }}>
            {React.createElement(card.icon, { 
              size: isMobile ? 14 : 16, 
              color: card.color 
            })}
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {card.title}
            </span>
          </div>
          
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.25rem',
            lineHeight: 1.2
          }}>
            {card.value}
          </div>
          
          {card.subtitle && (
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: card.color === theme.primary ? 'rgba(255,255,255,0.6)' : card.color,
              opacity: card.color === theme.primary ? 1 : 0.8
            }}>
              {card.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
