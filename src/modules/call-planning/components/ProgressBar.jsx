import useIsMobile from '../../../hooks/useIsMobile'
import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ProgressBar({ calls, userStats, progress, handleBookCall }) {
  const isMobile = useIsMobile();

  if (calls.length === 0) return null;

  // Calculate positions for each milestone
  const getMilestonePosition = (index) => {
    return ((index) / (calls.length - 1)) * 100;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Compact Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <span style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '600'
        }}>
          Coaching Journey
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <CheckCircle size={12} />
          {userStats.completedCalls} van {userStats.totalCalls}
        </span>
      </div>
      
      {/* Combined Progress Bar and Milestones */}
      <div style={{ 
        position: 'relative',
        marginBottom: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {/* Main Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '100px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Progress Fill - White */}
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 
              ? '#10b981'
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '100px',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }} />
        </div>
        
        {/* Milestone Dots directly on the bar */}
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center'
        }}>
          {calls.map((call, index) => {
            const position = getMilestonePosition(index);
            const isClickable = call.status === 'available';
            
            return (
              <div
                key={call.id}
                style={{
                  position: 'absolute',
                  left: `${position}%`,
                  transform: 'translate(-50%, -50%)',
                  top: '50%',
                  cursor: isClickable ? 'pointer' : 'default',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  padding: '8px',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => isClickable && handleBookCall(call)}
              >
                {/* Small Milestone Dot */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: call.status === 'completed' 
                      ? '#10b981'
                      : call.status === 'scheduled'
                      ? 'rgba(255, 255, 255, 0.3)'
                      : call.status === 'available'
                      ? 'rgba(251, 191, 36, 0.3)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: call.status === 'available' 
                      ? '2px solid #fbbf24'
                      : call.status === 'completed'
                      ? '2px solid #10b981'
                      : call.status === 'scheduled'
                      ? '2px solid rgba(255, 255, 255, 0.4)'
                      : '2px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: '#fff',
                    fontWeight: '700',
                    boxShadow: call.status === 'available'
                      ? '0 0 6px rgba(251, 191, 36, 0.4)'
                      : call.status === 'completed'
                      ? '0 0 4px rgba(16, 185, 129, 0.3)'
                      : 'none',
                    animation: call.status === 'available' ? 'pulse 2s infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {call.status === 'completed' ? (
                    <CheckCircle size={10} />
                  ) : (
                    <span style={{ fontSize: '0.55rem' }}>{index + 1}</span>
                  )}
                </div>
                
                {/* Label only on desktop */}
                {!isMobile && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-18px',
                    fontSize: '0.55rem',
                    color: call.status === 'completed'
                      ? '#10b981'
                      : call.status === 'available'
                      ? '#fbbf24'
                      : 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    Call {index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Minimal info text */}
      {userStats.totalCalls > userStats.completedCalls && (
        <div style={{
          textAlign: 'center',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: isMobile ? '0.25rem' : '0.5rem'
        }}>
          Nog {userStats.totalCalls - userStats.completedCalls} calls te gaan
        </div>
      )}
    </div>
  );
}
