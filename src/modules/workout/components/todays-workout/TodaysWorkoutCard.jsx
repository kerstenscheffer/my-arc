// src/modules/workout/components/todays-workout/TodaysWorkoutCard.jsx
//
// V2 — "stroomlijn" pass: minder kleine letters, dikkere knop. Het hele
// kaartje is een grote tap-target met een duidelijke Start/Open-knop
// die niet kan worden gemist. Voorheen was de actie een 40px vierkant
// icoon zonder tekst — dat is nu een knop met tekst + pijl.

import React, { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function TodaysWorkoutCard({ workout, onLogClick, logsCount, isCompleted: isCompletedProp, completionPct = 0, client, db, isExpanded }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getWorkoutImage = () => {
    if (!workout) return null
    const focus = workout.focus?.toLowerCase() || workout.name?.toLowerCase() || ''
    if (focus.includes('chest') || focus.includes('push') || focus.includes('borst'))
      return 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('back') || focus.includes('pull') || focus.includes('rug'))
      return 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('leg') || focus.includes('squat') || focus.includes('been'))
      return 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('shoulder') || focus.includes('delt') || focus.includes('schouder'))
      return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('arm') || focus.includes('bicep') || focus.includes('tricep') || focus.includes('curl'))
      return 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('cardio') || focus.includes('run') || focus.includes('fiets'))
      return 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&h=600&fit=crop&q=80&crop=center'
    if (focus.includes('full body') || focus.includes('total'))
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop&q=80&crop=center'
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&q=80&crop=center'
  }

  // "Voltooid" pas als álle oefeningen volledig gelogd zijn (prop). Fallback op
  // het oude gedrag (≥1 log) alleen als de prop niet is meegegeven.
  const isCompleted = isCompletedProp !== undefined ? isCompletedProp : logsCount > 0
  const pct = Math.max(0, Math.min(100, Math.round(completionPct || 0)))
  const inProgress = !isCompleted && pct > 0
  const photoHeight = isMobile ? 110 : 140

  const accent = isCompleted ? '#10b981' : '#FFD700'

  // Wanneer uitgeklapt: floating sluit-knop rechtsboven, rest weg.
  if (isExpanded) {
    return (
      <button
        onClick={onLogClick}
        aria-label="Sluit workout"
        style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 12 : 16}px)`,
          right: isMobile ? 12 : 18,
          zIndex: 80,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '8px 14px' : '10px 16px',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${accent}55`,
          borderRadius: 999,
          color: accent,
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
        }}
      >
        Sluit
        <ChevronDown
          size={isMobile ? 14 : 16}
          strokeWidth={2.6}
          style={{ transform: 'rotate(180deg)' }}
        />
      </button>
    )
  }

  return (
    <div
      onClick={onLogClick}
      style={{
        padding: isMobile ? '0.6rem 1rem 0.75rem' : '0.75rem 1.5rem 1rem',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Foto — alleen tonen wanneer dropdown gesloten is (focus-mode bij open). */}
      {!isExpanded && (
        <div style={{
          width: '100%',
          height: photoHeight,
          borderRadius: 14,
          position: 'relative', overflow: 'hidden',
          marginBottom: isMobile ? '0.65rem' : '0.85rem',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${getWorkoutImage()})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: isCompleted ? 0.55 : 1,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }} />
          {isCompleted && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={photoHeight / 2.6} color="white" strokeWidth={3} />
            </div>
          )}

          {/* Voortgang tijdens loggen: %-badge rechtsboven + balk onderaan. */}
          {inProgress && (
            <>
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                border: `1px solid ${accent}66`, borderRadius: 999,
                padding: isMobile ? '0.2rem 0.5rem' : '0.25rem 0.6rem',
                display: 'flex', alignItems: 'baseline', gap: 2,
              }}>
                <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 900, color: accent, lineHeight: 1 }}>{pct}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: accent, opacity: 0.8 }}>%</span>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(0,0,0,0.45)' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: accent, transition: 'width 0.3s ease' }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Info-rij onder de foto: label/naam/stats links, chevron rechts */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: isMobile ? '0.6rem' : '0.85rem',
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {/* Gouden uppercase label */}
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: 800,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1, marginBottom: 4, opacity: 0.85,
          }}>
            {isCompleted ? 'Voltooid' : inProgress ? `${pct}% voltooid` : 'Training'}
          </div>

          {/* Workout-naam */}
          <h2 style={{
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: 900, color: '#fff',
            margin: 0, marginBottom: 5,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {workout.name || workout.focus || 'Workout'}
          </h2>

          {/* Meta-rij — compacte stats zoals MealCard macros */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.6rem' : '0.8rem',
            alignItems: 'baseline',
            overflow: 'hidden',
          }}>
            {workout.exercises && workout.exercises.length > 0 && (
              <Stat val={workout.exercises.length} label="oef" isMobile={isMobile} />
            )}
            {workout.geschatteTijd && (
              <Stat val={String(workout.geschatteTijd).replace(/[^0-9]/g, '') || workout.geschatteTijd} label="min" isMobile={isMobile} />
            )}
            {logsCount > 0 && (
              <Stat val={logsCount} label="gelogd" isMobile={isMobile} color={accent} />
            )}
          </div>
        </div>

        {/* Chevron — gouden cirkel-knop, duidelijker dan los icoontje. */}
        <div style={{
          flexShrink: 0,
          width: isMobile ? 42 : 48, height: isMobile ? 42 : 48,
          borderRadius: '50%',
          background: isCompleted
            ? 'rgba(16,185,129,0.15)'
            : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
          border: isCompleted ? '1.5px solid rgba(16,185,129,0.5)' : 'none',
          boxShadow: isCompleted
            ? '0 4px 12px rgba(16,185,129,0.25)'
            : '0 6px 16px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.4)',
          color: isCompleted ? '#10b981' : '#0a0a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}>
          <ChevronDown size={isMobile ? 22 : 26} strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}

function Stat({ val, label, isMobile, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{
        fontSize: isMobile ? '0.78rem' : '0.85rem',
        fontWeight: 800,
        color: color || 'rgba(255,255,255,0.75)',
      }}>{val}</span>
      <span style={{
        fontSize: isMobile ? '0.55rem' : '0.6rem',
        fontWeight: 700,
        color: color ? `${color}` : 'rgba(255,255,255,0.32)',
        opacity: color ? 0.7 : 1,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>{label}</span>
    </div>
  )
}
