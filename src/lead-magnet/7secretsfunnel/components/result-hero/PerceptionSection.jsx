// ========================================
// 📁 src/lead-magnet/components/result-hero/PerceptionSection.jsx
// Myth-busting cards on white background
// ========================================
import { LightbulbIcon, XMarkIcon, CheckIcon } from './icons'

export default function PerceptionSection({ isMobile, persona, isVisible }) {
  return (
    <div style={{
      padding: isMobile ? '1.25rem 0' : '1.5rem 0',
      borderBottom: '1px solid #eee'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: isMobile ? '0.85rem' : '1rem'
      }}>
        <LightbulbIcon size={18} color={persona.color} />
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          fontWeight: '800',
          color: '#1a1a1a',
          margin: 0
        }}>Waarom het tot nu toe niet lukte</h2>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.65rem' : '0.75rem'
      }}>
        {persona.perceptions.map((p, idx) => (
          <div key={idx} style={{
            background: '#fafaf8',
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.15rem',
            border: '1px solid rgba(0,0,0,0.05)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: `all 0.5s ease ${0.4 + idx * 0.1}s`
          }}>
            <div style={{
              fontSize: isMobile ? '0.82rem' : '0.85rem',
              fontWeight: '700',
              color: '#c0392b',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <XMarkIcon size={13} color="#c0392b" />
              <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                "{p.myth}"
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.88rem',
              fontWeight: '500',
              color: '#333',
              lineHeight: 1.55,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem'
            }}>
              <CheckIcon size={14} color={persona.color} style={{ flexShrink: 0, marginTop: '3px' }} />
              <span>{p.reality}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
