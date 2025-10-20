// src/modules/lead-pic-generator/templates/rewards/DmWordTemplate.jsx
import React from 'react'
import { Send, Check, ChevronRight } from 'lucide-react'

export default function DmWordTemplate({ 
  backgroundImage, 
  content = {
    word: 'LIJST',
    description: 'voor de 5 Fitness Fouten',
    promise: 'Ik stuur binnen 60 sec',
    checks: ['100% Gratis', 'Direct in DM', 'Bewezen Systeem']
  },
  settings = {
    overlayDarkness: 60,
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu'
  }
}) {
  const isMobile = window.innerWidth <= 768
  
  // Calculate sizes based on rewardButtonSize
  const wordBoxPadding = settings.rewardButtonSize === 'small' ? '20px 40px' : 
                          settings.rewardButtonSize === 'large' ? '40px 80px' : '30px 60px'
  
  const wordFontSize = `${settings.rewardCTASize || 88}px`
  
  const descriptionSize = settings.rewardButtonSize === 'small' ? '30px' : 
                          settings.rewardButtonSize === 'large' ? '42px' : '36px'
  
  const promisePadding = settings.rewardButtonSize === 'small' ? '15px 30px' : 
                         settings.rewardButtonSize === 'large' ? '25px 50px' : '20px 40px'
  
  const promiseSize = settings.rewardButtonSize === 'small' ? '26px' : 
                      settings.rewardButtonSize === 'large' ? '36px' : '32px'
  
  const checkSize = settings.rewardButtonSize === 'small' ? '24px' : 
                    settings.rewardButtonSize === 'large' ? '32px' : '28px'
  
  const checkIconSize = settings.rewardButtonSize === 'small' ? 24 : 
                        settings.rewardButtonSize === 'large' ? 40 : 32
  
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
              <linearGradient id="textGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient5)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Main CTA Text */}
        <div style={{
          marginBottom: '60px'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
          }}>
            DM het woord
          </div>
          
          {/* The Word - Uses rewardCTASize and rewardButtonSize */}
          <div style={{
            display: 'inline-block',
            padding: wordBoxPadding,
            background: '#10b981',
            borderRadius: '24px',
            marginBottom: '20px',
            boxShadow: '0 15px 60px rgba(16, 185, 129, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <div style={{
              fontSize: wordFontSize,
              fontWeight: '900',
              color: '#fff',
              letterSpacing: '4px',
              textShadow: `
                2px 2px 0 rgba(0,0,0,0.3),
                4px 4px 8px rgba(0,0,0,0.5)
              `
            }}>
              "{content.word}"
            </div>
          </div>
          
          <div style={{
            fontSize: descriptionSize,
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {content.description}
          </div>
        </div>
        
        {/* Promise - Uses rewardButtonSize */}
        <div style={{
          padding: promisePadding,
          background: 'rgba(249, 115, 22, 0.2)',
          border: '2px solid #f97316',
          borderRadius: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: promiseSize,
            fontWeight: '700',
            color: '#f97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Send size={checkIconSize} />
            {content.promise}
          </div>
        </div>
        
        {/* Check marks - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'flex-start',
          maxWidth: '600px'
        }}>
          {content.checks.map((check, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: checkSize,
              fontWeight: '600',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}>
              <Check size={checkIconSize} style={{ stroke: '#10b981', strokeWidth: 3 }} />
              {check}
            </div>
          ))}
        </div>
        
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
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 15px 60px rgba(16, 185, 129, 0.4);
          }
          50% { 
            transform: scale(1.02);
            boxShadow: 0 20px 80px rgba(16, 185, 129, 0.6);
          }
        }
      `}</style>
    </div>
  )
}
