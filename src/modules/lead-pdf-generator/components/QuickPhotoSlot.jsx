import { useState } from 'react'
import { Upload, X, Image, Camera } from 'lucide-react'

export default function QuickPhotoSlot({ 
  currentPage,
  photoLibrary, 
  setPhotoLibrary,
  isMobile 
}) {
  const [dragOver, setDragOver] = useState(false)
  
  // Determine slot ID based on current page
  const getSlotId = () => {
    if (currentPage === 0) return 'page-0-hero'
    if (currentPage === 12) return 'page-12-hero'
    // Pages 1-10 are watermarks
    return `page-${currentPage}-watermark`
  }
  
  const slotId = getSlotId()
  
  // Get current photo for this page
  const currentPhoto = photoLibrary.uploads.find(
    p => p.id === photoLibrary.assignments[slotId]
  )
  
  // Get page name for display
  const getPageName = () => {
    if (currentPage === 0) return 'Cover Photo'
    if (currentPage === 12) return 'Profile Photo'
    if (currentPage === 11) return 'Master Checklist'
    if (currentPage % 2 === 0) {
      return `Truth ${Math.floor(currentPage / 2)}`
    }
    return `Checklist ${Math.floor((currentPage + 1) / 2)}`
  }
  
  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      
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
      
      // Update photo library with new upload and assignment
      setPhotoLibrary({
        uploads: [...photoLibrary.uploads, newPhoto],
        assignments: {
          ...photoLibrary.assignments,
          [slotId]: newPhoto.id
        }
      })
    }
  }
  
  // Handle file input
  const handleFileInput = (e) => {
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
    
    // Update photo library with new upload and assignment
    setPhotoLibrary({
      uploads: [...photoLibrary.uploads, newPhoto],
      assignments: {
        ...photoLibrary.assignments,
        [slotId]: newPhoto.id
      }
    })
  }
  
  // Clear current page photo
  const clearPhoto = () => {
    const newAssignments = { ...photoLibrary.assignments }
    delete newAssignments[slotId]
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  // Bulk assign to all watermarks
  const bulkAssignToWatermarks = () => {
    if (!currentPhoto) return
    
    const newAssignments = { ...photoLibrary.assignments }
    for (let i = 1; i <= 10; i++) {
      newAssignments[`page-${i}-watermark`] = currentPhoto.id
    }
    setPhotoLibrary({
      ...photoLibrary,
      assignments: newAssignments
    })
  }
  
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      marginBottom: '2rem',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center'
    }}>
      {/* Current Page Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minWidth: isMobile ? '100%' : '200px'
      }}>
        <Camera size={24} style={{ color: '#10b981' }} />
        <div>
          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.25rem'
          }}>
            Page {currentPage + 1} / 13
          </div>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {getPageName()}
          </div>
        </div>
      </div>
      
      {/* Photo Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          flex: 1,
          height: isMobile ? '120px' : '100px',
          background: dragOver ? 
            'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)' :
            currentPhoto ? 
              'rgba(16, 185, 129, 0.1)' :
              'rgba(255, 255, 255, 0.05)',
          border: dragOver ? 
            '2px dashed #10b981' : 
            currentPhoto ?
              '2px solid rgba(16, 185, 129, 0.5)' :
              '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation'
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id={`page-upload-${currentPage}`}
        />
        
        {currentPhoto ? (
          <>
            {/* Photo preview background */}
            <img 
              src={currentPhoto.url}
              alt={currentPhoto.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.3,
                filter: 'blur(2px)'
              }}
            />
            
            {/* Photo info overlay */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              padding: '1rem'
            }}>
              <Image size={32} style={{ marginBottom: '0.5rem', color: '#10b981' }} />
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '0.25rem'
              }}>
                Photo Loaded
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {currentPhoto.name}
              </div>
            </div>
            
            {/* Clear button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearPhoto()
              }}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <label 
            htmlFor={`page-upload-${currentPage}`}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '0.5rem'
            }}
          >
            <Upload size={32} style={{ opacity: 0.7, color: '#10b981' }} />
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              Drop photo here or click
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              For {getPageName().toLowerCase()}
            </div>
          </label>
        )}
      </div>
      
      {/* Bulk assign button for watermark pages */}
      {currentPage >= 1 && currentPage <= 10 && currentPhoto && (
        <button
          onClick={bulkAssignToWatermarks}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            minHeight: '44px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Apply to All Watermarks
        </button>
      )}
    </div>
  )
}
