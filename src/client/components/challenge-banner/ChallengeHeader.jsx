// src/client/components/challenge-banner/ChallengeHeader.jsx
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ChallengeHeader({ 
  isMobile, 
  isEligible, 
  requirements, 
  challengeData, 
  expanded, 
  onToggleExpand,
  theme 
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isMobile ? '1.25rem' : '1.5rem'
    }}>
      <div>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: '900',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          background: theme.gradient,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          animation: 'shimmer 6s ease-in-out infinite',
          filter: `drop-shadow(0 0 20px ${theme.primary}40)`
        }}>
          8-Week Challenge
        </h1>
        <p style={{
          color: 'rgba(255, 215, 0, 0.7)',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          letterSpacing: '0.01em',
          filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
        }}>
          {isEligible 
            ? '✨ Money Back Eligible!'
            : `${requirements.completedCount}/5 requirements voltooid`}
        </p>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {challengeData && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: isMobile ? '10px' : '12px',
            padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.border}`
          }}>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 215, 0, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '0.25rem'
            }}>
              Dag
            </div>
            <div style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '800',
              color: theme.primary,
              lineHeight: 1,
              filter: `drop-shadow(0 0 8px ${theme.primary}40)`
            }}>
              {requirements.currentDay}/56
            </div>
          </div>
        )}
        
        <button
          onClick={onToggleExpand}
          style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.border}`,
            borderRadius: isMobile ? '10px' : '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)'
            e.currentTarget.style.borderColor = theme.primary
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
            e.currentTarget.style.borderColor = theme.border
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
            }
          }}
        >
          {expanded ? (
            <ChevronUp size={isMobile ? 20 : 22} color={theme.secondary} />
          ) : (
            <ChevronDown size={isMobile ? 20 : 22} color={theme.secondary} />
          )}
        </button>
      </div>
    </div>
  )
}
