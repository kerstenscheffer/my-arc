import React, { useState, useEffect } from 'react'
import { Check, X, Star, Crown, Zap } from 'lucide-react'

export default function PriceAnchorSection({ isMobile: propIsMobile, onScrollNext, onOpenCalendly }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('your-arc')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  const scrollToOffer = (planId) => {
    setSelectedPlan(planId)
    const element = document.getElementById(`offer-${planId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const plans = {
    premium: {
      id: 'premium',
      name: 'PREMIUM ARC',
      price: '€2.997',
      period: '/maand',
      description: 'De ultimate 1-op-1 experience',
      color: '#fbbf24',
      features: [
        { text: 'Onbeperkt personal training sessies', included: true },
        { text: 'Onbeperkt coaching calls', included: true },
        { text: 'Volledig persoonlijk workout plan', included: true },
        { text: 'Volledig persoonlijk maaltijdplan', included: true },
        { text: 'Done FOR you meal prepping', included: true },
        { text: 'Done FOR you boodschappen', included: true },
        { text: '24/7 accountability - dagelijks contact', included: true },
        { text: 'Gratis supplementen pakket (€200/maand)', included: true },
        { text: 'VIP affiliatie programma (2x commissie)', included: true },
        { text: 'Privé WhatsApp met coach', included: true }
      ],
      cta: 'Info Aanvragen',
      ctaStyle: 'secondary'
    },
    'your-arc': {
      id: 'your-arc',
      name: 'YOUR ARC',
      price: '€197',
      period: '/maand',
      description: 'De complete transformatie',
      color: '#10b981',
      badge: 'MEEST GEKOZEN',
      highlight: true,
      features: [
        { text: '6 Coaching calls + bonus calls', included: true },
        { text: 'Volledig persoonlijk workout plan', included: true },
        { text: 'Volledig persoonlijk maaltijdplan', included: true },
        { text: 'Onbeperkt MY ARC app - ALLE features', included: true },
        { text: 'Done WITH you meal prepping', included: true },
        { text: 'Done WITH you boodschappen', included: true },
        { text: '24/7 accountability coaching', included: true },
        { text: 'Persoonlijke supplementen advies', included: true },
        { text: 'MY ARC affiliatie - verdien alles terug', included: true }
      ],
      cta: 'Start Nu Met YOUR ARC',
      ctaStyle: 'primary'
    },
    minimal: {
      id: 'minimal',
      name: 'MINIMAL ARC',
      price: '€97',
      period: '/maand',
      description: 'Perfect om te beginnen',
      color: '#6b7280',
      features: [
        { text: '4 Coaching calls per maand', included: true },
        { text: 'Persoonlijk workout plan', included: true },
        { text: 'Persoonlijk maaltijdplan', included: true },
        { text: 'MY ARC app basis toegang', included: true },
        { text: 'Wekelijkse check-in', included: true },
        { text: 'Community toegang', included: true },
        { text: 'Done WITH you systemen', included: false },
        { text: '24/7 accountability', included: false },
        { text: 'Affiliatie programma', included: false }
      ],
      cta: 'Begin Met Minimal',
      ctaStyle: 'secondary'
    }
  }

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
      {/* Background orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        maxWidth: '900px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '2rem',
          letterSpacing: '-0.02em',
          filter: 'drop-shadow(0 2px 20px rgba(16, 185, 129, 0.3))'
        }}>
          Kies Uit 3 Transformatie Levels
        </h2>

        {/* Plan selector buttons */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {Object.values(plans).map((plan) => (
            <button
              key={plan.id}
              onClick={() => scrollToOffer(plan.id)}
              style={{
                padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                background: selectedPlan === plan.id 
                  ? `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}CC 100%)`
                  : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${selectedPlan === plan.id ? plan.color : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '12px',
                color: selectedPlan === plan.id ? '#fff' : plan.color,
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                if (selectedPlan !== plan.id) {
                  e.currentTarget.style.background = `${plan.color}20`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPlan !== plan.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {plan.name}
            </button>
          ))}
        </div>
        
        {/* Subheader */}
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '300',
          letterSpacing: '0.02em',
          marginBottom: '1rem'
        }}>
          3 Opties, Dezelfde Missie: Jouw Transformatie
        </p>

        {/* 87% banner */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '100px',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: '#10b981'
        }}>
          <Star size={16} />
          <span>87% van onze klanten kiest YOUR ARC</span>
        </div>
      </div>

      {/* Offers in vertical layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '3rem' : '4rem',
        maxWidth: '800px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem'
      }}>
        {/* PREMIUM ARC */}
        <div
          id="offer-premium"
          onMouseEnter={() => setHoveredCard('premium')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.03) 100%)',
            border: '3px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '24px',
            padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
            position: 'relative',
            transform: hoveredCard === 'premium' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 30px 80px rgba(255, 215, 0, 0.3), 0 0 120px rgba(255, 215, 0, 0.2)',
            opacity: isVisible ? 1 : 0,
            animation: 'fadeInUp 0.6s forwards'
          }}
        >
          {/* Premium badge */}
          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            padding: '0.5rem 1.5rem',
            borderRadius: '100px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '800',
            color: '#000',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Crown size={16} />
            FALEN ONMOGELIJK
          </div>

          {/* Plan name and price */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              color: '#FFD700',
              marginBottom: '0.5rem',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
            }}>
              {plans.premium.name}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
              marginBottom: '1rem'
            }}>
              {plans.premium.description}
            </p>
            <div style={{
              fontSize: isMobile ? '3rem' : '4rem',
              fontWeight: '900',
              color: '#FFD700',
              lineHeight: '1',
              textShadow: '0 0 50px rgba(255, 215, 0, 0.6)',
              filter: 'drop-shadow(0 4px 20px rgba(255, 215, 0, 0.4))'
            }}>
              {plans.premium.price}
              <span style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: 'rgba(255, 215, 0, 0.7)'
              }}>
                {plans.premium.period}
              </span>
            </div>
          </div>

          {/* Features */}
          <div style={{ marginBottom: '2rem' }}>
            {plans.premium.features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}
              >
                <Check 
                  size={18} 
                  color="#FFD700"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.4'
                }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'transparent',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '700',
              color: '#FFD700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {plans.premium.cta}
          </button>
        </div>

        {/* YOUR ARC */}
        <div
          id="offer-your-arc"
          onMouseEnter={() => setHoveredCard('your-arc')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '24px',
            padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 2.5rem',
            position: 'relative',
            transform: hoveredCard === 'your-arc' ? 'translateY(-8px) scale(1.02)' : 'translateY(-4px) scale(1.01)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 60px rgba(16, 185, 129, 0.25), 0 0 100px rgba(16, 185, 129, 0.15)',
            opacity: isVisible ? 1 : 0,
            animation: 'fadeInUp 0.6s 0.15s forwards'
          }}
        >
          {/* Badge */}
          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '0.5rem 1.5rem',
            borderRadius: '100px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '800',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.1em',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            {plans['your-arc'].badge}
          </div>

          {/* Plan details */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {plans['your-arc'].name}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
              marginBottom: '1rem'
            }}>
              {plans['your-arc'].description}
            </p>
            <div style={{
              fontSize: isMobile ? '3rem' : '4rem',
              fontWeight: '900',
              color: '#10b981',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
            }}>
              {plans['your-arc'].price}
              <span style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: 'rgba(16, 185, 129, 0.7)'
              }}>
                {plans['your-arc'].period}
              </span>
            </div>
          </div>

          {/* Features */}
          <div style={{ marginBottom: '2rem' }}>
            {plans['your-arc'].features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}
              >
                <Check 
                  size={18} 
                  color="#10b981"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <span style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: '1.4'
                }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onOpenCalendly}
            style={{
              width: '100%',
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: '700',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)'
            }}
          >
            {plans['your-arc'].cta}
          </button>

          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            animation: 'pulse 3s ease-in-out infinite',
            zIndex: -1
          }} />
        </div>

        {/* MINIMAL ARC */}
        <div
          id="offer-minimal"
          onMouseEnter={() => setHoveredCard('minimal')}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(107, 114, 128, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
            position: 'relative',
            transform: hoveredCard === 'minimal' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            opacity: isVisible ? 1 : 0,
            animation: 'fadeInUp 0.6s 0.3s forwards'
          }}
        >
          {/* Plan details */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: '#9ca3af',
              marginBottom: '0.5rem'
            }}>
              {plans.minimal.name}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
              marginBottom: '1rem'
            }}>
              {plans.minimal.description}
            </p>
            <div style={{
              fontSize: isMobile ? '2.5rem' : '3rem',
              fontWeight: '900',
              color: '#9ca3af',
              lineHeight: '1'
            }}>
              {plans.minimal.price}
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(156, 163, 175, 0.7)'
              }}>
                {plans.minimal.period}
              </span>
            </div>
          </div>

          {/* Features */}
          <div style={{ marginBottom: '2rem' }}>
            {plans.minimal.features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}
              >
                {feature.included ? (
                  <Check 
                    size={18} 
                    color="#9ca3af"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                ) : (
                  <X 
                    size={18} 
                    color="#4b5563"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                )}
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: feature.included ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                  lineHeight: '1.4'
                }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'transparent',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              borderRadius: '12px',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '700',
              color: '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {plans.minimal.cta}
          </button>
        </div>
      </div>

      {/* Bottom comparison text */}
      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        opacity: isVisible ? 1 : 0,
        animation: 'fadeInUp 0.8s 0.9s forwards'
      }}>
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: '#10b981',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          YOUR ARC biedt 93% korting op de PREMIUM waarde
        </p>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Dezelfde transformatie, slimmere investering
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
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
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  )
}
