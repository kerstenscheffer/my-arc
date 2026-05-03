// src/modules/productivity/components/weekly-wins/AddWinModal.jsx
import { useState } from 'react'
import { X, Trophy, Tag } from 'lucide-react'

const CATEGORIES = [
  { id: 'werk', label: 'Werk', emoji: '💼', color: '#3b82f6' },
  { id: 'prive', label: 'Privé', emoji: '🏠', color: '#ec4899' },
  { id: 'myarc', label: 'MY ARC', emoji: '💪', color: '#10b981' },
  { id: 'gezondheid', label: 'Gezondheid', emoji: '❤️', color: '#f59e0b' },
  { id: 'persoonlijk', label: 'Persoonlijk', emoji: '🌟', color: '#8b5cf6' }
]

export default function AddWinModal({ isMobile, onClose, onSubmit }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!text.trim()) newErrors.text = 'Beschrijf je win'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setSaving(true)
    try {
      await onSubmit({
        text: text.trim(),
        category: category || null
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0, 0, 0, 0.9)', 
        backdropFilter: 'blur(12px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        padding: isMobile ? '1rem' : '2rem' 
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ 
        background: 'linear-gradient(180deg, #141414 0%, #0a0a0a 100%)', 
        border: '1px solid rgba(245, 158, 11, 0.3)', 
        borderRadius: '24px', 
        width: '100%', 
        maxWidth: '500px', 
        maxHeight: '90vh', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(245, 158, 11, 0.15)'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: isMobile ? '1.25rem' : '1.5rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.5)'
              }}>
                <Trophy size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: isMobile ? '1.125rem' : '1.25rem', 
                  fontWeight: '700', 
                  color: '#fff', 
                  margin: 0 
                }}>
                  Nieuwe Win 🎉
                </h3>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  margin: 0 
                }}>
                  Vier je successen, groot of klein!
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                padding: '0.5rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '10px', 
                color: 'rgba(255, 255, 255, 0.6)', 
                cursor: 'pointer' 
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            padding: isMobile ? '1.25rem' : '1.5rem', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem' 
          }}
        >
          
          {/* Win Text */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.875rem', 
              fontWeight: '600' 
            }}>
              <Trophy size={16} color="#f59e0b" />
              Wat is je win? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => { 
                setText(e.target.value)
                setErrors({ ...errors, text: '' }) 
              }}
              placeholder="Ik heb vandaag..."
              rows={4}
              autoFocus
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: errors.text 
                  ? '1px solid #ef4444' 
                  : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
            {errors.text && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>
                {errors.text}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.875rem', 
              fontWeight: '600' 
            }}>
              <Tag size={16} color="#8b5cf6" />
              Categorie (optioneel)
            </label>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
              gap: '0.5rem' 
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                  style={{
                    padding: '0.75rem',
                    background: category === cat.id 
                      ? `${cat.color}25` 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: category === cat.id 
                      ? `2px solid ${cat.color}` 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: category === cat.id ? cat.color : 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    minHeight: '44px'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Motivational Message */}
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ 
              color: '#10b981', 
              fontSize: '0.9rem', 
              fontWeight: '600',
              margin: 0
            }}>
              ✨ Elke win, hoe klein ook, brengt je dichter bij je doelen!
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                flex: 1, 
                padding: '1rem', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                borderRadius: '14px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                cursor: 'pointer',
                minHeight: '52px'
              }}
            >
              Annuleer
            </button>
            <button 
              type="submit"
              disabled={saving}
              style={{ 
                flex: 1, 
                padding: '1rem', 
                background: saving 
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                border: 'none', 
                borderRadius: '14px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                fontWeight: '700', 
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: saving ? 'none' : '0 8px 25px rgba(245, 158, 11, 0.4)',
                minHeight: '52px'
              }}
            >
              🏆 Win Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
