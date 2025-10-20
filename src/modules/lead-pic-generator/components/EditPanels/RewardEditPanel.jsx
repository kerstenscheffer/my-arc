// src/modules/lead-pic-generator/components/EditPanels/RewardEditPanel.jsx
import React from 'react'
import { Edit3, AlertCircle } from 'lucide-react'

// Import template-specific editors
import DmWordEditor from './RewardEditors/DmWordEditor'
import ChoiceEditor from './RewardEditors/ChoiceEditor'
import SpotsEditor from './RewardEditors/SpotsEditor'
import QuizEditor from './RewardEditors/QuizEditor'
import ScreenshotEditor from './RewardEditors/ScreenshotEditor'
import TimerEditor from './RewardEditors/TimerEditor'
import SocialProofEditor from './RewardEditors/SocialProofEditor'

// Default content for each template
const REWARD_DEFAULTS = {
  'dm-word': {
    word: 'LIJST',
    description: 'voor de 5 Fitness Fouten',
    promise: 'Ik stuur binnen 60 sec',
    checks: ['100% Gratis', 'Direct in DM', 'Bewezen Systeem']
  },
  'choice': {
    title: 'Welke wil jij?',
    optionA: '5 Fouten Lijst',
    optionB: 'Voeding Calculator',
    optionC: 'Beide (bonus)',
    cta: 'DM je letter'
  },
  'spots': {
    title: 'Eerste 10 krijgen:',
    benefits: ['Persoonlijke lijst', 'Voice memo uitleg', 'Week check-in'],
    currentSpots: 7,
    totalSpots: 10,
    cta: 'DM "SPOT" nu'
  },
  'quiz': {
    title: 'Ontdek jouw type:',
    subtitle: 'Comment je grootste struggle:',
    options: [
      { number: '1', text: 'Consistentie', color: '#10b981' },
      { number: '2', text: 'Voeding', color: '#f59e0b' },
      { number: '3', text: 'Kennis', color: '#3b82f6' }
    ],
    promise: 'Ik stuur gepersonaliseerd plan'
  },
  'screenshot': {
    step1: 'Screenshot dit',
    step2: 'DM me de screenshot',
    step3: 'Krijg exclusive lijst + bonus',
    bonus: 'Eerste 20 krijgen extra voice memo'
  },
  'timer': {
    title: 'Deze lijst verdwijnt in:',
    hours: '23',
    minutes: '47',
    seconds: '12',
    cta: 'DM "NU" voordat het te laat is',
    warning: 'Nooit meer deze prijs'
  },
  'social': {
    title: '342 mensen pakten dit al',
    testimonials: [
      { user: '@markd92', text: 'Life changing! 💯' },
      { user: '@sarah_fit', text: 'Waarom gratis?! Dit is goud!' },
      { user: '@peter_gains', text: '3 weken en al resultaat 🔥' }
    ],
    cta: 'DM voor jouw exemplaar',
    stats: '98% geeft 5 sterren'
  },
  'basic': {
    mainText: "DM me \"START\"\nvoor gratis\npersoonlijke lijst",
    urgency: "100% GRATIS"
  }
}

export default function RewardEditPanel({ 
  rewardContent = {},
  setRewardContent,
  selectedRewardTemplate = 'dm-word',
  isMobile 
}) {
  
  // Get the current template content with defaults
  const currentContent = rewardContent[selectedRewardTemplate] || REWARD_DEFAULTS[selectedRewardTemplate] || {}
  
  // Update handler that preserves other template content
  const updateContent = (updates) => {
    setRewardContent({
      ...rewardContent,
      [selectedRewardTemplate]: updates
    })
  }
  
  // Initialize content if not exists
  React.useEffect(() => {
    if (!rewardContent[selectedRewardTemplate]) {
      setRewardContent({
        ...rewardContent,
        [selectedRewardTemplate]: REWARD_DEFAULTS[selectedRewardTemplate]
      })
    }
  }, [selectedRewardTemplate])
  
  // Render the appropriate editor based on selected template
  const renderTemplateEditor = () => {
    const editorProps = {
      content: currentContent,
      updateContent,
      isMobile
    }
    
    switch(selectedRewardTemplate) {
      case 'dm-word':
        return <DmWordEditor {...editorProps} />
      
      case 'choice':
        return <ChoiceEditor {...editorProps} />
      
      case 'spots':
        return <SpotsEditor {...editorProps} />
      
      case 'quiz':
        return <QuizEditor {...editorProps} />
      
      case 'screenshot':
        return <ScreenshotEditor {...editorProps} />
      
      case 'timer':
        return <TimerEditor {...editorProps} />
      
      case 'social':
        return <SocialProofEditor {...editorProps} />
      
      case 'basic':
        // Legacy basic editor
        return (
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Hoofdtekst CTA
            </label>
            <textarea
              value={currentContent.mainText}
              onChange={(e) => updateContent({
                ...currentContent,
                mainText: e.target.value
              })}
              style={{
                width: '100%',
                padding: isMobile ? '15px' : '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '600',
                lineHeight: '1.6',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
                marginBottom: '1rem'
              }}
              placeholder="Schrijf je call to action..."
              rows={3}
            />
            
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Urgency Tekst
            </label>
            <input
              type="text"
              value={currentContent.urgency}
              onChange={(e) => updateContent({
                ...currentContent,
                urgency: e.target.value
              })}
              style={{
                width: '100%',
                padding: isMobile ? '12px' : '15px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              placeholder="bijv: 100% GRATIS"
            />
          </div>
        )
      
      default:
        return (
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            padding: '20px'
          }}>
            Template editor niet beschikbaar voor: {selectedRewardTemplate}
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
            REWARD CONTENT
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
          {selectedRewardTemplate.toUpperCase()}
        </div>
      </div>
      
      {renderTemplateEditor()}
    </div>
  )
}
