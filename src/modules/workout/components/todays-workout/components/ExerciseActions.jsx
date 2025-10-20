// src/modules/workout/components/todays-workout/components/ExerciseActions.jsx
import { Info, RefreshCw, Play } from 'lucide-react'

export default function ExerciseActions({ onInfo, onSwap, onLog, isLogged }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? '0.4rem' : '0.5rem',
      flexWrap: 'wrap'
    }}>
      {/* Info Button */}
      <ActionButton
        icon={Info}
        label="Info"
        onClick={onInfo}
        variant="secondary"
      />
      
      {/* Swap Button */}
      <ActionButton
        icon={RefreshCw}
        label="Wissel"
        onClick={onSwap}
        variant="secondary"
      />
      
      {/* Log Button */}
      <ActionButton
        icon={Play}
        label={isLogged ? 'Bekijk' : 'Log'}
        onClick={onLog}
        variant="primary"
        isLogged={isLogged}
      />
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick, variant = 'secondary', isLogged = false }) {
  const isMobile = window.innerWidth <= 768
  const isPrimary = variant === 'primary'
  
  return (
    <button
      onClick={onClick}
      style={{
        background: isPrimary 
          ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
          : 'rgba(23, 23, 23, 0.6)',
        backdropFilter: isPrimary ? 'none' : 'blur(10px)',
        border: isPrimary 
          ? 'none'
          : '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '8px',
        padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
        color: isPrimary ? '#000' : '#f97316',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isPrimary 
          ? '0 4px 20px rgba(249, 115, 22, 0.35)'
          : 'none',
        minHeight: '44px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        flex: isPrimary ? '1' : '0 0 auto'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          if (isPrimary) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(249, 115, 22, 0.5)'
          } else {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          if (isPrimary) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.35)'
          } else {
            e.currentTarget.style.background = 'rgba(23, 23, 23, 0.6)'
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
          }
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
      <Icon 
        size={isMobile ? 13 : 14}
        strokeWidth={2.5}
        style={{
          filter: isPrimary 
            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
            : 'none'
        }}
      />
      {label}
    </button>
  )
}
