// src/pages/checkout-components/GoldenOffersList.jsx
import { useState, useEffect } from 'react'

export default function GoldenOffersList({ offers, isMobile }) {
  const [visibleItems, setVisibleItems] = useState([])

  useEffect(() => {
    // Stagger animation
    offers.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index])
      }, 100 + (index * 80))
    })
  }, [offers])

  return (
    <div style={{
      marginBottom: isMobile ? '3rem' : '4rem'
    }}>
      {offers.map((offer, index) => {
        const Icon = offer.icon
        const isVisible = visibleItems.includes(index)
        
        return (
          <div
            key={index}
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.5s ease',
              padding: isMobile ? '1.25rem' : '1.5rem',
              marginBottom: isMobile ? '1rem' : '1.25rem',
              border: '1px solid rgba(212, 175, 55, 0.1)',
              background: offer.highlight ? 'rgba(212, 175, 55, 0.02)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '1rem' : '1.5rem'
            }}
          >
            {/* Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon 
                size={20} 
                color="rgba(212, 175, 55, 0.6)" 
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                color: '#D4AF37',
                marginBottom: '0.25rem'
              }}>
                {offer.title}
              </h3>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                color: 'rgba(212, 175, 55, 0.4)',
                lineHeight: '1.4',
                margin: 0
              }}>
                {offer.description}
              </p>
            </div>

            {/* Price */}
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: 'rgba(212, 175, 55, 0.3)',
              textDecoration: 'line-through',
              textAlign: 'right'
            }}>
              {offer.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}
