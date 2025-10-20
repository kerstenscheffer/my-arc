import React, { useState, useEffect } from 'react'

export default function TruthEditFields({ 
  content, 
  onChange, 
  truthIndex,
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
  
  const handleFieldChange = (field, value) => {
    setLocalContent({
      ...localContent,
      [field]: value
    })
  }
  
  return (
    <div style={{ width: '100%' }}>
      {/* Truth Number Display */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {localContent.number}
        </div>
        <div style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '0.5rem'
        }}>
          Truth {truthIndex + 1} van 5
        </div>
      </div>
      
      {/* Title Field */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Hoofdtitel
        </label>
        <input
          type="text"
          value={localContent.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="SPIEREN GROEIEN DOOR STIMULUS"
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)'
            e.target.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginTop: '0.25rem',
          textAlign: 'right'
        }}>
          {(localContent.title || '').length} karakters
        </div>
      </div>
      
      {/* Explanation Field */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Uitleg
        </label>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginBottom: '0.5rem'
        }}>
          Gebruik dubbele enters voor nieuwe alinea's
        </div>
        <textarea
          value={localContent.explanation || ''}
          onChange={(e) => handleFieldChange('explanation', e.target.value)}
          placeholder="Spieren groeien alleen als ze een reden krijgen. Die reden? Progressieve overload.\n\nMeer gewicht, meer reps, of betere techniek..."
          rows={isMobile ? 6 : 8}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '0.95rem' : '1rem',
            lineHeight: '1.6',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'all 0.3s ease',
            minHeight: '150px'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)'
            e.target.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginTop: '0.25rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{(localContent.explanation || '').split('\n\n').length} alinea's</span>
          <span>{(localContent.explanation || '').length} karakters</span>
        </div>
      </div>
      
      {/* Why Field */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          Waarom dit belangrijk is
        </label>
        <textarea
          value={localContent.why || ''}
          onChange={(e) => handleFieldChange('why', e.target.value)}
          placeholder="Als je dit niet begrijpt, doe je random shit in de gym zonder resultaat..."
          rows={isMobile ? 3 : 4}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '0.95rem' : '1rem',
            lineHeight: '1.6',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'all 0.3s ease',
            minHeight: '100px'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)'
            e.target.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.15)'
            e.target.style.background = 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)'
            e.target.style.boxShadow = 'none'
            e.target.style.background = 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
          }}
        />
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginTop: '0.25rem',
          textAlign: 'right'
        }}>
          {(localContent.why || '').length} karakters
        </div>
      </div>
      
      {/* Quick Tips */}
      <div style={{
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        marginTop: '2rem'
      }}>
        <h4 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '700',
          color: '#3b82f6',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>💡</span> Tips voor goede content
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '1.5rem',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.6'
        }}>
          <li>Houd de titel kort en krachtig (max 5-6 woorden)</li>
          <li>Uitleg in 2-3 alinea's voor beste leesbaarheid</li>
          <li>Why-sectie moet direct impact tonen</li>
          <li>Gebruik concrete voorbeelden</li>
        </ul>
      </div>
      
      {/* Character Counter Summary */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        <div>
          <strong style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Totaal:</strong> {
            (localContent.title || '').length + 
            (localContent.explanation || '').length + 
            (localContent.why || '').length
          } karakters
        </div>
        <div>
          <strong style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Optimal:</strong> 400-600
        </div>
      </div>
    </div>
  )
}
