// src/modules/lead-pic-generator/components/SlideHook.jsx
import React from 'react'
import { ChevronRight, Edit3 } from 'lucide-react'

export default function SlideHook({ backgroundImage, hookText, onChange }) {
  
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
      
      {/* Gradient Overlay voor betere leesbaarheid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1080px',
        height: '1350px',
        background: `linear-gradient(
          180deg,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(0, 0, 0, 0.4) 50%,
          rgba(0, 0, 0, 0.6) 100%
        )`
      }} />
      
      {/* Vignette Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1080px',
        height: '1350px',
        background: `radial-gradient(
          circle at center,
          transparent 30%,
          rgba(0, 0, 0, 0.4) 100%
        )`
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
        alignItems: 'center',
        padding: '120px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* MY ARC Logo - Met GROEN-BLAUW gradient uit icon maker */}
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '48px',
          fontWeight: '900',
          letterSpacing: '4px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
        }}>
          MY ARC
        </div>
        
        {/* Hook Text - MASSIVE met outline */}
        <h1 style={{
          fontSize: '120px',
          fontWeight: '900',
          lineHeight: '0.95',
          color: '#fff',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '-3px',
          whiteSpace: 'pre-line',
          textShadow: `
            3px 3px 0 #000,
            -3px 3px 0 #000,
            -3px -3px 0 #000,
            3px -3px 0 #000,
            4px 4px 0 #000,
            5px 5px 0 #000,
            6px 6px 12px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(16, 185, 129, 0.3)
          `,
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill'
        }}>
          {hookText}
        </h1>
        
        {/* Gradient Accent Line */}
        <div style={{
          position: 'absolute',
          bottom: '200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '4px',
          background: 'linear-gradient(90deg, transparent 0%, #10b981 25%, #3b82f6 75%, transparent 100%)',
          opacity: 0.8
        }} />
        
        {/* Swipe Indicator met GROEN-BLAUW gradient */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px',
          fontWeight: '700',
          animation: 'pulse 2s infinite'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Swipe
          </span>
          <ChevronRight size={36} style={{ stroke: '#10b981' }} />
        </div>
        
        {/* Slide Indicators - Met GROEN-BLAUW gradient */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '80px',
          display: 'flex',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            borderRadius: '3px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }} />
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
        </div>
      </div>
      
      {/* Edit Mode - PREMIUM GLASSMORPHISM */}
      {onChange && (
        <div style={{
          position: 'absolute',
          bottom: '240px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '30px',
          borderRadius: '20px',
          border: '2px solid transparent',
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
            linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)
          `,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `
            0 0 40px rgba(16, 185, 129, 0.2),
            inset 0 0 20px rgba(16, 185, 129, 0.05),
            0 20px 40px rgba(0, 0, 0, 0.3)
          `
        }}>
          {/* Edit Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}>
            <Edit3 size={20} style={{ stroke: '#10b981' }} />
            <span style={{
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '1px',
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              EDIT MODE
            </span>
          </div>
          
          <textarea
            value={hookText}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '24px',
              fontWeight: '600',
              lineHeight: '1.6',
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            placeholder="Schrijf je hook tekst..."
            rows={3}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(16, 185, 129, 0.2)'
              e.target.style.background = 'rgba(255, 255, 255, 0.03)'
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: translateX(0); 
          }
          50% { 
            opacity: 0.7; 
            transform: translateX(8px); 
          }
        }
      `}</style>
    </div>
  )
}
