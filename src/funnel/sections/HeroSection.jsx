import { useState } from 'react'
import { Play } from 'lucide-react'

export default function HeroSection({ isMobile }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Subtiele gouden gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.03) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      {/* Goud-zwart gradient orb links */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 25s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      {/* Goud-zwart gradient orb rechts */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'float 30s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        {/* Premium label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '100px',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: '600',
            color: '#D4AF37',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}>
            ✨ Premium Gold Experience
          </span>
        </div>

        {/* Main title */}
        <h1 style={{
          fontSize: isMobile ? '2.5rem' : '4.5rem',
          fontWeight: '900',
          lineHeight: '1.1',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '200% 100%',
          animation: 'shimmer 4s ease-in-out infinite',
          letterSpacing: '-0.02em',
          filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.2))'
        }}>
          Transform Your Life
          <br />
          <span style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            opacity: 0.9,
            background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            With Premium Coaching
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1.125rem' : '1.375rem',
          color: 'rgba(255, 255, 255, 0.8)',
          maxWidth: '600px',
          margin: '0 auto',
          marginBottom: isMobile ? '2.5rem' : '3.5rem',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Exclusieve 1-op-1 begeleiding voor ondernemers die 
          <span style={{ 
            color: '#FFD700',
            fontWeight: '600',
            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
          }}> resultaat </span> 
          willen zien. Geen excuses, alleen transformatie.
        </p>

        {/* CTA Button - Zwart met subtiele gouden accenten */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
            style={{
              background: isHovered 
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(184, 150, 15, 0.9) 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 45%, rgba(212, 175, 55, 0.1) 50%, #000000 55%, #0a0a0a 100%)',
              border: isHovered 
                ? '1px solid #D4AF37'
                : '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: isHovered ? '#000' : '#D4AF37',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: isHovered 
                ? '0 15px 30px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 8px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.05)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.02em',
              position: 'relative',
              overflow: 'hidden',
              backgroundSize: '200% 100%',
              backgroundPosition: isHovered ? '0% 50%' : '100% 50%'
            }}
          >
            {/* Bewegende gouden glans */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '40%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.12), transparent)',
              transform: 'rotate(35deg)',
              animation: 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <Play size={isMobile ? 20 : 24} style={{ 
              color: isHovered ? '#000' : '#D4AF37',
              position: 'relative',
              zIndex: 1
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>Bekijk Exclusieve Video</span>
          </button>
        </div>

        {/* Trust badges */}
        <div style={{
          marginTop: isMobile ? '4rem' : '5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '3rem' : '4rem'
        }}>
          {['Premium', 'Exclusive', 'Results'].map((label, index) => (
            <div key={index} style={{
              position: 'relative'
            }}>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                color: 'rgba(212, 175, 55, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontWeight: '600'
              }}>
                {label}
              </div>
              <div style={{
                width: '30px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                margin: '0.5rem auto 0'
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        animation: 'bounce 2s ease-in-out infinite'
      }}>
        <div style={{
          width: '30px',
          height: '50px',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '15px',
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(255, 215, 0, 0.02) 100%)'
        }}>
          <div style={{
            width: '3px',
            height: '8px',
            background: 'linear-gradient(180deg, #FFD700 0%, #D4AF37 100%)',
            borderRadius: '2px',
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'scroll 2s ease-in-out infinite',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)'
          }} />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes glide {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
        
        @keyframes scroll {
          0% { top: 8px; opacity: 0.3; }
          50% { top: 20px; opacity: 1; }
          100% { top: 8px; opacity: 0.3; }
        }
      `}</style>
    </section>
  )
}
