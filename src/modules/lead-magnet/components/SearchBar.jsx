// src/modules/lead-magnet/components/SearchBar.jsx
import React from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({ searchQuery, setSearchQuery, isMobile }) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#000',
      paddingBottom: '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search 
          size={20} 
          color="rgba(255,255,255,0.4)"
          style={{
            position: 'absolute',
            left: '1rem',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Zoek op onderwerp... (voeding, bulk, cut, tijd)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '1rem 3rem 1rem 3rem' : '1.1rem 3.5rem 1.1rem 3.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#10b981'
            e.target.style.background = 'rgba(16, 185, 129, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)'
            e.target.style.background = 'rgba(255,255,255,0.05)'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <X size={16} color="#fff" />
          </button>
        )}
      </div>
    </div>
  )
}
