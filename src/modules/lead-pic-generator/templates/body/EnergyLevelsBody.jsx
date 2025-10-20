import React from 'react'
import { ChevronRight, Battery, BatteryLow, Zap } from 'lucide-react'

export default function EnergyLevelsBody({ 
  backgroundImage, 
  content,
  points, // Fallback for old format
  settings = {}
}) {
  const isMobile = window.innerWidth <= 768
  
  // Use content object if available (new format), otherwise fallback
  const headerTitle = content?.headerTitle || "ALTIJD MOE, FUTLOOS, BRAIN FOG"
  const subTitle = content?.subTitle || "5 Voeding Trucs die Alles Veranderen"
  const ctaText = content?.ctaText || "ENERGY LIJST IN DM"
  const beforeItems = content?.beforeItems || [
    "3pm crash op de bank",
    "Brain fog hele dag",
    "Futloos na lunch",
    "Moe bij het wakker worden"
  ]
  const afterItems = content?.afterItems || [
    "Stabiele energie hele dag",
    "Scherpe focus tot 's avonds", 
    "Vol energie na maaltijden",
    "Wakker worden vol energie"
  ]

  // Dynamic font size calculation
  const headerTitleFontSize = Math.max(32, Math.min(48, 48 - (headerTitle.length - 25) * 0.6))
  const subTitleFontSize = Math.max(24, Math.min(32, 32 - (subTitle.length - 20) * 0.4))
  const ctaFontSize = Math.max(22, Math.min(28, 28 - (ctaText.length - 15) * 0.3))
  
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
        {/* MY ARC Logo */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <svg width="250" height="60" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="energyGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#energyGradient1)"
              fontSize="48"
              fontWeight="900"
              letterSpacing="4"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: settings.bodySpacing === 'compact' ? '30px' : settings.bodySpacing === 'spacious' ? '50px' : '40px'
        }}>
          {/* Main Title */}
          <svg width="920" height="80" style={{ display: 'block', margin: '0 auto 15px' }}>
            <defs>
              <linearGradient id="energyGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#energyGradient2)"
              fontSize={headerTitleFontSize}
              fontWeight="900"
              letterSpacing="-1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {headerTitle}
            </text>
          </svg>
          
          {/* Subtitle */}
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="energyGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#energyGradient3)"
              fontSize={subTitleFontSize}
              fontWeight="700"
              letterSpacing="1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {subTitle}
            </text>
          </svg>
        </div>

        {/* Divider Line */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
          borderRadius: '2px',
          marginBottom: settings.bodySpacing === 'compact' ? '30px' : settings.bodySpacing === 'spacious' ? '50px' : '40px',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
        }} />
        
        {/* Before/After Comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: settings.bodySpacing === 'compact' ? '30px' : settings.bodySpacing === 'spacious' ? '50px' : '40px'
        }}>
          {/* BEFORE Column */}
          <div style={{
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            position: 'relative'
          }}>
            {/* BEFORE Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '25px'
            }}>
              <BatteryLow size={32} style={{ stroke: '#ef4444' }} />
              <h3 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#ef4444',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                VOORHEEN
              </h3>
            </div>

            {/* BEFORE Items */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {beforeItems.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    flexShrink: 0
                  }} />
                  <p style={{
                    fontSize: `${(settings.bodyFontSize || 42) - 8}px`,
                    fontWeight: '600',
                    color: '#fff',
                    margin: 0,
                    lineHeight: '1.2',
                    textShadow: `
                      1px 1px 0 #000,
                      -1px 1px 0 #000,
                      -1px -1px 0 #000,
                      1px -1px 0 #000
                    `
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* Low Energy Badge */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#ef4444',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              LOW ENERGY
            </div>
          </div>

          {/* AFTER Column */}
          <div style={{
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            position: 'relative',
            transform: 'scale(1.02)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'
          }}>
            {/* AFTER Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '25px'
            }}>
              <Battery size={32} style={{ stroke: '#10b981' }} />
              <h3 style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#10b981',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                NU
              </h3>
            </div>

            {/* AFTER Items */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {afterItems.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '10px'
                }}>
                  <Zap size={16} style={{ stroke: '#10b981', fill: '#10b981' }} />
                  <p style={{
                    fontSize: `${(settings.bodyFontSize || 42) - 8}px`,
                    fontWeight: '600',
                    color: '#fff',
                    margin: 0,
                    lineHeight: '1.2',
                    textShadow: `
                      1px 1px 0 #000,
                      -1px 1px 0 #000,
                      -1px -1px 0 #000,
                      1px -1px 0 #000
                    `
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* High Energy Badge */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              HIGH ENERGY
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="energyGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#energyGradient4)"
              fontSize={ctaFontSize}
              fontWeight="800"
              letterSpacing="1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {ctaText}
            </text>
          </svg>
        </div>
        
        {/* Swipe Indicator */}
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
              <linearGradient id="energyGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#energyGradient5)"
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
