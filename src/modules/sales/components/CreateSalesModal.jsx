// src/modules/sales/components/CreateSalesModal.jsx
// Modal voor het aanmaken/bewerken van sales pieces
// Goud-bruine styling

import { useState, useEffect } from 'react'
import { X, DollarSign, Sparkles, Type, AlignLeft, Tag, Zap } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

// Sales types
const SALES_TYPES = [
  { id: 'announcement', label: 'Announcement', icon: '📢', description: 'Nieuwe dienst/product' },
  { id: 'promotion', label: 'Promotion', icon: '🎁', description: 'Kortingsactie' },
  { id: 'testimonial', label: 'Testimonial', icon: '💬', description: 'Review/resultaat' },
  { id: 'urgency', label: 'Urgency', icon: '🔥', description: 'Limited spots/time' },
  { id: 'educational', label: 'Educational', icon: '📚', description: 'Gratis waarde + pitch' }
]

export default function CreateSalesModal({ 
  isOpen, 
  onClose, 
  onSave,
  editPiece = null,
  isMobile 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sales_type: 'announcement',
    hook: '',
    caption: '',
    cta: '',
    color: 'gold'
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Load edit data
  useEffect(() => {
    if (editPiece) {
      setFormData({
        title: editPiece.title || '',
        description: editPiece.description || '',
        sales_type: editPiece.sales_type || 'announcement',
        hook: editPiece.hook || '',
        caption: editPiece.caption || '',
        cta: editPiece.cta || '',
        color: editPiece.color || 'gold'
      })
    }
  }, [editPiece])
  
  // Handle change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }
  
  // Validate
  const validate = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is verplicht'
    }
    
    if (!formData.sales_type) {
      newErrors.sales_type = 'Selecteer een type'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return
    
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
      setErrors({ submit: 'Opslaan mislukt. Probeer opnieuw.' })
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '1rem',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)',
          border: `1px solid ${SALES_THEME.border}`,
          borderRadius: isMobile ? '24px 24px 0 0' : '16px',
          width: isMobile ? '100%' : '100%',
          maxWidth: '600px',
          maxHeight: isMobile ? '90vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${SALES_THEME.glow}`
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem 1rem' : '1.5rem',
          borderBottom: `1px solid ${SALES_THEME.border}`,
          background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.3) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`
            }}>
              <DollarSign size={20} color="#000" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                {editPiece ? 'Edit Sales Piece' : 'Nieuw Sales Piece'}
              </h2>
              <p style={{
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                Voor announcements, promoties en meer
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* Title */}
          <FormField
            label="Title"
            icon={Type}
            error={errors.title}
            isMobile={isMobile}
          >
            <input
              type="text"
              placeholder="bijv. 'Nieuwe Online Coaching Lancering'"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              style={inputStyle(!!errors.title)}
            />
          </FormField>
          
          {/* Sales Type */}
          <FormField
            label="Type"
            icon={Tag}
            error={errors.sales_type}
            isMobile={isMobile}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {SALES_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleChange('sales_type', type.id)}
                  style={{
                    padding: '0.875rem',
                    background: formData.sales_type === type.id
                      ? `${SALES_THEME.primary}20`
                      : 'rgba(255, 255, 255, 0.03)',
                    border: formData.sales_type === type.id
                      ? `2px solid ${SALES_THEME.primary}`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: formData.sales_type === type.id 
                      ? SALES_THEME.primary 
                      : 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{type.icon}</span>
                    <span style={{ 
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}>
                      {type.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </FormField>
          
          {/* Description */}
          <FormField
            label="Beschrijving"
            icon={AlignLeft}
            isMobile={isMobile}
          >
            <textarea
              placeholder="Korte beschrijving van dit sales piece..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </FormField>
          
          {/* Hook */}
          <FormField
            label="Hook / Opener"
            icon={Zap}
            optional
            isMobile={isMobile}
          >
            <textarea
              placeholder="De openingszin die aandacht trekt..."
              value={formData.hook}
              onChange={(e) => handleChange('hook', e.target.value)}
              rows={2}
              style={inputStyle()}
            />
          </FormField>
          
          {/* CTA */}
          <FormField
            label="Call To Action"
            icon={Sparkles}
            optional
            isMobile={isMobile}
          >
            <input
              type="text"
              placeholder="bijv. 'DM me INTERESTED voor meer info'"
              value={formData.cta}
              onChange={(e) => handleChange('cta', e.target.value)}
              style={inputStyle()}
            />
          </FormField>
          
          {/* Caption */}
          <FormField
            label="Caption"
            icon={AlignLeft}
            optional
            isMobile={isMobile}
          >
            <textarea
              placeholder="Volledige caption voor de post..."
              value={formData.caption}
              onChange={(e) => handleChange('caption', e.target.value)}
              rows={4}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
          </FormField>
          
          {/* Error message */}
          {errors.submit && (
            <div style={{
              padding: '0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginTop: '1rem'
            }}>
              {errors.submit}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: `1px solid ${SALES_THEME.border}`,
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: saving 
                ? 'rgba(255, 255, 255, 0.1)'
                : `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: saving ? 'rgba(255, 255, 255, 0.3)' : '#000',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : `0 4px 20px ${SALES_THEME.glow}`
            }}
          >
            {saving ? 'Opslaan...' : editPiece ? 'Update' : 'Aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Form Field Component
function FormField({ label, icon: Icon, error, optional, children, isMobile }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        {Icon && <Icon size={16} color={SALES_THEME.primary} />}
        <label style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: '#fff'
        }}>
          {label}
        </label>
        {optional && (
          <span style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontStyle: 'italic'
          }}>
            (optioneel)
          </span>
        )}
      </div>
      
      {children}
      
      {error && (
        <div style={{
          marginTop: '0.375rem',
          fontSize: '0.75rem',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

// Input style helper
function inputStyle(hasError = false) {
  return {
    width: '100%',
    padding: '0.875rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: hasError 
      ? '1px solid #ef4444'
      : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  }
}
