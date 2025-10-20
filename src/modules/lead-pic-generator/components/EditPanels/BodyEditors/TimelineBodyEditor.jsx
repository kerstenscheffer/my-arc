// src/modules/lead-pic-generator/components/EditPanels/BodyEditors/TimelineBodyEditor.jsx
import React from 'react'
import { Clock, TrendingUp } from 'lucide-react'

export default function TimelineBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    points: [
      "Jaar 1: Alles door elkaar proberen",
      "Jaar 3: Kleine verbeteringen",
      "Jaar 6: Eindelijk doorbraak",
      "Voor jou: Direct resultaat"
    ],
    ...content
  }
  
  // Ensure we have exactly 4 points
  while (currentContent.points.length < 4) {
    currentContent.points.push("")
  }
  if (currentContent.points.length > 4) {
    currentContent.points = currentContent.points.slice(0, 4)
  }
  
  const updatePoint = (index, value) => {
    const newPoints = [...currentContent.points]
    newPoints[index] = value
    updateContent({ ...currentContent, points: newPoints })
  }
  
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
  const labels = ['Start (Struggle)', 'Middenpunt', 'Doorbraak', 'Jouw Pad (Snel)']
  
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
        <Clock size={20} style={{ color: '#3b82f6' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#3b82f6'
        }}>
          TIMELINE JOURNEY
        </span>
      </div>
      
      {/* Timeline Points */}
      {currentContent.points.map((point, index) => (
        <div key={index}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: colors[index],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              {index + 1}
            </div>
            {labels[index]}
          </label>
          <input
            value={point}
            onChange={(e) => updatePoint(index, e.target.value)}
            placeholder={`Stap ${index + 1} beschrijving...`}
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px' : '12px 15px',
              background: `${colors[index]}10`,
              border: `1px solid ${colors[index]}30`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: index === 3 ? '600' : '500',
              outline: 'none'
            }}
          />
        </div>
      ))}
      
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
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            position: 'relative',
            paddingLeft: '30px'
          }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '10px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: 'linear-gradient(180deg, #ef4444, #f59e0b, #10b981, #3b82f6)'
            }} />
            
            {/* Timeline Points */}
            {currentContent.points.map((point, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: index < 3 ? '25px' : '0',
                position: 'relative'
              }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-25px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: colors[index],
                  border: '3px solid #000',
                  boxShadow: `0 0 20px ${colors[index]}50`,
                  zIndex: 1
                }} />
                
                {/* Content */}
                <div style={{
                  padding: '10px 15px',
                  background: `${colors[index]}10`,
                  border: `1px solid ${colors[index]}30`,
                  borderRadius: '8px',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#fff',
                    fontWeight: index === 3 ? '600' : '500'
                  }}>
                    {point}
                  </div>
                </div>
                
                {/* Special indicator for last item */}
                {index === 3 && (
                  <TrendingUp size={18} style={{ 
                    color: '#3b82f6',
                    flexShrink: 0
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
