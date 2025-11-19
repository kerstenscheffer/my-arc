// src/pages/checkout-components/GoldenGuarantees.jsx
import { useState } from 'react'

export default function GoldenGuarantees({ guarantees, isMobile }) {
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
    <div style={{
      marginBottom: isMobile ? '3rem' : '4rem',
      width: '100%'
    }}>
      {/* Section header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2.5rem' : '2.5rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '700',
          color: '#D4AF37',
          marginBottom: '0.5rem',
          letterSpacing: '-0.01em'
        }}>
          3 IJzersterke Garanties
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(212, 175, 55, 0.4)'
        }}>
          Je kunt letterlijk niet verliezen
        </p>
      </div>

      {/* Guarantee cards */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '2rem' : '1.5rem',
        width: '100%'
      }}>
        {guarantees.map((guarantee, index) => {
          const Icon = guarantee.icon
          const isHovered = hoveredCard === index
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                flex: 1,
                padding: isMobile ? '2rem 1.5rem' : '1.75rem',
                border: `1px solid rgba(212, 175, 55, ${isHovered ? '0.25' : '0.15'})`,
                background: isHovered ? 'rgba(212, 175, 55, 0.03)' : 'rgba(212, 175, 55, 0.01)',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minWidth: 0
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#D4AF37',
                padding: '0.3rem 0.8rem',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '700',
                color: '#000',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap'
              }}>
                {guarantee.badge}
              </div>

              {/* Icon */}
              <div style={{
                width: isMobile ? '56px' : '50px',
                height: isMobile ? '56px' : '50px',
                margin: '0 auto 1.25rem',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon 
                  size={isMobile ? 28 : 24} 
                  color="rgba(212, 175, 55, 0.7)"
                />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.125rem',
                fontWeight: '700',
                color: '#D4AF37',
                marginBottom: '0.5rem',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {guarantee.title}
              </h3>

              {/* Subtitle */}
              <p style={{
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '600',
                color: 'rgba(212, 175, 55, 0.6)',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {guarantee.subtitle}
              </p>

              {/* Description */}
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.875rem',
                color: 'rgba(212, 175, 55, 0.4)',
                lineHeight: '1.6',
                textAlign: 'center',
                margin: 0
              }}>
                {guarantee.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Bottom text */}
      <div style={{
        textAlign: 'center',
        marginTop: isMobile ? '2.5rem' : '2.5rem',
        padding: isMobile ? '1.5rem 1rem' : '1.75rem',
        border: '1px solid rgba(212, 175, 55, 0.08)',
        background: 'rgba(212, 175, 55, 0.01)'
      }}>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          color: 'rgba(212, 175, 55, 0.7)',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Geen kleine lettertjes. Geen gedoe.
        </p>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(212, 175, 55, 0.4)',
          margin: 0
        }}>
          100% risico-vrij • Direct starten • Volledige support
        </p>
      </div>
    </div>
  )
}
