// src/modules/qualification-funnel/components/LandingStep.jsx
import { ArrowRight } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

export default function LandingStep({ onNext, isMobile }) {
  return (
    <div style={commonStyles.container(isMobile)}>
      
      {/* Background glow effect */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Gold line */}
        <div style={{
          ...commonStyles.goldLine,
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }} />
        
        {/* Main headline */}
        <h1 style={{
          fontSize: isMobile ? '2.5rem' : '4rem',
          fontWeight: '800',
          color: funnelTheme.textPrimary,
          marginBottom: isMobile ? '1.5rem' : '2rem',
          lineHeight: '1.1',
          letterSpacing: '-0.03em'
        }}>
          Dit is{' '}
          <span style={{
            ...commonStyles.goldText,
            display: 'inline'
          }}>
            niet
          </span>
          {' '}voor iedereen.
        </h1>
        
        {/* Subtext */}
        <p style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          color: funnelTheme.textSecondary,
          lineHeight: '1.6',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          MY ARC is voor mannen die klaar zijn om te stoppen met excuses en binnen{' '}
          <span style={{ color: funnelTheme.gold, fontWeight: '600' }}>90 dagen</span>
          {' '}hun beste vorm ooit te bereiken.
        </p>
        
        {/* Promise line */}
        <p style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          color: funnelTheme.textMuted,
          marginBottom: isMobile ? '2.5rem' : '3rem',
          fontStyle: 'italic'
        }}>
          Geen bullshit. Geen shortcuts.{' '}
          <span style={{ color: funnelTheme.textPrimary, fontWeight: '600' }}>
            100% geld terug als je faalt.
          </span>
        </p>
        
        {/* CTA Button */}
        <button
          onClick={onNext}
          style={commonStyles.goldButton(isMobile)}
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
          Ik ben serieus
          <ArrowRight size={20} />
        </button>
        
        {/* Bottom subtle text */}
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: funnelTheme.textMuted,
          marginTop: isMobile ? '2rem' : '2.5rem',
          opacity: 0.6
        }}>
          Alleen voor mannen die écht willen veranderen
        </p>
      </div>
      
      {/* Bottom decorative line */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '1.5rem' : '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '40px',
        height: '1px',
        background: funnelTheme.borderGold
      }} />
    </div>
  )
}
