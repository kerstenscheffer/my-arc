// src/modules/lead-pic-generator/templates/rewards/ScreenshotTemplate.jsx
import React from 'react'
import { Smartphone, ArrowDown, ChevronRight, Camera } from 'lucide-react'

export default function ScreenshotTemplate({ 
  backgroundImage, 
  content = {
    step1: 'Screenshot dit',
    step2: 'DM me de screenshot',
    step3: 'Krijg exclusive lijst + bonus',
    bonus: 'Eerste 20 krijgen extra voice memo'
  },
  settings = {
    overlayDarkness: 60,
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu'
  }
}) {
  
  // Calculate sizes based on rewardButtonSize
  const stepFontSize = settings.rewardButtonSize === 'small' ? '32px' : 
                       settings.rewardButtonSize === 'large' ? '48px' : '40px'
  
  const arrowSize = settings.rewardButtonSize === 'small' ? 32 : 
                    settings.rewardButtonSize === 'large' ? 48 : 40
  
  const rewardPadding = settings.rewardButtonSize === 'small' ? '20px 40px' : 
                        settings.rewardButtonSize === 'large' ? '30px 60px' : '25px 50px'
  
  const rewardFontSize = settings.rewardButtonSize === 'small' ? '30px' : 
                         settings.rewardButtonSize === 'large' ? '42px' : '36px'
  
  const bonusPadding = settings.rewardButtonSize === 'small' ? '12px 24px' : 
                       settings.rewardButtonSize === 'large' ? '18px 36px' : '15px 30px'
  
  const bonusFontSize = settings.rewardButtonSize === 'small' ? '20px' : 
                        settings.rewardButtonSize === 'large' ? '28px' : '24px'
  
  // Phone size scales with button size
  const phoneWidth = settings.rewardButtonSize === 'small' ? '280px' : 
                     settings.rewardButtonSize === 'large' ? '360px' : '320px'
  
  const phoneHeight = settings.rewardButtonSize === 'small' ? '560px' : 
                      settings.rewardButtonSize === 'large' ? '720px' : '640px'
  
  const phoneCameraSize = settings.rewardButtonSize === 'small' ? 48 : 
                          settings.rewardButtonSize === 'large' ? 72 : 60
  
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
              <linearGradient id="textGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle" 
              dominantBaseline="middle"
              fill="url(#textGradient1)"
              fontSize="48px"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="4px"
            >
              MY ARC
            </text>
          </svg>
        </div>
        
        {/* Phone Visual with Screenshot Area - Uses rewardButtonSize */}
        <div style={{
          position: 'relative',
          marginBottom: '60px'
        }}>
          {/* Phone Frame */}
          <div style={{
            width: phoneWidth,
            height: phoneHeight,
            border: '8px solid #333',
            borderRadius: '40px',
            background: '#111',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Phone Screen */}
            <div style={{
              position: 'absolute',
              top: '40px',
              left: '20px',
              right: '20px',
              bottom: '40px',
              background: '#000',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px dashed #10b981',
              animation: 'dashAnimation 20s linear infinite'
            }}>
              <Camera size={phoneCameraSize} style={{ stroke: '#10b981', marginBottom: '20px' }} />
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Screenshot Zone
              </div>
            </div>
            
            {/* Phone Notch */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '25px',
              background: '#333',
              borderRadius: '15px'
            }} />
          </div>
          
          {/* Screenshot Icon Floating */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '80px',
            height: '80px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(16, 185, 129, 0.5)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <Camera size={40} style={{ stroke: '#fff', fill: '#fff' }} />
          </div>
        </div>
        
        {/* Steps - Uses rewardButtonSize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '50px'
        }}>
          {/* Step 1 */}
          <div style={{
            fontSize: stepFontSize,
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: `
              2px 2px 0 #000,
              -2px 2px 0 #000,
              -2px -2px 0 #000,
              2px -2px 0 #000,
              4px 4px 8px rgba(0, 0, 0, 0.8)
            `
          }}>
            {content.step1}
          </div>
          
          <ArrowDown size={arrowSize} style={{ 
            stroke: '#10b981', 
            animation: 'bounce 2s infinite' 
          }} />
          
          {/* Step 2 */}
          <div style={{
            fontSize: stepFontSize,
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: `
              2px 2px 0 #000,
              -2px 2px 0 #000,
              -2px -2px 0 #000,
              2px -2px 0 #000,
              4px 4px 8px rgba(0, 0, 0, 0.8)
            `
          }}>
            {content.step2}
          </div>
          
          <ArrowDown size={arrowSize} style={{ 
            stroke: '#3b82f6', 
            animation: 'bounce 2s infinite',
            animationDelay: '0.5s'
          }} />
          
          {/* Step 3 - Reward - Uses rewardButtonSize */}
          <div style={{
            padding: rewardPadding,
            background: '#10b981',
            borderRadius: '20px',
            boxShadow: '0 15px 60px rgba(16, 185, 129, 0.5)',
            animation: 'glow 2s ease-in-out infinite'
          }}>
            <div style={{
              fontSize: rewardFontSize,
              fontWeight: '800',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              {content.step3}
            </div>
          </div>
        </div>
        
        {/* Bonus Badge - Uses rewardButtonSize */}
        <div style={{
          padding: bonusPadding,
          background: 'rgba(249, 115, 22, 0.2)',
          border: '2px solid #f97316',
          borderRadius: '100px'
        }}>
          <div style={{
            fontSize: bonusFontSize,
            fontWeight: '600',
            color: '#f97316',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}>
            🎁 {content.bonus}
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
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
          }
          50% { 
            transform: translateY(-10px) rotate(5deg);
          }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0);
          }
          50% { 
            transform: translateY(10px);
          }
        }
        
        @keyframes glow {
          0%, 100% { 
            boxShadow: 0 15px 60px rgba(16, 185, 129, 0.5);
            transform: scale(1);
          }
          50% { 
            boxShadow: 0 20px 80px rgba(16, 185, 129, 0.7);
            transform: scale(1.02);
          }
        }
        
        @keyframes dashAnimation {
          from {
            strokeDashoffset: 0;
          }
          to {
            strokeDashoffset: 20;
          }
        }
      `}</style>
    </div>
  )
}
