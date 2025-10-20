// src/client/components/challenge-banner/MoneyBackProgress.jsx
import { Trophy, CheckCircle } from 'lucide-react'

export default function MoneyBackProgress({ isMobile, requirements, isEligible, theme }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      borderRadius: isMobile ? '12px' : '14px',
      padding: isMobile ? '1rem' : '1.25rem',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isEligible ? theme.border : 'rgba(255, 255, 255, 0.05)'}`,
      marginBottom: isMobile ? '1rem' : '1.25rem',
      boxShadow: isEligible ? `0 8px 30px ${theme.primary}20` : 'none'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Trophy 
            size={isMobile ? 14 : 16} 
            color={isEligible ? theme.primary : 'rgba(255, 255, 255, 0.5)'} 
          />
          <span style={{ 
            color: isEligible ? theme.primary : 'rgba(255, 255, 255, 0.7)', 
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            filter: isEligible ? `drop-shadow(0 0 10px ${theme.primary}30)` : 'none'
          }}>
            Money Back Voortgang
          </span>
        </div>
        <span style={{ 
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '800',
          color: isEligible ? theme.primary : '#fff',
          filter: isEligible ? `drop-shadow(0 0 12px ${theme.primary}30)` : 'none'
        }}>
          {requirements.completedCount}/5
        </span>
      </div>
      
      <div style={{
        height: '8px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '0.75rem',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${(requirements.completedCount / 5) * 100}%`,
          background: isEligible 
            ? theme.gradient
            : 'linear-gradient(90deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
            animation: 'shine 2s infinite'
          }} />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ 
          color: 'rgba(255, 215, 0, 0.5)', 
          fontSize: isMobile ? '0.75rem' : '0.8rem'
        }}>
          {requirements.daysRemaining} dagen resterend
        </span>
        {isEligible && (
          <span style={{ 
            color: theme.primary, 
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            filter: `drop-shadow(0 0 10px ${theme.primary}30)`
          }}>
            <CheckCircle size={14} strokeWidth={2.5} />
            Unlocked!
          </span>
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
