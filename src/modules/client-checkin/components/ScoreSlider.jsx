// src/modules/client-checkin/components/ScoreSlider.jsx
// Touch-friendly score slider (1-10, 0.5 steps)
// Features: Color feedback, large display, smooth animations

import { useState, useRef, useEffect, useCallback } from 'react'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  glow: 'rgba(255, 215, 0, 0.2)'
}

// Score kleuren
const getScoreColor = (score) => {
  if (score >= 8) return '#10b981'  // Groen
  if (score >= 6) return '#eab308'  // Geel
  if (score >= 4) return '#f97316'  // Oranje
  return '#ef4444'                   // Rood
}

const getScoreLabel = (score) => {
  if (score >= 9) return 'Uitstekend'
  if (score >= 8) return 'Zeer goed'
  if (score >= 7) return 'Goed'
  if (score >= 6) return 'Redelijk'
  if (score >= 5) return 'Matig'
  if (score >= 4) return 'Onvoldoende'
  if (score >= 3) return 'Slecht'
  return 'Zeer slecht'
}

export default function ScoreSlider({ 
  value = 5, 
  onChange, 
  label,
  hint,
  disabled = false 
}) {
  const isMobile = window.innerWidth <= 768
  const sliderRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const minScore = 1
  const maxScore = 10
  const step = 0.5
  
  // Convert position to score - useCallback to prevent recreation
  const positionToScore = useCallback((clientX) => {
    if (!sliderRef.current) return value
    
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const rawScore = minScore + (percentage * (maxScore - minScore))
    
    // Round to nearest 0.5
    const roundedScore = Math.round(rawScore * 2) / 2
    return Math.max(minScore, Math.min(maxScore, roundedScore))
  }, [value])
  
  // Mouse down on slider
  const handleMouseDown = (e) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    const newScore = positionToScore(e.clientX)
    onChange?.(newScore)
  }
  
  // Touch start on slider
  const handleTouchStart = (e) => {
    if (disabled) return
    setIsDragging(true)
    const touch = e.touches[0]
    const newScore = positionToScore(touch.clientX)
    onChange?.(newScore)
  }
  
  // Touch move - direct handler on element
  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return
    e.preventDefault()
    const touch = e.touches[0]
    const newScore = positionToScore(touch.clientX)
    onChange?.(newScore)
  }
  
  // Touch end - direct handler on element
  const handleTouchEnd = () => {
    setIsDragging(false)
  }
  
  // PROPER useEffect for global mouse listeners
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e) => {
      if (disabled) return
      const newScore = positionToScore(e.clientX)
      onChange?.(newScore)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    // Add listeners to window
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    // CLEANUP - this is the key fix!
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, disabled, positionToScore, onChange])
  
  // Calculate fill percentage
  const fillPercentage = ((value - minScore) / (maxScore - minScore)) * 100
  const scoreColor = getScoreColor(value)
  
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {/* Label */}
      {label && (
        <label style={{
          display: 'block',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '0.5rem',
          lineHeight: 1.4
        }}>
          {label}
        </label>
      )}
      
      {/* Hint */}
      {hint && (
        <p style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.4)',
          margin: '0 0 0.75rem 0',
          fontStyle: 'italic'
        }}>
          {hint}
        </p>
      )}
      
      {/* Slider Container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '1rem' : '1.25rem'
      }}>
        {/* Slider Track */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            flex: 1,
            height: isMobile ? '44px' : '48px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
            border: `1px solid ${isDragging ? scoreColor : 'rgba(255, 255, 255, 0.15)'}`,
            position: 'relative',
            cursor: disabled ? 'not-allowed' : 'pointer',
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
            opacity: disabled ? 0.5 : 1
          }}
        >
          {/* Fill */}
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            bottom: '4px',
            width: `calc(${fillPercentage}% - 8px)`,
            background: `linear-gradient(90deg, ${scoreColor}40 0%, ${scoreColor}80 100%)`,
            borderRadius: '8px',
            transition: isDragging ? 'none' : 'width 0.15s ease',
            pointerEvents: 'none'
          }} />
          
          {/* Thumb */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${fillPercentage}%`,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}cc 100%)`,
            border: '3px solid #fff',
            boxShadow: `0 2px 12px ${scoreColor}60, 0 0 20px ${scoreColor}30`,
            transition: isDragging ? 'transform 0.1s ease' : 'all 0.15s ease',
            pointerEvents: 'none'
          }} />
          
          {/* Scale Markers */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <span key={num} style={{
                fontSize: '0.6rem',
                color: value >= num ? scoreColor : 'rgba(255, 255, 255, 0.25)',
                fontWeight: value >= num ? '700' : '400',
                transition: 'color 0.2s ease'
              }}>
                {num}
              </span>
            ))}
          </div>
        </div>
        
        {/* Score Display */}
        <div style={{
          minWidth: isMobile ? '70px' : '80px',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          background: `linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}10 100%)`,
          border: `2px solid ${scoreColor}50`,
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: `0 4px 16px ${scoreColor}20`
        }}>
          <div style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '900',
            color: scoreColor,
            lineHeight: 1,
            textShadow: `0 2px 8px ${scoreColor}40`
          }}>
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '2px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {getScoreLabel(value)}
          </div>
        </div>
      </div>
    </div>
  )
}
