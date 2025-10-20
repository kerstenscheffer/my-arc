// src/modules/lead-pic-generator/templates/rewards/RewardTemplates.jsx
import React from 'react'
import DmWordTemplate from './DmWordTemplate'
import ChoiceTemplate from './ChoiceTemplate'
import SpotsTemplate from './SpotsTemplate'
import QuizTemplate from './QuizTemplate'
import ScreenshotTemplate from './ScreenshotTemplate'
import TimerTemplate from './TimerTemplate'
import SocialProofTemplate from './SocialProofTemplate'

export default function RewardTemplates({ 
  templateType = 'dm-word',
  backgroundImage,
  content,
  settings = {
    overlayDarkness: 60
  }
}) {
  
  // Default content per template type
  const defaultContent = {
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
      benefits: [
        'Persoonlijke lijst',
        'Voice memo uitleg',
        'Week check-in'
      ],
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
    }
  }
  
  // Merge default content with provided content
  const finalContent = {
    ...defaultContent[templateType],
    ...content
  }
  
  // Render appropriate template
  switch(templateType) {
    case 'dm-word':
      return (
        <DmWordTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'choice':
      return (
        <ChoiceTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'spots':
      return (
        <SpotsTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'quiz':
      return (
        <QuizTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'screenshot':
      return (
        <ScreenshotTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'timer':
      return (
        <TimerTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    case 'social':
      return (
        <SocialProofTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
    
    default:
      // Default to dm-word if unknown type
      return (
        <DmWordTemplate 
          backgroundImage={backgroundImage}
          content={finalContent}
          settings={settings}
        />
      )
  }
}

// Export template types for reference
export const REWARD_TEMPLATE_TYPES = [
  { id: 'dm-word', name: 'DM + Woord', icon: '💬' },
  { id: 'choice', name: 'Keuze A/B/C', icon: '🔤' },
  { id: 'spots', name: 'Limited Spots', icon: '🎯' },
  { id: 'quiz', name: 'Quiz/Test', icon: '❓' },
  { id: 'screenshot', name: 'Screenshot', icon: '📸' },
  { id: 'timer', name: 'Tijd Limiet', icon: '⏰' },
  { id: 'social', name: 'Social Proof', icon: '⭐' }
]
