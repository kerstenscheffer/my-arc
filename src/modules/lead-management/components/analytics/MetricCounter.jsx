import { Plus, Minus, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function MetricCounter({ metric, totalSent, onIncrement, onDecrement, onDelete, isMobile }) {
  const [isHovered, setIsHovered] = useState(false)

  // Calculate rate
  const rate = totalSent > 0 ? ((metric.metric_value / totalSent) * 100).toFixed(1) : 0

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `${metric.metric_color}08`,
        border: `1px solid ${metric.metric_color}30`,
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Metric Name + Rate */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: metric.metric_color,
            boxShadow: `0 0 10px ${metric.metric_color}`
          }} />
          <h4 style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            {metric.metric_name}
          </h4>
        </div>
        
        {/* Rate Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.35rem 0.75rem',
          background: `${metric.metric_color}20`,
          border: `1px solid ${metric.metric_color}40`,
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: metric.metric_color
        }}>
          {rate}% rate
        </div>
      </div>

      {/* Counter + Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* Minus Button */}
        <button
          onClick={onDecrement}
          disabled={metric.metric_value <= 0}
          style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '10px',
            background: metric.metric_value <= 0 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(239, 68, 68, 0.15)',
            border: metric.metric_value <= 0 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(239, 68, 68, 0.3)',
            color: metric.metric_value <= 0 ? 'rgba(255, 255, 255, 0.3)' : '#ef4444',
            cursor: metric.metric_value <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (metric.metric_value > 0) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (metric.metric_value > 0) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <Minus size={isMobile ? 18 : 20} />
        </button>

        {/* Counter Display */}
        <div style={{
          minWidth: isMobile ? '60px' : '80px',
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          background: `${metric.metric_color}20`,
          border: `1px solid ${metric.metric_color}40`,
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: metric.metric_color
          }}>
            {metric.metric_value}
          </span>
        </div>

        {/* Plus Button */}
        <button
          onClick={onIncrement}
          style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '10px',
            background: `${metric.metric_color}20`,
            border: `1px solid ${metric.metric_color}40`,
            color: metric.metric_color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${metric.metric_color}30`
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${metric.metric_color}20`
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Plus size={isMobile ? 18 : 20} />
        </button>

        {/* Delete Button (alleen tonen bij hover op desktop) */}
        {(isHovered || isMobile) && (
          <button
            onClick={onDelete}
            style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Trash2 size={isMobile ? 16 : 18} />
          </button>
        )}
      </div>
    </div>
  )
}
