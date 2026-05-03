// src/modules/videos/PageVideoWidget.jsx
// 🎯 v3.1 - Netflix-style + fullscreen modal + shorts 9:16
// FIX: onWatched reload verwijderd (veroorzaakte infinite open/close loop)

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Play, X, Video, CheckCircle2 } from 'lucide-react'
import videoService from './VideoService'

const GREEN = '#10b981'

const extractYouTubeId = (url) => {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
    /m\.youtube\.com\/shorts\/([^&\n?#]+)/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m && m[1]) return m[1]
  }
  return null
}

const isYouTubeShort = (url) => {
  if (!url) return false
  return /youtube\.com\/shorts\//.test(url) || /m\.youtube\.com\/shorts\//.test(url)
}

export default function PageVideoWidget({ client, db, pageContext = 'home' }) {
  const [videos, setVideos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [playingItem, setPlayingItem] = useState(null)
  // Track locally which items are marked viewed (om UI bij te werken ZONDER reload)
  const [viewedIds, setViewedIds] = useState(new Set())

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (client?.id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id, pageContext])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pageVideos, coachCategories] = await Promise.all([
        videoService.getVideosForPage(client.id, pageContext, {}, db),
        client.trainer_id
          ? videoService.getCategories(client.trainer_id)
          : Promise.resolve([])
      ])

      setVideos(pageVideos || [])
      setCategories(coachCategories || [])
    } catch (e) {
      console.error('Error loading page videos:', e)
      setVideos([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Group videos by category_id
  const grouped = {}
  const uncategorized = []

  videos.forEach(item => {
    const catId = item?.video?.category_id
    const found = catId ? categories.find(c => c.id === catId) : null

    if (catId && found) {
      if (!grouped[catId]) grouped[catId] = []
      grouped[catId].push(item)
    } else {
      uncategorized.push(item)
    }
  })

  const orderedCategories = categories
    .filter(cat => grouped[cat.id] && grouped[cat.id].length > 0)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const hasContent = videos.length > 0

  const handleClose = () => {
    setIsOpen(false)
    setPlayingItem(null)
  }

  // FIX: alleen locally markeren als viewed (geen reload die loop veroorzaakt)
  const handleVideoWatched = (itemId) => {
    setViewedIds(prev => new Set([...prev, itemId]))
  }

  if (loading || !hasContent) return null

  return (
    <>
      {/* FLOATING BADGE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '160px',
            right: 0,
            zIndex: 997,
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            background: 'rgba(10, 10, 10, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: 'none',
            borderRadius: '10px 0 0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Video size={16} color="rgba(255, 255, 255, 0.5)" />
          <span style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            background: GREEN,
            color: '#000',
            fontSize: '0.55rem',
            fontWeight: '800',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {videos.length}
          </span>
        </button>
      )}

      {/* MOBILE BACKDROP — onder sidebar, boven alles anders */}
      {isMobile && isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 199
          }}
        />
      )}

      {/* SIDEBAR — boven header (header is z-index 100) */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? '0' : '-100%',
        width: isMobile ? '85%' : '380px',
        maxWidth: '380px',
        height: '100vh',
        background: '#0a0a0a',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        transform: 'translateZ(0)'
      }}>
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <div style={{
              fontSize: '0.5rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.15rem'
            }}>
              Coach Video's
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              {videos.length} video{videos.length !== 1 ? "'s" : ''}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div
          className="pvw-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {orderedCategories.map(cat => (
            <CategoryRow
              key={cat.id}
              title={cat.name}
              color={cat.color || GREEN}
              items={grouped[cat.id]}
              viewedIds={viewedIds}
              onSelect={setPlayingItem}
              isMobile={isMobile}
            />
          ))}

          {uncategorized.length > 0 && (
            <CategoryRow
              title="Overige video's"
              color="rgba(255, 255, 255, 0.3)"
              items={uncategorized}
              viewedIds={viewedIds}
              onSelect={setPlayingItem}
              isMobile={isMobile}
              isUncategorized
            />
          )}

          <div style={{ height: '1.5rem' }} />
        </div>
      </div>

      {/* FULLSCREEN PLAYER */}
      {playingItem && (
        <FullscreenPlayer
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          onWatched={handleVideoWatched}
        />
      )}

      <style>{`.pvw-body::-webkit-scrollbar { display: none; }`}</style>
    </>
  )
}

// ============================================
// CATEGORY ROW
// ============================================
function CategoryRow({ title, color, items, viewedIds, onSelect, isMobile, isUncategorized }) {
  return (
    <div style={{
      padding: isMobile ? '0.75rem 0' : '0.875rem 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      <div style={{
        padding: isMobile ? '0 1rem 0.5rem' : '0 1.125rem 0.625rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '3px',
          height: '12px',
          background: color,
          borderRadius: '2px',
          opacity: isUncategorized ? 0.5 : 1
        }} />
        <div style={{
          fontSize: isMobile ? '0.62rem' : '0.68rem',
          fontWeight: '800',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '0.55rem',
          color: 'rgba(255, 255, 255, 0.25)',
          fontWeight: '700'
        }}>
          · {items.length}
        </div>
      </div>

      <div
        className="pvw-row"
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: isMobile ? '0 1rem' : '0 1.125rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}
      >
        {items.map((item, idx) => (
          <VideoCard
            key={item.id || idx}
            item={item}
            isLocallyViewed={viewedIds.has(item.id)}
            onClick={() => onSelect(item)}
            isMobile={isMobile}
          />
        ))}
      </div>

      <style>{`.pvw-row::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

// ============================================
// VIDEO CARD
// ============================================
function VideoCard({ item, isLocallyViewed, onClick, isMobile }) {
  const video = item.video
  if (!video) return null

  const videoId = extractYouTubeId(video.video_url)
  const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)
  const isWatched = isLocallyViewed || item.status === 'completed' || !!item.viewed_at
  const isShort = isYouTubeShort(video.video_url)

  const cardWidth = isMobile ? '160px' : '180px'

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: cardWidth,
        background: '#111',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transform: 'translateZ(0)'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: '#000',
        overflow: 'hidden'
      }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              if (videoId) {
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
              }
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.15)'
          }}>
            <Video size={22} />
          </div>
        )}

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {isWatched && (
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            right: '0.3rem',
            background: GREEN,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={11} color="#000" strokeWidth={3} />
          </div>
        )}

        {isShort && (
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            left: '0.3rem',
            padding: '0.15rem 0.35rem',
            background: 'rgba(0, 0, 0, 0.75)',
            borderRadius: '3px',
            fontSize: '0.5rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Short
          </div>
        )}
      </div>

      <div style={{
        padding: isMobile ? '0.4rem 0.5rem 0.5rem' : '0.5rem 0.6rem 0.625rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: '#fff',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '0.2rem',
          minHeight: '1.8rem'
        }}>
          {video.title}
        </div>
        {video.description && (
          <div style={{
            fontSize: '0.6rem',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {video.description}
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================
// FULLSCREEN PLAYER
// FIX: onWatched callback fires maar triggert GEEN reload meer in parent
// ============================================
function FullscreenPlayer({ item, onClose, onWatched }) {
  const markedRef = useRef(false)
  const isMobile = window.innerWidth <= 768

  const video = item?.video
  const videoId = extractYouTubeId(video?.video_url)
  const isShort = isYouTubeShort(video?.video_url)

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  // Mark viewed once on open
  useEffect(() => {
    if (!item?.assignment_id || markedRef.current) return
    markedRef.current = true
    videoService.markAsViewed(item.assignment_id)
      .then((result) => {
        if (result?.success && onWatched) {
          // Alleen local state updaten — GEEN reload van alle videos
          onWatched(item.id)
        }
      })
      .catch(e => console.error('markAsViewed failed:', e))
  }, [item?.assignment_id, item?.id, onWatched])

  // Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!video) return null

  const playerStyle = isShort
    ? {
        height: isMobile ? '85vh' : '85vh',
        aspectRatio: '9 / 16',
        maxWidth: '100%'
      }
    : {
        width: '100%',
        maxWidth: '1000px',
        aspectRatio: '16 / 9'
      }

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1`
    : null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: isMobile ? '0.75rem' : '1.5rem',
          right: isMobile ? '0.75rem' : '1.5rem',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10002,
          transition: 'background 0.15s ease'
        }}
      >
        <X size={22} />
      </button>

      {!isMobile && !isShort && (
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          right: '5rem',
          zIndex: 10001
        }}>
          <div style={{
            fontSize: '0.45rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.25rem'
          }}>
            Nu bekijken
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em'
          }}>
            {video.title}
          </div>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...playerStyle,
          background: '#000',
          borderRadius: isMobile ? '8px' : '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            Video niet beschikbaar
          </div>
        )}
      </div>

      {isMobile && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '500px',
            marginTop: '1rem',
            padding: '0 0.25rem'
          }}
        >
          <div style={{
            fontSize: '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '0.3rem'
          }}>
            {video.title}
          </div>
          {video.description && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5
            }}>
              {video.description}
            </div>
          )}
        </div>
      )}

      {!isMobile && isShort && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '400px',
            marginTop: '1rem',
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '1rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '0.3rem'
          }}>
            {video.title}
          </div>
          {video.description && (
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5
            }}>
              {video.description}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
