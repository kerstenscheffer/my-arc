// src/modules/workout/components/week-schedule/PlanningButtons.jsx
import { Calendar, Zap } from 'lucide-react'

export default function PlanningButtons({ onOpenWizard, onOpenCustom, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '0.625rem' : '0.75rem'
    }}>
      {/* Main Planning Button - Green */}
      <button
        onClick={onOpenWizard}
        style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: isMobile ? '12px' : '14px',
          color: '#10b981',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
          minHeight: '48px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.25) 100%)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.2)'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />
        
        <Calendar size={isMobile ? 18 : 20} strokeWidth={2.5} />
        <span>Plan Je Workout Week</span>
      </button>
      
      {/* Custom Workouts Button - Orange */}
      <button
        onClick={onOpenCustom}
        style={{
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          borderRadius: isMobile ? '12px' : '14px',
          color: '#f97316',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '48px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.35) 0%, rgba(249, 115, 22, 0.25) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(249, 115, 22, 0.2)'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />
        
        <Zap size={isMobile ? 18 : 20} strokeWidth={2.5} />
        <span>Maak Je Eigen Week</span>
      </button>
    </div>
  )
}
