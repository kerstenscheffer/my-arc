// src/modules/workout/components/week-schedule/DayCard.jsx
//
// Geïntegreerde dag-card. Sleepgebaren zijn vervangen door chevron-knoppen
// onderin de card — tap-to-shift. Bij een bezette doeldag wisselen de twee.
//
// Status-conventie (wit i.p.v. goud sinds deze pass — goud op vandaag, op de
// plan-naam én op de weekbalk maakte de strip onrustig; wit draagt hier
// hetzelfde "dit is nu" zonder te schreeuwen):
//   · Vandaag   → witte bovenrand-pill + witte border
//   · Voltooid  → groene tint + check rechtsonder (geen pijlen)
//   · Selected  → half-witte border
//   · Default   → grijs-glass card
//   · Rust      → dashed border + "RUST" label (geen pijlen)

import { Check, ChevronLeft, ChevronRight, HeartPulse } from 'lucide-react'
import WorkoutIndicator from './WorkoutIndicator'
import { cardioFoto } from '../../utils/workoutFoto'
import CustomWorkoutIndicator from './CustomWorkoutIndicator'

export default function DayCard({
  dayIndex, workoutKey, workoutData,
  isToday, isCompleted, isSelected,
  isMobile, weekDaysDutch,
  onClick, swapMode,
  onShiftLeft, onShiftRight, canShiftLeft, canShiftRight,
  dayDate, kanPlannen = true, kanOpenen = true, gedimd = false,
  // 'rood' of 'oranje' als dezelfde training te dicht op deze dag staat.
  rust = null,
  // Cardio op deze dag uit de agenda: [{ soort, tijd, duur, gedaan }]. Op een
  // trainingsdag een chip onder de training; op een rustdag de inhoud van
  // de kaart. cardioRij: er is deze week ergens cardio, dus elke kaart houdt
  // onderin dezelfde ruimte vrij zodat de rij gelijk blijft.
  cardio = [],
  cardioRij = false,
  // Smalle kolom (lege rustdag): dag en 'Rust' klein, verder niets.
  smal = false,
}) {
  const isCustom = workoutKey?.startsWith('custom_')
  const isActivity = ['cardio', 'swimming', 'hiking', 'cycling', 'running'].includes(workoutKey)
  const hasContent = !!workoutData || isActivity
  const heeftCardio = Array.isArray(cardio) && cardio.length > 0
  const cardioKlaar = heeftCardio && cardio.every(c => c.gedaan)
  const logCardio = (c) => {
    // De cardio-sectie luistert hiernaar en opent het logblad voorgevuld.
    window.dispatchEvent(new CustomEvent('myarc:cardio-log', { detail: { soort: c.soort, minuten: c.duur } }))
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const handleClick = () => { if (onClick) onClick() }

  // Eén kleur- + border-systeem per state. Eerste match wint. De
  // rust-waarschuwing gaat vóór alles behalve voltooid: te weinig hersteltijd
  // is het enige wat je op deze kaart nog moet weten.
  const RUST_KLEUR = { rood: '#ef4444', oranje: '#f59e0b' }
  const tone = (() => {
    if (rust && !isCompleted) {
      const k = RUST_KLEUR[rust]
      return {
        bg: rust === 'rood' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
        border: k,
        glow: 'none',
        label: isToday ? '#000' : k,
        arrowColor: k,
      }
    }
    if (isCompleted) return {
      bg: 'rgba(16,185,129, 0.10)',
      border: 'rgba(16,185,129, 0.45)',
      glow: 'none',
      label: '#10b981',
      arrowColor: '#10b981',
    }
    if (isToday) return {
      bg: 'rgba(255,255,255, 0.06)',
      border: 'rgba(255,255,255, 0.85)',
      glow: 'none',
      label: '#000',
      arrowColor: '#fff',
    }
    if (isSelected) return {
      bg: 'rgba(255,255,255, 0.05)',
      border: 'rgba(255,255,255, 0.4)',
      glow: 'none',
      label: 'rgba(255,255,255, 0.9)',
      arrowColor: '#fff',
    }
    return {
      bg: 'rgba(255,255,255, 0.035)',
      border: 'rgba(255,255,255, 0.08)',
      glow: 'none',
      label: 'rgba(255,255,255, 0.55)',
      arrowColor: 'rgba(255,255,255, 0.6)',
    }
  })()

  // Padding-top reserveert ruimte voor de "VANDAAG"-pill aan de bovenrand.
  const topPadding = isToday
    ? (isMobile ? 22 : 24)
    : (isMobile ? 8 : 10)

  // Onderaan-padding maakt ruimte voor de chevron-rij, of voor de
  // completed-check, of voor "RUST".
  // Pijltjes ook in een komende week: daar plan je juist vooruit.
  const showArrows = hasContent && !isCompleted && kanPlannen
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
    height: (isMobile ? 108 : 124) + (cardioRij ? (isMobile ? 22 : 24) : 0),
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

  // ── Witte pill bovenaan voor vandaag (edge-to-edge binnen de card-rand)
  const todayPill = (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      background: '#fff',
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
      fontWeight: 800,
      color: tone.label,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      lineHeight: 1,
      paddingBottom: isMobile ? 6 : 8,
    }}>
      {weekDaysDutch[dayIndex]}{dateNum && !smal ? ` ${dateNum}` : ''}
    </div>
  )

  // ── Cardio-chip onder de training: sport en tijd, groen als gelogd.
  const cardioChip = heeftCardio ? (
    <button
      onClick={(e) => { e.stopPropagation(); if (kanOpenen) logCardio(cardio[0]) }}
      title={cardio.map(c => `${c.soort} ${c.tijd}`).join(' · ')}
      style={{
        position: 'absolute', left: 4, right: 4,
        bottom: showArrows ? (isMobile ? 26 : 30) : (isMobile ? 5 : 6),
        height: isMobile ? 18 : 20, borderRadius: 6, padding: '0 5px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        background: cardioKlaar ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${cardioKlaar ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.18)'}`,
        color: cardioKlaar ? '#10b981' : '#fff', fontFamily: 'inherit', cursor: kanOpenen ? 'pointer' : 'default',
        fontSize: isMobile ? '0.56rem' : '0.6rem', fontWeight: 900, letterSpacing: '0.02em',
        whiteSpace: 'nowrap', overflow: 'hidden',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {cardioKlaar ? <Check size={10} strokeWidth={3.2} /> : <HeartPulse size={10} strokeWidth={2.8} />}
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {cardio[0].soort}{cardio.length > 1 ? ` +${cardio.length - 1}` : ''}{isMobile ? '' : ` · ${cardio[0].tijd}`}
      </span>
    </button>
  ) : null

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
          onClick={kanOpenen || swapMode ? handleClick : undefined}
          style={{
            ...sharedCardStyle,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            boxShadow: tone.glow,
            cursor: kanOpenen || swapMode ? 'pointer' : 'default',
            opacity: gedimd ? 0.7 : 1,
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

          {cardioChip}
          {arrowRow}
        </div>
      ) : heeftCardio ? (
        // Rustdag mét cardio: dan is de cardio de inhoud van de kaart. Foto
        // van de sport als banner, label CARDIO, sport en tijd eronder.
        <div
          onClick={() => { if (kanOpenen) logCardio(cardio[0]) }}
          style={{
            ...sharedCardStyle,
            paddingBottom: isMobile ? 8 : 10,
            background: cardioKlaar ? 'rgba(16,185,129, 0.10)' : tone.bg,
            border: `1px solid ${cardioKlaar ? 'rgba(16,185,129, 0.45)' : tone.border}`,
            cursor: kanOpenen ? 'pointer' : 'default',
            opacity: gedimd ? 0.7 : 1,
          }}
        >
          {isToday ? todayPill : dayLabel}
          <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cardioFoto(cardio[0].soort)})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: cardioKlaar ? 0.45 : 0.85 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)' }} />
            <div style={{ position: 'absolute', left: 4, right: 4, bottom: 4, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: 900, color: cardioKlaar ? '#10b981' : 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                {cardioKlaar ? 'Gedaan' : 'Cardio'}
              </div>
              <div style={{ fontSize: isMobile ? '0.66rem' : '0.74rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.15, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cardio[0].soort}
              </div>
              <div style={{ fontSize: isMobile ? '0.56rem' : '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 6px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums' }}>
                {cardio[0].tijd}{cardio[0].duur ? ` · ${cardio[0].duur} min` : ''}{cardio.length > 1 ? ` +${cardio.length - 1}` : ''}
              </div>
            </div>
          </div>
          {cardioKlaar && (
            <div style={{ position: 'absolute', bottom: isMobile ? 4 : 5, right: isMobile ? 4 : 5 }}>
              <Check size={isMobile ? 12 : 14} color="#10b981" strokeWidth={3} />
            </div>
          )}
        </div>
      ) : (
        // Rust-dag — dashed border + "RUST" label, geen pijlen
        <div
          onClick={swapMode ? handleClick : undefined}
          style={{
            ...sharedCardStyle,
            paddingBottom: isMobile ? 8 : 10,
            background: isToday ? 'rgba(255,255,255, 0.05)' : 'transparent',
            border: isToday
              ? `1px solid ${tone.border}`
              : '1px dashed rgba(255,255,255,0.12)',
            boxShadow: isToday ? tone.glow : 'none',
            cursor: swapMode ? 'pointer' : 'default',
            opacity: gedimd ? 0.7 : 1,
            // Dag + datum staan bovenaan, net als bij een trainingsdag; anders
            // liep de rij dag-labels niet door over de rustdagen heen.
            justifyContent: 'flex-start',
          }}
        >
          {isToday ? todayPill : dayLabel}
          <div style={{
            fontSize: smal ? '0.5rem' : (isMobile ? '0.6rem' : '0.65rem'),
            fontWeight: 800,
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: smal ? '0.04em' : '0.1em',
            textTransform: 'uppercase',
            marginTop: 'auto',
            marginBottom: 'auto',
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
