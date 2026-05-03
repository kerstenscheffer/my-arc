// src/funnel/90days/components/Hero.jsx

import { GOLD, CALENDLY, pp, goldGloss, goldButtonBg, shimmerOverlay } from '../colors'
import { ReviewSummary, ReviewCarousel } from './Reviews'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 900 }}>{children}</span>
)

export default function Hero({ isMobile, onCTAClick }) {
  return (
    <section style={{
      maxWidth: '720px', margin: '0 auto',
      padding: isMobile ? '0.25rem 1rem 1.5rem' : '0.25rem 2rem 2rem',
      textAlign: 'center',
    }}>
      {/* Target label */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem',
        fontWeight: 700, color: '#fff',
        letterSpacing: '0.05em',
        marginBottom: isMobile ? '0.4rem' : '0.5rem',
      }}>Voor mannen van 20-35 die fit willen worden</div>

      {/* Headline */}
      <h1 style={{
        fontFamily: pp,
        fontSize: isMobile ? '1.5rem' : '2.1rem',
        fontWeight: 900, lineHeight: 1.2, color: '#fff',
        marginBottom: isMobile ? '0.5rem' : '0.6rem',
      }}>
        Ontdek Hoe Je <G>5-15 Kilo Vet</G> Verliest In 90 Dagen <G>Zonder Een Strict Dieet</G> Te Hoeven Volgen
      </h1>

      {/* Review summary */}
      <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
        <ReviewSummary isMobile={isMobile} />
      </div>

      {/* Sub */}
      <p style={{
        fontFamily: pp,
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        fontWeight: 400, lineHeight: 1.65,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: isMobile ? '0.75rem' : '1rem',
      }}>
        Bekijk de video
      </p>

      {/* Video — thumbnail + gold play button only */}
      <div
        onClick={() => {
          // Replace thumbnail with actual video on click
          const el = document.getElementById('funnel-video-container')
          if (el) {
            el.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/eIZN1nTtMf4?autoplay=1" title="90-Day Transformation" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style="border:none;display:block;position:absolute;inset:0"></iframe>'
          }
        }}
        id="funnel-video-container"
        style={{
          position: 'relative', width: '100%',
          aspectRatio: '16/9',
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          marginBottom: isMobile ? '1.5rem' : '1.75rem',
          background: '#0a0a0a',
          cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* YouTube thumbnail */}
        <img
          src="https://img.youtube.com/vi/eIZN1nTtMf4/maxresdefault.jpg"
          alt=""
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', filter: 'brightness(0.7)',
          }}
        />
        {/* Gold play button — centered */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: isMobile ? '52px' : '64px',
            height: isMobile ? '52px' : '64px',
            borderRadius: '50%',
            background: goldButtonBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(255,186,9,0.3)',
          }}>
            <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" fill="#000" stroke="none">
              <polygon points="8 5 20 12 8 19 8 5"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Pre-CTA headline */}
      <div style={{
        fontFamily: pp,
        fontSize: isMobile ? '1rem' : '1.15rem',
        fontWeight: 800, color: '#fff', lineHeight: 1.3,
        marginBottom: isMobile ? '0.25rem' : '0.3rem',
      }}>
        Klaar om <G>5-15 kilo</G> op een blijvende manier af te vallen?
      </div>
      <div style={{
        fontFamily: pp,
        fontSize: isMobile ? '0.65rem' : '0.72rem',
        fontWeight: 400, color: 'rgba(255,255,255,0.35)',
        marginBottom: isMobile ? '0.6rem' : '0.75rem',
      }}>
        Laat je gegevens achter en ontvang vrijblijvend meer informatie
      </div>

      {/* CTA */}
      <button onClick={onCTAClick} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', textDecoration: 'none',
        fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.95rem',
        fontWeight: 900, color: '#000',
        background: 'linear-gradient(145deg, #d4a017 0%, #ffba09 30%, #ffd44d 50%, #ffba09 70%, #d4a017 100%)',
        borderRadius: '14px',
        padding: isMobile ? '1rem' : '1.1rem',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
        animation: 'ssPulseGlow 2.5s ease-in-out infinite',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        border: 'none', cursor: 'pointer',
        width: '100%',
      }}>
        <div style={shimmerOverlay} />
        <span style={{ position: 'relative', zIndex: 1 }}>Ja, Ik Wil Meer Info!</span>
        <svg style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>

      {/* Spots under button */}
      <div style={{
        marginTop: isMobile ? '0.5rem' : '0.6rem',
        fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem',
        fontWeight: 500, color: 'rgba(255,255,255,0.15)',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
      }}>
        Vrijblijvend — we nemen binnen 24 uur contact op
      </div>

      {/* Review slider */}
      <ReviewCarousel isMobile={isMobile} />
    </section>
  )
}
