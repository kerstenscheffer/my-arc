// ========================================
// 📁 src/funnel/five-pilar/components/AnimatedButton.jsx
// CTA with animated rotating gradient border
// Uses spinning div approach (works all browsers)
// ========================================
import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function AnimatedButton({
  text = 'Begin Nu',
  subText = null,
  subUrgent = false,
  onClick,
  isMobile = false,
  icon = 'arrow',
  size = 'normal',
  fullWidth = false,
  style: customStyle = {}
}) {
  const [isHovered, setIsHovered] = useState(false)

  const isLarge = size === 'large'
  const padding = isLarge
    ? (isMobile ? '1.125rem 2.5rem' : '1.375rem 3rem')
    : (isMobile ? '1rem 2rem' : '1.25rem 2.5rem')
  const fontSize = isLarge
    ? (isMobile ? '1.1rem' : '1.25rem')
    : (isMobile ? '1rem' : '1.125rem')
  const radius = isLarge ? '16px' : '14px'
  const innerRadius = isLarge ? '14px' : '12px'

  return (
    <div
      style={{
        position: 'relative',
        display: fullWidth ? 'block' : 'inline-block',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 30px rgba(255, 186, 9, 0.25), 0 0 60px rgba(255, 186, 9, 0.08)'
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
        padding: '2px',
        background: 'rgba(255, 186, 9, 0.15)',
        ...customStyle
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => isMobile && setIsHovered(true)}
      onTouchEnd={() => isMobile && setTimeout(() => setIsHovered(false), 200)}
      onClick={onClick}
    >
      {/* Spinning gradient - the magic */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200%',
        height: '200%',
        background: 'conic-gradient(from 0deg, #ffba09, rgba(255, 186, 9, 0.05) 25%, transparent 35%, transparent 65%, rgba(212, 160, 6, 0.05) 75%, #d4a006, #ffba09)',
        animation: 'spinGradient 3.5s linear infinite',
        transformOrigin: 'center center',
        opacity: isHovered ? 0.9 : 0.4,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none'
      }} />

      {/* Inner button surface */}
      <button
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255, 186, 9, 0.08) 0%, rgba(8, 8, 8, 0.98) 100%)'
            : 'rgba(8, 8, 8, 0.98)',
          borderRadius: innerRadius,
          border: 'none',
          padding: padding,
          fontSize: fontSize,
          fontWeight: '700',
          color: isHovered ? '#ffba09' : '#d4a006',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.625rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          letterSpacing: '0.01em',
          overflow: 'hidden'
        }}
      >
        {/* Top shine */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '50%',
          background: `linear-gradient(180deg, rgba(255, 186, 9, ${isHovered ? '0.06' : '0.02'}) 0%, transparent 100%)`,
          pointerEvents: 'none',
          borderRadius: `${innerRadius} ${innerRadius} 0 0`,
          transition: 'background 0.3s ease'
        }} />

        {icon === 'sparkles' && (
          <Sparkles size={isMobile ? 16 : 18} style={{ position: 'relative', zIndex: 1 }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: subText ? '0.35rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span>{text}</span>
            {icon === 'arrow' && (
              <ArrowRight
                size={isMobile ? 18 : 20}
                style={{
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                }}
              />
            )}
          </div>
          {subText && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '700',
              color: subUrgent ? '#ef4444' : 'rgba(255, 186, 9, 0.5)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              <span style={{
                width: '5px', height: '5px',
                borderRadius: '50%',
                background: subUrgent ? '#ef4444' : '#10b981',
                animation: 'blink 1.5s infinite',
                display: 'inline-block',
                boxShadow: `0 0 6px ${subUrgent ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'}`
              }} />
              {subText}
            </div>
          )}
        </div>
      </button>

      <style>{`
        @keyframes spinGradient {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
