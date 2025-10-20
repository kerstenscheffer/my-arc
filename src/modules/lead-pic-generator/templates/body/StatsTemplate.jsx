import React from 'react'
import { ChevronRight, TrendingUp } from 'lucide-react'

export default function StatsTemplate({ 
  backgroundImage, 
  stats,
  settings = {}
}) {
  // Default stats if none provided
  const defaultStats = [
    { number: "87%", label: "Meer energie" },
    { number: "+12kg", label: "Spiergroei" },
    { number: "3x", label: "Sneller herstel" }
  ]
  
  const displayStats = stats?.length >= 3 ? stats : defaultStats
  
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
              <linearGradient id="statsGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#statsGradient1)"
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
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
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
          MIJN RESULTATEN
        </h2>
        
        {/* Stats Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: settings.bodySpacing === 'compact' ? '30px' : settings.bodySpacing === 'spacious' ? '60px' : '45px',
          width: '100%',
          maxWidth: '800px'
        }}>
          {displayStats.map((stat, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              padding: '30px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              transform: index === 1 ? 'scale(1.1)' : 'scale(1)'
            }}>
              {/* Stat Number - SVG Gradient */}
              <div style={{
                filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))'
              }}>
                <svg width="200" height="80" style={{ display: 'inline-block' }}>
                  <defs>
                    <linearGradient id={`statsGradient${index + 2}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill={`url(#statsGradient${index + 2})`}
                    fontSize="64"
                    fontWeight="900"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  >
                    {stat.number || stat}
                  </text>
                </svg>
              </div>
              
              {/* Stat Label */}
              <div style={{
                fontSize: `${settings.bodyFontSize || 42}px`,
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textShadow: `
                  2px 2px 0 #000,
                  -2px 2px 0 #000,
                  -2px -2px 0 #000,
                  2px -2px 0 #000,
                  0 0 20px rgba(0, 0, 0, 0.8)
                `
              }}>
                {stat.label || ''}
              </div>
              
              {/* Icon */}
              <TrendingUp size={40} style={{ 
                stroke: '#10b981',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))'
              }} />
            </div>
          ))}
        </div>
        
        {/* Call to Action */}
        <div style={{
          marginTop: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          padding: '20px 40px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          borderRadius: '50px',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
        }}>
          <p style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            JIJ KAN DIT OOK
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
              <linearGradient id="statsGradientSwipe" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#statsGradientSwipe)"
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
