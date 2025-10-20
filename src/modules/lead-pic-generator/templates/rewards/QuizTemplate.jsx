// src/modules/lead-pic-generator/templates/rewards/QuizTemplate.jsx
import React from 'react'
import { MessageCircle, ChevronRight } from 'lucide-react'

export default function QuizTemplate({ 
  backgroundImage, 
  content = {
    title: 'Ontdek jouw type:',
    subtitle: 'Comment je grootste struggle:',
    options: [
      { number: '1', text: 'Consistentie', color: '#10b981' },
      { number: '2', text: 'Voeding', color: '#f59e0b' },
      { number: '3', text: 'Kennis', color: '#3b82f6' }
    ],
    promise: 'Ik stuur gepersonaliseerd plan'
  },
  settings = {
    overlayDarkness: 60,
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu'
  }
}) {
  
  // Calculate sizes based on rewardButtonSize
  const titleSize = `${settings.rewardCTASize || 88}px`
  
  const subtitlePadding = settings.rewardButtonSize === 'small' ? '15px 30px' : 
                          settings.rewardButtonSize === 'large' ? '25px 50px' : '20px 40px'
  
  const subtitleSize = settings.rewardButtonSize === 'small' ? '26px' : 
                       settings.rewardButtonSize === 'large' ? '38px' : '32px'
  
  const subtitleIconSize = settings.rewardButtonSize === 'small' ? 24 : 
                           settings.rewardButtonSize === 'large' ? 40 : 32
  
  const optionPadding = settings.rewardButtonSize === 'small' ? '22px 30px' : 
                        settings.rewardButtonSize === 'large' ? '36px 50px' : '30px 40px'
  
  const optionNumberSize = settings.rewardButtonSize === 'small' ? '52px' : 
                           settings.rewardButtonSize === 'large' ? '72px' : '64px'
  
  const optionTextSize = settings.rewardButtonSize === 'small' ? '32px' : 
                         settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  const promisePadding = settings.rewardButtonSize === 'small' ? '24px 40px' : 
                         settings.rewardButtonSize === 'large' ? '36px 60px' : '30px 50px'
  
  const promiseSize = settings.rewardButtonSize === 'small' ? '30px' : 
                      settings.rewardButtonSize === 'large' ? '42px' : '36px'
  
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
              <linearGradient id="textGradient10" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient10)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Title - Uses rewardCTASize */}
        <h1 style={{
          fontSize: titleSize,
          fontWeight: '900',
          color: '#fff',
          marginBottom: '20px',
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
        
        {/* Comment Instruction - Uses rewardButtonSize */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '16px',
          padding: subtitlePadding,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid #10b981',
          borderRadius: '100px',
          marginBottom: '50px'
        }}>
          <MessageCircle size={subtitleIconSize} style={{ stroke: '#10b981' }} />
          <span style={{
            fontSize: subtitleSize,
            fontWeight: '600',
            color: '#10b981',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {content.subtitle}
          </span>
        </div>
        
        {/* Quiz Options - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '600px',
          marginBottom: '60px'
        }}>
          {content.options.map((option, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              padding: optionPadding,
              background: `rgba(${hexToRgb(option.color)}, 0.1)`,
              border: `3px solid ${option.color}`,
              borderRadius: '20px',
              boxShadow: `0 10px 40px rgba(${hexToRgb(option.color)}, 0.3)`,
              animation: `optionGlow${index} 3s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                fontSize: optionNumberSize,
                fontWeight: '900',
                color: option.color,
                marginRight: '30px',
                minWidth: '80px',
                textShadow: `0 0 20px rgba(${hexToRgb(option.color)}, 0.5)`
              }}>
                {option.number}
              </div>
              <div style={{
                fontSize: optionTextSize,
                fontWeight: '700',
                color: '#fff',
                flex: 1,
                textAlign: 'left',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
              }}>
                {option.text}
              </div>
            </div>
          ))}
        </div>
        
        {/* Promise Box - Uses rewardButtonSize - SIMPLE TEXT */}
        <div style={{
          padding: promisePadding,
          background: '#10b981',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{
            fontSize: promiseSize,
            fontWeight: '700',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            {content.promise}
          </div>
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
        @keyframes optionGlow0 {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 40px rgba(16, 185, 129, 0.3);
          }
          50% { 
            transform: scale(1.02);
            boxShadow: 0 15px 60px rgba(16, 185, 129, 0.5);
          }
        }
        
        @keyframes optionGlow1 {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 40px rgba(245, 158, 11, 0.3);
          }
          50% { 
            transform: scale(1.02);
            boxShadow: 0 15px 60px rgba(245, 158, 11, 0.5);
          }
        }
        
        @keyframes optionGlow2 {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 10px 40px rgba(59, 130, 246, 0.3);
          }
          50% { 
            transform: scale(1.02);
            boxShadow: 0 15px 60px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  )
}

// Helper function
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 255, 255'
}
