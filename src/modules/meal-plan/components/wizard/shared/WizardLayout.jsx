// src/modules/meal-plan/components/wizard/shared/WizardLayout.jsx
// Outer wrapper voor wizard - progress + navigation

import ProgressDots from './ProgressDots'
import NavigationButtons from './NavigationButtons'

export default function WizardLayout({ 
  children,
  currentSlide,
  totalSlides,
  onNext,
  onPrev,
  canGoNext = true,
  canGoPrev = true,
  isLoading = false,
  nextLabel,
  prevLabel
}) {
  const isMobile = window.innerWidth <= 768
  
  const isFirstSlide = currentSlide === 1
  const isLastSlide = currentSlide === totalSlides
  
  return (
    <div style={{
      minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100 - 140px)' : 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: isMobile ? '100%' : '900px',
      margin: '0 auto',
      padding: isMobile ? '1rem' : '2rem',
      
      // Smooth animations
      animation: 'fadeIn 0.4s ease-out'
    }}>
      {/* Progress Indicator */}
      <div style={{
        position: 'sticky',
        top: isMobile ? '70px' : '80px',
        zIndex: 10,
        background: 'linear-gradient(180deg, #0a0a0a 0%, transparent 100%)',
        paddingBottom: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <ProgressDots 
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
      </div>
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: isMobile ? '400px' : '500px'
      }}>
        {/* Content with fade transition */}
        <div 
          key={currentSlide}
          style={{
            flex: 1,
            animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div style={{
        position: 'sticky',
        bottom: isMobile ? '90px' : '20px',
        zIndex: 10,
        background: 'linear-gradient(0deg, #0a0a0a 0%, transparent 100%)',
        paddingTop: isMobile ? '1rem' : '1.5rem',
        marginTop: isMobile ? '1rem' : '1.5rem'
      }}>
        <NavigationButtons
          onNext={onNext}
          onPrev={onPrev}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          isFirstSlide={isFirstSlide}
          isLastSlide={isLastSlide}
          isLoading={isLoading}
          nextLabel={nextLabel}
          prevLabel={prevLabel}
        />
      </div>
      
      {/* Background Decoration */}
      <div style={{
        position: 'fixed',
        top: '20%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: -1,
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'fixed',
        bottom: '20%',
        left: '-10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: -1,
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite reverse'
      }} />
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        /* Smooth scroll behavior */
        * {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
