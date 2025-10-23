// src/modules/videos/PageVideoWidget.jsx - SIDEBAR VERSION
import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, X,
  Zap, Target, Apple, Brain, Heart, GraduationCap, Trophy,
  Clock, Sparkles, Info, Video
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
  meals: { primary: '#10b981' },
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
  const [isOpen, setIsOpen] = useState(false)
  const [showBadge, setShowBadge] = useState(false)
  
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

  // Auto-slide functionality (only when sidebar open)
  useEffect(() => {
    if (isOpen && !isPaused && filteredVideos.length > 1 && !isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredVideos.length)
      }, 4000)
      
      return () => clearInterval(intervalRef.current)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [isOpen, isPaused, filteredVideos.length, isPlaying])

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

      // Show badge if videos exist
      setShowBadge(pageVideos.length > 0)
      
    } catch (error) {
      console.error('Error loading videos:', error)
      setShowBadge(false)
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

  if (loading || !showBadge) return null

  const currentVideo = filteredVideos[currentIndex]?.video
  const videoId = extractYouTubeId(currentVideo?.video_url)
  const currentCategory = VIDEO_CATEGORIES[currentVideo?.category] || VIDEO_CATEGORIES.motivation
  const Icon = currentCategory.icon

  return (
    <>
      {/* FLOATING BADGE - Alleen tonen als sidebar DICHT is */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ 
            position: 'fixed',
            bottom: '160px', // Net boven notification widget
            right: '0',
            zIndex: 997,
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            background: 'rgba(17, 17, 17, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `translateX(${isMobile ? '8px' : '10px'})`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateX(6px)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.85)'
              e.currentTarget.style.borderColor = `${pageStyle.primary}30`
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateX(10px)'
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.7)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'translateX(4px) scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'translateX(8px) scale(1)'
            }
          }}
          aria-label="Toggle videos"
        >
          <Video 
            size={isMobile ? 18 : 20} 
            color="rgba(255, 255, 255, 0.6)" 
            strokeWidth={2}
          />
          {allVideos.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              background: pageStyle.primary,
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: '700',
              borderRadius: '50%',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(0, 0, 0, 0.3)',
              boxShadow: `0 1px 4px ${pageStyle.primary}80`
            }}>
              {allVideos.length < 10 ? allVideos.length : '•'}
            </span>
          )}
        </button>
      )}

      {/* MOBILE OVERLAY */}
      {isMobile && isOpen && (
        <div
          onClick={() => {
            setIsOpen(false)
            setIsPlaying(false)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 88,
            animation: 'fadeIn 0.3s ease',
            touchAction: 'manipulation'
          }}
        />
      )}

      {/* SIDEBAR */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? '0' : '-100%',
          width: isMobile ? '85%' : '400px',
          maxWidth: '400px',
          height: '100vh',
          background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderLeft: `1px solid ${pageStyle.primary}40`,
          boxShadow: `-4px 0 40px ${pageStyle.primary}26`,
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 89,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Video decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-3%',
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <Video size={isMobile ? 120 : 150} color={pageStyle.primary} />
        </div>

        {/* Content wrapper */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          {/* HEADER */}
          <div style={{
            marginBottom: isMobile ? '1rem' : '1.25rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.75rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: isMobile ? '1.1rem' : '1.3rem',
                  fontWeight: '800',
                  color: pageStyle.primary,
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  letterSpacing: '-0.02em'
                }}>
                  <Sparkles size={isMobile ? 18 : 22} />
                  Coach Video's
                </h2>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {filteredVideos.length} video's beschikbaar
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
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
                      setIsPlaying(false)
                      setTimeout(() => setIsPaused(false), 5000)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: isMobile ? '0.4rem 0.7rem' : '0.5rem 0.875rem',
                      borderRadius: '8px',
                      background: isActive 
                        ? `linear-gradient(135deg, ${cat.color}25 0%, ${cat.color}15 100%)`
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isActive 
                        ? `1px solid ${cat.color}40`
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      }
                    }}
                  >
                    <CatIcon size={14} color={isActive ? cat.color : 'rgba(255, 255, 255, 0.5)'} />
                    <span style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? cat.color : 'rgba(255, 255, 255, 0.6)'
                    }}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* VIDEO PLAYER AREA */}
          {currentVideo && (
            <div 
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${currentCategory.color}10 0%, ${currentCategory.color}05 100%)`,
                border: `1px solid ${currentCategory.color}20`,
                marginBottom: '1rem'
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: isPlaying ? '0' : '56.25%',
                overflow: 'hidden'
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
                    
                    {/* Category Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: `${currentCategory.color}ee`,
                      backdropFilter: 'blur(10px)',
                      borderRadius: '8px',
                      padding: '0.375rem 0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}>
                      <Icon size={12} color="white" />
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {currentCategory.label}
                      </span>
                    </div>
                    
                    {/* Video Title */}
                    <div style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '1rem',
                      right: '1rem',
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
                    </div>
                    
                    {/* Play Button */}
                    <button
                      onClick={handlePlay}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        transition: 'all 0.2s ease',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
                      }}
                    >
                      <Play size={24} color="#000" style={{ marginLeft: '2px' }} />
                    </button>
                    
                    {/* Navigation Buttons */}
                    {filteredVideos.length > 1 && (
                      <>
                        <button
                          onClick={goToPrevious}
                          style={{
                            position: 'absolute',
                            left: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isPaused ? 0.7 : 0,
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = isPaused ? '0.7' : '0'}
                        >
                          <ChevronLeft size={16} color="white" />
                        </button>
                        
                        <button
                          onClick={goToNext}
                          style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isPaused ? 0.7 : 0,
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = isPaused ? '0.7' : '0'}
                        >
                          <ChevronRight size={16} color="white" />
                        </button>
                      </>
                    )}
                  </>
                ) : isPlaying && videoId ? (
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
                        fontSize: '1.2rem',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
              
              {/* Progress Bar */}
              {!isPlaying && filteredVideos.length > 1 && (
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
          )}

          {/* Description */}
          {currentVideo?.description && (
            <div style={{
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${currentCategory.color}08 0%, ${currentCategory.color}03 100%)`,
              borderRadius: '10px',
              border: `1px solid ${currentCategory.color}15`,
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '0.65rem',
                color: currentCategory.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.3rem',
                fontWeight: '600',
                opacity: 0.8
              }}>
                Over deze video
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.4'
              }}>
                {currentVideo.description}
              </div>
            </div>
          )}

          {/* Dots Indicator */}
          {filteredVideos.length > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.3rem',
              marginBottom: '1rem'
            }}>
              {filteredVideos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx)
                    setIsPaused(true)
                    setIsPlaying(false)
                    setTimeout(() => setIsPaused(false), 5000)
                  }}
                  style={{
                    width: idx === currentIndex ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
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

          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              setIsOpen(false)
              setIsPlaying(false)
            }}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(23, 23, 23, 0.8)',
              border: `1px solid ${pageStyle.primary}33`,
              borderRadius: '10px',
              color: pageStyle.primary,
              fontWeight: '700',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              marginTop: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${pageStyle.primary}26 0%, ${pageStyle.primary}1a 100%)`
              e.currentTarget.style.border = `1px solid ${pageStyle.primary}4d`
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(23, 23, 23, 0.8)'
              e.currentTarget.style.border = `1px solid ${pageStyle.primary}33`
              e.currentTarget.style.transform = 'translateY(0)'
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
            <X size={18} />
            Sluit Video's
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
