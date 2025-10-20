import React from 'react'
import { ChevronRight, Square, CheckSquare } from 'lucide-react'

export default function SymptomsBody({ 
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
              <linearGradient id="symptomsGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#symptomsGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Title */}
        <h2 style={{
          fontSize: '52px',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '20px',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '-1px',
          textShadow: `
            3px 3px 0 #000,
            -3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            0 0 30px rgba(239, 68, 68, 0.4)
          `
        }}>
          Herken je dit?
        </h2>
        
        {/* Warning Badge */}
        <div style={{
          margin: '0 auto',
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          padding: '8px 24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '50px',
          border: '2px solid rgba(239, 68, 68, 0.4)',
          width: 'fit-content'
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            90% heeft dit probleem
          </span>
        </div>
        
        {/* Symptoms List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: settings.bodySpacing === 'compact' ? '25px' : settings.bodySpacing === 'spacious' ? '45px' : '35px'
        }}>
          {(points || [
            "Mood swings na lunch",
            "Energie dip om 16:00",
            "Futloos gevoel",
            "Brain fog",
            "Geen energie voor gym"
          ]).slice(0, 6).map((symptom, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              padding: '20px',
              background: index % 2 === 0 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                : 'transparent',
              borderRadius: '15px',
              marginLeft: index % 2 === 1 ? '40px' : '0',
              marginRight: index % 2 === 0 ? '40px' : '0'
            }}>
              {index < 3 ? (
                <CheckSquare 
                  size={36} 
                  style={{ 
                    flexShrink: 0,
                    stroke: '#ef4444',
                    strokeWidth: 3,
                    fill: 'rgba(239, 68, 68, 0.2)'
                  }}
                />
              ) : (
                <Square 
                  size={36} 
                  style={{ 
                    flexShrink: 0,
                    stroke: 'rgba(255, 255, 255, 0.4)',
                    strokeWidth: 3
                  }}
                />
              )}
              <p style={{
                fontSize: `${settings.bodyFontSize || 42}px`,
                fontWeight: '600',
                color: index < 3 ? '#fff' : 'rgba(255, 255, 255, 0.8)',
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
                {symptom}
              </p>
            </div>
          ))}
        </div>
        
        {/* Solution Teaser */}
        <div style={{
          marginTop: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981',
            margin: 0,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            IK HEB DE OPLOSSING →
          </p>
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
              <linearGradient id="symptomsGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#symptomsGradient2)"
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
