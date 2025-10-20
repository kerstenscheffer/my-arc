// src/modules/lead-pic-generator/components/EditPanels/BodyEditors/SymptomsBodyEditor.jsx
import React from 'react'
import ListEditor from '../shared/ListEditor'
import { CheckSquare, Square } from 'lucide-react'

export default function SymptomsBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    points: [
      "Altijd moe na training",
      "Geen spiergroei ondanks inzet",
      "Verward door tegenstrijdig advies",
      "Twijfelen aan alles",
      "Gevoel dat iets mist"
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
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <CheckSquare size={20} style={{ color: '#8b5cf6' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#8b5cf6'
        }}>
          SYMPTOMS CHECKLIST
        </span>
      </div>
      
      {/* Symptoms List */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          <Square size={14} />
          Herkenbare Symptomen
        </label>
        <ListEditor
          items={currentContent.points}
          onUpdate={(points) => updateContent({ 
            ...currentContent, 
            points 
          })}
          maxItems={6}
          minItems={3}
          placeholder="Voeg symptoom toe..."
          itemType="text"
          isMobile={isMobile}
        />
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
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
            {currentContent.points.map((symptom, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                background: i % 2 === 0 
                  ? 'rgba(139, 92, 246, 0.05)' 
                  : 'transparent',
                borderRadius: '6px'
              }}>
                {i < 2 ? (
                  <CheckSquare size={18} style={{ 
                    color: '#8b5cf6',
                    flexShrink: 0 
                  }} />
                ) : (
                  <Square size={18} style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    flexShrink: 0 
                  }} />
                )}
                <span style={{
                  color: i < 2 ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  textDecoration: i < 2 ? 'line-through' : 'none',
                  opacity: i < 2 ? 0.7 : 1
                }}>
                  {symptom}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
