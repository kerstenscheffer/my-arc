import React from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'

export default function ChecklistBody({ 
  backgroundImage, 
  points,
  settings = {}
}) {
  
  return (
    <div style={{
      width: '1080px',
      height: '1350px',
      position: 'relative',
      background: '#000',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Image */}
      {backgroundImage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1080px',
          height: '1350px',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
      )}
      
      {/* Dynamic Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1080px',
        height: '1350px',
        background: `rgba(0, 0, 0, ${(settings?.overlayDarkness || 40) / 100})`
      }} />
      
      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '1080px',
        height: '1350px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 80px',
        boxSizing: 'border-box'
      }}>
        {/* MY ARC Logo - SVG Gradient */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <svg width="250" height="60" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="checklistGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#checklistGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Title - SVG Gradient */}
        <div style={{
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          textAlign: 'center',
          filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.5))'
        }}>
          <svg width="400" height="60" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="checklistGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#checklistGradient2)"
              fontSize="48"
              fontWeight="800"
              letterSpacing="-1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              DIT KRIJG JE:
            </text>
          </svg>
        </div>
        
        {/* Points List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: settings.bodySpacing === 'compact' ? '25px' : settings.bodySpacing === 'spacious' ? '45px' : '35px'
        }}>
          {(points || []).slice(0, 6).map((point, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}>
              <CheckCircle 
                size={36} 
                style={{ 
                  flexShrink: 0,
                  stroke: '#10b981',
                  strokeWidth: 3
                }}
              />
              <p style={{
                fontSize: `${settings.bodyFontSize || 42}px`,
                fontWeight: '600',
                color: '#fff',
                margin: 0,
                lineHeight: '1.2',
                textShadow: `
                  2px 2px 0 #000,
                  -2px 2px 0 #000,
                  -2px -2px 0 #000,
                  2px -2px 0 #000,
                  0 0 20px rgba(0, 0, 0, 0.8)
                `
              }}>
                {point}
              </p>
            </div>
          ))}
        </div>
        
        {/* Swipe Indicator - SVG Gradient */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 2s infinite'
        }}>
          <svg width="100" height="40" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="checklistGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#checklistGradient3)"
              fontSize="28"
              fontWeight="700"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              Swipe
            </text>
          </svg>
          <ChevronRight size={36} style={{ stroke: '#10b981' }} />
        </div>
        
        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '80px',
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '40px',
            height: '6px',
            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
