// src/pages/checkout-components/GoldenPriceDisplay.jsx
export default function GoldenPriceDisplay({ totalValue, actualPrice, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '2rem' : '2.5rem',
      background: 'rgba(212, 175, 55, 0.02)',
      border: '1px solid rgba(212, 175, 55, 0.15)',
      textAlign: 'center',
      marginBottom: isMobile ? '3rem' : '4rem'
    }}>
      <p style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        color: 'rgba(212, 175, 55, 0.5)',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Totale waarde
      </p>
      
      <div style={{
        fontSize: isMobile ? '2.5rem' : '3.5rem',
        fontWeight: '800',
        color: 'rgba(212, 175, 55, 0.3)',
        textDecoration: 'line-through',
        marginBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>
        €{totalValue}
      </div>

      <p style={{
        fontSize: isMobile ? '1rem' : '1.25rem',
        color: 'rgba(212, 175, 55, 0.6)',
        marginBottom: '1.5rem'
      }}>
        Maar niet voor jou...
      </p>

      {/* Actual price */}
      <div style={{
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(212, 175, 55, 0.08)'
      }}>
        <p style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '600',
          color: 'rgba(212, 175, 55, 0.8)',
          marginBottom: '1rem'
        }}>
          Jouw investering
        </p>
        
        <div style={{
          fontSize: isMobile ? '3rem' : '4rem',
          fontWeight: '800',
          color: '#D4AF37',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          €{actualPrice}
        </div>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(212, 175, 55, 0.4)'
        }}>
          eenmalig • 8 weken programma
        </p>
      </div>
    </div>
  )
}
