import { useState } from 'react'
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight, Phone } from 'lucide-react'

export default function AffiliateCallCTA({ isMobile, onOpenCalendly }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Intense gouden glow effect */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
        filter: 'blur(100px)',
        animation: 'pulse 10s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Extra glow voor drama */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 50%)',
        filter: 'blur(60px)',
        animation: 'pulse 8s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Urgency label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          padding: '0.5rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '100px',
          animation: 'urgentPulse 2s ease-in-out infinite'
        }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: '#ef4444',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Nog maar 4 partner plekken
          </span>
        </div>

        {/* Main title */}
        <h2 style={{
          fontSize: isMobile ? '2.5rem' : '4rem',
          fontWeight: '900',
          lineHeight: '0.95',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          letterSpacing: '-0.03em'
        }}>
          <span style={{
            display: 'block',
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Klaar Om Te Starten?
          </span>
          <span style={{
            display: 'block',
            fontSize: isMobile ? '3rem' : '5rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 30px rgba(255, 215, 0, 0.3))',
            marginBottom: '0.5rem'
          }}>
            BOEK JE CALL
          </span>
          <span style={{
            display: 'block',
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500'
          }}>
            En Begin Direct Met Verdienen
          </span>
        </h2>

        {/* Value reminders */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          {[
            '€200 per succesvolle klant',
            '20% korting voor jouw netwerk',
            'Geen investering nodig',
            'Support vanaf dag 1'
          ].map((value, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <CheckCircle size={20} color="#10b981" />
              <span style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Main CTA Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.95) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.15)'
        }}>
          {/* Timer display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <Clock size={20} color="#FFD700" />
            <span style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#FFD700',
              fontWeight: '600'
            }}>
              Gesprek duurt maar 15 minuten
            </span>
          </div>

          {/* Big CTA Button */}
          <button
            onClick={onOpenCalendly}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              background: isHovered
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
              border: 'none',
              borderRadius: '20px',
              padding: isMobile ? '1.5rem 3rem' : '2rem 4rem',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              letterSpacing: '0.02em',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center'
            }}
          >
            <Calendar size={24} />
            JA, IK WIL PARTNER WORDEN
            <ArrowRight size={24} />
          </button>

          <p style={{
            marginTop: '1rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            100% vrijblijvend • Geen verplichtingen • Direct antwoord
          </p>
        </div>

        {/* Final testimonial */}
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.02) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
            fontStyle: 'italic',
            marginBottom: '1rem'
          }}>
            "Na mijn partner call wist ik meteen dat dit anders was. 
            <span style={{ color: '#FFD700', fontWeight: '700' }}> Binnen 2 weken mijn eerste commissie</span>, 
            nu 6 maanden later verdien ik consistent €1500/maand extra."
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: '800',
              color: '#000'
            }}>
              J
            </div>
            <div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: '#fff',
                fontWeight: '600'
              }}>
                Jasper K.
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                Partner sinds Maart 2024
              </div>
            </div>
          </div>
        </div>

        {/* PS message */}
        <div style={{
          marginTop: '3rem',
          padding: '1rem',
          borderLeft: '3px solid #FFD700'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5',
            textAlign: 'left',
            fontWeight: '500'
          }}>
            <strong style={{ color: '#FFD700' }}>P.S.</strong> Elke dag uitstel is een gemiste kans op commissie. 
            De partners die vandaag beginnen, hebben over 30 dagen hun eerste €100. 
            Wanneer begin jij?
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes urgentPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.02);
            opacity: 0.9;
          }
        }
      `}</style>
    </section>
  )
}
