import { useState, useEffect } from 'react'
import { Mail, MessageCircle, Instagram, Youtube, Music } from 'lucide-react'

export default function FooterSection({ isMobile }) {
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 3; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 400)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const contactMethods = [
    {
      icon: Mail,
      label: 'Mail mij direct',
      description: 'Persoonlijke vragen',
      href: 'mailto:Kersten@myarcfitness.com',
      color: '#3b82f6'
    },
    {
      icon: Instagram,
      label: 'Volg op Instagram',
      description: 'Dagelijkse tips',
      href: 'https://www.instagram.com/myarc.fit/',
      color: '#E4405F'
    },
    {
      icon: Youtube,
      label: 'Bekijk op YouTube',
      description: 'Workout video\'s',
      href: 'https://l.instagram.com/?u=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DIyEx5xPuGXI%26fbclid%3DPAZXh0bgNhZW0CMTEAAadX23F-VdNB7ImSvFPoN2gr9IK-fvIwi6TRoVbTOtYdJ6-zZO-kaX97F3uPqA_aem_Dg9DQwmjSip-Jtqpo7hLLQ&e=AT35rtnEkP9novTel1f99ZxenwN9hTcYBE5YGi5Fm1P1h_YN0UmiFvoEdcWWHVcckANEIpU6SMCSu8nch29Fwt-XxeYN9wiO_UMxRA8lwJe9ETzyB4IXRBsRZQ',
      color: '#ff0000'
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp mij nu',
      description: 'Snelle hulp',
      href: 'https://wa.me/31631388756',
      color: '#25D366'
    },
    {
      icon: Music,
      label: 'Check TikTok tips',
      description: 'Snelle workouts',
      href: 'https://www.tiktok.com/@myarc.fit',
      color: '#000'
    }
  ]

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #111111 0%, #0a0a0a 100%)',
      padding: isMobile ? '3rem 1rem 2rem' : '4rem 2rem 2rem',
      borderTop: '1px solid rgba(16, 185, 129, 0.1)',
      position: 'relative'
    }}>
      
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at top center, rgba(16, 185, 129, 0.02) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        
        {/* Title */}
        <div style={{
          marginBottom: isMobile ? '2rem' : '2.5rem',
          opacity: visibleElements >= 0 ? 1 : 0,
          transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Klaar om te beginnen?
          </h3>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Kies jouw voorkeur om contact op te nemen
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '1.25rem' : '1.5rem',
          marginBottom: isMobile ? '2.5rem' : '3rem',
          opacity: visibleElements >= 1 ? 1 : 0,
          transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.2s'
        }}>
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <a
                key={index}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: isMobile ? '1rem 0.75rem' : '1.25rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${method.color}20`,
                  borderRadius: '16px',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  backdropFilter: 'blur(5px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${method.color}08`
                  e.currentTarget.style.borderColor = `${method.color}40`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 8px 25px ${method.color}20`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                  e.currentTarget.style.borderColor = `${method.color}20`
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {/* Icon */}
                <div style={{
                  width: isMobile ? '40px' : '44px',
                  height: isMobile ? '40px' : '44px',
                  borderRadius: '50%',
                  background: method.color === '#000' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : `${method.color}15`,
                  border: method.color === '#000'
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : `1px solid ${method.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon 
                    size={isMobile ? 18 : 20} 
                    color={method.color === '#000' ? '#fff' : method.color}
                  />
                </div>

                {/* Label */}
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '0.25rem',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {method.label}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {method.description}
                </div>
              </a>
            )
          })}
        </div>

        {/* MY ARC Logo */}
        <div style={{
          marginBottom: isMobile ? '1.5rem' : '2rem',
          opacity: visibleElements >= 2 ? 1 : 0,
          transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.4s'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#10b981',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            MY ARC
          </h3>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0.5rem 0 0 0',
            fontWeight: '500'
          }}>
            Jouw beste versie bereiken
          </p>
        </div>

        {/* Copyright */}
        <div style={{
          opacity: visibleElements >= 3 ? 1 : 0,
          transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.6s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
            textAlign: 'center'
          }}>
            © 2024 MY ARC. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  )
}
