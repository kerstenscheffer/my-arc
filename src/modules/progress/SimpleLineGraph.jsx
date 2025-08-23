// src/modules/progress/SimpleLineGraph.jsx
// MY ARC Simple Line Graph - Optimized with React.memo and efficient rendering

import React, { useMemo } from 'react'

const SimpleLineGraph = ({ data, title, color = '#10b981', height = 200, type = 'weight' }) => {
  // Memoize calculations
  const graphData = useMemo(() => {
    if (!data || data.length === 0) return null
    
    const values = data.map(d => d.value)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1
    
    // Calculate points
    const points = data.map((item, index) => ({
      x: (index / (data.length - 1 || 1)) * 100,
      y: ((maxValue - item.value) / range) * 80 + 10,
      value: item.value,
      date: item.date,
      label: item.label
    }))
    
    // Generate SVG path
    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
    
    // Generate area path for gradient
    const areaPath = pathData + ` L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z`
    
    return {
      points,
      pathData,
      areaPath,
      maxValue,
      minValue,
      range
    }
  }, [data])
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }
  
  const formatValue = (value) => {
    if (type === 'weight') return `${value}kg`
    if (type === 'reps') return `${value}r`
    if (type === 'sets') return `${value}s`
    return value
  }
  
  // Empty state
  if (!graphData) {
    return (
      <div style={{
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(16, 185, 129, 0.05)',
        borderRadius: '8px',
        border: '1px solid #10b98133'
      }}>
        <p style={{ color: '#9ca3af' }}>Geen data beschikbaar</p>
      </div>
    )
  }
  
  const { points, pathData, areaPath, maxValue, minValue } = graphData
  
  return (
    <div style={{
      height: height,
      position: 'relative',
      background: 'rgba(16, 185, 129, 0.02)',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid #10b98133'
    }}>
      <h4 style={{ 
        color: '#fff', 
        fontSize: '0.9rem', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {title}
        <span style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          marginLeft: 'auto'
        }}>
          {points.length} data points
        </span>
      </h4>
      
      <svg
        viewBox="0 0 100 100"
        style={{
          width: '100%',
          height: height - 60,
          overflow: 'visible'
        }}
        preserveAspectRatio="none"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${title})`}
          opacity="0.5"
        />
        
        {/* Main line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Outer glow */}
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              opacity="0.3"
            />
            {/* Inner point */}
            <circle
              cx={point.x}
              cy={point.y}
              r="2"
              fill={color}
            />
            
            {/* Hover area */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="transparent"
              style={{ cursor: 'pointer' }}
            >
              <title>{`${formatDate(point.date)}: ${point.label}`}</title>
            </circle>
            
            {/* Value labels for important points */}
            {(index === 0 || index === points.length - 1 || 
              (points.length > 10 && index % Math.floor(points.length / 5) === 0)) && (
              <text
                x={point.x}
                y={point.y - 5}
                fill="#fff"
                fontSize="6"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {formatValue(point.value)}
              </text>
            )}
          </g>
        ))}
        
        {/* Trend line (optional) */}
        {points.length > 1 && (
          <line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[points.length - 1].x}
            y2={points[points.length - 1].y}
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.3"
          />
        )}
      </svg>
      
      {/* Y-axis labels */}
      <div style={{
        position: 'absolute',
        left: '-45px',
        top: '10%',
        fontSize: '0.75rem',
        color: color,
        fontWeight: '600'
      }}>
        {formatValue(Math.round(maxValue))}
      </div>
      <div style={{
        position: 'absolute',
        left: '-45px',
        bottom: '10%',
        fontSize: '0.75rem',
        color: color,
        fontWeight: '600'
      }}>
        {formatValue(Math.round(minValue))}
      </div>
      
      {/* X-axis labels */}
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 5px'
      }}>
        {points.map((point, index) => {
          // Show dates for first, last, and key points
          if (index === 0 || 
              index === points.length - 1 || 
              (points.length > 4 && index === Math.floor(points.length / 2))) {
            return (
              <div key={index} style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                position: 'absolute',
                left: `${point.x}%`,
                transform: 'translateX(-50%)'
              }}>
                {formatDate(point.date)}
              </div>
            )
          }
          return null
        })}
      </div>
      
      {/* Stats summary */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        gap: '1rem',
        fontSize: '0.7rem'
      }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9ca3af' }}>Current</div>
          <div style={{ color: color, fontWeight: 'bold' }}>
            {formatValue(points[points.length - 1].value)}
          </div>
        </div>
        {points.length > 1 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#9ca3af' }}>Change</div>
            <div style={{ 
              color: points[points.length - 1].value > points[0].value ? '#ef4444' : '#10b981',
              fontWeight: 'bold'
            }}>
              {points[points.length - 1].value > points[0].value ? '↑' : '↓'}
              {Math.abs(points[points.length - 1].value - points[0].value).toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export memoized version for performance
export default React.memo(SimpleLineGraph, (prevProps, nextProps) => {
  // Custom comparison - only re-render if data actually changed
  return (
    prevProps.title === nextProps.title &&
    prevProps.color === nextProps.color &&
    prevProps.height === nextProps.height &&
    prevProps.type === nextProps.type &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  )
})
