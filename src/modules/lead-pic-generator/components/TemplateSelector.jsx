// src/modules/lead-pic-generator/components/TemplateSelector.jsx
import React from 'react'

export default function TemplateSelector({ 
  selectedTemplate, 
  onSelectTemplate, 
  isMobile, 
  templateType = 'hook',
  customOptions = null // For passing reward template options
}) {
  
  // Hook template options
  const hookTemplateOptions = [
    { id: 'statement', label: 'Statement', icon: '💪' },
    { id: 'problem', label: 'Probleem', icon: '⚠️' },
    { id: 'beforeafter', label: 'Voor/Na', icon: '🔄' },
    { id: 'question', label: 'Vraag', icon: '❓' },
    { id: 'mistake', label: 'Fout', icon: '❌' }
  ]

  // Body template options
  const bodyTemplateOptions = [
    { id: 'checklist', label: 'Checklist', icon: '✓' },
    { id: 'problemsolution', label: 'Probleem → Oplossing', icon: '🎯' },
    { id: 'symptoms', label: 'Herken je dit?', icon: '🤔' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'stats', label: 'Stats & Numbers', icon: '📊' },
    { id: 'transformation', label: 'Transformation Story', icon: '🔄' },
    { id: 'simplestory', label: 'Simple Story', icon: '📖' },
    { id: 'energylevels', label: 'Energy Levels', icon: '⚡' }
  ]

  // Reward template options (if not provided via customOptions)
  const rewardTemplateOptions = customOptions || [
    { id: 'dm-word', name: 'DM + Woord', icon: '💬' },
    { id: 'choice', name: 'Keuze A/B/C', icon: '🔤' },
    { id: 'spots', name: 'Limited Spots', icon: '🎯' },
    { id: 'quiz', name: 'Quiz/Test', icon: '❓' },
    { id: 'screenshot', name: 'Screenshot', icon: '📸' },
    { id: 'timer', name: 'Tijd Limiet', icon: '⏰' },
    { id: 'social', name: 'Social Proof', icon: '⭐' }
  ]

  // Select appropriate options and title based on type
  let options, title, gridColumns
  
  switch(templateType) {
    case 'body':
      options = bodyTemplateOptions
      title = 'Body Template'
      gridColumns = isMobile ? 'repeat(2, 1fr)' : 'repeat(8, 1fr)' // 8 templates now!
      break
    case 'reward':
      options = rewardTemplateOptions
      title = 'Reward Template'
      gridColumns = isMobile ? 'repeat(2, 1fr)' : 'repeat(7, 1fr)' // 7 templates!
      break
    default:
      options = hookTemplateOptions
      title = 'Hook Template'
      gridColumns = isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)'
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.2rem',
        fontWeight: '700',
        marginBottom: '1rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: '0.75rem'
      }}>
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelectTemplate(option.id)}
            style={{
              padding: isMobile ? '0.625rem' : '0.75rem',
              background: selectedTemplate === option.id 
                ? 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: selectedTemplate === option.id
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: selectedTemplate === option.id ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (selectedTemplate !== option.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTemplate !== option.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}>
              {option.icon}
            </span>
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
              {option.label || option.name} {/* Support both label and name */}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
