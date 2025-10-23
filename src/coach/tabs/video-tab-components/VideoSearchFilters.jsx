// src/coach/tabs/video-tab-components/VideoSearchFilters.jsx
import React from 'react'
import { Search } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'

export default function VideoSearchFilters({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory,
  categories 
}) {
  const isMobile = useIsMobile()
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {/* Search */}
      <div style={{
        flex: 1,
        position: 'relative'
      }}>
        <Search 
          size={18} 
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)'
          }}
        />
        <input
          type="text"
          placeholder="Zoek videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.75rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.95rem'
          }}
        />
      </div>
      
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedCategory === 'all' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${selectedCategory === 'all' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px',
            color: selectedCategory === 'all' ? '#10b981' : 'rgba(255,255,255,0.6)',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          Alle
        </button>
        {categories.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedCategory === cat.value
                  ? `linear-gradient(135deg, ${cat.color}33 0%, ${cat.color}11 100%)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedCategory === cat.value ? cat.color + '88' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: selectedCategory === cat.value ? cat.color : 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
