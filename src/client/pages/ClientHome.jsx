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

// ============================================
// UNIFIED STYLING SYSTEM
// ============================================
const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  success: '#10b981',
  successDark: '#059669',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
  cardBg: 'rgba(17, 17, 17, 0.6)',
  glassBg: 'rgba(255, 255, 255, 0.02)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(59, 130, 246, 0.3)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)'
}

const getCardStyle = (isMobile, isHovered = false) => ({
  background: `linear-gradient(135deg, ${COLORS.glassBg} 0%, rgba(17, 17, 17, 0.4) 100%)`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${isHovered ? COLORS.borderActive : COLORS.borderDefault}`,
  borderRadius: isMobile ? '16px' : '20px',
  padding: isMobile ? '1.25rem' : '1.5rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  boxShadow: isHovered 
    ? '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    : '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
})

// ============================================
// QUOTE OF THE DAY - CLEANER DESIGN
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
      padding: isMobile ? '1rem' : '1.25rem',
      textAlign: 'center',
      borderBottom: `1px solid ${COLORS.borderDefault}`,
      background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)'
    }}>
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
        color: COLORS.primary,
        opacity: 0.7
      }}>
        — {quote.author}
      </span>
    </div>
  )
}

// ============================================
// WELCOME SECTION - PREMIUM GLASS CARD
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
      ...getCardStyle(isMobile),
      margin: isMobile ? '1rem' : '1.5rem',
      background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)`,
      borderColor: 'rgba(59, 130, 246, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating gradient orb */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: isMobile ? '200px' : '300px',
        height: isMobile ? '200px' : '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
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
          color: COLORS.primary
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
// QUICK ACTIONS - FIXED ROUTES
// ============================================
function QuickActions({ client, db, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [hoveredAction, setHoveredAction] = useState(null)
  const isMobile = useIsMobile()
  
  // FIXED ROUTES - Matching ClientDashboard exactly
  const actionConfigs = [
    {
      icon: Dumbbell,
      key: 'workout',
      color: COLORS.warning,
      label: 'Workout',
      sublabel: 'Start training',
      navigate: 'workout' // ✅ Correct
    },
    {
      icon: Apple,
      key: 'nutrition',
      color: COLORS.success,
      label: 'Voeding',
      sublabel: 'Track maaltijden',
      navigate: 'meal' // ✅ FIXED: was 'mealplan'
    },
    {
      icon: ShoppingCart,
      key: 'shopping',
      color: '#ec4899',
      label: 'Boodschappen',
      sublabel: 'Shopping lijst',
      navigate: 'boodschappen' // ✅ NEW: Added shopping
    },
    {
      icon: TrendingUp,
      key: 'tracking',
      color: COLORS.purple,
      label: 'Tracking',
      sublabel: 'Bekijk progress',
      navigate: 'tracking' // ✅ FIXED: was 'progress'
    },
    {
      icon: Phone,
      key: 'call',
      color: COLORS.primary,
      label: 'Coach Call',
      sublabel: 'Plan gesprek',
      navigate: 'calls' // ✅ Correct
    },
    {
      icon: User,
      key: 'profile',
      color: '#06b6d4',
      label: 'Profiel',
      sublabel: 'Instellingen',
      navigate: 'profile' // ✅ Correct
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
        <Zap size={isMobile ? 16 : 18} color={COLORS.primary} />
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
              onMouseEnter={() => setHoveredAction(action.key)}
              onMouseLeave={() => setHoveredAction(null)}
              style={{
                ...getCardStyle(isMobile, isHovered),
                padding: isMobile ? '1rem' : '1.25rem',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: isMobile ? '100px' : '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {/* Icon Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  borderRadius: '10px',
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
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
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
      
      
      {/* Quick Actions - WITH FIXED ROUTES */}
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
