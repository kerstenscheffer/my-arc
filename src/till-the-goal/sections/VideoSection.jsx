import { useState, useEffect } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'

export default function VideoSection({ isMobile }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // YouTube video details
  const videoId = 'INIdTRVjX80'
  const thumbnailUrl = 'https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Ontwerp_zonder_titel_49.png?v=1758029590'

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300)
  }, [])

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
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(239, 68, 68, 0.7)',
            marginBottom: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            5 minuten van je tijd
          </p>
          
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1.2',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            Van 8 Weken Momentum
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '400'
          }}>
            Naar Lifetime Transformatie
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
          border: '1px solid rgba(220, 38, 38, 0.15)'
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
              {/* Dark overlay */}
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
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '2px solid rgba(220, 38, 38, 0.4)',
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
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.25)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.parentElement.querySelector('div').style.background = 'rgba(0, 0, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)'
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
                  color="#ef4444" 
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
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&hd=1&vq=hd1440&rel=0&modestbranding=1&controls=1&loop=1&playlist=${videoId}`}
              title="Till The Goal Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Mute toggle */}
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
                border: '1px solid rgba(220, 38, 38, 0.2)',
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
                <Volume2 size={18} color="rgba(239, 68, 68, 0.9)" />
              )}
            </button>
          )}
        </div>

        {/* Post-video content */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          textAlign: 'center'
        }}>
          {/* Three key points */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? '1.5rem' : '2rem',
            marginBottom: isMobile ? '3rem' : '4rem'
          }}>
            {[
              { num: "1", text: "8 weken was pas het begin" },
              { num: "2", text: "90% valt terug zonder systeem" },
              { num: "3", text: "We stoppen pas als jij wint" }
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
                  color: 'rgba(220, 38, 38, 0.15)',
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
            background: 'rgba(220, 38, 38, 0.3)',
            margin: '0 auto',
            marginBottom: isMobile ? '2rem' : '3rem'
          }} />

          {/* Call to action */}
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            Klaar om door te gaan?
          </h3>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: isMobile ? '2rem' : '3rem',
            fontWeight: '300'
          }}>
            Of laat je het momentum wegglippen?
          </p>

          {/* Next button */}
          <button
            onClick={() => {
              const nextSection = document.getElementById('section-2')
              if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(220, 38, 38, 0.4)',
              padding: '0.5rem 0',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '500',
              color: 'rgba(239, 68, 68, 0.9)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.05em',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444'
              e.currentTarget.style.borderBottomColor = 'rgba(220, 38, 38, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'
              e.currentTarget.style.borderBottomColor = 'rgba(220, 38, 38, 0.4)'
            }}
          >
            Bekijk wat je krijgt →
          </button>
        </div>
      </div>
    </section>
  )
}
