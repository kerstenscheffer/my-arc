// src/pages/TwelveWeekCheckout.jsx
import { useState, useEffect } from 'react'
import { Utensils, Moon, TrendingUp, Target, Shield, CheckCircle, Award, Sparkles } from 'lucide-react'

export default function TwelveWeekCheckout() {
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
      icon: Utensils,
      title: "Easy Meal Prep Cursus",
      description: "Van elke dag veel tijd naar geen tijd kwijt en als een koning eten",
      value: "€397",
      highlight: true
    },
    {
      icon: Target,
      title: "Persoonlijk Voedingssysteem", 
      description: "Niet perfect maar persoonlijk. Kleine aanpassingen, groot verschil",
      value: "€297"
    },
    {
      icon: Award,
      title: "De Sleutel Tot Balans",
      description: "Gezonder leven zonder je weekend op te offeren. Ja, alcohol kan ook",
      value: "€197"
    },
    {
      icon: Moon,
      title: "Slaap Optimalisatie Cursus",
      description: "Haal het meest uit je slaap, ook met drukke weken",
      value: "€197"
    },
    {
      icon: TrendingUp,
      title: "Wekelijkse Monitoring",
      description: "Wekelijks kijk ik mee naar voortgang en passen we aan waar nodig",
      value: "€247"
    },
    {
      icon: Sparkles,
      title: "12 Weken Begeleiding",
      description: "5-10 kilo vetverlies, spieren behouden of opbouwen, tijd besparen",
      value: "€497"
    }
  ]

  const guarantees = [
    {
      icon: Target,
      badge: "GARANTIE #1",
      title: "Haal Je Doel",
      subtitle: "We Gaan Door Tot Je Het Haalt",
      description: "Haal je doel niet in 12 weken? Dan gaan we door tot je doel wel behaald is."
    },
    {
      icon: CheckCircle,
      badge: "GARANTIE #2",
      title: "14 Dagen Niet Tevreden",
      subtitle: "= Geld Terug",
      description: "Binnen 14 dagen niet overtuigd? Direct je geld terug, geen vragen."
    },
    {
      icon: Shield,
      badge: "GARANTIE #3",
      title: "Consistent Gezond Leven",
      subtitle: "Binnen 3 Maanden",
      description: "Binnen 3 maanden leef je consistent gezond en weet je precies hoe je elk doel kan halen. Zo niet? Volledig geld terug."
    }
  ]

  const totalValue = offers.reduce((sum, offer) => {
    const value = parseInt(offer.value.replace('€', ''))
    return sum + value
  }, 0)

  const actualPrice = 297

  const handleCheckout = async (formData) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: '12-week-program',
          price: actualPrice,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone
        })
      })

      const { sessionId } = await response.json()
      
      const stripe = window.Stripe('pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54')
      await stripe.redirectToCheckout({ sessionId })
      
    } catch (error) {
      console.error('Payment error:', error)
      alert('Er ging iets mis. Probeer het opnieuw.')
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
      {/* Top accent gradient */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '300px',
        background: 'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
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
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.4rem 1rem',
            background: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '999px',
            marginBottom: '1rem',
            backdropFilter: 'blur(12px)'
          }}>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: '#3b82f6',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              12 Weken Transformatie
            </p>
          </div>
          
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.1',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            Wat Je Echt Krijgt
          </h1>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '400',
            lineHeight: '1.4',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Van druk naar balans. Van moeite naar moeiteloos.
          </p>
        </div>

        {/* Offers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '2rem' : '2.5rem'
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
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: offer.highlight
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(23, 23, 23, 0.8) 100%)',
                  border: `1px solid ${offer.highlight ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.25)'}`,
                  borderRadius: isMobile ? '12px' : '14px',
                  backdropFilter: 'blur(12px)',
                  boxShadow: offer.highlight
                    ? '0 6px 20px rgba(37, 99, 235, 0.2)'
                    : '0 4px 12px rgba(37, 99, 235, 0.12)',
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
                    background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
                    opacity: 0.8,
                    zIndex: 10
                  }} />
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.75rem' : '0.875rem'
                }}>
                  {/* Icon */}
                  <div style={{
                    minWidth: isMobile ? '42px' : '46px',
                    height: isMobile ? '42px' : '46px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Icon 
                      size={isMobile ? 20 : 22} 
                      color="#3b82f6"
                      strokeWidth={2.5}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.375rem'
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        fontWeight: '700',
                        color: offer.highlight ? '#3b82f6' : '#fff',
                        lineHeight: '1.3',
                        margin: 0
                      }}>
                        {offer.title}
                      </h3>
                      <span style={{
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '800',
                        color: '#60a5fa',
                        marginLeft: '0.75rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {offer.value}
                      </span>
                    </div>
                    <p style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: '1.4',
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

        {/* Price Section */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(23, 23, 23, 0.9) 100%)',
          border: '2px solid rgba(37, 99, 235, 0.3)',
          borderRadius: isMobile ? '16px' : '20px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 40px rgba(37, 99, 235, 0.25)',
          overflow: 'hidden',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
            opacity: 0.8,
            zIndex: 10
          }} />

          <div style={{
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '600'
            }}>
              Totale Waarde
            </p>
            
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: '800',
              color: 'rgba(255, 255, 255, 0.4)',
              textDecoration: 'line-through',
              marginBottom: '0.5rem'
            }}>
              €{totalValue}
            </div>

            <div style={{
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: isMobile ? '3rem' : '4rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1'
              }}>
                €{actualPrice}
              </div>
            </div>

            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#3b82f6',
              fontWeight: '700',
              margin: 0
            }}>
              Eenmalige investering • Start direct
            </p>
          </div>
        </div>

        {/* Guarantees Section */}
        <div style={{
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '2.5rem' : '3rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              3 IJzersterke Garanties
            </h2>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              Je kunt letterlijk niet verliezen
            </p>
          </div>

          {/* Guarantees - Vertical on mobile */}
          <div style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: isMobile ? 'none' : 'repeat(3, 1fr)',
            gap: isMobile ? '0' : '1.25rem'
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
                    padding: isMobile ? '2rem 1.5rem' : '2rem 1.75rem',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(23, 23, 23, 0.8) 100%)',
                    border: `1px solid ${isHovered ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.25)'}`,
                    borderRadius: isMobile ? '14px' : '16px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isHovered
                      ? '0 8px 24px rgba(37, 99, 235, 0.25)'
                      : '0 4px 16px rgba(37, 99, 235, 0.15)',
                    overflow: 'hidden',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    cursor: 'default',
                    marginBottom: isMobile ? '1.5rem' : '0',
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
                    background: 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
                    opacity: 0.6,
                    zIndex: 10
                  }} />

                  {/* Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '0.4rem 1rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    borderRadius: '999px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '800',
                    color: '#fff',
                    letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                    marginBottom: '1.25rem'
                  }}>
                    {guarantee.badge}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: isMobile ? '56px' : '60px',
                    height: isMobile ? '56px' : '60px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '14px',
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <Icon 
                      size={isMobile ? 28 : 30} 
                      color="#3b82f6"
                      strokeWidth={2.5}
                    />
                  </div>

                  {/* Content */}
                  <h3 style={{
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {guarantee.title}
                  </h3>

                  <p style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '700',
                    color: '#3b82f6',
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

          {/* Bottom guarantee text */}
          <div style={{
            textAlign: 'center',
            marginTop: isMobile ? '2rem' : '2.5rem',
            padding: isMobile ? '1.5rem' : '2rem',
            background: 'rgba(37, 99, 235, 0.06)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: isMobile ? '14px' : '16px',
            backdropFilter: 'blur(12px)'
          }}>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              color: '#fff',
              fontWeight: '700',
              marginBottom: '0.5rem'
            }}>
              Geen kleine lettertjes. Geen gedoe.
            </p>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              100% risico-vrij • Direct starten • Volledige support
            </p>
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
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(23, 23, 23, 0.8) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: isMobile ? '16px' : '20px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
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
              handleCheckout({
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
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
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
                      background: 'rgba(37, 99, 235, 0.06)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      borderRadius: isMobile ? '10px' : '12px',
                      color: '#fff',
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                      e.target.style.background = 'rgba(37, 99, 235, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(37, 99, 235, 0.25)'
                      e.target.style.background = 'rgba(37, 99, 235, 0.06)'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
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
                      background: 'rgba(37, 99, 235, 0.06)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      borderRadius: isMobile ? '10px' : '12px',
                      color: '#fff',
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                      e.target.style.background = 'rgba(37, 99, 235, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(37, 99, 235, 0.25)'
                      e.target.style.background = 'rgba(37, 99, 235, 0.06)'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
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
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: isMobile ? '10px' : '12px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(8px)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                    e.target.style.background = 'rgba(37, 99, 235, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(37, 99, 235, 0.25)'
                    e.target.style.background = 'rgba(37, 99, 235, 0.06)'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
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
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: isMobile ? '10px' : '12px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(8px)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(37, 99, 235, 0.4)'
                    e.target.style.background = 'rgba(37, 99, 235, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(37, 99, 235, 0.25)'
                    e.target.style.background = 'rgba(37, 99, 235, 0.06)'
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
                    ? 'rgba(37, 99, 235, 0.1)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
                  border: `2px solid ${loading ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.4)'}`,
                  borderRadius: isMobile ? '12px' : '14px',
                  color: loading ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: loading
                    ? 'none'
                    : '0 8px 24px rgba(37, 99, 235, 0.3)',
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
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && !isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)'
                  }
                }}
              >
                {loading ? 'Bezig met laden...' : 'Start Nu Voor €297'}
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
            🔒 Veilig betalen via Stripe • SSL Beveiligd
          </p>
        </div>

      </div>
    </div>
  )
}
