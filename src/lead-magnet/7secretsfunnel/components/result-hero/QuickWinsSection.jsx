// ========================================
// 📁 src/lead-magnet/components/result-hero/QuickWinsSection.jsx
// Quick wins on white background — value first
// ========================================
import { ZapIcon, CheckIcon } from './icons'

export default function QuickWinsSection({ isMobile, persona }) {
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
        <ZapIcon size={18} color={persona.color} />
        <h2 style={{
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          fontWeight: '800',
          color: '#1a1a1a',
          margin: 0
        }}>Begin vandaag</h2>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {persona.quickWins.map((win, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 0.85rem',
            background: `${persona.color}0a`,
            borderRadius: '10px',
            border: `1px solid ${persona.color}18`
          }}>
            <CheckIcon size={16} color={persona.color} />
            <span style={{
              fontSize: isMobile ? '0.84rem' : '0.88rem',
              fontWeight: '550',
              color: '#333',
              lineHeight: 1.4
            }}>{win}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
