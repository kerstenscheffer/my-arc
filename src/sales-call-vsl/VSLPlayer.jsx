// Gedeelde VSL-speler — leest config uit content.js (VSL_VIDEO).
// Werkt voor YouTube, Vimeo, MP4, of laat een nette placeholder zien
// wanneer er nog geen video is.

import React from 'react'
import { Play } from 'lucide-react'

const GOLD = '#ffba09'

// Trek een YouTube video-id uit een volledige URL of accepteer een
// kale id. Zo kan de gebruiker beide formats in content.js gebruiken.
function youtubeId(srcOrId) {
  if (!srcOrId) return null
  const m = srcOrId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (m) return m[1]
  if (/^[\w-]{11}$/.test(srcOrId)) return srcOrId
  return null
}

function vimeoId(srcOrId) {
  if (!srcOrId) return null
  const m = srcOrId.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (m) return m[1]
  if (/^\d+$/.test(srcOrId)) return srcOrId
  return null
}

export default function VSLPlayer({ video, isMobile, maxWidth = 920 }) {
  const wrapStyle = {
    position: 'relative',
    width: '100%',
    maxWidth,
    margin: '0 auto',
    aspectRatio: '16/9',
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: isMobile ? 10 : 14,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
  }

  if (!video?.type) {
    // Placeholder — duidelijk leesbaar zonder schreeuwerig.
    return (
      <div style={wrapStyle}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 10 : 14,
          background:
            'radial-gradient(circle at 50% 40%, rgba(255,186,9,0.06) 0%, transparent 55%), #0a0a0a',
        }}>
          <div style={{
            width: isMobile ? 56 : 78, height: isMobile ? 56 : 78,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(255,186,9,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 36px rgba(255,186,9,0.12)',
          }}>
            <Play size={isMobile ? 24 : 32} color={GOLD} fill={GOLD} strokeWidth={1.5} />
          </div>
          <div style={{
            fontSize: isMobile ? '0.78rem' : '0.95rem',
            color: 'rgba(255,255,255,0.55)',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            Video komt hier
          </div>
        </div>
      </div>
    )
  }

  if (video.type === 'youtube') {
    const id = youtubeId(video.src)
    if (!id) return <div style={wrapStyle} />
    return (
      <div style={wrapStyle}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    )
  }

  if (video.type === 'vimeo') {
    const id = vimeoId(video.src)
    if (!id) return <div style={wrapStyle} />
    return (
      <div style={wrapStyle}>
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          title="Video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
    )
  }

  if (video.type === 'mp4') {
    return (
      <div style={wrapStyle}>
        <video
          controls
          poster={video.poster || undefined}
          src={video.src}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  return <div style={wrapStyle} />
}
