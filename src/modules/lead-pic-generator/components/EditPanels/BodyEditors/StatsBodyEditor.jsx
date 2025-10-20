// src/modules/lead-pic-generator/components/EditPanels/BodyEditors/StatsBodyEditor.jsx
import React from 'react'
import { BarChart, TrendingUp, Percent } from 'lucide-react'

export default function StatsBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    points: [
      "92% faalt zonder systeem",
      "4x sneller resultaat",
      "€847 bespaard per jaar",
      "10kg in 90 dagen",
      "+37% kracht toename"
    ],
    ...content
  }
  
  // Ensure we have exactly 5 points
  while (currentContent.points.length < 5) {
    currentContent.points.push("")
  }
  if (currentContent.points.length > 5) {
    currentContent.points = currentContent.points.slice(0, 5)
  }
  
  const updatePoint = (index, value) => {
    const newPoints = [...currentContent.points]
    newPoints[index] = value
    updateContent({ ...currentContent, points: newPoints })
  }
  
  const icons = [Percent, TrendingUp, '€', '⚖️', '💪']
  const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
  const labels = ['Fail Rate', 'Snelheid', 'Besparing', 'Resultaat', 'Performance']
  
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
        borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
      }}>
        <BarChart size={20} style={{ color: '#f59e0b' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#f59e0b'
        }}>
          STATISTICS BODY
        </span>
      </div>
      
      {/* Stats Points */}
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
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: `${colors[index]}20`,
              border: `1px solid ${colors[index]}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors[index],
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {typeof icons[index] === 'string' ? icons[index] : React.createElement(icons[index], { size: 12 })}
            </div>
            {labels[index]}
          </label>
          <input
            value={point}
            onChange={(e) => updatePoint(index, e.target.value)}
            placeholder={`Statistiek ${index + 1}...`}
            style={{
              width: '100%',
              padding: isMobile ? '10px 12px' : '12px 15px',
              background: `${colors[index]}08`,
              border: `1px solid ${colors[index]}20`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
      ))}
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(245, 158, 11, 0.2)'
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
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {currentContent.points.map((stat, index) => {
              // Extract number from stat if possible
              const number = stat.match(/\d+/)?.[0] || '?'
              const isLarge = index === 0 || index === 3
              
              return (
                <div key={index} style={{
                  gridColumn: isLarge && !isMobile ? 'span 2' : 'span 1',
                  padding: '15px',
                  background: `linear-gradient(135deg, ${colors[index]}15, ${colors[index]}05)`,
                  borderRadius: '10px',
                  border: `1px solid ${colors[index]}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Icon */}
                  <div style={{
                    width: isLarge ? '48px' : '40px',
                    height: isLarge ? '48px' : '40px',
                    borderRadius: '10px',
                    background: `${colors[index]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{
                      color: colors[index],
                      fontSize: isLarge ? '24px' : '20px',
                      fontWeight: '700'
                    }}>
                      {typeof icons[index] === 'string' ? icons[index] : React.createElement(icons[index], { size: isLarge ? 24 : 20 })}
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isLarge ? '18px' : '16px',
                      color: '#fff',
                      fontWeight: '700',
                      lineHeight: '1.2'
                    }}>
                      {stat}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
