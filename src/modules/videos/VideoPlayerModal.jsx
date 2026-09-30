// src/modules/videos/VideoPlayerModal.jsx
// Fullscreen portal modal — YouTube player + description + rating

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import { X, Star, Play, ExternalLink, ListVideo } from 'lucide-react'
import clientVideoService from './ClientVideoService'
import { extractYouTubeId, getYouTubeEmbedUrl, getZoomEmbedUrl, getInstagramEmbedUrl, getBronMeta } from './utils/youtubeHelpers'

// mm:ss uit een aantal seconden. Boven het uur telt YouTube zelf ook in
// h:mm:ss, maar zo lang is geen van deze video's.
const tijdLabel = (sec) => {
  const n = Math.max(0, Math.floor(Number(sec) || 0))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

export default function VideoPlayerModal({ item, onClose }) {
  const modalHost = useModalHost()
  const [rating, setRating] = useState(item?.client_rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  // Vanaf welke seconde de speler moet starten. Tikken op een hoofdstuk zet dit
  // en laadt het frame opnieuw; de key eronder dwingt dat af, want alleen de
  // src veranderen herlaadt een iframe niet altijd.
  const [startSec, setStartSec] = useState(0)
  const openTimeRef = useRef(Date.now())
  const markedRef = useRef(false)
  const isMobile = window.innerWidth <= 768

  const video = item?.video
  // Vorm: { waarom, hoofdstukken: [{ tijd (seconden), titel, uitleg? }] }.
  // Kan ontbreken of oude rommel bevatten; alles hieronder gaat uit van niets.
  const inhoud = (video?.video_inhoud && typeof video.video_inhoud === 'object')
    ? video.video_inhoud
    : null
  const videoId = extractYouTubeId(video?.video_url)
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId, { autoplay: true, mute: false, start: startSec }) : null
  // Zoom Clips embedden via /clips/embed/ (wél embedbaar).
  const zoomEmbed = getZoomEmbedUrl(video?.video_url)
  // Instagram Reels: /embed/ is wél in te sluiten (geen x-frame-options,
  // geen frame-ancestors). Alleen bij openbare accounts — is het bericht
  // privé, dan toont de embed een lege kaart en helpt de knop eronder.
  const igEmbed = getInstagramEmbedUrl(video?.video_url)
  const playerEmbed = embedUrl || zoomEmbed || igEmbed
  // Overige niet-embedbare links → extern openen.
  const externalUrl = (!playerEmbed && video?.video_url) ? video.video_url : null
  // Welke dienst het is, zodat de knop 'Openen in Instagram' kan zeggen in
  // plaats van het nietszeggende 'Open video'.
  const bron = externalUrl ? getBronMeta(externalUrl) : null
  const isZoom = !!externalUrl && /zoom\.us/i.test(externalUrl)

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
        // Boven alles. De speler wordt geopend vanuit lagen die zelf al hoog
        // zitten — de bibliotheek staat op 2147483000 en de bladen op
        // 2147483100 — en op 9999 speelde de video eronder verder terwijl je
        // hem niet zag.
        zIndex: 2147483200,
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
        {/* Instagram-embeds zijn staand; in het 16:9-kader zou de reel een
            postzegel worden met zwarte balken. Vandaar een hogere verhouding
            en een maximum zodat 'ie op desktop niet het scherm uit groeit. */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: igEmbed ? 460 : '100%',
          margin: igEmbed ? '0 auto' : undefined,
          paddingBottom: igEmbed ? '128%' : '56.25%',
          background: '#000',
          flexShrink: 0,
        }}>
          {playerEmbed ? (
            <iframe
              key={startSec}
              referrerPolicy="strict-origin-when-cross-origin"
              src={playerEmbed}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              // Instagram's embed-pagina is iets hoger dan het kader en zet
              // anders een scrollbalk in het frame.
              scrolling={igEmbed ? 'no' : undefined}
              title={video?.title || 'Video'}
            />
          ) : externalUrl ? (
            <div
              onClick={() => window.open(externalUrl, '_blank', 'noopener,noreferrer')}
              style={{
                position: 'absolute', inset: 0, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.9rem',
                backgroundImage: video?.thumbnail_url ? `url(${video.thumbnail_url})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(0,0,0,0.5)' }}>
                <Play size={28} color="#0a0a0a" fill="#0a0a0a" style={{ marginLeft: 3 }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.9rem', background: 'rgba(0,0,0,0.6)', border: `1px solid ${bron?.kleur || 'rgba(255,255,255,0.2)'}`, borderRadius: 10, color: '#fff', fontSize: '0.82rem', fontWeight: 900 }}>
                <ExternalLink size={14} />
                {isZoom ? 'Bekijk op Zoom' : bron?.label && bron.label !== 'Link' ? `Openen in ${bron.label}` : 'Open video'}
              </div>
            </div>
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
          {/* WAT JE GAAT LEREN — inhoudsopgave met context.
              Staat bovenaan en niet onder de beschrijving: iemand die net op
              play heeft gedrukt wil meteen weten waar het heen gaat en waarom
              hij hier zit. Komt uit coach_videos.video_inhoud, zodat de coach
              het per video kan zetten zonder dat er iets uitgerold hoeft.
              Tikken op een hoofdstuk springt naar dat punt in de video. */}
          {(inhoud?.waarom || inhoud?.hoofdstukken?.length > 0) && (
            <div style={{
              padding: isMobile ? '0.9rem 0.875rem' : '1.1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                marginBottom: inhoud?.waarom ? '0.5rem' : '0.7rem',
              }}>
                <ListVideo size={15} color="#fff" strokeWidth={2.6} />
                <span style={{
                  fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 900, color: '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  Wat je gaat leren
                </span>
              </div>

              {inhoud?.waarom && (
                <p style={{
                  margin: '0 0 0.85rem',
                  fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.78)', lineHeight: 1.5,
                }}>
                  {inhoud.waarom}
                </p>
              )}

              {(inhoud?.hoofdstukken || []).map((h, i) => (
                <button
                  key={`${h.tijd}-${i}`}
                  onClick={() => setStartSec(Number(h.tijd) || 0)}
                  disabled={!videoId}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.5rem 0', minHeight: 40,
                    background: 'transparent', border: 'none',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    color: '#fff', fontFamily: 'inherit', textAlign: 'left',
                    cursor: videoId ? 'pointer' : 'default',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* De tijd als wit knopje: dat is het deel waar je op tikt
                      om te springen, en dat moet je kunnen zien. */}
                  <span style={{
                    flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 46, padding: '0.25rem 0.45rem',
                    background: '#fff', borderRadius: 7,
                    fontSize: isMobile ? '0.7rem' : '0.74rem', fontWeight: 900,
                    color: '#0a0a0a', fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.01em',
                  }}>
                    {tijdLabel(h.tijd)}
                  </span>
                  <span style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 800,
                    color: '#fff', lineHeight: 1.35, letterSpacing: '-0.01em',
                  }}>
                    {h.titel}
                  </span>
                </button>
              ))}
            </div>
          )}

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
    modalHost
  )
}
