import { useState, useEffect } from 'react'

export default function AboutSection({ isMobile }) {
  const [visibleElements, setVisibleElements] = useState(0)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 3; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 600)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
      position: 'relative'
    }}>
      
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.02) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '0.6fr 1.4fr',
        gap: isMobile ? '2.5rem' : '4rem',
        alignItems: 'center'
      }}>
        
        {/* Left: Kersten's Photo */}
        <div style={{
          opacity: visibleElements >= 0 ? 1 : 0,
          transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          order: isMobile ? 2 : 1,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: isMobile ? '240px' : '280px',
            height: isMobile ? '240px' : '280px',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <img
              src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/3_principes_5.png?v=1758796003"
              alt="Kersten"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML = `
                  <div style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%);
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    fontSize: 3rem;
                    fontWeight: 800;
                    color: #fff;
                  ">K</div>
                `
              }}
            />
          </div>
        </div>

        {/* Right: Personal Story */}
        <div style={{
          textAlign: isMobile ? 'center' : 'left',
          order: isMobile ? 1 : 2
        }}>
          
          {/* Title */}
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            letterSpacing: '-0.02em',
            opacity: visibleElements >= 0 ? 1 : 0,
            transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.1s'
          }}>
            Waarom ik doe wat ik doe
          </h2>

          {/* Story Paragraphs */}
          <div style={{
            opacity: visibleElements >= 1 ? 1 : 0,
            transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: '0.2s'
          }}>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.7',
              marginBottom: '1.5rem'
            }}>
              Ik ken de frustratie van inconsistentie maar al te goed. Jaren geleden worstelde ik net als zoveel anderen met voeding, workout routines en vooral het volhouden daarvan. Elke maandag begon ik weer opnieuw, vol goede moed, om vervolgens woensdag al af te haken.
            </p>
            
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.7',
              marginBottom: '1.5rem',
              opacity: visibleElements >= 2 ? 1 : 0,
              transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.4s'
            }}>
              Na 6 jaar bodybuilding en het voltooien van meerdere marathons en halve marathons, zijn deze struggles mijn grootste specialiteiten geworden. Ik snap precies waar mensen vastlopen omdat ik daar zelf ook heb gezeten.
            </p>
            
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.7',
              marginBottom: '1.5rem',
              opacity: visibleElements >= 2 ? 1 : 0,
              transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.5s'
            }}>
              MY ARC is ontstaan uit de overtuiging dat iedereen het verdient om zijn beste versie te worden. We zetten bewust een stapje harder voor onze klanten omdat we oprecht geloven dat volledige klanttevredenheid de enige manier is om het beste in mensen naar boven te halen.
            </p>
            
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.7',
              fontWeight: '500',
              opacity: visibleElements >= 3 ? 1 : 0,
              transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.6s'
            }}>
              Jouw reis begint niet bij perfectie - het begint bij begrip, geduld en de juiste ondersteuning. Dat is wat MY ARC voor je betekent.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
