import React, { useState } from 'react'
import { Calendar } from 'lucide-react'

export default function RedCTAButton({ 
  onClick, 
  text = "Plan Je Vervolgtraject", 
  icon = Calendar,
  isMobile,
  fullWidth = false,
  variant = 'primary' // 'primary' or 'secondary'
}) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = icon

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      style={{
        backgroundImage: isHovered 
          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
          : variant === 'primary'
            ? 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(220, 38, 38, 0.15) 50%, #000000 60%, #0a0a0a 100%)'
            : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(220, 38, 38, 0.08) 100%)',
        backgroundSize: '200% 100%',
        backgroundPosition: isHovered ? '0% 50%' : '100% 50%',
        backgroundColor: 'transparent',
        border: isHovered 
          ? '2px solid #dc2626'
          : variant === 'primary'
            ? '2px solid rgba(220, 38, 38, 0.4)'
            : '2px solid rgba(220, 38, 38, 0.3)',
        borderRadius: '20px',
        padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
        fontSize: isMobile ? '1.125rem' : '1.25rem',
        fontWeight: '800',
        color: isHovered ? '#fff' : '#ef4444',
        cursor: 'pointer',
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 25px 50px rgba(220, 38, 38, 0.5), 0 0 120px rgba(220, 38, 38, 0.4), 0 0 60px rgba(153, 27, 27, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.2)'
          : variant === 'primary'
            ? '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 80px rgba(220, 38, 38, 0.25), 0 0 40px rgba(153, 27, 27, 0.2), inset 0 1px 0 rgba(220, 38, 38, 0.1)'
            : '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 60px rgba(220, 38, 38, 0.2), 0 0 30px rgba(153, 27, 27, 0.15)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        position: 'relative',
        overflow: 'hidden',
        textShadow: isHovered 
          ? '0 2px 4px rgba(0, 0, 0, 0.3)'
          : '0 0 20px rgba(220, 38, 38, 0.5)'
      }}
    >
      {/* Extra rode glow layer */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        background: isHovered
          ? 'none'
          : 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
        opacity: isHovered ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none'
      }} />

      {/* Bewegende glans effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-30%',
        width: '50%',
        height: '200%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
        transform: 'rotate(35deg)',
        animation: isHovered ? 'glide 2s ease-in-out infinite' : 'glide 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Extra sparkle effect */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: '4px',
        height: '4px',
        background: '#fff',
        borderRadius: '50%',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
        animation: 'sparkle 3s ease-in-out infinite',
        opacity: isHovered ? 1 : 0.6,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '20%',
        width: '3px',
        height: '3px',
        background: '#ef4444',
        borderRadius: '50%',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.9)',
        animation: 'sparkle 3s ease-in-out infinite 1.5s',
        opacity: isHovered ? 1 : 0.5,
        pointerEvents: 'none'
      }} />
      
      {/* Icon met extra glow */}
      {Icon && (
        <Icon 
          size={isMobile ? 22 : 26} 
          style={{ 
            color: isHovered ? '#fff' : '#ef4444',
            position: 'relative',
            zIndex: 1,
            filter: isHovered 
              ? 'none'
              : 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))'
          }} 
        />
      )}
      
      {/* Text met glow */}
      <span style={{ 
        position: 'relative', 
        zIndex: 1,
        filter: isHovered 
          ? 'none'
          : 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))'
      }}>
        {text}
      </span>

      {/* CSS Animations */}
      <style>{`
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0);
          }
          50% { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </button>
  )
}
