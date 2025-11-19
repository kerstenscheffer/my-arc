// src/modules/progress/components/RegularInsightCard.jsx
export default function RegularInsightCard({ insight, onClick, isMobile }) {
  const Icon = insight.icon
  const isClickable = insight.exercise && insight.metric
  
  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${insight.color}25`,
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: `0 2px 12px ${insight.color}15, inset 0 1px 0 rgba(255, 255, 255, 0.02)`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isMobile && isClickable) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 4px 16px ${insight.color}25`
          e.currentTarget.style.borderColor = `${insight.color}40`
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile && isClickable) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 2px 12px ${insight.color}15`
          e.currentTarget.style.borderColor = `${insight.color}25`
        }
      }}
      onTouchStart={(e) => {
        if (isMobile && isClickable) {
          e.currentTarget.style.transform = 'scale(0.98)'
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile && isClickable) {
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${insight.color} 50%, transparent 100%)`,
        opacity: 0.4
      }} />
      
      {/* Header: Icon + Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.625rem'
      }}>
        <div style={{
          width: isMobile ? '32px' : '36px',
          height: isMobile ? '32px' : '36px',
          borderRadius: '8px',
          background: `${insight.color}15`,
          border: `1px solid ${insight.color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={isMobile ? 15 : 16} color={insight.color} style={{ opacity: 0.9 }} />
        </div>
        
        <div style={{
          background: `${insight.color}15`,
          border: `1px solid ${insight.color}25`,
          borderRadius: '6px',
          padding: isMobile ? '0.25rem 0.4rem' : '0.3rem 0.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: insight.color,
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {insight.badge}
          </span>
        </div>
      </div>
      
      {/* Title */}
      <div style={{
        fontSize: isMobile ? '0.9rem' : '0.975rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '0.375rem',
        lineHeight: 1.2
      }}>
        {insight.title}
      </div>
      
      {/* Subtitle */}
      {insight.subtitle && (
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: insight.color,
          fontWeight: '600',
          marginBottom: '0.5rem',
          opacity: 0.8
        }}>
          {insight.subtitle}
        </div>
      )}
      
      {/* Message */}
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.65)',
        lineHeight: 1.4
      }}>
        {insight.message}
      </div>
    </div>
  )
}
