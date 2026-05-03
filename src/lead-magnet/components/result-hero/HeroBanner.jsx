// ========================================
// 📁 src/lead-magnet/components/result-hero/HeroBanner.jsx
// Top hero: badge, persona title, tagline
// ========================================
import { CheckIcon } from './icons'

export default function HeroBanner({ isMobile, persona, isVisible }) {
  return (
    <div style={{
      background: '#0a0a0a',
      padding: isMobile ? '2rem 1.25rem 1.75rem' : '2.5rem 2rem 2.25rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: `2px solid ${persona.color}25`
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px',
        background: `radial-gradient(circle, ${persona.color}12 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Result badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.45rem 1.1rem',
        borderRadius: '100px',
        background: `${persona.color}20`,
        border: `1px solid ${persona.color}35`,
        marginBottom: isMobile ? '1rem' : '1.25rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.5s ease'
      }}>
        <CheckIcon size={14} color={persona.color} />
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '800',
          color: persona.color,
          letterSpacing: '0.1em'
        }}>JOUW RESULTAAT</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontWeight: '900',
        lineHeight: 1.05,
        margin: '0 0 0.75rem',
        letterSpacing: '-0.02em',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.6s ease 0.1s'
      }}>
        <span style={{
          display: 'block',
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: '600',
          marginBottom: '0.2em'
        }}>Jij bent</span>
        <span style={{
          display: 'block',
          fontSize: isMobile ? 'clamp(2rem, 9vw, 2.8rem)' : 'clamp(2.8rem, 5vw, 4rem)',
          color: persona.color
        }}>{persona.title}</span>
      </h1>

      <p style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '600',
        fontStyle: 'italic',
        maxWidth: '500px',
        margin: '0 auto',
        lineHeight: 1.5,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.2s'
      }}>
        {persona.tagline}
      </p>
    </div>
  )
}
