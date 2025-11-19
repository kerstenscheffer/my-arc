// src/modules/workout/components/week-schedule/ActionButtons.jsx
import { Save, X } from 'lucide-react'

export default function ActionButtons({ hasChanges, saving, onSave, onCancel, isMobile }) {
  return (
    <div style={{
      marginTop: '1rem',
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '0.625rem' : '0.75rem'
    }}>
      {hasChanges && (
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
            background: saving 
              ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.25) 0%, rgba(75, 85, 99, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
            backdropFilter: 'blur(12px)',
            border: saving
              ? '1px solid rgba(107, 114, 128, 0.3)'
              : '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: saving ? 'rgba(255, 255, 255, 0.5)' : '#10b981',
            fontSize: isMobile ? '0.825rem' : '0.875rem',
            fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: saving
              ? 'none'
              : '0 4px 12px rgba(16, 185, 129, 0.2)',
            opacity: saving ? 0.6 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!saving && !isMobile) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.25) 100%)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!saving && !isMobile) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'
            }
          }}
        >
          {!saving && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
              opacity: 0.6
            }} />
          )}
          
          <Save size={isMobile ? 15 : 16} />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      )}
      
      <button
        onClick={onCancel}
        style={{
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.85) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          color: '#ef4444',
          fontSize: isMobile ? '0.825rem' : '0.875rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(23, 23, 23, 0.9) 0%, rgba(10, 10, 10, 0.85) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <X size={isMobile ? 15 : 16} />
        Annuleren
      </button>
    </div>
  )
}
