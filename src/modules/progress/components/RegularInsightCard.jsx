// src/modules/progress/components/RegularInsightCard.jsx
import { ChevronRight } from 'lucide-react'

export default function RegularInsightCard({ insight, onClick, isMobile }) {
  const Icon = insight.icon

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${insight.color}25 0%, ${insight.color}10 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${insight.color}40`,
        borderRadius: isMobile ? '14px' : '16px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 20px ${insight.color}20`,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.boxShadow = `0 8px 30px ${insight.color}30`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = `0 4px 20px ${insight.color}20`
        }
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
      {/* Top Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${insight.color} 50%, transparent 100%)`,
        opacity: 0.8
      }} />

      {/* Badge */}
      {insight.badge && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.75rem' : '1rem',
          right: isMobile ? '0.75rem' : '1rem',
          padding: '0.25rem 0.5rem',
          background: `${insight.color}20`,
          border: `1px solid ${insight.color}30`,
          borderRadius: '12px',
          fontSize: '0.6rem',
          fontWeight: '800',
          color: insight.color,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          {insight.badge}
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        borderRadius: '14px',
        background: `${insight.color}20`,
        border: `1px solid ${insight.color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        boxShadow: `0 0 25px ${insight.color}30`
      }}>
        <Icon 
          size={isMobile ? 26 : 30} 
          color={insight.color}
          style={{
            filter: `drop-shadow(0 0 10px ${insight.color}60)`
          }}
        />
      </div>

      {/* Content */}
      <div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.4rem',
          letterSpacing: '-0.02em'
        }}>
          {insight.title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '500',
          marginBottom: '0.75rem'
        }}>
          {insight.subtitle}
        </div>
        {insight.message && (
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.4',
            fontStyle: 'italic',
            marginBottom: '1rem'
          }}>
            {insight.message}
          </div>
        )}

        {/* CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: insight.color,
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700'
        }}>
          <span>Bekijk nu</span>
          <ChevronRight size={isMobile ? 14 : 16} />
        </div>
      </div>
    </div>
  )
}
