import React from 'react'
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'

export default function TransformationBody({ 
  backgroundImage, 
  points,
  content,
  settings = {}
}) {
  const isMobile = window.innerWidth <= 768
  
  // Use content object if available (new format), otherwise fallback to points (old format)
  const headerTitle = content?.headerTitle || "VAN 7KG SPIERGROEI GEMIST"
  const subTitle = content?.subTitle || "NAAR CONSISTENTE GAINS"
  const ctaText = content?.ctaText || "MIJN COMPLETE FOUTLIJST KRIJGEN"
  const story = content?.points || points || [
    "7kg spiergroei gemist door te weinig eten",
    "Lichaam in katabole staat = afbraak", 
    "Eenvoudige calorie fix = game changer",
    "Nu consistente gains elke maand"
  ]

  // Dynamic font size calculation instead of width
  const headerTitleFontSize = Math.max(32, Math.min(52, 52 - (headerTitle.length - 20) * 0.8))
  const subTitleFontSize = Math.max(24, Math.min(36, 36 - (subTitle.length - 15) * 0.5))
  const ctaFontSize = Math.max(20, Math.min(32, 32 - (ctaText.length - 25) * 0.3))
  
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
              <linearGradient id="transformGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#transformGradient1)"
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
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px'
        }}>
          {/* Main Title - Fixed Width SVG with Dynamic Font */}
          <svg width="920" height="80" style={{ display: 'block', margin: '0 auto 20px' }}>
            <defs>
              <linearGradient id="transformGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#transformGradient2)"
              fontSize={headerTitleFontSize}
              fontWeight="900"
              letterSpacing="-1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {headerTitle}
            </text>
          </svg>
          
          {/* Subtitle - Fixed Width SVG with Dynamic Font */}
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="transformGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#transformGradient3)"
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
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }} />
        
        {/* Story Timeline */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: settings.bodySpacing === 'compact' ? '25px' : settings.bodySpacing === 'spacious' ? '45px' : '35px'
        }}>
          {/* Problem Phase */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            position: 'relative'
          }}>
            <TrendingDown 
              size={42} 
              style={{ 
                flexShrink: 0,
                stroke: '#ef4444',
                strokeWidth: 3
              }}
            />
            <p style={{
              fontSize: `${settings.bodyFontSize || 42}px`,
              fontWeight: '700',
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
              {story[0]}
            </p>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#ef4444',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              PROBLEEM
            </div>
          </div>

          {/* Root Cause */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            position: 'relative'
          }}>
            <div style={{
              flexShrink: 0,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '900',
              color: '#000'
            }}>
              !
            </div>
            <p style={{
              fontSize: `${settings.bodyFontSize || 42}px`,
              fontWeight: '700',
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
              {story[1]}
            </p>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#f59e0b',
              color: '#000',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              OORZAAK
            </div>
          </div>

          {/* Solution */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: '20px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            position: 'relative'
          }}>
            <div style={{
              flexShrink: 0,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: '#000'
            }}>
              ✓
            </div>
            <p style={{
              fontSize: `${settings.bodyFontSize || 42}px`,
              fontWeight: '700',
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
              {story[2]}
            </p>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#10b981',
              color: '#000',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              OPLOSSING
            </div>
          </div>

          {/* Result */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            borderRadius: '20px',
            border: '3px solid rgba(16, 185, 129, 0.5)',
            position: 'relative',
            transform: 'scale(1.02)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}>
            <TrendingUp 
              size={48} 
              style={{ 
                flexShrink: 0,
                stroke: '#10b981',
                strokeWidth: 4
              }}
            />
            <p style={{
              fontSize: `${(settings.bodyFontSize || 42) + 6}px`,
              fontWeight: '900',
              color: '#10b981',
              margin: 0,
              lineHeight: '1.2',
              textShadow: '0 2px 20px rgba(16, 185, 129, 0.5)'
            }}>
              {story[3]}
            </p>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              RESULTAAT
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          marginTop: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          textAlign: 'center',
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="transformGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#transformGradient4)"
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
              <linearGradient id="transformGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#transformGradient5)"
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
