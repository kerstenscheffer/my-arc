// src/modules/output-planning/components/content-library/LibraryView.jsx
// Library View - MOBILE OPTIMIZED

import {
  Library,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react'
import { GOLD, CONTENT_TYPES, LIBRARY_CATEGORIES } from './constants'

export default function LibraryView({ 
  content, 
  allContent, 
  activeCategory, 
  setActiveCategory, 
  onEdit, 
  onDelete, 
  onCopyLink, 
  copiedId, 
  isMobile 
}) {
  return (
    <div>
      {/* Category Tabs - 2x3 Grid on mobile */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)',
        gap: '0.375rem', 
        marginBottom: '1rem'
      }}>
        {LIBRARY_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: isMobile ? '0.625rem 0.5rem' : '0.5rem 1rem',
              background: activeCategory === cat.id 
                ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)` 
                : 'rgba(255, 255, 255, 0.03)',
              border: activeCategory === cat.id 
                ? `1px solid ${GOLD.primary}` 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: activeCategory === cat.id ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
              fontWeight: activeCategory === cat.id ? '700' : '500',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Content Grid */}
      {content.length === 0 ? (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px'
        }}>
          <Library size={36} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Geen content in deze categorie
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {content.map(item => {
            const TypeIcon = CONTENT_TYPES[item.content_type]?.icon || FileText
            const typeColor = CONTENT_TYPES[item.content_type]?.color || '#fff'
            
            return (
              <div 
                key={item.id} 
                style={{
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
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
                      marginBottom: '0.125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                      {LIBRARY_CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {item.description && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.75rem',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.description}
                  </div>
                )}
                
                {/* Actions - Vertical stack on mobile */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '0.5rem' 
                }}>
                  {item.link && (
                    <>
                      <button 
                        onClick={() => window.open(item.link, '_blank')} 
                        style={{
                          flex: isMobile ? 'none' : 1,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.5rem',
                          padding: '0.625rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '8px',
                          color: '#3b82f6',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          minHeight: '44px'
                        }}
                      >
                        <ExternalLink size={16} />
                        Openen
                      </button>
                      <button 
                        onClick={() => onCopyLink(item.link, item.id)} 
                        style={{
                          flex: isMobile ? 'none' : 'none',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem',
                          width: isMobile ? '100%' : '44px',
                          height: '44px',
                          background: copiedId === item.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          border: copiedId === item.id ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: copiedId === item.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                        {isMobile && (copiedId === item.id ? 'Gekopieerd!' : 'Link kopiëren')}
                      </button>
                    </>
                  )}
                  
                  {/* Edit & Delete row */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: item.link && isMobile ? '0.25rem' : 0
                  }}>
                    <button 
                      onClick={() => onEdit(item)} 
                      style={{
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem',
                        height: '44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Edit3 size={16} />
                      {isMobile && 'Bewerken'}
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)} 
                      style={{
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem',
                        height: '44px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <Trash2 size={16} />
                      {isMobile && 'Verwijderen'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
