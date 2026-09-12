// src/modules/workout/components/todays-workout/TodaysWorkoutCard.jsx
//
// V2 — "stroomlijn" pass: minder kleine letters, dikkere knop. Het hele
// kaartje is een grote tap-target met een duidelijke Start/Open-knop
// die niet kan worden gemist. Voorheen was de actie een 40px vierkant
// icoon zonder tekst — dat is nu een knop met tekst + pijl.

import React, { useState, useEffect } from 'react'
import { Check, ChevronDown, Timer } from 'lucide-react'
import { useRef } from 'react'
import { actieveOefeningen } from '../../utils/exerciseCompletion'

export default function TodaysWorkoutCard({
  workout, onLogClick, logsCount, isCompleted: isCompletedProp, completionPct = 0,
  client, db, isExpanded,
  // De workout-timer hoort bij de kop: die blijft staan terwijl je door de
  // oefeningen scrolt. Zweefde eerder los over de pagina.
  timerElapsedSec = 0, timerRunning = false, timerStarted = false,
  timerFinished = false, onTimerToggle, onTimerReset,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const formatElapsed = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Eén tik = start/stop, snelle dubbeltik = reset. De enkele tik wacht 280ms
  // zodat hij niet ook afgaat bij een dubbeltik.
  const lastTapRef = useRef(0)
  const tapTimeoutRef = useRef(null)
  const handleTimerTap = (e) => {
    e.stopPropagation()
    const now = Date.now()
    if (now - lastTapRef.current < 280) {
      clearTimeout(tapTimeoutRef.current)
      lastTapRef.current = 0
      onTimerReset && onTimerReset()
    } else {
      lastTapRef.current = now
      clearTimeout(tapTimeoutRef.current)
      tapTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = 0
        onTimerToggle && onTimerToggle()
      }, 280)
    }
  }

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

  // Uitgeklapt: een kop boven de oefeningen, in dezelfde vorm als het
  // log-scherm — foto van de trainingsdag, daaronder de naam met een badge en
  // de cijfers. Voorheen bleef er alleen een zwevende "Sluit" over en begon de
  // lijst zonder dat er ergens stond welke training je aan het doen bent.
  if (isExpanded) {
    return (
      <div style={{
        position: 'relative', width: '100%',
        height: isMobile ? 190 : 230,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${getWorkoutImage()})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: isCompleted ? 0.5 : 1,
        }} />
        {/* De foto loopt onderaan dood in de achtergrond in plaats van met een
            harde rand te eindigen. Titel en cijfers liggen erop, dus die
            kosten geen extra hoogte meer. */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0) 30%, rgba(10,10,10,0.75) 68%, #0a0a0a 100%)',
        }} />

        {inProgress && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: accent, transition: 'width 0.3s ease' }} />
          </div>
        )}

        {/* Balk over de foto: timer links, sluiten rechts. Allebei op dezelfde
            hoogte, zodat de bovenrand van de foto één rij is in plaats van
            twee losse zwevende knoppen. */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTimerTap}
          aria-label="Workout timer — tik om te starten of te pauzeren, dubbel-tik om te resetten"
          title={timerRunning ? 'Tik om te pauzeren · dubbel-tik = reset' : timerStarted ? 'Tik om verder te tellen · dubbel-tik = reset' : 'Tik om te starten'}
          style={{
            position: 'absolute',
            top: `calc(env(safe-area-inset-top, 0px) + 10px)`, left: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: 112, height: 40, borderRadius: 999,
            background: timerFinished ? '#10b981' : '#fff',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(0,0,0,0.5)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {timerFinished
            ? <Check size={15} color="#0a0a0a" strokeWidth={3} />
            : <Timer size={15} strokeWidth={2.4} color={timerRunning ? '#0a0a0a' : 'rgba(10,10,10,0.45)'} />}
          <span style={{
            fontSize: '0.95rem', fontWeight: 900,
            color: timerFinished ? '#0a0a0a' : timerRunning ? '#0a0a0a' : 'rgba(10,10,10,0.5)',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {timerStarted ? formatElapsed(timerElapsedSec) : '0:00'}
          </span>
        </div>

        <button
          onClick={onLogClick}
          aria-label="Sluit workout"
          style={{
            position: 'absolute',
            top: `calc(env(safe-area-inset-top, 0px) + 10px)`, right: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            height: 40, padding: '0 0.8rem', borderRadius: 12,
            background: 'rgba(10,10,10,0.7)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
            fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Sluit
          <ChevronDown size={15} strokeWidth={2.8} style={{ transform: 'rotate(180deg)' }} />
        </button>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: isMobile ? '0 1rem 0.85rem' : '0 1.5rem 1rem',
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#fff', margin: 0,
            letterSpacing: '-0.03em', lineHeight: 1.15, wordBreak: 'break-word',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
          }}>
            {workout.name || workout.focus || 'Workout'}
            {workout.focus && workout.focus !== workout.name && (
              <span style={{
                display: 'inline-block', verticalAlign: 'middle',
                marginLeft: 8, padding: '3px 8px', borderRadius: 6,
                background: accent, color: '#0a0a0a',
                fontSize: '0.56rem', fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                textShadow: 'none',
              }}>
                {workout.focus}
              </span>
            )}
          </h2>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap',
            marginTop: '0.25rem', fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 900, color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}>
            {actieveOefeningen(workout.exercises).length > 0 && (
              <span>{actieveOefeningen(workout.exercises).length}<span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78em', fontWeight: 800 }}> oefeningen</span></span>
            )}
            {workout.geschatteTijd && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
                <span>{String(workout.geschatteTijd).replace(/[^0-9]/g, '') || workout.geschatteTijd}<span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78em', fontWeight: 800 }}> min</span></span>
              </>
            )}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
            <span style={{ color: isCompleted ? '#10b981' : '#fff' }}>
              {pct}<span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78em', fontWeight: 800 }}>% klaar</span>
            </span>
          </div>
        </div>
      </div>
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
            {actieveOefeningen(workout.exercises).length > 0 && (
              <Stat val={actieveOefeningen(workout.exercises).length} label="oef" isMobile={isMobile} />
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
