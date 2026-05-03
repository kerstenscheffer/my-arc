// src/modules/workout/components/week-schedule/PlanningButtons.jsx
import { Calendar, Zap } from 'lucide-react'

export default function PlanningButtons({ onOpenWizard, onOpenCustom, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.625rem' }}>
      <PlanButton onClick={onOpenWizard} icon={Calendar} label="Plan Je Week" isMobile={isMobile} />
      <PlanButton onClick={onOpenCustom} icon={Zap} label="Eigen Week" isMobile={isMobile} />
    </div>
  )
}

function PlanButton({ onClick, icon: Icon, label, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: isMobile ? '0.6rem 0.5rem' : '0.7rem 1rem',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '6px' : '8px',
        color: 'rgba(255,255,255,0.45)',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0.35rem' : '0.4rem',
        transition: 'all 0.15s ease',
        minHeight: '40px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onTouchStart={(e) => { if (isMobile) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'scale(0.98)' } }}
      onTouchEnd={(e) => { if (isMobile) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' } }}
      onMouseEnter={(e) => { if (!isMobile) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
      onMouseLeave={(e) => { if (!isMobile) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' } }}
    >
      <Icon size={isMobile ? 13 : 14} strokeWidth={2} />
      <span>{label}</span>
    </button>
  )
}
