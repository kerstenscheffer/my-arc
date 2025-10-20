// src/modules/lead-pic-generator/components/EditPanels/HookEditPanel.jsx
import React from 'react'
import { Edit3 } from 'lucide-react'
import UniversalHookEditor from './HookEditors/UniversalHookEditor'

// Default content for each template
const HOOK_DEFAULTS = {
  'statement': {
    mainText: "5 Regels om\nFitness Bullshit\nte Herkennen",
    subheaderText: "DE WAARHEID"
  },
  'problem': {
    mainText: "Tegenstrijdige\nFitness Info\nOveral",
    subheaderText: "PROBLEEM"
  },
  'beforeafter': {
    mainText: "Van Verward\nNaar Expert\nin 30 Dagen",
    subheaderText: "IN 30 DAGEN"
  },
  'question': {
    mainText: "Weet Jij\nWat Echt\nWerkt?",
    subheaderText: "VRAAG AAN JOU"
  },
  'mistake': {
    mainText: "Alles Door\nElkaar\nProberen",
    subheaderText: "DE GROOTSTE FOUT"
  }
}

export default function HookEditPanel({ 
  selectedTemplate = 'statement',
  templateContent = {},
  updateTemplateContent,
  templateSettings,
  isMobile 
}) {
  
  // Get the current template content with defaults
  const currentContent = templateContent || HOOK_DEFAULTS[selectedTemplate] || {}
  
  // Update handler wrapper for UniversalHookEditor
  const updateContent = (updates) => {
    // UniversalHookEditor sends full object, we need to update field by field
    Object.keys(updates).forEach(field => {
      if (updates[field] !== currentContent[field]) {
        updateTemplateContent(field, updates[field])
      }
    })
  }
  
  // Initialize content if not exists
  React.useEffect(() => {
    if (!templateContent || Object.keys(templateContent).length === 0) {
      updateTemplateContent(selectedTemplate, HOOK_DEFAULTS[selectedTemplate])
    }
  }, [selectedTemplate])
  
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto 1.5rem',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: isMobile ? '20px' : '30px',
      borderRadius: '20px',
      border: '2px solid transparent',
      backgroundImage: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
        linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)
      `,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Edit3 size={20} style={{ stroke: '#10b981' }} />
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            HOOK CONTENT
          </span>
        </div>
        
        <div style={{
          padding: '4px 12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '20px',
          fontSize: '12px',
          color: '#10b981',
          fontWeight: '600'
        }}>
          {selectedTemplate.toUpperCase()}
        </div>
      </div>
      
      <UniversalHookEditor 
        selectedTemplate={selectedTemplate}
        content={currentContent}
        updateContent={updateContent}
        isMobile={isMobile}
      />
    </div>
  )
}
