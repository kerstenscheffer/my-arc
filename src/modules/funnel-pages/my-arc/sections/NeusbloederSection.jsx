import { useState, useEffect } from 'react'

export default function NeusbloederSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [visibleParagraph, setVisibleParagraph] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  useEffect(() => {
    if (!isCurrentSection) return
    
    const timers = []
    for (let i = 0; i <= 8; i++) {
      timers.push(
        setTimeout(() => setVisibleParagraph(i), i * 600)
      )
    }
    
    return () => timers.forEach(clearTimeout)
  }, [isCurrentSection])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      position: 'relative',
      background: '#000'
    }}>
      
      <div style={{
        maxWidth: '750px',
        width: '100%'
      }}>
        
        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: isMobile ? '2rem' : '3rem',
          letterSpacing: '-0.02em',
          opacity: visibleParagraph >= 0 ? 1 : 0,
          transform: visibleParagraph >= 0 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease'
        }}>
          Neusbloeder
        </h2>

        {/* Body copy - First part */}
        <div style={{
          fontSize: isMobile ? '1.1rem' : '1.35rem',
          lineHeight: '1.7',
          color: 'rgba(255, 255, 255, 0.8)',
          fontWeight: '300',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          
          <p style={{
            marginBottom: '1.5rem',
            opacity: visibleParagraph >= 1 ? 1 : 0,
            transform: visibleParagraph >= 1 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease'
          }}>
            Wat ik al jaren lang zie bij mensen is dat ze goed zijn in{' '}
            <span style={{ color: '#fff', fontWeight: '500' }}>laten blijken</span>.
          </p>

          <p style={{
            marginBottom: '1.5rem',
            opacity: visibleParagraph >= 2 ? 1 : 0,
            transform: visibleParagraph >= 2 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease'
          }}>
            Professionals in neusbloeden noem ik het.
          </p>

          <p style={{
            marginBottom: '1.5rem',
            opacity: visibleParagraph >= 3 ? 1 : 0,
            transform: visibleParagraph >= 3 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease'
          }}>
            Merken dat je je problemen aan het{' '}
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>verdoven</span> bent 
            en voor je uit blijft schuiven.
          </p>

          <p style={{
            marginBottom: '1.5rem',
            opacity: visibleParagraph >= 4 ? 1 : 0,
            transform: visibleParagraph >= 4 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease'
          }}>
            Weten dat je jezelf, vrienden, familie en collega's{' '}
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>tekort doet</span>.
          </p>

          <p style={{
            marginBottom: '0',
            opacity: visibleParagraph >= 5 ? 1 : 0,
            transform: visibleParagraph >= 5 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease'
          }}>
            Voelen dat op deze manier het leven maar voorbij vliegt zonder{' '}
            <span style={{ color: '#fff', fontWeight: '500' }}>iets merkwaardigs</span> gedaan te hebben.
          </p>
        </div>

        {/* Full-width Visual Break */}
        <div style={{
          margin: isMobile ? '3rem -1.5rem' : '4rem -2rem',
          opacity: visibleParagraph >= 5 ? 1 : 0,
          transform: visibleParagraph >= 5 ? 'scale(1)' : 'scale(0.98)',
          transition: 'all 1.2s ease 0.3s'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? '300px' : '400px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <img 
              src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/steptodown.com_960747.jpg?v=1758546786"
              alt="Man in contemplation, looking defeated"
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 0.9 : 0,
                transition: 'opacity 1s ease',
                filter: 'grayscale(60%) contrast(1.3) brightness(1.1)'
              }}
            />
            {!imageLoaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>
                Loading...
              </div>
            )}
            
            {/* Lighter overlay for more image visibility */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
              pointerEvents: 'none'
            }} />
          </div>
        </div>

        {/* Break line */}
        <div style={{
          width: '40px',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: isMobile ? '3rem 0 2rem 0' : '4rem 0 3rem 0',
          opacity: visibleParagraph >= 6 ? 1 : 0,
          transition: 'opacity 1s ease'
        }} />

        {/* Key Statement - Large and Centered */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          <p style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem',
            opacity: visibleParagraph >= 6 ? 1 : 0,
            transform: visibleParagraph >= 6 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease',
            lineHeight: '1.2'
          }}>
            Maar doen alsof je neus bloedt.
          </p>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
            opacity: visibleParagraph >= 6 ? 1 : 0,
            transform: visibleParagraph >= 6 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.2s'
          }}>
            Doen alsof er geen vuiltje aan de lucht is.<br />
            Alsof het allemaal rozengeur en maneschijn is.
          </p>
        </div>

        {/* Reality check section */}
        <div style={{
          padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
          marginBottom: isMobile ? '3rem' : '4rem',
          opacity: visibleParagraph >= 7 ? 1 : 0,
          transform: visibleParagraph >= 7 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.5s'
        }}>
          
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1.5rem'
          }}>
            Werkt enorm goed nietwaar?
          </h3>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1rem'
          }}>
            50% van de tijd overtuig je jezelf er misschien ook mee.
          </p>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem'
          }}>
            En die andere 50%?
          </p>

          {/* Coping mechanisms */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {[
              { trigger: "Voel je rot over niet presteren?", action: "→ Scrollt verder", result: "3 uur verder, niet helder genoeg meer om de pijn te voelen" },
              { trigger: "Rotte week?", action: "→ Drinkt er gewoon eentje meer", result: "Heel weekend brak en verdoofd" }
            ].map((item, index) => (
              <div key={index} style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{item.trigger}</span><br />
                <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{item.action}</span><br />
                <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>{item.result}</span>
              </div>
            ))}
          </div>

          {/* Final punch */}
          <p style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '500',
            color: '#fff',
            marginTop: '2rem'
          }}>
            En zo gaat het leven maar een beetje door.
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '1rem'
          }}>
            Van afleiding naar afleiding.<br />
            Doen alsof je neus bloedt en lekker met de wind meewaaien.
          </p>
        </div>

        {/* Hard truth */}
        <div style={{
          textAlign: 'center',
          opacity: visibleParagraph >= 8 ? 1 : 0,
          transform: visibleParagraph >= 8 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.8s'
        }}>
          <p style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            Helaas is er één iemand die je niet voor de gek houdt.
          </p>
          
          <p style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '2rem'
          }}>
            En dat ben jezelf.
          </p>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '3rem'
          }}>
            Hoeveel tijd laat jij op deze manier voorbij glippen?
          </p>

          {/* CTA */}
          <button
            onClick={onScrollNext}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '0',
              padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
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
            Maak de mensen om je heen trots
          </button>
        </div>
      </div>
    </section>
  )
}
