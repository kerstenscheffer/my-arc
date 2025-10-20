// src/modules/progress/components/HeroInsightCard.jsx
import { Award, ChevronRight } from 'lucide-react'

export default function HeroInsightCard({ insight, onClick, isMobile }) {
  if (!insight) return null

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${insight.color}30 0%, ${insight.color}15 50%, rgba(23, 23, 23, 0.8) 100%)`,
        backdropFilter: 'blur(20px)',
        border: `2px solid ${insight.color}50`,
        borderRadius: isMobile ? '16px' : '20px',
        padding: 0,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 10px 40px ${insight.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        marginBottom: isMobile ? '1rem' : '1.25rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
          e.currentTarget.style.boxShadow = `0 20px 60px ${insight.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = `0 10px 40px ${insight.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
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
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${insight.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'blur(2px)'
      }} />

      {/* Animated Glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${insight.color}40 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'pulse 3s ease-in-out infinite'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        padding: isMobile ? '1.5rem' : '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          alignSelf: 'flex-start',
          padding: '0.4rem 0.75rem',
          background: `${insight.color}25`,
          border: `1px solid ${insight.color}40`,
          borderRadius: '20px',
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          fontWeight: '900',
          color: insight.color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: `0 0 20px ${insight.color}30`
        }}>
          <Award size={isMobile ? 12 : 14} />
          {insight.badge}
        </div>

        {/* Title & Text */}
        <div>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '900',
            color: '#fff',
            marginBottom: '0.5rem',
            lineHeight: '1.2',
            textShadow: `0 2px 20px ${insight.color}60`
          }}>
            {insight.title}
          </div>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            {insight.subtitle}
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5',
            fontStyle: 'italic'
          }}>
            {insight.message}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
          background: `${insight.color}20`,
          border: `1px solid ${insight.color}40`,
          borderRadius: '12px',
          alignSelf: 'flex-start'
        }}>
          <span style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '700',
            color: insight.color
          }}>
            Bekijk volledige progressie
          </span>
          <ChevronRight size={isMobile ? 18 : 20} color={insight.color} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
