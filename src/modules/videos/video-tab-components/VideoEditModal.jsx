// src/modules/videos/video-tab-components/VideoEditModal.jsx
import React, { useState } from 'react'
import { Edit, X, Globe, Home, Dumbbell, Apple, Phone, Trophy, TrendingUp } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

const PAGE_OPTIONS = [
  { value: 'home', label: 'Home', icon: Home, color: '#3b82f6' },
  { value: 'workout', label: 'Workout', icon: Dumbbell, color: '#f97316' },
  { value: 'meals', label: 'Meals', icon: Apple, color: '#10b981' },
  { value: 'calls', label: 'Calls', icon: Phone, color: '#3b82f6' },
  { value: 'challenges', label: 'Challenges', icon: Trophy, color: '#dc2626' },
  { value: 'progress', label: 'Progress', icon: TrendingUp, color: '#8b5cf6' }
]

export default function VideoEditModal({ video, onClose, onSave }) {
  const [defaultPages, setDefaultPages] = useState(video.default_pages || [])
  const [saving, setSaving] = useState(false)
  
  const isMobile = useIsMobile()
  
  const togglePage = (pageValue) => {
    if (defaultPages.includes(pageValue)) {
      setDefaultPages(defaultPages.filter(p => p !== pageValue))
    } else {
      setDefaultPages([...defaultPages, pageValue])
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await videoService.updateVideo(video.id, {
        default_pages: defaultPages
      })
      
      if (result.success) {
        await onSave()
        onClose()
      } else {
        alert('Fout bij opslaan: ' + (result.error || 'Onbekend'))
      }
    } catch (error) {
      console.error('Error updating video:', error)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Edit size={20} style={{ color: '#10b981' }} />
            Standaard Pagina's
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Video Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {video.title}
          </h4>
          {video.description && (
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)'
            }}>
              {video.description}
            </p>
          )}
        </div>
        
        {/* Explanation */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Globe size={16} color="#10b981" />
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              Standaard Video's
            </span>
          </div>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.4',
            margin: 0
          }}>
            Selecteer op welke pagina's deze video automatisch zichtbaar moet zijn voor alle clients. Ideaal voor uitleg/onboarding video's.
          </p>
        </div>
        
        {/* Page Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.75rem'
          }}>
            Standaard zichtbaar op:
          </label>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '0.75rem'
          }}>
            {PAGE_OPTIONS.map(page => {
              const isSelected = defaultPages.includes(page.value)
              const PageIcon = page.icon
              
              return (
                <button
                  key={page.value}
                  onClick={() => togglePage(page.value)}
                  style={{
                    padding: '0.875rem',
                    background: isSelected
                      ? `linear-gradient(135deg, ${page.color}25 0%, ${page.color}10 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? page.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile && !isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile && !isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: isSelected 
                      ? `linear-gradient(135deg, ${page.color} 0%, ${page.color}dd 100%)`
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isSelected ? page.color : 'rgba(255,255,255,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path 
                          d="M2 6L5 9L10 3" 
                          stroke="white" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected 
                      ? `${page.color}20`
                      : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <PageIcon 
                      size={16} 
                      color={isSelected ? page.color : 'rgba(255,255,255,0.4)'}
                    />
                  </div>
                  
                  {/* Label */}
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: isSelected ? page.color : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.3s ease',
                    flex: 1,
                    textAlign: 'left'
                  }}>
                    {page.label}
                  </span>
                </button>
              )
            })}
          </div>
          
          {/* Selected count */}
          {defaultPages.length > 0 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Globe size={14} />
              Standaard op {defaultPages.length} pagina{defaultPages.length !== 1 ? "'s" : ''}
            </div>
          )}
        </div>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: saving ? 0.5 : 1,
              minHeight: '44px'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: saving
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
              border: 'none',
              borderRadius: '8px',
              color: saving ? 'rgba(255,255,255,0.4)' : '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 0.95,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '44px'
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
