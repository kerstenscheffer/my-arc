// src/modules/content-batches/components/BatchFormatSelector.jsx
// Step 1: Select post format, content type (post/story), and batch settings

import { POST_FORMATS, getItemColor } from '../constants'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function BatchFormatSelector({
  selectedFormat,
  contentType,
  batchName,
  itemCount,
  onFormatSelect,
  onContentTypeChange,
  onBatchNameChange,
  onItemCountChange,
  isMobile = false
}) {
  const formats = Object.values(POST_FORMATS)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Format Grid - ALL formats visible */}
      <div>
        <h3 style={{
          margin: '0 0 1rem',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          Selecteer Post Format
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {formats.map(format => {
            const Icon = format.icon
            const isSelected = selectedFormat?.id === format.id
            const previewColor = getItemColor(format.id, contentType)
            
            return (
              <button
                key={format.id}
                onClick={() => onFormatSelect(format)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: isSelected
                    ? `linear-gradient(135deg, ${previewColor}20 0%, rgba(0,0,0,0.4) 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? `2px solid ${previewColor}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: isMobile ? '120px' : '140px'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && !isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && !isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {/* Icon */}
                <div style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  borderRadius: '12px',
                  background: isSelected
                    ? `${previewColor}30`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isSelected ? previewColor + '60' : 'rgba(255, 255, 255, 0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon 
                    size={isMobile ? 24 : 28} 
                    color={isSelected ? previewColor : 'rgba(255, 255, 255, 0.6)'}
                    strokeWidth={2}
                  />
                </div>

                {/* Label */}
                <div style={{
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '700',
                    color: isSelected ? previewColor : '#fff'
                  }}>
                    {format.label}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    lineHeight: '1.3'
                  }}>
                    {format.estimatedTime}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: previewColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    ✓
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Type Toggle - Only shows when format selected */}
      {selectedFormat && (
        <div>
          <h3 style={{
            margin: '0 0 0.75rem',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            Plaats als Post of Story?
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            maxWidth: '500px'
          }}>
            {/* Post Option */}
            <button
              onClick={() => onContentTypeChange('post')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: contentType === 'post'
                  ? `linear-gradient(135deg, ${selectedFormat.postColor}20 0%, rgba(0,0,0,0.4) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: contentType === 'post'
                  ? `2px solid ${selectedFormat.postColor}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
            >
              <div style={{
                fontSize: '2rem'
              }}>
                📄
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: contentType === 'post' ? selectedFormat.postColor : '#fff',
                  marginBottom: '0.25rem'
                }}>
                  Feed Post
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Kleur: <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: selectedFormat.postColor,
                    marginLeft: '4px',
                    verticalAlign: 'middle'
                  }} />
                </div>
              </div>
            </button>

            {/* Story Option */}
            <button
              onClick={() => onContentTypeChange('story')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: contentType === 'story'
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(0,0,0,0.4) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: contentType === 'story'
                  ? '2px solid #ec4899'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
            >
              <div style={{
                fontSize: '2rem'
              }}>
                📱
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: contentType === 'story' ? '#ec4899' : '#fff',
                  marginBottom: '0.25rem'
                }}>
                  Instagram Story
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  Kleur: <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ec4899',
                    marginLeft: '4px',
                    verticalAlign: 'middle'
                  }} />
                </div>
              </div>
            </button>
          </div>

          {/* Preview */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              fontSize: '1.25rem'
            }}>
              {contentType === 'story' ? '📱' : '📄'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: getItemColor(selectedFormat.id, contentType)
              }}>
                {selectedFormat.label} als {contentType === 'story' ? 'Story' : 'Post'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '0.25rem'
              }}>
                {selectedFormat.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Settings - Only shows when format selected */}
      {selectedFormat && (
        <div>
          <h3 style={{
            margin: '0 0 0.75rem',
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            Batch Instellingen
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem',
            maxWidth: '600px'
          }}>
            {/* Batch Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem'
              }}>
                Batch Naam (optioneel)
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => onBatchNameChange(e.target.value)}
                placeholder={`${selectedFormat.label} Week 1`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Item Count */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem'
              }}>
                Aantal Items
              </label>
              <input
                type="number"
                value={itemCount}
                onChange={(e) => onItemCountChange(Math.max(1, Math.min(30, parseInt(e.target.value) || 7)))}
                min="1"
                max="30"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Format Info */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: `${GOLD.background}`,
            border: `1px solid ${GOLD.border}`,
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5'
          }}>
            <div style={{
              fontWeight: '700',
              color: GOLD.primary,
              marginBottom: '0.5rem'
            }}>
              📊 Geschatte tijd: {selectedFormat.estimatedTime}
            </div>
            <div>
              Voor {itemCount} {contentType === 'story' ? 'stories' : 'posts'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
