import React from 'react'
import { FileText, Type, AlignLeft, CheckCircle } from 'lucide-react'

export default function SimpleStoryBodyEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: "MIJN VERHAAL",
    subtitle: "Hoe ik alles veranderde",
    paragraph: "Dit is mijn verhaal over hoe ik alles veranderde. Het begon met kleine stappen, maar groeide uit tot een complete transformatie van mijn leven. Nu help ik anderen om hetzelfde te bereiken.",
    ctaText: "WEDEROM MEE MET MIJN VERHAAL? DM GRAAG",
    ...content
  }
  
  const updateField = (field, value) => {
    updateContent({ ...currentContent, [field]: value })
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
        <FileText size={20} style={{ color: '#10b981' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#10b981'
        }}>
          SIMPLE STORY
        </span>
      </div>
      
      {/* Title Section */}
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
          <Type size={16} style={{ color: '#10b981' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Titels
          </span>
        </div>
        
        {/* Main Title */}
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
            value={currentContent.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="MIJN VERHAAL"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Subtitle */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Ondertitel
          </label>
          <input
            value={currentContent.subtitle}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Hoe ik alles veranderde"
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* Paragraph Section */}
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
          <AlignLeft size={16} style={{ color: '#3b82f6' }} />
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Verhaal Tekst
          </span>
        </div>
        
        <label style={{
          display: 'block',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Hoofd Alinea
        </label>
        <textarea
          value={currentContent.paragraph}
          onChange={(e) => updateField('paragraph', e.target.value)}
          placeholder="Dit is mijn verhaal over hoe ik alles veranderde. Het begon met kleine stappen, maar groeide uit tot een complete transformatie van mijn leven. Nu help ik anderen om hetzelfde te bereiken."
          rows={isMobile ? 6 : 8}
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500',
            outline: 'none',
            resize: 'vertical',
            lineHeight: '1.5',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        />
        
        {/* Character counter */}
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'right'
        }}>
          {currentContent.paragraph.length} karakters
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
            placeholder="WEDEROM MEE MET MIJN VERHAAL? DM GRAAG"
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
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
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
          Live Preview - Simple Story
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
              fontSize: '18px',
              fontWeight: '900',
              color: '#10b981',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {currentContent.title}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#3b82f6'
            }}>
              {currentContent.subtitle}
            </div>
          </div>
          
          {/* Divider */}
          <div style={{
            width: '100%',
            height: '3px',
            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
            borderRadius: '2px',
            marginBottom: '15px'
          }} />
          
          {/* Paragraph Preview */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            position: 'relative'
          }}>
            {/* Decorative dots */}
            <div style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '12px',
              height: '12px',
              background: '#10b981',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              background: '#3b82f6',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              background: '#8b5cf6',
              borderRadius: '50%'
            }} />
            
            <div style={{
              fontSize: '14px',
              color: '#fff',
              fontWeight: '500',
              lineHeight: '1.4',
              textAlign: 'center'
            }}>
              {currentContent.paragraph}
            </div>
          </div>
          
          {/* CTA Preview */}
          <div style={{
            marginTop: '15px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
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
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#8b5cf6',
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
          • <strong>Titel:</strong> Kort en krachtig, gebruik CAPS voor impact
          <br />
          • <strong>Ondertitel:</strong> Verduidelijking of context van je verhaal
          <br />
          • <strong>Alinea:</strong> Persoonlijk verhaal, emotioneel, relatable
          <br />
          • <strong>Lengte:</strong> Ideaal 150-300 karakters voor beste leesbaarheid
          <br />
          • <strong>CTA:</strong> Directe actie met duidelijke instructie (DM, comment)
          <br />
          • <strong>Toon:</strong> Eerlijk, authentiek, inspirerend maar niet bragging
        </div>
      </div>
    </div>
  )
}
