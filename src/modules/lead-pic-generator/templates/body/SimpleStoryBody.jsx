import React from 'react'
import { ChevronRight } from 'lucide-react'

export default function SimpleStoryBody({ 
  backgroundImage, 
  content,
  points, // Fallback for old format
  settings = {}
}) {
  const isMobile = window.innerWidth <= 768
  
  // Use content object if available (new format), otherwise fallback
  const title = content?.title || "MIJN VERHAAL"
  const subtitle = content?.subtitle || "Hoe ik alles veranderde"
  const paragraph = content?.paragraph || points?.[0] || "Dit is mijn verhaal over hoe ik alles veranderde. Het begon met kleine stappen, maar groeide uit tot een complete transformatie van mijn leven. Nu help ik anderen om hetzelfde te bereiken."
  const ctaText = content?.ctaText || "WEDEROM MEE MET MIJN VERHAAL? DM GRAAG"

  // Dynamic font size calculation
  const titleFontSize = Math.max(36, Math.min(56, 56 - (title.length - 15) * 0.8))
  const subtitleFontSize = Math.max(24, Math.min(32, 32 - (subtitle.length - 15) * 0.4))
  const ctaFontSize = Math.max(18, Math.min(24, 24 - (ctaText.length - 35) * 0.15))
  
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
              <linearGradient id="simpleGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#simpleGradient1)"
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
              <linearGradient id="simpleGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#simpleGradient2)"
              fontSize={titleFontSize}
              fontWeight="900"
              letterSpacing="-1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {title}
            </text>
          </svg>
          
          {/* Subtitle - Fixed Width SVG with Dynamic Font */}
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="simpleGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#simpleGradient3)"
              fontSize={subtitleFontSize}
              fontWeight="700"
              letterSpacing="1"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            >
              {subtitle}
            </text>
          </svg>
        </div>

        {/* Divider Line */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: '2px',
          marginBottom: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }} />
        
        {/* Main Paragraph Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Premium Text Box */}
          <div style={{
            maxWidth: '800px',
            padding: '40px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
            borderRadius: '24px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)'
          }}>
            {/* Decorative corner elements */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '30px',
              height: '30px',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              borderRadius: '50%',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }} />
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '30px',
              height: '30px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30px',
              height: '30px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)',
              borderRadius: '50%',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }} />
            
            {/* Main paragraph text */}
            <p style={{
              fontSize: `${settings.bodyFontSize || 42}px`,
              fontWeight: '600',
              color: '#fff',
              margin: 0,
              lineHeight: '1.4',
              textAlign: 'center',
              textShadow: `
                2px 2px 0 #000,
                -2px 2px 0 #000,
                -2px -2px 0 #000,
                2px -2px 0 #000,
                0 0 30px rgba(0, 0, 0, 0.8)
              `
            }}>
              {paragraph}
            </p>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div style={{
          marginTop: settings.bodySpacing === 'compact' ? '40px' : settings.bodySpacing === 'spacious' ? '80px' : '60px',
          textAlign: 'center',
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '20px',
          border: '2px solid rgba(16, 185, 129, 0.3)'
        }}>
          <svg width="920" height="50" style={{ display: 'block', margin: '0 auto' }}>
            <defs>
              <linearGradient id="simpleGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#simpleGradient4)"
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
              <linearGradient id="simpleGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#simpleGradient5)"
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
