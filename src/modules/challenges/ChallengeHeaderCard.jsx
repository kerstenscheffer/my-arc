import useIsMobile from '../../hooks/useIsMobile'
import React from 'react';
import { Trophy, TrendingUp, ChevronRight } from 'lucide-react';

export default function ChallengeHeaderCard({ moneyBackStatus = { count: 0, eligible: true } }) {
  const isMobile = useIsMobile();
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      borderRadius: '24px',
      padding: isMobile ? '1.5rem' : '2rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3)',
      marginBottom: '2rem'
    }}>
      {/* Background gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.75rem',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '20px',
          marginBottom: '1rem'
        }}>
          <Trophy size={14} color="#fff" />
          <span style={{
            fontSize: '0.75rem',
            color: '#fff',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Money Back Guarantee
          </span>
        </div>
        
        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.75rem',
          lineHeight: 1.1
        }}>
          BET ON YOURSELF
        </h2>
        
        {/* Subtitle */}
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '1.5rem',
          maxWidth: '80%'
        }}>
          Voltooi 3 challenges, krijg 100% van je investering terug
        </p>
        
        {/* Progress indicators */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[1, 2, 3].map(num => (
            <div key={num} style={{
              flex: 1,
              maxWidth: '120px'
            }}>
              <div style={{
                height: '6px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  height: '100%',
                  width: moneyBackStatus.count >= num ? '100%' : '0%',
                  background: '#fff',
                  transition: 'width 0.5s ease',
                  borderRadius: '3px'
                }} />
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Challenge {num}
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '2rem'
        }}>
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {moneyBackStatus.count}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Voltooid
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {3 - moneyBackStatus.count}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Te gaan
            </div>
          </div>
          
          <div style={{ marginLeft: 'auto' }}>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}>
              <ChevronRight size={24} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
