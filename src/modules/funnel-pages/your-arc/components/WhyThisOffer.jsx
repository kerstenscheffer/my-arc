import React, { useState, useEffect } from 'react'
import { Heart, Users, Target, Star, CheckCircle, TrendingUp, Award, ArrowRight } from 'lucide-react'

export default function WhyThisOffer({ isMobile: propIsMobile, onScrollNext, onOpenCalendly }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [isButtonHovered, setIsButtonHovered] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  const reasons = [
    {
      icon: Heart,
      title: "Omdat Ik Dit Zelf Heb Meegemaakt",
      description: "Ik was 130kg, depressief en had geen energie. Nu help ik anderen dezelfde transformatie maken die mijn leven heeft gered.",
      color: '#ef4444'
    },
    {
      icon: Users,
      title: "Omdat 127 Mensen Al Zijn Geslaagd",
      description: "Elke maand transformeer ik levens. Van 18 tot 67 jaar, man of vrouw - het systeem werkt voor iedereen die committed is.",
      color: '#10b981'
    },
    {
      icon: Target,
      title: "Omdat Je Het Verdient",
      description: "Je hebt al zo vaak geprobeerd. Dit keer wordt anders. Met de juiste begeleiding ga je het eindelijk voor elkaar krijgen.",
      color: '#3b82f6'
    }
  ]

  const testimonials = [
    {
      name: "Mark de Vries",
      age: 42,
      result: "-18kg in 12 weken",
      quote: "Na 20 jaar struggelen eindelijk een systeem dat werkt. Kersten is een game-changer.",
      rating: 5
    },
    {
      name: "Lisa Janssen", 
      age: 28,
      result: "-12kg + Kracht verdubbeld",
      quote: "Niet alleen afgevallen maar sterker dan ooit. De mindset coaching was de key.",
      rating: 5
    },
    {
      name: "Ahmed El Hamdi",
      age: 35,
      result: "-25kg in 6 maanden",
      quote: "Van pre-diabetic naar de vorm van mijn leven. Kersten heeft letterlijk mijn leven gered.",
      rating: 5
    }
  ]

  const stats = [
    { number: "127+", label: "Succesvolle Transformaties" },
    { number: "98%", label: "Slagingspercentage" },
    { number: "4.9", label: "Gemiddelde Beoordeling" },
    { number: "€50k+", label: "Terugverdiend Door Leden" }
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
      {/* Subtle overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.03) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 30s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '3rem' : '4rem',
        maxWidth: '900px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3.5rem',
          fontWeight: '900',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          <span style={{
            display: 'block',
            fontSize: isMobile ? '1.25rem' : '1.75rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Misschien vraag je je af...
          </span>
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 20px rgba(16, 185, 129, 0.3))'
          }}>
            "Waarom Dit Krankzinnige Aanbod?"
          </span>
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '300',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          3 eerlijke redenen waarom ik zoveel waarde weggeef voor zo weinig
        </p>
      </div>

      {/* Reasons cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1.5rem' : '2rem',
        maxWidth: '1100px',
        width: '100%',
        marginBottom: isMobile ? '4rem' : '5rem'
      }}>
        {reasons.map((reason, index) => {
          const Icon = reason.icon
          const isHovered = hoveredCard === index
          
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: `1px solid ${isHovered ? reason.color + '40' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '20px',
                padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
                position: 'relative',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                opacity: isVisible ? 1 : 0,
                animation: `fadeInUp 0.6s ${index * 0.15}s forwards`,
                boxShadow: isHovered 
                  ? `0 25px 50px ${reason.color}20` 
                  : '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Icon */}
              <div style={{
                width: isMobile ? '60px' : '70px',
                height: isMobile ? '60px' : '70px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${reason.color}15 0%, ${reason.color}05 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: `1px solid ${reason.color}30`
              }}>
                <Icon 
                  size={isMobile ? 30 : 35} 
                  color={reason.color}
                  style={{
                    filter: `drop-shadow(0 0 15px ${reason.color}50)`
                  }}
                />
              </div>

              {/* Content */}
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: reason.color,
                marginBottom: '1rem',
                textAlign: 'center',
                letterSpacing: '-0.01em'
              }}>
                {reason.title}
              </h3>

              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.6',
                textAlign: 'center',
                margin: 0
              }}>
                {reason.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Stats section */}
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        marginBottom: isMobile ? '4rem' : '5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0.95) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '2rem' : '3rem',
        backdropFilter: 'blur(20px)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '2rem' : '3rem'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '2rem' : '3rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem',
                filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))'
              }}>
                {stat.number}
              </div>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '500'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        marginBottom: isMobile ? '3rem' : '4rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '700',
          color: '#10b981',
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          Wat Anderen Zeggen
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem'
        }}>
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                borderRadius: '16px',
                padding: isMobile ? '1.5rem' : '2rem',
                opacity: isVisible ? 1 : 0,
                animation: `fadeInUp 0.6s ${0.6 + index * 0.1}s forwards`
              }}
            >
              {/* Stars */}
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                marginBottom: '1rem'
              }}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    size={16} 
                    fill="#FFD700" 
                    color="#FFD700"
                  />
                ))}
              </div>

              {/* Quote */}
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
                fontStyle: 'italic'
              }}>
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    {testimonial.name}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {testimonial.age} jaar
                  </div>
                </div>
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '700',
                  color: '#10b981',
                  textAlign: 'right'
                }}>
                  {testimonial.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={onOpenCalendly}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
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
            backgroundImage: isButtonHovered 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(16, 185, 129, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
            backgroundSize: '200% 100%',
            backgroundPosition: isButtonHovered ? '0% 50%' : '100% 50%',
            backgroundColor: 'transparent',
            border: isButtonHovered 
              ? '2px solid #10b981'
              : '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            color: isButtonHovered ? '#fff' : '#10b981',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isButtonHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
            boxShadow: isButtonHovered 
              ? '0 25px 50px rgba(16, 185, 129, 0.4), 0 0 100px rgba(16, 185, 129, 0.3)'
              : '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 60px rgba(16, 185, 129, 0.15)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            position: 'relative',
            overflow: 'hidden',
            textShadow: isButtonHovered 
              ? '0 2px 4px rgba(0, 0, 0, 0.3)'
              : '0 0 20px rgba(16, 185, 129, 0.5)'
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
            animation: isButtonHovered ? 'glide 2s ease-in-out infinite' : 'glide 4s ease-in-out infinite',
            pointerEvents: 'none'
          }} />
          
          <span style={{ position: 'relative', zIndex: 1 }}>
            Ik Ben Klaar Om Te Starten
          </span>
          <ArrowRight 
            size={isMobile ? 20 : 24} 
            style={{ 
              position: 'relative',
              zIndex: 1,
              animation: 'slideRight 2s ease-in-out infinite'
            }} 
          />
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>
    </section>
  )
}
