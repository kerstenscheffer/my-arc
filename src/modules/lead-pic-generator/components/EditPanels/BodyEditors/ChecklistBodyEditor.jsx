// src/modules/lead-pic-generator/components/EditPanels/BodyEditors/ChecklistBodyEditor.jsx
import React from 'react'
import ListEditor from '../shared/ListEditor'
import { CheckCircle, List } from 'lucide-react'

export default function ChecklistBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    points: [
      "Tegenstrijdige info online",
      "Jarenlang verward geweest",
      "Eindelijk de waarheid",
      "Systeem dat echt werkt",
      "Resultaat in 30 dagen"
    ],
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
        <List size={20} style={{ color: '#10b981' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#10b981'
        }}>
          CHECKLIST BODY
        </span>
      </div>
      
      {/* Checklist Points */}
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
          Checklist Punten
        </label>
        <ListEditor
          items={currentContent.points}
          onUpdate={(points) => updateContent({ 
            ...currentContent, 
            points 
          })}
          maxItems={6}
          minItems={3}
          placeholder="Voeg punt toe..."
          itemType="text"
          isMobile={isMobile}
        />
      </div>
      
      {/* Live Preview */}
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
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {currentContent.points.map((point, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle size={18} style={{ 
                  color: '#10b981',
                  flexShrink: 0 
                }} />
                <span style={{
                  color: '#fff',
                  fontSize: '14px'
                }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
