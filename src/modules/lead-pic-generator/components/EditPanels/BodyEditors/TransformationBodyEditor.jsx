import React from 'react'
import { TrendingDown, AlertTriangle, CheckCircle, TrendingUp, Type } from 'lucide-react'

export default function TransformationBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    headerTitle: "VAN 7KG SPIERGROEI GEMIST",
    subTitle: "NAAR CONSISTENTE GAINS",
    ctaText: "MIJN COMPLETE FOUTLIJST KRIJGEN",
    points: [
      "7kg spiergroei gemist door te weinig eten",
      "Lichaam in katabole staat = afbraak",
      "Eenvoudige calorie fix = game changer", 
      "Nu consistente gains elke maand"
    ],
    ...content
  }
  
  // Ensure we have 4 points for the transformation story
  while (currentContent.points.length < 4) {
    currentContent.points.push("")
  }
  
  const updateField = (field, value) => {
    updateContent({ ...currentContent, [field]: value })
  }
  
  const updatePoint = (index, value) => {
    const newPoints = [...currentContent.points]
    newPoints[index] = value
    updateContent({ ...currentContent, points: newPoints })
  }
  
  const storySteps = [
    {
      index: 0,
      label: "Het Probleem",
      icon: TrendingDown,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.05)",
      borderColor: "rgba(239, 68, 68, 0.2)",
      placeholder: "7kg spiergroei gemist door te weinig eten"
    },
    {
      index: 1,
      label: "De Oorzaak",
      icon: AlertTriangle,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.05)",
      borderColor: "rgba(245, 158, 11, 0.2)",
      placeholder: "Lichaam in katabole staat = afbraak"
    },
    {
      index: 2,
      label: "De Oplossing",
      icon: CheckCircle,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.05)",
      borderColor: "rgba(16, 185, 129, 0.2)",
      placeholder: "Eenvoudige calorie fix = game changer"
    },
    {
      index: 3,
      label: "Het Resultaat",
      icon: TrendingUp,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.08)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      placeholder: "Nu consistente gains elke maand"
    }
  ]
  
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
        <TrendingUp size={20} style={{ color: '#10b981' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#10b981'
        }}>
          TRANSFORMATION STORY
        </span>
      </div>
      
      {/* Title Controls */}
      <div style={{
        padding: '15px',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '15px'
        }}>
          <Type size={16} style={{ color: '#3b82f6' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Template Titels
          </span>
        </div>
        
        {/* Header Title */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Hoofd Titel
          </label>
          <input
            value={currentContent.headerTitle}
            onChange={(e) => updateField('headerTitle', e.target.value)}
            placeholder="VAN 7KG SPIERGROEI GEMIST"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Sub Title */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Sub Titel
          </label>
          <input
            value={currentContent.subTitle}
            onChange={(e) => updateField('subTitle', e.target.value)}
            placeholder="NAAR CONSISTENTE GAINS"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* CTA Section */}
      <div style={{
        padding: '15px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '15px'
        }}>
          <CheckCircle size={16} style={{ color: '#8b5cf6' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Call To Action
          </span>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            CTA Tekst
          </label>
          <input
            value={currentContent.ctaText}
            onChange={(e) => updateField('ctaText', e.target.value)}
            placeholder="MIJN COMPLETE FOUTLIJST KRIJGEN"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* Story Steps */}
      {storySteps.map((step) => {
        const IconComponent = step.icon
        const isResult = step.index === 3
        
        return (
          <div key={step.index}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '8px'
            }}>
              <IconComponent size={14} style={{ color: step.color }} />
              {step.label} {isResult && "(Extra nadruk)"}
            </label>
            <input
              value={currentContent.points[step.index]}
              onChange={(e) => updatePoint(step.index, e.target.value)}
              placeholder={step.placeholder}
              style={{
                width: '100%',
                padding: isMobile ? '12px' : '15px',
                background: step.bgColor,
                border: `1px solid ${step.borderColor}`,
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: isResult ? '700' : '600',
                outline: 'none',
                transform: isResult ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isResult ? `0 4px 15px ${step.color}20` : 'none'
              }}
            />
          </div>
        )
      })}
      
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
          marginBottom: '15px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Live Preview - Complete Template
        </div>
        
        <div style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          {/* Title Preview */}
          <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '4px'
            }}>
              {currentContent.headerTitle}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              {currentContent.subTitle}
            </div>
          </div>
          
          {/* Steps Preview */}
          {storySteps.map((step, index) => {
            const IconComponent = step.icon
            const isResult = index === 3
            
            return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isResult ? '15px' : '12px',
                marginBottom: '8px',
                background: step.bgColor,
                borderRadius: '8px',
                border: `1px solid ${step.borderColor}`,
                transform: isResult ? 'scale(1.02)' : 'scale(1)',
                position: 'relative'
              }}>
                <IconComponent 
                  size={isResult ? 22 : 18} 
                  style={{ 
                    color: step.color,
                    flexShrink: 0
                  }} 
                />
                <div style={{
                  fontSize: isResult ? '14px' : '13px',
                  color: '#fff',
                  fontWeight: isResult ? '700' : '600',
                  flex: 1
                }}>
                  {currentContent.points[index] || step.placeholder}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '8px',
                  background: step.color,
                  color: index < 2 ? '#fff' : '#000',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {step.label.split(' ')[1]}
                </div>
              </div>
            )
          })}
          
          {/* CTA Preview */}
          <div style={{
            marginTop: '15px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#10b981',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {currentContent.ctaText}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tips */}
      <div style={{
        padding: '15px',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#3b82f6',
          fontWeight: '600',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Template Tips
        </div>
        <div style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.4'
        }}>
          • <strong>Titels:</strong> Gebruik CAPS voor impact, korte zinnen
          <br />
          • <strong>Probleem:</strong> Specifiek verlies/gemiste kans (getallen!)
          <br />
          • <strong>Oorzaak:</strong> Waarom het probleem ontstond
          <br />
          • <strong>Oplossing:</strong> Wat je veranderde (eenvoudig houden)
          <br />
          • <strong>Resultaat:</strong> Huidige situatie (positief, concreet)
        </div>
      </div>
    </div>
  )
}
