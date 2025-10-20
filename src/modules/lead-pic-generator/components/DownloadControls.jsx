// src/modules/lead-pic-generator/components/DownloadControls.jsx
import React from 'react'
import { Download } from 'lucide-react'

export default function DownloadControls({ 
  currentSlide, 
  isDownloading, 
  downloadSlide, 
  downloadAllSlides, 
  isMobile 
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => downloadSlide(currentSlide)}
        disabled={isDownloading}
        style={{
          padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          cursor: isDownloading ? 'wait' : 'pointer',
          transition: 'all 0.3s ease',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
        onMouseEnter={(e) => {
          if (!isDownloading) {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <Download size={20} />
        {isDownloading ? 'Downloaden...' : `Download Slide ${currentSlide + 1}`}
      </button>

      <button
        onClick={downloadAllSlides}
        disabled={isDownloading}
        style={{
          padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          border: 'none',
          borderRadius: '12px',
          cursor: isDownloading ? 'wait' : 'pointer',
          transition: 'all 0.3s ease',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '700',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
        onMouseEnter={(e) => {
          if (!isDownloading) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <Download size={20} />
        {isDownloading ? 'Downloaden...' : 'Download Alle 3 Slides'}
      </button>
    </div>
  )
}
