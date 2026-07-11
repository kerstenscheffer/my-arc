// src/modules/workout/components/pump-photos/UploadPhotoModal.jsx
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera, Upload, Image as ImageIcon, Sparkles, Crop } from 'lucide-react'

export default function UploadPhotoModal({ client, db, onClose, onSuccess }) {
  const isMobile = window.innerWidth <= 768
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  // Crop/zoom state
  const [cropMode, setCropMode] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [cropScale, setCropScale] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const cropImgRef = useRef(null)
  const cropContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const pointerState = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Alleen afbeeldingen zijn toegestaan!'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Bestand te groot! Maximaal 5MB.'); return }
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCropImageSrc(reader.result)
      setCropMode(true)
      setCropScale(1)
      setCropOffset({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  // Crop confirm: compute source rect from current transform and draw to canvas
  const handleCropConfirm = () => {
    const img = cropImgRef.current
    const container = cropContainerRef.current
    if (!img || !container || !img.naturalWidth) {
      setPreview(cropImageSrc)
      setCropMode(false)
      return
    }

    const C = container.clientWidth
    const iW = img.naturalWidth
    const iH = img.naturalHeight
    // Cover ratio: image fills C×C
    const r = Math.max(C / iW, C / iH)
    const coverOffsetX = (C - iW * r) / 2
    const coverOffsetY = (C - iH * r) / 2
    const s = cropScale
    const ox = cropOffset.x
    const oy = cropOffset.y

    // Container pixel (0,0) in source image coords:
    // srcX = ((-ox - C/2) / s + C/2 - coverOffsetX) / r
    const srcX = ((-ox - C / 2) / s + C / 2 - coverOffsetX) / r
    const srcY = ((-oy - C / 2) / s + C / 2 - coverOffsetY) / r
    const srcW = C / (s * r)
    const srcH = C / (s * r)

    const outputSize = 800
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')

    // Clamp source rect to image bounds
    const cX = Math.max(0, Math.min(srcX, iW - 1))
    const cY = Math.max(0, Math.min(srcY, iH - 1))
    const cW = Math.min(srcW, iW - cX)
    const cH = Math.min(srcH, iH - cY)

    // Destination accounting for clamp (black fill for out-of-bounds)
    const dX = ((cX - srcX) / srcW) * outputSize
    const dY = ((cY - srcY) / srcH) * outputSize
    const dW = (cW / srcW) * outputSize
    const dH = (cH / srcH) * outputSize

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, outputSize, outputSize)
    ctx.drawImage(img, cX, cY, cW, cH, dX, dY, dW, dH)

    canvas.toBlob((blob) => {
      if (!blob) { setPreview(cropImageSrc); setCropMode(false); return }
      const croppedFile = new File([blob], 'pump-photo.jpg', { type: 'image/jpeg' })
      setSelectedFile(croppedFile)
      setPreview(canvas.toDataURL('image/jpeg', 0.9))
      setCropMode(false)
      setCropImageSrc(null)
    }, 'image/jpeg', 0.9)
  }

  const handleCropSkip = () => {
    setPreview(cropImageSrc)
    setCropMode(false)
  }

  // Touch handlers for crop container
  const handleTouchStart = (e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      pointerState.current = {
        type: 'drag',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startOffset: { ...cropOffset }
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      pointerState.current = {
        type: 'pinch',
        startDist: Math.sqrt(dx * dx + dy * dy),
        startScale: cropScale
      }
    }
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (!pointerState.current) return
    if (pointerState.current.type === 'drag' && e.touches.length === 1) {
      setCropOffset({
        x: pointerState.current.startOffset.x + (e.touches[0].clientX - pointerState.current.startX),
        y: pointerState.current.startOffset.y + (e.touches[0].clientY - pointerState.current.startY)
      })
    } else if (pointerState.current.type === 'pinch' && e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setCropScale(Math.max(1, Math.min(3, pointerState.current.startScale * dist / pointerState.current.startDist)))
    }
  }

  const handleTouchEnd = () => { pointerState.current = null }

  // Mouse handlers for crop container
  const handleMouseDown = (e) => {
    pointerState.current = { type: 'drag', startX: e.clientX, startY: e.clientY, startOffset: { ...cropOffset } }
  }

  const handleMouseMove = (e) => {
    if (!pointerState.current) return
    setCropOffset({
      x: pointerState.current.startOffset.x + (e.clientX - pointerState.current.startX),
      y: pointerState.current.startOffset.y + (e.clientY - pointerState.current.startY)
    })
  }

  const handleMouseUp = () => { pointerState.current = null }

  const handleWheel = (e) => {
    e.preventDefault()
    setCropScale(prev => Math.max(1, Math.min(3, prev * (e.deltaY > 0 ? 0.9 : 1.1))))
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${client.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await db.supabase.storage
        .from('pump-photos')
        .upload(fileName, selectedFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = db.supabase.storage
        .from('pump-photos')
        .getPublicUrl(fileName)
      await db.uploadPumpPhoto(client.id, publicUrl, caption.trim() || null)
      onSuccess?.()
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('Upload mislukt. Probeer opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  const modalContent = (
    <div
      onClick={!cropMode ? onClose : undefined}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px',
          background: 'linear-gradient(135deg, rgba(17,17,17,0.98) 0%, rgba(10,10,10,0.98) 100%)',
          borderRadius: '0',
          border: '2px solid rgba(249,115,22,0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 100px rgba(249,115,22,0.2)',
          animation: 'slideUp 0.4s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          animation: 'shimmer 2s ease-in-out infinite'
        }} />

        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(249,115,22,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(249,115,22,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '0',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {cropMode
                ? <Crop size={22} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                : <Camera size={22} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              }
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '800', color: '#f97316', margin: 0, letterSpacing: '-0.02em'
              }}>
                {cropMode ? 'Foto bijsnijden' : 'Upload Pump Foto'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: '600' }}>
                {cropMode ? 'Zoom & positioneer' : 'Laat je progress zien! 💪'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              width: '40px', height: '40px', borderRadius: '0',
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease', opacity: uploading ? 0.5 : 1
            }}
            onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'; e.currentTarget.style.background = 'rgba(239,68,68,0.3)' } }}
            onMouseLeave={(e) => { if (!uploading) { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.background = 'rgba(239,68,68,0.2)' } }}
          >
            <X size={20} color="#ef4444" />
          </button>
        </div>

        {/* CROP MODE */}
        {cropMode ? (
          <div style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
            {/* Crop container */}
            <div
              ref={cropContainerRef}
              style={{
                aspectRatio: '1', overflow: 'hidden', position: 'relative',
                border: '2px solid rgba(249,115,22,0.5)',
                marginBottom: '1rem', cursor: 'grab',
                touchAction: 'none', userSelect: 'none', background: '#000'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <img
                ref={cropImgRef}
                src={cropImageSrc}
                alt="Bijsnijden"
                draggable={false}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transformOrigin: 'center center',
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropScale})`,
                  pointerEvents: 'none', userSelect: 'none'
                }}
              />
              {/* Rule-of-thirds grid */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[33, 66].map(pct => (
                  <div key={`h${pct}`} style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
                ))}
                {[33, 66].map(pct => (
                  <div key={`v${pct}`} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.12)' }} />
                ))}
              </div>
            </div>

            {/* Zoom slider */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zoom</span>
                <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: '700' }}>{cropScale.toFixed(1)}×</span>
              </div>
              <input
                type="range" min="1" max="3" step="0.05"
                value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f97316' }}
              />
            </div>

            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.25rem', textAlign: 'center', lineHeight: 1.5 }}>
              Sleep om te positioneren · Knijp of gebruik slider om in te zoomen
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleCropSkip}
                style={{
                  flex: 1, padding: '0.875rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '700', cursor: 'pointer'
                }}
              >
                Overslaan
              </button>
              <button
                onClick={handleCropConfirm}
                style={{
                  flex: 2, padding: '0.875rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none', borderRadius: '0', color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(249,115,22,0.4)'
                }}
              >
                <Crop size={16} />
                Bijsnijden & Doorgaan
              </button>
            </div>
          </div>
        ) : (
          /* NORMAL UPLOAD MODE */
          <div style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
            {/* File Input / Preview */}
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  aspectRatio: '1', border: '2px dashed rgba(249,115,22,0.3)', borderRadius: '0',
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(234,88,12,0.02) 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative', overflow: 'hidden', marginBottom: '1.5rem'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.border = '2px dashed rgba(249,115,22,0.6)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.05) 100%)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.border = '2px dashed rgba(249,115,22,0.3)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(234,88,12,0.02) 100%)'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <ImageIcon size={isMobile ? 64 : 80} color="rgba(249,115,22,0.4)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', color: '#f97316', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Klik om foto te selecteren
                </div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: '1.5' }}>
                  Of sleep een foto hierheen<br/>
                  <span style={{ fontSize: '0.75rem' }}>Max 5MB · JPG, PNG, WebP</span>
                </div>
              </div>
            ) : (
              <div style={{
                aspectRatio: '1', borderRadius: '0', overflow: 'hidden',
                marginBottom: '1.5rem', position: 'relative',
                border: '2px solid rgba(249,115,22,0.3)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setPreview(null); setSelectedFile(null); setCropImageSrc(null); fileInputRef.current.value = '' }}
                  disabled={uploading}
                  style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(249,115,22,0.3)', borderRadius: '0',
                    color: '#f97316', fontSize: '0.8rem', fontWeight: '700',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    opacity: uploading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = 'rgba(249,115,22,0.2)' }}
                  onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.background = 'rgba(17,17,17,0.95)' }}
                >
                  <Upload size={14} />
                  Verander
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

            {/* Caption */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Caption (Optioneel)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                placeholder="Bijv: Leg day done! 💪"
                disabled={uploading}
                maxLength={200}
                rows={3}
                style={{
                  width: '100%', padding: '0.875rem 1rem',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '0', color: '#fff', fontSize: '0.9rem',
                  outline: 'none', resize: 'none', transition: 'all 0.3s ease', fontFamily: 'inherit'
                }}
                onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(249,115,22,0.5)'; e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(249,115,22,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', textAlign: 'right' }}>
                {caption.length}/200
              </div>
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              style={{
                width: '100%', padding: isMobile ? '1rem' : '1.125rem',
                background: selectedFile && !uploading ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'rgba(249,115,22,0.2)',
                border: 'none', borderRadius: '0', color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: '800',
                cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: selectedFile && !uploading ? '0 6px 25px rgba(249,115,22,0.4)' : 'none',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                position: 'relative', overflow: 'hidden', minHeight: '56px'
              }}
              onMouseEnter={(e) => { if (selectedFile && !uploading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 35px rgba(249,115,22,0.5)' } }}
              onMouseLeave={(e) => { if (selectedFile && !uploading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(249,115,22,0.4)' } }}
            >
              {selectedFile && !uploading && (
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shine 3s ease-in-out infinite' }} />
              )}
              {uploading ? (
                <>
                  <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Uploaden...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Upload Foto
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes shine { 0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); } 100% { transform: translateX(100%) translateY(100%) rotate(45deg); } }
      `}</style>
    </div>
  )

  return createPortal(modalContent, document.body)
}
