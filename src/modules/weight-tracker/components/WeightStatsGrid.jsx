import React from 'react'
import { Weight, TrendingDown, TrendingUp, Target, Star, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const THEME = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  success: '#10b981',
  danger: '#dc2626',
  friday: '#8b5cf6',
  background: 'rgba(59, 130, 246, 0.05)',
  border: 'rgba(59, 130, 246, 0.08)',
  borderActive: 'rgba(59, 130, 246, 0.15)'
}

export default function WeightStatsGrid({ 
  stats = {},
  client = {},
  fridayData = {},
  history = [],
  isMobile = false 
}) {
  
  // Calculate total change
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstEntry = sortedHistory[0]
  const totalChange = firstEntry && stats?.current ? 
    parseFloat((stats.current - firstEntry.weight).toFixed(1)) : null
  
  // Calculate week change
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weekEntries = sortedHistory.filter(e => new Date(e.date) >= oneWeekAgo)
  const weekChange = weekEntries.length > 0 && stats?.current ? 
    parseFloat((stats.current - weekEntries[0].weight).toFixed(1)) : null
  
  // Prepare chart data - last 30 days
  const chartData = sortedHistory
    .slice(-30)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      weight: entry.weight,
      isFriday: entry.is_friday_weighin
    }))
  
  // 4 compact stats - ALTIJD horizontaal
  const compactStats = [
    {
      icon: Weight,
      label: 'HUIDIG',
      value: stats?.current ? `${stats.current.toFixed(1)}` : '--',
      unit: 'kg',
      color: THEME.primary
    },
    {
      icon: weekChange && weekChange < 0 ? TrendingDown : TrendingUp,
      label: 'WEEK',
      value: weekChange !== null ? 
        `${weekChange > 0 ? '+' : ''}${weekChange.toFixed(1)}` : '--',
      unit: 'kg',
      color: weekChange ? (weekChange < 0 ? THEME.success : THEME.danger) : THEME.primary
    },
    {
      icon: totalChange && totalChange < 0 ? TrendingDown : TrendingUp,
      label: 'TOTAAL',
      value: totalChange !== null ? 
        `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}` : '--',
      unit: 'kg',
      color: totalChange ? (totalChange < 0 ? THEME.success : THEME.danger) : THEME.primary
    },
    {
      icon: Star,
      label: 'VRIJDAG',
      value: `${fridayData?.friday_count || 0}`,
      unit: '/8',
      color: THEME.friday
    }
  ]
  
  // Custom dot for Friday entries
  const CustomDot = (props) => {
    if (props.payload.isFriday) {
      return (
        <circle
          cx={props.cx}
          cy={props.cy}
          r={3}
          fill={THEME.friday}
          stroke="#000"
          strokeWidth={1}
        />
      )
    }
    return <circle cx={props.cx} cy={props.cy} r={2} fill={THEME.primary} />
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.95)',
          border: `1px solid ${THEME.border}`,
          borderRadius: '6px',
          padding: '0.4rem 0.6rem',
          fontSize: '0.75rem'
        }}>
          <p style={{ color: '#fff', margin: 0, fontWeight: '700' }}>
            {payload[0].value.toFixed(1)} kg
          </p>
          <p style={{ color: THEME.primary, margin: 0, fontSize: '0.65rem' }}>
            {payload[0].payload.date}
          </p>
          {payload[0].payload.isFriday && (
            <p style={{ color: THEME.friday, margin: '0.2rem 0 0 0', fontSize: '0.6rem' }}>
              Vrijdag weging
            </p>
          )}
        </div>
      )
    }
    return null
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      
      {/* 4 Stats horizontaal - GEEN wrap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: isMobile ? '0.25rem' : '0.5rem'
      }}>
        {compactStats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
              borderRadius: isMobile ? '10px' : '12px',
              padding: isMobile ? '0.5rem' : '0.75rem',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${stat.color === THEME.friday ? 
                'rgba(139, 92, 246, 0.08)' : THEME.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: isMobile ? '60px' : '70px'
            }}
          >
            {/* Icon */}
            {React.createElement(stat.icon, {
              size: isMobile ? 14 : 16,
              color: stat.color,
              style: { marginBottom: '0.25rem', opacity: 0.7 }
            })}
            
            {/* Value */}
            <div style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              fontWeight: '700',
              color: stat.color,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.125rem'
            }}>
              {stat.value}
              <span style={{
                fontSize: isMobile ? '0.65rem' : '0.75rem',
                fontWeight: '500',
                opacity: 0.7
              }}>
                {stat.unit}
              </span>
            </div>
            
            {/* Label */}
            <div style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.125rem'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Grafiek - Direct aangesloten */}
      {chartData.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '0.75rem' : '1rem',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${THEME.border}`
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}>
              <Activity size={isMobile ? 14 : 16} color={THEME.primary} style={{ opacity: 0.7 }} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: '600',
                color: '#fff'
              }}>
                Gewicht Verloop
              </span>
            </div>
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              30 dagen
            </span>
          </div>
          
          {/* Chart */}
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 180}>
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 5, left: -5, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.2)"
                fontSize={isMobile ? 9 : 10}
                interval="preserveStartEnd"
                tick={{ fill: 'rgba(255,255,255,0.35)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.2)"
                fontSize={isMobile ? 9 : 10}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tick={{ fill: 'rgba(255,255,255,0.35)' }}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke={THEME.primary}
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 5, fill: THEME.primaryLight }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Mini Legend - Alleen als er vrijdag wegingen zijn */}
          {fridayData?.friday_count > 0 && (
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '0.5rem',
              fontSize: isMobile ? '0.6rem' : '0.65rem'
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                color: 'rgba(255,255,255,0.35)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: THEME.friday
                }} />
                Vrijdag
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                color: 'rgba(255,255,255,0.35)'
              }}>
                <div style={{
                  width: '12px',
                  height: '2px',
                  background: THEME.primary
                }} />
                Trend
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Mini doel indicator - Optioneel, heel compact */}
      {client?.goal_weight && stats?.current && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
          borderRadius: isMobile ? '10px' : '12px',
          border: `1px solid ${THEME.border}`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Target size={isMobile ? 12 : 14} color={THEME.primary} style={{ opacity: 0.7 }} />
            <span style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255,255,255,0.7)'
            }}>
              Doel: {client.goal_weight} kg
            </span>
          </div>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            color: THEME.primary
          }}>
            {Math.abs(stats.current - client.goal_weight).toFixed(1)} kg te gaan
          </span>
        </div>
      )}
    </div>
  )
}
