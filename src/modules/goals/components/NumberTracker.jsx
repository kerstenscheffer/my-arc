
// ============================================
// src/modules/goals/components/NumberTracker.jsx
// ============================================
import React from 'react'
import { goalCategories } from '../config'
import { isMobile } from '../config'

export function NumberTracker({ goal, currentValue, loading, onChange, onUpdate }) {
  const mobile = isMobile()
  const categoryConfig = goalCategories[goal.category || goal.main_category] || goalCategories.structuur
  
  return (
    <div>
      <label style={{ 
        fontSize: mobile ? '0.8rem' : '0.875rem', 
        color: 'rgba(255,255,255,0.6)' 
      }}>
        Huidige waarde ({goal.unit})
      </label>
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginTop: '0.5rem' 
      }}>
        <input
          type="number"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: mobile ? '0.6rem' : '0.75rem',
            background: 'rgba(255,255,255,0.1)',
            border: `1px solid ${categoryConfig.color}33`,
            borderRadius: '8px',
            color: '#fff',
            fontSize: mobile ? '1rem' : '1.25rem'
          }}
        />
        <button
          onClick={onUpdate}
          disabled={loading}
          style={{
            padding: mobile ? '0 1rem' : '0 1.5rem',
            background: categoryConfig.gradient,
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 'bold',
            cursor: loading ? 'wait' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          {loading ? '...' : 'Update'}
        </button>
      </div>
    </div>
  )
}
