// ========================================
// 📁 src/lead-magnet/components/result-hero/StepsPlanCard.jsx
// 5-step plan in dark e-book card, blur on step 4-5
// ========================================
import { TargetIcon, LockIcon, DownloadIcon } from './icons'

export default function StepsPlanCard({ isMobile, persona, isVisible, onOpenModal }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: isMobile ? '0.4rem' : '0.5rem'
      }}>
        <TargetIcon size={18} color={persona.color} />
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          fontWeight: '800',
          color: '#fff',
          margin: 0
        }}>Jouw 5-Stappen Plan</h2>
      </div>
      <p style={{
        fontSize: isMobile ? '0.78rem' : '0.82rem',
        color: 'rgba(255,255,255,0.25)',
        fontWeight: '500',
        marginBottom: isMobile ? '1.25rem' : '1.5rem'
      }}>Dit is precies hoe je het fixt</p>

      {/* Dark e-book card */}
      <div style={{
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${persona.color}20`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Color top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${persona.color}, transparent)`
        }} />

        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem 1.15rem 0.75rem' : '1.5rem 1.35rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          position: 'relative', zIndex: 2
        }}>
          <div style={{
            fontSize: '0.55rem',
            fontWeight: '800',
            color: persona.color,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem',
            opacity: 0.7
          }}>JOUW PERSOONLIJKE AANPAK</div>
          <div style={{
            fontSize: isMobile ? '1.15rem' : '1.3rem',
            fontWeight: '800',
            color: '#fff'
          }}>Het 5-Stappen Plan</div>
        </div>

        {/* Steps */}
        <div style={{
          padding: isMobile ? '0.5rem 1.15rem 0' : '0.75rem 1.35rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.1rem',
          position: 'relative', zIndex: 2
        }}>
          {persona.steps.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: isMobile ? '0.75rem' : '0.85rem',
              padding: isMobile ? '0.85rem 0' : '0.95rem 0',
              borderBottom: idx < persona.steps.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              filter: idx >= 3 ? `blur(${3 + (idx - 3) * 2}px)` : 'none',
              opacity: idx >= 3 ? 0.4 : (isVisible ? 1 : 0),
              transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
              transition: `all 0.4s ease ${0.5 + idx * 0.08}s`,
              userSelect: idx >= 3 ? 'none' : 'auto'
            }}>
              <div style={{
                width: '30px', height: '30px',
                borderRadius: '8px',
                background: `${persona.color}15`,
                border: `1px solid ${persona.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '900',
                  color: persona.color
                }}>{idx + 1}</span>
              </div>
              <div>
                <div style={{
                  fontSize: isMobile ? '0.88rem' : '0.92rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.2rem'
                }}>{step.title}</div>
                <div style={{
                  fontSize: isMobile ? '0.76rem' : '0.8rem',
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: '450',
                  lineHeight: 1.45
                }}>{step.summary}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Unlock CTA */}
        <div style={{
          padding: isMobile ? '0.75rem 1.15rem 1.25rem' : '1rem 1.35rem 1.5rem',
          textAlign: 'center',
          position: 'relative', zIndex: 3
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.4rem', marginBottom: '0.75rem'
          }}>
            <LockIcon size={13} />
            <span style={{
              fontSize: isMobile ? '0.73rem' : '0.78rem',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '500'
            }}>Stap 4-5 + weekschema staan in de guide</span>
          </div>
          <button
            onClick={() => onOpenModal && onOpenModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: isMobile ? '0.75rem 1.5rem' : '0.85rem 1.75rem',
              background: persona.color,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${persona.color}35`,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <DownloadIcon size={16} />
            Download gratis guide
          </button>
        </div>
      </div>
    </div>
  )
}
