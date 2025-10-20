// src/modules/lead-pic-generator/components/PreviewArea.jsx
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PreviewArea({ currentSlide, previewSlides, setCurrentSlide, isMobile }) {
  const previewScale = isMobile ? 0.25 : 0.3
  const previewWidth = Math.round(1080 * previewScale)
  const previewHeight = Math.round(1350 * previewScale)

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '1rem' : '2rem',
        marginBottom: '1.5rem'
      }}>
        {/* Previous Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            style={{
              padding: '0.75rem',
              background: currentSlide === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === 0 ? 0.3 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <ChevronLeft size={24} color="#10b981" />
          </button>
        )}

        {/* Slide Preview Container */}
        <div style={{
          width: `${previewWidth}px`,
          height: `${previewHeight}px`,
          position: 'relative',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)',
          background: '#000'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            width: '1080px',
            height: '1350px'
          }}>
            {previewSlides[currentSlide]}
          </div>
        </div>

        {/* Next Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={() => setCurrentSlide(Math.min(2, currentSlide + 1))}
            disabled={currentSlide === 2}
            style={{
              padding: '0.75rem',
              background: currentSlide === 2 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              cursor: currentSlide === 2 ? 'not-allowed' : 'pointer',
              opacity: currentSlide === 2 ? 0.3 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <ChevronRight size={24} color="#10b981" />
          </button>
        )}
      </div>

      {/* Slide Indicators */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: 'none',
              background: index === currentSlide ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </>
  )
}
