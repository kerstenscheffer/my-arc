// src/modules/client-checkin/components/SectionCard.jsx
// Section card met: Score Slider + Struggles + Afspraken + Coach Notes
// Features: Collapsible, gold theme, mobile optimized

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, Target, MessageSquare, HelpCircle } from 'lucide-react'
import ScoreSlider from './ScoreSlider'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Gespreksvragen per sectie
const SECTION_QUESTIONS = {
  voeding: [
    "Neem me eens mee in een typische eetdag - wat eet je van ontbijt tot avond?",
    "Hoeveel eiwit denk je dat je gemiddeld per dag binnenkrijgt?",
    "Zijn er specifieke momenten op de dag waarop je moeite hebt met gezond eten?",
    "Hoe vaak heb je deze week iets gegeten wat niet in je plan stond?",
    "Wat was je grootste voedingsuitdaging deze week?"
  ],
  weekend: [
    "Hoeveel alcoholische drankjes heb je dit weekend gedronken?",
    "Waren er sociale events die het lastig maakten om op schema te blijven?",
    "Hoe zag je eetpatroon er in het weekend uit vergeleken met doordeweeks?",
    "Wat is je grootste weekend-valkuil: alcohol, snacken, of grote porties?",
    "Had je dit weekend een plan of ging je op gevoel?"
  ],
  slaap: [
    "Hoe laat ging je gemiddeld naar bed en hoe laat stond je op?",
    "Hoe lang duurde het meestal voordat je in slaap viel?",
    "Werd je 's nachts wakker? Zo ja, hoe vaak?",
    "Hoe voelde je je 's ochtends bij het opstaan - uitgerust of nog moe?",
    "Wat deed je in het uur voordat je ging slapen?"
  ],
  training: [
    "Hoeveel trainingen heb je gedaan van de geplande sessies?",
    "Welke training ging het beste en welke was het zwaarst?",
    "Heb je progressie kunnen maken - meer gewicht of meer reps?",
    "Waren er trainingen die je hebt overgeslagen? Wat was de reden?",
    "Hoe was je energie en focus tijdens de trainingen?"
  ],
  algemeen: [
    "Hoe zou je je stressniveau deze week omschrijven?",
    "Waren er dagen dat je je echt goed voelde? Wat was er anders?",
    "Waren er dagen dat je motivatie ver te zoeken was?",
    "Hoe balanceer je werk, training, en ontspanning op dit moment?",
    "Wat houdt je het meeste bezig qua je fitness journey?"
  ]
}

// Score kleuren
const getScoreColor = (score) => {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#eab308'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

export default function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  scoreLabel,
  scoreHint,
  score,
  onScoreChange,
  struggles,
  onStrugglesChange,
  afspraken,
  onAfsprakenChange,
  coachNotes,
  onCoachNotesChange,
  defaultExpanded = false,
  readonly = false
}) {
  const isMobile = window.innerWidth <= 768
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showQuestions, setShowQuestions] = useState(false)
  
  const hasScore = score !== null && score !== undefined
  const questions = SECTION_QUESTIONS[id] || []
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
      borderRadius: '16px',
      border: `1px solid ${isExpanded ? GOLD.borderActive : 'rgba(255, 255, 255, 0.1)'}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: isExpanded ? `0 8px 32px ${GOLD.glow}` : 'none'
    }}>
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.25rem',
          background: isExpanded 
            ? `linear-gradient(135deg, ${GOLD.background} 0%, transparent 100%)` 
            : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Icon Container */}
          <div style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            borderRadius: '12px',
            background: isExpanded ? `${GOLD.primary}20` : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isExpanded ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <Icon 
              size={isMobile ? 22 : 24} 
              color={isExpanded ? GOLD.primary : 'rgba(255, 255, 255, 0.6)'} 
            />
          </div>
          
          {/* Title & Description */}
          <div style={{ textAlign: 'left' }}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '700',
              color: isExpanded ? GOLD.primary : '#fff',
              margin: 0,
              transition: 'color 0.3s ease'
            }}>
              {title}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: 0
            }}>
              {description}
            </p>
          </div>
        </div>
        
        {/* Right Side: Score Badge + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasScore && (
            <div style={{
              padding: '0.35rem 0.75rem',
              background: `${getScoreColor(score)}20`,
              borderRadius: '8px',
              border: `1px solid ${getScoreColor(score)}40`
            }}>
              <span style={{
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: '700',
                color: getScoreColor(score)
              }}>
                {Number.isInteger(score) ? score : score.toFixed(1)}/10
              </span>
            </div>
          )}
          
          {isExpanded ? (
            <ChevronUp size={20} color={GOLD.primary} />
          ) : (
            <ChevronDown size={20} color="rgba(255, 255, 255, 0.4)" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: isMobile ? '0 1rem 1.25rem' : '0 1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Score Slider */}
          <ScoreSlider
            value={score || 5}
            onChange={onScoreChange}
            label={scoreLabel}
            hint={scoreHint}
            disabled={readonly}
          />
          
          {/* Gespreksvragen - Collapsible */}
          {questions.length > 0 && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.05)',
              borderRadius: '12px',
              border: `1px solid ${showQuestions ? GOLD.border : 'rgba(255, 215, 0, 0.15)'}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem' : '0.875rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={16} color={GOLD.primary} />
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    color: GOLD.primary
                  }}>
                    Gespreksvragen ({questions.length})
                  </span>
                </div>
                {showQuestions ? (
                  <ChevronUp size={16} color={GOLD.primary} />
                ) : (
                  <ChevronDown size={16} color={GOLD.secondary} />
                )}
              </button>
              
              {showQuestions && (
                <div style={{
                  padding: isMobile ? '0 1rem 1rem' : '0 1rem 1.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {questions.map((question, index) => (
                    <div
                      key={index}
                      style={{
                        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 0.875rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${GOLD.primary}`,
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: 1.5
                      }}
                    >
                      {question}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Struggles Field */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              color: '#ef4444',
              marginBottom: '0.625rem'
            }}>
              <AlertTriangle size={16} />
              Struggles & Uitdagingen
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: '400'
              }}>
                (in PDF)
              </span>
            </label>
            <textarea
              value={struggles || ''}
              onChange={(e) => onStrugglesChange?.(e.target.value)}
              placeholder="Waar liep de client tegenaan? Wat was lastig?"
              disabled={readonly}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.5,
                opacity: readonly ? 0.7 : 1,
                cursor: readonly ? 'not-allowed' : 'text'
              }}
            />
          </div>
          
          {/* Afspraken Field */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.625rem'
            }}>
              <Target size={16} />
              Afspraken voor Verbetering
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: '400'
              }}>
                (in PDF)
              </span>
            </label>
            <textarea
              value={afspraken || ''}
              onChange={(e) => onAfsprakenChange?.(e.target.value)}
              placeholder="Concrete actiepunten en afspraken voor deze categorie..."
              disabled={readonly}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.5,
                opacity: readonly ? 0.7 : 1,
                cursor: readonly ? 'not-allowed' : 'text'
              }}
            />
          </div>
          
          {/* Coach Notes Field */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.625rem'
            }}>
              <MessageSquare size={16} />
              Coach Notities
              <span style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.3)',
                fontWeight: '400'
              }}>
                (privé - niet in PDF)
              </span>
            </label>
            <textarea
              value={coachNotes || ''}
              onChange={(e) => onCoachNotesChange?.(e.target.value)}
              placeholder="Jouw observaties voor jezelf..."
              disabled={readonly}
              style={{
                width: '100%',
                minHeight: '70px',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.5,
                opacity: readonly ? 0.7 : 1,
                cursor: readonly ? 'not-allowed' : 'text'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
