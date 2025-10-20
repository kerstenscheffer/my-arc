import { useState, useEffect } from 'react'
import { Calendar, Shield, User, Clock } from 'lucide-react'
import SignupModal from './SignupModal'

export default function OfferSection({ isMobile }) {
  const [showModal, setShowModal] = useState(false)
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 3; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 800)
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '4rem 1rem' : '5rem 2rem',
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
          maxWidth: '700px',
          width: '100%',
          textAlign: 'center'
        }}>
          
          {/* Main Headline */}
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '3rem' : '4rem',
            letterSpacing: '-0.02em',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Gratis 8 Weken-Onder de-Radar-Transformeren?
          </h2>

          {/* CTA Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '1.125rem 2.25rem' : '1.25rem 2.75rem',
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '50px',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
              marginBottom: isMobile ? '3rem' : '4rem',
              display: 'inline-block',
              opacity: visibleElements >= 1 ? 1 : 0,
              transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
              transitionDelay: '0.2s'
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
            Start direct
          </button>

          {/* Features */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '1.25rem' : '2.5rem',
            marginBottom: isMobile ? '3rem' : '4rem',
            opacity: visibleElements >= 2 ? 1 : 0,
            transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.4s'
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '500'
              }}>
                <feature.icon size={isMobile ? 16 : 18} color="rgba(16, 185, 129, 0.8)" />
                <span>{feature.text}</span>
                {index < features.length - 1 && !isMobile && (
                  <div style={{
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    marginLeft: '1.5rem'
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Subtle urgency indicator */}
          <div style={{
            padding: isMobile ? '1rem 1.5rem' : '1.25rem 2rem',
            background: 'rgba(16, 185, 129, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            borderRadius: '12px',
            display: 'inline-block',
            opacity: visibleElements >= 3 ? 1 : 0,
            transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.6s'
          }}>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              <Calendar size={14} color="rgba(16, 185, 129, 0.6)" />
              Nieuwe ronde start 31/09 - Schrijf je nu in
            </p>
          </div>
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
