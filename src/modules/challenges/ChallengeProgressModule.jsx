import useIsMobile from '../../hooks/useIsMobile'
import React from 'react';
import { Target, Flame, Calendar, TrendingUp } from 'lucide-react';

export default function ChallengeProgressModule({ activeChallenges = [], onSelectChallenge }) {
  const isMobile = useIsMobile();
  
  // Demo data if no active challenges
  const challenges = activeChallenges.length > 0 ? activeChallenges : [
    {
      id: '1',
      name: 'Speed Demon 5K',
      category: 'fitness',
      progress: 65,
      streak: 7,
      daysLeft: 12,
      totalDays: 30
    },
    {
      id: '2',
      name: 'Schoon 30',
      category: 'voeding',
      progress: 40,
      streak: 4,
      daysLeft: 18,
      totalDays: 30
    }
  ];
  
  const getCategoryColor = (category) => ({
    fitness: '#dc2626',
    voeding: '#ef4444',
    mindset: '#f87171',
    transformatie: '#b91c1c'
  }[category] || '#ef4444');
  
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: '600'
        }}>
          ACTIEVE CHALLENGES
        </h3>
        <span style={{
          fontSize: '0.75rem',
          color: '#ef4444',
          fontWeight: '600'
        }}>
          {challenges.length} actief
        </span>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        {challenges.map(challenge => (
          <div
            key={challenge.id}
            onClick={() => onSelectChallenge && onSelectChallenge(challenge)}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.25rem'
                }}>
                  {challenge.name}
                </h4>
                <span style={{
                  fontSize: '0.7rem',
                  color: getCategoryColor(challenge.category),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600'
                }}>
                  {challenge.category}
                </span>
              </div>
              
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${getCategoryColor(challenge.category)}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: getCategoryColor(challenge.category)
                }}>
                  {challenge.progress}%
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${challenge.progress}%`,
                  background: `linear-gradient(90deg, ${getCategoryColor(challenge.category)} 0%, ${getCategoryColor(challenge.category)}dd 100%)`,
                  transition: 'width 0.5s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
            
            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.25rem'
                }}>
                  <Flame size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {challenge.streak}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Streak
                </div>
              </div>
              
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.25rem'
                }}>
                  <Calendar size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {challenge.daysLeft}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Dagen
                </div>
              </div>
              
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.25rem'
                }}>
                  <TrendingUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    +2%
                  </span>
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Week
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
