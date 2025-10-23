// ========================================
// 📁 src/modules/workout/components/week-schedule/PlanningButtons.jsx
// ========================================
import { Calendar, Zap } from 'lucide-react'

export default function PlanningButtons({ onOpenWizard, onOpenCustom, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
      gap: '0.75rem'
    }}>
      {/* Main Planning Button - Dark Green Gradient */}
      <button
        onClick={onOpenWizard}
        style={{
          padding: isMobile ? '1rem' : '1.125rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '14px',
          color: '#10b981',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          minHeight: '56px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
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
        {/* Top glow accent */}
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
        
        {/* Subtle shine effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.15), transparent)',
          animation: 'shine 3s infinite',
          pointerEvents: 'none'
        }} />
        
        <Calendar size={isMobile ? 20 : 22} strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }} />
        Maak een Week Planning
      </button>
      
      {/* Custom Workouts Button - Orange Accent */}
      <button
        onClick={onOpenCustom}
        style={{
          padding: isMobile ? '1rem' : '1.125rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '14px',
          color: '#f97316',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '56px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 4px 20px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(249, 115, 22, 0.12) 100%)'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.02)'
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
        {/* Top glow accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />
        
        <Zap size={isMobile ? 18 : 20} strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))' }} />
        Custom Workouts
      </button>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}

