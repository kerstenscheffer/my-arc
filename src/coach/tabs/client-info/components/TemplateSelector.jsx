// src/coach/tabs/client-info/components/TemplateSelector.jsx
import { useState } from 'react'
import { X, FileText, ChevronRight, Search } from 'lucide-react'
import { TEMPLATE_REGISTRY } from './templates/TemplateRegistry'

export default function TemplateSelector({ isMobile, onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // Get unique categories from templates
  const categories = [...new Set(TEMPLATE_REGISTRY.map(t => t.category))]
  
  // Filter templates
  const filteredTemplates = TEMPLATE_REGISTRY.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '700px',
        height: isMobile ? '100vh' : 'auto',
        maxHeight: isMobile ? '100vh' : '90vh',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
        borderRadius: isMobile ? 0 : '16px',
        border: isMobile ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: isMobile ? '40px' : '48px',
                height: isMobile ? '40px' : '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}>
                <FileText size={isMobile ? 20 : 24} color="#10b981" />
              </div>
              
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: 0,
                  marginBottom: '0.15rem'
                }}>
                  Note Templates
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  {filteredTemplates.length} templates available
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                minWidth: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Search bar */}
          <div style={{
            position: 'relative',
            marginBottom: '1rem'
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.4)'
            }} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1rem 0.875rem 3rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                e.target.style.background = 'rgba(0, 0, 0, 0.7)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(0, 0, 0, 0.5)'
              }}
            />
          </div>
          
          {/* Category filters */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.25rem'
          }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                background: !selectedCategory 
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${!selectedCategory ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '8px',
                color: !selectedCategory ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: !selectedCategory ? '600' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              All
            </button>
            
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                  background: selectedCategory === cat 
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedCategory === cat ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: selectedCategory === cat ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: selectedCategory === cat ? '600' : '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Template List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {filteredTemplates.length === 0 ? (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center'
            }}>
              <FileText size={48} color="#10b981" style={{ 
                margin: '0 auto 1rem', 
                opacity: 0.3 
              }} />
              <p style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.9rem' : '0.95rem'
              }}>
                No templates found
              </p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {filteredTemplates.map(template => {
                const Icon = template.icon
                
                return (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: isMobile ? '1rem' : '1.25rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    {/* Top accent line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${template.color} 0%, transparent 100%)`,
                      opacity: 0.6
                    }} />
                    
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: isMobile ? '44px' : '52px',
                        height: isMobile ? '44px' : '52px',
                        borderRadius: '12px',
                        background: `${template.color}15`,
                        border: `1px solid ${template.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 0 15px ${template.color}20`
                      }}>
                        <Icon size={isMobile ? 22 : 26} color={template.color} />
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: '600',
                          color: '#fff',
                          margin: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {template.name}
                        </h4>
                        
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          margin: 0,
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {template.description}
                        </p>
                        
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            background: `${template.color}15`,
                            borderRadius: '6px',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: template.color,
                            fontWeight: '600'
                          }}>
                            {template.category}
                          </span>
                          
                          <span style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: 'rgba(255, 255, 255, 0.4)'
                          }}>
                            {template.sections?.length || 0} sections
                          </span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight 
                        size={20} 
                        color="rgba(255, 255, 255, 0.3)" 
                        style={{ flexShrink: 0 }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
