// src/modules/lead-pic-generator/components/EditPanels/shared/ListEditor.jsx
import React from 'react'
import { Plus, X, GripVertical } from 'lucide-react'

export default function ListEditor({
  items = [],
  onUpdate,
  maxItems = 5,
  minItems = 1,
  placeholder = 'Nieuw item...',
  itemType = 'text', // 'text' or 'testimonial'
  isMobile
}) {
  
  const addItem = () => {
    if (items.length >= maxItems) return
    
    const newItem = itemType === 'testimonial' 
      ? { user: '@username', text: 'Testimonial...' }
      : 'Nieuw item'
    
    onUpdate([...items, newItem])
  }
  
  const removeItem = (index) => {
    if (items.length <= minItems) return
    onUpdate(items.filter((_, i) => i !== index))
  }
  
  const updateItem = (index, value) => {
    const updated = [...items]
    updated[index] = value
    onUpdate(updated)
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{
          display: 'flex',
          gap: '8px',
          alignItems: itemType === 'testimonial' ? 'flex-start' : 'center',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        }}>
          <GripVertical 
            size={16} 
            style={{ 
              color: 'rgba(255, 255, 255, 0.3)',
              cursor: 'grab',
              flexShrink: 0
            }} 
          />
          
          <div style={{ flex: 1 }}>
            {itemType === 'testimonial' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  value={item.user}
                  onChange={(e) => updateItem(index, {...item, user: e.target.value})}
                  placeholder="@gebruiker"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(index, {...item, text: e.target.value})}
                  placeholder="Testimonial tekst..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
            ) : (
              <input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            )}
          </div>
          
          {items.length > minItems && (
            <button 
              onClick={() => removeItem(index)}
              style={{
                padding: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <X size={14} style={{ color: '#ef4444' }} />
            </button>
          )}
        </div>
      ))}
      
      {items.length < maxItems && (
        <button 
          onClick={addItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
          }}
        >
          <Plus size={16} />
          Voeg {itemType === 'testimonial' ? 'testimonial' : 'item'} toe
        </button>
      )}
      
      <div style={{
        textAlign: 'right',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        {items.length}/{maxItems} {itemType === 'testimonial' ? 'testimonials' : 'items'}
      </div>
    </div>
  )
}
