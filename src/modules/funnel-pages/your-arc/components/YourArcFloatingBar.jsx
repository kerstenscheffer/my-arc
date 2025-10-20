import React, { useState, useEffect } from 'react'
import { Check, ChevronRight, Users, X } from 'lucide-react'
import DatabaseService from '../../../../services/DatabaseService'

export default function YourArcFloatingBar() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)
  const [spots, setSpots] = useState(null)
  const db = DatabaseService

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    // Show after 2 seconds
    const timer = setTimeout(() => setIsVisible(true), 2000)
    
    // Load main offer spots data
    loadMainOfferSpots()
    
    // Subscribe to real-time updates if service exists
    let subscription = null
    try {
      const spotsService = db.getSpotsService()
      subscription = spotsService.subscribeToMainOfferSpots((newData) => {
        setSpots(newData)
      })
    } catch (error) {
      console.log('Spots service not available, using fallback')
      // Fallback if spots service doesn't exist
      setSpots({ max_spots: 10, current_spots: 3, is_active: true })
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      subscription?.unsubscribe()
    }
  }, [])

  const loadMainOfferSpots = async () => {
    try {
      const spotsService = db.getSpotsService()
      const data = await spotsService.getMainOfferSpots()
      setSpots(data)
    } catch (error) {
      console.log('Using fallback spots data')
      // Fallback data
      setSpots({ max_spots: 10, current_spots: 3, is_active: true })
    }
  }

  const spotsLeft = spots ? spots.max_spots - spots.current_spots : 7
  const isUrgent = spotsLeft !== null && spotsLeft <= 3
  
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Beschikbaar"
        : `Nog ${spotsLeft} Plekken Over`
    : "Plekken Laden..."

  const features = [
    "100% Geld Terug Garantie",
    "Verdien €75 Per Vriend",
    "110% Inzet Van Coach"
  ]

  const handleOpenCalendly = () => {
    // Option 1: Open Calendly in new tab
    window.open('https://calendly.com/my-arc/intro-call', '_blank')
    
    // Option 2: Show modal (uncomment if you want modal)
    // setShowCalendlyModal(true)
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: isVisible ? 0 : '-100px',
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: isUrgent 
          ? '2px solid rgba(239, 68, 68, 0.3)'
          : '2px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        zIndex: 1000,
        transition: 'bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 -5px 20px rgba(16, 185, 129, 0.1)'
      }}>
        {/* Green glow at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isUrgent
            ? 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)',
          animation: 'shimmer 3s ease-in-out infinite'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '1rem' : '2rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          
          {/* Features and Spots */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '2rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${0.1 + index * 0.1}s`
                }}
              >
                <div style={{
                  width: isMobile ? '18px' : '20px',
                  height: isMobile ? '18px' : '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}>
                  <Check size={isMobile ? 12 : 14} color="#fff" strokeWidth={3} />
                </div>
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  {feature}
                </span>
              </div>
            ))}
            
            {/* Spots Counter */}
            {spots?.is_active && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s`,
                  position: 'relative'
                }}
              >
                <div style={{
                  width: isMobile ? '18px' : '20px',
                  height: isMobile ? '18px' : '20px',
                  borderRadius: '50%',
                  background: isUrgent
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isUrgent
                    ? '0 2px 10px rgba(239, 68, 68, 0.5)'
                    : '0 2px 10px rgba(16, 185, 129, 0.3)',
                  animation: isUrgent && spotsLeft > 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                }}>
                  <Users size={isMobile ? 12 : 14} color="#fff" strokeWidth={3} />
                </div>
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.95rem',
                  color: isUrgent 
                    ? '#ef4444'
                    : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: isUrgent ? '700' : '500',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  {spotsText}
                  {/* Live indicator */}
                  {spotsLeft > 0 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isUrgent ? '#ef4444' : '#10b981',
                        animation: 'blink 1.5s infinite',
                        display: 'inline-block'
                      }} />
                      <span style={{
                        fontSize: isMobile ? '0.6rem' : '0.7rem',
                        fontWeight: '600',
                        opacity: 0.7
                      }}>
                        LIVE
                      </span>
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleOpenCalendly}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            style={{
              padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
              fontSize: isMobile ? '0.95rem' : '1.125rem',
              fontWeight: '800',
              backgroundImage: isHovered 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(16, 185, 129, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
              backgroundSize: '200% 100%',
              backgroundPosition: isHovered ? '0% 50%' : '100% 50%',
              backgroundColor: 'transparent',
              border: isHovered 
                ? '2px solid #10b981'
                : isUrgent
                  ? '2px solid rgba(239, 68, 68, 0.4)'
                  : '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              color: isHovered ? '#fff' : (isUrgent ? '#ef4444' : '#10b981'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isHovered 
                ? '0 15px 40px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.3)'
                : '0 8px 25px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              position: 'relative',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible 
                ? (isHovered ? 'translateY(-2px)' : 'translateY(0)')
                : 'translateY(10px)',
              transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${isVisible ? '0' : '0.4s'}`,
              textShadow: isHovered 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                : '0 0 20px rgba(16, 185, 129, 0.5)'
            }}
          >
            {/* Gliding shine effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-30%',
              width: '50%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transform: 'rotate(35deg)',
              animation: isHovered ? 'glide 2s ease-in-out infinite' : 'none',
              pointerEvents: 'none'
            }} />
            
            <span style={{ position: 'relative', zIndex: 1 }}>
              {isMobile ? 'START NU' : 'CLAIM JE PLEK'}
            </span>
            <ChevronRight 
              size={isMobile ? 18 : 20} 
              style={{ 
                position: 'relative', 
                zIndex: 1,
                animation: isHovered ? 'slideRight 1s ease-in-out infinite' : 'none'
              }} 
            />
          </button>
        </div>

        {/* Mobile pulse indicator */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '4px',
            background: isUrgent
              ? 'linear-gradient(90deg, transparent, #ef4444, transparent)'
              : 'linear-gradient(90deg, transparent, #10b981, transparent)',
            borderRadius: '2px',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
        )}
      </div>

      {/* Inline Calendly Modal */}
      {showCalendlyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '1rem' : '2rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
            height: isMobile ? '90vh' : '80vh',
            background: '#111',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowCalendlyModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 10001,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <X size={20} color="#fff" />
            </button>
            
            {/* Calendly iframe */}
            <iframe
              src="https://calendly.com/my-arc/intro-call"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        
        @keyframes glide {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.8;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
