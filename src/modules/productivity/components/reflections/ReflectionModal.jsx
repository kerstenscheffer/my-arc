// src/modules/productivity/components/reflections/ReflectionModal.jsx
// VERSION 2.0 - STYLING GUIDE COMPLIANT (flush, compact, no gradients)

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Star, Lightbulb, ThumbsUp, BookOpen, RefreshCw, SkipForward } from 'lucide-react'

const RATING_LABELS = { 1: '😞 Niet goed', 2: '😕 Kon beter', 3: '😐 Oké', 4: '😊 Goed', 5: '🎉 Uitstekend' }

const FIELDS = [
  { key: 'whatWentWell',   icon: ThumbsUp,  color: '#10b981', label: 'WAT GING GOED?',        placeholder: 'Waar ben je trots op?' },
  { key: 'whatLearned',    icon: BookOpen,   color: '#3b82f6', label: 'WAT HEB JE GELEERD?',   placeholder: 'Nieuwe inzichten?' },
  { key: 'whatDifferent',  icon: RefreshCw,  color: '#f59e0b', label: 'WAT ZOU JE ANDERS DOEN?', placeholder: 'Verbeterpunten?' }
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

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 10000, padding: isMobile ? 0 : '1.5rem' }}
    >
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: isMobile ? '12px 12px 0 0' : '12px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '460px',
        maxHeight: isMobile ? '92vh' : '85vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* ═══ HEADER ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.75rem 1rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lightbulb size={13} color="#8b5cf6" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>Reflectie</span>
            <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MOMENT</span>
          </div>
          <button onClick={onClose} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', touchAction: 'manipulation' }}>
            <X size={13} />
          </button>
        </div>

        {/* Task naam */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>VOLTOOID</div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a78bfa' }}>{task.title}</span>
        </div>

        {/* ═══ FORM ═══ */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* RATING */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: ratingError ? '#ef4444' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Star size={8} /> HOE GING HET? *
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.5rem' : '0.625rem', padding: '0.5rem 0' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => { setRating(star); setRatingError(false) }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Star
                    size={isMobile ? 30 : 34}
                    fill={activeRating >= star ? '#f59e0b' : 'transparent'}
                    color={activeRating >= star ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
                    style={{ transition: 'all 0.1s ease' }}
                  />
                </button>
              ))}
            </div>

            {/* Rating label */}
            <div style={{ textAlign: 'center', height: '16px' }}>
              {activeRating > 0 && (
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#f59e0b' }}>
                  {RATING_LABELS[activeRating]}
                </span>
              )}
              {ratingError && activeRating === 0 && (
                <span style={{ fontSize: '0.6rem', color: '#ef4444' }}>Geef een rating</span>
              )}
            </div>
          </div>

          {/* TEKST VELDEN */}
          {FIELDS.map(({ key, icon: Icon, color, label, placeholder }) => (
            <div key={key} style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Icon size={8} color={color} /> {label}
              </div>
              <textarea
                value={answers[key]}
                onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                placeholder={placeholder}
                rows={2}
                style={{
                  width: '100%', padding: 0, background: 'transparent',
                  border: 'none', borderLeft: answers[key].trim() ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.06)',
                  paddingLeft: '0.5rem',
                  outline: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem',
                  resize: 'none', lineHeight: 1.5,
                  transition: 'border-color 0.15s ease'
                }}
              />
            </div>
          ))}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={handleSkip}
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.6rem 0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', minHeight: '40px', touchAction: 'manipulation', whiteSpace: 'nowrap' }}
          >
            <SkipForward size={11} /> Overslaan
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1, padding: '0.6rem', background: submitting ? 'rgba(139,92,246,0.3)' : '#8b5cf6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer', minHeight: '40px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            {submitting ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
