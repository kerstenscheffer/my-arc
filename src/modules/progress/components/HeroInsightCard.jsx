// src/modules/progress/components/HeroInsightCard.jsx
export default function HeroInsightCard({ insight, onClick, isMobile }) {
  const Icon = insight.icon
  
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height: isMobile ? '180px' : '220px',
        borderRadius: isMobile ? '14px' : '16px',
        overflow: 'hidden',
        border: `2px solid ${insight.color}40`,
        boxShadow: `0 6px 24px ${insight.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
        background: '#000',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 10px 32px ${insight.color}45`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 6px 24px ${insight.color}30`
        }
      }}
      onTouchStart={(e) => {
        if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
      }}
      onTouchEnd={(e) => {
        if (isMobile) e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Background Image */}
      {insight.image && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${insight.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      )}
      
      {/* Top vignette */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        pointerEvents: 'none'
      }} />
      
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '75%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Badge - Top Left */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '0.75rem' : '1rem',
        left: isMobile ? '0.75rem' : '1rem',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(23, 23, 23, 0.8) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${insight.color}40`,
        borderRadius: '8px',
        padding: isMobile ? '0.375rem 0.5rem' : '0.4rem 0.625rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        boxShadow: `0 4px 16px ${insight.color}30, 0 0 0 1px rgba(0,0,0,0.5)`,
        zIndex: 10
      }}>
        <Icon size={isMobile ? 11 : 12} color={insight.color} />
        <span style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: insight.color
        }}>
          {insight.badge}
        </span>
      </div>
      
      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '1rem' : '1.25rem',
        zIndex: 3
      }}>
        {/* Info Container */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${insight.color}30`,
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem' : '0.875rem',
          boxShadow: `0 4px 16px ${insight.color}20, inset 0 1px 0 ${insight.color}05`
        }}>
          {/* Title */}
          <div style={{
            fontSize: isMobile ? '1.05rem' : '1.25rem',
            fontWeight: '800',
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '0.375rem',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            {insight.title}
          </div>
          
          {/* Subtitle */}
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: insight.color,
            fontWeight: '700',
            marginBottom: '0.5rem',
            opacity: 0.9
          }}>
            {insight.subtitle}
          </div>
          
          {/* Message */}
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.4
          }}>
            {insight.message}
          </div>
        </div>
      </div>
      
      {/* Top accent glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${insight.color} 50%, transparent 100%)`,
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 4
      }} />
    </div>
  )
}
