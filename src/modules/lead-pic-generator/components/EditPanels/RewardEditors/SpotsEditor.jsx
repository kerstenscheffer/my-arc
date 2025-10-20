// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/SpotsEditor.jsx
import React from 'react'
import ListEditor from '../shared/ListEditor'
import { Users, TrendingUp, AlertCircle } from 'lucide-react'

export default function SpotsEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: 'Eerste 10 krijgen:',
    benefits: ['Persoonlijke lijst', 'Voice memo uitleg', 'Week check-in'],
    currentSpots: 7,
    totalSpots: 10,
    cta: 'DM "SPOT" nu',
    ...content
  }
  
  // Calculate percentage for progress bar
  const percentage = (currentContent.currentSpots / currentContent.totalSpots) * 100
  const spotsLeft = currentContent.totalSpots - currentContent.currentSpots
  
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
        <Users size={20} style={{ color: '#f59e0b' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#f59e0b'
        }}>
          LIMITED SPOTS TEMPLATE
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
          Titel Aanbieding
        </label>
        <input
          value={currentContent.title}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            title: e.target.value 
          })}
          placeholder="Eerste 10 krijgen:"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Spots Counter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px'
      }}>
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            <TrendingUp size={14} />
            Bezette Spots
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button
              onClick={() => {
                if (currentContent.currentSpots > 0) {
                  updateContent({
                    ...currentContent,
                    currentSpots: currentContent.currentSpots - 1
                  })
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              -
            </button>
            
            <input
              type="number"
              value={currentContent.currentSpots}
              onChange={(e) => {
                const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), currentContent.totalSpots)
                updateContent({
                  ...currentContent,
                  currentSpots: val
                })
              }}
              style={{
                width: '60px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                color: '#f59e0b',
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            
            <button
              onClick={() => {
                if (currentContent.currentSpots < currentContent.totalSpots) {
                  updateContent({
                    ...currentContent,
                    currentSpots: currentContent.currentSpots + 1
                  })
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px'
          }}>
            Totale Spots
          </label>
          <input
            type="number"
            value={currentContent.totalSpots}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1)
              updateContent({
                ...currentContent,
                totalSpots: val,
                currentSpots: Math.min(currentContent.currentSpots, val)
              })
            }}
            min="1"
            max="100"
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* Progress Bar Preview */}
      <div style={{
        padding: '15px',
        background: 'rgba(245, 158, 11, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(245, 158, 11, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Progress Preview
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: spotsLeft <= 3 ? '#ef4444' : '#f59e0b'
          }}>
            {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} over
          </span>
        </div>
        
        <div style={{
          height: '12px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: percentage > 80 
              ? 'linear-gradient(90deg, #ef4444, #f97316)'
              : 'linear-gradient(90deg, #10b981, #3b82f6)',
            transition: 'width 0.3s ease',
            borderRadius: '6px'
          }} />
        </div>
        
        {percentage >= 70 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontSize: '12px',
            color: '#f59e0b'
          }}>
            <AlertCircle size={14} />
            Bijna vol!
          </div>
        )}
      </div>
      
      {/* Benefits */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          Wat Ze Krijgen (Benefits)
        </label>
        <ListEditor
          items={currentContent.benefits}
          onUpdate={(benefits) => updateContent({ 
            ...currentContent, 
            benefits 
          })}
          maxItems={5}
          minItems={2}
          placeholder="Voeg benefit toe..."
          itemType="text"
          isMobile={isMobile}
        />
      </div>
      
      {/* CTA */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Call-to-Action Tekst
        </label>
        <input
          value={currentContent.cta}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            cta: e.target.value 
          })}
          placeholder='DM "SPOT" nu'
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
          textAlign: 'center',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '10px'
          }}>
            {currentContent.title}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignItems: 'flex-start',
            margin: '0 auto 15px',
            maxWidth: '250px'
          }}>
            {currentContent.benefits.map((benefit, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#fff'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#f59e0b'
                }} />
                {benefit}
              </div>
            ))}
          </div>
          
          <div style={{
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '800',
              color: spotsLeft <= 3 ? '#ef4444' : '#f59e0b'
            }}>
              {spotsLeft}/{currentContent.totalSpots}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              SPOTS OVER
            </div>
          </div>
          
          <div style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: '25px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            display: 'inline-block'
          }}>
            {currentContent.cta}
          </div>
        </div>
      </div>
    </div>
  )
}
