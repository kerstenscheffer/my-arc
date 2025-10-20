// src/modules/lead-pic-generator/LeadPicGenerator.jsx
import React, { useState } from 'react'
import html2canvas from 'html2canvas'

// Components
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import TemplateSelector from './components/TemplateSelector'
import QuickControls from './components/QuickControls'
import PreviewArea from './components/PreviewArea'
import NavigationControls from './components/NavigationControls'
import HookEditPanel from './components/EditPanels/HookEditPanel'
import BodyEditPanel from './components/EditPanels/BodyEditPanel'
import RewardEditPanel from './components/EditPanels/RewardEditPanel'
import DownloadControls from './components/DownloadControls'
import HiddenCanvases from './components/HiddenCanvases'

// Hook Templates
import StatementTemplate from './templates/StatementTemplate'
import ProblemTemplate from './templates/ProblemTemplate'
import BeforeAfterTemplate from './templates/BeforeAfterTemplate'
import QuestionTemplate from './templates/QuestionTemplate'
import MistakeTemplate from './templates/MistakeTemplate'

// Body Templates
import ChecklistBody from './templates/body/ChecklistBody'
import ProblemSolutionBody from './templates/body/ProblemSolutionBody'
import SymptomsBody from './templates/body/SymptomsBody'
import TimelineBody from './templates/body/TimelineBody'
import StatsBody from './templates/body/StatsBody'
import TransformationBody from './templates/body/TransformationBody'
import SimpleStoryBody from './templates/body/SimpleStoryBody'
import EnergyLevelsBody from './templates/body/EnergyLevelsBody'

// Reward Templates - NOW IMPORTED!
import RewardTemplates, { REWARD_TEMPLATE_TYPES } from './templates/rewards/RewardTemplates'
import SlideReward from './components/SlideReward' // Keep as fallback

export default function LeadPicGenerator() {
  const isMobile = window.innerWidth <= 768
  
  // Navigation State
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // UPDATED: 3 separate background images
  const [backgroundImages, setBackgroundImages] = useState({
    hook: null,
    body: null,
    reward: null
  })
  
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Template States
  const [selectedTemplate, setSelectedTemplate] = useState('statement')
  const [selectedBodyTemplate, setSelectedBodyTemplate] = useState('checklist')
  const [selectedRewardTemplate, setSelectedRewardTemplate] = useState('dm-word') // Changed from 'basic'
  
  // Template Settings
  const [templateSettings, setTemplateSettings] = useState({
    fontSize: 120,
    overlayDarkness: 40,
    textPosition: 'center',
    hasSubheader: false,
    // Body settings
    bodyFontSize: 42,
    bodySpacing: 'normal',
    // Reward settings
    rewardCTASize: 88,
    rewardButtonSize: 'medium',
    rewardButtonText: 'Start Nu' // NEW: Button text setting
  })
  
  // Hook Content States
  const [templateContent, setTemplateContent] = useState({
    statement: {
      mainText: "5 Regels om\nFitness Bullshit\nte Herkennen",
      subheaderText: "DE WAARHEID"
    },
    problem: {
      mainText: "Tegenstrijdige\nFitness Info\nOveral",
      subheaderText: "PROBLEEM"
    },
    beforeafter: {
      mainText: "Van Verward\nNaar Expert\nin 30 Dagen",
      subheaderText: "IN 30 DAGEN"
    },
    question: {
      mainText: "Weet Jij\nWat Echt\nWerkt?",
      subheaderText: "VRAAG AAN JOU"
    },
    mistake: {
      mainText: "Alles Door\nElkaar\nProberen",
      subheaderText: "DE GROOTSTE FOUT"
    }
  })

  // Body Content States
  const [bodyContent, setBodyContent] = useState({
    checklist: {
      points: [
        "Tegenstrijdige info online",
        "Jarenlang verward geweest",
        "Nu weet ik wat werkt",
        "5 simpele regels",
        "Direct toepasbaar"
      ]
    },
    problemsolution: {
      problem: "Dit hield mij tegen",
      result: "Jaren verloren progressie",
      solution: "Mijn systeem werkt"
    },
    symptoms: {
      symptoms: [
        "Mood swings na lunch",
        "Dipje om 16:00",
        "Futloos gevoel",
        "Brain fog",
        "Geen energie voor gym"
      ]
    },
    timeline: {
      year1: "Constant fouten maken",
      year3: "Kleine vooruitgang",
      year6: "Eindelijk doorbraak",
      forYou: "Direct resultaat"
    },
    stats: {
      stat1: "97% Succes rate",
      stat2: "342 Transformaties",
      stat3: "7-12 KG Spiergroei",
      stat4: "30 Dagen",
      stat5: "100% Gratis"
    },
    transformation: {
      headerTitle: "VAN 7KG SPIERGROEI GEMIST",
      subTitle: "NAAR CONSISTENTE GAINS",
      ctaText: "MIJN COMPLETE FOUTLIJST KRIJGEN", 
      points: [
        "7kg spiergroei gemist door te weinig eten",
        "Lichaam in katabole staat = afbraak",
        "Eenvoudige calorie fix = game changer",
        "Nu consistente gains elke maand"
      ]
    },
    simplestory: {
      title: "MIJN VERHAAL",
      subtitle: "Hoe ik alles veranderde",
      paragraph: "Dit is mijn verhaal over hoe ik alles veranderde. Het begon met kleine stappen, maar groeide uit tot een complete transformatie van mijn leven. Nu help ik anderen om hetzelfde te bereiken.",
      ctaText: "WEDEROM MEE MET MIJN VERHAAL? DM GRAAG"
    },
    energylevels: {
      headerTitle: "ALTIJD MOE, FUTLOOS, BRAIN FOG",
      subTitle: "5 Voeding Trucs die Alles Veranderen",
      ctaText: "ENERGY LIJST IN DM",
      beforeItems: [
        "3pm crash op de bank",
        "Brain fog hele dag",
        "Futloos na lunch",
        "Moe bij het wakker worden"
      ],
      afterItems: [
        "Stabiele energie hele dag",
        "Scherpe focus tot 's avonds", 
        "Vol energie na maaltijden",
        "Wakker worden vol energie"
      ]
    }
  })
  
  // Reward Content State - EXPANDED for all templates
  const [rewardContent, setRewardContent] = useState({
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
    },
    // Fallback for old 'basic' template
    basic: {
      mainText: "DM 'WAARHEID'\nvoor de gratis lijst",
      urgency: "100% GRATIS"
    }
  })

  // Helper function to get current slide type
  const getSlideType = () => {
    const slideTypes = ['hook', 'body', 'reward']
    return slideTypes[currentSlide] || 'hook'
  }

  // Update content for current hook template
  const updateTemplateContent = (field, value) => {
    setTemplateContent({
      ...templateContent,
      [selectedTemplate]: {
        ...templateContent[selectedTemplate],
        [field]: value
      }
    })
  }

  // Download single slide
  const downloadSlide = async (slideNumber) => {
    setIsDownloading(true)
    const slideId = `download-slide-${slideNumber}`
    const element = document.getElementById(slideId)
    
    if (!element) {
      console.error('Slide element not found')
      setIsDownloading(false)
      return
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        width: 1080,
        height: 1350,
        windowWidth: 1080,
        windowHeight: 1350,
        backgroundColor: '#000',
        useCORS: true,
        allowTaint: true,
        logging: false
      })
      
      const link = document.createElement('a')
      link.download = `lead-magnet-slide-${slideNumber + 1}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Download all slides
  const downloadAllSlides = async () => {
    for (let i = 0; i < 3; i++) {
      await downloadSlide(i)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Get current hook template
  const getCurrentTemplate = () => {
    const props = {
      backgroundImage: backgroundImages.hook, // UPDATED: Use hook background
      mainText: templateContent[selectedTemplate].mainText,
      subheaderText: templateContent[selectedTemplate].subheaderText,
      settings: templateSettings
    }
    
    switch(selectedTemplate) {
      case 'problem': return <ProblemTemplate {...props} />
      case 'beforeafter': return <BeforeAfterTemplate {...props} />
      case 'question': return <QuestionTemplate {...props} />
      case 'mistake': return <MistakeTemplate {...props} />
      default: return <StatementTemplate {...props} />
    }
  }

  // Get current body template
  const getCurrentBodyTemplate = () => {
    const content = bodyContent[selectedBodyTemplate]
    const props = {
      backgroundImage: backgroundImages.body, // UPDATED: Use body background
      points: content.points || content.symptoms || [],
      settings: templateSettings
    }
    
    // For non-checklist templates, pass full content
    if (selectedBodyTemplate !== 'checklist') {
      props.content = content
    }
    
    switch(selectedBodyTemplate) {
      case 'problemsolution': return <ProblemSolutionBody {...props} />
      case 'symptoms': return <SymptomsBody {...props} />
      case 'timeline': return <TimelineBody {...props} />
      case 'stats': return <StatsBody {...props} />
      case 'transformation': return <TransformationBody {...props} />
      case 'simplestory': return <SimpleStoryBody {...props} />
      case 'energylevels': return <EnergyLevelsBody {...props} />
      default: return <ChecklistBody {...props} />
    }
  }

  // Get current reward slide - NOW USING TEMPLATES!
  const getCurrentRewardSlide = () => {
    // If using the old 'basic' template, use SlideReward
    if (selectedRewardTemplate === 'basic') {
      return (
        <SlideReward 
          backgroundImage={backgroundImages.reward} // UPDATED: Use reward background
          rewardText={rewardContent.basic.mainText}
          settings={templateSettings}
        />
      )
    }
    
    // Otherwise use the new template system
    return (
      <RewardTemplates
        templateType={selectedRewardTemplate}
        backgroundImage={backgroundImages.reward} // UPDATED: Use reward background
        content={rewardContent[selectedRewardTemplate]}
        settings={templateSettings}
      />
    )
  }

  // Preview slides array
  const previewSlides = [
    getCurrentTemplate(),
    getCurrentBodyTemplate(),
    getCurrentRewardSlide()
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: isMobile ? '1rem' : '2rem',
      paddingBottom: '4rem'
    }}>
      <Header isMobile={isMobile} />
      
      {/* UPDATED: Dynamic ImageUploader with slide-specific label and state */}
      <ImageUploader 
        backgroundImage={backgroundImages[getSlideType()]}
        setBackgroundImage={(img) => {
          setBackgroundImages({
            ...backgroundImages,
            [getSlideType()]: img
          })
        }}
        currentSlide={currentSlide}
        slideType={getSlideType()}
        isMobile={isMobile}
      />
      
      {/* Template Selector - Only for Slide 1 (Hook) */}
      {currentSlide === 0 && (
        <TemplateSelector 
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          isMobile={isMobile}
          templateType="hook"
        />
      )}

      {/* Body Template Selector - Only for Slide 2 */}
      {currentSlide === 1 && (
        <TemplateSelector 
          selectedTemplate={selectedBodyTemplate}
          onSelectTemplate={setSelectedBodyTemplate}
          isMobile={isMobile}
          templateType="body"
        />
      )}
      
      {/* REWARD Template Selector - NOW ACTIVE for Slide 3! */}
      {currentSlide === 2 && (
        <TemplateSelector 
          selectedTemplate={selectedRewardTemplate}
          onSelectTemplate={setSelectedRewardTemplate}
          isMobile={isMobile}
          templateType="reward"
          customOptions={REWARD_TEMPLATE_TYPES} // Pass the reward template options
        />
      )}
      
      {/* Quick Controls - For ALL slides with context awareness */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <QuickControls
          settings={templateSettings}
          onUpdateSettings={setTemplateSettings}
          isMobile={isMobile}
          currentSlide={currentSlide}
        />
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PreviewArea 
          currentSlide={currentSlide}
          previewSlides={previewSlides}
          setCurrentSlide={setCurrentSlide}
          isMobile={isMobile}
        />
        
        <NavigationControls
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          isMobile={isMobile}
        />

        {/* Edit Panels - THESE ARE NOW VISIBLE */}
        {currentSlide === 0 && (
          <HookEditPanel
            selectedTemplate={selectedTemplate}
            templateContent={templateContent[selectedTemplate]}
            templateSettings={templateSettings}
            updateTemplateContent={updateTemplateContent}
            isMobile={isMobile}
          />
        )}

        {currentSlide === 1 && (
          <BodyEditPanel
            selectedBodyTemplate={selectedBodyTemplate}
            bodyContent={bodyContent}
            setBodyContent={setBodyContent}
            isMobile={isMobile}
          />
        )}

        {currentSlide === 2 && (
          <RewardEditPanel
            rewardContent={rewardContent}
            setRewardContent={setRewardContent}
            selectedRewardTemplate={selectedRewardTemplate}
            isMobile={isMobile}
          />
        )}

        <DownloadControls
          currentSlide={currentSlide}
          isDownloading={isDownloading}
          downloadSlide={downloadSlide}
          downloadAllSlides={downloadAllSlides}
          isMobile={isMobile}
        />

        <HiddenCanvases
          getCurrentTemplate={getCurrentTemplate}
          getCurrentBodyTemplate={getCurrentBodyTemplate}
          getCurrentRewardSlide={getCurrentRewardSlide}
        />
      </div>
    </div>
  )
}
