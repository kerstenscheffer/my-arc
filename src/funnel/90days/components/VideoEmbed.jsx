// src/funnel/90days/components/VideoEmbed.jsx

import { GOLD, pp } from '../colors'

export default function VideoEmbed({ isMobile }) {
  return (
    <section style={{
      maxWidth: '580px', margin: '0 auto',
      padding: isMobile ? '0 1.25rem 1.5rem' : '0 2rem 2rem',
    }}>
      {/* Label */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '0.48rem' : '0.52rem',
        fontWeight: 700, color: GOLD, textTransform: 'uppercase',
        letterSpacing: '0.12em',
        textAlign: 'center', marginBottom: '0.6rem',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill={GOLD} stroke="none" style={{ verticalAlign: '-1px', marginRight: '4px' }}>
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Bekijk de video
      </div>

      {/* Video container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: isMobile ? '14px' : '18px',
        overflow: 'hidden',
        border: '1.5px solid rgba(255,186,9,0.15)',
        boxShadow: '0 8px 30px rgba(255,186,9,0.06)',
      }}>
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="90-Day Transformation Systeem"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none', display: 'block' }}
        />
      </div>

      {/* Caption */}
      <p style={{
        fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: 500, color: 'rgba(255,255,255,0.2)',
        textAlign: 'center', marginTop: '0.5rem',
      }}>
        Bekijk hoe het systeem werkt — in 3 minuten
      </p>
    </section>
  )
}
