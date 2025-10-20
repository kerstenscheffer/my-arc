// src/modules/lead-pic-generator/components/SlideBody.jsx
import React from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'

export default function SlideBody({ backgroundImage, points, settings = {} }) {
  const overlayDarkness = settings.overlayDarkness || 40
  
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
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      )}
      
      {/* Dynamic Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `rgba(0, 0, 0, ${overlayDarkness / 100})`
      }} />
      
      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '120px 80px'
      }}>
        {/* MY ARC Logo */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '48px',
          fontWeight: '900',
          letterSpacing: '3px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          MY ARC
        </div>
        
        {/* Title */}
        <h2 style={{
          fontSize: '72px',
          fontWeight: '800',
          marginBottom: '60px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: `
            3px 3px 0 #000,
            -3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            4px 4px 0 #000,
            5px 5px 0 #000,
            6px 6px 12px rgba(0, 0, 0, 0.8)
          `,
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill'
        }}>
          Dit krijg je:
        </h2>
        
        {/* Points List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: settings.bodySpacing === 'compact' ? '25px' : settings.bodySpacing === 'spacious' ? '45px' : '35px'
        }}>
          {points.slice(0, 5).map((point, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px',
              animation: `slideInLeft ${0.5 + index * 0.1}s ease-out`
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle size={30} color="#fff" strokeWidth={3} />
              </div>
              <p style={{
                fontSize: `${settings.bodyFontSize || 42}px`,
                fontWeight: '700',
                color: '#fff',
                margin: 0,
                lineHeight: '1.1',
                textShadow: `
                  2px 2px 0 #000,
                  -2px 2px 0 #000,
                  -2px -2px 0 #000,
                  2px -2px 0 #000,
                  3px 3px 8px rgba(0, 0, 0, 0.8)
                `,
                WebkitTextStroke: '1px black'
              }}>
                {point}
              </p>
            </div>
          ))}
        </div>
        
        {/* Swipe Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'pulse 2s infinite'
        }}>
          Swipe
          <ChevronRight size={36} style={{ color: '#10b981' }} />
        </div>
        
        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '60px',
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '40px',
            height: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.6; transform: translateX(8px); }
        }
        @keyframes slideInLeft {
          from { 
            opacity: 0; 
            transform: translateX(-50px);
          }
          to { 
            opacity: 1; 
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
