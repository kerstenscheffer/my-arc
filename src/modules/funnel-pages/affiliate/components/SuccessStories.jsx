import { useState } from 'react'
import { Star, Quote, TrendingUp, Euro, Users } from 'lucide-react'

export default function SuccessStories({ isMobile, onOpenCalendly }) {
  const [activeStory, setActiveStory] = useState(0)

  const stories = [
    {
      name: 'Mark van der Berg',
      role: 'Fitness Influencer',
      avatar: 'M',
      earnings: '€2.400',
      timeframe: '3 maanden',
      clients: 12,
      quote: 'Ik post sowieso over fitness, nu verdien ik er ook aan. De 20% korting voor mijn volgers is perfect en het systeem werkt gewoon.',
      highlight: '€800/maand passief'
    },
    {
      name: 'Sarah de Vries',
      role: 'Personal Trainer',
      avatar: 'S',
      earnings: '€3.200',
      timeframe: '4 maanden',
      clients: 16,
      quote: 'Mijn klanten willen online coaching maar ik heb geen tijd. Nu verwijs ik ze door naar MY ARC en verdien commissie. Win-win!',
      highlight: 'Eerste €200 binnen 30 dagen'
    },
    {
      name: 'Tom Jansen',
      role: 'Gym Owner',
      avatar: 'T',
      earnings: '€5.600',
      timeframe: '6 maanden',
      clients: 28,
      quote: 'Leden vragen vaak naar voeding en online programma\'s. Met MY ARC help ik ze én verdien ik extra zonder werk.',
      highlight: '28 succesvolle verwijzingen'
    }
  ]

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden ambient glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.04) 0%, transparent 60%)',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '1100px',
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
            Partner Succesverhalen
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
            Zij Gingen Je Voor
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            En Verdienen Nu Consistent
          </span>
        </h2>

        {/* Stories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          marginBottom: '3rem'
        }}>
          {stories.map((story, index) => (
            <div
              key={index}
              style={{
                background: activeStory === index
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
                border: activeStory === index
                  ? '1px solid rgba(255, 215, 0, 0.25)'
                  : '1px solid rgba(255, 215, 0, 0.12)',
                borderRadius: '20px',
                padding: isMobile ? '1.5rem' : '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: activeStory === index ? 'scale(1.02)' : 'scale(1)',
                boxShadow: activeStory === index
                  ? '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.1)'
                  : '0 10px 30px rgba(0, 0, 0, 0.5)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onClick={() => setActiveStory(index)}
            >
              {/* Header with avatar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: '#000',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                }}>
                  {story.avatar}
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {story.name}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {story.role}
                  </div>
                </div>
              </div>

              {/* Earnings highlight */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 215, 0, 0.15)'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.25rem'
                }}>
                  {story.earnings}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  in {story.timeframe} · {story.clients} klanten
                </div>
              </div>

              {/* Quote */}
              <div style={{
                position: 'relative',
                marginBottom: '1.5rem'
              }}>
                <Quote 
                  size={16} 
                  color="rgba(255, 215, 0, 0.3)" 
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    left: '-5px'
                  }}
                />
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                  paddingLeft: '1rem'
                }}>
                  "{story.quote}"
                </p>
              </div>

              {/* Highlight badge */}
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '100px',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: '#10b981',
                fontWeight: '600'
              }}>
                ✓ {story.highlight}
              </div>

              {/* Stars */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                marginTop: '1rem'
              }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill="#FFD700"
                    color="#FFD700"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Statistics bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '3rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          {[
            { value: '127+', label: 'Actieve Partners' },
            { value: '€385K', label: 'Uitgekeerd' },
            { value: '98%', label: 'Tevredenheid' },
            { value: '24u', label: 'Support Response' }
          ].map((stat, index) => (
            <div key={index} style={{
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                color: '#FFD700',
                marginBottom: '0.25rem'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onOpenCalendly}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(255, 215, 0, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.3)'
            }}
          >
            Word Ook Succesvol Partner
          </button>
        </div>
      </div>
    </section>
  )
}
