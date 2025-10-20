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
    
    // Show after 30 seconds
    const timer = setTimeout(() => setIsVisible(true), 30000)
    
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
      ? "Volgeboekt"
      : spotsLeft === 1 
        ? "1 Plek"
        : `${spotsLeft} Plekken`
    : "Laden..."

  const features = [
    'Till The Goal',
    'Win €300 terug',
    'Momentum max'
  ]

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: isVisible ? 0 : '-100px',
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(220, 38, 38, 0.2)',
        padding: isMobile ? '0.75rem 1rem' : '0.875rem 2rem',
        zIndex: 1000,
        transition: 'bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.5)'
      }}>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '0.75rem' : '2rem'
        }}>
          
          {/* Features - compact */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            flex: 1
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${0.1 + index * 0.1}s`
                }}
              >
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#dc2626'
                }} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '400',
                  whiteSpace: 'nowrap'
                }}>
                  {feature}
                </span>
              </div>
            ))}
            
            {/* Spots Counter - compact */}
            {spots?.is_active && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s`,
                  paddingLeft: isMobile ? '0' : '0.75rem',
                  borderLeft: isMobile ? 'none' : '1px solid rgba(220, 38, 38, 0.2)'
                }}
              >
                <Users size={14} color={spotsLeft <= 3 ? '#ef4444' : 'rgba(239, 68, 68, 0.7)'} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: spotsLeft <= 3 ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: spotsLeft <= 3 ? '600' : '400',
                  whiteSpace: 'nowrap'
                }}>
                  {spotsText}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button - compact */}
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
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '600',
              background: isHovered 
                ? '#dc2626'
                : 'transparent',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              borderRadius: '0',
              color: isHovered ? '#fff' : '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isHovered 
                ? '0 10px 25px rgba(220, 38, 38, 0.3)'
                : 'none',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isVisible ? '0' : '0.5s'}`
            }}
          >
            <span>Plan Gesprek</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
