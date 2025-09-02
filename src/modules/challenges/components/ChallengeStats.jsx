// src/modules/challenges/components/ChallengeStats.jsx
// Challenge Statistics Component
// Kersten - 28 Augustus 2025

import { Calendar, TrendingUp } from 'lucide-react'

export default function ChallengeStats({ 
  challenge, 
  getDifficultyColor, 
  getDifficultyLabel, 
  isMobile, 
  theme 
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: isMobile ? '1rem' : '1.25rem',
      marginBottom: '2.5rem'
    }}>
      {[
        { 
          icon: Calendar, 
          value: challenge.duration_weeks || 4, 
          label: 'Weken', 
          color: theme.primary 
        },
        { 
          icon: TrendingUp, 
          value: getDifficultyLabel(challenge.difficulty), 
          label: 'Niveau', 
          color: getDifficultyColor(challenge.difficulty) 
        }
      ].map((stat, index) => (
        <div 
          key={index} 
          style={{
            background: theme.backgroundGradient,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '16px',
            textAlign: 'center',
            border: `1px solid ${theme.borderColor}`,
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            animation: `slideInUp ${400 + (index * 100)}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: 0,
            animationFillMode: 'forwards'
          }}
        >
          <stat.icon 
            size={isMobile ? 24 : 28} 
            color={stat.color} 
            style={{ marginBottom: '0.75rem' }} 
          />
          <div style={{ 
            color: '#fff', 
            fontWeight: '700', 
            fontSize: isMobile ? '1.25rem' : '1.4rem',
            marginBottom: '0.25rem'
          }}>
            {stat.value}
          </div>
          <div style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '0.85rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {stat.label}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInUp {
          from { 
            transform: translateY(20px); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  )
}
