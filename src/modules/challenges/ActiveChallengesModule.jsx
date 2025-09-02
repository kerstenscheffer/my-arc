import { useState } from 'react'
import { Target, ChevronRight, Plus, ArrowRight, Zap, Trophy, Activity, Clock, Flame } from 'lucide-react'

const THEME = {
  primary: '#dc2626',
  gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(185, 28, 28, 0.05) 100%)',
  borderColor: 'rgba(220, 38, 38, 0.1)',
  borderActive: 'rgba(220, 38, 38, 0.15)'
}

export default function ActiveChallengesModule({ 
  activeChallenges = [], 
  onChallengeClick, 
  onScrollToPicker 
}) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const isMobile = window.innerWidth <= 768

  const getProgressColor = (progress) => {
    if (progress >= 75) return '#10b981'
    if (progress >= 50) return '#f59e0b'
    return '#dc2626'
  }

  const getProgressGradient = (progress) => {
    if (progress >= 75) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    if (progress >= 50) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    return THEME.gradient
  }

  const renderActiveCard = (challenge, index) => {
    const isHovered = hoveredCard === challenge.id
    const progress = challenge.progress || 0
    const progressColor = getProgressColor(progress)
    
    return (
      <div 
        key={challenge.id} 
        style={{
          background: isHovered
            ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(135deg, rgba(17, 17, 17, 0.4) 0%, rgba(17, 17, 17, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${isHovered ? THEME.borderActive : 'rgba(255, 255, 255, 0.06)'}`,
          borderRadius: '16px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 25px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          transform: isHovered ? 'translateY(-2px)' : 'translateZ(0)'
        }}
        onClick={() => onChallengeClick && onChallengeClick(challenge)}
        onMouseEnter={() => setHoveredCard(challenge.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Progress Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: getProgressGradient(progress),
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${progressColor}40`
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem'
        }}>
          {/* Left Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: getProgressGradient(progress),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                <Activity size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {challenge.title}
              </h3>
            </div>
            
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              marginBottom: '0.75rem'
            }}>
              {challenge.description || `Dag ${challenge.day_number || 1} van ${challenge.duration_days || 30}`}
            </p>

            {/* Stats Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {challenge.streak > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Flame size={14} color="#f59e0b" />
                  <span style={{
                    color: 'rgba(245, 158, 11, 0.9)',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '600'
                  }}>
                    {challenge.streak} dagen
                  </span>
                </div>
              )}
              
              {challenge.points_earned > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Trophy size={14} color="#3b82f6" />
                  <span style={{
                    color: 'rgba(147, 197, 253, 0.9)',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: '600'
                  }}>
                    {challenge.points_earned} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Progress Circle */}
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            position: 'relative'
          }}>
            <svg
              width={isMobile ? '56' : '64'}
              height={isMobile ? '56' : '64'}
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx={isMobile ? '28' : '32'}
                cy={isMobile ? '28' : '32'}
                r={isMobile ? '24' : '28'}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2.5"
              />
              <circle
                cx={isMobile ? '28' : '32'}
                cy={isMobile ? '28' : '32'}
                r={isMobile ? '24' : '28'}
                fill="none"
                stroke={progressColor}
                strokeWidth="2.5"
                strokeDasharray={`${2 * Math.PI * (isMobile ? 24 : 28)}`}
                strokeDashoffset={`${2 * Math.PI * (isMobile ? 24 : 28) * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ 
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 4px ${progressColor}40)`
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: 'bold',
                color: progressColor
              }}>
                {progress}%
              </div>
            </div>
          </div>
        </div>

        {/* Current Milestone */}
        {challenge.current_milestone && (
          <div style={{
            marginTop: '1rem',
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={14} color="rgba(255,255,255,0.5)" />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255,255,255,0.7)'
              }}>
                {challenge.current_milestone}
              </span>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.4rem' : '1.6rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.95)',
          margin: 0,
          letterSpacing: '-0.01em'
        }}>
          Actieve Challenges
        </h2>
        
        {activeChallenges.length === 0 && (
          <button
            onClick={onScrollToPicker}
            style={{
              padding: isMobile ? '0.6rem 1.25rem' : '0.75rem 1.5rem',
              background: THEME.gradient,
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transform: 'translateZ(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 38, 38, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Start Challenge
          </button>
        )}
      </div>

      {activeChallenges.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 2rem' : '4rem 3rem',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.4) 0%, rgba(17, 17, 17, 0.6) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Zap size={48} color={THEME.primary} style={{ 
            marginBottom: '1.25rem',
            filter: `drop-shadow(0 4px 12px ${THEME.primary}40)`
          }} />
          <h3 style={{
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.01em'
          }}>
            Geen actieve challenges
          </h3>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '2rem',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            maxWidth: '400px',
            margin: '0 auto 2rem'
          }}>
            Start je eerste challenge en begin vandaag je transformatie journey
          </p>
          <button
            onClick={onScrollToPicker}
            style={{
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              background: THEME.gradient,
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 15px 35px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateZ(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 20px 45px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(220, 38, 38, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <ArrowRight size={18} strokeWidth={2.5} />
            Kies je Challenge
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {activeChallenges.map((challenge, index) => renderActiveCard(challenge, index))}
        </div>
      )}
    </div>
  )
}
