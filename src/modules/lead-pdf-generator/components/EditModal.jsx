import React, { useState, useEffect } from 'react'
import TruthEditFields from './TruthEditFields'
import ChecklistEditFields from './ChecklistEditFields'
import CoverEditFields from './CoverEditFields'
import MasterEditFields from './MasterEditFields'
import CTAEditFields from './CTAEditFields'

// Import templates for preview
import CoverPage from '../templates/CoverPage'
import TruthPage from '../templates/TruthPage'
import ChecklistPage from '../templates/ChecklistPage'
import MasterChecklistPage from '../templates/MasterChecklistPage'
import CTAPage from '../templates/CTAPage'

export default function EditModal({ 
  isOpen,
  onClose,
  pageIndex,
  pageType,
  content,
  onUpdate,
  yourPhoto,
  settings
}) {
  const isMobile = window.innerWidth <= 768
  const [localContent, setLocalContent] = useState(null)
  const [showPreview, setShowPreview] = useState(!isMobile)
  
  // Initialize local content based on page type
  useEffect(() => {
    if (!isOpen) return
    
    switch(pageType) {
      case 'cover':
        setLocalContent(content.cover)
        break
      case 'truth':
        const truthIndex = Math.floor(pageIndex / 2) - 1
        setLocalContent(content.truths[truthIndex])
        break
      case 'checklist':
        const checklistIndex = Math.floor((pageIndex - 1) / 2)
        setLocalContent(content.checklists[checklistIndex])
        break
      case 'master':
        setLocalContent(content.masterChecklist)
        break
      case 'cta':
        setLocalContent(content.cta)
        break
      default:
        setLocalContent(null)
    }
  }, [isOpen, pageIndex, pageType, content])
  
  if (!isOpen || !localContent) return null
  
  // Handle save
  const handleSave = () => {
    let updatedContent = { ...content }
    
    switch(pageType) {
      case 'cover':
        updatedContent.cover = localContent
        break
      case 'truth':
        const truthIndex = Math.floor(pageIndex / 2) - 1
        updatedContent.truths[truthIndex] = localContent
        break
      case 'checklist':
        const checklistIndex = Math.floor((pageIndex - 1) / 2)
        updatedContent.checklists[checklistIndex] = localContent
        break
      case 'master':
        updatedContent.masterChecklist = localContent
        break
      case 'cta':
        updatedContent.cta = localContent
        break
    }
    
    onUpdate(updatedContent)
    onClose()
  }
  
  // Get page title for header
  const getPageTitle = () => {
    switch(pageType) {
      case 'cover': return 'Cover Page'
      case 'truth': return `Truth ${Math.floor(pageIndex / 2)}`
      case 'checklist': return `Checklist ${Math.floor((pageIndex + 1) / 2)}`
      case 'master': return 'Master Checklist'
      case 'cta': return 'Call to Action'
      default: return 'Edit Page'
    }
  }
  
  // Render preview based on page type
  const renderPreview = () => {
    const previewProps = {
      content: { ...content },
      yourPhoto: yourPhoto,
      pageIndex: pageIndex
    }
    
    // Update with local changes
    switch(pageType) {
      case 'cover':
        previewProps.content.cover = localContent
        return <CoverPage {...previewProps} />
      case 'truth':
        const truthIndex = Math.floor(pageIndex / 2) - 1
        previewProps.content.truths[truthIndex] = localContent
        return <TruthPage {...previewProps} truthIndex={truthIndex} />
      case 'checklist':
        const checklistIndex = Math.floor((pageIndex - 1) / 2)
        previewProps.content.checklists[checklistIndex] = localContent
        return <ChecklistPage {...previewProps} checklistIndex={checklistIndex} />
      case 'master':
        previewProps.content.masterChecklist = localContent
        return <MasterChecklistPage {...previewProps} />
      case 'cta':
        previewProps.content.cta = localContent
        return <CTAPage {...previewProps} />
      default:
        return null
    }
  }
  
  // Render edit fields based on page type
  const renderEditFields = () => {
    const fieldProps = {
      content: localContent,
      onChange: setLocalContent,
      isMobile: isMobile
    }
    
    switch(pageType) {
      case 'truth':
        return <TruthEditFields {...fieldProps} truthIndex={Math.floor(pageIndex / 2) - 1} />
      case 'checklist':
        return <ChecklistEditFields {...fieldProps} checklistIndex={Math.floor((pageIndex + 1) / 2)} />
      case 'cover':
        return <CoverEditFields {...fieldProps} />
      case 'master':
        return <MasterEditFields {...fieldProps} />
      case 'cta':
        return <CTAEditFields {...fieldProps} />
      default:
        return <div>No editor available</div>
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '2rem',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '1400px',
        height: isMobile ? '100vh' : '90vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
        borderRadius: isMobile ? '0' : '20px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(16, 185, 129, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          background: 'rgba(16, 185, 129, 0.05)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              Edit {getPageTitle()}
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              margin: '0.25rem 0 0 0'
            }}>
              Page {pageIndex + 1} of 13
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden'
        }}>
          {/* Edit Panel */}
          <div style={{
            width: isMobile ? '100%' : '40%',
            padding: isMobile ? '1rem' : '2rem',
            overflowY: 'auto',
            borderRight: isMobile ? 'none' : '1px solid rgba(16, 185, 129, 0.1)'
          }}>
            {/* Mobile Preview Toggle */}
            {isMobile && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '1.5rem',
                  background: showPreview 
                    ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                    : 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {showPreview ? '👁️ Preview Shown' : '👁️ Show Preview'}
              </button>
            )}
            
            {/* Edit Fields */}
            {renderEditFields()}
          </div>
          
          {/* Preview Panel */}
          {(!isMobile || showPreview) && (
            <div style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '1rem' : '2rem',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                LIVE PREVIEW
              </div>
              
              <div style={{
                background: '#000',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                overflow: 'hidden',
                transform: isMobile ? 'scale(0.3)' : 'scale(0.45)',
                transformOrigin: 'center center'
              }}>
                {renderPreview()}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem 2rem',
          background: 'rgba(16, 185, 129, 0.02)',
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              fontSize: isMobile ? '0.9rem' : '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            style={{
              padding: isMobile ? '0.75rem 2rem' : '0.875rem 3rem',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '700',
              fontSize: isMobile ? '0.9rem' : '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
