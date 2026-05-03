// src/modules/progress/components/RecentProgressPhotos.jsx
// v3.0 - ONLY PROGRESS TYPE - Clean flush grid
// Props IDENTIEK: { photos, onUpload, todayData, isFriday, isMobile }

import React from 'react'
import { Camera } from 'lucide-react'
import UploadSection from '../../progress-photos/components/UploadSection'

export default function RecentProgressPhotos({ photos = [], onUpload, todayData = {}, isFriday = false, isMobile = false }) {
  const progressPhotos = photos
    .filter(p => (p.metadata?.category || 'progress') === 'progress')
    .slice(0, 6)

  return (
    <div>
      {/* Upload Section — flush */}
      <UploadSection 
        onUpload={onUpload}
        todayData={todayData}
        isFriday={isFriday}
        isMobile={isMobile}
      />

      {/* Recent progress photos */}
      {progressPhotos.length === 0 ? (
        <div style={{
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          <Camera size={28} color="rgba(255, 215, 0, 0.15)" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600',
            color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem'
          }}>
            Nog geen foto's
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255,255,255,0.2)'
          }}>
            Upload je eerste progressie foto
          </div>
        </div>
      ) : (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Label */}
          <div style={{
            padding: isMobile ? '0.35rem 1rem' : '0.4rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
          }}>
            <span style={{
              fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '700',
              color: 'rgba(255, 215, 0, 0.35)', textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Recent — {progressPhotos.length} foto's
            </span>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
            gap: '2px',
            padding: isMobile ? '0.25rem' : '0.375rem'
          }}>
            {progressPhotos.map((photo, index) => (
              <div key={photo.id || index}
                style={{
                  position: 'relative', aspectRatio: '1',
                  overflow: 'hidden', background: 'rgba(255,255,255,0.02)'
                }}>
                <img src={photo.photo_url} alt={`Progress ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy" />
                {/* Subtype badge */}
                {photo.metadata?.subtype && (
                  <div style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    background: 'rgba(0,0,0,0.75)', borderRadius: '2px',
                    padding: '0 3px', fontSize: '0.45rem', color: '#FFD700',
                    fontWeight: '700', textTransform: 'uppercase', lineHeight: 1.4
                  }}>
                    {photo.metadata.subtype[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
