import React from 'react'
import { ChevronRight, MessageCircle } from 'lucide-react'

export default function QuestionTemplate({ 
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
              <linearGradient id="questionGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#questionGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Question Mark Icon - SVG Gradient */}
        <div style={{
          marginBottom: '40px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <svg width="150" height="150" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="questionGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#questionGradient3)"
              fontSize="120"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              ?
            </text>
          </svg>
        </div>
        
        {/* Subheader - VRAAG AAN JOU */}
        {settings.hasSubheader && (
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '30px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {subheaderText || "VRAAG AAN JOU"}
          </div>
        )}
        
        {/* Main Question Text */}
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
            0 0 50px rgba(245, 158, 11, 0.4)
          `,
          WebkitTextStroke: '1.5px black',
          paintOrder: 'stroke fill'
        }}>
          {mainText}
        </h1>
        
        {/* Answer Teaser */}
        <div style={{
          marginTop: '40px',
          padding: '20px 40px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '15px',
          border: '2px solid rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <MessageCircle size={32} />
            IK HEB HET ANTWOORD
          </div>
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
              <linearGradient id="questionGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#questionGradient2)"
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
