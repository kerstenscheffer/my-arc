// src/modules/videos/PageVideoWidget.jsx - EXAMPLESLIDER STYLE
import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Zap, Target, Apple, Brain, Heart, GraduationCap, Trophy,
  Clock, Sparkles, Info
} from 'lucide-react'
import videoService from './VideoService'

// VIDEO CATEGORIES CONFIGURATION
const VIDEO_CATEGORIES = {
  motivation: { icon: Zap, label: 'Motivatie', color: '#f97316' },
  technique: { icon: Target, label: 'Techniek', color: '#3b82f6' },
  nutrition: { icon: Apple, label: 'Voeding', color: '#10b981' },
  mindset: { icon: Brain, label: 'Mindset', color: '#8b5cf6' },
  recovery: { icon: Heart, label: 'Herstel', color: '#ec4899' },
  education: { icon: GraduationCap, label: 'Educatie', color: '#06b6d4' },
  challenge: { icon: Trophy, label: 'Challenge', color: '#dc2626' }
}

// PAGE STYLING CONFIGURATION
const PAGE_STYLES = {
  home: { primary: '#3b82f6' },
  workout: { primary: '#f97316' },
  meals: { primary: '#288705' },
  tracking: { primary: '#8b5cf6' },
  weight: { primary: '#0ea5e9' },
  calls: { primary: '#3b82f6' },
  profile: { primary: '#ec4899' }
}

export default function PageVideoWidget({ client, db, pageContext = 'home' }) {
  const [allVideos, setAllVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableCategories, setAvailableCategories] = useState([])
  
  const intervalRef = useRef(null)
  const playerRef = useRef(null)
  const isMobile = window.innerWidth <= 768
  
  // Get page-specific styling
  const pageStyle = PAGE_STYLES[pageContext] || PAGE_STYLES.home

  // Load videos on mount
  useEffect(() => {
    loadVideos()
  }, [client?.id, pageContext])

  // Filter videos when category changes
  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      setFilteredVideos(allVideos)
    } else {
      const filtered = allVideos.filter(v => v.video?.category === selectedCategory)
      setFilteredVideos(filtered)
    }
    setCurrentIndex(0)
  }, [selectedCategory, allVideos])

  // Auto-slide functionality
  useEffect(() => {
    if (!isPaused && filteredVideos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredVideos.length)
      }, 4000) // 4 seconds like ExampleSlider
      
      return () => clearInterval(intervalRef.current)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [isPaused, filteredVideos.length])

  // Load videos from database
  const loadVideos = async () => {
    if (!client?.id || !db) return
    
    setLoading(true)
    try {
      const pageVideos = await videoService.getVideosForPage(
        client.id, 
        pageContext,
        {},
        db
      )
      
      setAllVideos(pageVideos)
      setFilteredVideos(pageVideos)
      
      // Get unique categories
      const categories = [...new Set(pageVideos.map(v => v.video?.category).filter(Boolean))]
      setAvailableCategories(categories)
      
      // Set first category as default
      if (categories.length > 0) {
        setSelectedCategory(categories[0])
      }
      
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manual navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredVideos.length) % filteredVideos.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredVideos.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000)
  }

  // Extract YouTube ID
  const extractYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // Handle video play
  const handlePlay = async () => {
    const currentVideo = filteredVideos[currentIndex]
    if (!currentVideo) return
    
    setIsPlaying(true)
    
    if (currentVideo.id) {
      await videoService.markAsViewed(currentVideo.id)
    }
  }

  // Handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none'
    const currentCat = VIDEO_CATEGORIES[currentVideo?.category] || VIDEO_CATEGORIES.motivation
    e.target.parentElement.style.background = `linear-gradient(135deg, ${currentCat.color}20, ${currentCat.color}10)`
  }

  // Don't render if loading or no videos
  if (loading || allVideos.length === 0) {
    return null
  }

  const currentVideo = filteredVideos[currentIndex]?.video
  const videoId = extractYouTubeId(currentVideo?.video_url)
  const currentCategory = VIDEO_CATEGORIES[currentVideo?.category] || VIDEO_CATEGORIES.motivation
  const Icon = currentCategory.icon

  if (!currentVideo) {
    return null
  }

  return (
    <div style={{
      marginTop: '0.5rem',
      marginBottom: '0.5rem'
    }}>
      {/* Header - Minimal like ExampleSlider */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        padding: '0 0.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: `${pageStyle.primary}b3`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={14} color={pageStyle.primary} opacity={0.7} />
          Coach Video's
        </div>
        
        {/* Category Dots - Compact */}
        <div style={{
          display: 'flex',
          gap: '0.375rem'
        }}>
          {availableCategories.map((catKey) => {
            const cat = VIDEO_CATEGORIES[catKey]
            if (!cat) return null
            
            const isActive = selectedCategory === catKey
            const CatIcon = cat.icon
            
            return (
              <button
                key={catKey}
                onClick={() => {
                  setSelectedCategory(catKey)
                  setIsPaused(true)
                  setTimeout(() => setIsPaused(false), 5000)
                }}
                style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  borderRadius: '6px',
                  background: isActive 
                    ? `linear-gradient(135deg, ${cat.color}25 0%, ${cat.color}15 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isActive 
                    ? `1px solid ${cat.color}40`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <CatIcon size={12} color={isActive ? cat.color : 'rgba(255, 255, 255, 0.4)'} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Slider Container - Seamless like ExampleSlider */}
      <div 
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
          border: `1px solid ${pageStyle.primary}14`,
          marginBottom: '0.5rem'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
      >
        {/* Main Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: isPlaying ? '0' : (isMobile ? '50%' : '45%'), // Shorter height
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${currentCategory.color}10 0%, ${currentCategory.color}05 100%)`
        }}>
          {!isPlaying && videoId ? (
            <>
              {/* Fallback icon */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.15
              }}>
                <Icon size={48} color={currentCategory.color} />
              </div>
              
              {/* Thumbnail */}
              <img
                key={currentVideo.id}
                src={currentVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={currentVideo.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'opacity 0.5s ease'
                }}
                onError={handleImageError}
              />
              
              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
                pointerEvents: 'none'
              }} />
              
              {/* Category Badge - Top Left */}
              <div style={{
                position: 'absolute',
                top: isMobile ? '0.5rem' : '0.75rem',
                left: isMobile ? '0.5rem' : '0.75rem',
                background: `${currentCategory.color}ee`,
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: isMobile ? '0.3rem 0.5rem' : '0.375rem 0.625rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                <Icon size={12} color="white" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '600',
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {currentCategory.label}
                </span>
              </div>
              
              {/* Video Title - Bottom */}
              <div style={{
                position: 'absolute',
                bottom: isMobile ? '0.75rem' : '1rem',
                left: isMobile ? '0.75rem' : '1rem',
                right: isMobile ? '0.75rem' : '1rem',
                zIndex: 2
              }}>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1.1rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '0.25rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {currentVideo.title}
                </h3>
                {currentVideo.description && (
                  <p style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {currentVideo.description}
                  </p>
                )}
              </div>
              
              {/* Play Button - Center */}
              <button
                onClick={handlePlay}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                  }
                }}
              >
                <Play size={isMobile ? 20 : 24} color="#000" style={{ marginLeft: '2px' }} />
              </button>
              
              {/* Navigation Buttons - Smaller */}
              <button
                onClick={goToPrevious}
                style={{
                  position: 'absolute',
                  left: isMobile ? '0.375rem' : '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isMobile || isPaused ? 0.7 : 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = isMobile || isPaused ? '0.7' : '0'
                }}
              >
                <ChevronLeft size={16} color="white" />
              </button>
              
              <button
                onClick={goToNext}
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.375rem' : '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isMobile || isPaused ? 0.7 : 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = isMobile || isPaused ? '0.7' : '0'
                }}
              >
                <ChevronRight size={16} color="white" />
              </button>
            </>
          ) : isPlaying && videoId ? (
            /* YouTube Player */
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%'
            }}>
              <iframe
                ref={playerRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              <button
                onClick={() => setIsPlaying(false)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
        
        {/* Progress Bar - Thin at bottom */}
        {!isPlaying && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{
              height: '100%',
              width: `${((currentIndex + 1) / filteredVideos.length) * 100}%`,
              background: `linear-gradient(90deg, ${currentCategory.color} 0%, ${currentCategory.color}cc 100%)`,
              transition: 'width 0.3s ease',
              boxShadow: `0 0 6px ${currentCategory.color}40`
            }} />
          </div>
        )}
      </div>

      {/* Tips Section - Compact */}
      {currentVideo.description && (
        <div style={{
          padding: isMobile ? '0.5rem' : '0.625rem',
          background: `linear-gradient(135deg, ${currentCategory.color}08 0%, ${currentCategory.color}03 100%)`,
          borderRadius: '10px',
          border: `1px solid ${currentCategory.color}15`
        }}>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: currentCategory.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.2rem',
            fontWeight: '600',
            opacity: 0.8
          }}>
            Info
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.3'
          }}>
            {currentVideo.description}
          </div>
        </div>
      )}

      {/* Dots Indicator - Minimal */}
      {filteredVideos.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.2rem',
          marginTop: '0.5rem'
        }}>
          {filteredVideos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                setIsPaused(true)
                setTimeout(() => setIsPaused(false), 5000)
              }}
              style={{
                width: idx === currentIndex ? '12px' : '4px',
                height: '4px',
                borderRadius: '2px',
                background: idx === currentIndex 
                  ? currentCategory.color 
                  : 'rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: 'none',
                padding: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
