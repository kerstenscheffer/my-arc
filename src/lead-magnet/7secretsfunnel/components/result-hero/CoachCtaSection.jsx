// ========================================
// 📁 src/lead-magnet/components/result-hero/CoachCtaSection.jsx
// Coach photo (dark card) + CTA on white background
// ========================================
import { CheckIcon, ArrowRightIcon } from './icons'

export default function CoachCtaSection({ isMobile, persona }) {
  return (
    <>
      {/* Coach Block — dark card on white bg */}
      <div style={{
        padding: isMobile ? '1.5rem 0' : '2rem 0',
        borderBottom: '1px solid #eee'
      }}>
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          background: '#0a0a0a'
        }}>
          <img
            src="/coach-kersten.png"
            alt="Coach Kersten"
            style={{
              width: '100%',
              height: isMobile ? '280px' : '340px',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block'
            }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60%',
            background: 'linear-gradient(180deg, transparent 0%, #0a0a0a 100%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: isMobile ? '1.25rem' : '1.5rem',
            zIndex: 2
          }}>
            <div style={{
              fontSize: '0.55rem',
              fontWeight: '800',
              color: '#ffba09',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.3rem'
            }}>JOUW COACH</div>
            <div style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '0.35rem'
            }}>Kersten Scheffer</div>
            <p style={{
              fontSize: isMobile ? '0.78rem' : '0.82rem',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: '500',
              lineHeight: 1.5,
              margin: 0
            }}>
              Helpt mannen droog worden zonder crash diëten of bullshit schema's. Gewoon een plan dat werkt, met iemand die je er doorheen loodst.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section — white bg */}
      <div style={{
        padding: isMobile ? '2rem 0 2.5rem' : '2.5rem 0 3rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.6rem',
          fontWeight: '800',
          color: '#ffba09',
          letterSpacing: '0.12em',
          marginBottom: '0.6rem'
        }}>DE VOLGENDE STAP</div>

        <h2 style={{
          fontSize: isMobile ? '1.3rem' : '1.5rem',
          fontWeight: '800',
          color: '#1a1a1a',
          marginBottom: '0.5rem',
          lineHeight: 1.2
        }}>
          Klaar om het <span style={{ color: persona.color }}>echt te fixen?</span>
        </h2>

        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(26,26,26,0.5)',
          fontWeight: '500',
          marginBottom: '1.25rem',
          lineHeight: 1.6,
          maxWidth: '460px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Je hebt nu het plan. In een gratis gesprek van 15 min kijken we samen wat voor jou werkt.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '340px',
          margin: '0 auto 1.25rem',
          textAlign: 'left'
        }}>
          {[
            'Ik kijk naar jouw situatie en doelen',
            'Je krijgt eerlijk advies, geen salespitch',
            'Geen druk, gewoon kijken of het past'
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckIcon size={14} color={persona.color} />
              <span style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(26,26,26,0.55)',
                fontWeight: '600'
              }}>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '1rem 2rem' : '1.1rem 2.5rem',
            background: '#ffba09',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 6px 25px rgba(255,186,9,0.3)',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          Plan je gratis gesprek <ArrowRightIcon size={18} color="#000" />
        </button>

        <div style={{
          marginTop: '0.85rem',
          fontSize: '0.72rem',
          color: 'rgba(26,26,26,0.25)',
          fontWeight: '500'
        }}>
          Nog 5 plekken deze 2 weken · 15 min · 100% gratis
        </div>
      </div>
    </>
  )
}
