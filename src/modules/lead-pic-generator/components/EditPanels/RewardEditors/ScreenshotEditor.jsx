// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/ScreenshotEditor.jsx
import React from 'react'
import { Camera, Gift, ArrowRight } from 'lucide-react'

export default function ScreenshotEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    step1: 'Screenshot dit',
    step2: 'DM me de screenshot',
    step3: 'Krijg exclusive lijst + bonus',
    bonus: 'Eerste 20 krijgen extra voice memo',
    ...content
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(236, 72, 153, 0.2)'
      }}>
        <Camera size={20} style={{ color: '#ec4899' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#ec4899'
        }}>
          SCREENSHOT TEMPLATE
        </span>
      </div>
      
      {/* Steps */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {/* Step 1 */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              1
            </div>
            Stap 1 - Screenshot
          </label>
          <input
            value={currentContent.step1}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              step1: e.target.value 
            })}
            placeholder="Screenshot dit"
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px' : '12px 15px',
              background: 'rgba(236, 72, 153, 0.05)',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Step 2 */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              2
            </div>
            Stap 2 - DM Actie
          </label>
          <input
            value={currentContent.step2}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              step2: e.target.value 
            })}
            placeholder="DM me de screenshot"
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px' : '12px 15px',
              background: 'rgba(168, 85, 247, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Step 3 */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              3
            </div>
            Stap 3 - Beloning
          </label>
          <input
            value={currentContent.step3}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              step3: e.target.value 
            })}
            placeholder="Krijg exclusive lijst + bonus"
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px' : '12px 15px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* Bonus Badge */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <Gift size={14} />
          Bonus Badge Tekst
        </label>
        <input
          value={currentContent.bonus}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            bonus: e.target.value 
          })}
          placeholder="Eerste 20 krijgen extra voice memo"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(249, 115, 22, 0.03))',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            color: '#f59e0b',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(236, 72, 153, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Live Preview
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          position: 'relative'
        }}>
          {/* Bonus Badge */}
          {currentContent.bonus && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '15px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Gift size={12} />
              {currentContent.bonus}
            </div>
          )}
          
          {/* Steps */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            marginTop: '10px'
          }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: 'rgba(236, 72, 153, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(236, 72, 153, 0.2)'
            }}>
              <Camera size={20} style={{ color: '#ec4899' }} />
              <span style={{ 
                color: '#fff', 
                fontSize: '15px',
                fontWeight: '600'
              }}>
                {currentContent.step1}
              </span>
            </div>
            
            <ArrowRight size={20} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
            
            {/* Step 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700'
              }}>
                2
              </div>
              <span style={{ 
                color: '#fff', 
                fontSize: '15px',
                fontWeight: '600'
              }}>
                {currentContent.step2}
              </span>
            </div>
            
            <ArrowRight size={20} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
            
            {/* Step 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}>
              <Gift size={20} style={{ color: '#10b981' }} />
              <span style={{ 
                color: '#10b981', 
                fontSize: '15px',
                fontWeight: '700'
              }}>
                {currentContent.step3}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
