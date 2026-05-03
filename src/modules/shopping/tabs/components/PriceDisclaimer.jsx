// src/modules/shopping/tabs/components/PriceDisclaimer.jsx
import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function PriceDisclaimer({ isMobile }) {
  return (
    <div style={{
      marginBottom: isMobile ? '0.75rem' : '1rem',
      padding: isMobile ? '0.75rem' : '0.875rem',
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: isMobile ? '10px' : '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Shine overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      <AlertCircle 
        size={isMobile ? 16 : 18} 
        color="#f59e0b" 
        strokeWidth={2.5}
        style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} 
      />
      
      <div style={{
        fontSize: isMobile ? '0.75rem' : '0.8125rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
        lineHeight: 1.4,
        position: 'relative',
        zIndex: 1
      }}>
        Prijzen zijn geschat en kunnen variëren per supermarkt en locatie
      </div>
    </div>
  )
}
