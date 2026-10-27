// src/modules/progress-photos/components/PhotoGallery.jsx
// v3.1 - Subtype editing in modal + bolder subtype labels
// Props IDENTIEK: { photos, onDelete, onUpdateSubtype, isMobile }

import React, { useState } from 'react'
import { Grid, Calendar, Trash2, ChevronDown, ChevronUp, X, ArrowLeftRight, Check, Edit2 } from 'lucide-react'
import { fotoWeergaveUrl } from '../../progress/fotoWeergave'

const SUBTYPE_OPTIONS = [
  { value: 'front', label: 'Voorkant' },
  { value: 'side',  label: 'Zijkant'  },
  { value: 'back',  label: 'Achterkant' },
]


export default function PhotoGallery({ photos = {}, onDelete, onUpdateSubtype, isMobile = false }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [compareMode] = useState(false) // vergelijken gaat via 'Vergelijk foto's'
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
        <Grid size={32} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: '0.5rem' }} />
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
      {/* ── PHOTO GRID ── */}
      <div style={{
        position: 'relative'
      }}>
        {displayDates.map((date) => {
          const dayPhotos = photos[date] || []
          if (dayPhotos.length === 0) return null
          const d = new Date(date)
          
          return (
            <div key={date} style={{ marginBottom: isMobile ? '0.9rem' : '1.1rem' }}>
              {/* Datum: bold wit, aantal ernaast. */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: '0.45rem',
                padding: isMobile ? '0 1rem 0.45rem' : '0 1.5rem 0.5rem'
              }}>
                <span style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                  {d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{dayPhotos.length}</span>
              </div>

              {/* Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${isMobile ? 3 : 5}, 1fr)`,
                gap: 6,
                padding: isMobile ? '0 1rem' : '0 1.5rem'
              }}>
                {dayPhotos.map(photo => {
                  const selected = isCompareSelected(photo)
                  return (
                    <div key={photo.id} onClick={() => handlePhotoClick(photo)}
                      style={{
                        position: 'relative', paddingBottom: '125%', borderRadius: 10,
                        overflow: 'hidden', cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.02)',
                        outline: selected ? '2px solid #fff' : 'none',
                        outlineOffset: '-2px',
                      }}>
                      <img src={fotoWeergaveUrl(photo.photo_url, { breedte: 500 })} alt="Progress"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none' }} loading="lazy" />
                      {/* Subtype label — color per angle */}
                      {photo.metadata?.subtype && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, bottom: 0,
                          padding: '1rem 0.4rem 0.35rem',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                          fontSize: '0.62rem', color: '#fff', fontWeight: 800,
                        }}>
                          {SUBTYPE_OPTIONS.find(o => o.value === String(photo.metadata.subtype).toLowerCase())?.label || photo.metadata.subtype}
                        </div>
                      )}
                      {/* Compare checkmark */}
                      {compareMode && (
                        <div style={{
                          position: 'absolute', top: '2px', left: '2px',
                          width: 18, height: 18, borderRadius: 4,
                          background: selected ? '#fff' : 'rgba(0,0,0,0.5)',
                          border: selected ? '1px solid #fff' : '1px solid rgba(255,255,255,0.3)',
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

        {/* Meer dan drie dagen: de rest achter één knop. */}
        {dates.length > 3 && (
          <button onClick={() => setExpanded(v => !v)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: '0 auto 1rem',
            background: 'none', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer', padding: '0.5rem 1rem',
          }}>
            {expanded ? 'Minder' : `Alle ${totalPhotos} foto's`}
            {expanded ? <ChevronUp size={15} strokeWidth={2.8} /> : <ChevronDown size={15} strokeWidth={2.8} />}
          </button>
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
            <img src={fotoWeergaveUrl(selectedPhoto.photo_url, { breedte: 1200, kwaliteit: 85 })} alt="Photo"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }} />

            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
              padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: '700', color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>
                Progressie {selectedPhoto.metadata?.subtype ? `— ${selectedPhoto.metadata.subtype}` : ''}
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {onUpdateSubtype && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingSubtype(v => !v) }}
                    style={{
                      padding: '0.35rem 0.5rem', background: editingSubtype ? 'rgba(255, 255, 255,0.2)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '6px', border: editingSubtype ? '1px solid rgba(255, 255, 255,0.5)' : '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                      color: editingSubtype ? '#fff' : '#fff', fontSize: '0.65rem', fontWeight: '600'
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
                          background: isCurrent ? 'rgba(255, 255, 255,0.15)' : 'rgba(255,255,255,0.06)',
                          border: isCurrent ? '1px solid #fff' : '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px', cursor: subtypeSaving ? 'wait' : 'pointer',
                          color: isCurrent ? '#fff' : '#fff',
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
