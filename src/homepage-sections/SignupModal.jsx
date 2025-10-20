import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, ArrowRight } from 'lucide-react'

export default function SignupModal({ isOpen, onClose, isMobile }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements when modal opens
  useEffect(() => {
    if (!isOpen) {
      setVisibleElements(0)
      return
    }

    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 600)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [isOpen])

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      return
    }
    
    setIsSubmitting(true)

    // Simulate API call - hier komt later DatabaseService.createLead()
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      
      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({ name: '', phone: '', email: '' })
        onClose()
      }, 2000)
    }, 1000)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        maxWidth: isMobile ? '100%' : '480px',
        width: '100%',
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(17, 17, 17, 0.95) 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Subtle background accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at top center, rgba(16, 185, 129, 0.02) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? '1rem' : '1.5rem',
            right: isMobile ? '1rem' : '1.5rem',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div style={{
          padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 2.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* Success state */}
          {isSuccess ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '2rem 0' : '2.5rem 0'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                animation: 'scaleIn 0.6s ease'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              </div>
              
              <h3 style={{
                fontSize: isMobile ? '1.4rem' : '1.6rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                Gelukt!
              </h3>
              
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                Je bent ingeschreven voor de gratis 8 weken transformatie. 
                We nemen snel contact met je op!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '2.5rem' : '3rem',
                opacity: visibleElements >= 0 ? 1 : 0,
                transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1.4rem' : '1.6rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: '#10b981',
                  marginBottom: '0.75rem'
                }}>
                  Claim Je Gratis Plek
                </h3>
                
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.5'
                }}>
                  Vul je gegevens in en start direct met jouw transformatie
                </p>
              </div>

              {/* Form */}
              <div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  marginBottom: '2.5rem'
                }}>
                  
                  {/* Name field */}
                  <div style={{ 
                    position: 'relative',
                    opacity: visibleElements >= 1 ? 1 : 0,
                    transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: '0.2s'
                  }}>
                    <User size={18} color="rgba(255, 255, 255, 0.3)" style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      placeholder="Jouw volledige naam"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem 1rem 1rem 2.75rem' : '1.125rem 1.125rem 1.125rem 3rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      }}
                    />
                  </div>

                  {/* Phone field */}
                  <div style={{ 
                    position: 'relative',
                    opacity: visibleElements >= 2 ? 1 : 0,
                    transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: '0.4s'
                  }}>
                    <Phone size={18} color="rgba(255, 255, 255, 0.3)" style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem 1rem 1rem 2.75rem' : '1.125rem 1.125rem 1.125rem 3rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      }}
                    />
                  </div>

                  {/* Email field */}
                  <div style={{ 
                    position: 'relative',
                    opacity: visibleElements >= 2 ? 1 : 0,
                    transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: '0.5s'
                  }}>
                    <Mail size={18} color="rgba(255, 255, 255, 0.3)" style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="email"
                      placeholder="jouw@email.nl"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem 1rem 1rem 2.75rem' : '1.125rem 1.125rem 1.125rem 3rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem' : '1.2rem',
                    background: isSubmitting 
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '46px',
                    boxShadow: isSubmitting ? 'none' : '0 6px 20px rgba(16, 185, 129, 0.2)',
                    opacity: visibleElements >= 3 ? 1 : 0,
                    transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: '0.6s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.2)'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
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
                      <span>Even geduld...</span>
                    </>
                  ) : (
                    <>
                      <span>Claim Mijn Gratis Plek</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

              </div>

              {/* Privacy note */}
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginTop: '2rem',
                lineHeight: '1.4',
                opacity: visibleElements >= 4 ? 1 : 0,
                transform: visibleElements >= 4 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDelay: '0.8s'
              }}>
                Je gegevens worden veilig opgeslagen en alleen gebruikt voor jouw transformatie. 
                Geen spam, dat beloven we.
              </p>
            </>
          )}
        </div>
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
    </div>
  )
}
