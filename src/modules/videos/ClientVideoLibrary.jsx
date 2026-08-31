// src/modules/videos/ClientVideoLibrary.jsx
// Netflix-style category rows — each category has its own horizontal scrollable row

import React, { useState, useEffect } from 'react'
import { Play, CheckCircle2, Video } from 'lucide-react'
import clientVideoService from './ClientVideoService'
import VideoPlayerModal from './VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail, formatDuration, getBronMeta } from './utils/youtubeHelpers'

const CATEGORY_META = {
  education:  { label: 'Uitleg',     color: '#10b981' },
  technique:  { label: 'Techniek',   color: '#3b82f6' },
  nutrition:  { label: 'Voeding',    color: '#f59e0b' },
  motivation: { label: 'Motivatie',  color: '#ec4899' },
  mindset:    { label: 'Mindset',    color: '#8b5cf6' },
  recovery:   { label: 'Herstel',    color: '#06b6d4' },
  challenge:  { label: 'Challenge',  color: '#dc2626' },
  other:      { label: 'Overig',     color: 'rgba(255,255,255,0.3)' },
}

export default function ClientVideoLibrary({ client, db, pageContext = null }) {
  const [library, setLibrary] = useState({ videos: [], grouped: {}, categories: [], stats: { total: 0, watched: 0 } })
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (!client?.id) { setLoading(false); return }
    loadLibrary()
  }, [client?.id, pageContext])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const data = await clientVideoService.getClientVideoLibrary(client.id, { pageContext })
      setLibrary(data)
    } catch (e) {
      console.error('❌ Error loading library:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedItem(null)
    loadLibrary() // refresh watched state
  }

  // LOADING
  if (loading) {
    return (
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.25)',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        Videos laden...
      </div>
    )
  }

  // EMPTY
  if (library.videos.length === 0) {
    return (
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        textAlign: 'center',
        transform: 'translateZ(0)',
      }}>
        <Video size={28} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 0.625rem' }} />
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>
          Nog geen video's
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
          Je coach stuurt binnenkort uitleg video's.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: isMobile ? '0.4rem' : '0.45rem',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.2rem',
          }}>
            Uitleg Video's
          </div>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            Jouw bibliotheek
          </div>
        </div>

        {/* Stats pill */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.2rem',
          padding: '0.3rem 0.5rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '6px',
        }}>
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '800', color: '#10b981' }}>
            {library.stats.watched}
          </span>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
            /{library.stats.total}
          </span>
        </div>
      </div>

      {/* CATEGORY ROWS */}
      {library.categories.map((catKey, idx) => {
        const items = library.grouped[catKey] || []
        const meta = CATEGORY_META[catKey] || CATEGORY_META.other
        const isLast = idx === library.categories.length - 1

        return (
          <div key={catKey} style={{
            padding: isMobile ? '0.75rem 0' : '0.875rem 0',
            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}>
            {/* Category header */}
            <div style={{
              padding: isMobile ? '0 0.875rem 0.5rem' : '0 1.25rem 0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{
                width: '3px',
                height: '12px',
                background: meta.color,
                borderRadius: '2px',
              }} />
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: '800',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {meta.label}
              </div>
              <div style={{
                fontSize: '0.55rem',
                color: 'rgba(255,255,255,0.25)',
                fontWeight: '700',
              }}>
                · {items.length}
              </div>
            </div>

            {/* Horizontal scroll */}
            <div
              className="cvl-scroll-row"
              style={{
                display: 'flex',
                gap: isMobile ? '0.5rem' : '0.625rem',
                padding: isMobile ? '0 0.875rem' : '0 1.25rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              {items.map(item => (
                <VideoCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* MODAL */}
      {selectedItem && (
        <VideoPlayerModal item={selectedItem} onClose={handleClose} />
      )}

      <style>{`.cvl-scroll-row::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

// =====================================================
// VIDEO CARD
// =====================================================
function VideoCard({ item, onClick, isMobile }) {
  const video = item.video
  const videoId = extractYouTubeId(video.video_url)
  const thumbnail = video.thumbnail_url || (videoId ? getYouTubeThumbnail(videoId, 'hqdefault') : null)
  const isWatched = item.status === 'completed' || !!item.viewed_at
  // Merkje bij bronnen die buiten de app openen, zodat de klant weet dat 'ie
  // naar Instagram of TikTok gestuurd wordt voordat 'ie tikt.
  const bron = getBronMeta(video.video_url)
  const toonBron = bron && bron.label !== 'YouTube' && bron.label !== 'Link'
  const duration = formatDuration(video.duration_seconds)
  const cardWidth = isMobile ? '150px' : '180px'

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: cardWidth,
        background: '#111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        transform: 'translateZ(0)',
      }}
    >
      {/* Thumbnail 16:9 */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        background: '#000',
      }}>
        {toonBron && (
          <div style={{
            position: 'absolute', right: 5, top: 5, zIndex: 3,
            padding: '0.12rem 0.35rem', borderRadius: 5,
            background: 'rgba(0,0,0,0.72)',
            border: `1px solid ${bron.kleur}`,
            color: bron.kleur,
            fontSize: '0.6rem', fontWeight: 900,
          }}>
            {bron.label}
          </div>
        )}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              if (videoId) e.currentTarget.src = getYouTubeThumbnail(videoId, 'mqdefault')
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.15)',
          }}>
            <Video size={22} />
          </div>
        )}

        {/* Dim overlay + play */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Watched badge */}
        {isWatched && (
          <div style={{
            position: 'absolute',
            top: '0.3rem',
            right: '0.3rem',
            background: '#10b981',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle2 size={10} color="#000" strokeWidth={3} />
          </div>
        )}

        {/* Duration */}
        {duration && (
          <div style={{
            position: 'absolute',
            bottom: '0.3rem',
            right: '0.3rem',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '3px',
            padding: '0.1rem 0.3rem',
            fontSize: '0.55rem',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '0.02em',
          }}>
            {duration}
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{
        padding: isMobile ? '0.4rem 0.5rem 0.5rem' : '0.5rem 0.625rem 0.625rem',
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
        }}>
          {video.title}
        </div>
      </div>
    </button>
  )
}
