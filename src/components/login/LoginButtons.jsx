// src/components/login/LoginButtons.jsx - GOLDEN PREMIUM VERSION (Clean)
import { Activity, User, Dumbbell, ArrowRight, Sparkles, Crown } from 'lucide-react'

export default function LoginButtons({ onModeSelect }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '5%' : '8%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 35,
      textAlign: 'center',
      width: '90%',
      maxWidth: '380px'
    }}>
      {/* MY ARC Logo - GOLDEN */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        animation: 'fadeInDown 0.8s ease-out'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isMobile ? '0.625rem' : '0.875rem',
          marginBottom: '0.875rem'
        }}>
          <Activity 
            size={isMobile ? 36 : 42} 
            color="#FFD700"
            strokeWidth={2.5}
            style={{
              filter: 'drop-shadow(0 0 24px rgba(255, 215, 0, 0.6))'
            }}
          />
          <h1 style={{
            fontSize: isMobile ? '2.25rem' : '2.75rem',
            fontWeight: '900',
            backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #D4AF37 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#FFD700',
            margin: 0,
            letterSpacing: '-0.02em',
            display: 'inline-block',
            animation: 'gradientShift 8s ease-in-out infinite',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.3)'
          }}>
            MY ARC
          </h1>
        </div>
        
        <p style={{
          color: 'rgba(255, 215, 0, 0.9)',
          fontSize: isMobile ? '0.875rem' : '1rem',
          margin: 0,
          fontWeight: '700',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textShadow: '0 2px 12px rgba(255, 215, 0, 0.4)'
        }}>
          Jouw Training Platform
        </p>
      </div>
      
      {/* Login Buttons Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem',
        animation: 'fadeInUp 0.8s ease-out 0.2s both'
      }}>
        {/* Client Login Button - PRIMARY GOLDEN */}
        <button
          onClick={() => onModeSelect('client')}
          style={{
            width: '100%',
            padding: isMobile ? '1.125rem' : '1.25rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            borderRadius: '16px',
            color: '#000',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 12px 30px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transform: 'translateZ(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {/* Shine effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '120%',
            height: '200%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            transform: 'rotate(45deg)',
            animation: 'shine 3s infinite',
            pointerEvents: 'none'
          }} />
          
          {/* Top gloss */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            borderRadius: '16px 16px 0 0',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '0.875rem',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
            }}>
              <User size={isMobile ? 20 : 22} color="#000" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '800',
                letterSpacing: '-0.01em'
              }}>
                Cliënt Login
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                opacity: 0.8,
                fontWeight: '600'
              }}>
                Toegang tot je dashboard
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            position: 'relative',
            zIndex: 2
          }}>
            <Sparkles size={16} style={{ opacity: 0.9 }} strokeWidth={2.5} />
            <ArrowRight size={20} strokeWidth={2.5} />
          </div>
        </button>
        
        {/* Coach Login Button - SECONDARY GOLDEN */}
        <button
          onClick={() => onModeSelect('coach')}
          style={{
            width: '100%',
            padding: isMobile ? '1.125rem' : '1.25rem',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '16px',
            color: '#FFD700',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255, 215, 0, 0.1)',
            transform: 'translateZ(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(212, 175, 55, 0.15) 100%)'
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)'
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 215, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)'
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {/* Top gloss */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%)',
            borderRadius: '16px 16px 0 0',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '0.875rem',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '12px',
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(255, 215, 0, 0.2)'
            }}>
              <Crown size={isMobile ? 20 : 22} color="#FFD700" strokeWidth={2.5} style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))'
              }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '700',
                letterSpacing: '-0.01em'
              }}>
                Coach Login
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                opacity: 0.7,
                fontWeight: '600'
              }}>
                Beheer je cliënten
              </div>
            </div>
          </div>
          
          <ArrowRight size={20} style={{ opacity: 0.8, position: 'relative', zIndex: 2 }} strokeWidth={2.5} />
        </button>
      </div>
      
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
      `}</style>
    </div>
  )
}
