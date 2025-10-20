import { useState, useEffect } from 'react'
import { Mail, Download, CheckCircle, Zap, Clock, Target } from 'lucide-react'

export default function EmailCaptureSection({ isMobile }) {
  const [visibleElements, setVisibleElements] = useState(0)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
    { icon: Zap, text: "Natuurlijke energie" },
    { icon: Clock, text: "10 min/dag" },
    { icon: Target, text: "Simpele stappen" }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    
    setIsSubmitting(true)
    
    // Simulate API call - hier komt later DatabaseService.createLead()
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <section style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      background: '#0a0a0a',
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

        {isSuccess ? (
          /* Success State */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.6s ease'
            }}>
              <CheckCircle size={40} color="rgba(16, 185, 129, 0.9)" />
            </div>
            
            <div>
              <h3 style={{
                fontSize: isMobile ? '2rem' : '2.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                Check je email!
              </h3>
              
              <p style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                Je 7-Dagen Energie Boost Plan staat klaar in je inbox. 
                Vergeet niet je spam folder te checken!
              </p>
            </div>
          </div>
        ) : (
          /* Main Form State */
          <>
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
              7-Dagen Energie Boost Plan
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
              Voel je al na 1 week energieker en fitter zonder drastische veranderingen
            </p>

            {/* Gratis Download bericht */}
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
                <Download size={14} />
                Gratis Download
              </p>
            </div>

            {/* Email Form */}
            <div style={{
              marginBottom: isMobile ? '2.5rem' : '3rem',
              opacity: visibleElements >= 1 ? 1 : 0,
              transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.3s'
            }}>
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                {/* Email Input */}
                <div style={{
                  position: 'relative',
                  flex: isMobile ? 'none' : '1',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <Mail size={18} color="rgba(255, 255, 255, 0.4)" style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="email"
                    placeholder="jouw@email.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: isMobile ? '1.25rem 1rem 1.25rem 3rem' : '1.5rem 1.25rem 1.5rem 3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: isMobile ? '14px' : '16px',
                      color: '#fff',
                      fontSize: isMobile ? '1.1rem' : '1.3rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      minHeight: '56px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.4)'
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  style={{
                    background: isSubmitting 
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: isMobile ? '14px' : '16px',
                    padding: isMobile ? '1.25rem 2rem' : '1.5rem 2.5rem',
                    fontSize: isMobile ? '1.1rem' : '1.3rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '56px',
                    boxShadow: isSubmitting ? 'none' : '0 8px 25px rgba(16, 185, 129, 0.15)',
                    whiteSpace: 'nowrap',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && email.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.25)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
                    }
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
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>Laden...</span>
                    </>
                  ) : (
                    <>
                      <Download size={isMobile ? 18 : 20} />
                      <span>Download Gratis</span>
                    </>
                  )}
                </button>
              </form>

              {/* Privacy tekst */}
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                lineHeight: '1.4',
                marginTop: '1rem'
              }}>
                Geen spam, alleen waardevolle tips. Uitschrijven kan altijd.
              </p>
            </div>

            {/* Features - Altijd horizontaal */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: isMobile ? '1.5rem' : '3rem',
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
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  )
}
