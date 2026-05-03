// src/modules/output-planning/components/content-library/LibraryModal.jsx
// Library Modal - MOBILE OPTIMIZED (Bottom Sheet)

import { useState } from 'react'
import { X, Link, Save } from 'lucide-react'
import { GOLD, CONTENT_TYPES, LIBRARY_CATEGORIES } from './constants'

export default function LibraryModal({ item, onClose, onSave, isMobile }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    content_type: item?.content_type || 'video',
    category: item?.category || 'voeding',
    description: item?.description || '',
    link: item?.link || ''
  })

  const handleSubmit = () => {
    if (!formData.title.trim()) { 
      alert('Titel is verplicht')
      return 
    }
    onSave(formData)
  }

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: isMobile ? 'flex-end' : 'center', 
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem', 
      zIndex: 1000
    }}>
      <div style={{
        width: '100%', 
        maxWidth: isMobile ? '100%' : '500px', 
        maxHeight: isMobile ? '90vh' : '90vh', 
        overflow: 'auto',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px', 
        border: `1px solid ${GOLD.border}`, 
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Top accent line */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '3px', 
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)` 
        }} />
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: isMobile ? '1rem' : '1.25rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'sticky',
          top: 0,
          background: '#1a1a1a',
          zIndex: 10
        }}>
          <h3 style={{ 
            fontSize: isMobile ? '1rem' : '1.25rem', 
            fontWeight: '700', 
            color: '#fff', 
            margin: 0 
          }}>
            {item ? 'Content bewerken' : 'Nieuwe content'}
          </h3>
          <button 
            onClick={onClose} 
            style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '44px', 
              height: '44px',
              background: 'rgba(255, 255, 255, 0.05)', 
              border: 'none', 
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)', 
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          {/* Type Selection - 2 columns */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Type
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.5rem' 
            }}>
              {Object.entries(CONTENT_TYPES).map(([key, val]) => {
                const Icon = val.icon
                const isSelected = formData.content_type === key
                return (
                  <button 
                    key={key} 
                    onClick={() => setFormData({ ...formData, content_type: key })} 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      padding: '0.75rem',
                      background: isSelected ? `${val.color}20` : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `2px solid ${val.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '48px'
                    }}
                  >
                    <Icon size={18} color={val.color} />
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      color: isSelected ? val.color : 'rgba(255, 255, 255, 0.7)' 
                    }}>
                      {val.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Titel *
            </label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Bijv: Hoe bereken je je calorieën" 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.9rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          {/* Category */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Categorie
            </label>
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.9rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }}
            >
              {LIBRARY_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#1a1a1a' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Beschrijving
            </label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Korte beschrijving..." 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.9rem', 
                resize: 'vertical', 
                minHeight: '80px', 
                outline: 'none',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          {/* Link */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              <Link size={14} />
              Link
            </label>
            <input 
              type="url" 
              value={formData.link} 
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://instagram.com/p/..." 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px', 
                color: '#fff', 
                fontSize: '0.9rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          {/* Actions - Always stacked */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.75rem' 
          }}>
            <button 
              onClick={handleSubmit} 
              style={{
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                padding: '0.875rem',
                background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                border: 'none', 
                borderRadius: '10px', 
                color: '#000', 
                fontWeight: '700', 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '52px'
              }}
            >
              <Save size={18} /> 
              Opslaan
            </button>
            <button 
              onClick={onClose} 
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontWeight: '600', 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '52px'
              }}
            >
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
