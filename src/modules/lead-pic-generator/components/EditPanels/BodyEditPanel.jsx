// src/modules/lead-pic-generator/components/EditPanels/BodyEditPanel.jsx
import React from 'react'
import { Edit3, AlertCircle } from 'lucide-react'

// Import body-specific editors
import ChecklistBodyEditor from './BodyEditors/ChecklistBodyEditor'
import ProblemSolutionBodyEditor from './BodyEditors/ProblemSolutionBodyEditor'
import SymptomsBodyEditor from './BodyEditors/SymptomsBodyEditor'
import TimelineBodyEditor from './BodyEditors/TimelineBodyEditor'
import StatsBodyEditor from './BodyEditors/StatsBodyEditor'
import TransformationBodyEditor from './BodyEditors/TransformationBodyEditor'
import SimpleStoryBodyEditor from './BodyEditors/SimpleStoryBodyEditor'
import EnergyLevelsBodyEditor from './BodyEditors/EnergyLevelsBodyEditor'

// Default content for each template
const BODY_DEFAULTS = {
  'checklist': {
    points: [
      "Tegenstrijdige info online",
      "Jarenlang verward geweest",
      "Eindelijk de waarheid",
      "Systeem dat echt werkt",
      "Resultaat in 30 dagen"
    ]
  },
  'problem-solution': {
    points: [
      "Dit hield mij jaren tegen",
      "7-12kg spiergroei gemist",
      "Mijn simpele oplossing"
    ]
  },
  'symptoms': {
    points: [
      "Altijd moe na training",
      "Geen spiergroei ondanks inzet",
      "Verward door tegenstrijdig advies",
      "Twijfelen aan alles",
      "Gevoel dat iets mist"
    ]
  },
  'timeline': {
    points: [
      "Jaar 1: Alles door elkaar proberen",
      "Jaar 3: Kleine verbeteringen",
      "Jaar 6: Eindelijk doorbraak",
      "Voor jou: Direct resultaat"
    ]
  },
  'stats': {
    points: [
      "92% faalt zonder systeem",
      "4x sneller resultaat",
      "€847 bespaard per jaar",
      "10kg in 90 dagen",
      "+37% kracht toename"
    ]
  },
  'transformation': {
    points: [
      "7kg spiergroei gemist door te weinig eten",
      "Lichaam in katabole staat = afbraak",
      "Eenvoudige calorie fix = game changer",
      "Nu consistente gains elke maand"
    ]
  }
}

export default function BodyEditPanel({ 
  selectedBodyTemplate = 'checklist',
  bodyContent = {},
  setBodyContent,
  isMobile 
}) {
  
  // Get the current template content with defaults
  const currentContent = bodyContent[selectedBodyTemplate] || BODY_DEFAULTS[selectedBodyTemplate] || {}
  
  // Update handler that preserves other template content
  const updateContent = (updates) => {
    setBodyContent({
      ...bodyContent,
      [selectedBodyTemplate]: updates
    })
  }
  
  // Initialize content if not exists
  React.useEffect(() => {
    if (!bodyContent[selectedBodyTemplate]) {
      setBodyContent({
        ...bodyContent,
        [selectedBodyTemplate]: BODY_DEFAULTS[selectedBodyTemplate]
      })
    }
  }, [selectedBodyTemplate])
  
  // Render the appropriate editor based on selected template
  const renderTemplateEditor = () => {
    const editorProps = {
      content: currentContent,
      updateContent,
      isMobile
    }
    
    switch(selectedBodyTemplate) {
      case 'checklist':
        return <ChecklistBodyEditor {...editorProps} />
      
      case 'problem-solution':
        return <ProblemSolutionBodyEditor {...editorProps} />
      
      case 'symptoms':
        return <SymptomsBodyEditor {...editorProps} />
      
      case 'timeline':
        return <TimelineBodyEditor {...editorProps} />
      
      case 'stats':
        return <StatsBodyEditor {...editorProps} />
      
      case 'transformation':
        return <TransformationBodyEditor {...editorProps} />
      
      case 'simplestory':
        return <SimpleStoryBodyEditor {...editorProps} />
      
      case 'energylevels':
        return <EnergyLevelsBodyEditor {...editorProps} />
      
      default:
        return (
          <div style={{
            padding: '30px',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} style={{ 
              color: '#f59e0b', 
              margin: '0 auto 15px' 
            }} />
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Editor niet beschikbaar
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Template: {selectedBodyTemplate}
            </div>
          </div>
        )
    }
  }
  
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
            BODY CONTENT
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
          {selectedBodyTemplate.toUpperCase()}
        </div>
      </div>
      
      {renderTemplateEditor()}
    </div>
  )
}
