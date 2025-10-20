import React, { useState } from 'react'
import { ArrowDown, Check } from 'lucide-react'

export default function HeroTransformation({ isMobile, onScrollNext }) {
  const [isHovered, setIsHovered] = useState(false)

  const scrollToVideo = () => {
    if (onScrollNext) {
      onScrollNext()
    } else {
      // Fallback: scroll to next section manually
      const videoSection = document.getElementById('section-1')
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Subtle golden gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.03) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      {/* Gold-black gradient orb left */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      {/* Gold-black gradient orb right */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        {/* Premium label - NO ICON */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.25)',
            borderRadius: '100px',
            padding: isMobile ? '0.5rem 1.25rem' : '0.625rem 1.5rem',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '700',
            color: '#D4AF37',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}>
            Slechts 10 Plekken Beschikbaar
          </span>
        </div>

        {/* Main title - NO ANIMATION */}
        <h1 style={{
          fontSize: isMobile ? '2.75rem' : '5rem',
          fontWeight: '900',
          lineHeight: '0.95',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          letterSpacing: '-0.03em'
        }}>
          <span style={{
            display: 'block',
            fontSize: isMobile ? '3.5rem' : '6rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.2))',
            marginBottom: '0.2rem'
          }}>
            8 WEKEN
          </span>
          <span style={{
            display: 'block',
            color: '#fff',
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: '700',
            opacity: 0.95
          }}>
            TRANSFORMATIE CHALLENGE
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          color: 'rgba(255, 255, 255, 0.8)',
          maxWidth: '600px',
          margin: '0 auto',
          marginBottom: isMobile ? '2.5rem' : '3.5rem',
          lineHeight: '1.4',
          fontWeight: '400'
        }}>
          Een systeem waar je 
          <span style={{ 
            color: '#FFD700',
            fontWeight: '700',
            filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
          }}> gegarandeerd </span> 
          beter uit komt
        </p>

        {/* CTA Button - IMPROVED STYLE */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={scrollToVideo}
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
              backgroundImage: isHovered 
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(255, 215, 0, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
              backgroundSize: '200% 100%',
              backgroundPosition: isHovered ? '0% 50%' : '100% 50%',
              backgroundColor: 'transparent',
              border: isHovered 
                ? '2px solid #FFD700'
                : '2px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '20px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '800',
              color: isHovered ? '#000' : '#FFD700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
              boxShadow: isHovered 
                ? '0 25px 50px rgba(255, 215, 0, 0.4), 0 0 100px rgba(255, 215, 0, 0.3)'
                : '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 60px rgba(255, 215, 0, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden',
              textShadow: isHovered 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                : '0 0 20px rgba(255, 215, 0, 0.5)'
            }}
          >
            {/* Gliding shine effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-30%',
              width: '50%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transform: 'rotate(35deg)',
              animation: isHovered ? 'glide 2s ease-in-out infinite' : 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <span style={{ position: 'relative', zIndex: 1 }}>
              Bekijk De Video
            </span>
            <ArrowDown 
              size={isMobile ? 20 : 24} 
              style={{ 
                position: 'relative',
                zIndex: 1,
                animation: 'bounce 2s ease-in-out infinite'
              }} 
            />
          </button>
        </div>

        {/* Trust indicators */}
        <div style={{
          marginTop: isMobile ? '2.5rem' : '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {[
            '3 IJzersterke garanties',
            '110% inzet van je coach',
            'Start direct maandag'
          ].map((text, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: 0.9
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={12} style={{ color: '#D4AF37' }} />
              </div>
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500'
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>
    </section>
  )
}
