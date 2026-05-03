// src/modules/qualification-funnel/components/CommitmentStep.jsx
import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

export default function CommitmentStep({ onNext, onExit, isMobile }) {
  const [showExit, setShowExit] = useState(false)

  const handleYes = () => {
    onNext({ committed: true })
  }

  const handleNo = () => {
    if (onExit) onExit()
    setShowExit(true)
  }

  // Exit screen for people who aren't ready
  if (showExit) {
    return (
      <div style={commonStyles.container(isMobile)}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* X icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '0',
            border: `2px solid ${funnelTheme.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: isMobile ? '2rem' : '2.5rem'
          }}>
            <X size={40} color={funnelTheme.textMuted} />
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '800',
            color: funnelTheme.textPrimary,
            marginBottom: isMobile ? '1rem' : '1.5rem',
            lineHeight: '1.2',
            letterSpacing: '-0.02em'
          }}>
            Dan is dit niet voor jou.
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: funnelTheme.textSecondary,
            lineHeight: '1.6',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }}>
            MY ARC werkt alleen voor mensen die 100% committed zijn. 
            Dat is geen zwakte — het is eerlijkheid.
          </p>
          
          <div style={{
            width: '60px',
            height: '1px',
            background: funnelTheme.borderGold,
            margin: '0 auto',
            marginBottom: isMobile ? '1.5rem' : '2rem'
          }} />
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: funnelTheme.textMuted,
            marginBottom: isMobile ? '2rem' : '2.5rem'
          }}>
            Kom terug als je{' '}
            <span style={{ color: funnelTheme.gold, fontWeight: '600' }}>
              écht ready
            </span>
            {' '}bent.
          </p>
          
          {/* Back button */}
          <button
            onClick={() => setShowExit(false)}
            style={{
              background: 'transparent',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              borderRadius: '0',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: funnelTheme.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderGold
              e.currentTarget.style.color = funnelTheme.gold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderSubtle
              e.currentTarget.style.color = funnelTheme.textSecondary
            }}
          >
            Wacht, ik ben toch serieus
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={commonStyles.container(isMobile)}>
      
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
          <span style={{
            fontSize: '0.75rem',
            color: funnelTheme.gold,
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Stap 2 van 3
          </span>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
        </div>
        
        {/* Question */}
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '800',
          color: funnelTheme.textPrimary,
          marginBottom: isMobile ? '1rem' : '1.5rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Ben je bereid om 90 dagen{' '}
          <span style={commonStyles.goldText}>
            ALLES
          </span>
          {' '}te geven?
        </h2>
        
        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          color: funnelTheme.textMuted,
          marginBottom: isMobile ? '2.5rem' : '3rem',
          lineHeight: '1.5'
        }}>
          Geen halve commitments. Geen "ik probeer het wel".<br />
          Alles of niets.
        </p>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* Yes button */}
          <button
            onClick={handleYes}
            style={{
              ...commonStyles.goldButton(isMobile),
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = funnelTheme.shadowGoldStrong
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = funnelTheme.shadowGold
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Ja, ik ben er klaar voor
            <ArrowRight size={20} />
          </button>
          
          {/* No button */}
          <button
            onClick={handleNo}
            style={{
              background: 'transparent',
              border: `1px solid ${funnelTheme.borderSubtle}`,
              borderRadius: '0',
              padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '500',
              color: funnelTheme.textMuted,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.color = funnelTheme.textSecondary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = funnelTheme.borderSubtle
              e.currentTarget.style.color = funnelTheme.textMuted
            }}
          >
            Weet ik niet zeker
          </button>
        </div>
      </div>
    </div>
  )
}
