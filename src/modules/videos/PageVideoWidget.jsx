import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, X, ChevronRight, Sparkles, Grid, Eye, Phone, Trophy
} from 'lucide-react'
import videoService from '../../modules/videos/VideoService'  // Import VideoService

// Cache
let globalVideoCache = {}

// Page color schemes - UITGEBREID MET CALLS EN CHALLENGES
const PAGE_THEMES = {
  home: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryDarkest: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    shadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    label: 'Video van de Dag',
    icon: Sparkles
  },
  workout: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderActive: 'rgba(249, 115, 22, 0.2)',
    shadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
    label: 'Training Focus',
    icon: Sparkles
  },
  meals: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    shadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    label: 'Nutrition Tip',
    icon: Sparkles
  },
  calls: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    shadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    label: 'Call Preparation',
    icon: Phone
  },
  challenges: {
    primary: '#dc2626',
    primaryDark: '#991b1b',
    primaryLight: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    borderColor: 'rgba(220, 38, 38, 0.1)',
    borderActive: 'rgba(220, 38, 38, 0.2)',
    shadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
    label: 'Challenge Boost',
    icon: Trophy
  }
}

export default function PageVideoWidget({ 
  client, 
  db,  // Optioneel - kan verwijderd worden als niet elders gebruikt
  pageContext = 'home',
  contextData = {}
}) {
  const [todaysVideo, setTodaysVideo] = useState(null)
  const [recentVideos, setRecentVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAllVideos, setShowAllVideos] = useState(false)
  
  const loadedRef = useRef(false)
  const mountedRef = useRef(true)
  
  const isMobile = useIsMobile()
  const theme = PAGE_THEMES[pageContext] || PAGE_THEMES.home
  const ThemeIcon = theme.icon
  const cacheKey = `${client?.id}-${pageContext}`

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!client?.id) {
      setLoading(false)
      return
    }
    
    // Check cache
    if (globalVideoCache[cacheKey]) {
      const cachedData = globalVideoCache[cacheKey]
      const cacheAge = Date.now() - cachedData.timestamp
      
      if (cacheAge < 60000) {
        setTodaysVideo(cachedData.todaysVideo)
        setRecentVideos(cachedData.recentVideos)
        setLoading(false)
        return
      }
    }
    
    if (loadedRef.current) return
    loadedRef.current = true
    loadVideos()
    
    return () => {
      loadedRef.current = false
    }
  }, [client?.id, pageContext])

  const loadVideos = async () => {
    if (!mountedRef.current) return
    
    setLoading(true)
    try {
      // FIXED: Gebruik videoService.getVideosForPage
      const videos = await videoService.getVideosForPage(
        client.id, 
        pageContext
      )
      
      if (!mountedRef.current) return
      
      const featured = videos && videos.length > 0 ? videos[0] : null
      
      if (mountedRef.current) {
        setTodaysVideo(featured)
        setRecentVideos(videos)
        
        globalVideoCache[cacheKey] = {
          todaysVideo: featured,
          recentVideos: videos,
          timestamp: Date.now()
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

  const handlePlayVideo = async (video) => {
    setTodaysVideo(video)
    setIsPlaying(true)
    
    if (video.id) {
      try {
        // FIXED: Gebruik videoService.markVideoAsViewed
        await videoService.markVideoAsViewed(video.id)
      } catch (e) {
        console.log('Could not mark video as watched')
      }
    }
  }

  const extractYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // Get best thumbnail URL (custom -> YouTube -> fallback)
  const getBestThumbnailUrl = (video) => {
    // Check for custom thumbnail first
    if (video.thumbnail_url) {
      return video.thumbnail_url
    }
    
    // Fallback to YouTube thumbnail
    const videoUrl = video.video_url || video.url
    const youtubeId = extractYouTubeId(videoUrl)
    
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    }
    
    // Final fallback - placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='
  }

  // Loading
  if (loading) {
    return null
  }

  // No videos
  if (!todaysVideo) {
    return null
  }

  const video = todaysVideo.video || todaysVideo
  const videoId = extractYouTubeId(video.video_url || video.url)
  const thumbnailUrl = getBestThumbnailUrl(video)
  
  return (
    <>
      <div style={{
        marginBottom: '1rem',
        position: 'relative'
      }}>
        {/* Compact Info Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px',
          padding: isMobile ? '0.75rem' : '1rem',
          marginBottom: '0.75rem',
          border: `1px solid ${theme.borderColor}`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.35rem'
              }}>
                <ThemeIcon size={14} color={theme.primary} />
                <span style={{
                  fontSize: '0.75rem',
                  color: theme.primary,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {theme.label}
                </span>
              </div>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '0.25rem'
              }}>
                {video.title}
              </h3>
              {video.description && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {video.description}
                </p>
              )}
            </div>

            {/* More Videos Button */}
            {recentVideos.length > 1 && (
              <button
                onClick={() => setShowAllVideos(true)}
                style={{
                  background: theme.gradient,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '36px',
                  transition: 'all 0.2s ease',
                  opacity: 0.9,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) e.currentTarget.style.opacity = '0.9'
                }}
              >
                <Grid size={16} color="#fff" />
              </button>
            )}
          </div>

          {/* Quick Stats */}
          {todaysVideo.status === 'viewed' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: `1px solid ${theme.borderColor}`
            }}>
              <Eye size={12} color={theme.primary} />
              <span style={{
                fontSize: '0.7rem',
                color: theme.primary,
                fontWeight: '500'
              }}>
                Bekeken
              </span>
            </div>
          )}
        </div>

        {/* Video Player */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: isPlaying ? '0' : '56.25%',
          background: '#000',
          borderRadius: '14px',
          overflow: 'hidden',
          cursor: isPlaying ? 'default' : 'pointer',
          boxShadow: theme.shadow
        }}
        onClick={() => !isPlaying && handlePlayVideo(todaysVideo)}
        >
          {!isPlaying ? (
            <>
              <img
                src={thumbnailUrl}
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
                  // Fallback naar YouTube thumbnail
                  if (videoId && e.target.src !== `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`) {
                    e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                  }
                }}
              />
              
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) e.currentTarget.style.transform = 'scale(1)'
                }}
                >
                  <Play size={24} color="#000" style={{ marginLeft: '3px' }} />
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
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&showinfo=0`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '14px',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPlaying(false)
                }}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* All Videos Modal */}
      {showAllVideos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '1rem' : '2rem'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ThemeIcon size={20} color={theme.primary} />
              Alle Videos
            </h2>
            <button
              onClick={() => setShowAllVideos(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={18} color="#fff" />
            </button>
          </div>

          {/* Videos Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {recentVideos.map((v, i) => {
              const rvideo = v.video || v
              const rvid = extractYouTubeId(rvideo.video_url || rvideo.url)
              const rThumbnailUrl = getBestThumbnailUrl(rvideo)
              const isActive = todaysVideo?.id === v.id
              
              return (
                <div
                  key={i}
                  onClick={() => {
                    handlePlayVideo(v)
                    setShowAllVideos(false)
                  }}
                  style={{
                    background: isActive ? theme.gradient : 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? theme.borderActive : theme.borderColor}`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile && !isActive) {
                      e.currentTarget.style.borderColor = theme.borderActive
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile && !isActive) {
                      e.currentTarget.style.borderColor = theme.borderColor
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    background: '#000'
                  }}>
                    <img
                      src={rThumbnailUrl}
                      alt={rvideo.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback naar YouTube thumbnail
                        if (rvid && e.target.src !== `https://img.youtube.com/vi/${rvid}/mqdefault.jpg`) {
                          e.target.src = `https://img.youtube.com/vi/${rvid}/mqdefault.jpg`
                        }
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                      <Play size={32} color="#fff" />
                    </div>

                    {v.status === 'viewed' && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Eye size={12} color="#fff" />
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#fff',
                          fontWeight: '500'
                        }}>
                          Bekeken
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{
                    padding: '0.75rem'
                  }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.9)',
                      marginBottom: '0.25rem',
                      lineHeight: 1.2
                    }}>
                      {rvideo.title}
                    </h4>
                    {rvideo.description && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {rvideo.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
