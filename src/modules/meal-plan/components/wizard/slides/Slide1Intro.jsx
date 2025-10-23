// src/modules/meal-plan/components/wizard/slides/Slide1Intro.jsx
// Slide 1: Welkom + Introductie

import CoachBubble from '../shared/CoachBubble'

export default function Slide1Intro({ client }) {
  const isMobile = window.innerWidth <= 768
  
  // Extract client info
  const firstName = client?.first_name || 'daar'
  const primaryGoal = client?.primary_goal || 'je doelen'
  
  // Goal translations
  const goalTranslations = {
    fat_loss: 'afvallen',
    muscle_gain: 'spieren opbouwen',
    maintain: 'je gewicht behouden',
    strength: 'sterker worden',
    health: 'gezonder leven'
  }
  
  const goalText = goalTranslations[primaryGoal] || primaryGoal
  
  return (
    <div style={{
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        position: 'relative'
      }}>
        {/* Animated emoji */}
        <div style={{
          fontSize: isMobile ? '4rem' : '5rem',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          animation: 'bounce 2s ease-in-out infinite',
          display: 'inline-block'
        }}>
          👋
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.02em'
        }}>
          Welkom {firstName}!
        </h1>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: 'rgba(255, 255, 255, 0.8)',
          fontWeight: '500',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.5'
        }}>
          Laten we samen jouw perfecte weekplan maken
        </p>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0,
          fontWeight: '500'
        }}>
          Speciaal voor {goalText}
        </p>
      </div>
      
      {/* Coach Message */}
      <CoachBubble 
        message="Hey! Ik ga je helpen een meal plan op te stellen dat perfect bij je past. We gaan samen door een aantal stappen om te zorgen dat jouw plan realistisch, haalbaar en effectief is. Klaar? Let's go! 💪"
        variant="default"
      />
      
      {/* What We'll Cover */}
      <div style={{
        marginTop: isMobile ? '2rem' : '2.5rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: isMobile ? '1.25rem' : '1.5rem',
          textAlign: 'center'
        }}>
          Dit gaan we samen doen:
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: isMobile ? '0.875rem' : '1rem'
        }}>
          {[
            {
              emoji: '🎯',
              title: 'Jouw Macro Doelen',
              description: 'We bekijken jouw calorie en eiwit targets'
            },
            {
              emoji: '📅',
              title: 'Dagelijkse Structuur',
              description: 'Hoeveel maaltijden en snacks wil je per dag?'
            },
            {
              emoji: '🥩',
              title: 'Eiwit Bronnen',
              description: 'Kies 3 eiwitbronnen die jij dagelijks wilt eten'
            },
            {
              emoji: '🍚',
              title: 'Koolhydraat Bronnen',
              description: 'Kies 3 koolhydraten die makkelijk te schalen zijn'
            },
            {
              emoji: '🍱',
              title: 'Meal Prep Plan',
              description: 'We kijken hoe meal prep jou kan helpen'
            }
          ].map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '1rem' : '1.25rem',
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: isMobile ? '14px' : '16px',
                transition: 'all 0.3s ease',
                
                // Hardware acceleration
                transform: 'translateZ(0)'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.background = 'rgba(17, 17, 17, 0.8)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.background = 'rgba(17, 17, 17, 0.6)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {/* Step number */}
              <div style={{
                flexShrink: 0,
                width: isMobile ? '32px' : '36px',
                height: isMobile ? '32px' : '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {index + 1}
              </div>
              
              {/* Emoji */}
              <div style={{
                fontSize: isMobile ? '1.75rem' : '2rem',
                flexShrink: 0
              }}>
                {step.emoji}
              </div>
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: '0 0 0.25rem 0'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Time estimate */}
      <div style={{
        marginTop: isMobile ? '2rem' : '2.5rem',
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: isMobile ? '12px' : '14px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          marginBottom: '0.5rem'
        }}>
          ⏱️
        </div>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0,
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#3b82f6' }}>±5 minuten</strong> om jouw complete weekplan in te stellen
        </p>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
