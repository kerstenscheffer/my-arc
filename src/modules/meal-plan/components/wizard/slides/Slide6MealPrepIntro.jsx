// src/modules/meal-plan/components/wizard/slides/Slide6MealPrepIntro.jsx
// Slide 6: Meal Prep Introductie & Educatie

import CoachBubble from '../shared/CoachBubble'

export default function Slide6MealPrepIntro() {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2.5rem' : '3rem',
          marginBottom: isMobile ? '0.75rem' : '1rem',
          animation: 'float 3s ease-in-out infinite'
        }}>
          🍱
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          Meal Prep Planning
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          fontWeight: '500'
        }}>
          De game-changer voor consistent resultaat
        </p>
      </div>
      
      {/* Coach Message */}
      <CoachBubble 
        message="Je doelen consistent halen is vaak gewoon een kwestie van hoe goed je voorbereid bent. Als jij kunt kiezen tussen een gezonde bak pasta of een pizza, ga je waarschijnlijk voor de pasta. Probleem is: veel mensen hebben die pasta niet klaar staan. Daarom raad ik IEDEREEN aan om te meal preppen. Laat me uitleggen waarom dit zo belangrijk is..."
        variant="default"
      />
      
      {/* The Problem */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '1.5rem' : '2rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: isMobile ? '16px' : '20px'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          🚫
        </div>
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '800',
          color: '#ef4444',
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          Het Probleem
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.7',
          margin: 0,
          textAlign: 'center'
        }}>
          Het is <strong>6 uur 's avonds</strong>. Je hebt honger. 
          Je kijkt in de koelkast... <strong>niks klaar</strong>. 
          De snackbar om de hoek ruikt geweldig. 
          <br /><br />
          <span style={{ 
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: '#ef4444',
            fontWeight: '700'
          }}>
            Game over. 🍕
          </span>
        </p>
      </div>
      
      {/* The Solution */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '1.5rem' : '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: isMobile ? '16px' : '20px'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          ✅
        </div>
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '800',
          color: '#10b981',
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          De Oplossing
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.7',
          margin: 0,
          textAlign: 'center'
        }}>
          Het is <strong>6 uur 's avonds</strong>. Je hebt honger. 
          Je pakt een <strong>klaar bakje pasta met kip</strong> uit de koelkast. 
          3 minuten opwarmen. Perfect op je macro's.
          <br /><br />
          <span style={{ 
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: '#10b981',
            fontWeight: '700'
          }}>
            Doelen behaald. 💪
          </span>
        </p>
      </div>
      
      {/* Benefits Grid */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '800',
          color: '#fff',
          margin: `0 0 ${isMobile ? '1.25rem' : '1.5rem'} 0`,
          textAlign: 'center'
        }}>
          Waarom Meal Prep Werkt
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem'
        }}>
          {[
            {
              emoji: '⏰',
              title: 'Tijdsbesparing',
              description: 'Kook 1x per week, eet 7 dagen klaar'
            },
            {
              emoji: '💰',
              title: 'Goedkoper',
              description: 'Koop in bulk, minder verspilling'
            },
            {
              emoji: '🎯',
              title: 'Macro Controle',
              description: 'Je weet exact wat je binnenkrijgt'
            },
            {
              emoji: '🧠',
              title: 'Geen Beslissingen',
              description: 'Eten is klaar, geen nadenken'
            },
            {
              emoji: '💪',
              title: 'Consistentie',
              description: 'Elke dag je doelen halen'
            },
            {
              emoji: '😌',
              title: 'Minder Stress',
              description: 'Geen paniek om wat te eten'
            }
          ].map((benefit, index) => (
            <div
              key={index}
              style={{
                padding: isMobile ? '1.25rem' : '1.5rem',
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
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.875rem' : '1rem',
                marginBottom: isMobile ? '0.5rem' : '0.625rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  flexShrink: 0
                }}>
                  {benefit.emoji}
                </div>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: '700',
                  color: '#10b981',
                  margin: 0
                }}>
                  {benefit.title}
                </h3>
              </div>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                lineHeight: '1.5',
                paddingLeft: isMobile ? '2.625rem' : '3rem'
              }}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Call to Action */}
      <div style={{
        padding: isMobile ? '1.5rem' : '2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: isMobile ? '16px' : '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          🚀
        </div>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: '800',
          color: '#3b82f6',
          margin: '0 0 0.75rem 0'
        }}>
          Klaar voor de volgende stap?
        </h3>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6',
          margin: 0
        }}>
          In de volgende stap gaan we samen kijken welke maaltijden 
          <strong style={{ color: '#3b82f6' }}> JIJ</strong> wilt meal preppen 
          en hoe je dit het beste kunt opzetten voor jouw situatie.
        </p>
      </div>
      
      <style>{`
        @keyframes float {
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
