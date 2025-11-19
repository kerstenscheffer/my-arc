// src/modules/meal-plan/components/consumed-meals/EmptyState.jsx
// ✅ PREMIUM v1.0 - Empty State Display
// 🎯 Shows when no meals are logged for selected day
import React from 'react'
import { Utensils } from 'lucide-react'

export default function EmptyState({ isMobile, isToday }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '14px',
      padding: isMobile ? '2rem 1rem' : '2.5rem 1.5rem',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
    }}>
      <div style={{
        width: isMobile ? '48px' : '56px',
        height: isMobile ? '48px' : '56px',
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 0.875rem',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
      }}>
        <Utensils 
          size={isMobile ? 22 : 26} 
          color="#10b981"
          style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' }}
        />
      </div>
      
      <div style={{
        fontSize: isMobile ? '1rem' : '1.125rem',
        fontWeight: '800',
        color: '#10b981',
        marginBottom: '0.375rem',
        letterSpacing: '-0.01em'
      }}>
        Nog geen maaltijden gelogd
      </div>
      
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
        lineHeight: 1.4
      }}>
        {isToday 
          ? 'Log je eerste maaltijd van vandaag'
          : 'Er zijn nog geen maaltijden gelogd op deze dag'
        }
      </div>
    </div>
  )
}
