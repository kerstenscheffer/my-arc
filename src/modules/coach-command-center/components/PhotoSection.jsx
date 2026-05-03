// PhotoSection.jsx - Foto sectie component voor Command Center
import React, { useState } from 'react'
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PhotoSection({ client, photoData, isMobile }) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  
  // Photo data
  const photos = photoData?.photos || []
  const progressPhotos = photos.filter(p => (p.metadata?.category || 'progress') === 'progress')
  const lastPhoto = photoData?.lastPhoto
  const totalPhotos = photoData?.totalCount || 0
  const progressCount = photoData?.progressCount || 0
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  // Photo modal navigation
  const openPhotoModal = (index = 0) => {
    setSelectedPhotoIndex(index)
    setPhotoModalOpen(true)
  }

  const nextPhoto = () => {
    setSelectedPhotoIndex(prev => (prev + 1) % progressPhotos.length)
  }

  const prevPhoto = () => {
    setSelectedPhotoIndex(prev => (prev - 1 + progressPhotos.length) % progressPhotos.length)
  }

  return (
    <>
      {/* Photo Section Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.75rem' : '0.875rem',
        background: totalPhotos > 0 
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        border: totalPhotos > 0 
          ? '1px solid rgba(168, 85, 247, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px'
      }}>
        {/* Photo thumbnails or placeholder */}
        {progressPhotos.length > 0 ? (
          <div 
            onClick={() => openPhotoModal(0)}
            style={{
              display: 'flex',
              gap: '0.375rem',
              cursor: 'pointer'
            }}
          >
            {progressPhotos.slice(0, 3).map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid rgba(168, 85, 247, 0.3)',
                  position: 'relative'
                }}
              >
                <img 
                  src={photo.photo_url} 
                  alt={`Progress ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {idx === 2 && progressPhotos.length > 3 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    +{progressPhotos.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Camera size={isMobile ? 18 : 22} color="rgba(255, 255, 255, 0.3)" />
          </div>
        )}

        {/* Photo stats */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            color: totalPhotos > 0 ? '#a855f7' : 'rgba(255, 255, 255, 0.5)'
          }}>
            {totalPhotos > 0 ? `${progressCount} progress foto's` : 'Geen foto\'s'}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            {lastPhoto ? `Laatste: ${formatDate(lastPhoto.photo_date)}` : 'Nog geen uploads'}
          </div>
        </div>

        {/* View all button */}
        {progressPhotos.length > 0 && (
          <button
            onClick={() => openPhotoModal(0)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              color: '#a855f7',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '36px'
            }}
          >
            <Camera size={14} />
            Bekijk
          </button>
        )}
      </div>

      {/* PHOTO MODAL */}
      {photoModalOpen && progressPhotos.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1rem' : '2rem'
          }}
          onClick={() => setPhotoModalOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setPhotoModalOpen(false)}
            style={{
              position: 'absolute',
              top: isMobile ? '1rem' : '2rem',
              right: isMobile ? '1rem' : '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={24} />
          </button>

          {/* Client name */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '1rem' : '2rem',
            left: isMobile ? '1rem' : '2rem',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.25rem',
            fontWeight: '700'
          }}>
            {client.first_name} {client.last_name}
          </div>

          {/* Main image */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '70vh',
              position: 'relative'
            }}
          >
            <img 
              src={progressPhotos[selectedPhotoIndex]?.photo_url}
              alt={`Progress foto ${selectedPhotoIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '12px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Navigation arrows */}
          {progressPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                style={{
                  position: 'absolute',
                  left: isMobile ? '0.5rem' : '2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                style={{
                  position: 'absolute',
                  right: isMobile ? '0.5rem' : '2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Photo info */}
          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '600' }}>
              {formatDate(progressPhotos[selectedPhotoIndex]?.photo_date)}
            </div>
            <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', marginTop: '0.25rem' }}>
              {selectedPhotoIndex + 1} / {progressPhotos.length}
            </div>
          </div>

          {/* Thumbnail strip */}
          {progressPhotos.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              overflowX: 'auto',
              padding: '0.5rem',
              maxWidth: '90vw',
              WebkitOverflowScrolling: 'touch'
            }}>
              {progressPhotos.slice(0, 10).map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(idx); }}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: idx === selectedPhotoIndex 
                      ? '3px solid #a855f7' 
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    opacity: idx === selectedPhotoIndex ? 1 : 0.6,
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={photo.photo_url}
                    alt={`Thumb ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
