// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/ChoiceEditor.jsx
import React from 'react'
import { CircleDot, Star } from 'lucide-react'

export default function ChoiceEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: 'Welke wil jij?',
    optionA: '5 Fouten Lijst',
    optionB: 'Voeding Calculator',
    optionC: 'Beide (bonus)',
    cta: 'DM je letter',
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
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <CircleDot size={20} style={{ color: '#3b82f6' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#3b82f6'
        }}>
          CHOICE TEMPLATE
        </span>
      </div>
      
      {/* Question Title */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Hoofdvraag
        </label>
        <input
          value={currentContent.title}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            title: e.target.value 
          })}
          placeholder="Welke wil jij?"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Options Grid */}
      <div style={{
        display: 'grid',
        gap: '12px'
      }}>
        {/* Option A */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '800',
            flexShrink: 0
          }}>
            A
          </div>
          <input
            value={currentContent.optionA}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              optionA: e.target.value 
            })}
            placeholder="Optie A tekst..."
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Option B */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '800',
            flexShrink: 0
          }}>
            B
          </div>
          <input
            value={currentContent.optionB}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              optionB: e.target.value 
            })}
            placeholder="Optie B tekst..."
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Option C - Special */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '800',
            flexShrink: 0,
            position: 'relative'
          }}>
            C
            <Star size={12} style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              fill: '#fbbf24'
            }} />
          </div>
          <input
            value={currentContent.optionC}
            onChange={(e) => updateContent({ 
              ...currentContent, 
              optionC: e.target.value 
            })}
            placeholder="Optie C (bonus/special)..."
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* CTA Text */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Call-to-Action
        </label>
        <input
          value={currentContent.cta}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            cta: e.target.value 
          })}
          placeholder="DM je letter"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#10b981',
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
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
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
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '15px'
          }}>
            {currentContent.title}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '250px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#10b981', fontWeight: '800' }}>A:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>{currentContent.optionA}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#3b82f6', fontWeight: '800' }}>B:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>{currentContent.optionB}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>C:</span>
              <span style={{ color: '#fff', fontSize: '14px' }}>{currentContent.optionC} ⭐</span>
            </div>
          </div>
          
          <div style={{
            marginTop: '15px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            borderRadius: '25px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            display: 'inline-block'
          }}>
            {currentContent.cta}
          </div>
        </div>
      </div>
    </div>
  )
}
