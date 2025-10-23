// src/modules/meal-plan/components/wizard/shared/NavigationButtons.jsx
// Next/Previous navigatie buttons met disabled states

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function NavigationButtons({ 
  onNext, 
  onPrev, 
  canGoNext = true,
  canGoPrev = true,
  isFirstSlide = false,
  isLastSlide = false,
  nextLabel = 'Volgende',
  prevLabel = 'Vorige',
  isLoading = false
}) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: isMobile ? '0.75rem' : '1rem',
      width: '100%',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {/* Previous Button */}
      {!isFirstSlide ? (
        <button
          onClick={onPrev}
          disabled={!canGoPrev || isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
            background: canGoPrev && !isLoading
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.03)',
            border: canGoPrev && !isLoading
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: isMobile ? '12px' : '14px',
            color: canGoPrev && !isLoading
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(255, 255, 255, 0.3)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: canGoPrev && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            
            // Touch optimization
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            minWidth: isMobile ? '100px' : '120px',
            
            // Hardware acceleration
            transform: 'translateZ(0)',
            opacity: canGoPrev && !isLoading ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (canGoPrev && !isLoading && !isMobile) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
              e.currentTarget.style.transform = 'translateX(-2px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.transform = 'translateX(0)'
            }
          }}
          onTouchStart={(e) => {
            if (canGoPrev && !isLoading && isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <ChevronLeft size={isMobile ? 18 : 20} />
          <span>{prevLabel}</span>
        </button>
      ) : (
        <div style={{ width: isMobile ? '100px' : '120px' }} />
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          background: canGoNext && !isLoading
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'rgba(16, 185, 129, 0.2)',
          border: canGoNext && !isLoading
            ? '1px solid #10b981'
            : '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          color: canGoNext && !isLoading
            ? '#fff'
            : 'rgba(255, 255, 255, 0.4)',
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '600',
          cursor: canGoNext && !isLoading ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: canGoNext && !isLoading
            ? '0 4px 15px rgba(16, 185, 129, 0.3)'
            : 'none',
          
          // Touch optimization
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          minWidth: isMobile ? '100px' : '120px',
          
          // Hardware acceleration
          transform: 'translateZ(0)',
          opacity: isLoading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (canGoNext && !isLoading && !isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = canGoNext 
              ? '0 4px 15px rgba(16, 185, 129, 0.3)'
              : 'none'
          }
        }}
        onTouchStart={(e) => {
          if (canGoNext && !isLoading && isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <span>{isLoading ? 'Laden...' : isLastSlide ? 'Voltooien' : nextLabel}</span>
        {!isLoading && <ChevronRight size={isMobile ? 18 : 20} />}
        
        {/* Loading spinner */}
        {isLoading && (
          <div style={{
            width: isMobile ? '16px' : '18px',
            height: isMobile ? '16px' : '18px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
      </button>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
