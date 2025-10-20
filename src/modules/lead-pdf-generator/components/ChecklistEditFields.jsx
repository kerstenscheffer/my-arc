import React, { useState, useEffect } from 'react'

export default function ChecklistEditFields({ 
  content, 
  onChange, 
  checklistIndex,
  isMobile 
}) {
  const [localContent, setLocalContent] = useState(content)
  
  // Update parent with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localContent)
    }, 300)
    return () => clearTimeout(timer)
  }, [localContent])
  
  // Title change
  const handleTitleChange = (value) => {
    setLocalContent({
      ...localContent,
      title: value
    })
  }
  
  // Checks array management
  const addCheck = () => {
    setLocalContent({
      ...localContent,
      checks: [...(localContent.checks || []), '']
    })
  }
  
  const removeCheck = (index) => {
    setLocalContent({
      ...localContent,
      checks: localContent.checks.filter((_, i) => i !== index)
    })
  }
  
  const updateCheck = (index, value) => {
    const newChecks = [...(localContent.checks || [])]
    newChecks[index] = value
    setLocalContent({
      ...localContent,
      checks: newChecks
    })
  }
  
  // Red flags management
  const addRedFlag = () => {
    setLocalContent({
      ...localContent,
      redFlags: [...(localContent.redFlags || []), '']
    })
  }
  
  const removeRedFlag = (index) => {
    setLocalContent({
      ...localContent,
      redFlags: localContent.redFlags.filter((_, i) => i !== index)
    })
  }
  
  const updateRedFlag = (index, value) => {
    const newFlags = [...(localContent.redFlags || [])]
    newFlags[index] = value
    setLocalContent({
      ...localContent,
      redFlags: newFlags
    })
  }
  
  // Green flags management
  const addGreenFlag = () => {
    setLocalContent({
      ...localContent,
      greenFlags: [...(localContent.greenFlags || []), '']
    })
  }
  
  const removeGreenFlag = (index) => {
    setLocalContent({
      ...localContent,
      greenFlags: localContent.greenFlags.filter((_, i) => i !== index)
    })
  }
  
  const updateGreenFlag = (index, value) => {
    const newFlags = [...(localContent.greenFlags || [])]
    newFlags[index] = value
    setLocalContent({
      ...localContent,
      greenFlags: newFlags
    })
  }
  
  return (
    <div style={{ width: '100%' }}>
      {/* Checklist Number Display */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900'
        }}>
          🚨 CHECKLIST
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '0.5rem'
        }}>
          Checklist {checklistIndex} van 5
        </div>
      </div>
      
      {/* Title Field */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#f97316',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Checklist Titel
        </label>
        <input
          type="text"
          value={localContent.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="IS DEZE OEFENING GOED?"
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)'
            e.target.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(249, 115, 22, 0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>
      
      {/* Check Items Section */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <span>✓ Check Items</span>
          <span style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '400'
          }}>
            ({(localContent.checks || []).length} items)
          </span>
        </label>
        
        {(localContent.checks || []).map((check, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.9rem',
              padding: '0.5rem 0',
              width: '20px'
            }}>
              {index + 1}.
            </span>
            <input
              type="text"
              value={check}
              onChange={(e) => updateCheck(index, e.target.value)}
              placeholder={`Check item ${index + 1}`}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(16, 185, 129, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                e.target.style.background = 'rgba(16, 185, 129, 0.05)'
              }}
            />
            <button
              onClick={() => removeCheck(index)}
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          onClick={addCheck}
          style={{
            width: '100%',
            padding: isMobile ? '0.625rem' : '0.75rem',
            marginTop: '0.5rem',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '2px dashed rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
          }}
        >
          + Check toevoegen
        </button>
      </div>
      
      {/* Red Flags Section */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#ef4444',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <span>❌ Red Flags</span>
          <span style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '400'
          }}>
            ({(localContent.redFlags || []).length} items)
          </span>
        </label>
        
        {(localContent.redFlags || []).map((flag, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              color: '#ef4444',
              fontSize: '0.9rem',
              padding: '0.5rem 0',
              width: '20px'
            }}>
              •
            </span>
            <input
              type="text"
              value={flag}
              onChange={(e) => updateRedFlag(index, e.target.value)}
              placeholder={`Red flag ${index + 1}`}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                e.target.style.background = 'rgba(239, 68, 68, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                e.target.style.background = 'rgba(239, 68, 68, 0.05)'
              }}
            />
            <button
              onClick={() => removeRedFlag(index)}
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          onClick={addRedFlag}
          style={{
            width: '100%',
            padding: isMobile ? '0.625rem' : '0.75rem',
            marginTop: '0.5rem',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '2px dashed rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
        >
          + Red flag toevoegen
        </button>
      </div>
      
      {/* Green Flags Section */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <span>✅ Green Flags</span>
          <span style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '400'
          }}>
            ({(localContent.greenFlags || []).length} items)
          </span>
        </label>
        
        {(localContent.greenFlags || []).map((flag, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              color: '#10b981',
              fontSize: '0.9rem',
              padding: '0.5rem 0',
              width: '20px'
            }}>
              •
            </span>
            <input
              type="text"
              value={flag}
              onChange={(e) => updateGreenFlag(index, e.target.value)}
              placeholder={`Green flag ${index + 1}`}
              style={{
                flex: 1,
                padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(16, 185, 129, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                e.target.style.background = 'rgba(16, 185, 129, 0.05)'
              }}
            />
            <button
              onClick={() => removeGreenFlag(index)}
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          onClick={addGreenFlag}
          style={{
            width: '100%',
            padding: isMobile ? '0.625rem' : '0.75rem',
            marginTop: '0.5rem',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '2px dashed rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
          }}
        >
          + Green flag toevoegen
        </button>
      </div>
      
      {/* Summary Stats */}
      <div style={{
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {(localContent.checks || []).length}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.25rem'
          }}>
            Checks
          </div>
        </div>
        <div>
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700',
            color: '#ef4444'
          }}>
            {(localContent.redFlags || []).length}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.25rem'
          }}>
            Red Flags
          </div>
        </div>
        <div>
          <div style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            {(localContent.greenFlags || []).length}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.25rem'
          }}>
            Green Flags
          </div>
        </div>
      </div>
    </div>
  )
}
