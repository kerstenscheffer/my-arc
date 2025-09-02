import React, { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Clock, CheckCircle, Award, Zap } from 'lucide-react';

// Mini widget voor op elke pagina
export function ChallengeWidget({ activeChallenge, position = 'bottom-right' }) {
  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (!activeChallenge) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(activeChallenge.end_date);
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Challenge Complete! 🎉');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setTimeLeft(`${days}d ${hours}u nog`);
    }, 1000 * 60); // Update every minute
    
    return () => clearInterval(timer);
  }, [activeChallenge]);
  
  if (!activeChallenge) return null;
  
  const progress = activeChallenge.progress || 0;
  const streak = activeChallenge.current_streak || 0;
  
  const positions = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '80px', right: '20px' }
  };
  
  return (
    <>
      {/* Floating Widget */}
      <div
        style={{
          position: 'fixed',
          ...positions[position],
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        {!expanded ? (
          // Collapsed State - Circular Progress Ring
          <div
            onClick={() => setExpanded(true)}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              position: 'relative',
              animation: 'pulse 2s infinite'
            }}
          >
            {/* Progress Ring */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '70px',
                height: '70px',
                transform: 'rotate(-90deg)'
              }}
            >
              <circle
                cx="35"
                cy="35"
                r="30"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="35"
                cy="35"
                r="30"
                stroke="#fff"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            
            {/* Icon */}
            <Trophy size={24} style={{ color: '#fff', zIndex: 1 }} />
            
            {/* Streak Badge */}
            {streak > 0 && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid #1a1a1a'
              }}>
                {streak}
              </div>
            )}
          </div>
        ) : (
          // Expanded State
          <div style={{
            width: '320px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
            color: '#fff'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '15px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <Trophy size={20} style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: '16px' }}>
                    {activeChallenge.name}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px'
                }}>
                  {activeChallenge.subtitle}
                </p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Progress
                </span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                  {progress}%
                </span>
              </div>
              <div style={{
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Zap size={16} style={{ color: '#10b981', marginBottom: '4px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{streak}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  Dagen Streak
                </div>
              </div>
              
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Target size={16} style={{ color: '#3b82f6', marginBottom: '4px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {activeChallenge.completed_milestones || 0}/{activeChallenge.total_milestones || 3}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  Mijlpalen
                </div>
              </div>
              
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Award size={16} style={{ color: '#fbbf24', marginBottom: '4px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {activeChallenge.points || 0}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  Punten
                </div>
              </div>
            </div>
            
            {/* Current Milestone */}
            {activeChallenge.current_milestone && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '15px'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '4px'
                }}>
                  HUIDIGE MIJLPAAL
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '13px' }}>
                    {activeChallenge.current_milestone}
                  </span>
                </div>
              </div>
            )}
            
            {/* Time & Action */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px'
              }}>
                <Clock size={14} />
                {timeLeft}
              </div>
              
              <button style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <TrendingUp size={14} />
                Bekijk Details
              </button>
            </div>
            
            {/* Money Back Progress */}
            {activeChallenge.is_money_back && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#000',
                  fontWeight: 'bold'
                }}>
                  💰 Money Back Challenge #{activeChallenge.challenge_number}/3
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 4px 30px rgba(16, 185, 129, 0.6);
          }
          100% {
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
          }
        }
      `}</style>
    </>
  );
}

// Workout Page Widget - Shows workout-specific challenges
export function WorkoutChallengeWidget({ workoutChallenge, onComplete }) {
  if (!workoutChallenge) return null;
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div>
          <h4 style={{
            margin: 0,
            color: '#10b981',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Zap size={16} />
            Vandaag's Challenge Doel
          </h4>
          <p style={{
            margin: '4px 0 0 0',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {workoutChallenge.today_target}
          </p>
        </div>
        
        <button
          onClick={onComplete}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle size={16} />
          Voltooid
        </button>
      </div>
      
      {/* Mini Progress */}
      <div style={{
        display: 'flex',
        gap: '4px'
      }}>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              background: i < workoutChallenge.week_progress 
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'rgba(255,255,255,0.1)',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
      <p style={{
        margin: '8px 0 0 0',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center'
      }}>
        {workoutChallenge.week_progress}/7 workouts deze week
      </p>
    </div>
  );
}

export default ChallengeWidget;
