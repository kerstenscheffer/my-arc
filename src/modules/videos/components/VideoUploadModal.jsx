// src/modules/videos/components/VideoUploadModal.jsx
import React, { useState } from 'react'
import { 
  Upload, X, Youtube, Camera, Image, 
  Zap, Target, Heart, Brain, Activity, Sparkles 
} from 'lucide-react'
import videoService from '../VideoService'

export default function VideoUploadModal({ onClose, onSave, isMobile }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'motivation',
    tags: [],
    difficulty_level: 'beginner',
    best_time_to_watch: 'anytime'
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [thumbnailOptional, setThumbnailOptional] = useState(false) // Schakel tussen verplicht/optioneel
  
  const categories = [
    { value: 'motivation', label: 'Motivatie', icon: Zap, color: '#ef4444' },
    { value: 'technique', label: 'Techniek', icon: Target, color: '#3b82f6' },
    { value: 'nutrition', label: 'Voeding', icon: Heart, color: '#10b981' },
    { value: 'mindset', label: 'Mindset', icon: Brain, color: '#8b5cf6' },
    { value: 'recovery', label: 'Herstel', icon: Activity, color: '#06b6d4' },
    { value: 'onboarding', label: 'Onboarding', icon: Sparkles, color: '#f59e0b' }
  ]

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({...errors, thumbnail: 'File moet kleiner zijn dan 5MB'})
        return
      }
      
      setThumbnailFile(file)
      setErrors({...errors, thumbnail: null})
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel is verplicht'
    }
    
    if (!formData.video_url.trim()) {
      newErrors.video_url = 'YouTube URL is verplicht'
    } else if (!formData.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)/)) {
      newErrors.video_url = 'Geen geldige YouTube URL'
    }
    
    // Thumbnail alleen verplicht als thumbnailOptional false is
    if (!thumbnailOptional && !thumbnailFile) {
      newErrors.thumbnail = 'Thumbnail is verplicht voor unlisted videos'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setUploading(true)
    try {
      let thumbnailUrl = null

      // Upload thumbnail als deze bestaat
      if (thumbnailFile) {
        const uploadResult = await videoService.uploadThumbnail(
          thumbnailFile, 
          'current-coach-id' // Dit wordt vervangen door echte coach ID in onSave
        )
        
        if (uploadResult.success) {
          thumbnailUrl = uploadResult.thumbnailUrl
          console.log('✅ Thumbnail uploaded:', thumbnailUrl)
        } else {
          // Als upload faalt, bepaal of we door moeten gaan
          console.warn('⚠️ Thumbnail upload mislukt:', uploadResult.error)
          
          if (!thumbnailOptional) {
            // Als thumbnail verplicht is, stop hier
            setErrors({thumbnail: `Upload mislukt: ${uploadResult.error}`})
            setUploading(false)
            return
          } else {
            // Als optioneel, ga door zonder thumbnail
            console.log('Ga door zonder thumbnail (optioneel)')
          }
        }
      }

      const result = await onSave({
        ...formData,
        thumbnail_url: thumbnailUrl
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Upload mislukt')
      }
      
      // Success!
      console.log('✅ Video succesvol toegevoegd')
      onClose() // Sluit modal na success
      
    } catch (error) {
      console.error('Error creating video:', error)
      alert('Er ging iets mis bij het toevoegen van de video: ' + error.message)
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
        border: '1px solid rgba(255,255,255,0.08)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
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
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
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
              onChange={(e) => {
                setFormData({...formData, title: e.target.value})
                if (errors.title) setErrors({...errors, title: null})
              }}
              placeholder="bv. Morning Motivation - Start Strong"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${errors.title ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            />
            {errors.title && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.title}
              </p>
            )}
          </div>
          
          {/* YouTube URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              <Youtube size={16} />
              YouTube URL (Unlisted of Public) *
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => {
                setFormData({...formData, video_url: e.target.value})
                if (errors.video_url) setErrors({...errors, video_url: null})
              }}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${errors.video_url ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            />
            {errors.video_url && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.video_url}
              </p>
            )}
          </div>

          {/* Thumbnail Upload - FLEXIBEL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              <Camera size={16} />
              Custom Thumbnail {!thumbnailOptional && '*'} 
              <button
                type="button"
                onClick={() => setThumbnailOptional(!thumbnailOptional)}
                style={{
                  marginLeft: 'auto',
                  padding: '0.25rem 0.5rem',
                  background: thumbnailOptional ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${thumbnailOptional ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                  borderRadius: '4px',
                  color: thumbnailOptional ? '#f59e0b' : '#10b981',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {thumbnailOptional ? 'Optioneel' : 'Verplicht'}
              </button>
            </label>
            
            <div style={{
              border: `2px dashed ${errors.thumbnail ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              background: errors.thumbnail ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
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
                    onClick={(e) => {
                      e.stopPropagation()
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
                  <Image size={32} color={errors.thumbnail ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.3)'} style={{ marginBottom: '0.5rem' }} />
                  <p style={{
                    color: errors.thumbnail ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255,255,255,0.4)',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    {isMobile ? 'Tap om thumbnail te uploaden' : 'Sleep een afbeelding of klik om te uploaden'}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.75rem'
                  }}>
                    JPG, PNG tot 5MB - 16:9 ratio aanbevolen
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
            
            {errors.thumbnail && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {errors.thumbnail}
              </p>
            )}
            
            <p style={{
              fontSize: '0.75rem',
              color: thumbnailOptional ? '#f59e0b' : '#10b981',
              marginTop: '0.5rem',
              fontStyle: 'italic'
            }}>
              {thumbnailOptional 
                ? '⚠️ Zonder thumbnail wordt YouTube thumbnail gebruikt (werkt mogelijk niet bij unlisted videos)'
                : '✓ Custom thumbnail zorgt voor consistente weergave'
              }
            </p>
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
              placeholder="Korte beschrijving van de video..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'vertical',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
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
                fontSize: '0.95rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
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
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
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
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
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
