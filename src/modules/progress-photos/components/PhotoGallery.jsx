// src/modules/progress-photos/components/PhotoGallery.jsx
// v3.1 - Subtype editing in modal + bolder subtype labels
// Props IDENTIEK: { photos, onDelete, onUpdateSubtype, isMobile }

import React, { useState } from 'react'
import { Grid, Calendar, Trash2, ChevronDown, ChevronUp, X, ArrowLeftRight, Check, Edit2 } from 'lucide-react'

const SUBTYPE_OPTIONS = [
  { value: 'front', label: 'Voorkant' },
  { value: 'side',  label: 'Zijkant'  },
  { value: 'back',  label: 'Achterkant' },
]

// Color per angle. Custom subtypes fall back to grey.
const ANGLE_COLOR = {
  front: '#FFD700',
  side:  '#f97316',
  back:  '#3b82f6',
}
const angleColor = (subtype) => ANGLE_COLOR[(subtype || '').toLowerCase()] || '#9ca3af'

export default function PhotoGallery({ photos = {}, onDelete, onUpdateSubtype, isMobile = false }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState([])
  const [editingSubtype, setEditingSubtype] = useState(false)
  const [subtypeSaving, setSubtypeSaving] = useState(false)

  const isCompareSelected = (photo) => comparePhotos.some(p => p.id === photo.id)

  const handlePhotoClick = (photo) => {
    if (!compareMode) { setSelectedPhoto(photo); return }
    if (isCompareSelected(photo)) {
      setComparePhotos(prev => prev.filter(p => p.id !== photo.id))
    } else if (comparePhotos.length < 2) {
      setComparePhotos(prev => [...prev, photo])
    } else {
      setComparePhotos([comparePhotos[1], photo])
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(v => !v)
    setComparePhotos([])
    setSelectedPhoto(null)
  }
  
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={toggleCompareMode}
            style={{
              background: compareMode ? 'rgba(255,215,0,0.12)' : 'none',
              border: compareMode ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
              borderRadius: '6px',
              color: compareMode ? '#FFD700' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '700',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>
            <ArrowLeftRight size={11} />
            {compareMode ? 'Stop' : 'Vergelijk'}
          </button>

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
      </div>

      {/* ── COMPARE INSTRUCTIONS + RESULT ── */}
      {compareMode && (
        <div>
          {comparePhotos.length < 2 ? (
            <div style={{
              padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
              background: 'rgba(255,215,0,0.04)',
              borderBottom: '1px solid rgba(255,215,0,0.08)',
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              color: 'rgba(255,215,0,0.55)', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <ArrowLeftRight size={11} color="#FFD700" style={{ opacity: 0.6 }} />
              {comparePhotos.length === 0 ? 'Tik op 2 foto\'s om te vergelijken' : 'Tik op een tweede foto'}
              {comparePhotos.length === 1 && (
                <button onClick={() => setComparePhotos([])}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }}>
                  <X size={13} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Side-by-side compare view */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px',
                background: 'rgba(0,0,0,0.6)',
              }}>
                {comparePhotos.map((photo, i) => {
                  const d = photo.taken_at || photo.created_at
                  const dateLabel = d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }) : ''
                  return (
                    <div key={photo.id} style={{ position: 'relative', aspectRatio: '3/4' }}>
                      <img src={photo.photo_url} alt={`Vergelijking ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '0.5rem 0.5rem 0.35rem',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#FFD700' }}>
                          {i === 0 ? 'VOOR' : 'NA'}
                        </span>
                        {dateLabel && (
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                            {dateLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ padding: '0.35rem 0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setComparePhotos([])}
                  style={{
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.55rem', fontWeight: 700, cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    touchAction: 'manipulation',
                  }}>
                  <X size={10} /> Reset selectie
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                {dayPhotos.map(photo => {
                  const selected = isCompareSelected(photo)
                  return (
                    <div key={photo.id} onClick={() => handlePhotoClick(photo)}
                      style={{
                        position: 'relative', paddingBottom: '100%',
                        overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255, 215, 0, 0.02)',
                        outline: selected ? '2px solid #FFD700' : 'none',
                        outlineOffset: '-2px',
                      }}>
                      <img src={photo.photo_url} alt="Progress"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none' }} loading="lazy" />
                      {/* Subtype label — color per angle */}
                      {photo.metadata?.subtype && (
                        <div style={{
                          position: 'absolute', bottom: '2px', right: '2px',
                          background: 'rgba(0,0,0,0.85)', borderRadius: '3px',
                          padding: '1px 4px', fontSize: '0.55rem',
                          color: '#fff',
                          fontWeight: '800', textTransform: 'uppercase', lineHeight: 1.3,
                          letterSpacing: '0.04em',
                          borderLeft: `2px solid ${angleColor(photo.metadata.subtype)}`,
                        }}>
                          {photo.metadata.subtype.slice(0, 3)}
                        </div>
                      )}
                      {/* Compare checkmark */}
                      {compareMode && (
                        <div style={{
                          position: 'absolute', top: '2px', left: '2px',
                          width: 18, height: 18, borderRadius: 4,
                          background: selected ? '#FFD700' : 'rgba(0,0,0,0.5)',
                          border: selected ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <Check size={10} color="#000" strokeWidth={3} />}
                        </div>
                      )}
                    </div>
                  )
                })}
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
        <div onClick={() => { setSelectedPhoto(null); setEditingSubtype(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(10px)'
          }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '85vh', position: 'relative' }}>
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
                {onUpdateSubtype && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingSubtype(v => !v) }}
                    style={{
                      padding: '0.35rem 0.5rem', background: editingSubtype ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '6px', border: editingSubtype ? '1px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                      color: editingSubtype ? '#FFD700' : '#fff', fontSize: '0.65rem', fontWeight: '600'
                    }}>
                    <Edit2 size={12} /> Hoek
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(selectedPhoto.id, selectedPhoto.photo_url); setSelectedPhoto(null); setEditingSubtype(false) }}
                  style={{
                    padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.8)',
                    borderRadius: '6px', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    color: '#fff', fontSize: '0.65rem', fontWeight: '600'
                  }}>
                  <Trash2 size={12} /> Verwijder
                </button>
                <button onClick={() => { setSelectedPhoto(null); setEditingSubtype(false) }}
                  style={{
                    padding: '0.35rem', background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center'
                  }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Subtype edit panel */}
            {editingSubtype && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.9)', borderRadius: '0 0 4px 4px',
                padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Hoek aanpassen
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {SUBTYPE_OPTIONS.map(opt => {
                    const isCurrent = (selectedPhoto.metadata?.subtype || selectedPhoto.photo_type) === opt.value
                    return (
                      <button
                        key={opt.value}
                        disabled={subtypeSaving}
                        onClick={async (e) => {
                          e.stopPropagation()
                          setSubtypeSaving(true)
                          try {
                            await onUpdateSubtype(selectedPhoto.id, opt.value)
                            setSelectedPhoto(prev => ({
                              ...prev,
                              photo_type: opt.value,
                              metadata: { ...(prev.metadata || {}), subtype: opt.value },
                            }))
                            setEditingSubtype(false)
                          } finally { setSubtypeSaving(false) }
                        }}
                        style={{
                          flex: 1, padding: '0.5rem',
                          background: isCurrent ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: isCurrent ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px', cursor: subtypeSaving ? 'wait' : 'pointer',
                          color: isCurrent ? '#FFD700' : '#fff',
                          fontSize: '0.7rem', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {subtypeSaving ? '…' : opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
