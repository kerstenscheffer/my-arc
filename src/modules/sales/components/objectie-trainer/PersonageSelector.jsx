// src/modules/sales/components/objectie-trainer/PersonageSelector.jsx
// Component om personage te selecteren voor objectie training

import { User, Briefcase, Dumbbell, Brain } from 'lucide-react'
import { SALES_THEME } from '../../SalesSection'

const PERSONAGE_ICONS = {
  tim: Briefcase,
  mark: Dumbbell,
  jasper: Brain
}

export default function PersonageSelector({ personages, onSelect, isMobile }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Kies Je Lead
        </h3>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Elk personage heeft een unieke situatie en objectie
        </p>
      </div>

      {/* Personage Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {personages.map(personage => {
          const Icon = PERSONAGE_ICONS[personage.id] || User
          
          return (
            <button
              key={personage.id}
              onClick={() => onSelect(personage)}
              style={{
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: `1px solid ${SALES_THEME.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = SALES_THEME.primary
                e.currentTarget.style.boxShadow = `0 8px 24px ${SALES_THEME.glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = SALES_THEME.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Background Emoji */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                fontSize: '80px',
                opacity: 0.05,
                pointerEvents: 'none'
              }}>
                {personage.emoji}
              </div>

              {/* Icon & Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? '44px' : '48px',
                  height: isMobile ? '44px' : '48px',
                  borderRadius: '10px',
                  background: `${SALES_THEME.background}`,
                  border: `1px solid ${SALES_THEME.border}`
                }}>
                  <Icon size={isMobile ? 20 : 24} color={SALES_THEME.primary} />
                </div>

                <div>
                  <div style={{
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.125rem'
                  }}>
                    {personage.naam}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {personage.leeftijd} jaar
                  </div>
                </div>
              </div>

              {/* Doel */}
              <div style={{
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  fontWeight: '600'
                }}>
                  Doel
                </div>
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {personage.doel}
                </div>
              </div>

              {/* Struggle Preview */}
              <div style={{
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  fontWeight: '600'
                }}>
                  Struggle
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.4'
                }}>
                  {personage.struggles[0]}
                </div>
              </div>

              {/* Objectie Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                background: `${SALES_THEME.background}`,
                border: `1px solid ${SALES_THEME.border}`,
                borderRadius: '20px'
              }}>
                <span style={{ fontSize: '0.875rem' }}>
                  {personage.emoji}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '700',
                  color: SALES_THEME.primary
                }}>
                  {personage.objectieTekst.substring(0, 20)}...
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
