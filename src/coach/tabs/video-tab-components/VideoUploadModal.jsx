// src/coach/tabs/video-tab-components/VideoUploadModal.jsx
import React, { useState } from 'react'
import { Upload, X, Youtube, Camera, Image, Globe } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../../../modules/videos/VideoService'

export default function VideoUploadModal({ onClose, onSave, categories, db }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'motivation',
    tags: [],
    difficulty_level: 'beginner',
    best_time_to_watch: 'anytime',
    is_default: false
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const isMobile = useIsMobile()

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url) {
      alert('Vul minimaal een titel en video URL in')
      return
    }

    setUploading(true)
    try {
      let thumbnailUrl = null

      if (thumbnailFile) {
        const user = await db.getCurrentUser()
        const uploadResult = await videoService.uploadThumbnail(thumbnailFile, user.id)
        
        if (uploadResult.success) {
          thumbnailUrl = uploadResult.thumbnailUrl
        } else {
          alert(`Thumbnail upload mislukt: ${uploadResult.error}`)
        }
      }

      await onSave({
        ...formData,
        thumbnail_url: thumbnailUrl
      })
    } catch (error) {
      console.error('Error creating video:', error)
      alert('Er ging iets mis bij het uploaden')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Upload size={20} style={{ color: '#10b981' }} />
            Nieuwe Video Toevoegen
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        <div>
          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="bv. Welkom bij MY ARC - App Uitleg"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          {/* YouTube URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Youtube size={16} />
              YouTube URL *
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({...formData, video_url: e.target.value})}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* DEFAULT TOGGLE */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: formData.is_default
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
              : 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: formData.is_default
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.3rem'
                }}>
                  <Globe 
                    size={18} 
                    color={formData.is_default ? '#10b981' : 'rgba(255,255,255,0.4)'}
                  />
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: formData.is_default ? '#10b981' : '#fff'
                  }}>
                    Standaard voor alle clients
                  </span>
                </div>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: '1.3',
                  paddingLeft: '1.75rem'
                }}>
                  Video is automatisch zichtbaar voor iedereen (ideaal voor uitleg/onboarding)
                </p>
              </div>
              
              {/* Toggle Switch */}
              <div
                onClick={() => setFormData({...formData, is_default: !formData.is_default})}
                style={{
                  width: '48px',
                  height: '26px',
                  background: formData.is_default
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255,255,255,0.1)',
                  borderRadius: '13px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: '1rem'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: formData.is_default ? '24px' : '2px',
                  width: '22px',
                  height: '22px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </label>
          </div>

          {/* Thumbnail Upload */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Camera size={16} />
              Custom Thumbnail (optioneel)
            </label>
            
            <div style={{
              border: '2px dashed rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              background: 'rgba(255,255,255,0.02)'
            }}>
              {thumbnailPreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '150px',
                      borderRadius: '6px',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={() => {
                      setThumbnailFile(null)
                      setThumbnailPreview(null)
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  <Image size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    Sleep een afbeelding hierheen
                  </p>
                </>
              )}
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleThumbnailChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Korte beschrijving..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Category */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Categorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} style={{ background: '#1a1a1a' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <button
              onClick={onClose}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: uploading ? 0.5 : 1,
                minHeight: '44px'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: uploading
                  ? 'rgba(255,255,255,0.03)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: uploading ? 'rgba(255,255,255,0.4)' : '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 0.95,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              {uploading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Uploaden...
                </>
              ) : (
                'Video Toevoegen'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
