// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/QuizEditor.jsx
import React from 'react'
import ColorPicker from '../shared/ColorPicker'
import { HelpCircle, Plus, X } from 'lucide-react'

export default function QuizEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: 'Ontdek jouw type:',
    subtitle: 'Comment je grootste struggle:',
    options: [
      { number: '1', text: 'Consistentie', color: '#10b981' },
      { number: '2', text: 'Voeding', color: '#f59e0b' },
      { number: '3', text: 'Kennis', color: '#3b82f6' }
    ],
    promise: 'Ik stuur gepersonaliseerd plan',
    ...content
  }
  
  const updateOption = (index, field, value) => {
    const updated = [...currentContent.options]
    updated[index] = { ...updated[index], [field]: value }
    updateContent({ ...currentContent, options: updated })
  }
  
  const addOption = () => {
    if (currentContent.options.length >= 5) return
    const newNumber = (currentContent.options.length + 1).toString()
    updateContent({ 
      ...currentContent,
      options: [...currentContent.options, { 
        number: newNumber, 
        text: '', 
        color: '#8b5cf6' 
      }]
    })
  }
  
  const removeOption = (index) => {
    if (currentContent.options.length <= 2) return
    updateContent({ 
      ...currentContent,
      options: currentContent.options.filter((_, i) => i !== index) 
    })
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
        <HelpCircle size={20} style={{ color: '#8b5cf6' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#8b5cf6'
        }}>
          QUIZ TEMPLATE
        </span>
      </div>
      
      {/* Title */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Quiz Titel
        </label>
        <input
          value={currentContent.title}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            title: e.target.value 
          })}
          placeholder="Ontdek jouw type:"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Subtitle/Instruction */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Instructie
        </label>
        <input
          value={currentContent.subtitle}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            subtitle: e.target.value 
          })}
          placeholder="Comment je grootste struggle:"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Quiz Options */}
      <div>
        <label style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          <span>Quiz Opties</span>
          <span style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            {currentContent.options.length}/5 opties
          </span>
        </label>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {currentContent.options.map((option, index) => (
            <div key={index} style={{
              padding: '15px',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '10px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '60px 1fr 120px auto',
                gap: '10px',
                alignItems: 'center'
              }}>
                <input
                  value={option.number}
                  onChange={(e) => updateOption(index, 'number', e.target.value)}
                  placeholder="#"
                  style={{
                    width: isMobile ? '100%' : '60px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '6px',
                    color: '#8b5cf6',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                
                <input
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  placeholder="Optie tekst..."
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: option.color,
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }} />
                  <ColorPicker
                    value={option.color}
                    onChange={(color) => updateOption(index, 'color', color)}
                    isMobile={isMobile}
                  />
                </div>
                
                {currentContent.options.length > 2 && (
                  <button 
                    onClick={() => removeOption(index)}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <X size={16} style={{ color: '#ef4444' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {currentContent.options.length < 5 && (
            <button 
              onClick={addOption}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                color: '#8b5cf6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} />
              Voeg optie toe
            </button>
          )}
        </div>
      </div>
      
      {/* Promise */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Belofte
        </label>
        <input
          value={currentContent.promise}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            promise: e.target.value 
          })}
          placeholder="Ik stuur gepersonaliseerd plan"
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
          textAlign: 'center',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '6px'
          }}>
            {currentContent.title}
          </div>
          
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '15px'
          }}>
            {currentContent.subtitle}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '250px',
            margin: '0 auto'
          }}>
            {currentContent.options.map((option, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                background: `${option.color}15`,
                borderRadius: '8px',
                border: `1px solid ${option.color}40`
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: option.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700'
                }}>
                  {option.number}
                </div>
                <span style={{ 
                  color: '#fff', 
                  fontSize: '14px',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {option.text || '...'}
                </span>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '15px',
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
