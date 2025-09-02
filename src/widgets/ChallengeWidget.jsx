import React, { useState } from 'react'
import { Trophy, Target, Clock, ChevronRight } from 'lucide-react'

export default function ChallengeWidget({ client, db, onNavigate }) {
  const [challengeData, setChallengeData] = useState({
    completedChallenges: 0,
    activeChallenges: [],
    moneyBackEligible: true,
    daysRemaining: 90
  })
  const [loading, setLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isMobile = window.innerWidth <= 768

  const widgetConfig = {
    key: 'challenges',
    gradient: 'linear-gradient(135deg, rgba(185, 28, 28, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)',
    color: '#ef4444',
    label: 'Money Back Guarantee'
  }

  React.useEffect(() => {
    loadChallengeData()
  }, [client?.id, db])

  const loadChallengeData = async () => {
    if (!client?.id || !db) return

    try {
      setLoading(true)
      
      // Load challenge data - using safe fallbacks
      const [completed, active] = await Promise.allSettled([
        db.getCompletedChallenges?.(client.id) || [],
        db.getActiveChallenges?.(client.id) || []
      ])

      const completedCount = completed.status === 'fulfilled' ? (completed.value?.length || 0) : 0
      const activeList = active.status === 'fulfilled' ? (active.value || []) : []
      
      // Calculate days remaining (mock calculation)
      const enrollmentDate = new Date(client.created_at || Date.now())
      const daysPassed = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, 90 - daysPassed)

      setChallengeData({
        completedChallenges: completedCount,
        activeChallenges: activeList,
        moneyBackEligible: completedCount < 3 && daysRemaining > 0,
        daysRemaining
      })
    } catch (error) {
      console.error('Error loading challenge data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = () => {
    return Math.min(100, (challengeData.completedChallenges / 3) * 100)
  }

  const getProgressColor = () => {
    const progress = getProgressPercentage()
    if (progress >= 100) return '#10b981' // Green - completed
    if (progress >= 66) return '#f59e0b'  // Orange - close
    return '#ef4444' // Red - needs work
  }

  const getStatusMessage = () => {
    const { completedChallenges, daysRemaining, moneyBackEligible } = challengeData
    
    if (completedChallenges >= 3) {
      return "Geld terug gegarandeerd!"
    }
    
    if (!moneyBackEligible) {
      return "Geld terug periode verlopen"
    }
    
    const needed = 3 - completedChallenges
    return `Nog ${needed} challenge${needed > 1 ? 's' : ''} voor geld terug`
  }

  const getActiveChallengeName = () => {
    if (challengeData.activeChallenges.length === 0) return "Start je eerste challenge"
    return challengeData.activeChallenges[0]?.title || "Actieve challenge"
  }

  return (
    <button
      onClick={() => onNavigate?.('challenges')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? widgetConfig.gradient : widgetConfig.lightGradient,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isHovered ? widgetConfig.color + '40' : 'rgba(239, 68, 68, 0.15)'}`,
        borderRadius: '16px',
        padding: isMobile ? '1.25rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? `0 15px 40px ${widgetConfig.color}25` 
          : `0 10px 30px rgba(0, 0, 0, 0.1)`,
        minHeight: '140px',
        width: '100%',
        display: 'block'
      }}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)'
          e.currentTarget.style.background = widgetConfig.gradient
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = widgetConfig.lightGradient
        }
      }}
    >
      {/* Decorative circle background */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: widgetConfig.gradient,
        opacity: 0.1
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Category-style label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Trophy size={16} color={widgetConfig.color} />
          <span style={{ 
            fontSize: '0.7rem', 
            color: widgetConfig.color,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Zero Risk Challenge
          </span>
        </div>

        {/* Main content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.35rem',
              lineHeight: 1.2
            }}>
              {getStatusMessage()}
            </div>
            
            <div style={{
              fontSize: '0.75rem',
              color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
              lineHeight: 1.4,
              marginBottom: '0.25rem'
            }}>
              {getActiveChallengeName()}
            </div>

            {challengeData.moneyBackEligible && (
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Clock size={12} />
                <span>{challengeData.daysRemaining} dagen over</span>
              </div>
            )}
          </div>

          {/* Progress Ring */}
          <div style={{
            position: 'relative',
            width: isMobile ? '50px' : '54px',
            height: isMobile ? '50px' : '54px'
          }}>
            <svg width="100%" height="100%" viewBox="0 0 42 42">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={getProgressColor()}
                strokeWidth="2"
                strokeDasharray={`${getProgressPercentage()} ${100 - getProgressPercentage()}`}
                strokeDashoffset="25"
                transform="rotate(-90 21 21)"
                style={{ 
                  transition: 'stroke-dasharray 0.5s ease',
                  animation: isHovered ? 'ringPulse 0.6s ease' : 'none'
                }}
              />
            </svg>
            
            {/* Center text */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: getProgressColor(),
                lineHeight: 1
              }}>
                {challengeData.completedChallenges}/3
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem'
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.6)'
          }}>
            {challengeData.completedChallenges >= 3 
              ? 'Gefeliciteerd! 100% geld terug' 
              : 'Complete 3 challenges in 90 dagen'
            }
          </div>
          <ChevronRight 
            size={16} 
            color={isHovered ? '#fff' : widgetConfig.color}
            style={{ 
              opacity: isHovered ? 0.9 : 0.7,
              transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
              transition: 'all 0.3s ease'
            }} 
          />
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0% { transform: rotate(-90deg) scale(1); }
          50% { transform: rotate(-90deg) scale(1.05); }
          100% { transform: rotate(-90deg) scale(1); }
        }
      `}</style>
    </button>
  )
}
