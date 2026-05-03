// src/modules/sales/components/DMTraining.jsx
// DM Flow Training - Simplified 9-step system with ghost modal
// Toggle between Simple Flow (new) and Extended Flow (legacy)

import { useState } from 'react'
import { BookOpen, Copy, Check, RotateCcw, Ghost, X, ChevronDown, AlertTriangle, Zap } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

// Legacy imports (Extended Flow)
import OpeningPhase from './dm-training/OpeningPhase'
import InteresseCheckPhase from './dm-training/InteresseCheckPhase'
import StrugglePhase from './dm-training/StrugglePhase'
import LeadMagnetPhase from './dm-training/LeadMagnetPhase'
import GapVerdiepingPhase from './dm-training/GapVerdiepingPhase'
import ImpactCallPushPhase from './dm-training/ImpactCallPushPhase'
import BookingPhase from './dm-training/BookingPhase'
import DMMessageBuilder from './dm-training/DMMessageBuilder'

// ============================================
// DM FLOW DATA - All 9 steps + ghost messages
// ============================================

const DM_STEPS = [
  {
    id: 1,
    title: 'Qualificeer',
    subtitle: 'Check of ze trainen',
    icon: '💬',
    color: '#3b82f6',
    messages: [
      {
        id: 'step1-main',
        label: 'Opening',
        defaultText: 'Heyy [naam]! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Hoe lang train je al?'
      }
    ]
  },
  {
    id: 2,
    title: 'Doel',
    subtitle: 'Wat willen ze bereiken',
    icon: '🎯',
    color: '#10b981',
    messages: [
      {
        id: 'step2-main',
        label: 'Doel vraag',
        defaultText: 'Nice man! Lekker bezig. Waar ben je naartoe aan het werken qua doel?'
      },
      {
        id: 'step2b-vaag',
        label: 'Bij vaag antwoord',
        defaultText: 'Top man! Veel jongens beginnen daarmee. Maar wat zou je echt willen als je het concreet maakt? Bijv een bepaald gewicht, een bepaalde shape, iets specifieks?',
        isVariant: true,
        variantLabel: 'VAAG ANTWOORD'
      }
    ]
  },
  {
    id: 3,
    title: 'Struggle',
    subtitle: 'Waar lopen ze tegenaan',
    icon: '🔍',
    color: '#f59e0b',
    messages: [
      {
        id: 'step3-main',
        label: 'Struggle check',
        defaultText: 'Mooi doel man! Vaak halen de mensen die doelen zetten de beste resultaten man.\n\nDat doe ik ook al sinds het begin, ook al had ik toen nog veel moeite met progressie maken haha. 🙈\n\nHoe gaat dat tot nu toe bij jou, zijn er nog dingen waar jij tegenaan loopt?'
      },
      {
        id: 'step3b-geen',
        label: 'Gaat lekker',
        defaultText: 'Ah top man! Mooi om te horen. Hoe zit het met je voeding? Weet je hoeveel je moet eten om je doel te halen?',
        isVariant: true,
        variantLabel: 'GEEN STRUGGLE'
      }
    ]
  },
  {
    id: 4,
    title: 'Dieper',
    subtitle: 'Impact laten voelen',
    icon: '💥',
    color: '#ec4899',
    messages: [
      {
        id: 'step4-main',
        label: 'Impact vraag',
        defaultText: 'Snap ik helemaal man, dat had ik zelf ook. En merk je dat het je tegenhoud om je doel te halen?'
      }
    ]
  },
  {
    id: 5,
    title: 'Call Push 1',
    subtitle: 'Meekijken voorstel',
    icon: '🤝',
    color: '#8b5cf6',
    messages: [
      {
        id: 'step5-main',
        label: 'Meekijken aanbod',
        defaultText: 'Ja dat hoor ik vaker man. Zal ik eens even snel met je meekijken naar wat jij nodig hebt om dat doel te halen?\n\nDan kan ik je ook meenemen in hoe ik daarbij zou kunnen helpen als dat nodig is. Zo niet loop je weg met een plan om je doel te gaan behalen. 💪'
      }
    ]
  },
  {
    id: 6,
    title: 'Call Push 2',
    subtitle: 'Inplannen',
    icon: '📅',
    color: '#14b8a6',
    messages: [
      {
        id: 'step6a-tijden',
        label: 'Zelf tijden geven',
        defaultText: 'Perfect man! Ik kan deze week op:\n- Dinsdag 18:00\n- Woensdag 20:00\n- Vrijdag 17:00\n\nWelke past het beste voor jou?'
      },
      {
        id: 'step6b-calendly',
        label: 'Calendly',
        defaultText: 'Perfect man! Kun je hier een moment inplannen dat voor jou werkt?\n\nhttps://calendly.com/kerstenscheffer/call-met-kersten',
        isVariant: true,
        variantLabel: 'CALENDLY'
      }
    ]
  },
  {
    id: 7,
    title: 'Objectie Handling',
    subtitle: '3 veelvoorkomende objecties',
    icon: '🛡️',
    color: '#ef4444',
    messages: [
      {
        id: 'step7a-geld',
        label: 'Kost het geld?',
        defaultText: 'Nee het programma is niet gratis, maar ik help graag. Ik kijk eerst altijd wat je doel is en of je ergens tegenaan loopt.\n\nDan vertel ik je wat je nodig hebt om je doel te halen en hoe dit er in het programma voor jou uit zou zien. 🙃\n\nAls het voor beiden goed voelt doen we dat, zo niet help ik alsnog een handje in de juiste richting. 💪',
        isVariant: true,
        variantLabel: 'KOST HET GELD?'
      },
      {
        id: 'step7b-laatmaar',
        label: 'Laat maar',
        defaultText: 'Snap ik man, geen druk. Maar even eerlijk: je gaf net aan dat je tegenaan loopt tegen [struggle] en dat het je tegenhoud. Zou je dat niet graag willen aanpakken?',
        isVariant: true,
        variantLabel: 'LAAT MAAR'
      },
      {
        id: 'step7c-kosten',
        label: 'Wat zijn de kosten?',
        defaultText: 'De kosten liggen heel erg aan wat je doel is en wat je nodig hebt om daar te komen man.\n\nIk kan sowieso wel even met je meekijken naar wat jij nodig hebt om dat doel te halen. 💪\n\nDan kan ik je ook meenemen in hoe ik daarbij zou kunnen helpen. Hoe klinkt dat voor jou?',
        isVariant: true,
        variantLabel: 'WAT ZIJN DE KOSTEN?'
      }
    ]
  },
  {
    id: 8,
    title: 'Call Reminder',
    subtitle: 'Bevestiging voor de call',
    icon: '⏰',
    color: '#f97316',
    messages: [
      {
        id: 'step8-main',
        label: 'Reminder',
        defaultText: 'Heyy maat! We bellen zo om [tijd], heb er zin in! Zorg dat je een rustig plekje hebt, dan kunnen we er een goed gesprek van maken. 💪'
      }
    ]
  },
  {
    id: 9,
    title: 'Na Call',
    subtitle: 'Opvolging na gesprek',
    icon: '🏁',
    color: '#10b981',
    messages: [
      {
        id: 'step9a-welkom',
        label: 'Welkom (ja gezegd)',
        defaultText: 'Heyy [naam], super om je gesproken te hebben man. Welkom bij MY ARC, we gaan er wat moois van maken.\n\nHier is het linkje naar de betalingspagina. Lukt het om deze direct te betalen, dan kan ik alles in orde maken.\n\nhttps://www.myarcfitness.com/6month-checkout'
      },
      {
        id: 'step9b-afwijzing',
        label: 'Afwijzing (nee gezegd)',
        defaultText: 'Heyy [naam]! Jammer dat het nu niet het juiste moment is man. Ik snap het helemaal.\n\nMocht er in de toekomst iets veranderen of je loopt ergens tegenaan, stuur me gerust een berichtje. Ik help je altijd graag op weg.\n\nSucces met je doel! 💪',
        isVariant: true,
        variantLabel: 'AFWIJZING'
      }
    ]
  }
]

const GHOST_MESSAGES = [
  {
    id: 'ghost-1',
    label: 'Na opening',
    step: 'Stap 1',
    defaultText: 'Heyy [naam]! Had je mijn bericht nog gezien? 😊'
  },
  {
    id: 'ghost-2',
    label: 'Na struggle',
    step: 'Stap 3',
    defaultText: 'Heyy [naam]! Ik was benieuwd naar je antwoord, laat maar weten wanneer je tijd hebt! 💪'
  },
  {
    id: 'ghost-3',
    label: 'Na dieper',
    step: 'Stap 4',
    defaultText: 'Heyy [naam]! Wilde even checken, heb je m\'n bericht nog gezien?'
  },
  {
    id: 'ghost-4',
    label: 'Na meekijken voorstel',
    step: 'Stap 5',
    defaultText: 'Heyy [naam]! Laat maar weten of je het ziet zitten om even te bellen, dan kan ik je op weg helpen. 🤙'
  },
  {
    id: 'ghost-5',
    label: 'Na call voorstel',
    step: 'Stap 6',
    defaultText: 'Heyy [naam]! Had je m\'n bericht nog gezien over het inplannen? Laat maar weten wat voor jou werkt! 📅'
  },
  {
    id: 'ghost-6',
    label: 'Call no show',
    step: 'Stap 8',
    defaultText: 'Heyy [naam]! Ik zie dat je de call had gemist, is alles goed?\n\nIk had een paar goede ideeën voor jouw situatie. Wil je hem verzetten naar een andere tijd?'
  },
  {
    id: 'ghost-7',
    label: 'Ghost na call',
    step: 'Stap 9',
    defaultText: 'Heyy [naam]! Hoe gaat het? Wilde even checken of je nog vragen had over het programma. Laat maar weten! 🙃'
  }
]

// ============================================
// MAIN COMPONENT
// ============================================

export default function DMTraining({ isMobile }) {
  const [flowMode, setFlowMode] = useState('simple') // 'simple' | 'extended'
  const [ghostOpen, setGhostOpen] = useState(false)
  const [editedMessages, setEditedMessages] = useState({})
  const [editedGhosts, setEditedGhosts] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [expandedSteps, setExpandedSteps] = useState({})

  // Get current text for a message (edited or default)
  const getText = (msg) => editedMessages[msg.id] ?? msg.defaultText
  const getGhostText = (msg) => editedGhosts[msg.id] ?? msg.defaultText

  // Update message text
  const updateText = (id, text) => {
    setEditedMessages(prev => ({ ...prev, [id]: text }))
  }
  const updateGhostText = (id, text) => {
    setEditedGhosts(prev => ({ ...prev, [id]: text }))
  }

  // Reset to default
  const resetText = (id, defaultText) => {
    setEditedMessages(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const resetGhostText = (id) => {
    setEditedGhosts(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // Copy text
  const copyText = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Toggle step expand
  const toggleStep = (stepId) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  // Check if message has been edited
  const isEdited = (id) => editedMessages[id] !== undefined
  const isGhostEdited = (id) => editedGhosts[id] !== undefined

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '10px',
            background: `${SALES_THEME.primary}20`,
            border: `1px solid ${SALES_THEME.primary}40`
          }}>
            <BookOpen size={isMobile ? 20 : 24} color={SALES_THEME.primary} />
          </div>
          <h2 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '900',
            background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            DM Flow
          </h2>
        </div>
      </div>

      {/* Toggle Switch */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '4px',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        gap: '4px'
      }}>
        <button
          onClick={() => setFlowMode('simple')}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem' : '0.75rem',
            background: flowMode === 'simple'
              ? `linear-gradient(135deg, ${SALES_THEME.primary}25 0%, ${SALES_THEME.primary}10 100%)`
              : 'transparent',
            border: flowMode === 'simple'
              ? `1px solid ${SALES_THEME.primary}50`
              : '1px solid transparent',
            borderRadius: '8px',
            color: flowMode === 'simple' ? SALES_THEME.primary : 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Zap size={16} />
          Simpele Flow
        </button>
        <button
          onClick={() => setFlowMode('extended')}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem' : '0.75rem',
            background: flowMode === 'extended'
              ? `linear-gradient(135deg, ${SALES_THEME.primary}25 0%, ${SALES_THEME.primary}10 100%)`
              : 'transparent',
            border: flowMode === 'extended'
              ? `1px solid ${SALES_THEME.primary}50`
              : '1px solid transparent',
            borderRadius: '8px',
            color: flowMode === 'extended' ? SALES_THEME.primary : 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <BookOpen size={16} />
          Uitgebreide Flow
        </button>
      </div>

      {/* SIMPLE FLOW */}
      {flowMode === 'simple' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem', paddingBottom: '100px' }}>
          {DM_STEPS.map((step) => {
            const isExpanded = expandedSteps[step.id] !== false // default open
            
            return (
              <div
                key={step.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Step Header */}
                <button
                  onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !(prev[step.id] !== false) }))}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Step number */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? '36px' : '40px',
                      height: isMobile ? '36px' : '40px',
                      borderRadius: '10px',
                      background: `${step.color}18`,
                      border: `1px solid ${step.color}35`,
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      flexShrink: 0
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        color: '#fff',
                        lineHeight: '1.2'
                      }}>
                        {step.id}. {step.title}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontWeight: '500',
                        marginTop: '2px'
                      }}>
                        {step.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0
                  }}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {/* Step Content - Messages */}
                {isExpanded && (
                  <div style={{
                    padding: isMobile ? '0 0.75rem 0.75rem' : '0 1.25rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {step.messages.map((msg) => (
                      <MessageCard
                        key={msg.id}
                        msg={msg}
                        text={getText(msg)}
                        isEdited={isEdited(msg.id)}
                        isCopied={copiedId === msg.id}
                        isMobile={isMobile}
                        stepColor={step.color}
                        onTextChange={(text) => updateText(msg.id, text)}
                        onCopy={() => copyText(getText(msg), msg.id)}
                        onReset={() => resetText(msg.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* EXTENDED FLOW (Legacy) */}
      {flowMode === 'extended' && (
        <ExtendedFlow isMobile={isMobile} />
      )}

      {/* Floating Ghost Button */}
      {flowMode === 'simple' && (
        <button
          onClick={() => setGhostOpen(true)}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '32px',
            right: isMobile ? '16px' : '32px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 100%)',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease',
            animation: 'ghostPulse 3s ease-in-out infinite'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Ghost size={26} color="#fff" />
        </button>
      )}

      {/* Ghost Modal */}
      {ghostOpen && (
        <div
          onClick={() => setGhostOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: isMobile ? '16px 16px 0 0' : '16px',
              width: isMobile ? '100%' : '500px',
              maxHeight: isMobile ? '85vh' : '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: isMobile ? 'slideUp 0.3s ease' : 'fadeIn 0.2s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '1rem 1rem 0.75rem' : '1.25rem 1.25rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <Ghost size={18} color="#a78bfa" />
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '800',
                    color: '#fff'
                  }}>
                    Ghost Berichten
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '500'
                  }}>
                    7 follow-ups voor als je geghostd wordt
                  </div>
                </div>
              </div>
              <button
                onClick={() => setGhostOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: isMobile ? '0.75rem' : '1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {GHOST_MESSAGES.map((ghost) => (
                <GhostCard
                  key={ghost.id}
                  ghost={ghost}
                  text={getGhostText(ghost)}
                  isEdited={isGhostEdited(ghost.id)}
                  isCopied={copiedId === ghost.id}
                  isMobile={isMobile}
                  onTextChange={(text) => updateGhostText(ghost.id, text)}
                  onCopy={() => copyText(getGhostText(ghost), ghost.id)}
                  onReset={() => resetGhostText(ghost.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes ghostPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.15); }
          50% { box-shadow: 0 4px 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.25); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// MESSAGE CARD COMPONENT
// ============================================

function MessageCard({ msg, text, isEdited, isCopied, isMobile, stepColor, onTextChange, onCopy, onReset }) {
  const autoResize = (el) => {
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }

  return (
    <div style={{
      background: msg.isVariant ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.2)',
      border: msg.isVariant
        ? `1px solid ${stepColor}20`
        : '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      {/* Variant Label */}
      {msg.isVariant && (
        <div style={{
          padding: '0.375rem 0.75rem',
          background: `${stepColor}12`,
          borderBottom: `1px solid ${stepColor}20`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <AlertTriangle size={12} color={stepColor} />
          <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            color: stepColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {msg.variantLabel}
          </span>
        </div>
      )}

      {/* Message Label + Actions */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem 0.375rem' : '0.75rem 1rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {msg.label}
        </span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {/* Reset button (only show if edited) */}
          {isEdited && (
            <button
              onClick={onReset}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                fontWeight: '600',
                color: '#f87171',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Editable Textarea */}
      <div style={{
        padding: isMobile ? '0 0.75rem 0.5rem' : '0 1rem 0.5rem'
      }}>
        <textarea
          value={text}
          onChange={(e) => {
            onTextChange(e.target.value)
            autoResize(e.target)
          }}
          onFocus={(e) => {
            e.target.style.borderColor = `${stepColor}50`
            autoResize(e.target)
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          }}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: isMobile ? '0.625rem' : '0.75rem',
            background: 'rgba(0, 0, 0, 0.25)',
            border: isEdited
              ? `1px solid ${stepColor}30`
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e5e5e5',
            fontSize: isMobile ? '0.825rem' : '0.875rem',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            overflow: 'hidden'
          }}
          onInput={(e) => autoResize(e.target)}
          ref={(el) => {
            if (el) {
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }
          }}
        />
      </div>

      {/* Copy Button */}
      <div style={{
        padding: isMobile ? '0 0.75rem 0.625rem' : '0 1rem 0.75rem'
      }}>
        <button
          onClick={onCopy}
          style={{
            width: '100%',
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: isCopied
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(255, 255, 255, 0.04)',
            border: isCopied
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            color: isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Gekopieerd!' : 'Kopieer'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// GHOST CARD COMPONENT
// ============================================

function GhostCard({ ghost, text, isEdited, isCopied, isMobile, onTextChange, onCopy, onReset }) {
  return (
    <div style={{
      background: 'rgba(139, 92, 246, 0.04)',
      border: '1px solid rgba(139, 92, 246, 0.15)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      {/* Label */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem 0.375rem' : '0.75rem 1rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: '700',
            color: '#7c3aed',
            background: 'rgba(139, 92, 246, 0.15)',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {ghost.step}
          </span>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {ghost.label}
          </span>
        </div>
        {isEdited && (
          <button
            onClick={onReset}
            style={{
              padding: '0.2rem 0.4rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.6rem',
              fontWeight: '600',
              color: '#f87171',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <RotateCcw size={9} />
            Reset
          </button>
        )}
      </div>

      {/* Editable Text */}
      <div style={{ padding: isMobile ? '0 0.75rem 0.5rem' : '0 1rem 0.5rem' }}>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={(e) => e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          style={{
            width: '100%',
            minHeight: '50px',
            padding: isMobile ? '0.5rem' : '0.625rem',
            background: 'rgba(0, 0, 0, 0.25)',
            border: isEdited
              ? '1px solid rgba(139, 92, 246, 0.25)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e5e5e5',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          ref={(el) => {
            if (el) {
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }
          }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }}
        />
      </div>

      {/* Copy Button */}
      <div style={{ padding: isMobile ? '0 0.75rem 0.625rem' : '0 1rem 0.75rem' }}>
        <button
          onClick={onCopy}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: isCopied
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(255, 255, 255, 0.04)',
            border: isCopied
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: isCopied ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onTouchStart={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onTouchEnd={(e) => {
            if (isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Gekopieerd!' : 'Kopieer'}
        </button>
      </div>
    </div>
  )
}

// ============================================
// EXTENDED FLOW (Legacy wrapper)
// ============================================

function ExtendedFlow({ isMobile }) {
  const [activePhase, setActivePhase] = useState(null)

  const phases = [
    { id: 1, component: OpeningPhase, title: 'Opening', description: 'Reactie krijgen + kwalificeren', color: '#3b82f6' },
    { id: 2, component: InteresseCheckPhase, title: 'Interesse Check', description: 'Hoe bevalt het? Struggle peilen', color: '#10b981' },
    { id: 3, component: StrugglePhase, title: 'Struggle Identificeren', description: 'Waar loop je tegenaan?', color: '#f59e0b' },
    { id: 4, component: LeadMagnetPhase, title: 'Lead Magnet', description: 'Training aanbieden + versturen', color: '#8b5cf6' },
    { id: 5, component: GapVerdiepingPhase, title: 'Gap Verdieping', description: 'Struggle verder uitdiepen', color: '#ec4899' },
    { id: 6, component: ImpactCallPushPhase, title: 'Impact + Call Push', description: 'Impact voelen + 2-stappen call push', color: '#ef4444' },
    { id: 7, component: BookingPhase, title: 'Booking', description: 'Call inplannen + bevestigen', color: '#14b8a6' }
  ]

  return (
    <div>
      <div style={{ display: 'grid', gap: isMobile ? '0.75rem' : '1rem' }}>
        {phases.map(phase => {
          const PhaseComponent = phase.component
          const isActive = activePhase === phase.id

          return (
            <div
              key={phase.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: isActive ? `1px solid ${phase.color}40` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                onClick={() => setActivePhase(isActive ? null : phase.id)}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isActive ? `linear-gradient(135deg, ${phase.color}10 0%, transparent 100%)` : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px',
                    borderRadius: '10px',
                    background: `${phase.color}20`,
                    border: `1px solid ${phase.color}40`,
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '900',
                    color: phase.color
                  }}>
                    {phase.id}
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>
                      {phase.title}
                    </div>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '500' }}>
                      {phase.description}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  color: phase.color,
                  transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </div>
              </div>

              {isActive && (
                <div style={{ borderTop: `1px solid ${phase.color}20` }}>
                  <PhaseComponent isMobile={isMobile} color={phase.color} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DMMessageBuilder isMobile={isMobile} />
    </div>
  )
}
