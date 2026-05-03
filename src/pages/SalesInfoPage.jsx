// src/pages/SalesInfoPage.jsx
import { useState, useEffect } from 'react'
import { Utensils, Moon, TrendingUp, Target, Shield, CheckCircle, Award, Sparkles } from 'lucide-react'

export default function SalesInfoPage() {
  const [showContent, setShowContent] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)
  }, [])

  const offers = [
    {
      icon: TrendingUp,
      title: "Wekelijkse Check-ins",
      description: "Elke week controleer ik of jij progressie maakt. Kun jij vragen stellen en weet je zeker dat je richting je doel gaat."
    },
    {
      icon: Utensils,
      title: "Persoonlijk Voedingsplan",
      description: "Samen maken we een plan dat voor jou haalbaar is én waar je flexibel kunt blijven."
    },
    {
      icon: Target,
      title: "Volledig Trainingsplan",
      description: "Niet meer twijfelen wat je moet doen in de gym. Een compleet plan + hulp met planning."
    },
    {
      icon: Moon,
      title: "Slaap Optimalisatie",
      description: "Meer energie, meer zin in dingen, sneller herstel. Dit is waar de echte transformatie begint."
    },
    {
      icon: Award,
      title: "MY ARC App Toegang",
      description: "Alles op één plek: workouts, mealplannen, progressie tracking."
    },
    {
      icon: Sparkles,
      title: "12 Weken Begeleiding",
      description: "Van 's ochtends vroeg tot 's avonds laat bereikbaar voor vragen en tips."
    }
  ]

  const guarantees = [
    {
      icon: Target,
      title: "Haal Je Doel",
      description: "Haal je doel niet in 12 weken? Dan gaan we door tot je het haalt."
    },
    {
      icon: CheckCircle,
      title: "14 Dagen Niet Tevreden",
      description: "Geld terug, geen vragen."
    },
    {
      icon: Shield,
      title: "Consistent Gezond Leven",
      description: "Binnen 3 maanden meer energie, motivatie en zelfvertrouwen."
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      opacity: showContent ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Top accent */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #1e3a5f 0%, #2563eb 50%, #1e3a5f 100%)',
        zIndex: 100
      }} />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 2rem'
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '2.75rem',
            fontWeight: '800',
            color: '#1e3a5f',
            lineHeight: '1.15',
            marginBottom: '0.75rem'
          }}>
            3 Maanden Transformatie
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Dit is wat je krijgt
          </p>
        </div>

        {/* Offers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.875rem' : '1rem',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          {offers.map((offer, index) => {
            const Icon = offer.icon
            return (
              <div
                key={index}
                style={{
                  padding: isMobile ? '1.125rem' : '1.25rem',
                  background: '#fff',
                  border: '1px solid rgba(30, 58, 95, 0.1)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(30, 58, 95, 0.04)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}
              >
                <div style={{
                  minWidth: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e3a5f 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    fontWeight: '700',
                    color: '#1e3a5f',
                    marginBottom: '0.375rem'
                  }}>
                    {offer.title}
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: '#64748b',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {offer.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Guarantees */}
        <div style={{
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.375rem' : '1.5rem',
            fontWeight: '800',
            color: '#1e3a5f',
            textAlign: 'center',
            marginBottom: isMobile ? '1.25rem' : '1.5rem'
          }}>
            3 Garanties
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '0.875rem' : '1rem'
          }}>
            {guarantees.map((guarantee, index) => {
              const Icon = guarantee.icon
              return (
                <div
                  key={index}
                  style={{
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    background: '#fff',
                    border: '1px solid rgba(30, 58, 95, 0.1)',
                    borderRadius: '14px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 1rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 95, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} color="#2563eb" strokeWidth={2.5} />
                  </div>
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.05rem',
                    fontWeight: '700',
                    color: '#1e3a5f',
                    marginBottom: '0.5rem'
                  }}>
                    {guarantee.title}
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    color: '#64748b',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {guarantee.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Price */}
        <div style={{
          padding: isMobile ? '2rem 1.5rem' : '2.5rem',
          background: '#fff',
          border: '2px solid rgba(37, 99, 235, 0.15)',
          borderRadius: '18px',
          textAlign: 'center',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <div style={{
            fontSize: isMobile ? '3.5rem' : '4.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #2563eb 0%, #1e3a5f 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1'
          }}>
            €297
          </div>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#64748b',
            fontWeight: '600',
            marginTop: '0.75rem',
            margin: 0
          }}>
            Eenmalig • 3 Maanden
          </p>
        </div>

        {/* Over 3 Maanden Section */}
        <div style={{
          padding: isMobile ? '2rem 1.5rem' : '2.5rem',
          background: '#fff',
          border: '1px solid rgba(30, 58, 95, 0.1)',
          borderRadius: '18px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            color: '#1e3a5f',
            marginBottom: '1rem'
          }}>
            Over 3 Maanden...
          </h3>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: '#64748b',
            lineHeight: '1.7',
            maxWidth: '550px',
            margin: '0 auto'
          }}>
            Ben je compleet getransformeerd. Meer energie, meer zelfvertrouwen, 
            een lichaam waar je trots op bent. Je leeft consistent gezond en 
            het voelt niet meer als een opgave, maar als een lifestyle.
          </p>
        </div>

      </div>
    </div>
  )
}
