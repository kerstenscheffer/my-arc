// src/modules/progress-photos/components/PhotoGallery.jsx
// v3.0 - ONLY PROGRESS TYPE - No filter chips, clean flush gallery
// Props IDENTIEK: { photos, onDelete, isMobile }

import React, { useState } from 'react'
import { Grid, Calendar, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'

export default function PhotoGallery({ photos = {}, onDelete, isMobile = false }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  
  const dates = Object.keys(photos).sort((a, b) => new Date(b) - new Date(a))
  const displayDates = expanded ? dates : dates.slice(0, 3)
  const totalPhotos = dates.reduce((s, d) => s + (photos[d]?.length || 0), 0)

  const handleDelete = async (id, url) => {
    if (confirm('Foto verwijderen?')) await onDelete(id, url)
  }

  if (dates.length === 0) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '2.5rem', textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <Grid size={32} color="rgba(255, 215, 0, 0.15)" style={{ marginBottom: '0.5rem' }} />
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>
          Nog geen foto's
        </div>
        <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.25)' }}>
          Upload je eerste progressie foto
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── HEADER BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Grid size={12} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
            Galerij
          </span>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
            {totalPhotos}
          </span>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,215,0,0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
            padding: '0.2rem', fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '600',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
          {expanded ? 'Minder' : `Alle ${totalPhotos}`}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* ── PHOTO GRID ── */}
      <div style={{
        maxHeight: expanded ? 'none' : isMobile ? '280px' : '350px',
        overflow: expanded ? 'visible' : 'hidden',
        position: 'relative'
      }}>
        {displayDates.map((date, dateIdx) => {
          const dayPhotos = photos[date] || []
          if (dayPhotos.length === 0) return null
          const d = new Date(date)
          
          return (
            <div key={date} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {/* Date header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: isMobile ? '0.35rem 1rem' : '0.4rem 1.5rem'
              }}>
                <Calendar size={10} color="rgba(255,215,0,0.3)" />
                <span style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '500',
                  color: 'rgba(255,215,0,0.4)'
                }}>
                  {d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                {d.getDay() === 5 && (
                  <span style={{ fontSize: '0.45rem', fontWeight: '700', color: '#FFD700', textTransform: 'uppercase' }}>VR</span>
                )}
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${isMobile ? 4 : 6}, 1fr)`,
                gap: '2px',
                padding: isMobile ? '0 0.5rem 0.5rem' : '0 0.75rem 0.625rem'
              }}>
                {dayPhotos.map(photo => (
                  <div key={photo.id} onClick={() => setSelectedPhoto(photo)}
                    style={{
                      position: 'relative', paddingBottom: '100%',
                      overflow: 'hidden', cursor: 'pointer',
                      background: 'rgba(255, 215, 0, 0.02)'
                    }}>
                    <img src={photo.photo_url} alt="Progress"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }} loading="lazy" />
                    {/* Subtype label */}
                    {photo.metadata?.subtype && (
                      <div style={{
                        position: 'absolute', bottom: '1px', right: '1px',
                        background: 'rgba(0,0,0,0.8)', borderRadius: '2px',
                        padding: '0 2px', fontSize: '0.4rem', color: '#FFD700',
                        fontWeight: '700', textTransform: 'uppercase', lineHeight: 1.3
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

        {/* Fade */}
        {!expanded && dates.length > 3 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      {/* ── PHOTO MODAL ── */}
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(10px)'
          }}>
          <div style={{ maxWidth: '90%', maxHeight: '85vh', position: 'relative' }}>
            <img src={selectedPhoto.photo_url} alt="Photo"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }} />
            
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
              padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: '700', color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>
                Progressie {selectedPhoto.metadata?.subtype ? `— ${selectedPhoto.metadata.subtype}` : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(selectedPhoto.id, selectedPhoto.photo_url); setSelectedPhoto(null) }}
                  style={{
                    padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.8)',
                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    color: '#fff', fontSize: '0.65rem', fontWeight: '600'
                  }}>
                  <Trash2 size={12} /> Verwijder
                </button>
                <button onClick={() => setSelectedPhoto(null)}
                  style={{
                    padding: '0.35rem', background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center'
                  }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
