// ========================================
// 📁 src/funnel/sections/ValueStackComplete.jsx
// REBUILT: WeekList Styling Pattern + Icons
// GOLD-BROWN THEME - Only colors changed + CTA button added
// ========================================
import React, { useState, useEffect } from 'react'
import { 
  X,
  MessageCircle, 
  Dumbbell, 
  ShoppingCart, 
  ChefHat, 
  Moon, 
  Brain, 
  Users, 
  Smartphone,
  Pill,
  ArrowRight
} from 'lucide-react'

export default function ValueStackComplete({ onScrollNext, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [hoveredButton, setHoveredButton] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  // Helper om **text** om te zetten naar bold
  const renderBoldText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'rgba(255, 255, 255, 0.68)', fontWeight: '650' }}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const scrollToNext = () => {
    if (onNavigate) {
      onNavigate(2) // Go to Garanties (section-2)
    } else if (onScrollNext) {
      onScrollNext()
    } else {
      const nextSection = document.getElementById('section-2')
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const valueCards = [
    {
      icon: MessageCircle,
      iconColor: '#ffba09', // GOLD
      title: "Wekelijkse 1-op-1 Coaching",
      description: "Elke week **persoonlijk contact** via call of WhatsApp om je **voortgang** te bespreken.",
      fullDescription: "Elke week persoonlijk contact via call of WhatsApp. We bespreken je voortgang, passen het plan aan waar nodig, en zorgen dat je op koers blijft naar je doel. Geen standaard templates - alles wordt aangepast op basis van hoe jouw week is gegaan.",
      image: "https://i.ibb.co/dd3bKQX/4.png"
    },
    {
      icon: Dumbbell,
      iconColor: '#ffba09',
      title: "Spiergroei Schema Op Maat",
      description: "Persoonlijk workout schema volledig afgestemd op **jouw leven** en **doelen**.",
      fullDescription: "Persoonlijk workout schema volledig afgestemd op jouw leven en doelen. Maximale spiergroei met het juiste volume, intensiteit en herstel. Dit plan werkt voor altijd, niet alleen 2 maanden. We bouwen een systeem dat met je meegroeit.",
      image: "https://i.ibb.co/6Rmd50GW/5.png"
    },
    {
      icon: ShoppingCart,
      iconColor: '#ffba09',
      title: "Budget Shopping Strategie",
      description: "**Slimme boodschappenlijsten** waarmee je tientallen euro's per week **bespaart**.",
      fullDescription: "Slimme boodschappenlijsten en strategieën waarmee je tientallen euro's per week bespaart. Goede voeding hoeft niet duur te zijn - je leert precies wat en waar te kopen. We laten je zien hoe je met een beperkt budget toch optimaal kunt groeien.",
      image: "https://i.ibb.co/GQvPKZsB/6.png"
    },
    {
      icon: ChefHat,
      iconColor: '#ffba09',
      title: "Snel & Lekkere Meal Planning",
      description: "Meal plans met **snelle, lekkere** maaltijden die je **energie** geven.",
      fullDescription: "Meal plans met snelle, lekkere maaltijden die je energie geven. Geen saaie kipfilet met rijst - wel smaakvol eten dat bij je past en je sterk houdt de hele dag. Alle recepten zijn praktisch, haalbaar en binnen 20-30 minuten te maken.",
      image: "https://i.ibb.co/fVBpKfsJ/7.png"
    },
    {
      icon: Moon,
      iconColor: '#ffba09',
      title: "Herstel Stimulerend Slaap Plan",
      description: "Strategieën om het meeste uit je **slaap** te halen voor **maximaal herstel**.",
      fullDescription: "Ondersteuning en strategieën om het meeste uit je slaap te halen. Beter slapen = sneller herstel, meer energie, en betere resultaten. Je leert hoe slaap je geheime wapen wordt. We optimaliseren je slaapritme, omgeving en gewoontes.",
      image: "https://i.ibb.co/SwTcyFP4/8.png"
    },
    {
      icon: Brain,
      iconColor: '#ffba09',
      title: "Mentale Kracht Ontwikkeling",
      description: "**Mentale tools** en ondersteuning om het plan **vol te houden**.",
      fullDescription: "Mentale tools en ondersteuning om het plan vol te houden, ook op moeilijke dagen. Je leert discipline opbouwen, doorzetten wanneer het lastig is, en consistent blijven. We werken aan de mindset die nodig is voor langdurige transformatie.",
      image: "https://i.ibb.co/3y8zGSYt/9.png"
    },
    {
      icon: Users,
      iconColor: '#ffba09',
      title: "My Arc Community - Samen Groeien",
      description: "Toegang tot een groep **gemotiveerde mannen** met hetzelfde **doel**.",
      fullDescription: "Toegang tot een groep gemotiveerde mannen met hetzelfde doel. Wekelijkse e-books, tips, weetjes, motivatie en ervaringen delen. Jullie pushen elkaar naar succes. Je staat er niet alleen voor - omring jezelf met mensen die hetzelfde pad bewandelen.",
      image: "https://i.ibb.co/Rp4fGwVq/10.png"
    },
    {
      icon: Smartphone,
      iconColor: '#ffba09',
      title: "Exclusieve Toegang Tot De App",
      description: "**Alles in één app**: workouts, meal plans, **voortgang** en communicatie.",
      fullDescription: "Alles in één app: je workouts, meal plans, voortgang, statistieken en communicatie. Volledige controle en overzicht altijd binnen handbereik op je telefoon. Geen verwarring, geen zoeken - alles georganiseerd en overzichtelijk in één plek.",
      image: "https://i.ibb.co/8Lxh2G3J/13.png"
    },
    {
      icon: Pill,
      iconColor: '#ffba09',
      title: "Smart Supplementen Advies",
      description: "Advies op maat over welke supplementen **echt werken** voor **jouw situatie**.",
      fullDescription: "Advies op maat over welke supplementen echt werken voor jouw situatie. Geen onnodige uitgaven - alleen wat je daadwerkelijk helps om je doel sneller te bereiken. We kijken naar jouw voeding, budget en doelen om de juiste keuzes te maken.",
      image: "https://i.ibb.co/nqPZBvxj/11.png"
    }
  ]

  return (
    <section 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        position: 'relative',
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Floating orbs - GOLD */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(255, 186, 9, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: isMobile ? '350px' : '600px',
        height: isMobile ? '350px' : '600px',
        background: 'radial-gradient(circle, rgba(212, 160, 6, 0.06) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '3rem' : '4rem',
        maxWidth: '900px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 2
      }}>
        <h2 style={{
          fontSize: isMobile ? '2.5rem' : '4rem',
          fontWeight: '900',
          lineHeight: '1.1',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          letterSpacing: '-0.02em'
        }}>
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 12px rgba(255, 186, 9, 0.15))'
          }}>
            Wat Zit Er In Het Programma?
          </span>
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '600',
          letterSpacing: '0.01em',
          lineHeight: 1.4
        }}>
          Alles wat je nodig hebt om 5-8KG spier op te bouwen
        </p>
      </div>

      {/* Value cards - 3 COLUMN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        maxWidth: '1400px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        position: 'relative',
        zIndex: 2
      }}>
        {valueCards.map((card, index) => {
          const isHovered = hoveredCard === index
          const Icon = card.icon
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedCard(card)}
              onTouchStart={() => isMobile && setHoveredCard(index)}
              onTouchEnd={() => isMobile && setTimeout(() => setHoveredCard(null), 300)}
              style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isHovered ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
                borderRadius: isMobile ? '12px' : '14px',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isVisible ? 1 : 0,
                animation: `fadeInUp 0.5s ${index * 0.08}s forwards`,
                boxShadow: isHovered 
                  ? '0 8px 24px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
                  : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                overflow: 'hidden',
                minHeight: isMobile ? 'auto' : '100px'
              }}
            >
              {/* Top accent line - GOLD */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
                opacity: 0.6,
                zIndex: 3
              }} />

              {/* Shine overlay - GOLD */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.04) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Image - COMPACT */}
              <div style={{
                width: isMobile ? '80px' : '100px',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
                zIndex: 2,
                borderRadius: isMobile ? '12px 0 0 12px' : '14px 0 0 14px'
              }}>
                <img 
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
                    transition: 'filter 0.3s ease'
                  }}
                />
              </div>

              {/* Content - COMPACT */}
              <div style={{
                flex: 1,
                padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: isMobile ? '0.5rem' : '0.6rem',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Icon + Title - HORIZONTAL - GOLD ICON */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icon 
                    size={isMobile ? 18 : 20} 
                    color="#ffba09"
                    strokeWidth={2.5}
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(255, 186, 9, 0.4))',
                      flexShrink: 0
                    }}
                  />
                  <h3 style={{
                    fontSize: isMobile ? '0.95rem' : '1.1rem',
                    fontWeight: '700',
                    color: '#fff',
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    {card.title}
                  </h3>
                </div>

                <p style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {renderBoldText(card.description)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA Button - Same as HeroTransformation */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        position: 'relative',
        zIndex: 2
      }}>
        <button
          onClick={scrollToNext}
          onMouseEnter={() => setHoveredButton(true)}
          onMouseLeave={() => setHoveredButton(false)}
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
            background: hoveredButton
              ? 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.15) 100%)'
              : 'rgba(255, 186, 9, 0.08)',
            border: `1px solid ${hoveredButton ? 'rgba(255, 186, 9, 0.3)' : 'rgba(255, 186, 9, 0.15)'}`,
            borderRadius: isMobile ? '12px' : '14px',
            padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: hoveredButton ? '#ffba09' : '#d4a006',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hoveredButton ? 'translateY(-2px)' : 'translateY(0)',
            boxShadow: hoveredButton
              ? '0 4px 12px rgba(255, 186, 9, 0.15)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            letterSpacing: '0.01em'
          }}
        >
          <span>Bekijk Garanties</span>
          <ArrowRight 
            size={isMobile ? 18 : 20} 
            style={{
              transition: 'transform 0.3s ease',
              transform: hoveredButton ? 'translateX(4px)' : 'translateX(0)'
            }}
          />
        </button>
      </div>

      {/* Modal - PREMIUM - GOLD */}
      {selectedCard && (
        <div
          onClick={() => setSelectedCard(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '1rem' : '2rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '700px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(23, 23, 23, 0.9) 100%)',
              backdropFilter: 'blur(30px)',
              border: '2px solid rgba(255, 186, 9, 0.4)',
              borderRadius: '24px',
              padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 100px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Top accent line - GOLD */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #ffba09 0%, #d4a006 50%, #ffba09 100%)',
              opacity: 0.8,
              zIndex: 3
            }} />

            {/* Shine overlay - GOLD */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 186, 9, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Close button - GOLD */}
            <button
              onClick={() => setSelectedCard(null)}
              style={{
                position: 'absolute',
                top: isMobile ? '1rem' : '1.5rem',
                right: isMobile ? '1rem' : '1.5rem',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 186, 9, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 186, 9, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: '#ffba09',
                zIndex: 3,
                boxShadow: '0 4px 15px rgba(255, 186, 9, 0.2)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 186, 9, 0.25)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 186, 9, 0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={22} strokeWidth={2.5} />
            </button>

            {/* Title - GOLD GRADIENT */}
            <h3 style={{
              fontSize: isMobile ? '1.4rem' : '1.75rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 1.5rem 0',
              position: 'relative',
              zIndex: 2,
              paddingRight: '3rem'
            }}>
              {selectedCard.title}
            </h3>

            {/* Full description */}
            <p style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: '1.8',
              margin: 0,
              position: 'relative',
              zIndex: 2
            }}>
              {selectedCard.fullDescription}
            </p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.05); }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
