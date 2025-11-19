import ChallengeHomeBanner from "../components/challenge-banner/ChallengeHomeBanner"
import FloatingActionPanel from '../components/FloatingActionPanel'
import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Home, Calendar, Target, Trophy, Zap, ChevronRight, Play, X,
  Phone, Video, Clock, CheckCircle, User, Dumbbell, Apple,
  ShoppingCart, MessageCircle, Bell, TrendingUp, Sparkles,
  Coffee, Sun, Moon, Star, Heart, Award, Flame, ArrowRight,
  Shield, Brain, Activity, Rocket, Timer, BarChart3,
  RefreshCw, Plus, ChevronDown, Info, Eye, Lock
} from 'lucide-react'
import ClientCallsWidget from '../widgets/ClientCallsWidget'
import GoalsWidget from '../widgets/Goalswidget'
import PageVideoWidget from '../../modules/videos/PageVideoWidget'
import MotivationQuoteSlider from '../components/MotivationQuoteSlider'

// ============================================
// DARK BLUE STYLING SYSTEM v1.0
// ============================================
const COLORS = {
  // Dark Blue Primary
  primary: '#2563eb',           // Main blue
  primaryDark: '#1e3a8a',       // Deep blue
  accentBlue: '#3b82f6',        // Bright blue
  skyBlue: '#60a5fa',           // Light accent
  
  // Blue Opacity Scale
  blueBg04: 'rgba(37, 99, 235, 0.04)',
  blueBg08: 'rgba(37, 99, 235, 0.08)',
  blueBg10: 'rgba(37, 99, 235, 0.1)',
  blueBg12: 'rgba(37, 99, 235, 0.12)',
  blueBg15: 'rgba(37, 99, 235, 0.15)',
  blueBg20: 'rgba(37, 99, 235, 0.2)',
  blueBorder20: 'rgba(37, 99, 235, 0.2)',
  blueBorder25: 'rgba(37, 99, 235, 0.25)',
  blueBorder30: 'rgba(37, 99, 235, 0.3)',
  blueBorder35: 'rgba(37, 99, 235, 0.35)',
  
  // State Colors
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.25)',
  warning: '#f97316',
  warningBg: 'rgba(249, 115, 22, 0.12)',
  error: '#ef4444',
  premium: '#a855f7',
  
  // Base Colors
  background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
  cardBg: 'rgba(23, 23, 23, 0.6)',
  glassBg: 'rgba(37, 99, 235, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(37, 99, 235, 0.3)',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)'
}

const getCardStyle = (isMobile, isHovered = false) => ({
  background: `linear-gradient(135deg, ${COLORS.blueBg10} 0%, rgba(23, 23, 23, 0.8) 100%)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${isHovered ? COLORS.blueBorder25 : COLORS.borderDefault}`,
  borderRadius: isMobile ? '12px' : '14px',
  padding: isMobile ? '1rem' : '1.25rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isHovered ? 'translateY(-2px) translateZ(0)' : 'translateZ(0)',
  boxShadow: isHovered 
    ? `0 6px 20px ${COLORS.blueBorder25}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
    : `0 4px 16px ${COLORS.blueBg15}, inset 0 1px 0 rgba(255, 255, 255, 0.03)`
})

// ============================================
// QUOTE OF THE DAY - DARK BLUE ACCENT
// ============================================
function QuoteOfDay() {
  const isMobile = useIsMobile()
  const quotes = [
    { text: "Elke dag is een nieuwe kans om je beste versie te worden.", author: "MY ARC" },
    { text: "Discipline is de brug tussen doelen en prestaties.", author: "Jim Rohn" },
    { text: "Je lichaam kan het aan. Het is je geest die je moet overtuigen.", author: "MY ARC" },
    { text: "Champions worden niet in de gym gemaakt. Ze worden gemaakt van iets diep van binnen.", author: "Muhammad Ali" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" }
  ]
  
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)])
  
  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '1rem' : '1.25rem',
      textAlign: 'center',
      borderBottom: `1px solid ${COLORS.borderDefault}`,
      background: `linear-gradient(180deg, ${COLORS.blueBg08} 0%, transparent 100%)`,
      overflow: 'hidden'
    }}>
      {/* Top accent glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${COLORS.primary} 50%, transparent 100%)`,
        opacity: 0.6,
        zIndex: 10
      }} />
      
      <p style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontStyle: 'italic',
        margin: 0,
        lineHeight: 1.6,
        fontWeight: '500',
        color: COLORS.textSecondary,
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        "{quote.text}"
      </p>
      <span style={{ 
        marginTop: '0.5rem',
        display: 'block',
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: COLORS.accentBlue,
        opacity: 0.8
      }}>
        — {quote.author}
      </span>
    </div>
  )
}

// ============================================
// WELCOME SECTION - DARK BLUE HERO CARD
// ============================================
function WelcomeSection({ client, db }) {
  const [arcScore, setArcScore] = useState(85)
  const [streak, setStreak] = useState(7)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  const getDutchDate = () => {
    const date = new Date()
    const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                    'juli', 'augustus', 'september', 'oktober', 'november', 'december']
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }
  
  useEffect(() => {
    loadWelcomeData()
  }, [client?.id])
  
  const loadWelcomeData = async () => {
    if (!client?.id) return
    
    try {
      setArcScore(Math.floor(Math.random() * 30) + 70)
      setStreak(Math.floor(Math.random() * 14) + 1)
    } catch (error) {
      console.error('Error loading welcome data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getTimeIcon = () => {
    const hour = new Date().getHours()
    if (hour < 6) return <Moon size={isMobile ? 18 : 20} />
    if (hour < 12) return <Coffee size={isMobile ? 18 : 20} />
    if (hour < 18) return <Sun size={isMobile ? 18 : 20} />
    return <Moon size={isMobile ? 18 : 20} />
  }
  
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Goedemorgen! Klaar voor een productieve dag?"
    if (hour < 18) return "Goedemiddag! Blijf gefocust op je doelen!"
    return "Goedenavond! Tijd om te reflecteren op je progress!"
  }
  
  return (
    <div style={{
      position: 'relative',
      margin: isMobile ? '1rem' : '1.5rem',
      padding: isMobile ? '1.25rem' : '1.5rem',
      borderRadius: isMobile ? '16px' : '20px',
      background: `linear-gradient(135deg, ${COLORS.blueBg20} 0%, ${COLORS.primaryDark}10 100%)`,
      border: `2px solid ${COLORS.blueBorder30}`,
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px ${COLORS.blueBorder20}`,
      overflow: 'hidden',
      transform: 'translateZ(0)'
    }}>
      {/* Top accent glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${COLORS.primary} 50%, transparent 100%)`,
        opacity: 0.6,
        zIndex: 10
      }} />
      
      {/* Floating gradient orb */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: isMobile ? '200px' : '300px',
        height: isMobile ? '200px' : '300px',
        background: `radial-gradient(circle, ${COLORS.blueBg20} 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          color: COLORS.accentBlue
        }}>
          {getTimeIcon()}
          <span style={{ 
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            letterSpacing: '0.02em'
          }}>
            Welkom terug, {client?.first_name || 'Champion'}!
          </span>
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.4rem' : '1.75rem',
          fontWeight: '700',
          color: COLORS.textPrimary,
          marginBottom: '0.5rem',
          lineHeight: 1.2
        }}>
          {getWelcomeMessage()}
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: COLORS.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={isMobile ? 14 : 16} />
          {getDutchDate()}
        </p>
      </div>
    </div>
  )
}

// ============================================
// QUICK ACTIONS - DARK BLUE CARDS
// ============================================
function QuickActions({ client, db, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [hoveredAction, setHoveredAction] = useState(null)
  const isMobile = useIsMobile()
  
  // Action configs with state colors
  const actionConfigs = [
    {
      icon: Dumbbell,
      key: 'workout',
      color: COLORS.warning,
      label: 'Workout',
      sublabel: 'Start training',
      navigate: 'workout'
    },
    {
      icon: Apple,
      key: 'nutrition',
      color: COLORS.success,
      label: 'Voeding',
      sublabel: 'Track maaltijden',
      navigate: 'meal'
    },
    {
      icon: ShoppingCart,
      key: 'shopping',
      color: '#ec4899',
      label: 'Boodschappen',
      sublabel: 'Shopping lijst',
      navigate: 'boodschappen'
    },
    {
      icon: TrendingUp,
      key: 'tracking',
      color: COLORS.premium,
      label: 'Tracking',
      sublabel: 'Progress inzien',
      navigate: 'tracking'
    },
    {
      icon: Phone,
      key: 'call',
      color: COLORS.accentBlue,
      label: 'Coach Call',
      sublabel: 'Plan gesprek',
      navigate: 'calls'
    },
    {
      icon: User,
      key: 'profile',
      color: '#06b6d4',
      label: 'Profiel',
      sublabel: 'Instellingen',
      navigate: 'profile'
    }
  ]
  
  return (
    <div style={{
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.15rem',
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Zap size={isMobile ? 16 : 18} color={COLORS.accentBlue} />
        Quick Actions
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {actionConfigs.map((action) => {
          const Icon = action.icon
          const isHovered = hoveredAction === action.key
          
          return (
            <button
              key={action.key}
              onClick={() => onNavigate(action.navigate)}
              onMouseEnter={() => !isMobile && setHoveredAction(action.key)}
              onMouseLeave={() => !isMobile && setHoveredAction(null)}
              style={{
                position: 'relative',
                padding: isMobile ? '1rem' : '1.25rem',
                background: isHovered 
                  ? `linear-gradient(135deg, ${COLORS.blueBg12} 0%, ${COLORS.blueBg08} 100%)`
                  : `linear-gradient(135deg, ${COLORS.blueBg10} 0%, rgba(23, 23, 23, 0.8) 100%)`,
                border: `1px solid ${isHovered ? COLORS.blueBorder25 : COLORS.borderDefault}`,
                borderRadius: isMobile ? '12px' : '14px',
                backdropFilter: 'blur(12px)',
                boxShadow: isHovered
                  ? `0 6px 20px ${COLORS.blueBg20}`
                  : `0 4px 16px ${COLORS.blueBg15}`,
                cursor: 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: isMobile ? '100px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transform: isHovered ? 'translateY(-2px) translateZ(0)' : 'translateZ(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.blueBg15} 0%, ${COLORS.blueBg10} 100%)`
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.blueBg10} 0%, rgba(23, 23, 23, 0.8) 100%)`
                }
              }}
            >
              {/* Top accent line for hovered state */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent 0%, ${action.color} 50%, transparent 100%)`,
                  opacity: 0.6,
                  zIndex: 10
                }} />
              )}
              
              {/* Icon Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: isMobile ? '40px' : '44px',
                  height: isMobile ? '40px' : '44px',
                  borderRadius: isMobile ? '10px' : '12px',
                  background: `linear-gradient(135deg, ${action.color}20 0%, ${action.color}10 100%)`,
                  border: `1px solid ${action.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon 
                    size={isMobile ? 18 : 20} 
                    color={action.color}
                    style={{
                      transition: 'all 0.3s ease',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      filter: isHovered ? `drop-shadow(0 0 8px ${action.color}50)` : 'none'
                    }}
                  />
                </div>
                
                <ChevronRight 
                  size={14} 
                  color={action.color}
                  style={{ 
                    opacity: isHovered ? 0.8 : 0.4,
                    transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'all 0.3s ease'
                  }} 
                />
              </div>
              
              {/* Content */}
              <div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '700',
                  color: COLORS.textPrimary,
                  marginBottom: '0.25rem'
                }}>
                  {action.label}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: COLORS.textMuted,
                  lineHeight: 1.3
                }}>
                  {action.sublabel}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MAIN CLIENT HOME COMPONENT
// ============================================
export default function ClientHome({ client, db, setCurrentView }) {
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  useEffect(() => {
    setTimeout(() => setLoading(false), 300)
  }, [])
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `3px solid ${COLORS.borderDefault}`,
            borderTopColor: COLORS.primary,
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ 
            color: COLORS.textSecondary, 
            fontSize: isMobile ? '0.85rem' : '0.9rem' 
          }}>
            Dashboard laden...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: '2rem',
      background: COLORS.background
    }}>
      {/* CHALLENGE BANNER */}
      <ChallengeHomeBanner db={db} client={client} />
      
      {/* Quote of the Day */}
      <QuoteOfDay />
      
      {/* Welcome Section */}
      <WelcomeSection client={client} db={db} />
      
      
      {/* Video Widget */}
      <div style={{ 
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="home"
          title="Coach Video's"
          compact={true}
        />
      </div>
      
      {/* Coaching Calls Widget */}
      <div style={{ 
        padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem' 
      }}>
        <ClientCallsWidget 
          client={client} 
          onNavigate={setCurrentView}
        />
      </div>

 {/* Motivation Quote Slider */}
      <MotivationQuoteSlider />


      
      {/* Quick Actions */}
      <QuickActions client={client} db={db} onNavigate={setCurrentView} />
      
      {/* Floating Action Panel */}
      <FloatingActionPanel 
        db={db}
        client={client}
        onNavigate={setCurrentView}
      />
      
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
