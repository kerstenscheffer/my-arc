// src/modules/lead-pic-generator/components/ImageUploader.jsx
import React from 'react'
import { Upload, X } from 'lucide-react'

export default function ImageUploader({ 
  backgroundImage, 
  setBackgroundImage, 
  currentSlide,
  slideType,
  isMobile 
}) {
  
  // Dynamic label based on slide type
  const getUploadLabel = () => {
    switch(slideType) {
      case 'hook':
        return 'Upload Achtergrond - Hook (Slide 1)'
      case 'body':
        return 'Upload Achtergrond - Body (Slide 2)'
      case 'reward':
        return 'Upload Achtergrond - Reward (Slide 3)'
      default:
        return 'Upload Achtergrond Foto'
    }
  }

  // Get slide color based on type
  const getSlideColor = () => {
    switch(slideType) {
      case 'hook':
        return { primary: '#3b82f6', secondary: 'rgba(59, 130, 246, 0.1)' }
      case 'body':
        return { primary: '#10b981', secondary: 'rgba(16, 185, 129, 0.1)' }
      case 'reward':
        return { primary: '#f59e0b', secondary: 'rgba(245, 158, 11, 0.1)' }
      default:
        return { primary: '#10b981', secondary: 'rgba(16, 185, 129, 0.1)' }
    }
  }

  const colors = getSlideColor()

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackgroundImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setBackgroundImage(null)
  }

  return (
    <div style={{
      textAlign: 'center',
      marginBottom: isMobile ? '1.5rem' : '2rem',
      padding: isMobile ? '1rem' : '1.5rem',
      background: colors.secondary,
      borderRadius: '16px',
      border: `1px solid ${colors.primary}30`
    }}>
      {/* Title */}
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: '600',
        color: colors.primary,
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {getUploadLabel()}
      </h3>

      {/* Upload Button or Preview */}
      {!backgroundImage ? (
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: `linear-gradient(135deg, ${colors.secondary} 0%, transparent 100%)`,
          border: `2px solid ${colors.primary}40`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          color: '#fff'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.secondary} 100%)`
            e.currentTarget.style.borderColor = colors.primary
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 8px 20px ${colors.primary}20`
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.secondary} 0%, transparent 100%)`
            e.currentTarget.style.borderColor = `${colors.primary}40`
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.secondary} 100%)`
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = `linear-gradient(135deg, ${colors.secondary} 0%, transparent 100%)`
          }
        }}>
          <Upload size={20} color={colors.primary} />
          <span>Kies Foto</span>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div style={{
          position: 'relative',
          display: 'inline-block'
        }}>
          {/* Image Preview */}
          <div style={{
            width: isMobile ? '200px' : '250px',
            height: isMobile ? '100px' : '125px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `2px solid ${colors.primary}`,
            position: 'relative'
          }}>
            <img 
              src={backgroundImage} 
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Overlay gradient */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
            }} />
          </div>

          {/* Remove Button */}
          <button
            onClick={removeImage}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
                e.currentTarget.style.background = '#dc2626'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                e.currentTarget.style.background = '#ef4444'
              }
            }}>
            <X size={16} color="#fff" strokeWidth={3} />
          </button>

          {/* Status Text */}
          <p style={{
            marginTop: '0.75rem',
            color: colors.primary,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colors.primary,
              display: 'inline-block',
              animation: 'pulse 2s infinite'
            }} />
            Achtergrond Actief
          </p>

          {/* Replace Button */}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: `1px solid ${colors.primary}40`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: colors.primary,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = `${colors.primary}10`
              e.currentTarget.style.borderColor = colors.primary
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = `${colors.primary}40`
            }
          }}>
            <Upload size={16} color={colors.primary} />
            Vervang Foto
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Helper Text */}
      <p style={{
        marginTop: '1rem',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic'
      }}>
        Tip: Gebruik een foto met {slideType === 'hook' ? 'impact' : slideType === 'body' ? 'actie' : 'resultaat'}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
