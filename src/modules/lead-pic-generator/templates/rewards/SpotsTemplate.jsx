// src/modules/lead-pic-generator/templates/rewards/SpotsTemplate.jsx
import React from 'react'
import { Users, Star, ChevronRight } from 'lucide-react'

export default function SpotsTemplate({ 
  backgroundImage, 
  content = {
    title: 'Eerste 10 krijgen:',
    benefits: [
      'Persoonlijke lijst',
      'Voice memo uitleg',
      'Week check-in'
    ],
    currentSpots: 7,
    totalSpots: 10,
    cta: 'DM "SPOT" nu'
  },
  settings = {
    overlayDarkness: 60,
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu'
  }
}) {
  const spotsLeft = content.totalSpots - content.currentSpots
  const progressPercent = ((content.totalSpots - spotsLeft) / content.totalSpots) * 100
  
  // Calculate sizes based on rewardButtonSize
  const titleSize = `${settings.rewardCTASize || 88}px`
  
  const benefitPadding = settings.rewardButtonSize === 'small' ? '18px 30px' : 
                         settings.rewardButtonSize === 'large' ? '32px 50px' : '25px 40px'
  
  const benefitSize = settings.rewardButtonSize === 'small' ? '26px' : 
                      settings.rewardButtonSize === 'large' ? '38px' : '32px'
  
  const benefitIconSize = settings.rewardButtonSize === 'small' ? 24 : 
                          settings.rewardButtonSize === 'large' ? 40 : 32
  
  const counterSize = settings.rewardButtonSize === 'small' ? '100px' : 
                      settings.rewardButtonSize === 'large' ? '140px' : '120px'
  
  const buttonPadding = settings.rewardButtonSize === 'small' ? '22px 45px' : 
                        settings.rewardButtonSize === 'large' ? '36px 75px' : '30px 60px'
  
  const buttonFontSize = settings.rewardButtonSize === 'small' ? '32px' : 
                         settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  // Determine button text: use custom cta if it's not the default, otherwise use rewardButtonText
  const buttonText = content.cta !== 'DM "SPOT" nu' ? content.cta : settings.rewardButtonText || content.cta
  
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 80px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* MY ARC Logo - FIXED SVG GRADIENT */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <svg width="220" height="60" style={{ display: 'inline-block' }}>
            <defs>
              <linearGradient id="textGradient8" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient8)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Urgency Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '2px solid #ef4444',
          borderRadius: '100px',
          marginBottom: '40px',
          animation: 'urgency 2s ease-in-out infinite'
        }}>
          <Users size={24} style={{ stroke: '#ef4444' }} />
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Limited Spots
          </span>
        </div>
        
        {/* Title - Uses rewardCTASize */}
        <h1 style={{
          fontSize: titleSize,
          fontWeight: '900',
          color: '#fff',
          marginBottom: '50px',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
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
          {content.title}
        </h1>
        
        {/* Benefits List - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          marginBottom: '60px',
          width: '100%',
          maxWidth: '600px'
        }}>
          {content.benefits.map((benefit, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: benefitPadding,
              background: 'rgba(16, 185, 129, 0.1)',
              borderLeft: '4px solid #10b981',
              borderRadius: '12px'
            }}>
              <Star size={benefitIconSize} style={{ 
                stroke: '#10b981', 
                fill: '#10b981',
                minWidth: `${benefitIconSize}px`
              }} />
              <span style={{
                fontSize: benefitSize,
                fontWeight: '600',
                color: '#fff',
                textAlign: 'left',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
              }}>
                {benefit}
              </span>
            </div>
          ))}
        </div>
        
        {/* Spots Counter - Uses rewardButtonSize - FIXED SVG GRADIENT */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '50px'
        }}>
          {/* Counter Display */}
          <div style={{
            marginBottom: '20px'
          }}>
            <svg width="100%" height="140" style={{ display: 'inline-block' }}>
              <defs>
                <linearGradient id="counterGradient9" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="url(#counterGradient9)"
                fontSize={counterSize}
                fontWeight="900"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              >
                {spotsLeft}/{content.totalSpots}
              </text>
            </svg>
          </div>
          
          <div style={{
            fontSize: '32px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '30px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            spots over
          </div>
          
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '100px',
            overflow: 'hidden',
            border: '2px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#10b981',
              borderRadius: '100px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
              animation: 'fillProgress 2s ease-out',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                background: '#fff',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }} />
            </div>
          </div>
        </div>
        
        {/* CTA Button - Uses rewardButtonSize AND rewardButtonText */}
        <button style={{
          padding: buttonPadding,
          background: '#10b981',
          border: 'none',
          borderRadius: '20px',
          fontSize: buttonFontSize,
          fontWeight: '800',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          cursor: 'pointer',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.5)',
          animation: 'ctaPulse 2s ease-in-out infinite',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          {buttonText}
        </button>
        
        {/* Signature */}
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '24px',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '2px'
        }}>
          Kersten • MY ARC
        </div>
        
        {/* Swipe Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px',
          fontWeight: '700',
          opacity: 0.5
        }}>
          <span style={{
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Swipe
          </span>
          <ChevronRight size={36} style={{ stroke: 'rgba(255, 255, 255, 0.5)' }} />
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
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '40px',
            height: '6px',
            background: '#10b981',
            borderRadius: '3px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes urgency {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 0 20px rgba(239, 68, 68, 0.3);
          }
          50% { 
            transform: scale(1.05);
            boxShadow: 0 0 30px rgba(239, 68, 68, 0.5);
          }
        }
        
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: ${progressPercent}%; }
        }
        
        @keyframes ctaPulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 20px 60px rgba(16, 185, 129, 0.5);
          }
          50% { 
            transform: scale(1.03);
            boxShadow: 0 25px 80px rgba(16, 185, 129, 0.7);
          }
        }
      `}</style>
    </div>
  )
}
