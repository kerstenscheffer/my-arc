import { useState } from 'react'
import { Play, Calendar, Clock, Users, Euro, TrendingUp, Target } from 'lucide-react'

export default function AffiliateVideoSection({ isMobile, onOpenCalendly }) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden mist/rook effect - top */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Gouden ambient light - links */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 60%)',
        filter: 'blur(60px)',
        animation: 'pulse 15s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Gouden ambient light - rechts */}
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 60%)',
        filter: 'blur(70px)',
        animation: 'pulse 18s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Extra gradient overlay voor depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.03) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Section label */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(212, 175, 55, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}>
            Het Partner Systeem
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          lineHeight: '1.1'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.3))'
          }}>
            Hoe Jij €2000+ Per Maand
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Extra Kunt Verdienen
          </span>
        </h2>

        {/* Video container met gouden glow */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          marginBottom: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
          borderRadius: isMobile ? '16px' : '24px',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.1), inset 0 0 40px rgba(255, 215, 0, 0.02)'
        }}>
          {/* Gouden glow achter video */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            animation: 'pulse 10s ease-in-out infinite'
          }} />

          {/* YouTube video met nieuwe thumbnail */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!videoPlaying ? (
              <>
                {/* Thumbnail background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Scherm_afbeelding_2025-09-18_om_12.02.01.png?v=1758189951)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.9)'
                }} />

                {/* Play button overlay */}
                <div 
                  onClick={() => setVideoPlaying(true)}
                  style={{
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(212, 175, 55, 0.95) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    position: 'relative',
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(255, 215, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)'
                  }}
                >
                  <Play size={isMobile ? 30 : 40} color="#000" style={{ marginLeft: '5px' }} />
                </div>
                
                {/* Video duration */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Clock size={14} />
                  <span>12:47</span>
                </div>
              </>
            ) : (
              // YouTube iframe embed met nieuwe URL
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src="https://www.youtube.com/embed/uuYG3gOIYiY?autoplay=1&rel=0&modestbranding=1"
                title="MY ARC Partner Programma - Verdien €2000+ Per Maand"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* Video highlights - AFFILIATE FOCUSED */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '2.5rem' : '3.5rem'
        }}>
          {[
            { icon: Euro, text: '€200 per succesvolle klant' },
            { icon: TrendingUp, text: 'Passief inkomen mogelijk' },
            { icon: Target, text: '20% korting voor jouw netwerk' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.03) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.12)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.02)',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.2)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.04), 0 0 30px rgba(255, 215, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 215, 0, 0.12)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.02)'
            }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(212, 175, 55, 0.06) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'inset 0 0 15px rgba(255, 215, 0, 0.1)'
              }}>
                <item.icon size={20} color="#D4AF37" />
              </div>
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '500'
              }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button met extra glow */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onOpenCalendly}
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
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 45%, rgba(212, 175, 55, 0.1) 50%, #000000 55%, #0a0a0a 100%)',
              border: isHovered 
                ? 'none'
                : '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: isHovered ? '#000' : '#FFD700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
              boxShadow: isHovered 
                ? '0 20px 40px rgba(255, 215, 0, 0.35), 0 0 80px rgba(255, 215, 0, 0.25)'
                : '0 8px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.05), 0 0 40px rgba(255, 215, 0, 0.05)',
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
              background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.15), transparent)',
              transform: 'rotate(35deg)',
              animation: 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <Calendar size={isMobile ? 20 : 24} style={{ 
              color: isHovered ? '#000' : '#FFD700',
              position: 'relative',
              zIndex: 1
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              Ik Wil Partner Worden
            </span>
          </button>

          {/* Sub text */}
          <p style={{
            marginTop: '1rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            15 minuten gesprek • Direct starten • Eerste commissie binnen 30 dagen
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes glide {
          0% { left: -20%; }
          100% { left: 120%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-30px) translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </section>
  )
}
