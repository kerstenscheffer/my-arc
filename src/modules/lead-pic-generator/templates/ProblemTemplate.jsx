import React from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'

export default function ProblemTemplate({ 
  backgroundImage, 
  mainText, 
  subheaderText,
  settings 
}) {
  
  const getJustifyContent = () => {
    switch(settings.textPosition) {
      case 'top': return 'flex-start'
      case 'bottom': return 'flex-end'
      default: return 'center'
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
        padding: '120px 80px',
        textAlign: 'center',
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
              <linearGradient id="problemGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#problemGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Problem Icon */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(239, 68, 68, 0.3)'
        }}>
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        
        {/* Subheader - PROBLEEM label */}
        {settings.hasSubheader && (
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '20px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {subheaderText || "PROBLEEM"}
          </div>
        )}
        
        {/* Main Problem Text */}
        <h1 style={{
          fontSize: `${settings.fontSize}px`,
          fontWeight: '900',
          lineHeight: '1.0',
          color: '#fff',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          whiteSpace: 'pre-line',
          textShadow: `
            2px 2px 0 #000,
            -2px 2px 0 #000,
            -2px -2px 0 #000,
            2px -2px 0 #000,
            0 0 40px rgba(239, 68, 68, 0.4)
          `,
          WebkitTextStroke: '1.5px black',
          paintOrder: 'stroke fill'
        }}>
          {mainText}
        </h1>
        
        {/* Arrow Down */}
        <div style={{
          margin: '40px 0',
          animation: 'bounce 2s infinite'
        }}>
          <div style={{
            width: '4px',
            height: '60px',
            background: 'linear-gradient(180deg, #10b981 0%, #3b82f6 100%)',
            margin: '0 auto'
          }} />
          <div style={{
            width: '0',
            height: '0',
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '20px solid #ef4444',
            margin: '0 auto'
          }} />
        </div>
        
        {/* Solution Teaser */}
        <div style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#10b981',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
        }}>
          IK HEB DE OPLOSSING →
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
              <linearGradient id="problemGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#problemGradient2)"
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
            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
            borderRadius: '3px'
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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
