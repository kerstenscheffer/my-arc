// src/modules/videos/video-tab-components/VideoCard.jsx
// v2.0 — Compact, brand styling, props ongewijzigd
import React from 'react'
import { Play, Eye, Send, Users, Trash2, Edit, Globe } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

const GOLD = '#FFD700'

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
  const isDefault = video.default_pages && video.default_pages.length > 0

  const iconBtnStyle = (color = 'rgba(255,255,255,0.5)') => ({
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.15s ease',
    flexShrink: 0
  })

  return (
    <div style={{
      background: '#0a0a0a',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderLeft: isDefault ? `2px solid ${GOLD}` : '1px solid rgba(255, 255, 255, 0.06)',
      transform: 'translateZ(0)',
      transition: 'border-color 0.15s ease'
    }}>
      {/* THUMBNAIL — 16:9 */}
      <div style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        background: '#000',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
        onClick={() => window.open(video.video_url, '_blank')}
      >
        <img
          src={thumbnailUrl}
          alt={video.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            const youtubeId = videoService.extractYouTubeId(video.video_url)
            if (youtubeId && !e.target.src.includes('hqdefault')) {
              e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            }
          }}
        />

        {/* Standaard badge (goud, linksboven) */}
        {isDefault && (
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            left: '0.4rem',
            padding: '0.2rem 0.45rem',
            background: GOLD,
            borderRadius: '3px',
            fontSize: '0.55rem',
            fontWeight: '800',
            color: '#000',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            zIndex: 2
          }}>
            <Globe size={9} strokeWidth={3} />
            {video.default_pages.length}× standaard
          </div>
        )}

        {/* Categorie pill (rechtsboven) */}
        {categoryConfig && (
          <div style={{
            position: 'absolute',
            top: '0.4rem',
            right: '0.4rem',
            padding: '0.2rem 0.45rem',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '3px',
            fontSize: '0.55rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            zIndex: 2
          }}>
            {categoryConfig.label}
          </div>
        )}

        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>
      </div>

      {/* INFO */}
      <div style={{
        padding: '0.625rem 0.75rem 0.5rem'
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0,
          marginBottom: '0.2rem',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.1rem'
        }}>
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: 0,
            marginBottom: '0.45rem',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {video.description}
          </p>
        )}

        {/* Stats inline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '0.5rem',
          fontSize: '0.6rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.3)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Eye size={10} />
            {video.view_count || 0}
          </span>
        </div>
      </div>

      {/* ACTIONS — flush row, no top padding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.5rem 0.75rem 0.625rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        {/* Toewijzen — primary, neemt rest van breedte */}
        <button
          onClick={onAssign}
          style={{
            flex: 1,
            padding: '0.45rem 0.5rem',
            background: GOLD,
            border: 'none',
            borderRadius: '6px',
            color: '#000',
            fontSize: '0.6rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '32px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          <Send size={11} />
          Toewijzen
        </button>

        {/* Beheer (clients) */}
        <button onClick={onManage} title="Beheer toewijzingen" style={iconBtnStyle()}>
          <Users size={13} />
        </button>

        {/* Bewerken */}
        <button onClick={onEdit} title="Bewerk video" style={iconBtnStyle()}>
          <Edit size={13} />
        </button>

        {/* Verwijderen */}
        <button onClick={onDelete} title="Verwijder" style={{
          ...iconBtnStyle('#ef4444'),
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.15)'
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
