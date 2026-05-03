// SalesSliderV2.jsx - Dark Premium + Gold + Large Text + SVG Visuals
import React, { useState, useEffect } from 'react'

export default function SalesSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const containerRef = React.useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsPresentationMode(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard navigation - Enter/Space/Arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault()
        setCurrentSlide(prev => Math.max(prev - 1, 0))
      }
      if (e.key === 'Escape' && isPresentationMode) {
        exitPresentationMode()
      }
      // Press 'R' to reset to first slide
      if (e.key === 'r' || e.key === 'R') {
        setCurrentSlide(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationMode])

  const startPresentationMode = async () => {
    console.log('🚀 Start button clicked!')
    console.log('containerRef:', containerRef.current)
    
    // First set presentation mode - this should work regardless of fullscreen
    setIsPresentationMode(true)
    setCurrentSlide(0)
    console.log('✅ Presentation mode set to true')
    
    // Then try fullscreen (optional, might fail on some browsers)
    try {
      const elem = document.documentElement // Use whole page instead of ref
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        console.log('✅ Fullscreen activated')
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
        console.log('✅ Webkit fullscreen activated')
      }
    } catch (err) {
      console.log('⚠️ Fullscreen failed (but presentation still works):', err)
    }
  }

  const exitPresentationMode = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.log('Error exiting fullscreen')
    }
    setIsPresentationMode(false)
  }

  const colors = {
    bg: '#0a0a0a',
    bgLight: '#141414',
    gold: '#D4AF37',
    goldLight: '#E8C547',
    text: '#ffffff',
    textMuted: '#888888',
    red: '#DC2626'
  }

  const iconSize = isMobile ? 140 : 200
  
  // ========== ICONS ==========
  const TransformIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M13 7L21 7M21 7V15M21 7L13 15L9 11L3 17" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const SystemIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={colors.gold} strokeWidth="2"/>
      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke={colors.gold} strokeWidth="2"/>
    </svg>
  )

  const ChecklistIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke={colors.gold} strokeWidth="2"/>
      <path d="M9 12L11 14L15 10" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const ShieldIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const TargetIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={colors.gold} strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" stroke={colors.gold} strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill={colors.gold}/>
    </svg>
  )

  const FireIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M12 22C15.866 22 19 18.866 19 15C19 12.2 17.5 9.5 15 7.5C15 10 13 12 10 12C10 9 11 6 14 3C10 3 5 7 5 13C5 18.523 8.477 22 12 22Z" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  // Offer icons
  const VideoIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M23 7L16 12L23 17V7Z" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="1" y="5" width="15" height="14" rx="2" stroke={colors.gold} strokeWidth="2"/>
    </svg>
  )

  const DumbbellIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5L17.5 17.5" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 10L10 3" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 21L21 14" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 3L3 7" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M21 17L17 21" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 14L14 10" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  const UtensilsIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M3 2V10C3 11.1 3.9 12 5 12H7C8.1 12 9 11.1 9 10V2" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 2V22" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 8V22" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 2C18 2 21 4 21 8C21 12 18 12 18 12" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const ContainerIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke={colors.gold} strokeWidth="2"/>
      <path d="M2 11H22" stroke={colors.gold} strokeWidth="2"/>
      <path d="M12 7V21" stroke={colors.gold} strokeWidth="2"/>
      <path d="M6 4H18" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  const CartIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="21" r="1" stroke={colors.gold} strokeWidth="2"/>
      <circle cx="20" cy="21" r="1" stroke={colors.gold} strokeWidth="2"/>
      <path d="M1 1H5L7.68 14.39C7.77 14.84 8.02 15.24 8.38 15.52C8.74 15.8 9.19 15.95 9.65 15.95H19.4C19.86 15.95 20.31 15.8 20.67 15.52C21.03 15.24 21.28 14.84 21.37 14.39L23 6H6" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const PhoneIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke={colors.gold} strokeWidth="2"/>
      <path d="M12 18H12.01" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  const UsersIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke={colors.gold} strokeWidth="2"/>
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const PillIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <path d="M10.5 20.5L3.5 13.5C2.57174 12.5717 2.04688 11.3152 2.04688 10.005C2.04688 8.69477 2.57174 7.43828 3.5 6.51001C4.42828 5.58174 5.68477 5.05688 6.995 5.05688C8.30523 5.05688 9.56172 5.58174 10.49 6.51001L17.49 13.51C18.4183 14.4383 18.9431 15.6948 18.9431 17.005C18.9431 18.3152 18.4183 19.5717 17.49 20.5C16.5617 21.4283 15.3052 21.9531 13.995 21.9531C12.6848 21.9531 11.4283 21.4283 10.5 20.5Z" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 13.5L10.5 10" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  const CoinsIcon = () => (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="7" stroke={colors.gold} strokeWidth="2"/>
      <path d="M15 15C15 18.866 18.134 22 22 22" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M15.83 14.83C17.28 16.28 19.48 17.05 22 17.05" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 6V12" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 9H12" stroke={colors.gold} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  const getOfferIcon = (iconName) => {
    switch(iconName) {
      case 'video': return <VideoIcon />
      case 'dumbbell': return <DumbbellIcon />
      case 'utensils': return <UtensilsIcon />
      case 'container': return <ContainerIcon />
      case 'cart': return <CartIcon />
      case 'phone': return <PhoneIcon />
      case 'users': return <UsersIcon />
      case 'pill': return <PillIcon />
      case 'coins': return <CoinsIcon />
      default: return null
    }
  }

  // SLIDES
  const slides = [
    // SLIDE 1: TITLE
    {
      type: 'title',
      content: {
        main: ['Van ', 'Vastzitten', ' Naar ', 'Resultaat'],
        highlight: [1, 3],
        sub: '12 Weken Transformatie',
        icon: 'transform'
      }
    },
    // SLIDE 2: PROBLEMS
    {
      type: 'problems',
      content: {
        title: ['Voor mannen die ', 'vastlopen', ' op:'],
        highlight: [1],
        problems: [
          'Je weet niet hoeveel je moet eten',
          'Je bent niet consistent met je voeding', 
          'Je hebt geen energie door de dag',
          'Je traint, maar ziet geen resultaat'
        ]
      }
    },
    // SLIDE 3: ROOT CAUSE
    {
      type: 'statement',
      content: {
        main: ['Het probleem?'],
        sub: 'Je mist een systeem.',
        icon: 'system'
      }
    },
    // SLIDE 4: VALUE INTRO
    {
      type: 'intro',
      content: {
        main: ['Dit is wat je ', 'krijgt', ':'],
        highlight: [1],
        icon: 'checklist'
      }
    },
    // SLIDES 5-13: OFFERS
    { type: 'offer', content: { title: ['Nooit Meer ', 'Twijfelen', ' Sessies'], highlight: [1], icon: 'video' }},
    { type: 'offer', content: { title: ['Spiergroei ', 'Garantie', ' Schema'], highlight: [1], icon: 'dumbbell' }},
    { type: 'offer', content: { title: ['Exact Weten ', 'Wat Je Eet', ' Plan'], highlight: [1], icon: 'utensils' }},
    { type: 'offer', content: { title: ['1x Preppen, ', '7 Dagen', ' Klaar'], highlight: [1], icon: 'container' }},
    { type: 'offer', content: { title: ['Nooit Meer ', 'Nadenken', ' Boodschappen'], highlight: [1], icon: 'cart' }},
    { type: 'offer', content: { title: ['Alles Op ', '1 Plek', ' App'], highlight: [1], icon: 'phone' }},
    { type: 'offer', content: { title: ['Iemand Die Je ', 'Scherp', ' Houdt'], highlight: [1], icon: 'users' }},
    { type: 'offer', content: { title: ['Alleen Wat ', 'Werkt', ' Advies'], highlight: [1], icon: 'pill' }},
    { type: 'offer', content: { title: ['Verdien Je ', 'Investering', ' Terug'], highlight: [1], icon: 'coins' }},
    // SLIDE 14: CHECK-IN
    {
      type: 'question',
      content: {
        main: 'Is dit iets voor jou?',
        icon: 'target'
      }
    },
    // SLIDE 15: COMMITMENT
    {
      type: 'question',
      content: {
        main: 'Ben jij bereid om 100% te geven?',
        icon: 'fire'
      }
    },
    // SLIDE 16: GUARANTEE INTRO
    {
      type: 'statement',
      content: {
        main: ['Je kunt ', 'niet', ' verliezen.'],
        highlight: [1],
        icon: 'shield'
      }
    },
    // SLIDE 17: GUARANTEE 1
    {
      type: 'guarantee',
      content: {
        main: 'Doel niet gehaald in 12 weken?',
        sub: 'We gaan door tot je het wél haalt.'
      }
    },
    // SLIDE 18: GUARANTEE 2
    {
      type: 'guarantee',
      content: {
        main: '14 dagen toch niks voor mij?',
        sub: 'Volledige terugbetaling.'
      }
    },
    // SLIDE 19: PRICE
    {
      type: 'price',
      content: {
        price: '€297',
        sub: '12 weken compleet'
      }
    },
    // SLIDE 20: SCENARIOS
    {
      type: 'scenarios',
      content: {
        title: 'Je hebt 3 opties:',
        scenarios: [
          { num: '1', text: 'Niks doen. Blijf waar je bent.' },
          { num: '2', text: 'Begin. Behaal resultaat.' },
          { num: '3', text: 'Begin. Niet tevreden? Geld terug.' }
        ]
      }
    },
    // SLIDE 21: CLOSE
    {
      type: 'close',
      content: {
        main: 'Wat wordt het?'
      }
    }
  ]

  // Render functions
  const renderTitle = (title, highlights = []) => (
    <span>
      {title.map((part, i) => (
        <span key={i} style={{ color: highlights.includes(i) ? colors.gold : colors.text }}>
          {part}
        </span>
      ))}
    </span>
  )

  const renderSlide = (slide) => {
    const baseStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: isMobile ? '2rem' : '4rem',
      minHeight: 'calc(100vh - 6rem)'
    }

    switch(slide.type) {
      case 'title':
        return (
          <div style={baseStyle}>
            <h1 style={{ 
              fontSize: isMobile ? '2.5rem' : '4rem', 
              fontWeight: '800', 
              marginBottom: '1rem',
              lineHeight: 1.1
            }}>
              {renderTitle(slide.content.main, slide.content.highlight)}
            </h1>
            <p style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', color: colors.textMuted, marginBottom: '3rem' }}>
              {slide.content.sub}
            </p>
            <TransformIcon />
          </div>
        )

      case 'problems':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '700', marginBottom: '3rem' }}>
              {renderTitle(slide.content.title, slide.content.highlight)}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
              {slide.content.problems.map((problem, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: isMobile ? '32px' : '40px', 
                    height: isMobile ? '32px' : '40px', 
                    borderRadius: '50%', 
                    background: colors.red + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ color: colors.red, fontSize: isMobile ? '1.25rem' : '1.5rem' }}>✕</span>
                  </div>
                  <span style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', color: colors.text, textAlign: 'left' }}>
                    {problem}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'statement':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: '700', marginBottom: '1rem' }}>
              {Array.isArray(slide.content.main) ? renderTitle(slide.content.main, slide.content.highlight) : slide.content.main}
            </h2>
            {slide.content.sub && (
              <p style={{ fontSize: isMobile ? '1.5rem' : '2.25rem', color: colors.gold, marginBottom: '3rem' }}>
                {slide.content.sub}
              </p>
            )}
            {slide.content.icon === 'system' && <SystemIcon />}
            {slide.content.icon === 'shield' && <ShieldIcon />}
          </div>
        )

      case 'intro':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: '700', marginBottom: '3rem' }}>
              {renderTitle(slide.content.main, slide.content.highlight)}
            </h2>
            <ChecklistIcon />
          </div>
        )

      case 'offer':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.75rem', fontWeight: '700', marginBottom: '3rem' }}>
              {renderTitle(slide.content.title, slide.content.highlight)}
            </h2>
            {getOfferIcon(slide.content.icon)}
          </div>
        )

      case 'question':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '3.5rem', fontWeight: '800', marginBottom: '3rem', color: colors.gold }}>
              {slide.content.main}
            </h2>
            {slide.content.icon === 'target' && <TargetIcon />}
            {slide.content.icon === 'fire' && <FireIcon />}
          </div>
        )

      case 'guarantee':
        return (
          <div style={baseStyle}>
            <ShieldIcon />
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.25rem', fontWeight: '600', marginTop: '2rem', color: colors.text }}>
              {slide.content.main}
            </h2>
            <p style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '700', color: colors.gold, marginTop: '1rem' }}>
              {slide.content.sub}
            </p>
          </div>
        )

      case 'price':
        return (
          <div style={baseStyle}>
            <p style={{ fontSize: isMobile ? '5rem' : '10rem', fontWeight: '900', color: colors.gold, lineHeight: 1 }}>
              {slide.content.price}
            </p>
            <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', color: colors.textMuted, marginTop: '1rem' }}>
              {slide.content.sub}
            </p>
          </div>
        )

      case 'scenarios':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '700', marginBottom: '3rem', color: colors.text }}>
              {slide.content.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '600px' }}>
              {slide.content.scenarios.map((s, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.25rem',
                  padding: '1.25rem',
                  background: i === 0 ? colors.bgLight : colors.gold + '15',
                  borderRadius: '12px',
                  border: `1px solid ${i === 0 ? colors.textMuted + '30' : colors.gold + '40'}`
                }}>
                  <span style={{ 
                    fontSize: isMobile ? '1.5rem' : '2rem', 
                    fontWeight: '800', 
                    color: i === 0 ? colors.textMuted : colors.gold,
                    width: '40px'
                  }}>
                    {s.num}
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? '1.1rem' : '1.4rem', 
                    color: i === 0 ? colors.textMuted : colors.text,
                    textAlign: 'left'
                  }}>
                    {s.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'close':
        return (
          <div style={baseStyle}>
            <h2 style={{ fontSize: isMobile ? '3rem' : '5rem', fontWeight: '900', color: colors.gold }}>
              {slide.content.main}
            </h2>
          </div>
        )

      default:
        return null
    }
  }

  // START SCREEN (before presentation)
  if (!isPresentationMode) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '2rem' : '3rem', 
          fontWeight: '800',
          textAlign: 'center'
        }}>
          <span style={{ color: colors.text }}>MY ARC </span>
          <span style={{ color: colors.gold }}>Sales Presentatie</span>
        </h1>
        
        <p style={{ color: colors.textMuted, fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
          {slides.length} slides • Hormozi Style
        </p>

        <button
          onClick={(e) => {
            e.preventDefault()
            console.log('Button onClick fired!')
            startPresentationMode()
          }}
          type="button"
          style={{
            padding: '1.25rem 3rem',
            fontSize: '1.25rem',
            fontWeight: '700',
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
            color: colors.bg,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: `0 4px 20px ${colors.gold}40`,
            pointerEvents: 'auto',
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = `0 8px 30px ${colors.gold}60`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.gold}40`
          }}
        >
          ▶ Start Presentatie
        </button>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: colors.bgLight, 
          borderRadius: '12px',
          maxWidth: '400px'
        }}>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
            <strong style={{ color: colors.text }}>Controls:</strong><br/>
            Enter / Spatie / → = Volgende<br/>
            Backspace / ← = Vorige<br/>
            R = Reset naar begin<br/>
            ESC = Stop presentatie
          </p>
        </div>
      </div>
    )
  }

  // PRESENTATION MODE
  return (
    <div 
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'none' // Hide cursor during presentation
      }}
      onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))}
    >
      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderSlide(slides[currentSlide])}
      </div>

      {/* Progress Bar - subtle in presentation mode */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: colors.bgLight,
        zIndex: 10,
        opacity: 0.5
      }}>
        <div style={{
          height: '100%',
          width: `${((currentSlide + 1) / slides.length) * 100}%`,
          background: colors.gold,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Exit button - small corner */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          exitPresentationMode()
        }}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: 'transparent',
          border: 'none',
          color: colors.textMuted,
          fontSize: '0.75rem',
          cursor: 'pointer',
          opacity: 0.3,
          transition: 'opacity 0.2s',
          zIndex: 10,
          padding: '0.5rem'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.3}
      >
        ESC
      </button>
    </div>
  )
}
