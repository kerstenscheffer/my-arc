import { Users, CheckCircle, Clock, Shield, Dumbbell, Utensils, Phone, Trophy } from 'lucide-react'

export default function ProgramSection({ isMobile }) {
  const mainFeatures = [
    {
      icon: Users,
      title: "1-op-1 Begeleiding",
      description: "Persoonlijke coach die jouw hele reis begeleidt"
    },
    {
      icon: CheckCircle,
      title: "Custom Programma",
      description: "Workout & voeding 100% op jou afgestemd"
    },
    {
      icon: Clock,
      title: "8 Weken Plan",
      description: "Bewezen systeem voor snelle resultaten"
    },
    {
      icon: Shield,
      title: "100% Garantie",
      description: "Geen resultaat? Geld terug"
    }
  ]

  const programDetails = [
    {
      icon: Dumbbell,
      title: "Persoonlijk Workout Plan",
      description: "Op maat gemaakte trainingsschema's die perfect bij jouw schema en level passen",
      features: ["3-5x per week", "Progressieve overload", "Video uitleg", "Alternatieve oefeningen"]
    },
    {
      icon: Utensils,
      title: "AI Meal Planning",
      description: "Smart meal plans die automatisch aanpassen aan jouw voorkeur en doelen",
      features: ["Dagelijkse meal prep", "Macro tracking", "Shopping lijsten", "Recepten database"]
    },
    {
      icon: Phone,
      title: "Weekly Check-ins",
      description: "Wekelijkse gesprekken om jouw voortgang te bespreken en bij te stellen",
      features: ["Video calls", "Progress review", "Plan aanpassingen", "Motivational support"]
    },
    {
      icon: Trophy,
      title: "Challenge Systeem",
      description: "Gamification met challenges die je gemotiveerd houden en beloningen opleveren",
      features: ["Dagelijkse challenges", "Point system", "Milestone rewards", "Community leaderboard"]
    }
  ]

  return (
    <section id="section-program" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#10b981',
            marginBottom: '1rem'
          }}>
            Wat Je Krijgt
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Alles wat je nodig hebt voor jouw transformatie - geen half werk
          </p>
        </div>

        {/* Main Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          {mainFeatures.map((feature, index) => (
            <div key={index} style={{
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: isMobile ? '1.5rem' : '2rem',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(16, 185, 129, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
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
              <feature.icon size={isMobile ? 32 : 40} color="#10b981" style={{ marginBottom: '1rem' }} />
              
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.75rem'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed Program Breakdown */}
        <div style={{
          background: 'rgba(17, 17, 17, 0.3)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: isMobile ? '2rem' : '3rem'
          }}>
            Complete MY ARC Ervaring
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? '2rem' : '3rem'
          }}>
            {programDetails.map((detail, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                padding: isMobile ? '1.25rem' : '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)'
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <detail.icon size={24} color="#fff" />
                  </div>
                  
                  <h4 style={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '700',
                    color: '#fff',
                    margin: 0
                  }}>
                    {detail.title}
                  </h4>
                </div>
                
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.5',
                  marginBottom: '1rem'
                }}>
                  {detail.description}
                </p>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {detail.features.map((feature, featureIndex) => (
                    <li key={featureIndex} style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircle size={14} color="#10b981" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '3rem' : '4rem'
        }}>
          <div style={{
            padding: isMobile ? '1.5rem' : '2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '2rem'
          }}>
            <p style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Totale waarde: €2.400+
            </p>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Jouw investering: €297 (eenmalig)
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/my-arc'}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '1.125rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '56px',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.3)'
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
            Claim Jouw MY ARC Ervaring
          </button>
        </div>
      </div>
    </section>
  )
}
