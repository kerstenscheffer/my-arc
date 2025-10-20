import { useState, useEffect } from 'react'
import { Calendar, Shield, User, Clock, HelpCircle } from 'lucide-react'
import SignupModal from './SignupModal'

export default function OfferSection({ isMobile }) {
  const [showModal, setShowModal] = useState(false)
  const [visibleElements, setVisibleElements] = useState(0)
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes in seconds

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 180 // Reset to 3 minutes
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Scroll to FAQ section
  const scrollToFAQ = () => {
    const faqSection = document.getElementById('section-faq')
    if (faqSection) {
      faqSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' 
      })
    }
  }

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 600)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const features = [
    { icon: Shield, text: "Resultaat Garantie" },
    { icon: User, text: "1-op-1 Plan" }, 
    { icon: Clock, text: "8 Weken" }
  ]

  return (
    <>
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem', // Kleinere margin
        background: '#111',
        position: 'relative'
      }}>
        
        {/* Subtle background accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.02) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center'
        }}>
          
          {/* Main Headline */}
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.75rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '1rem' : '1.25rem',
            letterSpacing: '-0.02em',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Gratis 8 weken onder een coach trainen?
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.4',
            marginBottom: isMobile ? '2.5rem' : '3rem',
            fontWeight: '500',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.1s'
          }}>
            Advies, Uitleg, Actieplannen en Coaching
          </p>

          {/* Nieuwe ronde bericht */}
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            opacity: visibleElements >= 1 ? 1 : 0,
            transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.2s'
          }}>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(16, 185, 129, 0.9)',
              margin: 0,
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center'
            }}>
              <Calendar size={14} />
              Nieuwe ronde start in
            </p>
          </div>

          {/* CTA Button met Timer */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.25rem 2rem' : '1.5rem 2.5rem',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '56px',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
              marginBottom: isMobile ? '2.5rem' : '3rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              width: isMobile ? '85%' : '400px', // Veel breder
              maxWidth: '500px',
              opacity: visibleElements >= 1 ? 1 : 0,
              transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.25)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
            }}
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
          >
            <span>Start mijn transformatie</span>
            
            {/* Subtiele timer */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backdropFilter: 'blur(5px)'
            }}>
              <Clock size={12} />
              {formatTime(timeLeft)}
            </div>
          </button>

          {/* Features - Altijd horizontaal */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '1.5rem' : '3rem',
            marginBottom: isMobile ? '2.5rem' : '3rem',
            opacity: visibleElements >= 2 ? 1 : 0,
            transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.4s',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: '500',
                minWidth: isMobile ? '80px' : 'auto',
                justifyContent: 'center'
              }}>
                <feature.icon size={isMobile ? 16 : 18} color="rgba(16, 185, 129, 0.8)" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* FAQ Button - Nu met scroll functie */}
          <button
            onClick={scrollToFAQ}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: isMobile ? '10px' : '12px',
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 1.75rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: visibleElements >= 3 ? 1 : 0,
              transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '0.5s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
            }}
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
          >
            <HelpCircle size={isMobile ? 16 : 18} />
            Vragen? Bekijk Antwoorden
          </button>
        </div>
      </section>

      {/* Signup Modal */}
      <SignupModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
