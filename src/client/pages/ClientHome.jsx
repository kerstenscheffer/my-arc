// src/client/pages/ClientHome.jsx
import ChallengeHomeBanner from "../components/challenge-banner/ChallengeHomeBanner"
import React, { useState, useEffect } from 'react'
import { 
  Calendar, Dumbbell, Apple, ShoppingCart,
  TrendingUp, Phone, User, Coffee, Sun, Moon, Zap, ChevronRight
} from 'lucide-react'
import GoalsWidget from '../widgets/Goalswidget'
import PageVideoWidget from '../../modules/videos/PageVideoWidget'
import useIsMobile from '../../hooks/useIsMobile'

// Unsplash images per actie
const ACTION_IMAGES = {
  workout:      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
  meal:         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  boodschappen: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
  tracking:     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  calls:        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  profile:      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
}

// ============================================
// WELCOME SECTION
// ============================================
function WelcomeSection({ client }) {
  const isMobile = useIsMobile()
  
  const getDutchDate = () => {
    const date = new Date()
    const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
    const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                    'juli', 'augustus', 'september', 'oktober', 'november', 'december']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
  }
  
  const getTimeIcon = () => {
    const hour = new Date().getHours()
    if (hour < 6)  return <Moon size={isMobile ? 14 : 16} color="rgba(255,255,255,0.4)" />
    if (hour < 12) return <Coffee size={isMobile ? 14 : 16} color="rgba(255,255,255,0.4)" />
    if (hour < 18) return <Sun size={isMobile ? 14 : 16} color="rgba(255,255,255,0.4)" />
    return <Moon size={isMobile ? 14 : 16} color="rgba(255,255,255,0.4)" />
  }
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Goedemorgen'
    if (hour < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }
  
  return (
    <div style={{
      padding: isMobile ? '1.25rem 1rem 1rem' : '1.5rem 1.5rem 1.25rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        {getTimeIcon()}
        <span style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {getGreeting()}
        </span>
      </div>
      
      <h1 style={{
        fontSize: isMobile ? '1.5rem' : '1.75rem',
        fontWeight: '800',
        color: '#fff',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        margin: 0,
        marginBottom: '0.4rem'
      }}>
        {client?.first_name || 'Champion'}
      </h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Calendar size={isMobile ? 12 : 13} color="rgba(255,255,255,0.3)" />
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: '500'
        }}>
          {getDutchDate()}
        </span>
      </div>
    </div>
  )
}

// ============================================
// QUICK ACTIONS — IMAGE CARDS (2-kolom grid)
// ============================================
function QuickActions({ client, db, onNavigate }) {
  const isMobile = useIsMobile()

  const actions = [
    { icon: Dumbbell,     label: 'Workouts',      title: 'Je workout plan',     nav: 'workout'      },
    { icon: Apple,        label: 'Voeding',       title: 'Je maaltijd plan',    nav: 'meal'         },
    { icon: TrendingUp,   label: 'Tracking',      title: 'Je gewicht en foto\'s', nav: 'tracking'   },
    { icon: ShoppingCart, label: 'Boodschappen',  title: 'Je lijst en kosten',  nav: 'boodschappen' },
    { icon: Phone,        label: 'Coaching call', title: 'Plan je call',        nav: 'calls'        },
    { icon: User,         label: 'Profiel',       title: 'Instellingen',        nav: 'profile'      },
  ]

  const CARD_HEIGHT = isMobile ? 110 : 130

  return (
    <div style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {/* 2-kolom grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        background: '#0a0a0a',
        padding: '8px'
      }}>
        {actions.map((action) => {
          const Icon = action.icon
          const imgSrc = ACTION_IMAGES[action.nav]

          return (
            <button
              key={action.nav}
              onClick={() => onNavigate(action.nav)}
              style={{
                position: 'relative',
                height: `${CARD_HEIGHT}px`,
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                display: 'block'
              }}
            >
              {/* Background image */}
              <img
                src={imgSrc}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  filter: 'brightness(0.45)'
                }}
              />

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)'
              }} />

              {/* Content */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: isMobile ? '0.75rem' : '1rem'
              }}>
                {/* Gold label + icon — UPPERCASE, bovenaan */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '0.35rem',
                  marginBottom: '0.25rem'
                }}>
                  <Icon size={isMobile ? 11 : 12} color="#FFD700" />
                  <span style={{
                    fontSize: isMobile ? '0.55rem' : '0.6rem',
                    fontWeight: '800',
                    color: '#FFD700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    textAlign: 'left'
                  }}>
                    {action.label}
                  </span>
                </div>

                {/* White bold title */}
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '800',
                  color: '#fff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  textAlign: 'left'
                }}>
                  {action.title}
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
// SECTION WRAPPER
// ============================================
function SectionWrapper({ children }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.25rem' }}>
      {children}
    </div>
  )
}

// ============================================
// MAIN CLIENT HOME
// ============================================
export default function ClientHome({ client, db, setCurrentView }) {
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  useEffect(() => { setTimeout(() => setLoading(false), 300) }, [])
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            borderTopColor: '#FFD700',
            borderRadius: '50%', margin: '0 auto 0.75rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.8rem', fontWeight: '600' }}>
            Laden...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '2rem', background: '#0a0a0a' }}>

      {/* 1. Challenge Banner */}
      <ChallengeHomeBanner db={db} client={client} />

      {/* 2. Welcome */}
      <WelcomeSection client={client} />

      {/* 3. Quick Actions — image cards */}
      <QuickActions client={client} db={db} onNavigate={setCurrentView} />

      {/* 4. Video Widget */}
      <SectionWrapper>
        <PageVideoWidget
          client={client}
          db={db}
          pageContext="home"
          title="Coach Video's"
          compact={true}
        />
      </SectionWrapper>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
