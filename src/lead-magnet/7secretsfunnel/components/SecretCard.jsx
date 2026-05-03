// src/lead-magnet/components/SecretCard.jsx
import { GOLD, GoldText } from './shared'

export default function SecretCard({ secret, isActive, offset, total, onClick }) {
  const angle = (offset / total) * 360
  const radian = (angle * Math.PI) / 180
  const radius = 600
  const x = Math.sin(radian) * radius
  const z = Math.cos(radian) * radius - radius
  const absOff = Math.abs(offset > total / 2 ? offset - total : offset)
  const opacity = isActive ? 1 : Math.max(0.15, 1 - absOff * 0.3)
  const scale = isActive ? 1 : Math.max(0.6, 1 - absOff * 0.12)
  const blur = isActive ? 0 : Math.min(4, absOff * 1.5)

  return (
    <div onClick={onClick} style={{
      position: 'absolute',
      width: 'min(340px, 85vw)',
      minHeight: '480px',
      transform: `translateX(${x}px) translateZ(${z}px) scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      transition: 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      zIndex: isActive ? 10 : 5 - absOff,
      cursor: isActive ? 'default' : 'pointer',
      pointerEvents: isActive || absOff <= 2 ? 'auto' : 'none',
    }}>
      <div style={{
        background: isActive
          ? 'linear-gradient(145deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)'
          : 'linear-gradient(145deg, rgba(15,15,15,0.8) 0%, rgba(5,5,5,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: isActive ? `1.5px solid ${GOLD}60` : '1px solid rgba(255,255,255,0.06)',
        padding: '2rem 1.5rem',
        boxShadow: isActive
          ? `0 0 60px rgba(255,186,9,0.12), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`
          : '0 10px 40px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Gold accent line */}
        {isActive && <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          borderRadius: '0 0 4px 4px',
        }} />}

        {/* Shine overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Header: number + tag */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${GOLD}20 0%, ${GOLD}08 100%)`,
              border: `1px solid ${GOLD}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${GOLD}10`,
            }}>
              <GoldText style={{ fontSize: '1.2rem', fontWeight: '900' }}>{secret.number}</GoldText>
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
            }}>SECRET {secret.number} / 7</span>
          </div>
          <span style={{
            fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.08em',
            color: GOLD, background: `${GOLD}12`, padding: '0.3rem 0.6rem',
            borderRadius: '6px', border: `1px solid ${GOLD}20`,
          }}>{secret.tag}</span>
        </div>

        {/* Stat */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1rem',
        }}>
          <GoldText style={{
            fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1,
          }}>{secret.stat}</GoldText>
          <span style={{
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600',
          }}>{secret.statLabel}</span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.2rem', fontWeight: '800', color: '#fff',
          lineHeight: 1.3, margin: '0 0 1rem', letterSpacing: '-0.01em',
        }}>{secret.title}</h2>

        {/* Body */}
        <p style={{
          fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.65, margin: '0 0 0.75rem', flex: 1,
        }}>{secret.body}</p>

        {/* Highlight box */}
        <div style={{
          background: `linear-gradient(135deg, ${GOLD}10 0%, ${GOLD}05 100%)`,
          border: `1px solid ${GOLD}18`, borderRadius: '12px',
          padding: '0.85rem 1rem', marginBottom: '0.75rem',
        }}>
          <p style={{
            fontSize: '0.8rem', color: GOLD, lineHeight: 1.55, margin: 0, fontWeight: '600',
          }}>{secret.highlight}</p>
        </div>

        {/* Closer */}
        <p style={{
          fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.55, margin: 0, fontStyle: 'italic',
        }}>{secret.closer}</p>
      </div>
    </div>
  )
}
