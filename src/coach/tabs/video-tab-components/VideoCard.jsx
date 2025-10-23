// src/modules/videos/video-tab-components/VideoCard.jsx
import React from 'react'
import { Play, Eye, Camera, Globe, Send, Users, Trash2, Edit } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

export default function VideoCard({ 
  video, 
  categoryConfig,
  onAssign,
  onManage,
  onDelete,
  onEdit
}) {
  const isMobile = useIsMobile()
  const thumbnailUrl = videoService.getThumbnailUrl(video)
  const Icon = categoryConfig.icon
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: video.default_pages && video.default_pages.length > 0
        ? '1px solid rgba(16, 185, 129, 0.3)'
        : '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Default Badge */}
      {video.default_pages && video.default_pages.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
          padding: isMobile ? '0.35rem 0.6rem' : '0.4rem 0.75rem',
          borderBottomLeftRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          zIndex: 3,
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
        }}>
          <Globe size={isMobile ? 11 : 12} color="#fff" />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {video.default_pages.length}x Standaard
          </span>
        </div>
      )}

      {/* Thumbnail */}
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
          onError={(e) => {
            const youtubeId = videoService.extractYouTubeId(video.video_url)
            if (youtubeId && e.target.src !== `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`) {
              e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            }
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
          backdropFilter: 'blur(10px)',
          zIndex: 2
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
            justifyContent: 'center',
            zIndex: 2
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
          zIndex: 2
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        onClick={() => window.open(video.video_url, '_blank')}
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
            {video.view_count || 0}
          </span>
          {video.default_pages && video.default_pages.length > 0 && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              <Globe size={14} />
              {video.default_pages.length} pagina{video.default_pages.length !== 1 ? "'s" : ''}
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {/* Edit/Default Pages Button */}
          <button
            onClick={onEdit}
            style={{
              padding: '0.6rem',
              background: video.default_pages && video.default_pages.length > 0
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
                : 'rgba(255,255,255,0.03)',
              border: video.default_pages && video.default_pages.length > 0
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: video.default_pages && video.default_pages.length > 0
                ? '#10b981'
                : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              flex: 1
            }}
          >
            <Edit size={14} />
            Standaard
          </button>

          {!(video.default_pages && video.default_pages.length > 0) && (
            <button
              onClick={onAssign}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
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
            >
              <Send size={14} />
              Assign
            </button>
          )}

          <button
            onClick={onManage}
            style={{
              padding: '0.6rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              minHeight: '44px'
            }}
          >
            <Users size={14} />
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
              minHeight: '44px'
            }}
          >
            <Eye size={16} />
          </button>
          
          <button
            onClick={onDelete}
            style={{
              padding: '0.6rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
