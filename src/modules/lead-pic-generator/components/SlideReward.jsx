// src/modules/lead-pic-generator/components/SlideReward.jsx
import React from 'react'
import { Send, ArrowDown } from 'lucide-react'

export default function SlideReward({ backgroundImage, rewardText, settings = {} }) {
  const overlayDarkness = settings.overlayDarkness || 60
  
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
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      )}
      
      {/* Dynamic Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `rgba(0, 0, 0, ${overlayDarkness / 100})`
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px 80px',
        textAlign: 'center'
      }}>
        {/* MY ARC Logo - Bigger on reward */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '56px',
          fontWeight: '900',
          letterSpacing: '3px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          MY ARC
        </div>
        
        {/* Arrow Down Animation */}
        <div style={{
          position: 'absolute',
          top: '240px',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite'
        }}>
          <ArrowDown size={60} style={{
            stroke: 'url(#arrowGradient)',
            filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.4))'
          }} />
          <svg width="0" height="0">
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* CTA Text - HUGE */}
        <h1 style={{
          fontSize: `${settings.rewardCTASize || 88}px`,
          fontWeight: '900',
          lineHeight: '1',
          color: '#fff',
          margin: '0 0 60px 0',
          textTransform: 'uppercase',
          letterSpacing: '-2px',
          whiteSpace: 'pre-line',
          textShadow: `
            3px 3px 0 #000,
            -3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            4px 4px 0 #000,
            5px 5px 0 #000,
            6px 6px 20px rgba(0, 0, 0, 0.9)
          `,
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill'
        }}>
          {rewardText}
        </h1>
        
        {/* CTA Button Visual */}
        <div style={{
          padding: settings.rewardButtonSize === 'small' ? '24px 48px' : settings.rewardButtonSize === 'large' ? '40px 80px' : '32px 64px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          borderRadius: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 15px 50px rgba(16, 185, 129, 0.5)',
          animation: 'glow 3s ease-in-out infinite',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Send 
            size={settings.rewardButtonSize === 'small' ? 32 : settings.rewardButtonSize === 'large' ? 48 : 40} 
            color="#fff" 
            strokeWidth={3} 
          />
          <span style={{
            fontSize: settings.rewardButtonSize === 'small' ? '28px' : settings.rewardButtonSize === 'large' ? '42px' : '36px',
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            {settings.rewardButtonText || "Start Nu"}
          </span>
        </div>
        
        {/* Urgency Text */}
        <p style={{
          position: 'absolute',
          bottom: '200px',
          fontSize: '36px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          100% GRATIS
        </p>
        
        {/* Signature */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '28px',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.8)',
          letterSpacing: '2px'
        }}>
          Kersten • MY ARC
        </div>
        
        {/* Slide Indicators */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '60px',
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '20px',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px'
          }} />
          <div style={{
            width: '40px',
            height: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            borderRadius: '3px'
          }} />
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(15px); }
        }
        
        @keyframes glow {
          0%, 100% { 
            boxShadow: 0 15px 50px rgba(16, 185, 129, 0.5);
            transform: scale(1);
          }
          50% { 
            boxShadow: 0 20px 70px rgba(16, 185, 129, 0.7);
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  )
}
