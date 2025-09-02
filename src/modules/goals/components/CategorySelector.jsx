// src/modules/goals/components/CategorySelector.jsx
import React from 'react'
import { X } from 'lucide-react'
import { goalCategories } from '../config'
import { isMobile } from '../config'

export function CategorySelector({ onSelect, onClose }) {
  const mobile = isMobile()
  
  return (
    <div style={{
      marginBottom: '1.5rem',
      padding: mobile ? '1rem' : '1.5rem',
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 style={{
        fontSize: mobile ? '1rem' : '1.2rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>Kies een categorie</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} color="#fff" />
        </button>
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: mobile ? '0.75rem' : '1rem'
      }}>
        {Object.entries(goalCategories).map(([key, category]) => {
          const IconComponent = category.icon
          
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                padding: mobile ? '1rem' : '1.5rem',
                background: category.darkGradient,
                border: `2px solid transparent`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (!mobile) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = `0 8px 20px ${category.color}44`
                }
              }}
              onMouseLeave={(e) => {
                if (!mobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
              onTouchStart={(e) => {
                if (mobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (mobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              <IconComponent size={mobile ? 28 : 32} color={category.color} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: mobile ? '0.9rem' : '1rem', fontWeight: 'bold', color: '#fff' }}>
                {category.name}
              </div>
              <div style={{ fontSize: mobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                {category.subcategories.length} opties
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

