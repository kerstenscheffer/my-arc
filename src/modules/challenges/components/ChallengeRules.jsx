// src/modules/challenges/components/ChallengeRules.jsx
// Challenge Rules Component
// Kersten - 28 Augustus 2025

import { CheckCircle } from 'lucide-react'

export default function ChallengeRules({ rules, isMobile, theme }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <CheckCircle size={20} color={theme.primary} />
        Regels & Voorwaarden
      </h3>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        border: `1px solid ${theme.borderColor}`,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {rules.map((rule, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: index < rules.length - 1 ? '1rem' : 0,
              color: 'rgba(255,255,255,0.85)',
              fontSize: isMobile ? '0.95rem' : '1rem',
              lineHeight: 1.6
            }}>
              <CheckCircle 
                size={18} 
                color="#10b981" 
                style={{ 
                  marginTop: '2px', 
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
                }} 
              />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
