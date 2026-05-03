// src/modules/videos/VideoPlayerModal.jsx
// Fullscreen portal modal — YouTube player + description + rating

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Star } from 'lucide-react'
import clientVideoService from './ClientVideoService'
import { extractYouTubeId, getYouTubeEmbedUrl } from './utils/youtubeHelpers'

export default function VideoPlayerModal({ item, onClose }) {
  const [rating, setRating] = useState(item?.client_rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const openTimeRef = useRef(Date.now())
  const markedRef = useRef(false)
  const isMobile = window.innerWidth <= 768

  const video = item?.video
  const videoId = extractYouTubeId(video?.video_url)
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId, { autoplay: true, mute: false }) : null

  // Mark viewed on open (once)
  useEffect(() => {
    if (!item?.id || markedRef.current) return
    markedRef.current = true
    clientVideoService.markVideoWatched(item.id, { completed: false })
  }, [item?.id])

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  const handleRate = async (stars) => {
    setRating(stars)
    if (item?.id) await clientVideoService.rateVideo(item.id, stars)
  }

  const handleClose = async () => {
    if (item?.id) {
      const watchedSeconds = Math.round((Date.now() - openTimeRef.current) / 1000)
      await clientVideoService.markVideoWatched(item.id, {
        completed: true,
        duration: watchedSeconds,
      })
    }
    onClose()
  }

  if (!video) return null

  return createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: isMobile ? '100%' : '720px',
          maxHeight: isMobile ? '100%' : '90vh',
          height: isMobile ? '100%' : 'auto',
          borderRadius: isMobile ? '0' : '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.4rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.15rem',
            }}>
              Nu bekijken
            </div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {video.title}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* PLAYER */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          background: '#000',
          flexShrink: 0,
        }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              Video niet beschikbaar
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {video.description && (
            <div style={{
              padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                fontSize: '0.4rem',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.35rem',
              }}>
                Beschrijving
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {video.description}
              </div>
            </div>
          )}

          {/* Rating */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.25rem',
          }}>
            <div style={{
              fontSize: '0.4rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
            }}>
              Waardeer deze video
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map(stars => {
                const active = stars <= (hoverRating || rating)
                return (
                  <button
                    key={stars}
                    onClick={() => handleRate(stars)}
                    onMouseEnter={() => setHoverRating(stars)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Star
                      size={24}
                      color={active ? '#10b981' : 'rgba(255,255,255,0.15)'}
                      fill={active ? '#10b981' : 'none'}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
