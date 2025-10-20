import React from 'react'
import { ChevronRight, ArrowDown } from 'lucide-react'

export default function ProblemSolutionBody({ 
  backgroundImage, 
  points,
  settings = {}
}) {
  // Split points into sections
  const problem = points?.[0] || "Dit hield mij jaren tegen"
  const result = points?.[1] || "7-12kg spiergroei gemist"
  const solution = points?.[2] || "Mijn simpele oplossing"
  
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
        alignItems: 'center',
        padding: '120px 80px',
        boxSizing: 'border-box',
        textAlign: 'center'
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
              <linearGradient id="problemSolGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#problemSolGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Problem Section */}
        <div style={{
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          padding: '30px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(239, 68, 68, 0.3)'
        }}>
          <h3 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Dit hield mij tegen:
          </h3>
          <p style={{
            fontSize: `${settings.bodyFontSize || 42}px`,
            fontWeight: '800',
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
            {problem}
          </p>
        </div>
        
        {/* Arrow Down */}
        <div style={{
          margin: '20px 0',
          animation: 'bounce 2s infinite'
        }}>
          <ArrowDown size={48} color="#ef4444" />
        </div>
        
        {/* Result Section */}
        <div style={{
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          padding: '30px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(245, 158, 11, 0.3)'
        }}>
          <h3 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            marginBottom: '15px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Het resultaat:
          </h3>
          <p style={{
            fontSize: `${(settings.bodyFontSize || 42) + 6}px`,
            fontWeight: '900',
            color: '#fff',
            margin: 0,
            lineHeight: '1.1',
            textShadow: `
              2px 2px 0 #000,
              -2px 2px 0 #000,
              -2px -2px 0 #000,
              2px -2px 0 #000,
              0 0 30px rgba(245, 158, 11, 0.4)
            `
          }}>
            {result}
          </p>
        </div>
        
        {/* Arrow Down */}
        <div style={{
          margin: '20px 0',
          animation: 'bounce 2s infinite'
        }}>
          <ArrowDown size={48} color="#10b981" />
        </div>
        
        {/* Solution Section */}
        <div style={{
          padding: '30px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          {/* Solution Title - SVG Gradient */}
          <div style={{
            marginBottom: '15px'
          }}>
            <svg width="350" height="50" style={{ display: 'inline-block' }}>
              <defs>
                <linearGradient id="problemSolGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="url(#problemSolGradient2)"
                fontSize="32"
                fontWeight="700"
                letterSpacing="1"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                MIJN OPLOSSING:
              </text>
            </svg>
          </div>
          <p style={{
            fontSize: `${settings.bodyFontSize || 42}px`,
            fontWeight: '800',
            color: '#10b981',
            margin: 0,
            lineHeight: '1.2',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            {solution}
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
              <linearGradient id="problemSolGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#problemSolGradient3)"
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
