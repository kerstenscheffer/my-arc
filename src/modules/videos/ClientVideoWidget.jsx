import useIsMobile from '../../hooks/useIsMobile'
// src/modules/videos/ClientVideoWidget.jsx - IMPROVED VERSION
import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, X, Clock, Star, ChevronRight,
  Zap, Target, Heart, Brain, Activity,
  Coffee, Sun, Moon, Volume2, VolumeX
} from 'lucide-react'
import videoService from './VideoService'

// Singleton pattern
let globalVideoLoadState = {}

// Page color schemes
const PAGE_THEMES = {
  home: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ef4444',
    label: 'Workout Video'
  },
  meals: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#10b981',
    label: 'Nutrition Tip'
  },
  workout: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#f59e0b',
    label: 'Training Focus'
  },
  progress: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#8b5cf6',
    label: 'Mindset Boost'
  }
}

export default function ClientVideoWidget({ client, db, pageContext = 'home' }) {
  const [todaysVideo, setTodaysVideo] = useState(null)
  const [recentVideos, setRecentVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay
  const [showControls, setShowControls] = useState(false)
  
  const playerRef = useRef(null)
  const loadedRef = useRef(false)
  const mountedRef = useRef(true)
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  
  const isMobile = useIsMobile()
  const theme = PAGE_THEMES[pageContext] || PAGE_THEMES.home

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (client?.id && globalVideoLoadState[client.id] === instanceId.current) {
        delete globalVideoLoadState[client.id]
      }
    }
  }, [])

  useEffect(() => {
    if (!client?.id || !db) {
      setLoading(false)
      return
    }
    
    // Check cache
    if (window.__videoWidgetData && window.__videoWidgetData[client.id]) {
      const cachedData = window.__videoWidgetData[client.id]
      const cacheAge = Date.now() - cachedData.loadedAt
      
      if (cacheAge < 30000) {
        setTodaysVideo(cachedData.todaysVideo)
        setRecentVideos(cachedData.recentVideos)
        setLoading(false)
        return
      }
    }
    
    if (globalVideoLoadState[client.id] && globalVideoLoadState[client.id] !== instanceId.current) {
      setLoading(false)
      return
    }
    
    if (loadedRef.current) return
    
    globalVideoLoadState[client.id] = instanceId.current
    loadedRef.current = true
    loadVideos()
    
    return () => {
      loadedRef.current = false
    }
  }, [client?.id, db])

  const loadVideos = async () => {
    if (!mountedRef.current || !db) return
    
    setLoading(true)
    try {
      const homeVideos = await videoService.getVideosForPage(client.id, pageContext, {}, db)
      
      if (!mountedRef.current) return
      
      const todayVideo = await videoService.getTodaysVideo(client.id, pageContext, db)
      
      if (mountedRef.current) {
        setTodaysVideo(todayVideo)
        setRecentVideos(homeVideos.slice(0, 5))
        
        // Cache
        if (!window.__videoWidgetData) {
          window.__videoWidgetData = {}
        }
        window.__videoWidgetData[client.id] = {
          todaysVideo: todayVideo,
          recentVideos: homeVideos.slice(0, 5),
          loadedAt: Date.now()
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handlePlayVideo = async () => {
    if (!todaysVideo) return
    
    setIsPlaying(true)
    
    // Mark as viewed
    await videoService.markVideoWatched(todaysVideo.id, { duration: 0 }, db)
    
    // Try to play
    if (playerRef.current) {
      try {
        await playerRef.current.play()
      } catch (e) {
        // Browser blocks autoplay
        console.log('Autoplay blocked, user interaction required')
        setIsMuted(true) // Ensure muted for retry
      }
    }
  }

  const getCategoryConfig = (category) => {
    const configs = {
      motivation: { icon: Zap, label: 'Motivatie' },
      technique: { icon: Target, label: 'Techniek' },
      nutrition: { icon: Heart, label: 'Voeding' },
      mindset: { icon: Brain, label: 'Mindset' },
      recovery: { icon: Activity, label: 'Herstel' }
    }
    return configs[category] || configs.motivation
  }

  const extractYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  if (loading) {
    return (
      <div style={{
        background: `${theme.gradient}`,
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.5rem',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          Videos laden...
        </div>
      </div>
    )
  }

  if (todaysVideo) {
    const video = todaysVideo.video
    const categoryConfig = getCategoryConfig(video.category)
    const videoId = extractYouTubeId(video.video_url)
    
    return (
      <div style={{
        background: theme.gradient,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Header Section */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          paddingBottom: '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Zap size={16} color="rgba(255,255,255,0.9)" />
              <span style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: '600'
              }}>
                {theme.label}
              </span>
            </div>
            <div style={{
              padding: '0.3rem 0.6rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              {React.createElement(categoryConfig.icon, { size: 12 })}
              {categoryConfig.label}
            </div>
          </div>

          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.5rem',
            lineHeight: 1.2
          }}>
            {video.title}
          </h3>
          
          {video.description && (
            <p style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.4,
              marginBottom: '1rem'
            }}>
              {video.description}
            </p>
          )}
        </div>

        {/* Video Player Section - INLINE, NO POPUP */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: isPlaying ? '0' : '56.25%',
          background: '#000',
          cursor: isPlaying ? 'default' : 'pointer'
        }}
        onClick={() => !isPlaying && handlePlayVideo()}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        >
          {!isPlaying && videoId ? (
            <>
              {/* Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={video.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
              
              {/* Play Button Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s ease',
                  transform: 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
                >
                  <Play size={28} color="#000" style={{ marginLeft: '5px' }} />
                </div>
              </div>
            </>
          ) : isPlaying && videoId ? (
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%'
            }}>
              <iframe
                ref={playerRef}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
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
              
              {/* Custom Controls Overlay */}
              {showControls && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1rem',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMuted(!isMuted)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsPlaying(false)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={20} color="#fff" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Recent Videos Bar */}
        {recentVideos.length > 1 && !isPlaying && (
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Meer videos →
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {recentVideos.slice(1, 5).map((v, i) => {
                const vid = extractYouTubeId(v.video.video_url)
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setTodaysVideo(v)
                      setIsPlaying(false)
                    }}
                    style={{
                      minWidth: '120px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      aspectRatio: '16/9',
                      background: '#000'
                    }}
                  >
                    {vid && (
                      <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt={v.video.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '0.25rem 0.5rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      fontSize: '0.65rem',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {v.video.title}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // No videos
  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.color}20 0%, ${theme.color}10 100%)`,
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      border: `2px solid ${theme.color}30`,
      textAlign: 'center'
    }}>
      <Play size={48} style={{ color: theme.color, opacity: 0.3, margin: '0 auto 1rem' }} />
      <h3 style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        Nog geen videos beschikbaar
      </h3>
      <p style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        Je coach zal binnenkort inspirerende videos met je delen!
      </p>
    </div>
  )
}

// Add styles
if (typeof document !== 'undefined' && !document.getElementById('improved-video-styles')) {
  const style = document.createElement('style')
  style.id = 'improved-video-styles'
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Hide scrollbar for recent videos */
    .recent-videos::-webkit-scrollbar {
      display: none;
    }
  `
  document.head.appendChild(style)
}
