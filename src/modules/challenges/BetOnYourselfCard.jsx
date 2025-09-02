import { useState, useEffect } from 'react'
import { Target, CheckCircle, Zap, DollarSign, TrendingUp } from 'lucide-react'
import ChallengeService from '../../services/ChallengeService'

const THEME = {
  primary: '#dc2626',
  gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(185, 28, 28, 0.05) 100%)',
  borderColor: 'rgba(220, 38, 38, 0.15)',
  borderActive: 'rgba(220, 38, 38, 0.25)',
  boxShadow: '0 20px 40px rgba(220, 38, 38, 0.15)',
  success: '#10b981',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
}

export default function BetOnYourselfCard({ clientId }) {
  // Dynamic data from ChallengeService
  const [completedChallenges, setCompletedChallenges] = useState(0)
  const [activeChallenges, setActiveChallenges] = useState(0) 
  const [balance, setBalance] = useState(97)
  const [moneyBackProgress, setMoneyBackProgress] = useState({ 
    completed: 0, 
    required: 3, 
    daysLeft: 72, 
    eligible: false 
  })

  const isMobile = window.innerWidth <= 768

  // Load data when clientId changes
  useEffect(() => {
    if (clientId) {
      loadChallengeData()
    }
  }, [clientId])

  const loadChallengeData = async () => {
    try {
      const stats = await ChallengeService.getChallengeStats(clientId)
      
      setCompletedChallenges(stats.completed)
      setActiveChallenges(stats.active)
      setBalance(Math.round(stats.currentBalance))
      
      setMoneyBackProgress({
        completed: stats.completed,
        required: 3,
        daysLeft: 72, // TODO: Calculate real days left
        eligible: stats.completed >= 3
      })
      
    } catch (error) {
      console.error('❌ Failed to load challenge data:', error)
    }
  }

  const progressPercentage = Math.min(100, (moneyBackProgress.completed / moneyBackProgress.required) * 100)
  const isEligible = moneyBackProgress.completed >= moneyBackProgress.required

  return (
    <div style={{
      background: isEligible 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.9) 100%)'
        : 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.85) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: isMobile ? '1.5rem' : '2rem',
      borderRadius: isMobile ? '16px' : '20px',
      marginBottom: isMobile ? '1.25rem' : '1.5rem',
      border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
      boxShadow: isEligible 
        ? '0 25px 50px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : '0 25px 50px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}>
      
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: `radial-gradient(circle at top right, ${isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.15)'} 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              background: isEligible 
                ? 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%)'
                : 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1
            }}>
              Bet On Yourself
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '500',
              letterSpacing: '0.01em'
            }}>
              Voltooi 3 challenges • 100% geld terug
            </p>
          </div>
          
          <div style={{
            width: isMobile ? '48px' : '56px',
            height: isMobile ? '48px' : '56px',
            background: isEligible ? THEME.successGradient : THEME.gradient,
            borderRadius: isMobile ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transform: 'translateZ(0)',
            minHeight: '44px',
            minWidth: '44px'
          }}>
            <Target size={isMobile ? 22 : 26} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          
          {/* Completed */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem 0.75rem' : '1.25rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            minHeight: '44px',
            touchAction: 'manipulation'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
            }
          }}>
            <CheckCircle size={isMobile ? 14 : 16} color="#fff" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem',
              lineHeight: 1
            }}>
              {completedChallenges}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600'
            }}>
              Voltooid
            </p>
          </div>

          {/* Active */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem 0.75rem' : '1.25rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            minHeight: '44px',
            touchAction: 'manipulation'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
            }
          }}>
            <Zap size={isMobile ? 14 : 16} color="#fff" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem',
              lineHeight: 1
            }}>
              {activeChallenges}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600'
            }}>
              Actief
            </p>
          </div>

          {/* Balance */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem 0.75rem' : '1.25rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            minHeight: '44px',
            touchAction: 'manipulation'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
            }
          }}>
            <DollarSign size={isMobile ? 14 : 16} color="#fff" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem',
              lineHeight: 1
            }}>
              €{balance}
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600'
            }}>
              Balans
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '1rem' : '1.25rem',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
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
              <TrendingUp size={isMobile ? 14 : 16} color="rgba(255,255,255,0.5)" />
              <span style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600'
              }}>
                Geld Terug Voortgang
              </span>
            </div>
            <span style={{ 
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              {moneyBackProgress.completed}/{moneyBackProgress.required}
            </span>
          </div>
          
          {/* Progress Bar */}
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
              width: `${progressPercentage}%`,
              background: isEligible 
                ? THEME.successGradient
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
          
          {/* Bottom Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: isMobile ? '0.75rem' : '0.8rem'
            }}>
              {moneyBackProgress.daysLeft} dagen resterend
            </span>
            {isEligible && (
              <span style={{ 
                color: '#10b981', 
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                <CheckCircle size={14} strokeWidth={2.5} />
                Unlocked!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}
