// src/modules/meal-plan/components/wizard/slides/Slide1Intro.jsx
// UPGRADED: Emojis removed, green accent, compact design, pakkende titel
// RESTORED: CoachBubble component with original styling

import { useState } from 'react'
import CoachBubble from '../shared/CoachBubble'

export default function Slide1Intro({ client, isMobile }) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  const firstName = client?.first_name || 'daar'
  const primaryGoal = client?.primary_goal || 'je doelen'
  
  const goalTranslations = {
    fat_loss: 'afvallen',
    muscle_gain: 'spieren opbouwen',
    maintain: 'je gewicht behouden',
    strength: 'sterker worden',
    health: 'gezonder leven'
  }
  
  const goalText = goalTranslations[primaryGoal] || primaryGoal
  const videoId = '3PrYeULPxTI'
  
  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.25rem' : '1.75rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Jouw Persoonlijk Weekplan in 5 Minuten
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '0',
          fontWeight: '500',
          lineHeight: '1.4'
        }}>
          We gaan direct aan de slag met <span style={{ color: '#10b981', fontWeight: '700' }}>{goalText}</span>. Simpel, effectief, jouw stijl.
        </p>
      </div>
      
      {/* Video Container - Glassmorphic */}
      <div style={{
        position: 'relative',
        marginBottom: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            opacity: 0.6,
            zIndex: 2
          }} />
          
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          
          {!isPlaying ? (
            // Thumbnail + Play Button
            <>
              {/* YouTube Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video Tutorial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              
              {/* Dark overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                transition: 'background 0.3s ease'
              }} />
              
              {/* Play Button */}
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '70px' : '90px',
                  height: isMobile ? '70px' : '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 3
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(16, 185, 129, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }
                }}
              >
                {/* Play icon */}
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: isMobile ? '24px solid #000' : '30px solid #000',
                  borderTop: isMobile ? '14px solid transparent' : '18px solid transparent',
                  borderBottom: isMobile ? '14px solid transparent' : '18px solid transparent',
                  marginLeft: isMobile ? '6px' : '8px',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                }} />
              </button>
            </>
          ) : (
            // Video iframe
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="Meal Plan Wizard Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Coach Bubble - ORIGINAL STYLING RESTORED */}
        <div style={{
          position: 'relative',
          marginTop: isMobile ? '-1.5rem' : '-2rem',
          paddingTop: '0.5rem',
          zIndex: 4
        }}>
          <CoachBubble 
            message="Beantwoord 5 simpele vragen. Ik genereer jouw perfecte weekplan. Direct klaar om te gebruiken."
            variant="default"
          />
        </div>
      </div>
      
      {/* Progress Badges - NO EMOJIS */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.5rem' : '0.625rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        {[
          'Jouw Doelen',
          'Weekstructuur',
          'Favoriete Eiwitten',
          'Favoriete Carbs',
          'Meal Prep Setup'
        ].map((text, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: isMobile ? '10px' : '12px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Shine overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            <span style={{ 
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '600',
              position: 'relative',
              zIndex: 1
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
      
      {/* Time Estimate - GREEN accent */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: isMobile ? '12px' : '14px',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        margin: isMobile ? '0 0.5rem' : '0'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          opacity: 0.6
        }} />
        
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500'
          }}>
            Klaar in{' '}
            <strong style={{ 
              color: '#10b981', 
              fontWeight: '800',
              fontSize: isMobile ? '1rem' : '1.125rem'
            }}>
              5 minuten
            </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
