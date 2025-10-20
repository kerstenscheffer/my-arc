// src/modules/lead-pic-generator/templates/rewards/SocialProofTemplate.jsx
import React from 'react'
import { MessageSquare, Map, ThumbsUp, ChevronRight } from 'lucide-react'

export default function SocialProofTemplate({ 
  backgroundImage, 
  content = {
    title: '342 mensen pakten dit al',
    testimonials: [
      { user: '@markd92', text: 'Life changing! 💯' },
      { user: '@sarah_fit', text: 'Waarom gratis?! Dit is goud!' },
      { user: '@peter_gains', text: '3 weken en al resultaat 🔥' }
    ],
    cta: 'DM voor jouw exemplaar',
    stats: '98% geeft 5 sterren'
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
  
  const testimonialPadding = settings.rewardButtonSize === 'small' ? '18px' : 
                             settings.rewardButtonSize === 'large' ? '32px' : '25px'
  
  const avatarSize = settings.rewardButtonSize === 'small' ? '48px' : 
                     settings.rewardButtonSize === 'large' ? '72px' : '60px'
  
  const avatarFontSize = settings.rewardButtonSize === 'small' ? '20px' : 
                         settings.rewardButtonSize === 'large' ? '28px' : '24px'
  
  const userNameSize = settings.rewardButtonSize === 'small' ? '16px' : 
                       settings.rewardButtonSize === 'large' ? '24px' : '20px'
  
  const testimonialTextSize = settings.rewardButtonSize === 'small' ? '22px' : 
                              settings.rewardButtonSize === 'large' ? '34px' : '28px'
  
  const buttonPadding = settings.rewardButtonSize === 'small' ? '22px 45px' : 
                        settings.rewardButtonSize === 'large' ? '36px 75px' : '30px 60px'
  
  const buttonFontSize = settings.rewardButtonSize === 'small' ? '32px' : 
                         settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  const buttonIconSize = settings.rewardButtonSize === 'small' ? 28 : 
                         settings.rewardButtonSize === 'large' ? 44 : 36
  
  const starSize = settings.rewardButtonSize === 'small' ? '26px' : 
                   settings.rewardButtonSize === 'large' ? '38px' : '32px'
  
  // Determine button text: use custom cta if it's not the default, otherwise use rewardButtonText
  const buttonText = content.cta !== 'DM voor jouw exemplaar' ? content.cta : settings.rewardButtonText || content.cta
  
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
              <linearGradient id="textGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient3)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Social Count - Uses rewardCTASize - FIXED SVG GRADIENT */}
        <div style={{
          marginBottom: '40px'
        }}>
          <div style={{
            marginBottom: '10px'
          }}>
            <svg width="100%" height="120" style={{ display: 'inline-block' }}>
              <defs>
                <linearGradient id="titleGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="url(#titleGradient4)"
                fontSize={titleSize}
                fontWeight="900"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                letterSpacing="-2px"
                textTransform="uppercase"
              >
                {content.title}
              </text>
            </svg>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '100px'
          }}>
            <ThumbsUp size={20} style={{ stroke: '#10b981', fill: '#10b981' }} />
            <span style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              {content.stats}
            </span>
          </div>
        </div>
        
        {/* Testimonials - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '25px',
          width: '100%',
          maxWidth: '700px',
          marginBottom: '60px'
        }}>
          {content.testimonials.map((testimonial, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              padding: testimonialPadding,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: `slideIn ${0.5 + index * 0.2}s ease-out`
            }}>
              {/* Profile Picture Placeholder */}
              <div style={{
                width: avatarSize,
                height: avatarSize,
                minWidth: avatarSize,
                background: `linear-gradient(135deg, 
                  ${['#10b981', '#3b82f6', '#f59e0b'][index]} 0%, 
                  ${['#059669', '#2563eb', '#dc2626'][index]} 100%)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: avatarFontSize,
                fontWeight: '900',
                color: '#fff'
              }}>
                {testimonial.user.charAt(1).toUpperCase()}
              </div>
              
              {/* Comment Content */}
              <div style={{
                flex: 1,
                textAlign: 'left'
              }}>
                <div style={{
                  fontSize: userNameSize,
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '8px'
                }}>
                  {testimonial.user}
                </div>
                <div style={{
                  fontSize: testimonialTextSize,
                  fontWeight: '600',
                  color: '#fff',
                  lineHeight: '1.3',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                }}>
                  "{testimonial.text}"
                </div>
              </div>
              
              {/* Quote Icon */}
              <MessageSquare size={24} style={{ 
                stroke: 'rgba(255, 255, 255, 0.2)',
                minWidth: '24px'
              }} />
            </div>
          ))}
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
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {buttonText}
          <MessageSquare size={buttonIconSize} style={{ stroke: '#fff', fill: '#fff' }} />
        </button>
        
        {/* Trust Badge - Uses rewardButtonSize */}
        <div style={{
          position: 'absolute',
          bottom: '200px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px'
        }}>
          {[1,2,3,4,5].map((star) => (
            <div key={star} style={{
              fontSize: starSize,
              color: '#f59e0b',
              textShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
            }}>
              ⭐
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
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
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
