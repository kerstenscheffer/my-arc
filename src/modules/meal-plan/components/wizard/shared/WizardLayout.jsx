// src/modules/meal-plan/components/wizard/shared/WizardLayout.jsx
// PREMIUM STYLED - Fullscreen wizard layout with glassmorphic design

import React from 'react'
import ProgressDots from './ProgressDots'
import NavigationButtons from './NavigationButtons'
import { X } from 'lucide-react'

export default function WizardLayout({
  currentSlide,
  totalSlides,
  canGoNext,
  canGoBack,
  onNext,
  onBack,
  onClose,
  isMobile,
  children
}) {
  return (
    <div style={{
      // Full screen overlay
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0.5rem' : '1rem',
      animation: 'fadeIn 0.3s ease',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Wizard Container - Glassmorphic */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(23, 23, 23, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '20px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1400px',
        maxHeight: isMobile ? '98vh' : '95vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)',
          opacity: 0.6,
          zIndex: 10
        }} />
        
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Close Button - Premium */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isMobile ? '0.875rem' : '1rem',
            right: isMobile ? '0.875rem' : '1rem',
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: isMobile ? '10px' : '12px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 11,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <X 
            size={isMobile ? 20 : 22} 
            color="#ef4444"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))' }}
          />
        </button>

        {/* Progress Section - Glassmorphic */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '1.125rem 1rem 0.875rem' : '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)',
          zIndex: 2
        }}>
          {/* Inner shine */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <ProgressDots 
            currentSlide={currentSlide} 
            totalSlides={totalSlides}
            isMobile={isMobile}
          />
        </div>

        {/* Content Area - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile ? '1.25rem 1rem' : '1.75rem 1.5rem',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 2,
          
          // Custom scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(16, 185, 129, 0.3) rgba(255, 255, 255, 0.05)'
        }}>
          {children}
        </div>

        {/* Navigation Section - Glassmorphic */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '0.875rem 1rem' : '1.125rem 1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          zIndex: 2
        }}>
          {/* Top shine */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <NavigationButtons
            currentSlide={currentSlide}
            totalSlides={totalSlides}
            canGoNext={canGoNext}
            canGoBack={canGoBack}
            onNext={onNext}
            onBack={onBack}
            isMobile={isMobile}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Custom Scrollbar Webkit */
        *::-webkit-scrollbar {
          width: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  )
}
