// src/coach/tabs/NotesSection.jsx
export default function NotesSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Coach Notes
        </h3>
        <textarea
          value={formData.coachNotes || ''}
          onChange={(e) => setFormData({...formData, coachNotes: e.target.value})}
          disabled={!isEditing}
          style={{
            width: '100%',
            height: '200px',
            padding: isMobile ? '0.75rem' : '1rem',
            background: isEditing ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            resize: 'vertical',
            outline: 'none'
          }}
          placeholder="Notes about client, special considerations, personality traits..."
        />
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          AI Instructions
        </h3>
        <textarea
          value={formData.aiNotes || ''}
          onChange={(e) => setFormData({...formData, aiNotes: e.target.value})}
          disabled={!isEditing}
          style={{
            width: '100%',
            height: '200px',
            padding: isMobile ? '0.75rem' : '1rem',
            background: isEditing ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            resize: 'vertical',
            outline: 'none'
          }}
          placeholder="Special instructions for AI meal/workout generation..."
        />
      </div>
    </div>
  )
}
