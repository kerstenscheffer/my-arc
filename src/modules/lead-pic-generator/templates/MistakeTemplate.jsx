import React from 'react'
import { ChevronRight, XCircle } from 'lucide-react'

export default function MistakeTemplate({ 
  backgroundImage, 
  mainText, 
  subheaderText,
  settings 
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
        justifyContent: 'center',
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
              <linearGradient id="mistakeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#mistakeGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Big Red X */}
        <div style={{
          marginBottom: '30px',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '140px',
            fontWeight: '900',
            color: '#ef4444',
            opacity: 0.2,
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            ✕
          </div>
          <XCircle size={64} color="#ef4444" style={{ position: 'relative', zIndex: 1 }} />
        </div>
        
        {/* Subheader - GROOTSTE FOUT - SVG Gradient */}
        {settings.hasSubheader && (
          <div style={{
            marginBottom: '30px'
          }}>
            <svg width="400" height="50" style={{ display: 'inline-block' }}>
              <defs>
                <linearGradient id="mistakeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="url(#mistakeGradient3)"
                fontSize="36"
                fontWeight="700"
                letterSpacing="2"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                style={{ textTransform: 'uppercase' }}
              >
                {subheaderText || "DE GROOTSTE FOUT"}
              </text>
            </svg>
          </div>
        )}
        
        {/* Main Mistake Text */}
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
            0 0 50px rgba(239, 68, 68, 0.4)
          `,
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill'
        }}>
          {mainText}
        </h1>
        
        {/* Warning Box */}
        <div style={{
          marginTop: '40px',
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '15px',
          border: '3px solid rgba(239, 68, 68, 0.4)',
          borderStyle: 'dashed'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            90% MAAKT DEZE FOUT
          </div>
        </div>
        
        {/* Solution Teaser */}
        <div style={{
          marginTop: '30px',
          fontSize: '32px',
          fontWeight: '700',
          color: '#10b981',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
        }}>
          STOP HIERMEE →
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
              <linearGradient id="mistakeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#mistakeGradient2)"
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
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
