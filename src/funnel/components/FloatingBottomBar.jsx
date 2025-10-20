import React, { useState, useEffect } from 'react'
import { Check, ChevronRight, Users } from 'lucide-react'
import CalendlyModal from '../components/CalendlyModal'
import DatabaseService from '../../services/DatabaseService'

export default function FloatingBottomBar() {
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
    
    // Load spots data
    loadSpots()
    
    // Subscribe to real-time updates
    const spotsService = db.getSpotsService()
    const subscription = spotsService.subscribeToSpots((newData) => {
      setSpots(newData)
    })
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  const loadSpots = async () => {
    const spotsService = db.getSpotsService()
    const data = await spotsService.getCurrentSpots()
    setSpots(data)
  }

  const spotsLeft = spots ? spots.max_spots - spots.current_spots : null
  const spotsText = spotsLeft !== null 
    ? spotsLeft <= 0 
      ? "Volledig Volgeboekt"
      : spotsLeft === 1 
        ? "Nog 1 Plek Beschikbaar"
        : `Nog ${spotsLeft} Plekken Over`
    : "Plekken Laden..."

  const features = [
    "3 Sterke Garanties",
    "110% Inzet Van Je Coach",
    "Start Maandag"
  ]

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: isVisible ? 0 : '-100px',
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '2px solid rgba(255, 215, 0, 0.2)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        zIndex: 1000,
        transition: 'bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 -5px 20px rgba(255, 215, 0, 0.1)'
      }}>
        {/* Golden glow at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent)',
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
          
          {/* Features */}
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
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                }}>
                  <Check size={isMobile ? 12 : 14} color="#000" strokeWidth={3} />
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
            
            {/* Spots Counter - New Feature */}
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
                  background: spotsLeft <= 3 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: spotsLeft <= 3
                    ? '0 2px 10px rgba(239, 68, 68, 0.5)'
                    : '0 2px 10px rgba(255, 215, 0, 0.3)',
                  animation: spotsLeft <= 3 && spotsLeft > 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                }}>
                  <Users size={isMobile ? 12 : 14} color="#000" strokeWidth={3} />
                </div>
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.95rem',
                  color: spotsLeft <= 3 
                    ? '#ef4444'
                    : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: spotsLeft <= 3 ? '700' : '500',
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
                        background: spotsLeft <= 3 ? '#ef4444' : '#10b981',
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
            onClick={() => setShowCalendlyModal(true)}
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
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #000000 40%, rgba(255, 215, 0, 0.15) 50%, #000000 60%, #0a0a0a 100%)',
              backgroundSize: '200% 100%',
              backgroundPosition: isHovered ? '0% 50%' : '100% 50%',
              backgroundColor: 'transparent',
              border: isHovered 
                ? '2px solid #FFD700'
                : '2px solid rgba(255, 215, 0, 0.4)',
              borderRadius: '20px',
              color: isHovered ? '#000' : '#FFD700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isHovered 
                ? '0 15px 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.3)'
                : '0 8px 25px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 215, 0, 0.15)',
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
                : '0 0 20px rgba(255, 215, 0, 0.5)'
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
              Begin Je Transformatie Direct
            </span>
            <ChevronRight 
              size={isMobile ? 18 : 20} 
              style={{ 
                position: 'relative', 
                zIndex: 1,
                animation: isHovered ? 'pulse 1s ease-in-out infinite' : 'none'
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
            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
            borderRadius: '2px',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
        )}
      </div>

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
      `}</style>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
