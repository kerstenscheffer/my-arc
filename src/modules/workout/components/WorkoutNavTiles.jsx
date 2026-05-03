// src/modules/workout/components/WorkoutNavTiles.jsx
import { Calendar, Clock } from 'lucide-react'

const TILES = [
  {
    id: 'planning',
    label: 'Planning',
    sub: 'Jouw weekschema',
    img: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400&h=200&fit=crop&q=70',
    icon: Calendar,
    anchor: 'week-schedule'
  },
  {
    id: 'history',
    label: 'Geschiedenis',
    sub: 'Eerdere workouts',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop&q=70',
    icon: Clock,
    anchor: 'workout-history'
  }
]

export default function WorkoutNavTiles({ isMobile }) {
  const scrollTo = (anchor) => {
    const el = document.getElementById(anchor)
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - (isMobile ? 80 : 100)
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.625rem', padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem' }}>
      {TILES.map(({ id, label, sub, img, icon: Icon, anchor }) => (
        <button
          key={id}
          onClick={() => scrollTo(anchor)}
          style={{ flex: 1, position: 'relative', height: isMobile ? '72px' : '84px', borderRadius: isMobile ? '8px' : '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', background: 'transparent', padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
          {/* Foto */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.45 }} />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)' }} />
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.1rem' }}>
              <Icon size={isMobile ? 10 : 11} color="rgba(255,215,0,0.6)" strokeWidth={2.5} />
              <span style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700', color: 'rgba(255,215,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{sub}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
