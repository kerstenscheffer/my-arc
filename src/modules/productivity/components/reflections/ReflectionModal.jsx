// src/modules/productivity/components/reflections/ReflectionModal.jsx
// VERSION 2.0 - STYLING GUIDE COMPLIANT (flush, compact, no gradients)

import { useState } from 'react'
import { Star, ThumbsUp, BookOpen, RefreshCw, SkipForward } from 'lucide-react'
import { Venster, VensterKop, VensterVoet, Kopje, Knop } from '../../../../components/arc-ui'

const RATING_LABELS = { 1: 'Niet goed', 2: 'Kon beter', 3: 'Oké', 4: 'Goed', 5: 'Uitstekend' }

const FIELDS = [
  { key: 'whatWentWell',   icon: ThumbsUp,  color: '#10b981', label: 'Wat ging goed',        placeholder: 'Waar ben je trots op?' },
  { key: 'whatLearned',    icon: BookOpen,   color: '#3b82f6', label: 'Wat heb je geleerd',   placeholder: 'Nieuwe inzichten?' },
  { key: 'whatDifferent',  icon: RefreshCw,  color: '#f59e0b', label: 'Wat zou je anders doen', placeholder: 'Verbeterpunten?' }
]

export default function ReflectionModal({ isMobile, task, onClose, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [answers, setAnswers] = useState({ whatWentWell: '', whatLearned: '', whatDifferent: '' })
  const [ratingError, setRatingError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) { setRatingError(true); return }
    setSubmitting(true)
    await onSubmit({
      rating,
      what_went_well:  answers.whatWentWell.trim()  || null,
      what_learned:    answers.whatLearned.trim()   || null,
      what_different:  answers.whatDifferent.trim() || null
    })
    setSubmitting(false)
  }

  const handleSkip = async () => {
    if (window.confirm('Reflectie overslaan?')) await onSkip()
  }

  const activeRating = hoverRating || rating

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={460} zIndex={10000}>
      <VensterKop isMobile={isMobile} titel="Reflectie" sub={task.title} onClose={onClose} />

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {/* Het cijfer is waar het om draait, dus de sterren staan groot
            bovenaan met het woord eronder. */}
        <div style={{ padding: isMobile ? '1rem' : '1.15rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 6 : 8 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => { setRating(star); setRatingError(false) }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <Star
                  size={isMobile ? 32 : 36}
                  fill={activeRating >= star ? '#fff' : 'transparent'}
                  color={activeRating >= star ? '#fff' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={2}
                  style={{ transition: 'all 0.1s ease' }}
                />
              </button>
            ))}
          </div>
          <div style={{ minHeight: 18, marginTop: 6 }}>
            {activeRating > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                {RATING_LABELS[activeRating]}
              </span>
            )}
            {ratingError && activeRating === 0 && (
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ef4444' }}>Geef eerst een cijfer</span>
            )}
          </div>
        </div>

        {/* Drie vragen onder elkaar, elk met een eigen kopje. */}
        {FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
          <div key={key} style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.15rem 1rem' }}>
            <Kopje Icon={Icon} tekst={label} />
            <textarea
              value={answers[key]}
              onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
              placeholder={placeholder}
              rows={2}
              style={{
                width: '100%', padding: '0.6rem 0.7rem', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${answers[key].trim() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', outline: 'none',
                resize: 'none', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>
        ))}
      </div>

      <VensterVoet isMobile={isMobile}>
        <Knop soort="stil" onClick={handleSkip} disabled={submitting}>
          <SkipForward size={13} />
          Overslaan
        </Knop>
        <Knop soort="primair" flex={1} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Opslaan…' : 'Opslaan'}
        </Knop>
      </VensterVoet>
    </Venster>
  )
}
