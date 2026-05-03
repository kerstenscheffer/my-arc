// src/modules/output-planning/components/content-library/PlanningModal.jsx
// Planning Modal - MOBILE OPTIMIZED (Bottom Sheet)
// UPDATED: Opens StoryModal when type='story' is selected

import { useState } from 'react'
import { X } from 'lucide-react'
import { GOLD, CONTENT_TYPES, CATEGORIES } from './constants'
import StoryModal from './StoryModal'

export default function PlanningModal({ item, onClose, onSave, currentWeekMonday, isMobile }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    type: item?.type || 'reel',
    category: item?.category || 'lifestyle',
    hook: item?.hook || '',
    script: item?.script || '',
    planned_date: item?.planned_date || '',
    status: item?.status || 'idea'
  })
  
  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false)

  // Handle type change - if story, open StoryModal
  const handleTypeChange = (type) => {
    if (type === 'story') {
      setShowStoryModal(true)
    } else {
      setFormData({ ...formData, type })
    }
  }

  // Handle story save from StoryModal
  const handleStorySave = (storyItems) => {
    // storyItems is an array of story data objects
    // Pass them to parent to save
    if (storyItems && storyItems.length > 0) {
      // If multiple items (planned for multiple days), save all
      onSave(storyItems, { isMultiple: true })
    }
    setShowStoryModal(false)
  }

  const handleSubmit = () => {
    if (!formData.title.trim()) { 
      alert('Titel is verplicht')
      return 
    }
    onSave(formData)
  }

  // If StoryModal is open, render that instead
  if (showStoryModal) {
    return (
      <StoryModal
        onClose={() => setShowStoryModal(false)}
        onSave={handleStorySave}
        currentWeekMonday={currentWeekMonday}
        isMobile={isMobile}
      />
    )
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
              Type *
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.5rem' 
            }}>
              {Object.entries(CONTENT_TYPES).map(([key, val]) => {
                const Icon = val.icon
                const isSelected = formData.type === key
                const isStory = key === 'story'
                
                return (
                  <button 
                    key={key} 
                    onClick={() => handleTypeChange(key)} 
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
                      minHeight: '48px',
                      position: 'relative'
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
                    {/* Story indicator - opens separate modal */}
                    {isStory && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        fontSize: '0.55rem',
                        padding: '0.125rem 0.25rem',
                        background: 'rgba(236, 72, 153, 0.3)',
                        borderRadius: '4px',
                        color: '#ec4899'
                      }}>
                        📱
                      </span>
                    )}
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
              placeholder="Bijv: Bulking 101" 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px', 
                color: '#fff', 
                fontSize: '0.95rem', 
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
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }}
            >
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <option key={key} value={key} style={{ background: '#1a1a1a' }}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Hook */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Hook / Eerste zin
            </label>
            <input 
              type="text" 
              value={formData.hook} 
              onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
              placeholder="Bijv: Discipline bestaat niet." 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          {/* Script */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Script
            </label>
            <textarea 
              value={formData.script} 
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              placeholder="Volledige script..." 
              rows={4} 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                outline: 'none', 
                resize: 'vertical',
                boxSizing: 'border-box',
                minHeight: '100px'
              }} 
            />
          </div>
          
          {/* Date */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginBottom: '0.5rem' 
            }}>
              Geplande datum
            </label>
            <input 
              type="date" 
              value={formData.planned_date} 
              onChange={(e) => setFormData({ 
                ...formData, 
                planned_date: e.target.value, 
                status: e.target.value ? 'planned' : 'idea' 
              })} 
              style={{
                width: '100%', 
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px', 
                color: '#fff', 
                fontSize: '0.95rem', 
                outline: 'none',
                minHeight: '48px',
                boxSizing: 'border-box'
              }} 
            />
          </div>
          
          {/* Actions - Always stacked on mobile */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.75rem' 
          }}>
            <button 
              onClick={handleSubmit} 
              style={{
                width: '100%',
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
              {item ? 'Opslaan' : 'Toevoegen'}
            </button>
            <button 
              onClick={onClose} 
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
