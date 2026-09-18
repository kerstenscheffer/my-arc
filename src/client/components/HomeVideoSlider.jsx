// src/client/components/HomeVideoSlider.jsx
//
// Auto-rotating video-slider voor de home-pagina. Toont alle videos die
// de coach aan deze klant heeft toegewezen (via video_assignments). Sliden
// gebeurt automatisch zodat de klant ze passief ziet langskomen; tap = open
// VideoPlayerModal om af te spelen.

import { useState, useEffect, useRef } from 'react'
import { Play } from 'lucide-react'
import clientVideoService from '../../modules/videos/ClientVideoService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { extractYouTubeId, getYouTubeThumbnail } from '../../modules/videos/utils/youtubeHelpers'
import useIsMobile from '../../hooks/useIsMobile'

const ROTATE_INTERVAL_MS = 5500

export default function HomeVideoSlider({ client }) {
  const isMobile = useIsMobile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [playerItem, setPlayerItem] = useState(null)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  // Videos inladen
  useEffect(() => {
    if (!client?.id) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        // Slider toont nu de coach-video's met de "in home-slider"-vlag
        // (show_in_slider), standaard voor alle clients — niet meer de losse
        // per-client video_assignments.
        const coachId = client.coach_id || client.trainer_id
        const vids = await clientVideoService.getSliderVideos(coachId)
        if (cancelled) return
        setItems(vids)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [client?.id, client?.coach_id, client?.trainer_id])

  // Auto-rotate timer
  useEffect(() => {
    if (paused || items.length < 2 || playerItem) return
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % items.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [paused, items.length, playerItem])

  if (loading || items.length === 0) return null

  const current = items[activeIdx]
  const vId = extractYouTubeId(current?.video?.video_url)
  const thumb = (vId ? getYouTubeThumbnail(vId, 'hqdefault') : null) || current?.video?.thumbnail_url || null

  const openPlayer = () => {
    setPaused(true)
    setPlayerItem(current)
  }
  const closePlayer = () => {
    setPlayerItem(null)
    setPaused(false)
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div
        onMouseEnter={() => !isMobile && setPaused(true)}
        onMouseLeave={() => !isMobile && setPaused(false)}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
        }}
      >
        {/* Aspect-ratio container (16:9) */}
        <div
          onClick={openPlayer}
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {thumb && (
            <img
              key={current.video.id}
              src={thumb}
              alt={current.video.title}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                animation: 'homeVideoSlide 0.5s ease',
              }}
            />
          )}
          {/* Donker gradient onderaan voor leesbare tekst */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 35%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.92) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Centrale play-knop */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? 52 : 62,
            height: isMobile ? 52 : 62,
            borderRadius: '50%',
            // Wit, zoals elke hoofdactie in de app. De gouden gloed trok de
            // aandacht naar de knop in plaats van naar de video.
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Play size={isMobile ? 21 : 26} color="#0a0a0a" strokeWidth={2.8} fill="#0a0a0a" style={{ marginLeft: 3 }} />
          </div>

          {/* Titel + categorie onderaan */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            padding: isMobile ? '0.85rem 0.95rem' : '1rem 1.1rem',
            color: '#fff',
          }}>
            <div style={{
              fontSize: '0.52rem', fontWeight: 800,
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase', letterSpacing: '0.09em',
              marginBottom: 4,
              textShadow: '0 2px 6px rgba(0,0,0,0.8)',
            }}>
              Van je coach
            </div>
            <div style={{
              fontSize: isMobile ? '0.92rem' : '1rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textShadow: '0 2px 6px rgba(0,0,0,0.6)',
            }}>
              {current.video.title}
            </div>
          </div>
        </div>

        {/* Dot-indicator */}
        {items.length > 1 && items.length <= 8 && (
          <div style={{
            position: 'absolute',
            bottom: 8, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: 5,
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
          }}>
            {items.map((_, i) => (
              <span key={i} style={{
                width: i === activeIdx ? 14 : 5,
                height: 5,
                borderRadius: 999,
                background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'width 0.25s ease, background 0.25s ease',
              }} />
            ))}
          </div>
        )}
      </div>

      {playerItem && (
        <VideoPlayerModal item={playerItem} onClose={closePlayer} />
      )}

      <style>{`
        @keyframes homeVideoSlide {
          from { opacity: 0; transform: scale(1.02); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
