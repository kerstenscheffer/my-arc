// src/pages/SixMonthSubscriptionCheckout.jsx
import { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  ChefHat, 
  Moon, 
  Brain, 
  Smartphone,
  CheckCircle, 
  Target, 
  MessageCircle
} from 'lucide-react'

export default function SixMonthSubscriptionCheckout() {
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [hoveredOffer, setHoveredOffer] = useState(null)
  const [hoveredGuarantee, setHoveredGuarantee] = useState(null)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)
  }, [])

  const offers = [
    {
      icon: MessageCircle,
      title: "Wekelijkse 1-op-1 Progressie Check-ins",
      description: "Elke week persoonlijk contact via call of WhatsApp om je voortgang te bespreken en het plan aan te passen.",
      highlight: true
    },
    {
      icon: Dumbbell,
      title: "Optimale Spiergroei Workout Systeem",
      description: "Persoonlijk workout schema volledig afgestemd op jouw leven en doelen. Maximale resultaten."
    },
    {
      icon: ChefHat,
      title: "Snel & Lekker Meal Planning Programma",
      description: "Meal plans met snelle, lekkere maaltijden die je energie geven. Geen saaie kipfilet met rijst."
    },
    {
      icon: Moon,
      title: "Herstel Stimulerend Slaap Plan",
      description: "Beter slapen = sneller herstel, meer energie, en betere resultaten."
    },
    {
      icon: Brain,
      title: "Altijd On Track Mindset Training",
      description: "Mentale tools om het plan vol te houden, ook op moeilijke dagen."
    },
    {
      icon: Smartphone,
      title: "MY ARC App: Overzicht & Structuur",
      description: "Alles in één app: workouts, meal plans, voortgang en communicatie."
    }
  ]

  const guarantees = [
    {
      icon: Target,
      badge: "GARANTIE #1",
      title: "Door Tot Je Doel",
      subtitle: "We Gaan Door Tot Je Het Haalt",
      description: "Haal je doel niet in 6 maanden? Dan gaan we door tot je doel wel behaald is."
    },
    {
      icon: CheckCircle,
      badge: "GARANTIE #2",
      title: "28 Dagen Geld Terug",
      subtitle: "Niet Tevreden = Geld Terug",
      description: "Binnen 28 dagen niet overtuigd? Direct je geld terug, geen vragen."
    }
  ]

  const handleSubscribe = async (formData) => {
    setLoading(true)
    
    try {
      console.log('📤 Sending 6-month subscription request...')
      
      const response = await fetch('/api/create-6month-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'monthly-6-months',
          priceId: 'price_1SuciEJ3V4uXn1Ok4Uvuackr',
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          duration: '6-months'
        })
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Server error:', errorText)
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Backend response:', data)
      
      const sessionId = data.sessionId || data.id || data.session_id || data.sessionID
      
      if (!sessionId) {
        console.error('❌ No sessionId found in response:', data)
        throw new Error('Geen sessie ID ontvangen van server. Probeer het opnieuw.')
      }

      console.log('✅ Session ID found:', sessionId)
      console.log('🔄 Redirecting to Stripe...')
      
      const stripe = window.Stripe('pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54')
      
      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        console.error('❌ Stripe redirect error:', error)
        throw error
      }
      
    } catch (error) {
      console.error('❌ Subscription error:', error)
      alert(`Er ging iets mis: ${error.message}\n\nProbeer het opnieuw of neem contact op.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      opacity: showContent ? 1 : 0,
      transition: 'opacity 0.8s ease'
    }}>
      {/* Top accent gradient - Golden */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'radial-gradient(ellipse at top, rgba(255, 215, 0, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '-10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'fixed',
        bottom: '15%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.9) 50%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        padding: isMobile ? '2rem 1rem' : '4rem 2rem'
      }}>
        
        {/* Hero Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <div style={{
            display: 'inline-block',
            padding: isMobile ? '0.5rem 1.25rem' : '0.6rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.25)',
            borderRadius: '999px',
            marginBottom: '1.25rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.1)'
          }}>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: '#D4AF37',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              6 Maanden Transformatie
            </p>
          </div>
          
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.1',
            marginBottom: '0.5rem',
            letterSpacing: '-0.03em',
            filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.2))'
          }}>
            5-8 KG DROOG
          </h1>
          
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            color: '#fff',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            In 6 Maanden
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '400',
            lineHeight: '1.5',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Complete begeleiding van A tot Z voor jouw transformatie
          </p>
        </div>



        {/* Offers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          {offers.map((offer, index) => {
            const Icon = offer.icon
            const isHovered = hoveredOffer === index
            
            return (
              <div
                key={index}
                onMouseEnter={() => !isMobile && setHoveredOffer(index)}
                onMouseLeave={() => !isMobile && setHoveredOffer(null)}
                style={{
                  position: 'relative',
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: offer.highlight
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(23, 23, 23, 0.8) 100%)',
                  border: `1px solid ${offer.highlight ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 215, 0, 0.15)'}`,
                  borderRadius: isMobile ? '14px' : '16px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: offer.highlight
                    ? '0 6px 20px rgba(255, 215, 0, 0.1)'
                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  cursor: 'default'
                }}
              >
                {/* Top accent glow */}
                {offer.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
                    opacity: 0.6,
                    zIndex: 10
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.875rem' : '1rem'
                }}>
                  {/* Icon */}
                  <div style={{
                    minWidth: isMobile ? '44px' : '50px',
                    height: isMobile ? '44px' : '50px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Icon 
                      size={isMobile ? 22 : 24} 
                      color="#FFD700"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '700',
                      color: offer.highlight ? '#FFD700' : '#fff',
                      lineHeight: '1.3',
                      marginBottom: '0.4rem'
                    }}>
                      {offer.title}
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {offer.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Price Section - Compact */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '1.5rem 1.25rem' : '2rem 2rem',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.05) 100%)',
          border: '2px solid rgba(255, 215, 0, 0.25)',
          borderRadius: isMobile ? '16px' : '20px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.08)',
          overflow: 'hidden',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
            opacity: 0.6,
            zIndex: 10
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '1rem' : '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Price */}
            <div style={{
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '2.5rem' : '3rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1',
                filter: 'drop-shadow(0 2px 10px rgba(255, 215, 0, 0.25))'
              }}>
                €175
              </div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '600',
                marginTop: '0.25rem'
              }}>
                per maand
              </div>
            </div>

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '50px',
              background: 'rgba(255, 215, 0, 0.2)'
            }} />

            {/* Badge */}
            <div style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '999px',
              backdropFilter: 'blur(8px)'
            }}>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: '#10b981',
                fontWeight: '700',
                margin: 0
              }}>
                ✓ Maandelijks opzegbaar
              </p>
            </div>
          </div>
        </div>

        {/* Guarantees Section */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '2rem' : '2.5rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.75rem',
              filter: 'drop-shadow(0 2px 15px rgba(255, 215, 0, 0.2))'
            }}>
              3 IJzersterke Garanties
            </h2>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.15rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              Je kunt letterlijk niet verliezen
            </p>
          </div>

          {/* Guarantees */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            {guarantees.map((guarantee, index) => {
              const Icon = guarantee.icon
              const isHovered = hoveredGuarantee === index
              
              return (
                <div
                  key={index}
                  onMouseEnter={() => !isMobile && setHoveredGuarantee(index)}
                  onMouseLeave={() => !isMobile && setHoveredGuarantee(null)}
                  style={{
                    position: 'relative',
                    padding: isMobile ? '2rem 1.5rem' : '2rem',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(23, 23, 23, 0.8) 100%)',
                    border: `1px solid ${isHovered ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.15)'}`,
                    borderRadius: isMobile ? '16px' : '18px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isHovered
                      ? '0 12px 30px rgba(255, 215, 0, 0.15)'
                      : '0 4px 16px rgba(0, 0, 0, 0.4)',
                    overflow: 'hidden',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    cursor: 'default',
                    marginBottom: isMobile ? '0' : '0',
                    textAlign: 'center'
                  }}
                >
                  {/* Top accent */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
                    opacity: 0.5,
                    zIndex: 10
                  }} />

                  {/* Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '0.4rem 1rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                    borderRadius: '999px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '800',
                    color: '#000',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.35)',
                    marginBottom: '1.25rem'
                  }}>
                    {guarantee.badge}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: isMobile ? '56px' : '64px',
                    height: isMobile ? '56px' : '64px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                    border: '1px solid rgba(255, 215, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Icon 
                      size={isMobile ? 28 : 32} 
                      color="#FFD700"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Content */}
                  <h3 style={{
                    fontSize: isMobile ? '1.15rem' : '1.3rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {guarantee.title}
                  </h3>

                  <p style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '700',
                    color: '#FFD700',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    {guarantee.subtitle}
                  </p>

                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '1.6',
                    textAlign: 'center',
                    margin: 0
                  }}>
                    {guarantee.description}
                  </p>
                </div>
              )
            })}
          </div>


        </div>

        {/* Form Section */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          <div style={{
            padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(23, 23, 23, 0.8) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: isMobile ? '18px' : '22px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '800',
              color: '#fff',
              textAlign: 'center',
              marginBottom: isMobile ? '1.5rem' : '2rem'
            }}>
              Jouw Gegevens
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              handleSubscribe({
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
              })
            }}>
              {/* Name Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '1rem' : '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em'
                  }}>
                    Voornaam
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.875rem' : '1rem',
                      background: 'rgba(255, 215, 0, 0.04)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: isMobile ? '10px' : '12px',
                      color: '#fff',
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                      e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                      e.target.style.background = 'rgba(255, 215, 0, 0.04)'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em'
                  }}>
                    Achternaam
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.875rem' : '1rem',
                      background: 'rgba(255, 215, 0, 0.04)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: isMobile ? '10px' : '12px',
                      color: '#fff',
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                      e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                      e.target.style.background = 'rgba(255, 215, 0, 0.04)'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.02em'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    background: 'rgba(255, 215, 0, 0.04)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: isMobile ? '10px' : '12px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(8px)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                    e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                    e.target.style.background = 'rgba(255, 215, 0, 0.04)'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.02em'
                }}>
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    background: 'rgba(255, 215, 0, 0.04)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: isMobile ? '10px' : '12px',
                    color: '#fff',
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(8px)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                    e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                    e.target.style.background = 'rgba(255, 215, 0, 0.04)'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: isMobile ? '1.125rem' : '1.25rem',
                  background: loading
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: `2px solid ${loading ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.4)'}`,
                  borderRadius: isMobile ? '12px' : '14px',
                  color: loading ? 'rgba(255, 215, 0, 0.5)' : '#FFD700',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: loading
                    ? 'none'
                    : '0 8px 25px rgba(255, 215, 0, 0.2)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '56px',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading && !isMobile) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 215, 0, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.2)'
                  }
                }}
              >
                {loading ? 'Bezig met laden...' : 'Voltooi Eerste Betaling'}
              </button>
            </form>
          </div>
        </div>

        {/* Trust signals */}
        <div style={{
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: 0
          }}>
            🔒 Veilig betalen via Stripe • SSL Beveiligd • Maandelijks opzegbaar
          </p>
        </div>

      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
