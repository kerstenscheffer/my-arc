// src/modules/progress-photos/components/ChallengeTracker.jsx
import React from 'react'
import { Calendar, Check, Trophy, TrendingUp, AlertCircle } from 'lucide-react'

export default function ChallengeTracker({ 
  challengeData, 
  isMobile = false 
}) {
  const {
    completedWeeks = 0,
    totalWeeks = 8,
    percentage = 0,
    isCompliant = false,
    nextFriday = '',
    daysUntilFriday = 0,
    completedDates = [],
    currentWeek = 1
  } = challengeData || {}

  // Progress ring calculations
  const radius = isMobile ? 40 : 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '1.5rem' : '2rem',
      marginBottom: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '140px 1fr',
        gap: isMobile ? '1.5rem' : '2rem',
        alignItems: 'center'
      }}>
        {/* Progress Ring */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: isMobile ? '100px' : '120px',
            height: isMobile ? '100px' : '120px'
          }}>
            <svg
              width={isMobile ? '100' : '120'}
              height={isMobile ? '100' : '120'}
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx={isMobile ? '50' : '60'}
                cy={isMobile ? '50' : '60'}
                r={radius}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx={isMobile ? '50' : '60'}
                cy={isMobile ? '50' : '60'}
                r={radius}
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.5s ease'
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
                fontSize: isMobile ? '1.75rem' : '2rem',
                fontWeight: 'bold'
              }}>
                {completedWeeks}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.9
              }}>
                van 8
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            8-Week Challenge
            {isCompliant && <Trophy size={24} />}
          </h2>

          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            opacity: 0.9,
            marginBottom: '1.5rem'
          }}>
            Upload elke vrijdag je front & side progress foto's
          </p>

          {/* Week Indicators */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
              const isCompleted = week <= completedWeeks
              const isCurrent = week === currentWeek
              
              return (
                <div
                  key={week}
                  style={{
                    width: isMobile ? '36px' : '42px',
                    height: isMobile ? '36px' : '42px',
                    borderRadius: '10px',
                    background: isCompleted
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.15)',
                    border: isCurrent ? '2px solid white' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: isCompleted ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    week
                  )}
                  {isCurrent && !isCompleted && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 0 0 2px #3b82f6'
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                marginBottom: '0.25rem'
              }}>
                Progress
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {percentage}%
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                marginBottom: '0.25rem'
              }}>
                Volgende
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {daysUntilFriday === 0 ? 'Vandaag!' : 
                 daysUntilFriday === 1 ? 'Morgen' : 
                 `${daysUntilFriday} dagen`}
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '10px',
              padding: '0.75rem',
              textAlign: 'center',
              gridColumn: isMobile ? 'span 2' : 'span 1'
            }}>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                marginBottom: '0.25rem'
              }}>
                Status
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}>
                {isCompliant ? (
                  <>
                    <Check size={16} />
                    Compliant
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Week {currentWeek}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Friday Alert */}
          {daysUntilFriday === 0 && completedWeeks < 8 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#3b82f6'
            }}>
              <AlertCircle size={18} />
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Het is vrijdag! Upload vandaag je progress foto's voor week {currentWeek}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
