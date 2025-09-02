import React from 'react'

export default function WidgetContainer({ 
  title, 
  icon, 
  children, 
  onAction, 
  actionLabel = "View Details",
  color = "#10b981",
  loading = false,
  className = ""
}) {
  const isMobile = window.innerWidth <= 768

  return (
    <div 
      className={`widget-container ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: isMobile ? '16px' : '20px',
        border: `1px solid ${color}20`,
        padding: isMobile ? '1rem' : '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onAction ? 'pointer' : 'default',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={onAction}
      onMouseEnter={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = `${color}40`
          e.currentTarget.style.boxShadow = `0 10px 25px ${color}25`
        }
      }}
      onMouseLeave={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = `${color}20`
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
      onTouchStart={(e) => {
        if (onAction && isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
          e.currentTarget.style.borderColor = `${color}40`
        }
      }}
      onTouchEnd={(e) => {
        if (onAction && isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = `${color}20`
        }
      }}
    >
      {/* Gradient accent border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
        borderRadius: '20px 20px 0 0'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {icon && (
            <div style={{
              width: isMobile ? '20px' : '24px',
              height: isMobile ? '20px' : '24px',
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </div>
          )}
          <h3 style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </h3>
        </div>

        {onAction && (
          <div style={{
            fontSize: '0.75rem',
            color: color,
            opacity: 0.8,
            fontWeight: '500'
          }}>
            {actionLabel} →
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `2px solid ${color}30`,
              borderTopColor: color,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: '60px',
        height: '60px',
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        borderRadius: '50%',
        zIndex: 0
      }} />

      <style>{`
        .widget-container {
          transform: translateZ(0);
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
