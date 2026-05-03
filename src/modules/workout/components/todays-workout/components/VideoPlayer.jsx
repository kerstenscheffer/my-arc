// src/modules/workout/components/todays-workout/components/VideoPlayer.jsx
// Premium YouTube Video Player - PORTRAIT MODE, AUTOPLAY, LOOP

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

export default function VideoPlayer({ 
  youtubeId,
  youtubeUrl,
  thumbnailUrl,
  title = 'Exercise Video',
  onPlay = () => {},
  onError = () => {},
  placeholder = false
}) {
  const isMobile = window.innerWidth <= 768
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [hasError, setHasError] = useState(false)
  const controlsTimeout = useRef(null)
  
  const videoId = youtubeId || extractYouTubeId(youtubeUrl)
  
  // YouTube embed URL met autoplay + loop
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=0&playsinline=1&rel=0&modestbranding=1&controls=0&showinfo=0`
    : null

  const handleTap = () => {
    setShowControls(true)
    setIsPlaying(!isPlaying)
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [])

  // Placeholder state
  if (!videoId || placeholder || hasError) {
    return (
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '350px',
        aspectRatio: '9/16',
        margin: '0 auto',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderRadius: isMobile ? '12px' : '16px',
        border: '1px solid rgba(255, 215, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          width: isMobile ? '64px' : '72px',
          height: isMobile ? '64px' : '72px',
          borderRadius: '50%',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '2px solid rgba(255, 215, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Play 
            size={isMobile ? 28 : 32} 
            color="rgba(255, 215, 0, 0.5)"
            fill="rgba(255, 215, 0, 0.2)"
            style={{ marginLeft: '4px' }}
          />
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          margin: 0,
          textAlign: 'center',
          padding: '0 1.5rem'
        }}>
          {hasError ? 'Video kon niet worden geladen' : 'Video binnenkort beschikbaar'}
        </p>
      </div>
    )
  }

  return (
    <div 
      onClick={handleTap}
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '350px',
        aspectRatio: '9/16',
        margin: '0 auto',
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        border: '2px solid rgba(255, 215, 0, 0.3)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.1)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <iframe
        src={isPlaying ? embedUrl : embedUrl.replace('autoplay=1', 'autoplay=0')}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none'
        }}
        onError={() => setHasError(true)}
      />
      
      {/* Play/Pause Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showControls ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
        transition: 'background 0.3s ease',
        pointerEvents: 'none'
      }}>
        <div style={{
          width: isMobile ? '70px' : '80px',
          height: isMobile ? '70px' : '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 193, 0, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(255, 215, 0, 0.5)',
          opacity: showControls ? 1 : 0,
          transform: showControls ? 'scale(1)' : 'scale(0.8)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {isPlaying ? (
            <Pause size={isMobile ? 32 : 36} color="#000" strokeWidth={2.5} />
          ) : (
            <Play size={isMobile ? 32 : 36} color="#000" fill="#000" style={{ marginLeft: '4px' }} />
          )}
        </div>
      </div>
      
      {/* Top gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Title */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '1rem' : '1.25rem',
        pointerEvents: 'none'
      }}>
        <p style={{
          color: '#fff',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '700',
          margin: 0,
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
        }}>
          {title}
        </p>
      </div>
      
      {/* Gold accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
        opacity: 0.8,
        pointerEvents: 'none'
      }} />
    </div>
  )
}

function extractYouTubeId(url) {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}
