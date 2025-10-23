// src/modules/meal-plan/components/wizard/shared/ProgressDots.jsx
// Progress indicator - 6 dots voor wizard navigatie

export default function ProgressDots({ currentSlide, totalSlides }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '0.5rem' : '0.75rem',
      padding: isMobile ? '1rem 0' : '1.5rem 0'
    }}>
      {Array.from({ length: totalSlides }).map((_, index) => {
        const slideNumber = index + 1
        const isActive = slideNumber === currentSlide
        const isPast = slideNumber < currentSlide
        
        return (
          <div
            key={slideNumber}
            style={{
              width: isMobile ? '10px' : '12px',
              height: isMobile ? '10px' : '12px',
              borderRadius: '50%',
              background: isActive 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : isPast
                  ? 'rgba(16, 185, 129, 0.4)'
                  : 'rgba(255, 255, 255, 0.15)',
              border: isActive 
                ? '2px solid #10b981'
                : '1px solid rgba(255, 255, 255, 0.1)',
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive 
                ? '0 0 15px rgba(16, 185, 129, 0.5)' 
                : 'none',
              cursor: isPast ? 'pointer' : 'default',
              position: 'relative',
              
              // Hardware acceleration
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
            // Optioneel: Click om terug te gaan naar completed slides
            onClick={() => {
              if (isPast && typeof onSlideClick === 'function') {
                onSlideClick(slideNumber)
              }
            }}
          >
            {/* Glow effect voor active dot */}
            {isActive && (
              <div style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
                animation: 'pulse 2s ease-in-out infinite',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        )
      })}
      
      {/* Slide counter text */}
      <span style={{
        marginLeft: isMobile ? '0.75rem' : '1rem',
        fontSize: isMobile ? '0.75rem' : '0.85rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
        letterSpacing: '0.05em'
      }}>
        {currentSlide}/{totalSlides}
      </span>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
