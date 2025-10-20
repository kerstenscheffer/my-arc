// src/modules/lead-pic-generator/components/EditPanels/BodyEditors/ProblemSolutionBodyEditor.jsx
import React from 'react'
import { AlertCircle, ArrowDown, Lightbulb } from 'lucide-react'

export default function ProblemSolutionBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    points: [
      "Dit hield mij jaren tegen",
      "7-12kg spiergroei gemist",
      "Mijn simpele oplossing"
    ],
    ...content
  }
  
  // Ensure we have 3 points
  while (currentContent.points.length < 3) {
    currentContent.points.push("")
  }
  
  const updatePoint = (index, value) => {
    const newPoints = [...currentContent.points]
    newPoints[index] = value
    updateContent({ ...currentContent, points: newPoints })
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
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <AlertCircle size={20} style={{ color: '#ef4444' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#ef4444'
        }}>
          PROBLEM → SOLUTION
        </span>
      </div>
      
      {/* Problem */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <AlertCircle size={14} style={{ color: '#ef4444' }} />
          Het Probleem
        </label>
        <input
          value={currentContent.points[0]}
          onChange={(e) => updatePoint(0, e.target.value)}
          placeholder="Dit hield mij jaren tegen"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Result/Impact */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <ArrowDown size={14} style={{ color: '#f59e0b' }} />
          Het Resultaat (impact van probleem)
        </label>
        <input
          value={currentContent.points[1]}
          onChange={(e) => updatePoint(1, e.target.value)}
          placeholder="7-12kg spiergroei gemist"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Solution */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <Lightbulb size={14} style={{ color: '#10b981' }} />
          De Oplossing
        </label>
        <input
          value={currentContent.points[2]}
          onChange={(e) => updatePoint(2, e.target.value)}
          placeholder="Mijn simpele oplossing"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
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
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {/* Problem */}
          <div style={{
            padding: '15px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '15px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#ef4444',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              PROBLEEM
            </div>
            <div style={{
              fontSize: '16px',
              color: '#fff',
              fontWeight: '600'
            }}>
              {currentContent.points[0]}
            </div>
          </div>
          
          <ArrowDown size={24} style={{ 
            color: '#f59e0b',
            margin: '0 auto 15px'
          }} />
          
          {/* Result */}
          <div style={{
            padding: '15px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            marginBottom: '15px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#f59e0b',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              RESULTAAT
            </div>
            <div style={{
              fontSize: '16px',
              color: '#fff',
              fontWeight: '600'
            }}>
              {currentContent.points[1]}
            </div>
          </div>
          
          <ArrowDown size={24} style={{ 
            color: '#10b981',
            margin: '0 auto 15px'
          }} />
          
          {/* Solution */}
          <div style={{
            padding: '15px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#10b981',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              OPLOSSING
            </div>
            <div style={{
              fontSize: '16px',
              color: '#10b981',
              fontWeight: '700'
            }}>
              {currentContent.points[2]}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
