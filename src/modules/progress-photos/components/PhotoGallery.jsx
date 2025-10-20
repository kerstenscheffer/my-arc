// src/modules/progress-photos/components/PhotoGallery.jsx
import React, { useState } from 'react'
import { Grid, Calendar, Trash2, ChevronDown, ChevronUp, Eye, X } from 'lucide-react'

export default function PhotoGallery({ 
  photos = {}, 
  onDelete,
  isMobile = false 
}) {
  const [expanded, setExpanded] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  
  // Get dates and limit if not expanded
  const dates = Object.keys(photos).sort((a, b) => new Date(b) - new Date(a))
  const displayDates = expanded ? dates : dates.slice(0, 3)
  
  // Count total photos
  const totalPhotos = dates.reduce((sum, date) => {
    const dayPhotos = photos[date] || []
    return sum + dayPhotos.length
  }, 0)

  const handleDelete = async (photoId, photoUrl) => {
    if (confirm('Weet je zeker dat je deze foto wilt verwijderen?')) {
      await onDelete(photoId, photoUrl)
    }
  }

  const typeColors = {
    progress: '#8b5cf6',
    meal: '#10b981',
    workout: '#f97316',
    victory: '#fbbf24'
  }

  const typeLabels = {
    all: 'Alles',
    progress: 'Progressie',
    meal: 'Maaltijd',
    workout: 'Workout',
    victory: 'Victory'
  }

  if (dates.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center',
        border: '1px solid rgba(139, 92, 246, 0.08)',
        marginTop: '0.5rem'
      }}>
        <Grid size={40} color="rgba(139, 92, 246, 0.2)" style={{ marginBottom: '0.75rem' }} />
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600',
          color: 'white',
          marginBottom: '0.25rem'
        }}>
          Nog geen foto's
        </div>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(139, 92, 246, 0.5)'
        }}>
          Upload je eerste foto om te beginnen
        </div>
      </div>
    )
  }

  return (
    <div style={{
      marginTop: '0.5rem'
    }}>
      {/* Header - Minimal */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        padding: '0 0.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          color: 'rgba(139, 92, 246, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Grid size={14} color="#8b5cf6" opacity={0.7} />
          Galerij
          <span style={{
            color: 'rgba(139, 92, 246, 0.4)',
            fontWeight: '400'
          }}>
            {totalPhotos} foto's
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '0.375rem 0.625rem',
            background: 'transparent',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '8px',
            color: '#8b5cf6',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Minder
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Alle {totalPhotos}
            </>
          )}
        </button>
      </div>

      {/* Filter Chips - Compact */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        marginBottom: '0.75rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {['all', 'progress', 'meal', 'workout', 'victory'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: isMobile ? '0.375rem 0.625rem' : '0.375rem 0.75rem',
              background: filterType === type 
                ? `linear-gradient(135deg, ${typeColors[type] || '#8b5cf6'}20 0%, ${typeColors[type] || '#8b5cf6'}10 100%)`
                : 'rgba(255, 255, 255, 0.03)',
              border: filterType === type 
                ? `1px solid ${typeColors[type] || '#8b5cf6'}30`
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: filterType === type 
                ? (typeColors[type] || '#8b5cf6')
                : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: filterType === type ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Photo Grid Container */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.3) 0%, rgba(10, 10, 10, 0.3) 100%)',
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '0.75rem' : '1rem',
        border: '1px solid rgba(139, 92, 246, 0.08)',
        maxHeight: expanded ? 'none' : isMobile ? '320px' : '400px',
        overflow: expanded ? 'visible' : 'hidden',
        position: 'relative'
      }}>
        {displayDates.map((date, dateIdx) => {
          const dayPhotos = photos[date] || []
          const dateObj = new Date(date)
          
          // Filter photos if filter is active
          const filteredPhotos = filterType === 'all' 
            ? dayPhotos
            : dayPhotos.filter(p => p.photo_type === filterType)
          
          if (filteredPhotos.length === 0) return null
          
          return (
            <div key={date} style={{
              marginBottom: dateIdx < displayDates.length - 1 ? '1rem' : 0
            }}>
              {/* Date Header - Compact */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <Calendar size={12} color="rgba(139, 92, 246, 0.4)" />
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(139, 92, 246, 0.5)',
                  fontWeight: '500'
                }}>
                  {dateObj.toLocaleDateString('nl-NL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                {dateObj.getDay() === 5 && (
                  <span style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '4px',
                    padding: '0.125rem 0.375rem',
                    fontSize: isMobile ? '0.6rem' : '0.65rem',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    Vrijdag
                  </span>
                )}
              </div>

              {/* Photos Grid - Compact */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${isMobile ? 6 : 10}, 1fr)`,
                gap: '0.375rem'
              }}>
                {filteredPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    style={{
                      position: 'relative',
                      paddingBottom: '100%',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: `1px solid ${typeColors[photo.photo_type]}20`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: `${typeColors[photo.photo_type]}05`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.borderColor = `${typeColors[photo.photo_type]}40`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderColor = `${typeColors[photo.photo_type]}20`
                    }}
                  >
                    <img
                      src={photo.photo_url}
                      alt={photo.photo_type}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    
                    {/* Type Indicator Dot */}
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: '3px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: typeColors[photo.photo_type],
                      boxShadow: '0 0 0 1.5px rgba(0,0,0,0.5)'
                    }} />
                    
                    {/* Subtype for progress photos */}
                    {photo.photo_type === 'progress' && photo.metadata?.subtype && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: 'rgba(0,0,0,0.8)',
                        borderRadius: '3px',
                        padding: '0px 3px',
                        fontSize: '0.5rem',
                        color: 'white',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        lineHeight: '1.2'
                      }}>
                        {photo.metadata.subtype[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Fade overlay if not expanded */}
        {!expanded && dates.length > 3 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'linear-gradient(to top, rgba(10, 10, 10, 0.9), transparent)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{
            maxWidth: '90%',
            maxHeight: '85vh',
            position: 'relative'
          }}>
            <img
              src={selectedPhoto.photo_url}
              alt="Photo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '12px',
                objectFit: 'contain'
              }}
            />
            
            {/* Modal Header Bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
              padding: '1rem',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {/* Type Badge */}
              <div style={{
                background: `${typeColors[selectedPhoto.photo_type]}20`,
                border: `1px solid ${typeColors[selectedPhoto.photo_type]}40`,
                borderRadius: '6px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                color: typeColors[selectedPhoto.photo_type],
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {typeLabels[selectedPhoto.photo_type]}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(selectedPhoto.id, selectedPhoto.photo_url)
                    setSelectedPhoto(null)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  <Trash2 size={14} />
                  Verwijder
                </button>
                
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
