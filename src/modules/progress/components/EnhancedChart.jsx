// src/modules/progress/components/EnhancedChart.jsx
// 🏆 GOLD THEME
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { Trophy } from 'lucide-react'

export default function EnhancedChart({ 
  data, 
  dataKey, 
  color = '#FFD700', // GOLD default
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

  // Custom tooltip - GOLD
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null

    const point = payload[0].payload
    const value = point[dataKey]
    const isPR = showPRMarkers && prPoint && point.date === prPoint.date && point[dataKey] === prPoint[dataKey]

    return (
      <div style={{
        background: 'rgba(17, 17, 17, 0.98)',
        border: `1px solid ${color}35`,
        borderRadius: isMobile ? '8px' : '10px',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 4px 16px ${color}25`,
        minWidth: isMobile ? '110px' : '130px'
      }}>
        {/* Date */}
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '0.4rem',
          fontWeight: '600',
          letterSpacing: '0.01em'
        }}>
          {point.date}
        </div>

        {/* Value */}
        <div style={{
          fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: '800',
          color: color,
          marginBottom: isPR ? '0.4rem' : 0,
          letterSpacing: '-0.02em',
          textShadow: `0 0 12px ${color}35`,
          lineHeight: 1
        }}>
          {value}{unit}
        </div>

        {/* PR Badge */}
        {isPR && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: '#fbbf24',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Trophy size={isMobile ? 10 : 11} />
            Nieuwe PR!
          </div>
        )}

        {/* Previous comparison (if available) */}
        {point.previous && (
          <div style={{
            marginTop: '0.4rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Vorige: {point.previous}{unit}
            {point[dataKey] > point.previous && (
              <span style={{
                color: '#10b981',
                marginLeft: '0.35rem',
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
        height: isMobile ? '180px' : '260px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(23, 23, 23, 0.4)',
        borderRadius: isMobile ? '10px' : '12px',
        border: '1px solid rgba(255, 215, 0, 0.15)' // GOLD
      }}>
        <div style={{
          width: isMobile ? '28px' : '36px',
          height: isMobile ? '28px' : '36px',
          border: `3px solid rgba(255, 215, 0, 0.2)`, // GOLD
          borderTopColor: '#FFD700', // GOLD
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: isMobile ? '180px' : '260px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(23, 23, 23, 0.4)',
        borderRadius: isMobile ? '10px' : '12px',
        border: '1px solid rgba(255, 215, 0, 0.15)', // GOLD
        gap: isMobile ? '0.625rem' : '0.75rem'
      }}>
        <div style={{
          width: isMobile ? '44px' : '52px',
          height: isMobile ? '44px' : '52px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.12)', // GOLD
          border: '1px solid rgba(255, 215, 0, 0.25)', // GOLD
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: isMobile ? '1.4rem' : '1.6rem'
          }}>📊</span>
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Geen data beschikbaar
        </div>
        <div style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.35)',
          textAlign: 'center'
        }}>
          Log workouts om progressie te zien
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: isMobile ? '180px' : '260px',
      position: 'relative',
      marginBottom: isMobile ? '0.5rem' : '0.625rem'
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
            fontSize={isMobile ? 9 : 10}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
          />
          
          <YAxis 
            stroke="rgba(255, 255, 255, 0.3)"
            fontSize={isMobile ? 9 : 10}
            tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey={dataKey}
            stroke={color}
            strokeWidth={isMobile ? 2 : 2.5}
            fill={`url(#gradient-${dataKey})`}
            animationDuration={800}
            animationEasing="ease-out"
          />

          {/* PR Marker */}
          {showPRMarkers && prPoint && (
            <ReferenceDot
              x={prPoint.date}
              y={prPoint[dataKey]}
              r={isMobile ? 5 : 6}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))'
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* PR Label (if exists) */}
      {showPRMarkers && prPoint && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '8px' : '10px',
          right: isMobile ? '8px' : '10px',
          padding: isMobile ? '0.375rem 0.5rem' : '0.4rem 0.625rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.1) 100%)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: isMobile ? '6px' : '8px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.25rem' : '0.3rem',
          boxShadow: '0 2px 12px rgba(251, 191, 36, 0.15)'
        }}>
          <Trophy size={isMobile ? 11 : 12} color="#fbbf24" />
          <span style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: '700',
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 0 8px rgba(251, 191, 36, 0.35)'
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
