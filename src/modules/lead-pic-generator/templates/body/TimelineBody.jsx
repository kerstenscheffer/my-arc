import React from 'react'
import { ChevronRight, Calendar } from 'lucide-react'

export default function TimelineBody({ 
  backgroundImage, 
  points,
  settings = {}
}) {
  // Default timeline if no points provided
  const timeline = points?.length >= 4 ? points : [
    "Jaar 1: Alles door elkaar proberen",
    "Jaar 3: Kleine verbeteringen",
    "Jaar 6: Eindelijk doorbraak",
    "Voor jou: Direct resultaat"
  ]
  
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
              <linearGradient id="timelineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#timelineGradient1)"
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
        <div style={{
          textAlign: 'center',
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <Calendar size={40} style={{ stroke: '#10b981' }} />
            <h2 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-1px',
              textShadow: `
                3px 3px 0 #000,
                -3px 3px 0 #000,
                -3px -3px 0 #000,
                3px -3px 0 #000,
                0 0 30px rgba(16, 185, 129, 0.4)
              `
            }}>
              Mijn Journey
            </h2>
          </div>
        </div>
        
        {/* Timeline Container */}
        <div style={{
          position: 'relative',
          paddingLeft: '60px'
        }}>
          {/* Vertical Line with gradient */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '0',
            bottom: '0',
            width: '4px',
            background: 'linear-gradient(180deg, #ef4444 0%, #f59e0b 33%, #10b981 66%, #3b82f6 100%)'
          }} />
          
          {/* Timeline Items */}
          {timeline.map((item, index) => {
            const isLast = index === timeline.length - 1
            const color = index === 0 ? '#ef4444' : 
                         index === 1 ? '#f59e0b' :
                         index === 2 ? '#10b981' : '#3b82f6'
            
            return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                marginBottom: index < timeline.length - 1 
                  ? (settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px')
                  : '0',
                position: 'relative'
              }}>
                {/* Timeline Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-48px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: color,
                  border: '4px solid #000',
                  boxShadow: `0 0 20px ${color}`,
                  zIndex: 2
                }} />
                
                {/* Content Box */}
                <div style={{
                  flex: 1,
                  padding: isLast ? '25px' : '20px',
                  background: isLast 
                    ? `linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)`
                    : `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                  borderRadius: '15px',
                  border: `2px solid ${color}40`,
                  transform: isLast ? 'scale(1.05)' : 'scale(1)'
                }}>
                  <p style={{
                    fontSize: isLast ? `${(settings.bodyFontSize || 42) + 4}px` : `${settings.bodyFontSize || 42}px`,
                    fontWeight: isLast ? '800' : '600',
                    color: isLast ? '#fff' : 'rgba(255, 255, 255, 0.9)',
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
                    {item}
                  </p>
                </div>
                
                {/* Special marker for last item */}
                {isLast && (
                  <div style={{
                    position: 'absolute',
                    right: '-40px',
                    fontSize: '48px',
                    animation: 'float 2s ease-in-out infinite'
                  }}>
                    🚀
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Bottom Message */}
        <div style={{
          marginTop: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          borderRadius: '15px'
        }}>
          {/* SVG Gradient Text */}
          <svg width="450" height="40" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="timelineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#timelineGradient3)"
              fontSize="32"
              fontWeight="700"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              Bespaar jaren van fouten
            </text>
          </svg>
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
              <linearGradient id="timelineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#timelineGradient2)"
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.7; transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
