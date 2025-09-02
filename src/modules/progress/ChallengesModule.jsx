import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Camera, Plus, Calendar, Lock, Unlock, Download,
  ChevronLeft, ChevronRight, Grid, List, Upload,
  Image, Trash2, Eye, EyeOff, Check, X, Star
} from 'lucide-react'
import ProgressService from './core/ProgressService'

const THEME = {
  primary: '#8b5cf6',
  gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
  border: 'rgba(139, 92, 246, 0.2)'
}

export default function PhotosModule({ client, db }) {
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [photoType, setPhotoType] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [uploadPreview, setUploadPreview] = useState(null)
  
  const isMobile = useIsMobile()

  useEffect(() => {
    loadPhotos()
  }, [client?.id, photoType])

  const loadPhotos = async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      const photoData = await ProgressService.getProgressPhotos(
        client.id,
        photoType === 'all' ? null : photoType
      )
      setPhotos(photoData || [])
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview({
          file,
          preview: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async (type) => {
    if (!uploadPreview?.file || !client?.id) return

    try {
      await ProgressService.uploadProgressPhoto(client.id, uploadPreview.file, type)
      setShowUpload(false)
      setUploadPreview(null)
      await loadPhotos()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Er ging iets mis bij het uploaden')
    }
  }

  const handleCompareSelect = (photo) => {
    if (compareMode) {
      if (selectedPhotos.find(p => p.id === photo.id)) {
        setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id))
      } else if (selectedPhotos.length < 2) {
        setSelectedPhotos([...selectedPhotos, photo])
      }
    }
  }

  const renderPhotoCard = (photo, index) => {
    const isSelected = selectedPhotos.find(p => p.id === photo.id)
    
    return (
      <div
        key={photo.id || index}
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: compareMode ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          border: isSelected ? `3px solid ${THEME.primary}` : 'none'
        }}
        onClick={() => handleCompareSelect(photo)}
        onMouseEnter={(e) => {
          if (!compareMode) {
            e.currentTarget.style.transform = 'scale(1.02)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <img
          src={photo.signedUrl || photo.photo_url}
          alt={`Progress ${index + 1}`}
          style={{
            width: '100%',
            height: viewMode === 'grid' ? '200px' : '300px',
            objectFit: 'cover'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          padding: '1rem',
          color: '#fff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                marginBottom: '0.25rem'
              }}>
                {new Date(photo.date_taken).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              {photo.metadata?.weight && (
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {photo.metadata.weight} kg
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {photo.photo_type === 'meal' && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.7rem'
                }}>
                  🍽️ Meal
                </div>
              )}
              {photo.photo_type === 'action' && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.7rem'
                }}>
                  💪 Action
                </div>
              )}
              {photo.is_private && <Lock size={16} />}
            </div>
          </div>
        </div>

        {compareMode && isSelected && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: THEME.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={18} color="#fff" />
          </div>
        )}
      </div>
    )
  }

  const renderUploadModal = () => {
    if (!showUpload) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          border: `1px solid ${THEME.border}`
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: THEME.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={20} color="#fff" />
            </div>
            Foto toevoegen
          </h2>

          {!uploadPreview ? (
            <div>
              <label
                htmlFor="photo-upload"
                style={{
                  display: 'block',
                  padding: '3rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: `2px dashed ${THEME.border}`,
                  borderRadius: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                }}
              >
                <Upload size={48} color={THEME.primary} style={{ marginBottom: '1rem' }} />
                <div style={{
                  fontSize: '1.1rem',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  Klik om foto te selecteren
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  of sleep een bestand hierheen
                </div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <img
                src={uploadPreview.preview}
                alt="Upload preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem'
              }}>
                Selecteer foto type:
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                {[
                  { type: 'progress', label: 'Progress', icon: '📸' },
                  { type: 'meal', label: 'Maaltijd', icon: '🍽️' },
                  { type: 'action', label: 'Actie', icon: '💪' }
                ].map(option => (
                  <button
                    key={option.type}
                    onClick={() => handleUpload(option.type)}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = THEME.lightGradient
                      e.currentTarget.style.borderColor = THEME.primary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{
                      fontSize: '1.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {option.icon}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#fff'
                    }}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setUploadPreview(null)
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer'
                }}
              >
                Andere foto kiezen
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setShowUpload(false)
              setUploadPreview(null)
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
      </div>
    )
  }

  const renderComparisonView = () => {
    if (selectedPhotos.length !== 2) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Selecteer 2 foto's om te vergelijken
        </div>
      )
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1rem'
      }}>
        {selectedPhotos.map((photo, index) => (
          <div key={index}>
            <div style={{
              background: index === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: index === 0 ? '#ef4444' : '#10b981'
            }}>
              {index === 0 ? 'Voor' : 'Na'}
            </div>
            <img
              src={photo.signedUrl || photo.photo_url}
              alt={index === 0 ? 'Before' : 'After'}
              style={{
                width: '100%',
                borderRadius: '12px'
              }}
            />
            <div style={{
              marginTop: '0.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              {new Date(photo.date_taken).toLocaleDateString('nl-NL')}
              {photo.metadata?.weight && ` • ${photo.metadata.weight} kg`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: `3px solid ${THEME.border}`,
          borderTopColor: THEME.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          {['all', 'progress', 'meal', 'action'].map(type => (
            <button
              key={type}
              onClick={() => setPhotoType(type)}
              style={{
                padding: '0.5rem 1rem',
                background: photoType === type ? THEME.gradient : 'rgba(255, 255, 255, 0.05)',
                border: photoType === type ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: photoType === type ? '600' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize'
              }}
            >
              {type === 'all' ? 'Alle' : type}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setSelectedPhotos([])
            }}
            style={{
              padding: '0.5rem',
              background: compareMode ? THEME.gradient : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Eye size={18} color="#fff" />
          </button>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {viewMode === 'grid' ? <List size={18} color="#fff" /> : <Grid size={18} color="#fff" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {compareMode && selectedPhotos.length === 2 ? (
        renderComparisonView()
      ) : photos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: THEME.lightGradient,
          borderRadius: '20px',
          border: `1px solid ${THEME.border}`
        }}>
          <Camera size={64} color={THEME.primary} style={{ marginBottom: '1rem' }} />
          <h3 style={{
            fontSize: '1.2rem',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Nog geen foto's
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.5rem'
          }}>
            Begin met het vastleggen van je transformatie!
          </p>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              padding: '0.75rem 2rem',
              background: THEME.gradient,
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 10px 30px ${THEME.primary}44`
            }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
            Eerste foto toevoegen
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' 
            ? (isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
            : '1fr',
          gap: '1rem'
        }}>
          {photos.map((photo, index) => renderPhotoCard(photo, index))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowUpload(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '90px' : '2rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: THEME.gradient,
          border: 'none',
          boxShadow: `0 10px 30px ${THEME.primary}66`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <Plus size={24} color="#fff" />
      </button>

      {/* Upload Modal */}
      {renderUploadModal()}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
