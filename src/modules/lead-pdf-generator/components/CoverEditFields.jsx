import React, { useState, useEffect } from 'react'

export default function CoverEditFields({ 
  content, 
  onChange, 
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
      {/* Cover Page Header */}
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Cover Page
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
        <textarea
          value={localContent.title || ''}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="De 5 Fundamentele\nFitness Waarheden"
          rows={3}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'all 0.3s ease',
            lineHeight: '1.2'
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
      </div>
      
      {/* Subtitle Field */}
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
          Subtitle
        </label>
        <input
          type="text"
          value={localContent.subtitle || ''}
          onChange={(e) => handleFieldChange('subtitle', e.target.value)}
          placeholder="Leer de basis, spot de bullshit"
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.3s ease'
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
      </div>
      
      {/* Tagline Field */}
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
          Tagline
        </label>
        <input
          type="text"
          value={localContent.tagline || ''}
          onChange={(e) => handleFieldChange('tagline', e.target.value)}
          placeholder="↓ Scroll voor waarheid ↓"
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '1rem',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '500',
            background: 'rgba(17, 17, 17, 0.8)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.3s ease'
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
      </div>
    </div>
  )
}
