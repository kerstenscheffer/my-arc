// src/modules/progress/components/PhotosModule.jsx
// v2.0 - PREMIUM GOLDEN PHOTOS MODULE
// Props: { client, db, isMobile }
// Keeps ALL existing functionality, upgrades styling to golden theme

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Camera, Upload, Trash2, ChevronLeft, ChevronRight,
  Calendar, Check, X, Loader2, Image, ZoomIn,
  RotateCw, ArrowLeftRight
} from 'lucide-react'

// ── GOLDEN THEME ──
const GOLD = {
  primary: '#FFD700',
  secondary: '#FFA500',
  dark: '#D4AF37',
  glow: 'rgba(255, 215, 0, 0.15)',
  glowStrong: 'rgba(255, 215, 0, 0.3)',
  border: 'rgba(255, 215, 0, 0.2)',
  borderActive: 'rgba(255, 215, 0, 0.4)',
  gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  gradientSubtle: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 165, 0, 0.06) 100%)',
  success: '#10b981',
  error: '#ef4444'
}

const PHOTO_TYPES = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Zij' },
  { id: 'back', label: 'Rug' }
]

export default function PhotosModule({ client, db, isMobile: propIsMobile }) {
  const [isMobile, setIsMobile] = useState(propIsMobile ?? window.innerWidth <= 768)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('front')
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [comparePhotos, setComparePhotos] = useState([null, null])
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (propIsMobile !== undefined) return
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [propIsMobile])

  // ── Load photos ──
  const loadPhotos = useCallback(async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      const data = await db.getProgressPhotos?.(client.id)
      setPhotos(data || [])
    } catch (err) {
      console.error('Photos load error:', err)
    } finally {
      setLoading(false)
    }
  }, [client?.id, db])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Upload handler ──
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !client?.id) return

    // Validate
    if (!file.type.startsWith('image/')) {
      showMessage('Alleen afbeeldingen toegestaan', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showMessage('Max 10MB per foto', 'error')
      return
    }

    setUploading(true)
    try {
      const result = await db.uploadProgressPhoto?.(client.id, file, selectedType)
      if (result) {
        showMessage('Foto geupload!')
        await loadPhotos()
      } else {
        showMessage('Upload mislukt', 'error')
      }
    } catch (err) {
      console.error('Upload error:', err)
      showMessage('Upload error', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Delete handler ──
  const handleDelete = async (photoId) => {
    if (!confirm('Foto verwijderen?')) return
    try {
      await db.deleteProgressPhoto?.(photoId)
      showMessage('Foto verwijderd')
      await loadPhotos()
      setLightboxPhoto(null)
    } catch (err) {
      console.error('Delete error:', err)
      showMessage('Verwijderen mislukt', 'error')
    }
  }

  // Filter photos by type
  const filteredPhotos = photos.filter(p => 
    !selectedType || selectedType === 'all' || p.type === selectedType || p.photo_type === selectedType
  )

  // Group photos by date for timeline
  const photosByDate = filteredPhotos.reduce((acc, photo) => {
    const date = photo.date || photo.created_at?.split('T')[0] || 'Unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(photo)
    return acc
  }, {})

  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: message.type === 'error'
            ? `linear-gradient(135deg, ${GOLD.error} 0%, #991b1b 100%)`
            : `linear-gradient(135deg, ${GOLD.success} 0%, #059669 100%)`,
          borderRadius: '12px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 2000,
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          animation: 'slideDown 0.3s ease'
        }}>
          {message.type === 'error' ? <X size={16} /> : <Check size={16} />}
          {message.text}
        </div>
      )}

      {/* ── HEADER — Type selector + Upload ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Type Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '0.375rem'
        }}>
          <TypePill
            label="Alles"
            active={selectedType === 'all'}
            onClick={() => setSelectedType('all')}
            isMobile={isMobile}
          />
          {PHOTO_TYPES.map(type => (
            <TypePill
              key={type.id}
              label={type.label}
              active={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {/* Compare Toggle */}
          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setComparePhotos([null, null])
            }}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: compareMode 
                ? 'rgba(255, 215, 0, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: compareMode 
                ? `1px solid ${GOLD.borderActive}`
                : '1px solid rgba(255, 255, 255, 0.08)',
              color: compareMode ? GOLD.primary : 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeftRight size={isMobile ? 14 : 16} />
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              height: isMobile ? '36px' : '40px',
              padding: '0 0.75rem',
              borderRadius: '10px',
              background: GOLD.gradient,
              border: 'none',
              color: '#000',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700',
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
              opacity: uploading ? 0.6 : 1
            }}
          >
            {uploading ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={14} />
            )}
            <span>{uploading ? 'Uploaden...' : 'Upload'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* ── COMPARE MODE BANNER ── */}
      {compareMode && (
        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          background: 'rgba(255, 215, 0, 0.06)',
          border: `1px solid ${GOLD.border}`,
          borderRadius: '10px',
          marginBottom: isMobile ? '0.75rem' : '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ArrowLeftRight size={14} color={GOLD.primary} />
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: 'rgba(255, 215, 0, 0.7)'
          }}>
            Selecteer 2 foto's om te vergelijken
          </span>
          {(comparePhotos[0] || comparePhotos[1]) && (
            <button
              onClick={() => setComparePhotos([null, null])}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: GOLD.primary,
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* ── COMPARE VIEW ── */}
      {compareMode && comparePhotos[0] && comparePhotos[1] && (
        <CompareView 
          photos={comparePhotos}
          isMobile={isMobile}
          onClose={() => {
            setComparePhotos([null, null])
          }}
        />
      )}

      {/* ── LOADING STATE ── */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '3rem 0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: `2px solid ${GOLD.border}`,
            borderTopColor: GOLD.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      ) : filteredPhotos.length === 0 ? (
        /* ── EMPTY STATE ── */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: isMobile ? '64px' : '72px',
            height: isMobile ? '64px' : '72px',
            borderRadius: '16px',
            background: GOLD.gradientSubtle,
            border: `1px solid ${GOLD.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Camera size={isMobile ? 28 : 32} color={GOLD.primary} strokeWidth={1.5} />
          </div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.375rem'
          }}>
            Geen foto's yet
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.4)',
            maxWidth: '260px',
            lineHeight: 1.5,
            marginBottom: '1.25rem'
          }}>
            Upload je eerste progress foto om je transformatie vast te leggen
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: isMobile ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
              borderRadius: '10px',
              background: GOLD.gradient,
              border: 'none',
              color: '#000',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Camera size={16} />
            Eerste Foto Uploaden
          </button>
        </div>
      ) : (
        /* ── PHOTO TIMELINE ── */
        <div>
          {sortedDates.map(date => (
            <div key={date} style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
              {/* Date Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: isMobile ? '0.5rem' : '0.625rem'
              }}>
                <Calendar size={12} color="rgba(255, 215, 0, 0.4)" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  fontWeight: '700',
                  color: 'rgba(255, 215, 0, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {formatDate(date)}
                </span>
              </div>

              {/* Photo Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '0.375rem' : '0.5rem'
              }}>
                {photosByDate[date].map((photo, idx) => (
                  <PhotoCard
                    key={photo.id || idx}
                    photo={photo}
                    isMobile={isMobile}
                    compareMode={compareMode}
                    isSelected={comparePhotos.includes(photo)}
                    onSelect={() => {
                      if (compareMode) {
                        handleCompareSelect(photo)
                      } else {
                        setLightboxPhoto(photo)
                      }
                    }}
                    onDelete={() => handleDelete(photo.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightboxPhoto && !compareMode && (
        <Lightbox
          photo={lightboxPhoto}
          isMobile={isMobile}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => handleDelete(lightboxPhoto.id)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )

  // ── Compare select logic ──
  function handleCompareSelect(photo) {
    if (comparePhotos[0]?.id === photo.id) {
      setComparePhotos([null, comparePhotos[1]])
    } else if (comparePhotos[1]?.id === photo.id) {
      setComparePhotos([comparePhotos[0], null])
    } else if (!comparePhotos[0]) {
      setComparePhotos([photo, comparePhotos[1]])
    } else if (!comparePhotos[1]) {
      setComparePhotos([comparePhotos[0], photo])
    } else {
      setComparePhotos([photo, comparePhotos[1]])
    }
  }
}


// ═══════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════

function TypePill({ label, active, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? '0.35rem 0.625rem' : '0.4rem 0.75rem',
        borderRadius: '8px',
        background: active 
          ? 'rgba(255, 215, 0, 0.12)'
          : 'rgba(255, 255, 255, 0.03)',
        border: active 
          ? '1px solid rgba(255, 215, 0, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.06)',
        color: active ? GOLD.primary : 'rgba(255, 255, 255, 0.4)',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: active ? '700' : '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
      }}
    >
      {label}
    </button>
  )
}

function PhotoCard({ photo, isMobile, compareMode, isSelected, onSelect, onDelete }) {
  const photoUrl = photo.photo_url || photo.url || photo.image_url || ''
  const typeLabel = photo.type || photo.photo_type || ''
  
  return (
    <div
      onClick={onSelect}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        borderRadius: isMobile ? '8px' : '10px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: isSelected 
          ? `2px solid ${GOLD.primary}`
          : '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 0.2s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Photo */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={typeLabel}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          loading="lazy"
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image size={20} color="rgba(255, 255, 255, 0.15)" />
        </div>
      )}

      {/* Overlay gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '40%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Type badge */}
      {typeLabel && (
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '0.35rem' : '0.5rem',
          left: isMobile ? '0.35rem' : '0.5rem',
          padding: '0.15rem 0.35rem',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {typeLabel}
        </div>
      )}

      {/* Compare selection indicator */}
      {compareMode && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.35rem' : '0.5rem',
          right: isMobile ? '0.35rem' : '0.5rem',
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          background: isSelected 
            ? GOLD.gradient
            : 'rgba(0, 0, 0, 0.5)',
          border: isSelected 
            ? `1px solid ${GOLD.primary}`
            : '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
        </div>
      )}

      {/* Zoom icon on hover (desktop) */}
      {!compareMode && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '0.35rem' : '0.5rem',
          right: isMobile ? '0.35rem' : '0.5rem',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5,
          transition: 'opacity 0.2s ease'
        }}>
          <ZoomIn size={12} color="white" />
        </div>
      )}
    </div>
  )
}

function CompareView({ photos, isMobile, onClose }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${GOLD.border}`,
      borderRadius: isMobile ? '12px' : '14px',
      overflow: 'hidden',
      marginBottom: isMobile ? '1rem' : '1.25rem'
    }}>
      {/* Compare Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <ArrowLeftRight size={14} color={GOLD.primary} />
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            color: GOLD.primary,
            textTransform: 'uppercase'
          }}>
            Vergelijking
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Side by Side Photos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px',
        background: 'rgba(255, 255, 255, 0.06)'
      }}>
        {photos.map((photo, idx) => (
          <div key={idx} style={{
            position: 'relative',
            aspectRatio: '3/4',
            background: '#000'
          }}>
            {photo && (photo.photo_url || photo.url || photo.image_url) ? (
              <img
                src={photo.photo_url || photo.url || photo.image_url}
                alt={`Compare ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Image size={24} color="rgba(255, 255, 255, 0.15)" />
              </div>
            )}
            
            {/* Date label */}
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '0.375rem' : '0.5rem',
              left: isMobile ? '0.375rem' : '0.5rem',
              padding: '0.2rem 0.4rem',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              borderRadius: '4px',
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              fontWeight: '700',
              color: GOLD.primary
            }}>
              {formatDate(photo?.date || photo?.created_at?.split('T')[0])}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Lightbox({ photo, isMobile, onClose, onDelete }) {
  const photoUrl = photo.photo_url || photo.url || photo.image_url || ''
  
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '1.5rem',
          right: isMobile ? '1rem' : '1.5rem',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        <X size={20} />
      </button>

      {/* Photo */}
      <img
        src={photoUrl}
        alt="Progress"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: isMobile ? '70vh' : '80vh',
          objectFit: 'contain',
          borderRadius: '8px'
        }}
      />

      {/* Bottom info bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '500px',
          marginTop: '1rem',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px'
        }}
      >
        <div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            {(photo.type || photo.photo_type || '').toUpperCase()}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 215, 0, 0.5)'
          }}>
            {formatDate(photo.date || photo.created_at?.split('T')[0])}
          </div>
        </div>
        <button
          onClick={() => onDelete()}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            touchAction: 'manipulation'
          }}
        >
          <Trash2 size={12} />
          Verwijder
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}


// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  } catch {
    return dateStr
  }
}
