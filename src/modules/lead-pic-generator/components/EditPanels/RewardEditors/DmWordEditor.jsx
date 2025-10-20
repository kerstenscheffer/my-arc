// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/DmWordEditor.jsx
import React from 'react'
import ListEditor from '../shared/ListEditor'
import { MessageCircle, CheckCircle, Zap } from 'lucide-react'

export default function DmWordEditor({ content, updateContent, isMobile }) {
  
  // Default content structure
  const currentContent = {
    word: 'LIJST',
    description: 'voor de 5 Fitness Fouten',
    promise: 'Ik stuur binnen 60 sec',
    checks: ['100% Gratis', 'Direct in DM', 'Bewezen Systeem'],
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
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <MessageCircle size={20} style={{ color: '#10b981' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#10b981'
        }}>
          DM WORD TEMPLATE
        </span>
      </div>
      
      {/* Main Word */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <Zap size={14} />
          Hoofdwoord (in box)
        </label>
        <input
          value={currentContent.word}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            word: e.target.value.toUpperCase() 
          })}
          placeholder="LIJST"
          maxLength={15}
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#10b981',
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: '2px',
            outline: 'none',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#10b981'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <div style={{
          textAlign: 'right',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          marginTop: '4px'
        }}>
          {currentContent.word.length}/15 karakters
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Beschrijving (subtitel)
        </label>
        <input
          value={currentContent.description}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            description: e.target.value 
          })}
          placeholder="voor de 5 Fitness Fouten"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
          }}
        />
      </div>
      
      {/* Promise */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Belofte tekst
        </label>
        <input
          value={currentContent.promise}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            promise: e.target.value 
          })}
          placeholder="Ik stuur binnen 60 sec"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
          }}
        />
      </div>
      
      {/* Checklist Items */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          <CheckCircle size={14} />
          Checklist Items
        </label>
        <ListEditor
          items={currentContent.checks}
          onUpdate={(checks) => updateContent({ 
            ...currentContent, 
            checks 
          })}
          maxItems={5}
          minItems={2}
          placeholder="Voeg check toe..."
          itemType="text"
          isMobile={isMobile}
        />
      </div>
      
      {/* Live Preview Box */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.2)'
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
            fontSize: '24px',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '8px'
          }}>
            DM "{currentContent.word}"
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '12px'
          }}>
            {currentContent.description}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignItems: 'flex-start',
            margin: '0 auto',
            maxWidth: '200px'
          }}>
            {currentContent.checks.map((check, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#fff'
              }}>
                <CheckCircle size={12} style={{ color: '#10b981' }} />
                {check}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: '#10b981',
            fontWeight: '600'
          }}>
            {currentContent.promise}
          </div>
        </div>
      </div>
    </div>
  )
}
