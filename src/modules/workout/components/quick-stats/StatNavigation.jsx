// src/modules/workout/components/quick-stats/StatNavigation.jsx
// 🎯 STAT NAVIGATION - Arrows + Dots

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function StatNavigation({ 
  currentStat, 
  totalStats, 
  statTitle,
  onPrevious, 
  onNext,
  onSelectStat,
  isMobile 
}) {
  return (
    <>
      {/* Title with navigation arrows */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: isMobile ? '1rem' : '1.25rem'
      }}>
        <button
          onClick={onPrevious}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)'
            e.currentTarget.style.transform = 'translateX(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <ChevronLeft size={18} color="#FFD700" />
        </button>

        <h2 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '800',
          color: '#FFD700',
          textAlign: 'center',
          margin: 0,
          textShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
          letterSpacing: '-0.01em',
          minWidth: isMobile ? '140px' : '180px'
        }}>
          {statTitle}
        </h2>

        <button
          onClick={onNext}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)'
            e.currentTarget.style.transform = 'translateX(2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <ChevronRight size={18} color="#FFD700" />
        </button>
      </div>

      {/* Stat dots indicator at bottom */}
      <div style={{
        display: 'flex',
        gap: '0.375rem',
        justifyContent: 'center',
        marginTop: isMobile ? '0.75rem' : '1rem'
      }}>
        {Array.from({ length: totalStats }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSelectStat(index)}
            style={{
              width: currentStat === index ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: currentStat === index 
                ? 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
                : 'rgba(255, 215, 0, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        ))}
      </div>
    </>
  )
}
