
// src/modules/shopping/tabs/BuilderTab.jsx
import React from 'react'
import { Sparkles } from 'lucide-react'

export default function BuilderTab() {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem',
        border: '1px solid rgba(236, 72, 153, 0.3)'
      }}>
        <Sparkles size={40} color="#ec4899" />
      </div>
      
      <h2 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '1rem'
      }}>
        Custom Builder Komt Eraan!
      </h2>
      
      <p style={{
        fontSize: isMobile ? '1rem' : '1.125rem',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '1.5rem',
        lineHeight: 1.6,
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        Bouw je eigen perfecte boodschappenlijst met swipe interface, 
        barcode scanner en persoonlijke favorieten.
      </p>
      
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '2rem'
      }}>
        {['Swipe Interface', 'Barcode Scanner', 'Favorieten', 'Smart Search'].map(feature => (
          <div
            key={feature}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(236, 72, 153, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              color: '#ec4899',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            {feature}
          </div>
        ))}
      </div>
    </div>
  )
} 
