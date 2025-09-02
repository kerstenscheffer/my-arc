import React, { useState, useRef, useEffect } from 'react'
import { BarChart3, LineChart, Clock, ChevronDown } from 'lucide-react'

export default function Timeline({ history, isMobile, theme }) {
  const [viewType, setViewType] = useState('timeline')
  const [expanded, setExpanded] = useState(!isMobile)
  const svgRef = useRef(null)
  const [svgWidth, setSvgWidth] = useState(300)
  
  useEffect(() => {
    const updateWidth = () => {
      if (svgRef.current) {
        setSvgWidth(svgRef.current.parentElement.offsetWidth - (isMobile ? 32 : 48))
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [isMobile])
  
  if (!history || history.length === 0) {
    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)'
      }}>
        Nog geen data beschikbaar
      </div>
    )
  }
  
  const data = [...history].reverse().slice(-30)
  const maxWeight = Math.max(...data.map(w => w.weight))
  const minWeight = Math.min(...data.map(w => w.weight))
  const range = maxWeight - minWeight || 1
  const chartHeight = isMobile ? 180 : 240
  
  const renderTimeline = () => {
    const today = new Date()
    const displayData = expanded ? history.slice(0, 20) : history.slice(0, 5)
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: expanded ? '500px' : 'auto',
        overflowY: expanded ? 'auto' : 'hidden',
        paddingRight: expanded ? '0.5rem' : '0'
      }}>
        {displayData.map((entry, index) => {
          const prevEntry = history[index + 1]
          const change = prevEntry ? entry.weight - prevEntry.weight : 0
          const date = new Date(entry.date)
          const isToday = date.toDateString() === today.toDateString()
          const daysSince = Math.floor((today - date) / (1000 * 60 * 60 * 24))
          
          return (
            <div
              key={entry.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '0.75rem' : '1rem',
                background: isToday ? `${theme.primary}11` : 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: isToday ? `1px solid ${theme.primary}33` : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Timeline dot and line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '20px'
              }}>
                <div style={{
                  width: isToday ? '12px' : '8px',
                  height: isToday ? '12px' : '8px',
                  borderRadius: '50%',
                  background: isToday ? theme.primary : change > 0 ? theme.danger : change < 0 ? theme.success : 'rgba(255,255,255,0.3)',
                  boxShadow: isToday ? `0 0 12px ${theme.primary}66` : 'none'
                }} />
                {index < displayData.length - 1 && (
                  <div style={{
                    width: '2px',
                    height: '40px',
                    background: 'rgba(255,255,255,0.1)',
                    marginTop: '4px'
                  }} />
                )}
              </div>
              
              {/* Date info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    {date.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  {isToday && (
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      background: theme.primary,
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      color: '#fff',
                      fontWeight: '600'
                    }}>
                      VANDAAG
                    </span>
                  )}
                  {!isToday && daysSince <= 7 && (
                    <span style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.3)'
                    }}>
                      {daysSince === 1 ? 'gisteren' : `${daysSince} dagen`}
                    </span>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    {entry.weight.toFixed(1)} kg
                  </span>
                  {entry.time_of_day && (
                    <span style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.3)'
                    }}>
                      {entry.time_of_day === 'morning' ? '🌅' :
                       entry.time_of_day === 'afternoon' ? '☀️' : '🌙'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Change indicator */}
              {change !== 0 && (
                <div style={{
                  padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.625rem',
                  background: change > 0 ? `${theme.danger}22` : `${theme.success}22`,
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: change > 0 ? theme.danger : theme.success,
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {change > 0 ? '↑' : '↓'}
                  {Math.abs(change).toFixed(1)}
                </div>
              )}
            </div>
          )
        })}
        
        {!expanded && history.length > 5 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: theme.primary,
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
          >
            <ChevronDown size={16} />
            Toon meer ({history.length - 5} entries)
          </button>
        )}
      </div>
    )
  }
  
  const renderChart = () => {
    return (
      <div ref={svgRef}>
        <svg 
          width={svgWidth}
          height={chartHeight}
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          style={{ marginTop: '1rem' }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * (chartHeight / 4)}
              x2={svgWidth}
              y2={i * (chartHeight / 4)}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          ))}
          
          {/* Area fill */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.primary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <path
            d={`
              M 0,${chartHeight}
              ${data.map((w, i) => {
                const x = (i / (data.length - 1)) * svgWidth
                const y = chartHeight - ((w.weight - minWeight) / range) * (chartHeight - 40) - 20
                return `L ${x},${y}`
              }).join(' ')}
              L ${svgWidth},${chartHeight}
              Z
            `}
            fill="url(#areaGradient)"
          />
          
          {/* Line */}
          <path
            d={`
              M 0,${chartHeight - ((data[0].weight - minWeight) / range) * (chartHeight - 40) - 20}
              ${data.slice(1).map((w, i) => {
                const x = ((i + 1) / (data.length - 1)) * svgWidth
                const y = chartHeight - ((w.weight - minWeight) / range) * (chartHeight - 40) - 20
                return `L ${x},${y}`
              }).join(' ')}
            `}
            stroke={theme.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 2px 8px ${theme.primary}66)` }}
          />
          
          {/* Points */}
          {data.map((w, i) => {
            const x = (i / (data.length - 1)) * svgWidth
            const y = chartHeight - ((w.weight - minWeight) / range) * (chartHeight - 40) - 20
            const isFirst = i === 0
            const isLast = i === data.length - 1
            
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isFirst || isLast ? "6" : "4"}
                  fill={theme.primary}
                  stroke="#0a0a0a"
                  strokeWidth="2"
                />
                {(isFirst || isLast) && (
                  <text
                    x={x}
                    y={y - 12}
                    fill="#fff"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {w.weight.toFixed(1)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        
        {/* X-axis labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)'
        }}>
          <span>{data.length} dagen geleden</span>
          <span>Vandaag</span>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '20px',
      padding: isMobile ? '1rem' : '1.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Header with toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#fff',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Clock size={18} color={theme.primary} />
          {viewType === 'timeline' ? 'Tijdlijn' : 'Grafiek'}
        </h3>
        
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          padding: '0.25rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setViewType('timeline')}
            style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.375rem 0.75rem',
              background: viewType === 'timeline' ? theme.gradient : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Clock size={14} />
            {!isMobile && 'Tijdlijn'}
          </button>
          <button
            onClick={() => setViewType('chart')}
            style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.375rem 0.75rem',
              background: viewType === 'chart' ? theme.gradient : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <LineChart size={14} />
            {!isMobile && 'Grafiek'}
          </button>
        </div>
      </div>
      
      {/* Content */}
      {viewType === 'timeline' ? renderTimeline() : renderChart()}
    </div>
  )
}
