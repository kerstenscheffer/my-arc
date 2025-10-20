import React from 'react'

export default function CTAEditFields({ 
  content, 
  onChange, 
  isMobile 
}) {
  return (
    <div style={{ 
      width: '100%',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>
        CTA Page Editor
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.6)' }}>
        Coming soon - Edit CTA content and QR code
      </p>
    </div>
  )
}
