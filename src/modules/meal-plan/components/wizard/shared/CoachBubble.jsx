// src/modules/meal-plan/components/wizard/shared/CoachBubble.jsx
// ULTRA-COMPACT Speech bubble met Kersten foto + coach bericht

import { COACH_INFO } from '../utils/wizardData'

export default function CoachBubble({ message, variant = 'default' }) {
  const isMobile = window.innerWidth <= 768
  
  // Variant colors
  const variants = {
    default: {
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      border: 'rgba(16, 185, 129, 0.3)',
      glow: '0 4px 12px rgba(16, 185, 129, 0.15)'
    },
    info: {
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
      border: 'rgba(59, 130, 246, 0.3)',
      glow: '0 4px 12px rgba(59, 130, 246, 0.15)'
    },
    warning: {
      bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
      border: 'rgba(249, 115, 22, 0.3)',
      glow: '0 4px 12px rgba(249, 115, 22, 0.15)'
    }
  }
  
  const currentVariant = variants[variant] || variants.default
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '0.75rem' : '1rem',
      padding: '0',
      marginBottom: '0'
    }}>
      {/* Kersten Photo - COMPACT */}
      <div style={{
        position: 'relative',
        flexShrink: 0
      }}>
        <div style={{
          width: isMobile ? '44px' : '52px',
          height: isMobile ? '44px' : '52px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #10b981',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          background: '#000',
          transform: 'translateZ(0)'
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
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement.innerHTML = `
                <div style="
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isMobile ? '1.25rem' : '1.5rem'};
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                ">
                  👨‍💼
                </div>
              `
            }}
          />
        </div>
        
        {/* Active indicator dot - KLEINER */}
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#10b981',
          border: '2px solid #000',
          boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)'
        }} />
      </div>
      
      {/* Speech Bubble - COMPACT */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: isMobile ? '100%' : 'auto'
      }}>
        {/* Speech bubble arrow - KLEINER */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            left: '-6px',
            top: '12px',
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: `6px solid ${currentVariant.border}`
          }} />
        )}
        
        {/* Bubble content - COMPACT */}
        <div style={{
          background: currentVariant.bg,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${currentVariant.border}`,
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
          boxShadow: currentVariant.glow,
          transform: 'translateZ(0)'
        }}>
          {/* Coach name badge - COMPACT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.375rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {COACH_INFO.name}
            </span>
            <div style={{
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)'
            }} />
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '500'
            }}>
              {COACH_INFO.role}
            </span>
          </div>
          
          {/* Coach message - COMPACT */}
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.925rem',
            lineHeight: '1.5',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0,
            fontWeight: '500'
          }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
