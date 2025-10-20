import React from 'react'
import { Battery, BatteryLow, Type, Zap } from 'lucide-react'

export default function EnergyLevelsBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    headerTitle: "ALTIJD MOE, FUTLOOS, BRAIN FOG",
    subTitle: "5 Voeding Trucs die Alles Veranderen",
    ctaText: "ENERGY LIJST IN DM",
    beforeItems: [
      "3pm crash op de bank",
      "Brain fog hele dag",
      "Futloos na lunch",
      "Moe bij het wakker worden"
    ],
    afterItems: [
      "Stabiele energie hele dag",
      "Scherpe focus tot 's avonds", 
      "Vol energie na maaltijden",
      "Wakker worden vol energie"
    ],
    ...content
  }
  
  // Ensure we have 4 items for each section
  while (currentContent.beforeItems.length < 4) {
    currentContent.beforeItems.push("")
  }
  while (currentContent.afterItems.length < 4) {
    currentContent.afterItems.push("")
  }
  
  const updateField = (field, value) => {
    updateContent({ ...currentContent, [field]: value })
  }
  
  const updateBeforeItem = (index, value) => {
    const newItems = [...currentContent.beforeItems]
    newItems[index] = value
    updateContent({ ...currentContent, beforeItems: newItems })
  }

  const updateAfterItem = (index, value) => {
    const newItems = [...currentContent.afterItems]
    newItems[index] = value
    updateContent({ ...currentContent, afterItems: newItems })
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
        <Zap size={20} style={{ color: '#10b981' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#10b981'
        }}>
          ENERGY LEVELS
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
            Probleem Titel
          </label>
          <input
            value={currentContent.headerTitle}
            onChange={(e) => updateField('headerTitle', e.target.value)}
            placeholder="ALTIJD MOE, FUTLOOS, BRAIN FOG"
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
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Oplossing Titel
          </label>
          <input
            value={currentContent.subTitle}
            onChange={(e) => updateField('subTitle', e.target.value)}
            placeholder="5 Voeding Trucs die Alles Veranderen"
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

        {/* CTA Text */}
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
            placeholder="ENERGY LIJST IN DM"
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
      
      {/* Before/After Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '20px'
      }}>
        {/* BEFORE Section */}
        <div style={{
          padding: '15px',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '15px'
          }}>
            <BatteryLow size={16} style={{ color: '#ef4444' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Voorheen (Low Energy)
            </span>
          </div>
          
          {currentContent.beforeItems.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px'
              }}>
                Probleem {index + 1}
              </label>
              <input
                value={item}
                onChange={(e) => updateBeforeItem(index, e.target.value)}
                placeholder={`Energie probleem ${index + 1}`}
                style={{
                  width: '100%',
                  padding: isMobile ? '8px' : '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '500',
                  outline: 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* AFTER Section */}
        <div style={{
          padding: '15px',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '15px'
          }}>
            <Battery size={16} style={{ color: '#10b981' }} />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Nu (High Energy)
            </span>
          </div>
          
          {currentContent.afterItems.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px'
              }}>
                Voordeel {index + 1}
              </label>
              <input
                value={item}
                onChange={(e) => updateAfterItem(index, e.target.value)}
                placeholder={`Energie voordeel ${index + 1}`}
                style={{
                  width: '100%',
                  padding: isMobile ? '8px' : '10px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '500',
                  outline: 'none'
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
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
          Live Preview - Energy Levels Template
        </div>
        
        <div style={{
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          {/* Title Preview */}
          <div style={{
            textAlign: 'center',
            marginBottom: '15px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '800',
              color: '#ef4444',
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
          
          {/* Before/After Preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '15px'
          }}>
            {/* Before Preview */}
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#ef4444',
                fontWeight: '700',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                VOORHEEN
              </div>
              {currentContent.beforeItems.slice(0, 2).map((item, index) => (
                <div key={index} style={{
                  fontSize: '10px',
                  color: '#fff',
                  marginBottom: '4px',
                  opacity: item ? 1 : 0.3
                }}>
                  • {item || `Probleem ${index + 1}`}
                </div>
              ))}
            </div>

            {/* After Preview */}
            <div style={{
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#10b981',
                fontWeight: '700',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                NU
              </div>
              {currentContent.afterItems.slice(0, 2).map((item, index) => (
                <div key={index} style={{
                  fontSize: '10px',
                  color: '#fff',
                  marginBottom: '4px',
                  opacity: item ? 1 : 0.3
                }}>
                  ⚡ {item || `Voordeel ${index + 1}`}
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA Preview */}
          <div style={{
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
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
        background: 'rgba(245, 158, 11, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(245, 158, 11, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#f59e0b',
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
          • <strong>Probleem titel:</strong> Gebruik herkenbare symptomen (moe, futloos, brain fog)
          <br />
          • <strong>Voorheen:</strong> Specifieke tijden/momenten (3pm crash, na lunch)
          <br />
          • <strong>Nu:</strong> Positieve tegenhangers (stabiel vs crash, scherp vs fog)
          <br />
          • <strong>CTA:</strong> Direct voordeel vermelden (energy lijst, voeding tips)
        </div>
      </div>
    </div>
  )
}
