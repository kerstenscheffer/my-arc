// src/modules/client-checkin/components/CheckinDetailView.jsx
// Detail view voor bestaande check-ins
// Features: View scores, edit coach notes, export PDF, export coach notes

import { useState } from 'react'
import {
  ArrowLeft,
  User,
  Calendar,
  Download,
  FileText,
  CheckCircle,
  Utensils,
  Beer,
  Moon,
  Dumbbell,
  Sparkles,
  AlertTriangle,
  Target,
  MessageSquare,
  MessageCircle,
  Copy,
  Check,
  Eye,
  Send,
  X
} from 'lucide-react'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

const STATUS_CONFIG = {
  submitted: { label: 'Nieuw', color: '#fbbf24' },
  reviewed: { label: 'Bekeken', color: '#10b981' },
  draft: { label: 'Concept', color: '#6b7280' }
}

const getScoreColor = (score) => {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#eab308'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

// Section config
const SECTIONS = [
  { id: 'voeding', title: 'Voeding', icon: Utensils, scoreKey: 'voeding_score' },
  { id: 'weekend', title: 'Weekend', icon: Beer, scoreKey: 'weekend_score' },
  { id: 'slaap', title: 'Slaap', icon: Moon, scoreKey: 'slaap_score' },
  { id: 'training', title: 'Training', icon: Dumbbell, scoreKey: 'training_score' },
  { id: 'algemeen', title: 'Algemeen', icon: Sparkles, scoreKey: 'energie_score' }
]

export default function CheckinDetailView({
  checkin,
  onBack,
  onMarkReviewed,
  onSendFeedback,
  onExportPDF,
  onExportCoachNotes,
  saving = false
}) {
  const isMobile = window.innerWidth <= 768
  const [copiedNotes, setCopiedNotes] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  // Feedback-modal: open vanuit "Markeer als Bekeken" OF vanuit een
  // standalone follow-up-knop bij reeds beoordeelde check-ins.
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackDraft, setFeedbackDraft] = useState(checkin?.coach_message || '')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  
  if (!checkin) return null
  
  const clientName = `${checkin.clients?.first_name || ''} ${checkin.clients?.last_name || ''}`.trim()
  const sectionDetails = checkin.section_details || {}
  
  // Calculate average score
  const scores = [
    checkin.voeding_score,
    checkin.weekend_score,
    checkin.slaap_score,
    checkin.training_score,
    checkin.energie_score,
    checkin.motivatie_score
  ].filter(s => s !== null && s !== undefined)
  
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '0'
  
  // Copy coach notes to clipboard
  const handleCopyCoachNotes = () => {
    let notesText = `COACH NOTITIES - ${clientName}\n`
    notesText += `Datum: ${new Date(checkin.checkin_date).toLocaleDateString('nl-NL')}\n`
    notesText += `${'='.repeat(40)}\n\n`
    
    SECTIONS.forEach(section => {
      const details = sectionDetails[section.id]
      if (details?.coach_notes) {
        notesText += `${section.title.toUpperCase()}:\n${details.coach_notes}\n\n`
      }
    })
    
    navigator.clipboard.writeText(notesText)
    setCopiedNotes(true)
    setTimeout(() => setCopiedNotes(false), 2000)
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ArrowLeft size={18} />
          Terug
        </button>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowNotesModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Eye size={16} />
            Coach Notes
          </button>
          
          <button
            onClick={onExportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>
      
      {/* Client Header Card */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`,
        borderRadius: '16px',
        border: `1px solid ${GOLD.border}`,
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
        }} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: `${GOLD.primary}20`,
              border: `1px solid ${GOLD.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={28} color={GOLD.primary} />
            </div>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.4rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                {clientName}
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={14} />
                {new Date(checkin.checkin_date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
          
          {/* Average + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: `${getScoreColor(parseFloat(avgScore))}20`,
              borderRadius: '10px',
              border: `1px solid ${getScoreColor(parseFloat(avgScore))}40`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '900',
                color: getScoreColor(parseFloat(avgScore)),
                lineHeight: 1
              }}>
                {avgScore}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase'
              }}>
                Gemiddeld
              </div>
            </div>
            
            <div style={{
              padding: '0.5rem 1rem',
              background: `${STATUS_CONFIG[checkin.status]?.color}20`,
              borderRadius: '10px',
              border: `1px solid ${STATUS_CONFIG[checkin.status]?.color}40`
            }}>
              <span style={{
                color: STATUS_CONFIG[checkin.status]?.color,
                fontWeight: '600',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                {STATUS_CONFIG[checkin.status]?.label}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scores Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {SECTIONS.map(section => {
          const Icon = section.icon
          const score = checkin[section.scoreKey]
          const details = sectionDetails[section.id] || {}
          const hasDetails = details.struggles || details.afspraken || details.coach_notes
          
          return (
            <button
              key={section.id}
              onClick={() => setExpandedSection(
                expandedSection === section.id ? null : section.id
              )}
              style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: expandedSection === section.id
                  ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`
                  : 'rgba(0, 0, 0, 0.4)',
                borderRadius: '14px',
                border: `1px solid ${
                  expandedSection === section.id
                    ? GOLD.border
                    : score ? `${getScoreColor(score)}40` : 'rgba(255, 255, 255, 0.1)'
                }`,
                textAlign: 'center',
                cursor: hasDetails ? 'pointer' : 'default',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Icon
                size={20}
                color={score ? getScoreColor(score) : 'rgba(255, 255, 255, 0.4)'}
                style={{ marginBottom: '0.5rem' }}
              />
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 0.25rem 0'
              }}>
                {section.title}
              </p>
              <p style={{
                fontSize: isMobile ? '1.5rem' : '1.75rem',
                fontWeight: '800',
                color: score ? getScoreColor(score) : 'rgba(255, 255, 255, 0.3)',
                margin: 0
              }}>
                {score ? (Number.isInteger(score) ? score : score.toFixed(1)) : '-'}
              </p>
              {hasDetails && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Klik voor details
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Expanded Section Details */}
      {expandedSection && sectionDetails[expandedSection] && (
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.9) 0%, rgba(10, 10, 10, 0.9) 100%)',
          borderRadius: '16px',
          border: `1px solid ${GOLD.border}`,
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: GOLD.primary,
            margin: '0 0 1rem 0'
          }}>
            {SECTIONS.find(s => s.id === expandedSection)?.title} Details
          </h3>
          
          {/* Struggles */}
          {sectionDetails[expandedSection].struggles && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ef4444',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                <AlertTriangle size={16} />
                Struggles
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: isMobile ? '0.9rem' : '0.95rem'
              }}>
                {sectionDetails[expandedSection].struggles}
              </p>
            </div>
          )}
          
          {/* Afspraken */}
          {sectionDetails[expandedSection].afspraken && (
            <div style={{
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#10b981',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                <Target size={16} />
                Afspraken
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: isMobile ? '0.9rem' : '0.95rem'
              }}>
                {sectionDetails[expandedSection].afspraken}
              </p>
            </div>
          )}
          
          {/* Coach Notes */}
          {sectionDetails[expandedSection].coach_notes && (
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                <MessageSquare size={16} />
                Coach Notities (privé)
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                fontSize: isMobile ? '0.9rem' : '0.95rem'
              }}>
                {sectionDetails[expandedSection].coach_notes}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Coach Message - Persoonlijk Bericht */}
      {checkin.coach_message && (
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`,
          borderRadius: '16px',
          border: `1px solid ${GOLD.border}`,
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.3) 100%)`,
              border: `1px solid ${GOLD.border}`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle size={20} color={GOLD.primary} />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: GOLD.primary,
                margin: 0
              }}>
                Persoonlijk Bericht
              </h3>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                Dit verschijnt onderaan de PDF export
              </p>
            </div>
          </div>
          
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            borderLeft: `3px solid ${GOLD.primary}`
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontStyle: 'italic'
            }}>
              "{checkin.coach_message}"
            </p>
            <p style={{
              color: GOLD.secondary,
              margin: '0.75rem 0 0 0',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              textAlign: 'right'
            }}>
              — Je Coach
            </p>
          </div>
        </div>
      )}
      
      {/* Mark as Reviewed Button — opent de feedback-modal zodat coach
          tegelijk een bericht naar de client kan sturen. Skip-knop binnen
          de modal markeert alleen. */}
      {checkin.status === 'submitted' && (
        <button
          onClick={() => { setFeedbackDraft(checkin?.coach_message || ''); setShowFeedbackModal(true) }}
          disabled={saving}
          style={{
            width: '100%',
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '14px',
            color: '#000',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '800',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '60px',
            boxShadow: `0 8px 32px ${GOLD.glow}`,
            opacity: saving ? 0.7 : 1,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <CheckCircle size={22} />
          {saving ? 'Opslaan...' : 'Markeer als Bekeken & Stuur Bericht'}
        </button>
      )}

      {/* Follow-up bericht knop — bij reeds beoordeelde check-ins kan de
          coach alsnog een (extra) bericht sturen. */}
      {checkin.status !== 'submitted' && onSendFeedback && (
        <button
          onClick={() => { setFeedbackDraft(checkin?.coach_message || ''); setShowFeedbackModal(true) }}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.125rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '12px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '52px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            marginTop: '0.5rem'
          }}
        >
          <Send size={18} />
          {checkin?.coach_message ? 'Stuur opnieuw bericht naar client' : 'Stuur bericht naar client'}
        </button>
      )}

      {/* Feedback Modal — bericht naar client. Bij submitted check-in
          combineert verzenden + markeer-als-bekeken. */}
      {showFeedbackModal && (
        <div
          onClick={() => !feedbackSending && setShowFeedbackModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: 20, border: `1px solid ${GOLD.border}`,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              borderBottom: `1px solid ${GOLD.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40,
                  background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
                  border: `1px solid ${GOLD.border}`,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageCircle size={20} color={GOLD.primary} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? '1.05rem' : '1.2rem',
                    fontWeight: 700, color: GOLD.primary, margin: 0,
                  }}>
                    Bericht naar {clientName}
                  </h3>
                  <p style={{
                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0,
                  }}>
                    Verschijnt in haar app + onderaan de PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => !feedbackSending && setShowFeedbackModal(false)}
                disabled={feedbackSending}
                style={{
                  width: 36, height: 36,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: 'rgba(255,255,255,0.6)',
                  cursor: feedbackSending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
              <textarea
                value={feedbackDraft}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                placeholder="Bv. Top gedaan deze week — laten we de slaap-strategie volgende call concretiseren..."
                disabled={feedbackSending}
                rows={5}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${GOLD.border}`,
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div style={{
                marginTop: 6, fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {feedbackDraft.length} tekens · zichtbaar voor client in haar app
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: isMobile ? '0.75rem 1rem 1rem' : '0.75rem 1.5rem 1.25rem',
              borderTop: `1px solid ${GOLD.border}`,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              gap: '0.6rem',
            }}>
              {/* Skip — alleen relevant voor submitted (markeer-zonder-bericht) */}
              {checkin.status === 'submitted' && (
                <button
                  onClick={async () => {
                    setFeedbackSending(true)
                    try {
                      await onMarkReviewed()
                      setShowFeedbackModal(false)
                    } finally {
                      setFeedbackSending(false)
                    }
                  }}
                  disabled={feedbackSending}
                  style={{
                    flex: isMobile ? 'none' : 1,
                    padding: '0.9rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem', fontWeight: 600,
                    cursor: feedbackSending ? 'not-allowed' : 'pointer',
                  }}
                >
                  Alleen markeren, geen bericht
                </button>
              )}
              <button
                onClick={async () => {
                  if (!feedbackDraft.trim() || feedbackSending) return
                  setFeedbackSending(true)
                  try {
                    const result = await onSendFeedback?.({
                      message: feedbackDraft.trim(),
                      markAsReviewed: checkin.status === 'submitted',
                    })
                    if (result !== false) {
                      setFeedbackSent(true)
                      setTimeout(() => {
                        setFeedbackSent(false)
                        setShowFeedbackModal(false)
                      }, 1200)
                    }
                  } finally {
                    setFeedbackSending(false)
                  }
                }}
                disabled={!feedbackDraft.trim() || feedbackSending || feedbackSent}
                style={{
                  flex: isMobile ? 'none' : 2,
                  padding: '0.9rem',
                  background: feedbackSent
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                  border: 'none',
                  borderRadius: 12,
                  color: feedbackSent ? '#fff' : '#000',
                  fontSize: '0.95rem', fontWeight: 800,
                  cursor: (!feedbackDraft.trim() || feedbackSending) ? 'not-allowed' : 'pointer',
                  opacity: (!feedbackDraft.trim() || feedbackSending) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {feedbackSent
                  ? (<><Check size={18} strokeWidth={3} /> Verstuurd</>)
                  : feedbackSending
                    ? 'Versturen…'
                    : (<><Send size={18} /> {checkin.status === 'submitted' ? 'Verstuur & Markeer' : 'Verstuur'}</>)
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Coach Notes Modal */}
      {showNotesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setShowNotesModal(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
              borderRadius: '20px',
              border: `1px solid ${GOLD.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              borderBottom: `1px solid ${GOLD.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.3) 100%)`,
                  border: `1px solid ${GOLD.border}`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} color={GOLD.primary} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? '1.1rem' : '1.25rem',
                    fontWeight: '700',
                    color: GOLD.primary,
                    margin: 0
                  }}>
                    Coach Notities
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0
                  }}>
                    Privé notities (niet zichtbaar voor client)
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowNotesModal(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              {SECTIONS.map(section => {
                const details = sectionDetails[section.id]
                const hasNotes = details?.coach_notes?.trim()
                const SectionIcon = section.icon
                
                return (
                  <div 
                    key={section.id}
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: hasNotes ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                      borderRadius: '12px',
                      border: `1px solid ${hasNotes ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: hasNotes ? '0.75rem' : 0
                    }}>
                      <SectionIcon size={16} color={hasNotes ? GOLD.primary : 'rgba(255, 255, 255, 0.3)'} />
                      <span style={{
                        fontWeight: '600',
                        color: hasNotes ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: isMobile ? '0.9rem' : '0.95rem'
                      }}>
                        {section.title}
                      </span>
                      {!hasNotes && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.3)',
                          fontStyle: 'italic'
                        }}>
                          — Geen notities
                        </span>
                      )}
                    </div>
                    
                    {hasNotes && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        fontSize: isMobile ? '0.85rem' : '0.9rem'
                      }}>
                        {details.coach_notes}
                      </p>
                    )}
                  </div>
                )
              })}
              
              {/* Check if there are any notes */}
              {!SECTIONS.some(s => sectionDetails[s.id]?.coach_notes?.trim()) && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  <MessageSquare size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>Geen coach notities voor deze check-in</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer with Copy Button */}
            <div style={{
              padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
              borderTop: `1px solid ${GOLD.border}`,
              background: 'rgba(0, 0, 0, 0.3)'
            }}>
              <button
                onClick={() => {
                  handleCopyCoachNotes()
                  setTimeout(() => setShowNotesModal(false), 1500)
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.125rem',
                  background: copiedNotes 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                  border: 'none',
                  borderRadius: '12px',
                  color: copiedNotes ? '#fff' : '#000',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '52px',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {copiedNotes ? <Check size={20} /> : <Copy size={20} />}
                {copiedNotes ? 'Gekopieerd naar Klembord!' : 'Kopieer Alle Notities'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
