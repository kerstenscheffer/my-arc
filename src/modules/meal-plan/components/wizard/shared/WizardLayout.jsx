// src/modules/meal-plan/components/wizard/shared/WizardLayout.jsx
import React from 'react'

export default function WizardLayout({
  children,
  coachMessage,
  title,
  subtitle,
  isMobile
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1.5rem' : '2rem',
      alignItems: isMobile ? 'stretch' : 'flex-start'
    }}>
      {/* Coach Avatar Section */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 280px',
        order: isMobile ? -1 : 0
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          position: 'sticky',
          top: isMobile ? '0' : '2rem'
        }}>
          {/* Coach Avatar Placeholder */}
          <div style={{
            width: '100%',
            aspectRatio: '1',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
          }}>
            👨‍🍳
          </div>

          {/* Coach Name */}
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            Kersten
          </div>

          {/* Speech Bubble */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1rem',
            position: 'relative',
            marginTop: '1rem'
          }}>
            {/* Speech bubble arrow */}
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid rgba(255, 255, 255, 0.05)'
            }} />

            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              margin: 0
            }}>
              {coachMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={{
        flex: 1,
        minWidth: 0
      }}>
        {title && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.5rem',
              lineHeight: 1.2
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0
              }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
