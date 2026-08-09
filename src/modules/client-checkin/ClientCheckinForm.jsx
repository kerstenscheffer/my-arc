// src/modules/client-checkin/ClientCheckinForm.jsx
// Client Weekly Check-in - Step-based wizard: one section per screen.

import { useState, useEffect } from 'react'
import {
  Send,
  Utensils,
  Beer,
  Moon,
  Dumbbell,
  Sparkles,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  AlertTriangle,
} from 'lucide-react'

// Maps a question field id to a Lucide icon component. Used in the render
// loop to drop a small icon next to the label — replaces the emojis that
// were previously inlined into the label strings.
const QUESTION_ICONS = {
  wins: Trophy,
  struggles: AlertTriangle,
}
import CheckinService from './CheckinService'

// Gold theme colors
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)',
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// One screen per section. Each section has its own question list.
// Per Kersten 2026-05-08: dropped voeding_eiwitten + per-section help fields,
// kept one general help question at the very end ("algemeen_help").
const SECTIONS = [
  {
    id: 'voeding',
    title: 'Voeding',
    icon: Utensils,
    description: 'Hoe ging je voeding deze week?',
    questions: [
      { id: 'voeding_score', type: 'score', label: 'Score deze week' },
      { id: 'voeding_suikers', type: 'select', label: 'Plan gevolgd?', options: ['Ja, volledig', 'Grotendeels', 'Soms', 'Nauwelijks', 'Nee'] },
      { id: 'voeding_notes', type: 'text', label: 'Notities', placeholder: 'Wat ging goed? Wat kan beter?' },
    ]
  },
  {
    id: 'weekend',
    title: 'Weekend',
    icon: Beer,
    description: 'Hoe was je weekend discipline?',
    questions: [
      { id: 'weekend_score', type: 'score', label: 'Score weekend' },
      { id: 'weekend_alcohol', type: 'select', label: 'Alcohol?', options: ['Nee', '1-2 drankjes', '3-5 drankjes', '6+ drankjes', 'Te veel'] },
      { id: 'weekend_cheat', type: 'select', label: 'Uitschieters?', options: [
        'Geen uitschieters',
        'Een ongeplande maaltijd',
        'Snacks tussendoor',
        'Een fastfood-moment',
        'Alcohol uitschieter',
        'Ongezonde traktatie / dessert',
        'Meerdere uitschieters op één dag',
        'Heel weekend uit het plan',
      ] },
      { id: 'weekend_notes', type: 'text', label: 'Notities', placeholder: 'Sociale situaties? Triggers?' },
    ]
  },
  {
    id: 'slaap',
    title: 'Slaap',
    icon: Moon,
    description: 'Hoe was je slaap deze week?',
    questions: [
      { id: 'slaap_score', type: 'score', label: 'Score slaap' },
      { id: 'slaap_uren', type: 'select', label: 'Gemiddelde slaapuren', options: ['8+ uur', '7-8 uur', '6-7 uur', '5-6 uur', 'Minder dan 5 uur'] },
      { id: 'slaap_kwaliteit', type: 'select', label: 'Slaapkwaliteit', options: ['Uitstekend', 'Goed', 'Matig', 'Slecht', 'Heel slecht'] },
      { id: 'slaap_ritme', type: 'select', label: 'Consistent ritme?', options: ['Ja, zelfde tijd', 'Grotendeels', 'Wisselend', 'Erg wisselend', 'Compleet random'] },
      { id: 'slaap_notes', type: 'text', label: 'Notities', placeholder: 'Problemen met inslapen? Wakker worden?' },
    ]
  },
  {
    id: 'training',
    title: 'Training',
    icon: Dumbbell,
    description: 'Hoe waren je workouts?',
    questions: [
      { id: 'training_score', type: 'score', label: 'Score training' },
      { id: 'training_sessies', type: 'select', label: 'Sessies voltooid', options: ['Alle sessies', 'Meeste sessies', 'Helft', 'Minder dan helft', 'Geen/nauwelijks'] },
      { id: 'training_intensiteit', type: 'select', label: 'Intensiteit', options: ['Max effort - tot falen', 'Hoog - bijna falen', 'Medium - comfortabel', 'Laag - niet gepusht', 'Geen energie'] },
      { id: 'training_notes', type: 'text', label: 'Notities', placeholder: 'PRs? Struggles? Hoe voelde het?' },
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
      { id: 'wins', type: 'text', label: 'Wins deze week', placeholder: 'Waar ben je trots op?' },
      { id: 'struggles', type: 'text', label: 'Struggles', placeholder: 'Waar loop je tegenaan?' },
      { id: 'algemeen_help', type: 'text', label: 'Wat kan ik voor je doen om je resultaat nog beter te maken?', placeholder: 'Wat heb je van mij nodig?' },
    ]
  }
]

export default function ClientCheckinForm({ db, client, onSubmitted, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
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
      // We vullen het formulier NOOIT voor met de scores van een vorige
      // check-in — de wizard hoort altijd leeg/vers te openen. We checken
      // of er sinds de laatste VRIJDAG al een check-in is ingediend; zo ja,
      // tonen we het success-scherm i.p.v. de wizard (voorkomt dubbele
      // check-ins binnen de cyclus). De check-in-cyclus reset elke vrijdag,
      // dus elke vrijdag wordt er weer een nieuwe check-in opgevraagd.
      const hasCheckin = await service.hasCheckinSinceLastFriday(client.id)
      setSubmitted(hasCheckin)
    } catch (error) {
      console.error('Error checking existing check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  // Section is "completed" when its required score field is filled.
  // The 'algemeen' section needs both energie + motivatie.
  const isSectionComplete = (idx) => {
    const sec = SECTIONS[idx]
    if (!sec) return false
    if (sec.id === 'algemeen') {
      return !!(formData.energie_score && formData.motivatie_score)
    }
    return !!formData[`${sec.id}_score`]
  }

  const handleAdvance = () => {
    if (!isSectionComplete(currentSectionIdx)) return
    if (currentSectionIdx < SECTIONS.length - 1) {
      setCurrentSectionIdx(currentSectionIdx + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentSectionIdx > 0) {
      setCurrentSectionIdx(currentSectionIdx - 1)
    }
  }

  const updateField = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  // Build the payload the service expects: a single object with the
  // checkin columns. The DB column is `coach_id`; clients.coach_id is the
  // preferred source, falling back to the legacy `trainer_id` column for
  // older client records.
  const buildPayload = () => ({
    coach_id: client.coach_id || client.trainer_id || null,
    ...formData,
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      await service.saveDraft(client.id, buildPayload())
      alert('Concept opgeslagen!')
    } catch (error) {
      alert('Fout bij opslaan: ' + (error?.message || JSON.stringify(error)))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    const requiredScores = ['voeding_score', 'weekend_score', 'slaap_score', 'training_score', 'energie_score', 'motivatie_score']
    const missing = requiredScores.filter(field => !formData[field])

    if (missing.length > 0) {
      alert('Vul alle scores in voordat je verstuurt')
      return
    }

    setSubmitting(true)

    // Stap 1 — alléén de daadwerkelijke opslag. Alleen híer mag een fout als
    // "versturen mislukt" getoond worden.
    try {
      await service.createCheckin({
        client_id: client.id,
        ...buildPayload(),
      })
    } catch (error) {
      console.error('Checkin submit failed:', error)
      alert('Fout bij versturen: ' + (error?.message || error?.details || JSON.stringify(error)))
      setSubmitting(false)
      return
    }

    // Stap 2 — vanaf hier ís de check-in opgeslagen. Een fout in UI-vervolg
    // (state-updates of de parent-callback) mag NOOIT als "versturen mislukt"
    // verschijnen — dat was precies de verwarrende foutcode die de client zag.
    setSubmitted(true)
    try {
      // Signaal naar parent zodat de reminder-widget meteen weet dat de
      // check-in binnen is — anders blijft de pill hangen tot de volgende load.
      onSubmitted?.()
    } catch (cbErr) {
      console.error('onSubmitted-callback faalde (check-in is wel opgeslagen):', cbErr)
    }
    setSubmitting(false)
    // Succes-scherm even tonen en dan de modal vanzelf sluiten, zodat er na
    // het invullen niks blijft hangen.
    setTimeout(() => { try { onClose?.() } catch {} }, 2400)
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

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${GOLD.border}`,
          boxShadow: `0 8px 32px ${GOLD.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '44px', height: '44px',
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

  // Success
  if (submitted) {
    return (
      <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center' }}>
        <div style={{
          width: isMobile ? '100px' : '120px',
          height: isMobile ? '100px' : '120px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${GOLD.border}`,
          boxShadow: `0 8px 32px ${GOLD.glow}, 0 0 60px ${GOLD.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
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

  // Wizard
  const section = SECTIONS[currentSectionIdx]
  const Icon = section.icon
  const isLast = currentSectionIdx === SECTIONS.length - 1
  const isFirst = currentSectionIdx === 0
  const canAdvance = isSectionComplete(currentSectionIdx)
  const helperLabel = !canAdvance ? 'Vul eerst de score in om verder te gaan' : null

  return (
    <div
      key={section.id}
      style={{
        paddingBottom: isMobile ? '120px' : '2rem',
        animation: 'checkinSlideIn 0.25s ease',
      }}
    >
      {/* Top: date + step pills */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'capitalize',
          }}>
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '700',
            color: GOLD.primary,
            letterSpacing: '0.05em',
          }}>
            STAP {currentSectionIdx + 1} / {SECTIONS.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {SECTIONS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: i <= currentSectionIdx
                  ? 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                transition: 'background 0.25s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Section header */}
      <div style={{
        padding: isMobile ? '1.25rem 1rem 0.5rem' : '1.5rem 1.5rem 0.75rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          marginBottom: '0.4rem',
        }}>
          <Icon size={isMobile ? 20 : 22} color={GOLD.primary} />
          <h2 style={{
            fontSize: isMobile ? '1.15rem' : '1.35rem',
            fontWeight: '800',
            color: GOLD.primary,
            margin: 0,
            lineHeight: 1.1,
          }}>
            {section.title}
          </h2>
        </div>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.85)',
          fontWeight: '600',
          margin: 0,
        }}>
          {section.description}
        </p>
      </div>

      {/* Questions */}
      <div style={{
        padding: isMobile ? '1rem' : '1rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '1rem' : '1.25rem',
      }}>
        {section.questions.map(question => {
          const LabelIcon = QUESTION_ICONS[question.id]
          return (
          <div key={question.id}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#fff',
              fontWeight: '800',
              marginBottom: '0.45rem',
              letterSpacing: '0.01em',
            }}>
              {LabelIcon && (
                <LabelIcon
                  size={isMobile ? 14 : 15}
                  color={question.id === 'struggles' ? '#f59e0b' : GOLD.primary}
                />
              )}
              {question.label}
            </label>

            {question.type === 'score' && (
              <div>
                {/* 10-col grid so all scores fit on one row, even on narrow
                    phones. Buttons share equal width with `1fr` so they
                    scale to whatever fits. */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: isMobile ? '3px' : '5px',
                }}>
                  {SCORE_OPTIONS.map(score => {
                    const active = formData[question.id] === score
                    return (
                      <button
                        key={score}
                        onClick={() => updateField(question.id, score)}
                        style={{
                          width: '100%',
                          minWidth: 0,
                          height: isMobile ? '34px' : '38px',
                          padding: 0,
                          borderRadius: '6px',
                          background: active ? GOLD.primary : 'transparent',
                          border: `1px solid ${active ? GOLD.primary : 'rgba(255, 255, 255, 0.08)'}`,
                          color: active ? '#000' : 'rgba(255, 255, 255, 0.55)',
                          fontSize: isMobile ? '0.78rem' : '0.9rem',
                          fontWeight: active ? '900' : '600',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.35rem',
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <span>1 = heel slecht</span>
                  <span>10 = heel goed</span>
                </div>
              </div>
            )}

            {question.type === 'select' && (
              <select
                value={formData[question.id] || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.875rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minHeight: '44px',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.875rem center',
                  paddingRight: '2.25rem',
                }}
              >
                <option value="" style={{ background: '#111' }}>Selecteer…</option>
                {question.options.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#111' }}>{opt}</option>
                ))}
              </select>
            )}

            {question.type === 'text' && (
              <textarea
                value={formData[question.id] || ''}
                onChange={(e) => updateField(question.id, e.target.value)}
                placeholder={question.placeholder}
                style={{
                  width: '100%',
                  minHeight: '70px',
                  padding: '0.7rem 0.875rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
          )
        })}
      </div>

      {/* Bottom bar — Vorige | Volgende / Verstuur (+ concept link) */}
      <div style={{
        position: isMobile ? 'fixed' : 'sticky',
        bottom: 0,
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        padding: isMobile ? '0.625rem 1rem' : '0.875rem 1.5rem',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: isMobile ? 'max(0.625rem, env(safe-area-inset-bottom))' : '0.875rem',
        zIndex: 50,
      }}>
        {helperLabel && (
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            color: 'rgba(255, 215, 0, 0.55)',
            textAlign: 'center',
            marginBottom: '0.4rem',
            letterSpacing: '0.04em',
          }}>
            ↑ {helperLabel}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleBack}
            disabled={isFirst}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: isFirst ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              cursor: isFirst ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              minHeight: '48px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={14} />
            Vorige
          </button>

          <button
            onClick={handleAdvance}
            disabled={!canAdvance || submitting}
            style={{
              flex: 2,
              padding: '0.75rem',
              background: (!canAdvance || submitting)
                ? 'rgba(255, 215, 0, 0.15)'
                : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none',
              borderRadius: '10px',
              color: (!canAdvance || submitting) ? 'rgba(0, 0, 0, 0.4)' : '#000',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '800',
              cursor: (!canAdvance || submitting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              minHeight: '48px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            {isLast && <Send size={14} />}
            {submitting ? 'Versturen…' : (isLast ? 'Verstuur' : 'Volgende')}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>

        <button
          onClick={handleSaveDraft}
          disabled={saving}
          style={{
            display: 'block',
            margin: '0.5rem auto 0',
            padding: '0.25rem 0.75rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.7rem',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saving ? 'Opslaan…' : 'Concept opslaan'}
        </button>
      </div>

      <style>{`
        @keyframes checkinSlideIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
