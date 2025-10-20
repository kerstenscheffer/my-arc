// src/modules/lead-pic-generator/components/QuickControls.jsx
import React from 'react'
import { Plus, Minus, Type, Sun, Move, Palette, AlignLeft, Maximize } from 'lucide-react'

export default function QuickControls({ settings, onUpdateSettings, isMobile, currentSlide = 0 }) {
  
  const handleFontSizeChange = (delta) => {
    const newSize = Math.max(60, Math.min(160, settings.fontSize + delta))
    onUpdateSettings({ ...settings, fontSize: newSize })
  }

  const handleBodyFontSizeChange = (delta) => {
    const newSize = Math.max(32, Math.min(52, (settings.bodyFontSize || 42) + delta))
    onUpdateSettings({ ...settings, bodyFontSize: newSize })
  }

  const handleRewardCTASizeChange = (delta) => {
    const newSize = Math.max(72, Math.min(108, (settings.rewardCTASize || 88) + delta))
    onUpdateSettings({ ...settings, rewardCTASize: newSize })
  }
  
  const handleOverlayChange = (value) => {
    onUpdateSettings({ ...settings, overlayDarkness: parseInt(value) })
  }
  
  const positions = [
    { id: 'top', label: 'Boven' },
    { id: 'center', label: 'Midden' },
    { id: 'bottom', label: 'Onder' }
  ]

  const spacingOptions = [
    { id: 'compact', label: 'Compact' },
    { id: 'normal', label: 'Normal' },
    { id: 'spacious', label: 'Ruim' }
  ]

  const buttonSizes = [
    { id: 'small', label: 'Klein' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Groot' }
  ]
  
  // Get slide name for title
  const slideNames = ['Hook', 'Body', 'Reward']
  const currentSlideName = slideNames[currentSlide] || 'Hook'

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      border: '2px solid transparent',
      backgroundImage: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
        linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)
      `,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.2rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Palette size={20} color="#10b981" />
        Quick Controls - {currentSlideName}
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        
        {/* SLIDE 1 - HOOK CONTROLS */}
        {currentSlide === 0 && (
          <>
            {/* Font Size Control */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Type size={16} />
                Tekst Grootte
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => handleFontSizeChange(-10)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Minus size={18} />
                </button>
                
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#10b981',
                  minWidth: '60px'
                }}>
                  {settings.fontSize}px
                </div>
                
                <button
                  onClick={() => handleFontSizeChange(10)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Text Position - Only for Hook */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Move size={16} />
                Tekst Positie
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {positions.map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => onUpdateSettings({ ...settings, textPosition: pos.id })}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: settings.textPosition === pos.id
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: settings.textPosition === pos.id
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: settings.textPosition === pos.id
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subheader Toggle - Only for Hook */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                Subheader
              </label>
              <button
                onClick={() => onUpdateSettings({ 
                  ...settings, 
                  hasSubheader: !settings.hasSubheader 
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: settings.hasSubheader
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: settings.hasSubheader
                    ? '1px solid #10b981'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: settings.hasSubheader ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} />
                {settings.hasSubheader ? 'Subheader Aan' : 'Voeg Subheader Toe'}
              </button>
            </div>
          </>
        )}

        {/* SLIDE 2 - BODY CONTROLS */}
        {currentSlide === 1 && (
          <>
            {/* Points Font Size */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Type size={16} />
                Points Grootte
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => handleBodyFontSizeChange(-2)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Minus size={18} />
                </button>
                
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#10b981',
                  minWidth: '60px'
                }}>
                  {settings.bodyFontSize || 42}px
                </div>
                
                <button
                  onClick={() => handleBodyFontSizeChange(2)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Points Spacing */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <AlignLeft size={16} />
                Points Spacing
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {spacingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => onUpdateSettings({ ...settings, bodySpacing: option.id })}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: (settings.bodySpacing || 'normal') === option.id
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: (settings.bodySpacing || 'normal') === option.id
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: (settings.bodySpacing || 'normal') === option.id
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

{/* SLIDE 3 - REWARD CONTROLS */}
        {currentSlide === 2 && (
          <>
            {/* CTA Size */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Type size={16} />
                CTA Grootte
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={() => handleRewardCTASizeChange(-4)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Minus size={18} />
                </button>
                
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#10b981',
                  minWidth: '60px'
                }}>
                  {settings.rewardCTASize || 88}px
                </div>
                
                <button
                  onClick={() => handleRewardCTASizeChange(4)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    e.currentTarget.style.borderColor = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Button Size */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Maximize size={16} />
                Button Grootte
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                {buttonSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => onUpdateSettings({ ...settings, rewardButtonSize: size.id })}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: (settings.rewardButtonSize || 'medium') === size.id
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: (settings.rewardButtonSize || 'medium') === size.id
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: (settings.rewardButtonSize || 'medium') === size.id
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Button Text - NEW DROPDOWN */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                <Type size={16} />
                Button Tekst
              </label>
              <select
                value={settings.rewardButtonText || 'Start Nu'}
                onChange={(e) => onUpdateSettings({ ...settings, rewardButtonText: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <option value="Start Nu">Start Nu</option>
                <option value="Claim Nu">Claim Nu</option>
                <option value="Pak Aan">Pak Aan</option>
                <option value="Begin Direct">Begin Direct</option>
                <option value="Klik Hier">Klik Hier</option>
                <option value="Doe Mee">Doe Mee</option>
                <option value="Download">Download</option>
                <option value="Krijg Toegang">Krijg Toegang</option>
                <option value="Ja, Ik Wil">Ja, Ik Wil</option>
              </select>
            </div>
          </>
        )}        
        {/* Overlay Darkness - ALWAYS VISIBLE */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.75rem'
          }}>
            <Sun size={16} />
            Overlay: {settings.overlayDarkness}%
          </label>
          <input
            type="range"
            min="0"
            max="80"
            step="10"
            value={settings.overlayDarkness}
            onChange={(e) => handleOverlayChange(e.target.value)}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, 
                #10b981 0%, 
                #10b981 ${settings.overlayDarkness}%, 
                rgba(255, 255, 255, 0.1) ${settings.overlayDarkness}%, 
                rgba(255, 255, 255, 0.1) 100%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
        </div>
        
      </div>
    </div>
  )
}
