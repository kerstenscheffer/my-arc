import React, { useState, useEffect } from 'react'

export default function ProcessShowcase({ isMobile }) {
  const [isVisible, setIsVisible] = useState(false)
  const [visiblePhoto, setVisiblePhoto] = useState(-1)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 300)
    
    // Progressive photo reveal
    const timers = []
    for (let i = 0; i <= 5; i++) {
      timers.push(
        setTimeout(() => setVisiblePhoto(i), 500 + (i * 150))
      )
    }
    
    return () => timers.forEach(clearTimeout)
  }, [])

  const photos = [
    {
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', // Gym coaching
      caption: 'Persoonlijke begeleiding',
      span: 2 // Takes 2 columns
    },
    {
      url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', // App screenshot placeholder
      caption: 'MY ARC tracking systeem'
    },
    {
      url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400', // Meal prep
      caption: 'Voeding op maat'
    },
    {
      url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', // Progress data
      caption: 'Continue progressie monitoring'
    },
    {
      url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800', // Gym setup
      caption: 'Waar je ook traint',
      span: 2 // Takes 2 columns
    }
  ]

  return (
    <section style={{
      minHeight: isMobile ? '80vh' : '100vh',
      background: '#000',
      position: 'relative',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2.5rem' : '4rem',
        maxWidth: '700px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(239, 68, 68, 0.7)',
          marginBottom: '1rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: '500'
        }}>
          Het systeem
        </p>

        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: '1.2',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em'
        }}>
          Bewezen Proces
        </h2>

        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '300'
        }}>
          Niet alleen een plan. Een compleet systeem.
        </p>
      </div>

      {/* Photo Grid - Masonry Style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        maxWidth: '1200px',
        width: '100%',
        marginBottom: isMobile ? '2rem' : '3rem'
      }}>
        {photos.map((photo, index) => (
          <div
            key={index}
            style={{
              gridColumn: isMobile ? 'span 1' : `span ${photo.span || 1}`,
              position: 'relative',
              aspectRatio: photo.span === 2 ? '16/9' : '1/1',
              overflow: 'hidden',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              opacity: visiblePhoto >= index ? 1 : 0,
              transform: visiblePhoto >= index ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              const overlay = e.currentTarget.querySelector('.overlay')
              const caption = e.currentTarget.querySelector('.caption')
              if (overlay) overlay.style.background = 'rgba(220, 38, 38, 0.7)'
              if (caption) {
                caption.style.transform = 'translateY(0)'
                caption.style.opacity = '1'
              }
            }}
            onMouseLeave={(e) => {
              const overlay = e.currentTarget.querySelector('.overlay')
              const caption = e.currentTarget.querySelector('.caption')
              if (overlay) overlay.style.background = 'rgba(0, 0, 0, 0.4)'
              if (caption) {
                caption.style.transform = 'translateY(10px)'
                caption.style.opacity = '0.9'
              }
            }}
          >
            {/* Photo */}
            <img 
              src={photo.url}
              alt={photo.caption}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(100%) brightness(0.6)',
                transition: 'all 0.4s ease'
              }}
            />

            {/* Overlay */}
            <div 
              className="overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                transition: 'all 0.4s ease',
                display: 'flex',
                alignItems: 'flex-end',
                padding: isMobile ? '1rem' : '1.5rem'
              }}
            >
              {/* Caption */}
              <p 
                className="caption"
                style={{
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  color: '#fff',
                  fontWeight: '600',
                  margin: 0,
                  letterSpacing: '0.02em',
                  transform: 'translateY(10px)',
                  opacity: 0.9,
                  transition: 'all 0.3s ease'
                }}
              >
                {photo.caption}
              </p>
            </div>

            {/* Red accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40px',
              height: '2px',
              background: '#dc2626'
            }} />
          </div>
        ))}
      </div>

      {/* Bottom text */}
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        opacity: visiblePhoto >= 5 ? 1 : 0,
        transition: 'opacity 0.8s ease 0.5s'
      }}>
        <div style={{
          width: '60px',
          height: '1px',
          background: 'rgba(220, 38, 38, 0.3)',
          margin: '0 auto 2rem'
        }} />

        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.6',
          fontWeight: '300'
        }}>
          Niet alleen theorie. Een bewezen systeem dat werkt.
          <br />
          <span style={{ color: 'rgba(239, 68, 68, 0.8)', fontWeight: '400' }}>
            Till the goal. Elke keer.
          </span>
        </p>
      </div>
    </section>
  )
}
