// src/modules/progress-photos/components/UploadSection.jsx
// v3.0 - ONLY PROGRESS TYPE - No type selector needed
// Props IDENTIEK: { onUpload, todayData, isFriday, isMobile }

import React, { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'

export default function UploadSection({ onUpload, todayData = {}, isFriday = false, isMobile = false }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { hasCompleteFriday = false } = todayData

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file, 'progress')
      fileInputRef.current.value = ''
    } catch (e) { console.error('Upload failed:', e) }
    finally { setUploading(false) }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* ── Friday banner — only when relevant ── */}
      {isFriday && !hasCompleteFriday && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
          background: 'rgba(255, 215, 0, 0.06)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <Camera size={12} color="#FFD700" style={{ opacity: 0.6 }} />
          <span style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '700',
            color: 'rgba(255, 215, 0, 0.6)', textTransform: 'uppercase', letterSpacing: '0.03em'
          }}>
            Vrijdag — Upload je progress foto's
          </span>
        </div>
      )}

      {/* ── UPLOAD KNOP — echte gevulde gouden knop ── */}
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.5rem' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            background: uploading ? 'rgba(255, 215, 0, 0.2)' : 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none', borderRadius: 12,
            padding: isMobile ? '0.8rem' : '0.9rem',
            color: uploading ? '#FFD700' : '#000',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.45rem',
            minHeight: '48px',
            boxShadow: uploading ? 'none' : '0 2px 14px rgba(255, 215, 0, 0.28)',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={(e) => { if (!uploading && isMobile) e.currentTarget.style.filter = 'brightness(0.92)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.filter = 'none' }}
        >
          {uploading ? (
            <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,215,0,0.25)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Uploaden…</>
          ) : (
            <><Upload size={isMobile ? 16 : 17} /> Upload Progressie Foto</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
