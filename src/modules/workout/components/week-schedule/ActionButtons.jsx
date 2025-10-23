import { Save } from 'lucide-react'

export default function ActionButtons({ hasChanges, saving, onSave, onCancel, isMobile }) {
  return (
    <div style={{
      marginTop: '1rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '0.75rem'
    }}>
      {hasChanges && (
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
            background: saving 
              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            opacity: saving ? 0.7 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Save size={16} />
          {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
        </button>
      )}
      
      <button
        onClick={onCancel}
        style={{
          padding: isMobile ? '0.6rem 1.25rem' : '0.7rem 1.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '10px',
          color: '#ef4444',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: '44px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        Annuleren
      </button>
    </div>
  )
}
