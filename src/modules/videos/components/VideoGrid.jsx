import React from 'react'
import { 
  Video, Play, Eye, Star, Clock, Send, Edit, Camera,
  Zap, Target, Heart, Brain, Activity, Sparkles
} from 'lucide-react'

export default function VideoGrid({ 
  videos, 
  loading, 
  onAssignClick, 
  onUploadClick,
  searchQuery,
  selectedCategory,
  isMobile 
}) {
  const categories = [
    { value: 'motivation', label: 'Motivatie', icon: Zap, color: '#ef4444' },
    { value: 'technique', label: 'Techniek', icon: Target, color: '#3b82f6' },
    { value: 'nutrition', label: 'Voeding', icon: Heart, color: '#10b981' },
    { value: 'mindset', label: 'Mindset', icon: Brain, color: '#8b5cf6' },
    { value: 'recovery', label: 'Herstel', icon: Activity, color: '#06b6d4' },
    { value: 'onboarding', label: 'Onboarding', icon: Sparkles, color: '#f59e0b' }
  ]
  
  const getCategoryConfig = (category) => {
    return categories.find(c => c.value === category) || categories[0]
  }
  
  const getThumbnailUrl = (video) => {
    // ALLEEN custom thumbnail, geen YouTube fallback voor unlisted videos
    if (video.thumbnail_url) {
      return video.thumbnail_url
    }
    // Default placeholder als geen custom thumbnail
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzFhMWExYSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTEyIiBzdHlsZT0iZmlsbDojNjY2O2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE2cHg7Zm9udC1mYW1pbHk6QXJpYWwsc2Fucy1zZXJpZjtkb21pbmFudC1iYXNlbGluZTpjZW50cmFsIj5WaWRlbyBUaHVtYm5haWw8L3RleHQ+PC9zdmc+'
  }
  
  const getEmbedUrl = (video) => {
    const match = video.video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    const youtubeId = match ? match[1] : null
    
    if (youtubeId) {
      // FIX: mute=1 voor autoplay zonder geluid issues
      return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&mute=1&enablejsapi=1`
    }
    return video.video_url
  }
  
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'rgba(255,255,255,0.4)'
      }}>
        Videos laden...
      </div>
    )
  }
  
  if (videos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <Video size={48} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
          {searchQuery || selectedCategory !== 'all' 
            ? 'Geen videos gevonden'
            : 'Nog geen videos toegevoegd'}
        </div>
        <button
          onClick={onUploadClick}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: 0.95,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          Upload je eerste video
        </button>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem'
    }}>
      {videos.map(video => {
        const categoryConfig = getCategoryConfig(video.category)
        const thumbnailUrl = getThumbnailUrl(video)
        const embedUrl = getEmbedUrl(video)
        const Icon = categoryConfig.icon
        
        return (
          <div key={video.id} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease'
          }}>
            {/* Video Thumbnail */}
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              background: '#000',
              overflow: 'hidden'
            }}>
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
              />
              
              {/* Category Badge */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                padding: '0.35rem 0.75rem',
                background: `${categoryConfig.color}dd`,
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backdropFilter: 'blur(10px)'
              }}>
                <Icon size={12} />
                {categoryConfig.label}
              </div>

              {/* Custom Thumbnail Indicator */}
              {video.thumbnail_url && (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  padding: '0.35rem',
                  background: 'rgba(16, 185, 129, 0.9)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={12} color="#fff" />
                </div>
              )}

              {/* Play Overlay */}
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
                transition: 'opacity 0.3s ease',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) e.currentTarget.style.opacity = 1
              }}
              onMouseLeave={(e) => {
                if (!isMobile) e.currentTarget.style.opacity = 0
              }}
              onClick={() => window.open(video.video_url, '_blank')}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.opacity = 1
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  setTimeout(() => {
                    e.currentTarget.style.opacity = 0
                  }, 300)
                }
              }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={24} color="#000" style={{ marginLeft: '4px' }} />
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div style={{ padding: '1rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.5rem',
                lineHeight: 1.3
              }}>
                {video.title}
              </h3>
              
              {video.description && (
                <p style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {video.description}
                </p>
              )}
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.4)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Eye size={14} />
                  {video.view_count || 0} views
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Star size={14} />
                  {video.like_count || 0} likes
                </span>
                {video.duration_seconds && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} />
                    {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => onAssignClick(video)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#10b981',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
                    }
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
                  <Send size={14} />
                  Assign
                </button>
                
                <button
                  onClick={() => window.open(video.video_url, '_blank')}
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <Eye size={16} />
                </button>
                
                <button
                  style={{
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
