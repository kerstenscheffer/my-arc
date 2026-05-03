// src/modules/lead-messages/components/SearchBar.jsx
import React from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Zoek berichten..." 
}) {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: isMobile ? '0.75rem 0' : '1rem 0',
      background: 'linear-gradient(180deg, #000 0%, #000 80%, transparent 100%)',
      marginBottom: '1rem'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          left: '1rem',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          color: 'rgba(255,255,255,0.4)'
        }}>
          <Search size={20} />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 2.75rem' : '1rem 3rem',
            paddingRight: value ? '3rem' : '1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            minHeight: '48px',
            touchAction: 'manipulation'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
            e.target.style.background = 'rgba(16, 185, 129, 0.05)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)'
            e.target.style.background = 'rgba(255,255,255,0.05)'
          }}
        />
        
        {value && (
          <button
            onClick={onClear}
            style={{
              position: 'absolute',
              right: '0.75rem',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {value && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)',
          paddingLeft: '0.25rem'
        }}>
          Zoeken naar: <span style={{ color: '#10b981' }}>"{value}"</span>
        </div>
      )}
    </div>
  )
}
