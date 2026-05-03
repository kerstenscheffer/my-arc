// src/modules/output-planning/components/content-library/IdeasView.jsx
// Ideas View - MOBILE OPTIMIZED

import {
  Search,
  X,
  Lightbulb,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react'
import { GOLD, CONTENT_TYPES } from './constants'

export default function IdeasView({ 
  ideas, 
  onDelete, 
  onEdit, 
  filterType, 
  setFilterType, 
  searchQuery, 
  setSearchQuery, 
  isMobile 
}) {
  const filteredIdeas = ideas.filter(idea => {
    if (filterType !== 'all' && idea.type !== filterType) return false
    if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Search - Full width */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: isMobile ? '0.75rem' : '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minHeight: '48px'
        }}>
          <Search size={18} color="rgba(255, 255, 255, 0.4)" />
          <input
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoeken..." 
            style={{
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              outline: 'none',
              color: '#fff', 
              fontSize: isMobile ? '0.9rem' : '0.95rem'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.4)', 
                cursor: 'pointer', 
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* Filters - 2x2 Grid on mobile */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.5rem', 
        marginBottom: '1rem'
      }}>
        {['all', 'reel', 'carousel', 'post'].map(type => (
          <button 
            key={type} 
            onClick={() => setFilterType(type)} 
            style={{
              padding: isMobile ? '0.625rem' : '0.5rem 1rem',
              background: filterType === type 
                ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)` 
                : 'rgba(255, 255, 255, 0.03)',
              border: filterType === type 
                ? `1px solid ${GOLD.primary}` 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: filterType === type ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
              fontWeight: filterType === type ? '700' : '500',
              fontSize: isMobile ? '0.8rem' : '0.8rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            {type === 'all' ? 'Alle' : CONTENT_TYPES[type]?.label}
          </button>
        ))}
      </div>
      
      {/* Ideas List */}
      {filteredIdeas.length === 0 ? (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px'
        }}>
          <Lightbulb size={36} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Geen ideeën gevonden
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredIdeas.map(idea => {
            const TypeIcon = CONTENT_TYPES[idea.type]?.icon || FileText
            const typeColor = CONTENT_TYPES[idea.type]?.color || '#fff'
            
            return (
              <div 
                key={idea.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px',
                  background: `${typeColor}20`, 
                  border: `1px solid ${typeColor}40`,
                  flexShrink: 0
                }}>
                  <TypeIcon size={18} color={typeColor} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {idea.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: typeColor
                  }}>
                    {CONTENT_TYPES[idea.type]?.label}
                  </div>
                </div>
                
                {/* Action Buttons - Vertical on mobile when needed */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '0.375rem' 
                }}>
                  <button 
                    onClick={() => onEdit(idea)} 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '44px', 
                      height: '44px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(idea.id)} 
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '44px', 
                      height: '44px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
