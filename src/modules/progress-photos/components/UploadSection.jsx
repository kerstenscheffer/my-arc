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

      {/* ── UPLOAD ACTION BAR — flush, full width ── */}
      <div style={{
        display: 'flex',
        background: 'rgba(10, 10, 10, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Tip text left */}
        <div style={{
          padding: isMobile ? '0.55rem 0.75rem' : '0.65rem 1rem',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: '600'
        }}>
          <Camera size={12} style={{ opacity: 0.5 }} />
          Front & side
        </div>

        {/* Upload button right — gold accent */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1,
            background: 'rgba(255, 215, 0, 0.1)',
            border: 'none', borderRadius: 0,
            padding: isMobile ? '0.55rem 0' : '0.65rem 0',
            color: '#FFD700',
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            fontWeight: '800',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '40px',
            opacity: uploading ? 0.6 : 1
          }}
          onTouchStart={(e) => { if (!uploading && isMobile) e.currentTarget.style.background = 'rgba(255, 215, 0, 0.18)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)' }}
        >
          {uploading ? (
            <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Uploaden...</>
          ) : (
            <><Upload size={isMobile ? 14 : 15} /> Upload Progressie Foto</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
