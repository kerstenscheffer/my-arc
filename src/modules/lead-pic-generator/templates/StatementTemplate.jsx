import React from 'react'
import { ChevronRight } from 'lucide-react'

export default function StatementTemplate({ 
  backgroundImage, 
  mainText, 
  subheaderText,
  settings 
}) {
  
  // Position mapping
  const getJustifyContent = () => {
    switch(settings.textPosition) {
      case 'top': return 'flex-start'
      case 'bottom': return 'flex-end'
      default: return 'center'
    }
  }
  
  const getPaddingTop = () => {
    switch(settings.textPosition) {
      case 'top': return '150px'
      case 'bottom': return '120px'
      default: return '120px'
    }
  }
  
  const getPaddingBottom = () => {
    switch(settings.textPosition) {
      case 'top': return '120px'
      case 'bottom': return '150px'
      default: return '120px'
    }
  }
  
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
        background: `rgba(0, 0, 0, ${settings.overlayDarkness / 100})`
      }} />
      
      {/* Vignette Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1080px',
        height: '1350px',
        background: `radial-gradient(
          circle at center,
          transparent 30%,
          rgba(0, 0, 0, 0.3) 100%
        )`
      }} />
      
      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '1080px',
        height: '1350px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: getJustifyContent(),
        alignItems: 'center',
        paddingTop: getPaddingTop(),
        paddingBottom: getPaddingBottom(),
        paddingLeft: '100px',
        paddingRight: '100px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* MY ARC Logo - SVG Gradient */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.5))'
        }}>
          <svg width="250" height="60" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="statementGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#statementGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Subheader if enabled */}
        {settings.hasSubheader && subheaderText && (
          <div style={{
            fontSize: `${settings.fontSize * 0.3}px`,
            fontWeight: '700',
            color: '#10b981',
            marginBottom: '20px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {subheaderText}
          </div>
        )}
        
        {/* Main Statement Text */}
        <h1 style={{
          fontSize: `${settings.fontSize}px`,
          fontWeight: '900',
          lineHeight: '0.95',
          color: '#fff',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '-3px',
          whiteSpace: 'pre-line',
          textShadow: `
            3px 3px 0 #000,
            -3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            4px 4px 0 #000,
            5px 5px 0 #000,
            6px 6px 12px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(16, 185, 129, 0.3)
          `,
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill'
        }}>
          {mainText}
        </h1>
        
        {/* Statement Icon/Symbol */}
        <div style={{
          position: 'absolute',
          bottom: '200px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '64px',
          opacity: 0.3
        }}>
          💪
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
              <linearGradient id="statementGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#statementGradient2)"
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
            width: '40px',
            height: '6px',
            background: '#10b981',
            borderRadius: '3px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }} />
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
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
          0%, 100% { 
            opacity: 1; 
            transform: translateX(0); 
          }
          50% { 
            opacity: 0.7; 
            transform: translateX(8px); 
          }
        }
      `}</style>
    </div>
  )
}
