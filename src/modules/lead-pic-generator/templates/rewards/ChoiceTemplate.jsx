// src/modules/lead-pic-generator/templates/rewards/ChoiceTemplate.jsx
import React from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'

export default function ChoiceTemplate({ 
  backgroundImage, 
  content = {
    title: 'Welke wil jij?',
    optionA: '5 Fouten Lijst',
    optionB: 'Voeding Calculator',
    optionC: 'Beide (bonus)',
    cta: 'DM je letter'
  },
  settings = {
    overlayDarkness: 60,
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu'
  }
}) {
  
  // Calculate sizes based on rewardButtonSize
  const optionPadding = settings.rewardButtonSize === 'small' ? '25px 40px' : 
                        settings.rewardButtonSize === 'large' ? '45px 60px' : '35px 50px'
  
  const optionLetterSize = settings.rewardButtonSize === 'small' ? '48px' : 
                           settings.rewardButtonSize === 'large' ? '64px' : '56px'
  
  const optionTextSize = settings.rewardButtonSize === 'small' ? '30px' : 
                         settings.rewardButtonSize === 'large' ? '42px' : '36px'
  
  const ctaPadding = settings.rewardButtonSize === 'small' ? '20px 40px' : 
                      settings.rewardButtonSize === 'large' ? '30px 60px' : '25px 50px'
  
  const ctaTextSize = settings.rewardButtonSize === 'small' ? '32px' : 
                      settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  const ctaIconSize = settings.rewardButtonSize === 'small' ? 32 : 
                      settings.rewardButtonSize === 'large' ? 48 : 40
  
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
              <linearGradient id="textGradient6" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient6)"
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
          fontSize: `${settings.rewardCTASize || 88}px`,
          fontWeight: '900',
          color: '#fff',
          marginBottom: '60px',
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
        
        {/* Choice Options - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          width: '100%',
          maxWidth: '700px',
          marginBottom: '60px'
        }}>
          {/* Option A */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: optionPadding,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '3px solid #10b981',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
            animation: 'glow1 3s ease-in-out infinite'
          }}>
            <div style={{
              fontSize: optionLetterSize,
              fontWeight: '900',
              color: '#10b981',
              marginRight: '30px',
              minWidth: '80px'
            }}>
              A:
            </div>
            <div style={{
              fontSize: optionTextSize,
              fontWeight: '700',
              color: '#fff',
              flex: 1,
              textAlign: 'left',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}>
              {content.optionA}
            </div>
          </div>
          
          {/* Option B */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: optionPadding,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '3px solid #3b82f6',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
            animation: 'glow2 3s ease-in-out infinite',
            animationDelay: '1s'
          }}>
            <div style={{
              fontSize: optionLetterSize,
              fontWeight: '900',
              color: '#3b82f6',
              marginRight: '30px',
              minWidth: '80px'
            }}>
              B:
            </div>
            <div style={{
              fontSize: optionTextSize,
              fontWeight: '700',
              color: '#fff',
              flex: 1,
              textAlign: 'left',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}>
              {content.optionB}
            </div>
          </div>
          
          {/* Option C - Special - FIXED SVG GRADIENT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: optionPadding,
            background: '#10b981',
            border: '3px solid transparent',
            backgroundImage: `
              linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%),
              linear-gradient(135deg, #10b981 0%, #3b82f6 100%)
            `,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            borderRadius: '20px',
            boxShadow: '0 15px 60px rgba(16, 185, 129, 0.4)',
            animation: 'special 2s ease-in-out infinite'
          }}>
            <div style={{
              marginRight: '30px',
              minWidth: '80px'
            }}>
              <svg width="80" height="60" style={{ display: 'inline-block' }}>
                <defs>
                  <linearGradient id="optionCGradient7" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <text 
                  x="50%" 
                  y="50%" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fill="url(#optionCGradient7)"
                  fontSize={optionLetterSize}
                  fontWeight="900"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                >
                  C:
                </text>
              </svg>
            </div>
            <div style={{
              fontSize: optionTextSize,
              fontWeight: '700',
              color: '#fff',
              flex: 1,
              textAlign: 'left',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}>
              {content.optionC}
            </div>
          </div>
        </div>
        
        {/* CTA - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: ctaPadding,
          background: '#10b981',
          borderRadius: '20px',
          boxShadow: '0 15px 60px rgba(16, 185, 129, 0.5)'
        }}>
          <span style={{
            fontSize: ctaTextSize,
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            {content.cta}
          </span>
          <ArrowRight size={ctaIconSize} style={{ stroke: '#fff', strokeWidth: 3 }} />
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
        @keyframes glow1 {
          0%, 100% { 
            boxShadow: 0 10px 40px rgba(16, 185, 129, 0.3);
            transform: scale(1);
          }
          50% { 
            boxShadow: 0 15px 60px rgba(16, 185, 129, 0.5);
            transform: scale(1.01);
          }
        }
        
        @keyframes glow2 {
          0%, 100% { 
            boxShadow: 0 10px 40px rgba(59, 130, 246, 0.3);
            transform: scale(1);
          }
          50% { 
            boxShadow: 0 15px 60px rgba(59, 130, 246, 0.5);
            transform: scale(1.01);
          }
        }
        
        @keyframes special {
          0%, 100% { 
            boxShadow: 0 15px 60px rgba(16, 185, 129, 0.4);
            transform: scale(1);
          }
          50% { 
            boxShadow: 0 20px 80px rgba(59, 130, 246, 0.6);
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}
