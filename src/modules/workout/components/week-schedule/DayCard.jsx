// src/modules/workout/components/week-schedule/DayCard.jsx
//
// Geïntegreerde dag-card. Sleepgebaren zijn vervangen door chevron-knoppen
// onderin de card — tap-to-shift. Bij een bezette doeldag wisselen de twee.
//
// Status-conventie:
//   · Vandaag   → gouden bovenrand-pill + gouden border + glow
//   · Voltooid  → volledige groene tint + check rechtsonder (geen pijlen)
//   · Selected  → gouden border (lichter dan vandaag)
//   · Default   → enkel grijs-glass card
//   · Rust      → dashed border + "RUST" label (geen pijlen)

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import WorkoutIndicator from './WorkoutIndicator'
import CustomWorkoutIndicator from './CustomWorkoutIndicator'

export default function DayCard({
  dayIndex, workoutKey, workoutData,
  isToday, isCompleted, isSelected,
  isMobile, weekDaysDutch,
  onClick, swapMode,
  onShiftLeft, onShiftRight, canShiftLeft, canShiftRight,
  dayDate, isViewOnly,
}) {
  const isCustom = workoutKey?.startsWith('custom_')
  const isActivity = ['cardio', 'swimming', 'hiking', 'cycling', 'running'].includes(workoutKey)
  const hasContent = !!workoutData || isActivity

  const handleClick = () => { if (onClick) onClick() }

  // Eén kleur- + border-systeem per state. Eerste match wint.
  const tone = (() => {
    if (isCompleted) return {
      bg: 'rgba(16,185,129, 0.12)',
      border: 'rgba(16,185,129, 0.55)',
      glow: '0 4px 14px rgba(16,185,129,0.18)',
      label: '#10b981',
      arrowColor: '#10b981',
    }
    if (isToday) return {
      bg: 'rgba(255,215,0, 0.08)',
      border: 'rgba(255,215,0, 0.7)',
      glow: '0 6px 18px rgba(255,215,0,0.22)',
      label: '#000',
      arrowColor: '#FFD700',
    }
    if (isSelected) return {
      bg: 'rgba(255,215,0, 0.06)',
      border: 'rgba(255,215,0, 0.4)',
      glow: '0 3px 10px rgba(255,215,0,0.12)',
      label: 'rgba(255,215,0, 0.85)',
      arrowColor: '#FFD700',
    }
    return {
      bg: 'rgba(255,255,255, 0.045)',
      border: 'rgba(255,255,255, 0.09)',
      glow: '0 2px 6px rgba(0,0,0,0.2)',
      label: 'rgba(255,255,255, 0.6)',
      arrowColor: 'rgba(255,255,255, 0.7)',
    }
  })()

  // Padding-top reserveert ruimte voor de "VANDAAG"-pill aan de bovenrand.
  const topPadding = isToday
    ? (isMobile ? 22 : 24)
    : (isMobile ? 8 : 10)

  // Onderaan-padding maakt ruimte voor de chevron-rij, of voor de
  // completed-check, of voor "RUST".
  const showArrows = hasContent && !isCompleted && !isViewOnly
  const bottomPadding = showArrows
    ? (isMobile ? 24 : 28)
    : (isMobile ? 8 : 10)

  // Geen horizontale padding: zo kan de foto-banner van WorkoutIndicator
  // edge-to-edge in de card zitten. Tekst-elementen die wel marge willen
  // krijgen die intern (zie dayLabel).
  //
  // Vaste `height` (geen `minHeight`) zodat ALLE cards altijd exact dezelfde
  // afmeting hebben — onafhankelijk van titel-lengte of voltooid-status.
  const sharedCardStyle = {
    position: 'relative',
    width: '100%', minWidth: 0,   // niet meegroeien met lange titels
    paddingTop: topPadding,
    paddingBottom: bottomPadding,
    paddingLeft: 0,
    paddingRight: 0,
    height: isMobile ? 108 : 124,
    borderRadius: isMobile ? 12 : 14,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    textAlign: 'center',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    overflow: 'hidden',
    transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  }

  const dateNum = dayDate ? dayDate.getDate() : null

  // ── Gouden pill bovenaan voor vandaag (edge-to-edge binnen de card-rand)
  const todayPill = (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      background: '#FFD700',
      padding: isMobile ? '3px 4px 3px' : '4px 4px 3px',
      fontSize: isMobile ? '0.6rem' : '0.65rem',
      fontWeight: 900,
      color: '#000',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      lineHeight: 1,
      textAlign: 'center',
    }}>
      {weekDaysDutch[dayIndex]}{dateNum ? ` ${dateNum}` : ''}
    </div>
  )

  // ── Niet-vandaag dag-label (inline bovenin de content). Padding-bottom
  // creëert de gap tussen label en foto-banner.
  const dayLabel = (
    <div style={{
      fontSize: isMobile ? '0.68rem' : '0.72rem',
      fontWeight: 700,
      color: tone.label,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      lineHeight: 1,
      paddingBottom: isMobile ? 6 : 8,
    }}>
      {weekDaysDutch[dayIndex]}{dateNum ? ` ${dateNum}` : ''}
    </div>
  )

  // ── Chevron-rij (alleen wanneer er content is en niet voltooid)
  const arrowRow = showArrows ? (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      display: 'flex',
      borderTop: `1px solid ${tone.border}`,
      // Container is zelf onklikbaar; alleen de twee chevron-knoppen pakken
      // events, zodat de rest van de card-tap blijft werken.
      pointerEvents: 'none',
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); if (canShiftLeft && onShiftLeft) { onShiftLeft(); if (navigator.vibrate) navigator.vibrate(25) } }}
        disabled={!canShiftLeft}
        aria-label="Schuif workout naar vorige dag"
        style={chevronBtnStyle(isMobile, canShiftLeft, tone.arrowColor)}
      >
        <ChevronLeft size={isMobile ? 13 : 15} strokeWidth={2.8} />
      </button>
      <div style={{ width: 1, background: tone.border, opacity: 0.4 }} />
      <button
        onClick={(e) => { e.stopPropagation(); if (canShiftRight && onShiftRight) { onShiftRight(); if (navigator.vibrate) navigator.vibrate(25) } }}
        disabled={!canShiftRight}
        aria-label="Schuif workout naar volgende dag"
        style={chevronBtnStyle(isMobile, canShiftRight, tone.arrowColor)}
      >
        <ChevronRight size={isMobile ? 13 : 15} strokeWidth={2.8} />
      </button>
    </div>
  ) : null

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      {hasContent ? (
        <div
          onClick={isViewOnly ? undefined : handleClick}
          style={{
            ...sharedCardStyle,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            boxShadow: tone.glow,
            cursor: isViewOnly ? 'default' : 'pointer',
            opacity: isViewOnly ? 0.75 : 1,
          }}
        >
          {isToday ? todayPill : dayLabel}

          {/* Workout-content */}
          {isCustom ? (
            <CustomWorkoutIndicator workout={workoutData} isMobile={isMobile} />
          ) : workoutData ? (
            <WorkoutIndicator workoutData={workoutData} isMobile={isMobile} />
          ) : (
            // Activity placeholder (cardio / swim / etc.)
            <div style={{
              width: isMobile ? 30 : 34, height: isMobile ? 30 : 34,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 4,
            }}>
              <div style={{
                width: isMobile ? 8 : 9, height: isMobile ? 8 : 9,
                borderRadius: '50%', background: 'rgba(255,255,255,0.3)',
              }} />
            </div>
          )}

          {/* Voltooid-check rechtsonder (in plaats van pijlen). */}
          {isCompleted && (
            <div style={{
              position: 'absolute',
              bottom: isMobile ? 4 : 5,
              right: isMobile ? 4 : 5,
            }}>
              <Check size={isMobile ? 12 : 14} color="#10b981" strokeWidth={3} />
            </div>
          )}

          {arrowRow}
        </div>
      ) : (
        // Rust-dag — dashed border + "RUST" label, geen pijlen
        <div
          onClick={swapMode ? handleClick : undefined}
          style={{
            ...sharedCardStyle,
            paddingBottom: isMobile ? 8 : 10,
            background: isToday ? 'rgba(255,215,0, 0.05)' : 'transparent',
            border: isToday
              ? `1px solid ${tone.border}`
              : '1px dashed rgba(255,255,255,0.12)',
            boxShadow: isToday ? tone.glow : 'none',
            cursor: swapMode ? 'pointer' : 'default',
            justifyContent: isToday ? 'flex-start' : 'center',
          }}
        >
          {isToday ? todayPill : dayLabel}
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginTop: isToday ? 'auto' : 0,
            marginBottom: isToday ? 'auto' : 0,
          }}>
            Rust
          </div>
        </div>
      )}
    </div>
  )
}

const chevronBtnStyle = (isMobile, enabled, color) => ({
  flex: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: isMobile ? '5px 2px' : '6px 2px',
  background: 'transparent',
  border: 'none',
  color,
  opacity: enabled ? 0.85 : 0.18,
  cursor: enabled ? 'pointer' : 'not-allowed',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 0.12s ease, opacity 0.12s ease',
})
