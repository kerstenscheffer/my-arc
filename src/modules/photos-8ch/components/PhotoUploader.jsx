// src/modules/photos-8ch/components/PhotoUploader.jsx
import React, { useState, useRef, useEffect } from 'react'
import { 
  Camera, Upload, X, Image, Check, AlertCircle,
  Utensils, Dumbbell, Trophy, Star, ChevronLeft,
  Clock, Target, Loader
} from 'lucide-react'

export default function PhotoUploader({ 
  service, 
  clientId, 
  onUploaded, 
  uploadType = null,
  todayPhotos = null,
  isMobile = false
}) {
  // State management
  const [currentView, setCurrentView] = useState(uploadType ? 'upload' : 'type-select')
  const [selectedType, setSelectedType] = useState(uploadType)
  const [selectedSubtype, setSelectedSubtype] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  
  // Additional metadata states
  const [mealType, setMealType] = useState(null)
  const [exerciseName, setExerciseName] = useState('')
  const [rating, setRating] = useState(0)
  const [victoryNote, setVictoryNote] = useState('')
  
  // Refs
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  
  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewImage?.url) {
        URL.revokeObjectURL(previewImage.url)
      }
    }
  }, [previewImage])

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Alleen afbeeldingen zijn toegestaan')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Bestand is te groot (max 10MB)')
      return
    }
    
    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewImage({
      file: file,
      url: url,
      name: file.name,
      size: file.size
    })
    
    setError(null)
    setCurrentView('preview')
  }

  // Handle upload
  const handleUpload = async () => {
    if (!previewImage?.file || !selectedType) {
      setError('Geen foto geselecteerd')
      return
    }
    
    setUploading(true)
    setError(null)
    setUploadProgress(0)
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      // Prepare metadata
      const extraData = {
        subtype: selectedSubtype,
        mealType: mealType,
        exercise: exerciseName,
        rating: rating,
        note: victoryNote
      }
      
      // Upload photo
      await service.uploadPhoto(
        clientId,
        previewImage.file,
        selectedType,
        extraData
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Success feedback
      setTimeout(() => {
        URL.revokeObjectURL(previewImage.url)
        // Reset to type selection
        setCurrentView('type-select')
        setPreviewImage(null)
        setSelectedType(null)
        setSelectedSubtype(null)
        setMealType(null)
        setExerciseName('')
        setRating(0)
        setVictoryNote('')
        onUploaded()
      }, 500)
      
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload mislukt. Probeer opnieuw.')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  // Render type selection
  const renderTypeSelection = () => (
    <div>
      <h3 style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: '600',
        color: 'white',
        marginBottom: isMobile ? '0.75rem' : '1rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        opacity: 0.7
      }}>
        Upload Nieuwe Foto
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <button
          onClick={() => {
            setSelectedType('progress')
            setCurrentView('progress-type')
          }}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8b5cf6'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Camera size={24} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#8b5cf6' }}>
            Progress
          </div>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(139, 92, 246, 0.6)', marginTop: '0.1rem' }}>
            Front & Zij
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedType('meal')
            setCurrentView('meal-type')
          }}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10b981'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Utensils size={24} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#10b981' }}>
            Maaltijd
          </div>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(16, 185, 129, 0.6)', marginTop: '0.1rem' }}>
            Voeding
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedType('workout')
            setCurrentView('workout-details')
          }}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.05))',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f97316'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Dumbbell size={24} color="#f97316" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#f97316' }}>
            Workout
          </div>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(249, 115, 22, 0.6)', marginTop: '0.1rem' }}>
            Training
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedType('victory')
            setCurrentView('victory-details')
          }}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fbbf24'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <Trophy size={24} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '600', color: '#fbbf24' }}>
            Victory
          </div>
          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(251, 191, 36, 0.6)', marginTop: '0.1rem' }}>
            Succes
          </div>
        </button>
      </div>
    </div>
  )

  // Render progress type selection
  const renderProgressType = () => (
    <div>
      <button
        onClick={() => setCurrentView('type-select')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(139, 92, 246, 0.7)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.85rem'
        }}
      >
        <ChevronLeft size={14} />
        Terug
      </button>
      
      <h3 style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: '600',
        color: '#8b5cf6',
        marginBottom: '0.75rem'
      }}>
        Kies Progress Angle
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {[
          { angle: 'front', label: 'Voorkant' },
          { angle: 'side', label: 'Zijkant' }
        ].map(item => (
          <button
            key={item.angle}
            onClick={() => {
              setSelectedSubtype(item.angle)
              setCurrentView('upload')
              setTimeout(() => fileInputRef.current?.click(), 100)
            }}
            style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
              e.currentTarget.style.borderColor = '#8b5cf6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'
            }}
          >
            <Camera size={28} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: '#8b5cf6'
            }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  // Render meal type selection
  const renderMealType = () => (
    <div>
      <button
        onClick={() => setCurrentView('type-select')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(16, 185, 129, 0.7)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.85rem'
        }}
      >
        <ChevronLeft size={14} />
        Terug
      </button>
      
      <h3 style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: '600',
        color: '#10b981',
        marginBottom: '0.75rem'
      }}>
        Welke maaltijd?
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {['Ontbijt', 'Lunch', 'Diner', 'Snack'].map(meal => (
          <button
            key={meal}
            onClick={() => {
              setMealType(meal.toLowerCase())
              setCurrentView('upload')
              setTimeout(() => fileInputRef.current?.click(), 100)
            }}
            style={{
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              e.currentTarget.style.borderColor = '#10b981'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
            }}
          >
            {meal}
          </button>
        ))}
      </div>
    </div>
  )

  // Simplified other detail forms
  const renderWorkoutDetails = () => (
    <div>
      <button
        onClick={() => setCurrentView('type-select')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(249, 115, 22, 0.7)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.85rem'
        }}
      >
        <ChevronLeft size={14} />
        Terug
      </button>
      
      <button
        onClick={() => {
          setCurrentView('upload')
          setTimeout(() => fileInputRef.current?.click(), 100)
        }}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.1))',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: '10px',
          color: '#f97316',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Upload Workout Foto
      </button>
    </div>
  )

  const renderVictoryDetails = () => (
    <div>
      <button
        onClick={() => setCurrentView('type-select')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(251, 191, 36, 0.7)',
          cursor: 'pointer',
          fontSize: isMobile ? '0.75rem' : '0.85rem'
        }}
      >
        <ChevronLeft size={14} />
        Terug
      </button>
      
      <button
        onClick={() => {
          setCurrentView('upload')
          setTimeout(() => fileInputRef.current?.click(), 100)
        }}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.1))',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: '10px',
          color: '#fbbf24',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Upload Victory Foto
      </button>
    </div>
  )

  // Render preview
  const renderPreview = () => (
    <div>
      {previewImage && (
        <div style={{
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          background: '#000'
        }}>
          <img
            src={previewImage.url}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      )}
      
      {/* Upload progress */}
      {uploading && (
        <div style={{
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(139, 92, 246, 0.7)',
            marginBottom: '0.5rem'
          }}>
            Uploading... {uploadProgress}%
          </div>
          <div style={{
            height: '4px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: '0.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      
      {/* Action buttons */}
      {!uploading && (
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => {
              setPreviewImage(null)
              setCurrentView('type-select')
            }}
            style={{
              flex: 1,
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Annuleer
          </button>
          
          <button
            onClick={handleUpload}
            style={{
              flex: 2,
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Upload size={16} />
            Upload
          </button>
        </div>
      )}
    </div>
  )

  // Hidden file inputs
  const renderUpload = () => (
    <div style={{ display: 'none' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
      />
    </div>
  )

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      padding: isMobile ? '0.875rem' : '1.25rem',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }}>
      {/* Dynamic content based on current view */}
      {currentView === 'type-select' && renderTypeSelection()}
      {currentView === 'meal-type' && renderMealType()}
      {currentView === 'progress-type' && renderProgressType()}
      {currentView === 'workout-details' && renderWorkoutDetails()}
      {currentView === 'victory-details' && renderVictoryDetails()}
      {currentView === 'preview' && renderPreview()}
      {currentView === 'upload' && renderUpload()}
    </div>
  )
}
