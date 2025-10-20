import { useState, useEffect } from 'react'
import { Shield, User, Clock, Play } from 'lucide-react'
import BookCallModal from '../components/BookCallModal'
import DatabaseService from '../services/DatabaseService'

export default function BookCallSection({ isMobile }) {
  const db = DatabaseService
  const [visibleElements, setVisibleElements] = useState(0)
  const [showBookCallModal, setShowBookCallModal] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  // Slow reveal elements
  useEffect(() => {
    const timers = []
    for (let i = 0; i <= 4; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleElements(i)
        }, i * 600)
      )
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const features = [
    { icon: Shield, text: "Resultaat Garantie" },
    { icon: User, text: "1-op-1 Plan" }, 
    { icon: Clock, text: "8 Weken" }
  ]

  const handleVideoClick = () => {
    setShowVideo(true)
  }

  const handleBookCall = () => {
    setShowBookCallModal(true)
  }

  return (
    <section style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      background: '#111',
      position: 'relative'
    }}>
      
      {/* Subtle background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.02) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '800px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        {/* Header */}
        <h2 style={{
          fontSize: isMobile ? '2rem' : '2.75rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: '1.2',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          letterSpacing: '-0.02em',
          opacity: visibleElements >= 0 ? 1 : 0,
          transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          Ready voor jouw transformatie?
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.4',
          marginBottom: isMobile ? '2rem' : '2.5rem',
          fontWeight: '500',
          opacity: visibleElements >= 0 ? 1 : 0,
          transform: visibleElements >= 0 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.1s'
        }}>
          Bekijk hoe het werkt
        </p>

        {/* YouTube Video with Custom Thumbnail */}
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '600px',
          aspectRatio: '16/9',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '2.5rem',
          opacity: visibleElements >= 1 ? 1 : 0,
          transform: visibleElements >= 1 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.2s',
          borderRadius: isMobile ? '16px' : '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {!showVideo ? (
            // Thumbnail with Play Button
            <div 
              onClick={handleVideoClick}
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Ontwerp_zonder_titel_49.png?v=1758029590')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                const parent = e.currentTarget.parentElement
                if (parent) parent.style.border = '1px solid rgba(16, 185, 129, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                const parent = e.currentTarget.parentElement
                if (parent) parent.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Dark overlay on hover */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                pointerEvents: 'none'
              }} />
              
              {/* Play Button */}
              <div style={{
                width: isMobile ? '60px' : '80px',
                height: isMobile ? '60px' : '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 1
              }}>
                <Play 
                  size={isMobile ? 24 : 32} 
                  color="#fff" 
                  style={{ marginLeft: '4px' }} 
                />
              </div>
            </div>
          ) : (
            // YouTube Embed with Custom Controls
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/INIdTRVjX80?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&enablejsapi=1"
                title="MY ARC Transformation Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  borderRadius: isMobile ? '16px' : '20px'
                }}
              />
              
              {/* Custom minimal controls overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                padding: isMobile ? '1rem' : '1.25rem',
                borderRadius: `0 0 ${isMobile ? '16px' : '20px'} ${isMobile ? '16px' : '20px'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {/* Play/Pause Button */}
                <button
                  onClick={() => {
                    // Toggle play/pause - will need YouTube API for full control
                    console.log('Play/Pause clicked')
                  }}
                  style={{
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  <Play size={isMobile ? 14 : 16} color="#000" />
                </button>
                
                {/* Progress Bar */}
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '3px',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '0%', // Will be controlled by JavaScript
                    background: '#10b981',
                    borderRadius: '3px',
                    transition: 'width 0.1s ease'
                  }} />
                </div>
                
                {/* Time Display */}
                <span style={{
                  color: '#fff',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  fontWeight: '500',
                  minWidth: 'fit-content'
                }}>
                  0:00 / 5:01
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Book Call Button */}
        <button
          onClick={handleBookCall}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '1.25rem 2rem' : '1.5rem 2.5rem',
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '56px',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)',
            marginBottom: isMobile ? '2.5rem' : '3rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '85%' : '400px',
            maxWidth: '500px',
            opacity: visibleElements >= 2 ? 1 : 0,
            transform: visibleElements >= 2 ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.25)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 1) 0%, rgba(59, 130, 246, 1) 100%)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%)'
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
IK WIL FIT WORDEN
        </button>

        {/* Features */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '1.5rem' : '3rem',
          opacity: visibleElements >= 3 ? 1 : 0,
          transform: visibleElements >= 3 ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: '0.4s',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '1rem',
              fontWeight: '500',
              minWidth: isMobile ? '80px' : 'auto',
              justifyContent: 'center'
            }}>
              <feature.icon size={isMobile ? 16 : 18} color="rgba(16, 185, 129, 0.8)" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BookCall Modal */}
      <BookCallModal 
        isOpen={showBookCallModal}
        onClose={() => setShowBookCallModal(false)}
        isMobile={isMobile}
        db={db}
      />
    </section>
  )
}
