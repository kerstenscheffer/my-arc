import React, { useState, useRef } from 'react'

export default function PhotoLibrary({ 
  photoLibrary, 
  setPhotoLibrary, 
  currentPage,
  isMobile 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedPhoto, setDraggedPhoto] = useState(null)
  const fileInputRef = useRef(null)
  
  // Get slot info for current page
  const getPageSlots = (pageIndex) => {
    if (pageIndex === 0) return [{ id: `page-0-hero`, type: 'hero', label: 'Cover Photo' }]
    if (pageIndex === 12) return [
      { id: `page-12-hero`, type: 'hero', label: 'Profile Photo' },
      { id: `page-12-qr`, type: 'qr', label: 'QR Code' }
    ]
    if (pageIndex === 11) return [] // Master checklist has no photos
    
    // Truth and Checklist pages have watermarks
    if (pageIndex % 2 === 0) {
      return [{ id: `page-${pageIndex}-watermark`, type: 'watermark', label: 'Watermark' }]
    } else {
      return [{ id: `page-${pageIndex}-watermark`, type: 'watermark', label: 'Watermark' }]
    }
  }
  
  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen toegestaan')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB per foto')
      return
    }
    
    // Create blob URL
    const url = URL.createObjectURL(file)
    
    // Add to library
    const newPhoto = {
      id: Date.now().toString(),
      url: url,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
    
    setPhotoLibrary({
      ...photoLibrary,
      uploads: [...photoLibrary.uploads, newPhoto]
    })
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Assign photo to slot
  const assignPhoto = (slotId, photoId) => {
    setPhotoLibrary({
      ...photoLibrary,
      assignments: {
        ...photoLibrary.assignments,
        [slotId]: photoId
      }
    })
  }
  
  // Remove photo from library
  const removePhoto = (photoId) => {
    // Remove from uploads
    const newUploads = photoLibrary.uploads.filter(p => p.id !== photoId)
    
    // Remove all assignments of this photo
    const newAssignments = {}
    Object.entries(photoLibrary.assignments).forEach(([slot, id]) => {
      if (id !== photoId) {
        newAssignments[slot] = id
      }
    })
    
    setPhotoLibrary({
      uploads: newUploads,
      assignments: newAssignments
    })
  }
  
  // Clear slot assignment
  const clearSlot = (slotId) => {
    const newAssignments = { ...photoLibrary.assignments }
    delete newAssignments[slotId]
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  // Bulk assign
  const bulkAssign = (photoId, type) => {
    const newAssignments = { ...photoLibrary.assignments }
    
    if (type === 'all-watermarks') {
      // Assign to all truth and checklist pages (1-10)
      for (let i = 1; i <= 10; i++) {
        newAssignments[`page-${i}-watermark`] = photoId
      }
    } else if (type === 'all-truth') {
      // Only truth pages (2,4,6,8,10)
      [2,4,6,8,10].forEach(i => {
        newAssignments[`page-${i}-watermark`] = photoId
      })
    } else if (type === 'all-checklist') {
      // Only checklist pages (1,3,5,7,9)
      [1,3,5,7,9].forEach(i => {
        newAssignments[`page-${i}-watermark`] = photoId
      })
    }
    
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  const currentSlots = getPageSlots(currentPage)
  
  return (
    <>
      {/* Floating Library Panel */}
      <div style={{
        position: 'fixed',
        top: isMobile ? '80px' : '100px',
        right: isMobile ? '10px' : '20px',
        width: isExpanded ? (isMobile ? '90%' : '350px') : '60px',
        maxHeight: '70vh',
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>📁</span>
            {isExpanded && (
              <div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  Photo Library
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {photoLibrary.uploads.length} photos
                </div>
              </div>
            )}
          </div>
          <div style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s ease'
          }}>
            ▼
          </div>
        </div>
        
        {/* Content */}
        {isExpanded && (
          <div style={{
            padding: '1rem',
            overflowY: 'auto',
            maxHeight: 'calc(70vh - 80px)'
          }}>
            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '2px dashed rgba(16, 185, 129, 0.5)',
                  borderRadius: '10px',
                  color: '#10b981',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                }}
              >
                + Upload Photo
              </label>
            </div>
            
            {/* Photo Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {photoLibrary.uploads.map(photo => (
                <div 
                  key={photo.id}
                  draggable
                  onDragStart={() => setDraggedPhoto(photo.id)}
                  onDragEnd={() => setDraggedPhoto(null)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  {/* Photo actions */}
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removePhoto(photo.id)
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Photo name tooltip */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '0.25rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    fontSize: '0.6rem',
                    color: '#fff',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            {photoLibrary.uploads.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                paddingTop: '1rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '0.5rem'
                }}>
                  Quick Actions
                </div>
                
                <select
                  onChange={(e) => {
                    const [action, photoId] = e.target.value.split(':')
                    if (action && photoId) {
                      bulkAssign(photoId, action)
                      e.target.value = ''
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#111',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">Bulk assign photo...</option>
                  {photoLibrary.uploads.map(photo => (
                    <optgroup key={photo.id} label={photo.name}>
                      <option value={`all-watermarks:${photo.id}`}>
                        → All watermarks (10x)
                      </option>
                      <option value={`all-truth:${photo.id}`}>
                        → Truth pages only (5x)
                      </option>
                      <option value={`all-checklist:${photo.id}`}>
                        → Checklist pages only (5x)
                      </option>
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Current Page Slots */}
      {currentSlots.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '0.75rem'
          }}>
            Photo Slots - Page {currentPage + 1}
          </div>
          
          {currentSlots.map(slot => {
            const assignedPhoto = photoLibrary.uploads.find(
              p => p.id === photoLibrary.assignments[slot.id]
            )
            
            return (
              <div 
                key={slot.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedPhoto) {
                    assignPhoto(slot.id, draggedPhoto)
                  }
                }}
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '2px dashed rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {assignedPhoto ? (
                    <>
                      <img 
                        src={assignedPhoto.url}
                        alt={assignedPhoto.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#fff'
                        }}>
                          {slot.label}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {assignedPhoto.name}
                        </div>
                      </div>
                      <button
                        onClick={() => clearSlot(slot.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <div style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Drag photo here for {slot.label}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
