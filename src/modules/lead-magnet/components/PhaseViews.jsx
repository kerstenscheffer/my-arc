// src/modules/lead-magnet/components/PhaseViews.jsx
// COMPLETE PHASE VIEWS - Alle 7 fasen volledig uitgewerkt

import { useState } from 'react'
import { Target, MessageCircle, Phone, TrendingUp, AlertCircle, Flame, Trophy, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import MessageCard from './MessageCard'

const isMobile = window.innerWidth <= 768

// ==========================================
// INTRO SCREEN
// ==========================================

export function IntroScreen({ onSelectPhase }) {
  const phases = [
    { id: 'openers', icon: Target, color: '#10b981', title: 'Opening', desc: '30 berichten - Dikker/Dunner/Sporter/Neutral' },
    { id: 'qualify', icon: MessageCircle, color: '#3b82f6', title: 'Qualify', desc: '40 berichten - 7 categorieën met call triggers' },
    { id: 'callPush', icon: Phone, color: '#8b5cf6', title: 'Call Push', desc: '14 berichten - Soft/Direct/Logical/Urgency' },
    { id: 'bezwaren', icon: AlertCircle, color: '#ef4444', title: 'Bezwaren', desc: '34 berichten - 7 objectie types' },
    { id: 'followUp', icon: TrendingUp, color: '#f59e0b', title: 'Follow-up', desc: '11 berichten - Timeline gebaseerd' },
    { id: 'waarde', icon: Flame, color: '#ec4899', title: 'Waarde', desc: '14 tips & facts voor bonding' },
    { id: 'callAdmin', icon: Trophy, color: '#06b6d4', title: 'Call Admin', desc: '22 berichten - Reminders/No-shows' }
  ]
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '2rem' : '3rem',
        padding: isMobile ? '1.5rem 1rem' : '2rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '2.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          DM Message Flow
        </h1>
        <p style={{
          fontSize: isMobile ? '0.95rem' : '1.1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: '500',
          marginBottom: '1.5rem'
        }}>
          120+ berichten - Idiot-proof systeem voor perfecte DM sales
        </p>
        
        {/* Rules */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '1rem' : '1.5rem',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              letterSpacing: '0.05em'
            }}>
              📋 Systeem Regels
            </div>
            {[
              '1️⃣ KIES SCENARIO - Dikker/Dunner/Sporter/Neutral',
              '2️⃣ TAP BERICHT = KOPIËREN - Plak in Instagram DM',
              '3️⃣ LET OP CALL TRIGGER - 🟡 Medium / 🟢 Hoog',
              '4️⃣ VOLG DE SUGGESTIES - Systeem zegt wat logisch is',
              '5️⃣ "SELL THE EXIT" ALTIJD - Geef hen controle'
            ].map((rule, i) => (
              <div key={i} style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem',
                fontWeight: '500',
                lineHeight: '1.5'
              }}>
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Phase cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 1rem' : '0 2rem'
      }}>
        {phases.map(phase => (
          <div
            key={phase.id}
            onClick={() => onSelectPhase(phase.id)}
            style={{
              background: `linear-gradient(135deg, ${phase.color}15 0%, ${phase.color}08 100%)`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${phase.color}40`,
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateZ(0)',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 12px 32px ${phase.color}30`
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {/* Shine */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  background: `${phase.color}20`,
                  border: `1px solid ${phase.color}60`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${phase.color}40`
                }}>
                  <phase.icon 
                    size={isMobile ? 20 : 24} 
                    color={phase.color}
                    strokeWidth={2.5}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {phase.title}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '500'
                  }}>
                    {phase.desc}
                  </div>
                </div>
                <ArrowRight 
                  size={isMobile ? 18 : 20} 
                  color={phase.color}
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// OPENERS VIEW (scenario selection)
// ==========================================

export function OpenersView({ messages, onCopy, copiedId, onBack }) {
  const [selectedScenario, setSelectedScenario] = useState(null)
  
  const scenarios = [
    { id: 'dikker', label: 'Dikker Profiel', emoji: '💪', color: '#10b981', count: messages.openers.dikker.length },
    { id: 'dunner', label: 'Dunner Profiel', emoji: '📈', color: '#3b82f6', count: messages.openers.dunner.length },
    { id: 'sporter', label: 'Sporter Profiel', emoji: '⚽', color: '#8b5cf6', count: messages.openers.sporter.length },
    { id: 'neutral', label: 'Neutraal/Onbekend', emoji: '🎯', color: '#f59e0b', count: messages.openers.neutral.length }
  ]
  
  if (!selectedScenario) {
    return (
      <div>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          ← Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Kies Scenario
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {scenarios.map(scenario => (
            <div
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              style={{
                background: `linear-gradient(135deg, ${scenario.color}15 0%, ${scenario.color}08 100%)`,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${scenario.color}40`,
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.5rem' : '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                  {scenario.emoji}
                </div>
                <div style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  {scenario.label}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600'
                }}>
                  {scenario.count} berichten
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Show messages for selected scenario
  const selectedMessages = messages.openers[selectedScenario]
  const scenario = scenarios.find(s => s.id === selectedScenario)
  
  return (
    <div>
      <button
        onClick={() => setSelectedScenario(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug naar scenarios
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: scenario.color,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {scenario.emoji} {scenario.label}
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {selectedMessages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onCopy={onCopy}
            isCopied={copiedId === msg.id}
            color={scenario.color}
          />
        ))}
      </div>
    </div>
  )
}

// ==========================================
// QUALIFY VIEW (expandable categories met triggers)
// ==========================================

export function QualifyView({ messages, onCopy, copiedId, onBack }) {
  const [expandedCategories, setExpandedCategories] = useState({})
  
  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }
  
  const categories = [
    { id: 'afvallen', label: 'Afvallen Vragen', emoji: '⚖️', data: messages.qualify.afvallen },
    { id: 'spieren', label: 'Spieren Opbouwen', emoji: '💪', data: messages.qualify.spieren },
    { id: 'sport', label: 'Sport Performance', emoji: '⚽', data: messages.qualify.sport },
    { id: 'vast', label: 'Vastgelopen (PAIN!)', emoji: '🔥', data: messages.qualify.vast },
    { id: 'gevoel', label: 'Op Gevoel Eten', emoji: '🤔', data: messages.qualify.gevoel },
    { id: 'trackt', label: 'Trackt Al', emoji: '📊', data: messages.qualify.trackt },
    { id: 'painDeepen', label: 'Pain Deepening', emoji: '🎯', data: messages.qualify.painDeepen }
  ]
  
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: '#3b82f6',
        marginBottom: '1.5rem'
      }}>
        💬 Qualify Vragen
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {categories.map(cat => {
          const isExpanded = expandedCategories[cat.id]
          const triggerColor = cat.data.trigger === '🟢' ? '#10b981' : '#f59e0b'
          
          return (
            <div key={cat.id}>
              {/* Category header */}
              <div
                onClick={() => toggleCategory(cat.id)}
                style={{
                  background: `linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)`,
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: isMobile ? '12px' : '14px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                      {cat.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: isMobile ? '0.95rem' : '1.05rem',
                        fontWeight: '800',
                        color: '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {cat.label}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        fontWeight: '700',
                        color: triggerColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {cat.data.trigger} {cat.data.triggerLabel} • {cat.data.messages.length} berichten
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: isMobile ? '28px' : '32px',
                    height: isMobile ? '28px' : '32px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isExpanded ? (
                      <ChevronUp size={isMobile ? 16 : 18} color="#3b82f6" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown size={isMobile ? 16 : 18} color="#3b82f6" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded messages */}
              {isExpanded && (
                <div style={{
                  marginTop: isMobile ? '0.75rem' : '1rem',
                  marginLeft: isMobile ? '0' : '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '0.75rem' : '0.875rem'
                }}>
                  {cat.data.messages.map(msg => (
                    <MessageCard
                      key={msg.id}
                      message={msg}
                      onCopy={onCopy}
                      isCopied={copiedId === msg.id}
                      color="#3b82f6"
                      trigger={cat.data.trigger}
                      triggerLabel={cat.data.triggerLabel}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================
// CALL PUSH VIEW (4 stijlen)
// ==========================================

export function CallPushView({ messages, onCopy, copiedId, onBack }) {
  const [selectedStyle, setSelectedStyle] = useState(null)
  
  const styles = [
    { id: 'soft', label: 'Soft Approach', emoji: '🤝', color: '#10b981', desc: 'Vriendelijk aanbieden', count: messages.callPush.soft.length },
    { id: 'direct', label: 'Direct Push', emoji: '🎯', color: '#8b5cf6', desc: 'Gewoon vragen', count: messages.callPush.direct.length },
    { id: 'logical', label: 'Logical Frame', emoji: '🧠', color: '#3b82f6', desc: 'Rationeel argument', count: messages.callPush.logical.length },
    { id: 'urgency', label: 'Urgency Create', emoji: '⏰', color: '#ef4444', desc: 'Schaarste creëren', count: messages.callPush.urgency.length }
  ]
  
  if (!selectedStyle) {
    return (
      <div>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          ← Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          📞 Kies Call Push Stijl
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {styles.map(style => (
            <div
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              style={{
                background: `linear-gradient(135deg, ${style.color}15 0%, ${style.color}08 100%)`,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${style.color}40`,
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.5rem' : '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: isMobile ? '2rem' : '2.5rem' }}>
                    {style.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? '1rem' : '1.15rem',
                      fontWeight: '800',
                      color: '#fff',
                      marginBottom: '0.25rem'
                    }}>
                      {style.label}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '500'
                    }}>
                      {style.desc}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: style.color,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {style.count} berichten
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const selectedMessages = messages.callPush[selectedStyle]
  const style = styles.find(s => s.id === selectedStyle)
  
  return (
    <div>
      <button
        onClick={() => setSelectedStyle(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug naar stijlen
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: style.color,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {style.emoji} {style.label}
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {selectedMessages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onCopy={onCopy}
            isCopied={copiedId === msg.id}
            color={style.color}
          />
        ))}
      </div>
    </div>
  )
}

// ==========================================
// BEZWAREN VIEW (7 objectie types)
// ==========================================

export function BezwarenView({ messages, onCopy, copiedId, onBack }) {
  const [selectedType, setSelectedType] = useState(null)
  
  const types = [
    { id: 'nadenken', label: 'Moet Nadenken', emoji: '🤔', color: '#f59e0b', count: messages.bezwaren.nadenken.length },
    { id: 'geenTijd', label: 'Geen Tijd', emoji: '⏰', color: '#ef4444', count: messages.bezwaren.geenTijd.length },
    { id: 'zelfProberen', label: 'Zelf Proberen', emoji: '💪', color: '#8b5cf6', count: messages.bezwaren.zelfProberen.length },
    { id: 'teDuur', label: 'Te Duur', emoji: '💰', color: '#10b981', count: messages.bezwaren.teDuur.length },
    { id: 'later', label: 'Misschien Later', emoji: '📅', color: '#3b82f6', count: messages.bezwaren.later.length },
    { id: 'viaChat', label: 'Via Chat Liever', emoji: '💬', color: '#ec4899', count: messages.bezwaren.viaChat.length },
    { id: 'salesPitch', label: 'Is Dit Sales?', emoji: '🎯', color: '#06b6d4', count: messages.bezwaren.salesPitch.length }
  ]
  
  if (!selectedType) {
    return (
      <div>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          ← Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          🚧 Kies Bezwaar Type
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {types.map(type => (
            <div
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                background: `linear-gradient(135deg, ${type.color}15 0%, ${type.color}08 100%)`,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${type.color}40`,
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.25rem' : '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: isMobile ? '1.75rem' : '2rem' }}>
                  {type.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {type.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: type.color,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {type.count} responses
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const selectedMessages = messages.bezwaren[selectedType]
  const type = types.find(t => t.id === selectedType)
  
  return (
    <div>
      <button
        onClick={() => setSelectedType(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug naar bezwaren
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: type.color,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {type.emoji} {type.label}
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {selectedMessages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onCopy={onCopy}
            isCopied={copiedId === msg.id}
            color={type.color}
          />
        ))}
      </div>
    </div>
  )
}

// ==========================================
// CALL ADMIN VIEW (5 categorieën)
// ==========================================

export function CallAdminView({ messages, onCopy, copiedId, onBack }) {
  const [selectedCat, setSelectedCat] = useState(null)
  
  const categories = [
    { id: 'bevestiging', label: 'Call Bevestiging', emoji: '✅', color: '#10b981', count: messages.callAdmin.bevestiging.length },
    { id: 'reminders', label: 'Reminders', emoji: '⏰', color: '#3b82f6', count: messages.callAdmin.reminders.length },
    { id: 'noShow', label: 'No-Show Handling', emoji: '❌', color: '#ef4444', count: messages.callAdmin.noShow.length },
    { id: 'reschedule', label: 'Reschedule', emoji: '🔄', color: '#f59e0b', count: messages.callAdmin.reschedule.length },
    { id: 'longSilence', label: 'Lang Stilte', emoji: '🤐', color: '#8b5cf6', count: messages.callAdmin.longSilence.length }
  ]
  
  if (!selectedCat) {
    return (
      <div>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px'
          }}
        >
          ← Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          📞 Call Administratie
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              style={{
                background: `linear-gradient(135deg, ${cat.color}15 0%, ${cat.color}08 100%)`,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${cat.color}40`,
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.25rem' : '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: isMobile ? '1.75rem' : '2rem' }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {cat.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: cat.color,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {cat.count} berichten
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const selectedMessages = messages.callAdmin[selectedCat]
  const cat = categories.find(c => c.id === selectedCat)
  
  return (
    <div>
      <button
        onClick={() => setSelectedCat(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug naar categorieën
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: cat.color,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {cat.emoji} {cat.label}
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {selectedMessages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onCopy={onCopy}
            isCopied={copiedId === msg.id}
            color={cat.color}
          />
        ))}
      </div>
    </div>
  )
}

// ==========================================
// SIMPLE MESSAGE LIST (voor follow-up & waarde)
// ==========================================

export function SimpleMessageList({ messages, onCopy, copiedId, color, title, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        ← Terug
      </button>
      
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '800',
        color: color,
        marginBottom: '1.5rem'
      }}>
        {title}
      </h2>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {messages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onCopy={onCopy}
            isCopied={copiedId === msg.id}
            color={color}
          />
        ))}
      </div>
    </div>
  )
}
