import { useState } from 'react'
import { Play, Calendar, Clock, Users } from 'lucide-react'

export default function VideoSection({ isMobile, onOpenCalendly }) {
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
      {/* Groene mist effect - top */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Groene ambient light - links */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.12) 0%, transparent 60%)',
        filter: 'blur(60px)',
        animation: 'pulse 15s ease-in-out infinite',
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
            color: 'rgba(16, 185, 129, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          }}>
            Mijn verhaal & Missie
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.3))'
          }}>
            Waarom YOUR ARC Anders Is
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Dan Alles Wat Je Kent
          </span>
        </h2>

        {/* Video container */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          marginBottom: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 185, 129, 0.02) 100%)',
          borderRadius: isMobile ? '16px' : '24px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(16, 185, 129, 0.1), inset 0 0 40px rgba(16, 185, 129, 0.02)'
        }}>
          {/* Groene glow achter video */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            animation: 'pulse 10s ease-in-out infinite'
          }} />

          {/* Video placeholder */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Ontwerp_zonder_titel_50.png?v=1758218592)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer'
          }}>
            {!videoPlaying ? (
              <>
                {/* Play button */}
                <div 
                  onClick={() => setVideoPlaying(true)}
                  style={{
                    width: isMobile ? '80px' : '100px',
                    height: isMobile ? '80px' : '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <Play size={isMobile ? 30 : 40} color="#fff" style={{ marginLeft: '5px' }} />
                </div>
                
                {/* Video duration */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
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
                  <span>5:42</span>
                </div>
              </>
            ) : (
              // YouTube iframe
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                src="https://youtu.be/8d4Vn6PP_ZQ"
                title="YOUR ARC Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>

        {/* Video highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '2.5rem' : '3.5rem'
        }}>
          {[
            { icon: Clock, text: 'In 5 minuten alles uitgelegd' },
            { icon: Users, text: 'Maar 20 Plekken Beschikbaar' },
            { icon: Calendar, text: 'Start Maandag Al' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.12)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.02)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(16, 185, 129, 0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.12)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(16, 185, 129, 0.02)'
            }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'inset 0 0 15px rgba(16, 185, 129, 0.1)'
              }}>
                <item.icon size={20} color="#10b981" />
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

        {/* CTA Button */}
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
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 45%, rgba(5, 150, 105, 0.1) 50%, #000000 55%, #0a0a0a 100%)',
              border: isHovered 
                ? 'none'
                : '1px solid rgba(5, 150, 105, 0.25)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: isHovered ? '#fff' : '#10b981',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
              boxShadow: isHovered 
                ? '0 20px 40px rgba(16, 185, 129, 0.35), 0 0 80px rgba(16, 185, 129, 0.25)'
                : '0 8px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(5, 150, 105, 0.05)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              letterSpacing: '0.02em',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '40%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.15), transparent)',
              transform: 'rotate(35deg)',
              animation: 'glide 4s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            <Calendar size={isMobile ? 20 : 24} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              Ik Wil Mijn Leven Veranderen
            </span>
          </button>

          <p style={{
            marginTop: '1rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            Geen verplichtingen • 100% vrijblijvend • Direct een plan
          </p>
        </div>
      </div>

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
