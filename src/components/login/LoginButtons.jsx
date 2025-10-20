// src/components/login/LoginButtons.jsx
import { Activity, User, Dumbbell, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginButtons({ onModeSelect }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '5%' : '8%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 35, // Higher than FeatureSlider (30)
      textAlign: 'center',
      width: '90%',
      maxWidth: '360px'
    }}>
      {/* MY ARC Logo */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        animation: 'fadeInDown 0.8s ease-out'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <Activity 
            size={isMobile ? 32 : 36} 
            color="#10b981"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))'
            }}
          />
          <h1 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '900',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#10b981',
            margin: 0,
            letterSpacing: '-0.02em',
            display: 'inline-block',
            animation: 'gradientShift 8s ease-in-out infinite'
          }}>
            MY ARC
          </h1>
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          margin: '0 0 0.5rem 0',
          fontWeight: '500'
        }}>
          Premium Training Platform
        </p>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          margin: 0
        }}>
          Kies je login om te beginnen
        </p>
      </div>
      
      {/* Login Buttons Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem',
        animation: 'fadeInUp 0.8s ease-out 0.2s both'
      }}>
        {/* Client Login Button - Primary */}
        <button
          onClick={() => onModeSelect('client')}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.125rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '14px',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)'
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
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transform: 'rotate(45deg)',
            animation: 'shine 3s infinite'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            position: 'relative'
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={isMobile ? 18 : 20} color="#fff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700'
              }}>
                Client Login
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                opacity: 0.9,
                fontWeight: '400'
              }}>
                Toegang tot je dashboard
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            position: 'relative'
          }}>
            <Sparkles size={14} style={{ opacity: 0.9 }} />
            <ArrowRight size={18} />
          </div>
        </button>
        
        {/* Coach Login Button - Secondary */}
        <button
          onClick={() => onModeSelect('coach')}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.125rem',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Dumbbell size={isMobile ? 18 : 20} color="rgba(147, 197, 253, 0.9)" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600'
              }}>
                Coach Login
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                opacity: 0.7,
                fontWeight: '400'
              }}>
                Beheer je cliënten
              </div>
            </div>
          </div>
          
          <ArrowRight size={18} style={{ opacity: 0.6 }} />
        </button>
      </div>
      
      {/* Call to action text */}
      <p style={{
        marginTop: isMobile ? '1rem' : '1.25rem',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        Klik om in te loggen →
      </p>
      
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
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
