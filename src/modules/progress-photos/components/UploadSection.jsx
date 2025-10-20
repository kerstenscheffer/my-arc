// src/modules/progress-photos/components/UploadSection.jsx
import React, { useState, useRef } from 'react'
import { Camera, Upload, Utensils, Dumbbell, Trophy, Eye, X } from 'lucide-react'

export default function UploadSection({ 
  onUpload, 
  todayData = {}, 
  isFriday = false,
  isMobile = false 
}) {
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('progress')
  const [showExampleModal, setShowExampleModal] = useState(false)
  const [exampleType, setExampleType] = useState(null)
  const fileInputRef = useRef(null)
  
  const { hasCompleteFriday = false } = todayData

  // Photo type definitions
  const photoTypes = [
    { type: 'progress', icon: Camera, label: 'Progressie', color: '#8b5cf6' },
    { type: 'meal', icon: Utensils, label: 'Maaltijd', color: '#10b981' },
    { type: 'workout', icon: Dumbbell, label: 'Workout', color: '#f97316' },
    { type: 'victory', icon: Trophy, label: 'Victory', color: '#fbbf24' }
  ]

  // Example images
  const exampleImages = {
    progress: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583639687726-84d20f4ac7e2?w=400&h=400&fit=crop'
    ],
    meal: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop'
    ],
    workout: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop'
    ],
    victory: [
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop'
    ]
  }

  // Example tips
  const exampleTips = {
    progress: 'Neem foto\'s van voren EN opzij. Zelfde plek, zelfde licht, elke vrijdag!',
    meal: 'Fotografeer van bovenaf met goed licht. Hele portie in beeld.',
    workout: 'Laat je inzet zien! Tijdens of direct na je training.',
    victory: 'Deel je overwinningen, PRs en trots momenten!'
  }

  // Helper functions
  const getButtonText = () => {
    if (uploading) return 'Uploaden...'
    
    const typeLabels = {
      progress: 'PROGRESSIE FOTO',
      meal: 'MAALTIJD FOTO',
      workout: 'WORKOUT FOTO',
      victory: 'OVERWINNING'
    }
    
    return `UPLOAD ${typeLabels[selectedType]}`
  }

  const getButtonGradient = () => {
    const gradients = {
      progress: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      meal: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      workout: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      victory: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    }
    return gradients[selectedType] || gradients.progress
  }

  const getButtonColor = () => {
    const colors = {
      progress: '#8b5cf6',
      meal: '#10b981',
      workout: '#f97316',
      victory: '#fbbf24'
    }
    return colors[selectedType] || colors.progress
  }

  // Handlers
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedType) return
    
    setUploading(true)
    try {
      await onUpload(file, selectedType)
      setSelectedType('progress')
      fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const openUpload = () => {
    if (!selectedType) {
      alert('Selecteer eerst een foto type!')
      return
    }
    fileInputRef.current?.click()
  }

  const showExample = (type) => {
    setExampleType(type)
    setShowExampleModal(true)
  }

  return (
    <div style={{ 
      marginTop: '0.5rem' // Minimale spacing vanaf vorige sectie
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Friday Alert - Alleen op vrijdag */}
      {isFriday && !hasCompleteFriday && (
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: isMobile ? '0.625rem' : '0.75rem',
          borderRadius: '10px',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.85rem',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
        }}>
          <Camera size={16} />
          VRIJDAG - Upload vandaag je progress foto's!
        </div>
      )}

      {/* Type Selection Grid - Compact */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        {photoTypes.map(item => {
          const Icon = item.icon
          const isSelected = selectedType === item.type
          
          return (
            <div key={item.type} style={{ position: 'relative' }}>
              <button
                onClick={() => setSelectedType(item.type)}
                disabled={uploading}
                style={{
                  width: '100%',
                  background: isSelected
                    ? `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? `1px solid ${item.color}30`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: isMobile ? '0.625rem' : '0.75rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!uploading && !isSelected) {
                    e.currentTarget.style.background = `${item.color}10`
                    e.currentTarget.style.borderColor = `${item.color}20`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <Icon size={isMobile ? 16 : 18} color={isSelected ? item.color : 'rgba(255, 255, 255, 0.5)'} />
                <span style={{
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  color: isSelected ? item.color : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: isSelected ? '600' : '400',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {item.label}
                </span>
                
                {/* Selected dot */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: item.color
                  }} />
                )}
              </button>

              {/* Example link - shows when selected */}
              {isSelected && (
                <button
                  onClick={() => showExample(item.type)}
                  style={{
                    marginTop: '0.25rem',
                    width: '100%',
                    padding: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: item.color,
                    fontSize: isMobile ? '0.6rem' : '0.65rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7'
                  }}
                >
                  <Eye size={10} />
                  voorbeeld
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Main Upload Button - Dynamic color based on type */}
      <button
        onClick={openUpload}
        disabled={uploading}
        style={{
          width: '100%',
          minHeight: isMobile ? '56px' : '64px',
          background: getButtonGradient(),
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
          boxShadow: `0 4px 16px ${getButtonColor()}30`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          opacity: uploading ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = `0 6px 20px ${getButtonColor()}40`
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 4px 16px ${getButtonColor()}30`
        }}
      >
        {uploading ? (
          <>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Uploaden...
          </>
        ) : (
          <>
            <Upload size={isMobile ? 18 : 20} />
            {getButtonText()}
          </>
        )}
      </button>

      {/* Instructions text - Klein en subtiel */}
      <div style={{
        marginTop: '0.5rem',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: `${getButtonColor()}60`,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {selectedType === 'progress' && 'Neem front & side foto\'s'}
        {selectedType === 'meal' && 'Fotografeer van bovenaf'}
        {selectedType === 'workout' && 'Laat je inzet zien'}
        {selectedType === 'victory' && 'Deel je overwinning'}
      </div>

      {/* Example Modal */}
      {showExampleModal && exampleType && (
        <div
          onClick={() => setShowExampleModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: isMobile ? '90%' : '500px',
              width: '100%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: `linear-gradient(135deg, ${getButtonColor()}20 0%, ${getButtonColor()}10 100%)`,
              borderBottom: `1px solid ${getButtonColor()}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {photoTypes.find(t => t.type === exampleType)?.icon && 
                  React.createElement(photoTypes.find(t => t.type === exampleType).icon, {
                    size: 18,
                    color: getButtonColor()
                  })
                }
                <span style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  Voorbeeld: {photoTypes.find(t => t.type === exampleType)?.label}
                </span>
              </div>
              <button
                onClick={() => setShowExampleModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Example Images */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: exampleType === 'progress' ? '1fr 1fr' : '1fr',
              gap: '1px',
              background: 'rgba(255, 255, 255, 0.05)'
            }}>
              {exampleImages[exampleType]?.slice(0, exampleType === 'progress' ? 2 : 1).map((img, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={img}
                    alt={`Voorbeeld ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = `linear-gradient(135deg, ${getButtonColor()}20 0%, ${getButtonColor()}10 100%)`
                      e.target.parentElement.style.height = '200px'
                    }}
                  />
                  {exampleType === 'progress' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: 'white',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {idx === 0 ? 'Front' : 'Side'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                color: getButtonColor(),
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                Tips
              </div>
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.4'
              }}>
                {exampleTips[exampleType]}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
