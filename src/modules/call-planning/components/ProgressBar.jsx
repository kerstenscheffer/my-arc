import useIsMobile from '../../../hooks/useIsMobile'
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { callTypeConfig } from '../constants/callTypes';

export default function ProgressBar({ calls, userStats, progress, handleBookCall }) {
  const isMobile = useIsMobile();

  if (calls.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '600'
        }}>
          Journey Progress
        </span>
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: '#10b981',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <CheckCircle size={14} />
          {userStats.completedCalls} van {userStats.totalCalls} calls voltooid
        </span>
      </div>
      
      <div style={{
        width: '100%',
        height: isMobile ? '10px' : '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '100px',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        position: 'relative'
      }}>
        {/* Background gradient voor uncompleted deel */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          opacity: 0.5
        }} />
        
        {/* Progress bar */}
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%)',
          borderRadius: '100px',
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite'
          }} />
        </div>
      </div>
      
      {/* Milestone Dots - Hide on very small mobile */}
      {window.innerWidth > 480 && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '-5px' : '-6px',
          left: 0,
          right: 0,
          height: isMobile ? '22px' : '24px',
          display: 'flex',
          justifyContent: 'space-between',
          padding: isMobile ? '0 5px' : '0 6px'
        }}>
          {calls.map((call, index) => {
            const config = callTypeConfig[call.call_number] || callTypeConfig[1];
            return (
              <div
                key={call.id}
                style={{
                  width: isMobile ? '22px' : '24px',
                  height: isMobile ? '22px' : '24px',
                  borderRadius: '50%',
                  background: call.status === 'completed' 
                    ? config.gradient
                    : call.status === 'scheduled'
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : call.status === 'available'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: call.status === 'available' 
                    ? '2px solid #10b981'
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: call.status === 'completed' || call.status === 'scheduled'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : 'none',
                  animation: call.status === 'available' ? 'pulse 2s infinite' : 'none',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => call.status === 'available' && handleBookCall(call)}
                title={`${config.name} - ${call.status === 'completed' ? 'Voltooid' : call.status === 'scheduled' ? 'Gepland' : call.status === 'available' ? 'Klik om te plannen' : 'Nog niet beschikbaar'}`}
              >
                {call.status === 'completed' ? '✓' : index + 1}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Info text onder progress bar */}
      {userStats.totalCalls > userStats.completedCalls && (
        <div style={{
          marginTop: window.innerWidth > 480 ? '1.5rem' : '0.75rem',
          textAlign: 'center',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          {userStats.totalCalls - userStats.completedCalls === 1
            ? `Nog 1 call te gaan voor je complete transformatie! 🚀`
            : `Nog ${userStats.totalCalls - userStats.completedCalls} calls te gaan in je journey`}
        </div>
      )}
    </div>
  );
}
