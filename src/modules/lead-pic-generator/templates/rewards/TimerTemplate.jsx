// src/modules/lead-pic-generator/templates/rewards/TimerTemplate.jsx
import React from 'react'
import { Clock, AlertTriangle, ChevronRight } from 'lucide-react'

export default function TimerTemplate({ 
  backgroundImage, 
  content = {
    title: 'Deze lijst verdwijnt in:',
    hours: '23',
    minutes: '47',
    seconds: '12',
    cta: 'DM "NU" voordat het te laat is',
    warning: 'Nooit meer deze prijs'
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
  
  const clockIconSize = settings.rewardButtonSize === 'small' ? 60 : 
                        settings.rewardButtonSize === 'large' ? 100 : 80
  
  const timerBoxPadding = settings.rewardButtonSize === 'small' ? '30px' : 
                          settings.rewardButtonSize === 'large' ? '50px' : '40px'
  
  const timerNumberSize = settings.rewardButtonSize === 'small' ? '90px' : 
                           settings.rewardButtonSize === 'large' ? '140px' : '120px'
  
  const colonSize = settings.rewardButtonSize === 'small' ? '60px' : 
                    settings.rewardButtonSize === 'large' ? '100px' : '80px'
  
  const timerLabelSize = settings.rewardButtonSize === 'small' ? '20px' : 
                         settings.rewardButtonSize === 'large' ? '28px' : '24px'
  
  const buttonPadding = settings.rewardButtonSize === 'small' ? '22px 45px' : 
                        settings.rewardButtonSize === 'large' ? '36px 75px' : '30px 60px'
  
  const buttonFontSize = settings.rewardButtonSize === 'small' ? '32px' : 
                         settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  const warningPadding = settings.rewardButtonSize === 'small' ? '12px 24px' : 
                         settings.rewardButtonSize === 'large' ? '18px 36px' : '15px 30px'
  
  const warningIconSize = settings.rewardButtonSize === 'small' ? 20 : 
                          settings.rewardButtonSize === 'large' ? 28 : 24
  
  const warningTextSize = settings.rewardButtonSize === 'small' ? '20px' : 
                          settings.rewardButtonSize === 'large' ? '28px' : '24px'
  
  // Determine button text: use custom cta if it's not the default, otherwise use rewardButtonText
  const buttonText = content.cta !== 'DM "NU" voordat het te laat is' ? content.cta : settings.rewardButtonText || content.cta
  
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
              <linearGradient id="textGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient2)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Urgency Icon - Uses rewardButtonSize */}
        <div style={{
          marginBottom: '30px',
          animation: 'urgentPulse 1.5s ease-in-out infinite'
        }}>
          <Clock size={clockIconSize} style={{ stroke: '#ef4444', strokeWidth: 3 }} />
        </div>
        
        {/* Title - Uses rewardCTASize */}
        <h1 style={{
          fontSize: titleSize,
          fontWeight: '900',
          color: '#fff',
          marginBottom: '50px',
          textTransform: 'uppercase',
          letterSpacing: '-1px',
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
        
        {/* Timer Display - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '60px',
          padding: timerBoxPadding,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '4px solid #ef4444',
          borderRadius: '30px',
          boxShadow: '0 20px 60px rgba(239, 68, 68, 0.4), inset 0 0 60px rgba(239, 68, 68, 0.1)'
        }}>
          {/* Hours */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: timerNumberSize,
              fontWeight: '900',
              fontFamily: '"Courier New", monospace',
              color: '#ef4444',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
              animation: 'timerGlow 2s ease-in-out infinite'
            }}>
              {content.hours}
            </div>
            <div style={{
              fontSize: timerLabelSize,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '10px'
            }}>
              Uur
            </div>
          </div>
          
          <div style={{
            fontSize: colonSize,
            color: '#ef4444',
            lineHeight: timerNumberSize,
            animation: 'blink 2s infinite'
          }}>
            :
          </div>
          
          {/* Minutes */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: timerNumberSize,
              fontWeight: '900',
              fontFamily: '"Courier New", monospace',
              color: '#ef4444',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
              animation: 'timerGlow 2s ease-in-out infinite',
              animationDelay: '0.5s'
            }}>
              {content.minutes}
            </div>
            <div style={{
              fontSize: timerLabelSize,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '10px'
            }}>
              Min
            </div>
          </div>
          
          <div style={{
            fontSize: colonSize,
            color: '#ef4444',
            lineHeight: timerNumberSize,
            animation: 'blink 2s infinite',
            animationDelay: '1s'
          }}>
            :
          </div>
          
          {/* Seconds */}
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: timerNumberSize,
              fontWeight: '900',
              fontFamily: '"Courier New", monospace',
              color: '#ef4444',
              lineHeight: '1',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
              animation: 'timerGlow 2s ease-in-out infinite',
              animationDelay: '1s'
            }}>
              {content.seconds}
            </div>
            <div style={{
              fontSize: timerLabelSize,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '10px'
            }}>
              Sec
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
          boxShadow: '0 20px 60px rgba(239, 68, 68, 0.5)',
          animation: 'urgentCtaPulse 1.5s ease-in-out infinite',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          marginBottom: '30px'
        }}>
          {buttonText}
        </button>
        
        {/* Warning - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: warningPadding,
          background: 'rgba(249, 115, 22, 0.2)',
          border: '2px solid #f97316',
          borderRadius: '100px'
        }}>
          <AlertTriangle size={warningIconSize} style={{ stroke: '#f97316' }} />
          <span style={{
            fontSize: warningTextSize,
            fontWeight: '600',
            color: '#f97316',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            {content.warning}
          </span>
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
        @keyframes urgentPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        @keyframes timerGlow {
          0%, 100% { 
            textShadow: 0 0 30px rgba(239, 68, 68, 0.8);
          }
          50% { 
            textShadow: 0 0 50px rgba(239, 68, 68, 1);
          }
        }
        
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        
        @keyframes urgentCtaPulse {
          0%, 100% { 
            transform: scale(1);
            boxShadow: 0 20px 60px rgba(239, 68, 68, 0.5);
          }
          50% { 
            transform: scale(1.05);
            boxShadow: 0 25px 80px rgba(239, 68, 68, 0.7);
          }
        }
      `}</style>
    </div>
  )
}
