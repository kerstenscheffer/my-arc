// src/modules/workout/components/pump-photos/UploadPhotoModal.jsx
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera, Upload, Image as ImageIcon, Sparkles } from 'lucide-react'

export default function UploadPhotoModal({ client, db, onClose, onSuccess }) {
  const isMobile = window.innerWidth <= 768
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan!')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bestand te groot! Maximaal 5MB.')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${client.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await db.supabase.storage
        .from('pump-photos')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = db.supabase.storage
        .from('pump-photos')
        .getPublicUrl(fileName)

      // Save to database
      await db.uploadPumpPhoto(client.id, publicUrl, caption.trim() || null)

      console.log('✅ Photo uploaded successfully')
      onSuccess?.()
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('Upload mislukt. Probeer opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          borderRadius: '0',
          border: '2px solid rgba(249, 115, 22, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(249, 115, 22, 0.2)',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)',
          animation: 'shimmer 2s ease-in-out infinite'
        }} />

        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(249, 115, 22, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '0',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Camera size={22} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '800',
                color: '#f97316',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Upload Pump Foto
              </h2>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
                fontWeight: '600'
              }}>
                Laat je progress zien! 💪
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '0',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: uploading ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }
            }}
          >
            <X size={20} color="#ef4444" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          {/* File Input / Preview */}
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                aspectRatio: '1',
                border: '2px dashed rgba(249, 115, 22, 0.3)',
                borderRadius: '0',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.02) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px dashed rgba(249, 115, 22, 0.6)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px dashed rgba(249, 115, 22, 0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.02) 100%)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <ImageIcon 
                size={isMobile ? 64 : 80} 
                color="rgba(249, 115, 22, 0.4)"
                style={{ marginBottom: '1rem' }}
              />
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: '#f97316',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                Klik om foto te selecteren
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                Of sleep een foto hierheen<br/>
                <span style={{ fontSize: '0.75rem' }}>Max 5MB • JPG, PNG, WebP</span>
              </div>
            </div>
          ) : (
            <div style={{
              aspectRatio: '1',
              borderRadius: '0',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              position: 'relative',
              border: '2px solid rgba(249, 115, 22, 0.3)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              {/* Change photo button */}
              <button
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  fileInputRef.current.value = ''
                }}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(17, 17, 17, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  borderRadius: '0',
                  color: '#f97316',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: uploading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.background = 'rgba(17, 17, 17, 0.95)'
                  }
                }}
              >
                <Upload size={14} />
                Verander
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Caption Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
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
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.5)'
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.2)'
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.35rem',
              textAlign: 'right'
            }}>
              {caption.length}/200
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.125rem',
              background: selectedFile && !uploading
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'rgba(249, 115, 22, 0.2)',
              border: 'none',
              borderRadius: '0',
              color: '#fff',
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '800',
              cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: selectedFile && !uploading
                ? '0 6px 25px rgba(249, 115, 22, 0.4)'
                : 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '56px'
            }}
            onMouseEnter={(e) => {
              if (selectedFile && !uploading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 35px rgba(249, 115, 22, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile && !uploading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(249, 115, 22, 0.4)'
              }
            }}
          >
            {/* Shine effect */}
            {selectedFile && !uploading && (
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                animation: 'shine 3s ease-in-out infinite'
              }} />
            )}

            {uploading ? (
              <>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
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
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </div>,
    document.body
  )
}
