// src/modules/content-batches/components/BatchShootCard.jsx
// Eén agenda-kaart voor een heel opnamemoment (alle items van de batch samen).

import { Clapperboard, ChevronRight } from 'lucide-react'

const GOLD = '#FFD700'

export default function BatchShootCard({ batch, onView, isMobile = false }) {
  const items = batch.batch_items || []
  const accent = batch.format?.color || GOLD
  const time = (batch.shoot_time || '').slice(0, 5)

  return (
    <div
      onClick={() => onView?.(batch)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: isMobile ? '0.6rem 0.7rem' : '0.5rem 0.6rem',
        background: `linear-gradient(135deg, ${accent}1f 0%, rgba(0,0,0,0.4) 100%)`,
        border: `1px solid ${accent}55`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8, cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: `${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Clapperboard size={13} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? '0.8rem' : '0.78rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🎬 {batch.batch_name || 'Opname'}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 6 }}>
          {time && <span>{time}</span>}
          <span style={{ color: accent, fontWeight: 700 }}>{items.length} items opnemen</span>
        </div>
      </div>
      <ChevronRight size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
    </div>
  )
}
