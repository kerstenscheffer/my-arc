import { useState, useEffect } from 'react'
import { X, Calendar, Info, Check, Users, ChevronRight } from 'lucide-react'
import LeadManagementService from '../modules/lead-management/LeadManagementService'

export default function BookCallModal({ 
  isOpen, 
  onClose, 
  isMobile,
  db
}) {
  const [currentStep, setCurrentStep] = useState(1) // 1 = form, 2 = calendly
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [spots, setSpots] = useState(null)
  const [createdLeadId, setCreatedLeadId] = useState(null) // Track lead ID
  const [leadService] = useState(() => new LeadManagementService())
  
  // Fixed Calendly URL
  const calendlyUrl = 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call'

  // Load spots data
  useEffect(() => {
    if (!isOpen || !db) return

    const loadSpots = async () => {
      try {
        const spotsService = db.getSpotsService()
        const data = await spotsService.getCurrentSpots()
        setSpots(data)

        const subscription = spotsService.subscribeToSpots((newData) => {
          setSpots(newData)
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Failed to load spots:', error)
      }
    }

    loadSpots()
  }, [isOpen, db])

  // Load Calendly when step 2
  useEffect(() => {
    if (currentStep !== 2) return

    const existingScript = document.querySelector('script[src*="calendly.com"]')
    
    if (existingScript && window.Calendly) {
      setCalendlyLoaded(true)
      setTimeout(() => {
        const widget = document.querySelector('.calendly-inline-widget')
        if (widget && window.Calendly) {
          try {
            window.Calendly.initInlineWidget({
              url: calendlyUrl,
              parentElement: widget,
              prefill: {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email
              },
              utm: {}
            })
          } catch (error) {
            console.error('Calendly init error:', error)
          }
        }
      }, 200)
    } else if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      
      script.onload = () => {
        setCalendlyLoaded(true)
        
        setTimeout(() => {
          const widget = document.querySelector('.calendly-inline-widget')
          if (widget && window.Calendly) {
            try {
              window.Calendly.initInlineWidget({
                url: calendlyUrl,
                parentElement: widget,
                prefill: {
                  name: `${formData.firstName} ${formData.lastName}`.trim(),
                  email: formData.email
                },
                utm: {}
              })
            } catch (error) {
              console.error('Calendly init error:', error)
            }
          }
        }, 200)
      }
      
      document.body.appendChild(script)
    }
  }, [currentStep, formData])

  // Listen for booking events
  useEffect(() => {
    if (currentStep !== 2) return

    const handleMessage = async (e) => {
      if (e.origin !== 'https://calendly.com') return
      
      if (e.data?.event === 'calendly.event_scheduled') {
        console.log('📅 Calendly booking detected:', e.data)
        
        // Update lead to 'scheduled' status
        if (createdLeadId) {
          try {
            await leadService.updateLeadStatus(createdLeadId, 'scheduled', null)
            
            // Also save Calendly event data if available
            if (e.data.payload?.event?.uri) {
              await leadService.updateLead(createdLeadId, {
                calendly_scheduled: true,
                calendly_event_id: e.data.payload.event.uri,
                calendly_event_url: e.data.payload.event.uri,
                scheduled_at: new Date().toISOString()
              })
            }
            
            console.log('✅ Lead updated to scheduled:', createdLeadId)
          } catch (error) {
            console.error('❌ Failed to update lead status:', error)
          }
        }
        
        setBookingComplete(true)
        celebrateBooking()
        setTimeout(() => {
          onClose()
          setBookingComplete(false)
          setCurrentStep(1)
          setFormData({ firstName: '', lastName: '', phone: '', email: '' })
          setCreatedLeadId(null)
        }, 2000)
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [currentStep, onClose, createdLeadId, leadService])

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'Voornaam is verplicht'
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Achternaam is verplicht'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefoonnummer is verplicht'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'E-mailadres is verplicht'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Ongeldig e-mailadres'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContinue = async () => {
    if (!validateForm()) return

    try {
      console.log('🔄 Creating lead from BookCall form...')
      
      // Create lead in database
      const lead = await leadService.createLead({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        source: 'website',
        coachId: null, // No coach assigned yet
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        referrerUrl: window.location.href
      })
      
      setCreatedLeadId(lead.id)
      console.log('✅ Lead created successfully:', lead.id)
      
      // Move to Calendly step
      setCurrentStep(2)
    } catch (error) {
      console.error('❌ Failed to create lead:', error)
      
      // Still allow user to continue to Calendly even if lead creation fails
      // This ensures user experience isn't blocked
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  // Celebration animation
  const celebrateBooking = () => {
    const celebration = document.createElement('div')
    celebration.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100000;
        animation: celebrateScale 1s ease-out;
        pointer-events: none;
      ">
        <div style="
          font-size: 100px;
          animation: celebrateRotate 1s ease-out;
        ">🎉</div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #10b981;
          white-space: nowrap;
          animation: celebrateText 1s ease-out;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        ">Gesprek Gepland!</div>
      </div>
      <style>
        @keyframes celebrateScale {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes celebrateRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes celebrateText {
          0% { opacity: 0; transform: translate(-50%, -50%) translateY(20px); }
          100% { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        }
      </style>
    `
    document.body.appendChild(celebration)
    setTimeout(() => celebration.remove(), 1500)
  }

  // Calculate spots
  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Over"
        : `${spotsLeft} Plekken Over`
    : "Laden..."

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.92)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        backdropFilter: 'blur(25px)',
        borderRadius: isMobile ? '24px 24px 0 0' : '20px',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        maxWidth: isMobile ? '100%' : currentStep === 1 ? '500px' : '900px',
        width: '100%',
        height: isMobile ? '85vh' : 'auto',
        maxHeight: isMobile ? '85vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.6), 0 0 80px rgba(16, 185, 129, 0.08)',
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
          backdropFilter: 'blur(15px)',
          padding: isMobile ? '1.25rem' : '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isMobile ? '24px 24px 0 0' : '20px 20px 0 0',
          borderBottom: '1px solid rgba(16, 185, 129, 0.12)',
          flexShrink: 0
        }}>
          <div>
            {/* Progress indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentStep >= 1 ? '#10b981' : 'rgba(255, 255, 255, 0.3)'
              }} />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: currentStep === 1 ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
                background: currentStep === 1 ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' : 'none',
                WebkitBackgroundClip: currentStep === 1 ? 'text' : 'initial',
                WebkitTextFillColor: currentStep === 1 ? 'transparent' : 'initial',
                backgroundClip: currentStep === 1 ? 'text' : 'initial',
                fontWeight: '600'
              }}>
                Vul het formulier in
              </span>
              
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: currentStep >= 2 ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.3)'
              }} />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: currentStep === 2 ? 'transparent' : 'rgba(255, 255, 255, 0.5)',
                background: currentStep === 2 ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' : 'none',
                WebkitBackgroundClip: currentStep === 2 ? 'text' : 'initial',
                WebkitTextFillColor: currentStep === 2 ? 'transparent' : 'initial',
                backgroundClip: currentStep === 2 ? 'text' : 'initial',
                fontWeight: '600'
              }}>
                Plan je afspraak
              </span>
            </div>

            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.4rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={isMobile ? 18 : 20} style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: '#10b981' // Fallback
              }} />
              MY ARC Transformatie Call
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '500'
            }}>
              Boek een call om te kijken of MY ARC iets voor jou is
            </p>

            {/* Spots indicator */}
            {spots?.is_active && spotsLeft !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <Users 
                  size={isMobile ? 12 : 14} 
                  color={spotsLeft <= 3 ? '#ef4444' : 'rgba(16, 185, 129, 0.8)'} 
                />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: spotsLeft <= 3 ? '700' : '600',
                  color: spotsLeft <= 3 ? '#ef4444' : 'rgba(16, 185, 129, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {spotsText}
                  {spotsLeft > 0 && (
                    <span style={{
                      width: '3px',
                      height: '3px',
                      borderRadius: '50%',
                      background: spotsLeft <= 3 ? '#ef4444' : '#10b981',
                      animation: 'blink 1.5s infinite'
                    }} />
                  )}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(16, 185, 129, 0.08) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(16, 185, 129, 0.08) 100%)'
            }}
          >
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          
          {/* Step 1: Contact Form */}
          {currentStep === 1 && (
            <div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Vul onderstaand formulier in om je gratis call in te plannen
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Name fields */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Voornaam *"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: formErrors.firstName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: '48px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid transparent'
                        e.currentTarget.style.borderImage = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%) 1'
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = formErrors.firstName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderImage = 'none'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                    {formErrors.firstName && (
                      <span style={{
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem',
                        display: 'block'
                      }}>
                        {formErrors.firstName}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Achternaam *"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: formErrors.lastName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: '48px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '1px solid transparent'
                        e.currentTarget.style.borderImage = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%) 1'
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = formErrors.lastName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)'
                        e.currentTarget.style.borderImage = 'none'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                    {formErrors.lastName && (
                      <span style={{
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem',
                        display: 'block'
                      }}>
                        {formErrors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone field */}
                <div>
                  <div style={{
                    display: 'flex',
                    border: formErrors.phone ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minWidth: '80px'
                    }}>
                      <span style={{ fontSize: '1rem' }}>🇳🇱</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>+31</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="6 12 34 56 78"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        fontWeight: '500',
                        outline: 'none',
                        minHeight: '48px'
                      }}
                    />
                  </div>
                  {formErrors.phone && (
                    <span style={{
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <input
                    type="email"
                    placeholder="E-mailadres *"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: formErrors.email ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      minHeight: '48px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid transparent'
                      e.currentTarget.style.borderImage = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%) 1'
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = formErrors.email ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderImage = 'none'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                  {formErrors.email && (
                    <span style={{
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Privacy text */}
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  Door je gegevens in te vullen ga je akkoord met onze{' '}
                  <span style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textDecoration: 'underline'
                  }}>Voorwaarden</span>
                  {' '}& <span style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textDecoration: 'underline'
                  }}>Privacybeleid</span>
                </p>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem' : '1.25rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '56px',
                    marginTop: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #2563eb 100%)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                  }}
                >
                  Doorgaan
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Calendly */}
          {currentStep === 2 && (
            <div>
              {/* Back button */}
              <button
                onClick={handleBack}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                ← Terug naar formulier
              </button>

              {/* Success Message */}
              {bookingComplete && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  animation: 'fadeIn 0.5s ease'
                }}>
                  <Check size={20} style={{ color: '#10b981' }} />
                  <p style={{
                    color: '#10b981',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    Perfect! Je gesprek is gepland. Check je mail voor de details!
                  </p>
                </div>
              )}

              {/* Calendly Widget Container */}
              <div 
                className="calendly-inline-widget"
                data-url={calendlyUrl}
                style={{
                  minWidth: '320px',
                  height: isMobile ? '450px' : '600px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  background: '#0a0a0a',
                  position: 'relative'
                }}
              >
                {/* Loading State */}
                {!calendlyLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(16, 185, 129, 0.2)',
                      borderTopColor: '#10b981',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto'
                    }} />
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '1rem',
                      fontSize: isMobile ? '0.85rem' : '0.9rem'
                    }}>
                      Kalender laden...
                    </p>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div style={{
                marginTop: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '0.6rem' : '0.75rem',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  Scroll voor meer tijdslots • Kies wat het beste past • 100% vrijblijvend
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        ::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  )
}
