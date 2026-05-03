// src/modules/client-checkin/ClientCheckinForm.jsx
// Client Weekly Check-in Form - Gold/Black Premium Styling

import { useState, useEffect } from 'react'
import { 
  Send, 
  Save,
  Utensils, 
  Beer, 
  Moon, 
  Dumbbell, 
  Sparkles,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Heart,
  AlertTriangle,
  Trophy
} from 'lucide-react'
import CheckinService from './CheckinService'

// Gold theme colors
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  dark: '#B8860B',
  light: '#FFEC8B',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  glowStrong: 'rgba(255, 215, 0, 0.4)',
  background: 'rgba(255, 215, 0, 0.08)',
  backgroundHover: 'rgba(255, 215, 0, 0.12)'
}

// Score options 1-10
const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Section configuration
const SECTIONS = [
  {
    id: 'voeding',
    title: 'Voeding',
    icon: Utensils,
    description: 'Hoe ging je voeding deze week?',
    questions: [
      { id: 'voeding_score', type: 'score', label: 'Algemene score voeding' },
      { id: 'voeding_eiwitten', type: 'select', label: 'Eiwit targets gehaald?', options: ['Ja, elke dag', 'Meeste dagen', 'Soms', 'Nauwelijks', 'Nee'] },
      { id: 'voeding_suikers', type: 'select', label: 'Snelle suikers vermeden?', options: ['Ja, volledig', 'Grotendeels', 'Af en toe gehad', 'Vaak gehad', 'Veel te veel'] },
      { id: 'voeding_notes', type: 'text', label: 'Notities', placeholder: 'Wat ging goed? Wat kan beter?' }
    ]
  },
  {
    id: 'weekend',
    title: 'Weekend Gedrag',
    icon: Beer,
    description: 'Hoe was je weekend discipline?',
    questions: [
      { id: 'weekend_score', type: 'score', label: 'Algemene score weekend' },
      { id: 'weekend_alcohol', type: 'select', label: 'Alcohol gedronken?', options: ['Nee', '1-2 drankjes', '3-5 drankjes', '6+ drankjes', 'Te veel'] },
      { id: 'weekend_cheat', type: 'select', label: 'Cheat meals/snacks?', options: ['Geen', '1 kleine', '1-2 normale', 'Meerdere', 'Weekend uit de hand'] },
      { id: 'weekend_notes', type: 'text', label: 'Notities', placeholder: 'Sociale situaties? Triggers?' }
    ]
  },
  {
    id: 'slaap',
    title: 'Slaap',
    icon: Moon,
    description: 'Hoe was je slaap deze week?',
    questions: [
      { id: 'slaap_score', type: 'score', label: 'Algemene score slaap' },
      { id: 'slaap_uren', type: 'select', label: 'Gemiddelde slaapuren', options: ['8+ uur', '7-8 uur', '6-7 uur', '5-6 uur', 'Minder dan 5 uur'] },
      { id: 'slaap_kwaliteit', type: 'select', label: 'Slaapkwaliteit', options: ['Uitstekend', 'Goed', 'Matig', 'Slecht', 'Heel slecht'] },
      { id: 'slaap_ritme', type: 'select', label: 'Consistent ritme?', options: ['Ja, zelfde tijd', 'Grotendeels', 'Wisselend', 'Erg wisselend', 'Compleet random'] },
      { id: 'slaap_notes', type: 'text', label: 'Notities', placeholder: 'Problemen met inslapen? Wakker worden?' }
    ]
  },
  {
    id: 'training',
    title: 'Training',
    icon: Dumbbell,
    description: 'Hoe waren je workouts?',
    questions: [
      { id: 'training_score', type: 'score', label: 'Algemene score training' },
      { id: 'training_sessies', type: 'select', label: 'Sessies voltooid', options: ['Alle sessies', 'Meeste sessies', 'Helft', 'Minder dan helft', 'Geen/nauwelijks'] },
      { id: 'training_intensiteit', type: 'select', label: 'Intensiteit', options: ['Max effort - tot falen', 'Hoog - bijna falen', 'Medium - comfortabel', 'Laag - niet gepusht', 'Geen energie'] },
      { id: 'training_notes', type: 'text', label: 'Notities', placeholder: 'PRs? Struggles? Hoe voelde het?' }
    ]
  },
  {
    id: 'algemeen',
    title: 'Algemeen',
    icon: Sparkles,
    description: 'Hoe voel je je overall?',
    questions: [
      { id: 'energie_score', type: 'score', label: 'Energie niveau' },
      { id: 'motivatie_score', type: 'score', label: 'Motivatie niveau' },
      { id: 'wins', type: 'text', label: '🏆 Wins deze week', placeholder: 'Waar ben je trots op?' },
      { id: 'struggles', type: 'text', label: '⚠️ Struggles', placeholder: 'Waar loop je tegenaan?' }
    ]
  }
]

export default function ClientCheckinForm({ db, client }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasCheckinThisWeek, setHasCheckinThisWeek] = useState(false)
  const [expandedSections, setExpandedSections] = useState(['voeding'])
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  
  const service = new CheckinService(db)

  useEffect(() => {
    if (client?.id) {
      checkExistingCheckin()
    }
  }, [client?.id])

  const checkExistingCheckin = async () => {
    setLoading(true)
    try {
      const hasCheckin = await service.hasCheckinThisWeek(client.id)
      setHasCheckinThisWeek(hasCheckin)
      
      if (hasCheckin) {
        const latest = await service.getLatestCheckin(client.id)
        if (latest) {
          setFormData(latest)
          setSubmitted(latest.status === 'submitted' || latest.status === 'reviewed')
        }
      }
    } catch (error) {
      console.error('Error checking existing check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const updateField = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await service.saveDraft(client.id, client.trainer_id, formData)
      alert('✅ Concept opgeslagen!')
    } catch (error) {
      alert('❌ Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    // Validate required scores
    const requiredScores = ['voeding_score', 'weekend_score', 'slaap_score', 'training_score', 'energie_score', 'motivatie_score']
    const missing = requiredScores.filter(field => !formData[field])
    
    if (missing.length > 0) {
      alert('⚠️ Vul alle scores in voordat je verstuurt')
      return
    }

    setSubmitting(true)
    try {
      await service.createCheckin(client.id, client.trainer_id, formData)
      setSubmitted(true)
      setHasCheckinThisWeek(true)
    } catch (error) {
      alert('❌ Fout bij versturen: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateOverallScore = () => {
    const scores = [
      formData.voeding_score,
      formData.weekend_score,
      formData.slaap_score,
      formData.training_score,
      formData.energie_score,
      formData.motivatie_score
    ].filter(s => s !== undefined && s !== null)

    if (scores.length === 0) return null
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${GOLD.border}`,
          boxShadow: `0 8px 32px ${GOLD.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            border: `3px solid ${GOLD.border}`,
            borderTopColor: GOLD.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: isMobile ? '100px' : '120px',
          height: isMobile ? '100px' : '120px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${GOLD.border}`,
          boxShadow: `0 8px 32px ${GOLD.glow}, 0 0 60px ${GOLD.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle size={isMobile ? 48 : 56} color={GOLD.primary} />
        </div>
        
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem'
        }}>
          Check-in Verstuurd!
        </h2>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: isMobile ? '0.95rem' : '1rem',
          marginBottom: '1.5rem'
        }}>
          Je coach bekijkt je check-in en neemt contact op.
        </p>

        {calculateOverallScore() && (
          <div style={{
            padding: '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
            borderRadius: '16px',
            border: `1px solid ${GOLD.border}`,
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              marginBottom: '0.5rem'
            }}>
              Gemiddelde score deze week
            </p>
            <p style={{
              fontSize: isMobile ? '2.5rem' : '3rem',
              fontWeight: '800',
              color: GOLD.primary,
              margin: 0
            }}>
              {calculateOverallScore()}
              <span style={{ fontSize: '1rem', opacity: 0.6 }}>/10</span>
            </p>
          </div>
        )}
      </div>
    )
  }

  // Main form
  return (
    <div style={{ paddingBottom: isMobile ? '100px' : '2rem' }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.5) 100%)`,
        borderRadius: isMobile ? '0 0 24px 24px' : '24px',
        border: `1px solid ${GOLD.border}`,
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${GOLD.primary}20 0%, ${GOLD.secondary}10 100%)`,
            border: `1px solid ${GOLD.borderActive}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${GOLD.glow}`
          }}>
            <Sparkles size={isMobile ? 28 : 32} color={GOLD.primary} />
          </div>
          
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Wekelijkse Check-in
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              margin: 0
            }}>
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            flex: 1,
            height: '6px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(Object.keys(formData).filter(k => formData[k]).length / 20) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              boxShadow: `0 0 10px ${GOLD.glow}`
            }} />
          </div>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: GOLD.primary,
            fontWeight: '600'
          }}>
            {Math.round((Object.keys(formData).filter(k => formData[k]).length / 20) * 100)}%
          </span>
        </div>
      </div>

      {/* Sections */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: isMobile ? '0 1rem' : 0
      }}>
        {SECTIONS.map(section => {
          const Icon = section.icon
          const isExpanded = expandedSections.includes(section.id)
          const sectionScore = formData[`${section.id}_score`]

          return (
            <div
              key={section.id}
              style={{
                background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
                borderRadius: '16px',
                border: `1px solid ${isExpanded ? GOLD.borderActive : 'rgba(255, 255, 255, 0.1)'}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded ? `0 8px 32px ${GOLD.glow}` : 'none'
              }}
            >
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: isMobile ? '44px' : '48px',
                    height: isMobile ? '44px' : '48px',
                    borderRadius: '12px',
                    background: isExpanded ? `${GOLD.primary}20` : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isExpanded ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isExpanded ? `0 0 15px ${GOLD.glow}` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={isMobile ? 22 : 24} color={isExpanded ? GOLD.primary : 'rgba(255, 255, 255, 0.6)'} />
                  </div>
                  
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '700',
                      color: isExpanded ? GOLD.primary : '#fff',
                      margin: 0
                    }}>
                      {section.title}
                    </h3>
                    <p style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: 0
                    }}>
                      {section.description}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {sectionScore && (
                    <div style={{
                      padding: '0.35rem 0.75rem',
                      background: `${GOLD.primary}20`,
                      borderRadius: '8px',
                      border: `1px solid ${GOLD.border}`
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                        fontWeight: '700',
                        color: GOLD.primary
                      }}>
                        {sectionScore}/10
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

              {/* Section content */}
              {isExpanded && (
                <div style={{
                  padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {section.questions.map(question => (
                    <div key={question.id}>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {question.label}
                        {question.type === 'score' && <span style={{ color: GOLD.primary }}> *</span>}
                      </label>

                      {/* Score selector */}
                      {question.type === 'score' && (
                        <div style={{
                          display: 'flex',
                          gap: '0.375rem',
                          flexWrap: 'wrap'
                        }}>
                          {SCORE_OPTIONS.map(score => (
                            <button
                              key={score}
                              onClick={() => updateField(question.id, score)}
                              style={{
                                width: isMobile ? '36px' : '40px',
                                height: isMobile ? '36px' : '40px',
                                borderRadius: '10px',
                                background: formData[question.id] === score
                                  ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                                  : 'rgba(0, 0, 0, 0.4)',
                                border: formData[question.id] === score
                                  ? 'none'
                                  : `1px solid ${score <= 3 ? 'rgba(239, 68, 68, 0.3)' : score <= 6 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                color: formData[question.id] === score ? '#000' : 'rgba(255, 255, 255, 0.7)',
                                fontSize: isMobile ? '0.9rem' : '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                              }}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Select dropdown */}
                      {question.type === 'select' && (
                        <select
                          value={formData[question.id] || ''}
                          onChange={(e) => updateField(question.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.75rem' : '0.875rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: `1px solid ${formData[question.id] ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: isMobile ? '0.9rem' : '0.95rem',
                            cursor: 'pointer',
                            minHeight: '44px',
                            outline: 'none'
                          }}
                        >
                          <option value="" style={{ background: '#111' }}>Selecteer...</option>
                          {question.options.map(opt => (
                            <option key={opt} value={opt} style={{ background: '#111' }}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* Text input */}
                      {question.type === 'text' && (
                        <textarea
                          value={formData[question.id] || ''}
                          onChange={(e) => updateField(question.id, e.target.value)}
                          placeholder={question.placeholder}
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: isMobile ? '0.75rem' : '0.875rem',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: `1px solid ${formData[question.id] ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: isMobile ? '0.9rem' : '0.95rem',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            outline: 'none'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action buttons - Fixed bottom on mobile */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        padding: isMobile ? '1rem' : '2rem 0',
        background: isMobile 
          ? 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.95) 20%)'
          : 'transparent',
        zIndex: 50,
        display: 'flex',
        gap: '0.75rem'
      }}>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          style={{
            flex: 1,
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '14px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '56px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <Save size={20} />
          {saving ? 'Opslaan...' : 'Concept'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 2,
            padding: isMobile ? '1rem' : '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '14px',
            color: '#000',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '56px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: `0 4px 20px ${GOLD.glow}`,
            transition: 'all 0.3s ease'
          }}
        >
          <Send size={20} />
          {submitting ? 'Versturen...' : 'Verstuur Check-in'}
        </button>
      </div>
    </div>
  )
}
