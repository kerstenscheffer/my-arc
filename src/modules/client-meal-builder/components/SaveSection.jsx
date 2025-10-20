// src/modules/client-meal-builder/components/SaveSection.jsx
import { Sparkles } from 'lucide-react'

export default function SaveSection({
  mealName,
  saving,
  isMobile,
  onMealNameChange,
  onSave
}) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '0',
      padding: isMobile ? '1.25rem' : '1.5rem'
    }}>
      <input
        type="text"
        value={mealName}
        onChange={(e) => onMealNameChange(e.target.value)}
        placeholder="Geef je maaltijd een naam..."
        style={{
          width: '100%',
          height: '48px',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '600',
          padding: '0 1rem',
          marginBottom: '1rem',
          outline: 'none'
        }}
      />
      
      <button
        onClick={onSave}
        disabled={saving || !mealName.trim()}
        style={{
          width: '100%',
          height: '56px',
          background: saving || !mealName.trim() 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '0',
          color: '#10b981',
          fontSize: '1.1rem',
          fontWeight: '800',
          cursor: saving || !mealName.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          opacity: saving || !mealName.trim() ? 0.5 : 1,
          boxShadow: saving || !mealName.trim() ? 'none' : '0 0 30px rgba(16, 185, 129, 0.2)'
        }}
      >
        {saving ? (
          <>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderTopColor: '#10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Opslaan...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Maaltijd Opslaan
          </>
        )}
      </button>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
