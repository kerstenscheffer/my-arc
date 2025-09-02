
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
import GoalsWidget from '../widgets/Goalswidget'  // FIX: kleine 'w' in Goalswidget.jsx
import PageVideoWidget from '../../modules/videos/PageVideoWidget'  // CORRECTE PAD: modules folder
// ============================================
// QUOTE OF THE DAY COMPONENT - PREMIUM GRADIENT TEXT
// ============================================
function QuoteOfDay() {
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
      padding: '0.75rem 1rem',
      textAlign: 'center',
      position: 'relative'
    }}>
      <p style={{
        fontSize: '0.95rem',
        fontStyle: 'italic',
        margin: 0,
        lineHeight: 1.6,
        fontWeight: '500',
        letterSpacing: '0.2px',
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.4) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(139, 92, 246, 0.4) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        MozBackgroundClip: 'text',
        MozTextFillColor: 'transparent',
        animation: 'gradientShift 8s ease-in-out infinite',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'inline-block'
      }}>
        "{quote.text}"
      </p>
      <span style={{ 
        marginTop: '0.35rem',
        display: 'block',
        fontSize: '0.7rem',
        fontWeight: '500',
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        color: 'rgba(139, 92, 246, 0.3)'
      }}>
        — {quote.author}
      </span>
    </div>
  )
}
// ============================================
// WELCOME SECTION WITH ARC SCORE
// ============================================
function WelcomeSection({ client, db }) {
  const [arcScore, setArcScore] = useState(85)
  const [streak, setStreak] = useState(7)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  // Get current date in Dutch format
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
      // Simulate loading ARC score
      // In productie: await db.getClientProgress(client.id)
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
    if (hour < 6) return <Moon size={20} />
    if (hour < 12) return <Coffee size={20} />
    if (hour < 18) return <Sun size={20} />
    return <Moon size={20} />
  }
  
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Goedemorgen! Klaar voor een productieve dag?"
    if (hour < 18) return "Goedemiddag! Blijf gefocust op je doelen!"
    return "Goedenavond! Tijd om te reflecteren op je progress!"
  }
  
  const renderProgressRing = (progress, color, size = 80) => {
    const radius = (size - 8) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference
    
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ 
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color}44)`,
            opacity: 0.9
          }}
        />
      </svg>
    )
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
      borderRadius: isMobile ? '16px' : '24px',
      padding: isMobile ? '1.5rem 1rem' : '2rem',
      margin: '1rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      opacity: 0.95
    }}>
      {/* Animated Background Patterns */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header with greeting */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          color: 'rgba(255,255,255,0.95)',
          fontSize: isMobile ? '0.875rem' : '0.95rem'
        }}>
          {getTimeIcon()}
          <span>Welkom terug, {client?.name || client?.full_name || 'Champion'}!</span>
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '0.5rem',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          lineHeight: 1.2
        }}>
          {getWelcomeMessage()}
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={isMobile ? 16 : 18} />
          {getDutchDate()}
        </p>
      </div>
    </div>
  )
}
// ============================================
// QUICK ACTIONS COMPONENT - GOALS CARD STYLING
// ============================================
function QuickActions({ client, db, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [hoveredAction, setHoveredAction] = useState(null)
  const isMobile = useIsMobile()
  
  const actionConfigs = [
    {
      icon: Dumbbell,
      key: 'workout',
      gradient: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(146, 64, 14, 0.15) 100%)',
      color: '#f59e0b',
      label: 'Workout',
      sublabel: 'Start vandaag',
      navigate: 'workout',
      delay: 0
    },
    {
      icon: Apple,
      key: 'nutrition',
      gradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.15) 100%)',
      color: '#10b981',
      label: 'Voeding',
      sublabel: 'Track maaltijden',
      navigate: 'mealplan',
      delay: 50
    },
    {
      icon: Phone,
      key: 'call',
      gradient: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 64, 175, 0.15) 100%)',
      color: '#3b82f6',
      label: 'Coach Call',
      sublabel: 'Plan gesprek',
      navigate: 'calls',
      delay: 100
    },
    {
      icon: Target,
      key: 'goals',
      gradient: 'linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(88, 28, 135, 0.15) 100%)',
      color: '#8b5cf6',
      label: 'Doelen',
      sublabel: 'Bekijk progress',
      navigate: 'progress',
      delay: 150
    },
    {
      icon: ShoppingCart,
      key: 'shopping',
      gradient: 'linear-gradient(135deg, rgba(190, 24, 93, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(190, 24, 93, 0.15) 100%)',
      color: '#ec4899',
      label: 'Boodschappen',
      sublabel: 'Weeklijst',
      navigate: 'shopping',
      delay: 200
    },
    {
      icon: User,
      key: 'profile',
      gradient: 'linear-gradient(135deg, rgba(8, 145, 178, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.15) 100%)',
      color: '#06b6d4',
      label: 'Profiel',
      sublabel: 'Instellingen',
      navigate: 'profile',
      delay: 250
    }
  ]
  
  return (
    <div style={{
      padding: '0 1rem',
      marginBottom: '2rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Zap size={isMobile ? 18 : 20} color="#f59e0b" />
        Quick Actions
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {actionConfigs.map((action, index) => {
          const Icon = action.icon
          const isHovered = hoveredAction === action.key
          
          return (
            <button
              key={index}
              onClick={() => onNavigate(action.navigate)}
              onMouseEnter={() => setHoveredAction(action.key)}
              onMouseLeave={() => setHoveredAction(null)}
              style={{
                background: isHovered ? action.gradient : action.lightGradient,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isHovered ? action.color + '40' : 'rgba(139, 92, 246, 0.15)'}`,
                borderRadius: '16px',
                padding: isMobile ? '1.25rem' : '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered 
                  ? `0 15px 40px ${action.color}25` 
                  : `0 10px 30px rgba(0, 0, 0, 0.1)`,
                animation: `slideInUp ${300 + action.delay}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                opacity: 0,
                minHeight: '140px'
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                  e.currentTarget.style.background = action.gradient
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = action.lightGradient
                }
              }}
            >
              {/* Decorative circle background like goal cards */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: action.gradient,
                opacity: 0.1
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Category-style label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <Icon size={16} color={action.color} />
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: action.color,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {action.label}
                  </span>
                </div>
                
                {/* Main content */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.35rem'
                    }}>
                      {action.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
                      lineHeight: 1.4
                    }}>
                      {action.sublabel}
                    </div>
                  </div>
                  
                  {/* Icon box like goal cards have progress ring */}
                  <div style={{
                    width: isMobile ? '40px' : '44px',
                    height: isMobile ? '40px' : '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${action.color}30 0%, ${action.color}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <Icon 
                      size={isMobile ? 20 : 22} 
                      color={action.color}
                      style={{
                        animation: isHovered ? 'iconBounce 0.6s ease' : 'none'
                      }}
                    />
                  </div>
                </div>
                
                {/* Bottom action hint */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  zIndex: 1,
                  marginTop: '0.5rem'
                }}>
                  <ChevronRight 
                    size={16} 
                    color={isHovered ? '#fff' : action.color}
                    style={{ 
                      opacity: isHovered ? 0.9 : 0.7,
                      transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                      transition: 'all 0.3s ease'
                    }} 
                  />
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
  const isMobile = useIsMobile()  // TOEGEVOEGD voor PageVideoWidget
  
  useEffect(() => {
    // Quick loading for smooth transition
    setTimeout(() => setLoading(false), 500)
  }, [])
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Loading your dashboard...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: '2rem',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)'
    }}>
      {/* 1. Quote of the Day - BOVENAAN */}
      <QuoteOfDay />
      
      {/* 2. Welcome Section (Goedemorgen card) */}
      <WelcomeSection client={client} db={db} />
      
      {/* 3. Video Widget - NIEUWE PAGEVIDEOWIDGET */}
      <div style={{ 
        paddingTop: isMobile ? '1rem' : '1.5rem',
        paddingLeft: isMobile ? '1rem' : '1.5rem',
        paddingRight: isMobile ? '1rem' : '1.5rem',
        paddingBottom: '0.5rem',
        position: 'relative',
        zIndex: 10,
        marginBottom: '0.5rem'
      }}>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="home"
          title="Coach Video's"
          compact={true}
        />
      </div>
      
      {/* 4. Coaching Calls Widget */}
      <div style={{ margin: '0 1rem 1rem' }}>
        <ClientCallsWidget 
          client={client} 
          onNavigate={setCurrentView}
        />
      </div>
      
      {/* 5. Goals Widget */}
      <div style={{ margin: '0 1rem 1rem' }}>
        <GoalsWidget
          client={client}
          db={db}
          onNavigateToGoals={() => setCurrentView('progress')}
        />
      </div>
      {/* 6. Quick Actions - ONDERAAN */}
      <QuickActions client={client} db={db} onNavigate={setCurrentView} />
      
      {/* Coach Message Popup REMOVED as requested */}
      
      {/* Add CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
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
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.3;
          }
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-2px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(2px);
          }
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}


