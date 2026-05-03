// src/modules/sales/components/objectie-trainer/ContextRecap.jsx
// Component om voorgesprek context te tonen voor objectie

import { Target, AlertCircle, TrendingDown, XCircle } from 'lucide-react'
import { SALES_THEME } from '../../SalesSection'

export default function ContextRecap({ personage, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${SALES_THEME.border}`,
      borderRadius: '12px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        paddingBottom: '1rem',
        borderBottom: `1px solid ${SALES_THEME.border}`
      }}>
        <div style={{
          fontSize: '2rem'
        }}>
          {personage.emoji}
        </div>
        <div>
          <h4 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.125rem'
          }}>
            {personage.naam} ({personage.leeftijd})
          </h4>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Voorgesprek Context
          </div>
        </div>
      </div>

      {/* Context Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Doel */}
        <ContextSection
          icon={Target}
          iconColor="#10b981"
          label="Doel"
          content={personage.doel}
          subtext={`Waarom: ${personage.waarom}`}
          isMobile={isMobile}
        />

        {/* Struggles */}
        <ContextSection
          icon={AlertCircle}
          iconColor="#f59e0b"
          label="Struggles"
          content={personage.struggles}
          isMobile={isMobile}
          isList
        />

        {/* Impact */}
        <ContextSection
          icon={TrendingDown}
          iconColor="#ef4444"
          label="Impact"
          content={personage.impact}
          isMobile={isMobile}
        />

        {/* Consequenties */}
        <ContextSection
          icon={XCircle}
          iconColor="#8b5cf6"
          label="Als Niks Doet"
          content={personage.consequenties}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}

function ContextSection({ icon: Icon, iconColor, label, content, subtext, isList, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0.875rem' : '1rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.625rem'
      }}>
        <Icon size={16} color={iconColor} />
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '700',
          color: iconColor,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
      </div>

      {isList ? (
        <ul style={{
          margin: 0,
          paddingLeft: '1.25rem',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.6'
        }}>
          {content.slice(0, 2).map((item, idx) => (
            <li key={idx} style={{ marginBottom: '0.25rem' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.5'
        }}>
          {content}
        </div>
      )}

      {subtext && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontStyle: 'italic'
        }}>
          {subtext}
        </div>
      )}
    </div>
  )
}
