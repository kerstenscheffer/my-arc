import { useState, useEffect } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'

export default function VideoSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false) // Geluid standaard AAN
  const [showContent, setShowContent] = useState(false)

  // YouTube video details
  const videoId = 'H32dhyLJ3dE'
  const thumbnailUrl = 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Ontwerp_zonder_titel_2.png?v=1758651441'

  useEffect(() => {
    if (isCurrentSection) {
      setTimeout(() => setShowContent(true), 300)
    }
  }, [isCurrentSection])

  const handlePlayVideo = () => {
    setIsPlaying(true)
  }

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      background: '#000'
    }}>
      
      <div style={{
        maxWidth: '900px',
        width: '100%',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* Pre-video text */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            2 minuten van je tijd
          </p>
          
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            Tijd om eerlijk te zijn
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '400'
          }}>
            tegen jezelf
          </p>
        </div>

        {/* Video container */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          background: '#0a0a0a',
          borderRadius: '0',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          
          {!isPlaying ? (
            /* Thumbnail with play button */
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                cursor: 'pointer',
                background: `url(${thumbnailUrl}) center/cover no-repeat`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handlePlayVideo}
            >
              {/* Dark overlay for better play button visibility */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease'
              }} />
              
              {/* Play button */}
              <button
                style={{
                  width: isMobile ? '60px' : '80px',
                  height: isMobile ? '60px' : '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  zIndex: 10,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.parentElement.querySelector('div').style.background = 'rgba(0, 0, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.parentElement.querySelector('div').style.background = 'rgba(0, 0, 0, 0.3)'
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    setTimeout(() => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }, 150)
                  }
                }}
              >
                <Play 
                  size={isMobile ? 24 : 32} 
                  color="#fff" 
                  style={{ marginLeft: '4px' }}
                />
              </button>
            </div>
          ) : (
            /* YouTube iframe */
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&hd=1&vq=hd1440&rel=0&modestbranding=1&controls=1`}
              title="MY ARC Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Mute toggle - alleen zichtbaar bij thumbnail */}
          {!isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMuted(!isMuted)
              }}
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'
              }}
            >
              {isMuted ? (
                <VolumeX size={18} color="rgba(255, 255, 255, 0.7)" />
              ) : (
                <Volume2 size={18} color="rgba(255, 255, 255, 0.9)" />
              )}
            </button>
          )}
        </div>

        {/* Post-video emotional hooks */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          textAlign: 'center'
        }}>
          {/* Three emotional triggers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '1.5rem' : '2rem',
            marginBottom: isMobile ? '3rem' : '4rem'
          }}>
            {[
              { num: "1", text: "Je onzekerheid vreet je energie" },
              { num: "2", text: "Je schaamte drink, eet of scroll je weg" },
              { num: "3", text: "Respect is een begrip ver te zoeken" }
            ].map((item, index) => (
              <div 
                key={index}
                style={{
                  opacity: showContent ? 1 : 0,
                  transform: showContent ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.8 + (index * 0.2)}s`
                }}
              >
                <div style={{
                  fontSize: isMobile ? '2rem' : '2.5rem',
                  fontWeight: '800',
                  color: 'rgba(255, 255, 255, 0.1)',
                  marginBottom: '0.5rem',
                  lineHeight: '1'
                }}>
                  {item.num}
                </div>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.4',
                  fontWeight: '400'
                }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            width: '60px',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '0 auto',
            marginBottom: isMobile ? '2rem' : '3rem'
          }} />

          {/* Call to action question */}
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            Neem jij je verantwoordelijkheid?
          </h3>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: isMobile ? '2rem' : '3rem'
          }}>
            Of blijf je doen alsof je neus bloedt?
          </p>

          {/* Next button */}
          <button
            onClick={onScrollNext}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.5rem 0',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              e.currentTarget.style.borderBottomColor = 'rgba(255, 255, 255, 0.3)'
            }}
          >
            Lees verder →
          </button>
        </div>
      </div>
    </section>
  )
}
