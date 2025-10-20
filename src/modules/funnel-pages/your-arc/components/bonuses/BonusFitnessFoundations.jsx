import React, { useState } from 'react'
import { Crown, Users, Shield, Star } from 'lucide-react'

export default function BonusFitnessFoundations({ 
  isMobile = window.innerWidth <= 768, 
  imageUrl = 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Jouw_alineatekst_65.png?v=1757861051',
  isVisible = true 
}) {
  const [hoveredPrice, setHoveredPrice] = useState(null)

  return (
    <div style={{
      maxWidth: isMobile ? '100%' : '900px',
      width: '100%',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.75rem' : '1.5rem',
      alignItems: 'stretch',
      position: 'relative',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: isMobile ? '0.5rem' : '0'
    }}>
      {/* Golden glow - smaller on mobile */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '100%' : '120%',
        height: isMobile ? '100%' : '120%',
        background: 'radial-gradient(circle at center, rgba(227, 181, 5, 0.12) 0%, rgba(244, 228, 193, 0.05) 30%, transparent 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
        zIndex: -1,
        animation: 'glowPulse 4s ease-in-out infinite'
      }} />

      {/* Photo section - square on all devices */}
      <div style={{
        flex: isMobile ? 'none' : '0 0 55%',
        width: isMobile ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: isMobile ? '12px' : '20px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(227, 181, 5, 0.15)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Photo */}
          <div style={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, rgba(227, 181, 5, 0.08) 0%, rgba(0, 0, 0, 0.2) 100%), url('${imageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />

          {/* Golden shine */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(244, 228, 193, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />

          {/* Crown badge */}
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: isMobile ? '32px' : '45px',
            height: isMobile ? '32px' : '45px',
            background: 'linear-gradient(135deg, #F4E4C1 0%, #E3B505 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(227, 181, 5, 0.6)',
            boxShadow: '0 4px 12px rgba(227, 181, 5, 0.3)'
          }}>
            <Crown size={isMobile ? 16 : 24} color="#000" strokeWidth={2.5} />
          </div>

          {/* 1-op-1 badge */}
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#E3B505',
            padding: isMobile ? '0.25rem 0.5rem' : '0.4rem 0.8rem',
            borderRadius: '8px',
            fontSize: isMobile ? '0.55rem' : '0.75rem',
            fontWeight: '900',
            border: '1px solid #E3B505',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Users size={isMobile ? 10 : 14} />
            1-op-1
          </div>
        </div>
      </div>

      {/* Content section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: isMobile ? '0.75rem' : '1.5rem'
      }}>
        {/* Title section */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '0.25rem 0' : '1rem 0'
        }}>
          {/* MY ARC badge */}
          <div style={{
            display: 'inline-block',
            padding: isMobile ? '4px 10px' : '8px 18px',
            background: 'linear-gradient(135deg, rgba(227, 181, 5, 0.2) 0%, rgba(244, 228, 193, 0.2) 100%)',
            border: '1px solid rgba(227, 181, 5, 0.35)',
            borderRadius: '16px',
            fontSize: isMobile ? '7px' : '10px',
            fontWeight: '900',
            color: '#E3B505',
            letterSpacing: '1.2px',
            marginBottom: isMobile ? '0.4rem' : '1rem',
            textTransform: 'uppercase',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(227, 181, 5, 0.2)'
          }}>
            MY ARC EXCLUSIEF
          </div>

          <h1 style={{
            fontSize: isMobile ? '1.2rem' : '2.2rem',
            fontWeight: '900',
            marginBottom: '0.3rem',
            letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg, #F4E4C1 0%, #E3B505 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
            lineHeight: '1.1'
          }}>
            YOUR ARC
          </h1>
          
          <p style={{
            fontSize: isMobile ? '0.65rem' : '0.95rem',
            color: 'rgba(244, 228, 193, 0.8)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Lidmaatschap
          </p>
        </div>

        {/* Pricing section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: isMobile ? '12px' : '18px',
          border: '1px solid rgba(227, 181, 5, 0.2)',
          padding: isMobile ? '0.6rem' : '1rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(227, 181, 5, 0.1)',
          position: 'relative'
        }}>
          {/* Top glow line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, #E3B505 50%, transparent 100%)',
            boxShadow: '0 0 8px rgba(227, 181, 5, 0.4)'
          }} />

          {/* Garantie badge */}
          <div style={{
            position: 'absolute',
            top: '-0.4rem',
            right: isMobile ? '0.4rem' : '1rem',
            background: 'linear-gradient(135deg, #E3B505 0%, #C4A000 100%)',
            color: '#000',
            padding: isMobile ? '0.2rem 0.4rem' : '0.3rem 0.6rem',
            borderRadius: '8px',
            fontSize: isMobile ? '0.5rem' : '0.65rem',
            fontWeight: '700',
            boxShadow: '0 2px 8px rgba(227, 181, 5, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            <Shield size={isMobile ? 8 : 10} />
            GARANTIE
          </div>

          <h2 style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            fontWeight: '800',
            marginBottom: '0.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2px',
            color: '#F4E4C1',
            textAlign: 'center'
          }}>
            2 MAANDEN ABBONOMENT
          </h2>
          
          <p style={{
            fontSize: isMobile ? '0.6rem' : '0.75rem',
            color: '#E3B505',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            marginBottom: isMobile ? '0.5rem' : '0.8rem',
            textAlign: 'center'
          }}>
            110% inzet van je coach
          </p>

          {/* Price items - compact grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '0.2rem' : '0.3rem',
            marginBottom: isMobile ? '0.4rem' : '0.6rem',
            paddingBottom: isMobile ? '0.4rem' : '0.6rem',
            borderBottom: '1px solid rgba(227, 181, 5, 0.2)'
          }}>
            {[
              { label: 'Lidmaadschap', amount: '€597' },
              { label: '8-weken exta support', amount: '€97' },
              { label: '3 ijzeren garanties', amount: '€47' }
            ].map((item, index) => (
              <div 
                key={index}
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '0.25rem 0.15rem' : '0.4rem 0.2rem',
                  background: 'linear-gradient(135deg, rgba(227, 181, 5, 0.06) 0%, rgba(244, 228, 193, 0.03) 100%)',
                  borderRadius: '8px',
                  border: '1px solid rgba(227, 181, 5, 0.12)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{
                  fontSize: isMobile ? '0.5rem' : '0.6rem',
                  color: 'rgba(244, 228, 193, 0.6)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2px',
                  marginBottom: '0.1rem',
                  display: 'block'
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.95rem',
                  fontWeight: '800',
                  color: '#E3B505',
                  textShadow: '0 0 8px rgba(227, 181, 5, 0.3)',
                  display: 'block'
                }}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            textAlign: 'center',
            padding: '0.2rem 0 0'
          }}>
            <span style={{
              fontSize: isMobile ? '0.55rem' : '0.65rem',
              color: 'rgba(244, 228, 193, 0.5)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              marginBottom: '0.1rem',
              display: 'block'
            }}>
              Totale Waarde
            </span>
            <span style={{
              fontSize: isMobile ? '1.3rem' : '1.8rem',
              fontWeight: '900',
              color: '#E3B505',
              textShadow: '0 0 20px rgba(227, 181, 5, 0.4)',
              background: 'linear-gradient(135deg, #F4E4C1 0%, #E3B505 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              €691
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        @keyframes goldFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
