// src/modules/photos-8ch/components/FridayTracker.jsx
import React from 'react'
import { Calendar, Check, X, Star, Trophy, TrendingUp, Target, Zap } from 'lucide-react'

export default function FridayTracker({ progress, isMobile }) {
  const { fridaySets, photoCounts, totalPhotos, weeksWithPhotos, isCompliant, nextFriday } = progress
  const percentage = fridaySets.percentage || 0
  
  // Calculate days until next Friday
  const today = new Date()
  const next = new Date(nextFriday)
  const daysUntil = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  
  // Progress ring calculations
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: isMobile ? '1.5rem' : '2rem',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '120px 1fr',
        gap: isMobile ? '1rem' : '1.5rem',
        alignItems: 'center'
      }}>
        {/* Progress Ring */}
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '100px',
            height: '100px'
          }}>
            <svg
              width="100"
              height="100"
              style={{
                transform: 'rotate(-90deg)'
              }}
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={percentage >= 100 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#dc2626'}
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
            </svg>
            
            {/* Center content */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {fridaySets.completeSets}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                van 8
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div>
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            8-Week Challenge Progress
            {isCompliant && (
              <Trophy size={18} color="#10b981" />
            )}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.5rem' : '0.75rem',
            marginBottom: '0.75rem'
          }}>
            {/* Friday Sets */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '0.75rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Friday Sets
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: fridaySets.completeSets >= 8 ? '#10b981' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {fridaySets.completeSets}/8
                {fridaySets.completeSets >= 8 && <Check size={16} />}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '0.25rem'
              }}>
                Front + Side
              </div>
            </div>
            
            {/* Total Photos */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '0.75rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Totaal Photos
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {totalPhotos}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '0.25rem'
              }}>
                Alle types
              </div>
            </div>
            
            {/* Next Friday */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              padding: '0.75rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Volgende Vrijdag
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: daysUntil <= 1 ? '#dc2626' : 'white'
              }}>
                {daysUntil === 0 ? 'Vandaag!' : daysUntil === 1 ? 'Morgen' : `${daysUntil} dagen`}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '0.25rem'
              }}>
                Check-in dag
              </div>
            </div>
          </div>
          
          {/* Photo Type Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            {[
              { type: 'progress', count: photoCounts?.progress || 0, color: '#a855f7', label: 'Progress' },
              { type: 'meal', count: photoCounts?.meal || 0, color: '#10b981', label: 'Meals' },
              { type: 'workout', count: photoCounts?.workout || 0, color: '#f97316', label: 'Workouts' },
              { type: 'victory', count: photoCounts?.victory || 0, color: '#fbbf24', label: 'Victories' }
            ].map(item => (
              <div
                key={item.type}
                style={{
                  textAlign: 'center',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: `1px solid ${item.color}15`
                }}
              >
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: item.color
                }}>
                  {item.count}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '0.125rem'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Friday Calendar */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
              const hasSet = fridaySets.dates?.length >= week
              return (
                <div
                  key={week}
                  style={{
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
                    borderRadius: '8px',
                    background: hasSet
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(255,255,255,0.05)',
                    border: hasSet
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: hasSet ? 'white' : 'rgba(255,255,255,0.3)',
                    position: 'relative'
                  }}
                >
                  {hasSet ? (
                    <Check size={14} />
                  ) : (
                    week
                  )}
                  {hasSet && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '1px solid #0f172a'
                    }} />
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Compliance Status */}
          {fridaySets.completeSets >= 6 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: fridaySets.completeSets >= 8
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
              borderRadius: '8px',
              border: fridaySets.completeSets >= 8
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: fridaySets.completeSets >= 8 ? '#10b981' : '#f59e0b'
            }}>
              {fridaySets.completeSets >= 8 ? (
                <>
                  <Trophy size={16} />
                  Challenge Requirement Gehaald!
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Nog {8 - fridaySets.completeSets} sets nodig
                </>
              )}
            </div>
          )}
          
          {/* Motivational Message */}
          {fridaySets.completeSets < 8 && daysUntil === 0 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.1))',
              borderRadius: '8px',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: '#dc2626'
            }}>
              <Zap size={16} />
              Het is vrijdag! Upload vandaag je front & side photos voor week {fridaySets.completeSets + 1}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
