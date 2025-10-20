// src/modules/progress/components/EnhancedChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { Trophy } from 'lucide-react'

export default function EnhancedChart({ 
  data, 
  dataKey, 
  color = '#f97316',
  unit = '',
  loading = false,
  showPRMarkers = false
}) {
  const isMobile = window.innerWidth <= 768

  // Find PR (highest value)
  let prPoint = null
  if (showPRMarkers && data && data.length > 0) {
    prPoint = data.reduce((max, point) => 
      point[dataKey] > (max?.[dataKey] || 0) ? point : max
    , null)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null

    const point = payload[0].payload
    const value = point[dataKey]
    const isPR = showPRMarkers && prPoint && point.date === prPoint.date && point[dataKey] === prPoint[dataKey]

    return (
      <div style={{
        background: 'rgba(17, 17, 17, 0.98)',
        border: `1px solid ${color}40`,
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 4px 20px ${color}30`,
        minWidth: isMobile ? '120px' : '140px'
      }}>
        {/* Date */}
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '0.5rem',
          fontWeight: '600'
        }}>
          {point.date}
        </div>

        {/* Value */}
        <div style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '800',
          color: color,
          marginBottom: isPR ? '0.5rem' : 0,
          letterSpacing: '-0.02em',
          textShadow: `0 0 15px ${color}40`
        }}>
          {value}{unit}
        </div>

        {/* PR Badge */}
        {isPR && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: '#fbbf24',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Trophy size={isMobile ? 11 : 12} />
            Nieuwe PR!
          </div>
        )}

        {/* Previous comparison (if available) */}
        {point.previous && (
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Vorige: {point.previous}{unit}
            {point[dataKey] > point.previous && (
              <span style={{
                color: '#10b981',
                marginLeft: '0.4rem',
                fontWeight: '700'
              }}>
                +{(point[dataKey] - point.previous).toFixed(1)}{unit}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        height: isMobile ? '200px' : '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(23, 23, 23, 0.4)',
        borderRadius: '12px'
      }}>
        <div style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          border: `3px solid ${color}30`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: isMobile ? '200px' : '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(23, 23, 23, 0.4)',
        borderRadius: '12px',
        gap: '0.75rem'
      }}>
        <div style={{
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '50%',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem'
          }}>📊</span>
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Geen data beschikbaar
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.3)',
          textAlign: 'center'
        }}>
          Log workouts om progressie te zien
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: isMobile ? '200px' : '280px',
      position: 'relative'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.05)" 
            vertical={false}
          />
          
          <XAxis 
            dataKey="date" 
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={isMobile ? 10 : 11}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
          />
          
          <YAxis 
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={isMobile ? 10 : 11}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#gradient-${dataKey})`}
            animationDuration={800}
            animationEasing="ease-out"
          />

          {/* PR Marker */}
          {showPRMarkers && prPoint && (
            <ReferenceDot
              x={prPoint.date}
              y={prPoint[dataKey]}
              r={isMobile ? 6 : 7}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))'
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* PR Label (if exists) */}
      {showPRMarkers && prPoint && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          boxShadow: '0 4px 15px rgba(251, 191, 36, 0.2)'
        }}>
          <Trophy size={isMobile ? 12 : 14} color="#fbbf24" />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(251, 191, 36, 0.4)'
          }}>
            PR: {prPoint[dataKey]}{unit}
          </span>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
