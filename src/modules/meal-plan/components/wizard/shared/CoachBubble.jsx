// src/modules/meal-plan/components/wizard/shared/CoachBubble.jsx
// Speech bubble met Kersten foto + coach bericht

import { COACH_INFO } from '../utils/wizardData'

export default function CoachBubble({ message, variant = 'default' }) {
  const isMobile = window.innerWidth <= 768
  
  // Variant colors
  const variants = {
    default: {
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      border: 'rgba(16, 185, 129, 0.3)',
      glow: '0 8px 25px rgba(16, 185, 129, 0.2)'
    },
    info: {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: '0 8px 25px rgba(59, 130, 246, 0.2)'
    },
    warning: {
      bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
      border: 'rgba(249, 115, 22, 0.3)',
      glow: '0 8px 25px rgba(249, 115, 22, 0.2)'
    }
  }
  
  const currentVariant = variants[variant] || variants.default
  
  return (
    <div style={{
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? '0.875rem' : '1.25rem',
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1.5rem' : '2rem',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Kersten Photo */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        alignSelf: isMobile ? 'center' : 'flex-start'
      }}>
        <div style={{
          width: isMobile ? '60px' : '80px',
          height: isMobile ? '60px' : '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #10b981',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
          background: '#000',
          
          // Hardware acceleration
          transform: 'translateZ(0)',
          transition: 'all 0.3s ease'
        }}>
          <img 
            src={COACH_INFO.photoUrl}
            alt={COACH_INFO.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback bij image load error
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement.innerHTML = `
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isMobile ? '1.5rem' : '2rem'};
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                ">
                  👨‍💼
                </div>
              `
            }}
          />
        </div>
        
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          animation: 'pulse-ring 2s ease-out infinite',
          pointerEvents: 'none'
        }} />
        
        {/* Active indicator dot */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#10b981',
          border: '2px solid #000',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
      </div>
      
      {/* Speech Bubble */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: isMobile ? '100%' : 'auto'
      }}>
        {/* Speech bubble arrow - only on desktop */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            left: '-8px',
            top: '20px',
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: `8px solid ${currentVariant.border}`,
          }} />
        )}
        
        {/* Bubble content */}
        <div style={{
          background: currentVariant.bg,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${currentVariant.border}`,
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
          boxShadow: currentVariant.glow,
          
          // Hardware acceleration
          transform: 'translateZ(0)',
          transition: 'all 0.3s ease'
        }}>
          {/* Coach name badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.625rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {COACH_INFO.name}
            </span>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)'
            }} />
            <span style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              {COACH_INFO.role}
            </span>
          </div>
          
          {/* Coach message */}
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            fontWeight: '500'
          }}>
            {message}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}
