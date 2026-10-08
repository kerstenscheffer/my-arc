// src/modules/workout/components/week-schedule/DayCard.jsx
//
// Dagkaart met twee tegels onder elkaar: de training en de cardio. Elke
// tegel is een foto met de titel erop en eigen pijltjes aan de foto vast,
// zodat je training en cardio los van elkaar een dag kunt verschuiven.
// Een dag zonder beide is een smalle kolom met 'Rust'.
//
// Status-conventie (wit, geen goud):
//   · Vandaag   → witte pil bovenaan + witte rand
//   · Voltooid  → groene tint + vinkje (geen pijltjes)
//   · Rust-waarschuwing → rode/oranje rand als dezelfde training te dicht
//     op deze dag staat

import { Check, ChevronLeft, ChevronRight, HeartPulse, Dumbbell, Trash2, Footprints } from 'lucide-react'
import { cardioFoto } from '../../utils/workoutFoto'
import { getWorkoutImage } from './workoutImage'

// Eén tegel: foto, verloop, eyebrow + titel linksonder, pijltjes onderin.
function Tegel({ foto, eyebrow, titel, sub, klaar, kanSchuiven, onLinks, onRechts, kanLinks, kanRechts, onClick, isMobile, icoon, groei = 1, onVerwijder = null }) {
  // Als variabele met hoofdletter, anders telt de lint-regel de JSX-aanroep niet.
  const Icoon = icoon
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', flex: groei, minHeight: isMobile ? 58 : 66, width: '100%',
        borderRadius: 10, overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${klaar ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: klaar ? 0.45 : 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.88) 100%)' }} />
      <div style={{ position: 'absolute', left: 4, right: 4, bottom: kanSchuiven ? (isMobile ? 20 : 22) : 4, textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: isMobile ? '0.46rem' : '0.52rem', fontWeight: 900, color: klaar ? '#10b981' : 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
          {klaar ? <Check size={9} strokeWidth={3.2} /> : <Icoon size={9} strokeWidth={2.8} />}{klaar ? 'Gedaan' : eyebrow}
        </div>
        <div style={{ fontSize: isMobile ? '0.68rem' : '0.78rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {titel}
        </div>
        {sub && (
          <div style={{ fontSize: isMobile ? '0.54rem' : '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 6px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub}
          </div>
        )}
      </div>
      {/* Prullenbak rechtsboven, kaal wit: training alleen deze week weg,
          cardio voorgoed. */}
      {onVerwijder && !klaar && (
        <button onClick={(e) => { e.stopPropagation(); onVerwijder(); if (navigator.vibrate) navigator.vibrate(25) }} aria-label="Weghalen" style={{
          position: 'absolute', top: 2, right: 2, width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, padding: 0,
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <Trash2 size={isMobile ? 13 : 14} strokeWidth={2.8} />
        </button>
      )}
      {/* Pijltjes aan de foto vast: links en rechts in de onderrand. */}
      {kanSchuiven && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
          <button onClick={(e) => { e.stopPropagation(); if (kanLinks && onLinks) { onLinks(); if (navigator.vibrate) navigator.vibrate(25) } }} disabled={!kanLinks} aria-label="Naar vorige dag" style={pijl(isMobile, kanLinks)}>
            <ChevronLeft size={isMobile ? 13 : 15} strokeWidth={3} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (kanRechts && onRechts) { onRechts(); if (navigator.vibrate) navigator.vibrate(25) } }} disabled={!kanRechts} aria-label="Naar volgende dag" style={pijl(isMobile, kanRechts)}>
            <ChevronRight size={isMobile ? 13 : 15} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  )
}

const pijl = (isMobile, aan) => ({
  width: isMobile ? 26 : 30, height: isMobile ? 20 : 22, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.35)', border: 'none', color: '#fff',
  opacity: aan ? 0.95 : 0.2, cursor: aan ? 'pointer' : 'not-allowed', pointerEvents: 'auto',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function DayCard({
  dayIndex, workoutKey, workoutData,
  isToday, isCompleted, isSelected,
  isMobile, weekDaysDutch,
  onClick, swapMode,
  onShiftLeft, onShiftRight, canShiftLeft, canShiftRight,
  dayDate, kanPlannen = true, kanOpenen = true, gedimd = false,
  rust = null,
  // Cardio op deze dag: [{ id, soort, tijd, duur, gedaan }].
  cardio = [],
  onCardioShiftLeft, onCardioShiftRight,
  onRemoveTraining = null, onRemoveCardio = null,
  onOpenGedaan = null, onOpenCardioGedaan = null,
  smal = false,
  // Dag en datum staan in de strook boven het rooster; dan hier geen label.
  metLabel = true,
  trainingTijd = null,
  // Stappen van deze dag ({ steps, gehaald, toekomst }) in de kop van de
  // tegel, zodat training en stappen één kaart zijn (8 okt 2026).
  stappen = null, stappenDoel = 8000,
  // Een gedane sessie die niet bij de geplande training hoort (bv. na een
  // planwissel): { naam }. Komt als eigen groene tegel boven de planning.
  gedaanAnders = null,
}) {
  const isActivity = ['cardio', 'swimming', 'hiking', 'cycling', 'running'].includes(workoutKey)
  const heeftTraining = !!workoutData || isActivity || !!gedaanAnders
  const heeftCardio = Array.isArray(cardio) && cardio.length > 0
  const cardioKlaar = heeftCardio && cardio.every(c => c.gedaan)
  const handleClick = () => { if (onClick) onClick() }
  const logCardio = (c) => {
    // De log hoort bij de dag van de tegel, ook als je hem op een andere dag
    // invult; anders springt de tegel niet op Gedaan.
    const datum = dayDate ? `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}` : null
    window.dispatchEvent(new CustomEvent('myarc:cardio-log', { detail: { soort: c.soort, minuten: c.duur, datum } }))
    if (navigator.vibrate) navigator.vibrate(15)
  }

  const RUST_KLEUR = { rood: '#ef4444', oranje: '#f59e0b' }
  const alles = heeftTraining && heeftCardio
  const allesKlaar = (!heeftTraining || isCompleted) && (!heeftCardio || cardioKlaar) && (heeftTraining || heeftCardio)
  const tone = (() => {
    if (rust && !isCompleted) return { bg: rust === 'rood' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)', border: RUST_KLEUR[rust], label: isToday ? '#000' : RUST_KLEUR[rust] }
    if (allesKlaar) return { bg: 'rgba(16,185,129, 0.08)', border: 'rgba(16,185,129, 0.45)', label: '#10b981' }
    if (isToday) return { bg: 'rgba(255,255,255, 0.06)', border: 'rgba(255,255,255, 0.85)', label: '#000' }
    if (isSelected) return { bg: 'rgba(255,255,255, 0.05)', border: 'rgba(255,255,255, 0.4)', label: 'rgba(255,255,255, 0.9)' }
    return { bg: 'rgba(255,255,255, 0.035)', border: 'rgba(255,255,255, 0.08)', label: 'rgba(255,255,255, 0.55)' }
  })()

  const hoogte = isMobile ? 176 : 204
  const dateNum = dayDate ? dayDate.getDate() : null

  const stappenKop = (() => {
    if (!stappen) return null
    const n = Number(stappen.steps) || 0
    const tekst = n === 0 ? (stappen.toekomst ? '' : '0') : n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : String(n)
    const deel = Math.min(1, n / Math.max(1, stappenDoel))
    const kleur = stappen.gehaald ? '#10b981' : n > 0 ? '#fff' : 'rgba(255,255,255,0.3)'
    return (
      <div title={`${n.toLocaleString('nl-NL')} stappen`} style={{ width: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3, padding: smal ? '0 1px' : '0 2px', boxSizing: 'border-box', marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: smal ? (isMobile ? '0.64rem' : '0.72rem') : (isMobile ? '0.78rem' : '0.88rem'), fontWeight: 900, color: kleur, lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {!smal && <Footprints size={isMobile ? 10 : 11} strokeWidth={2.6} style={{ opacity: 0.8 }} />}
          <span>{tekst || '·'}</span>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(deel * 100)}%`, height: '100%', background: stappen.gehaald ? '#10b981' : 'rgba(255,255,255,0.7)', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      </div>
    )
  })()
  const kaart = {
    position: 'relative', width: '100%', minWidth: 0,
    height: hoogte, borderRadius: isMobile ? 12 : 14,
    paddingTop: !metLabel ? (isMobile ? 3 : 4) : isToday ? (isMobile ? 22 : 24) : (isMobile ? 6 : 8),
    paddingBottom: isMobile ? 4 : 5, paddingLeft: isMobile ? 3 : 4, paddingRight: isMobile ? 3 : 4,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    textAlign: 'center', overflow: 'hidden', boxSizing: 'border-box',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  }

  const todayPill = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#fff', padding: isMobile ? '3px 4px 3px' : '4px 4px 3px', fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1, textAlign: 'center' }}>
      {weekDaysDutch[dayIndex]}{dateNum && !smal ? ` ${dateNum}` : ''}
    </div>
  )
  const dayLabel = (
    <div style={{ fontSize: isMobile ? '0.66rem' : '0.72rem', fontWeight: 800, color: tone.label, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1, paddingBottom: 4, flexShrink: 0 }}>
      {weekDaysDutch[dayIndex]}{dateNum && !smal ? ` ${dateNum}` : ''}
    </div>
  )

  // Lege dag: smalle kolom met 'Rust'.
  if (!heeftTraining && !heeftCardio) {
    return (
      <div style={{ position: 'relative', minWidth: 0 }}>
        <div onClick={swapMode ? handleClick : undefined} style={{
          ...kaart, paddingLeft: 0, paddingRight: 0,
          ...(!metLabel ? { paddingTop: 0, paddingBottom: 0, borderRadius: 8 } : {}),
          background: isToday && metLabel ? 'rgba(255,255,255, 0.05)' : 'transparent',
          border: isToday && metLabel ? `1px solid ${tone.border}` : '1px dashed rgba(255,255,255,0.12)',
          cursor: swapMode ? 'pointer' : 'default', opacity: gedimd ? 0.7 : 1,
        }}>
          {metLabel && (isToday ? todayPill : dayLabel)}
          {stappenKop}
          <div style={{ fontSize: smal ? '0.5rem' : (isMobile ? '0.6rem' : '0.65rem'), fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: smal ? '0.04em' : '0.1em', textTransform: 'uppercase', marginTop: 'auto', marginBottom: 'auto' }}>
            Rust
          </div>
        </div>
      </div>
    )
  }

  const titelTraining = (workoutData?.name || workoutData?.focus || (isActivity ? workoutKey : '')).trim()
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <div style={{
        ...kaart, opacity: gedimd ? 0.7 : 1,
        // Met de dagenstrook erboven staan de tegels op zichzelf: geen vlak,
        // geen rand, geen binnenruimte. De kolomafstand scheidt de dagen.
        ...(metLabel
          ? { background: tone.bg, border: `1px solid ${tone.border}` }
          : { background: 'transparent', border: 'none', padding: 0, borderRadius: 0, overflow: 'visible' }),
      }}>
        {metLabel && (isToday ? todayPill : dayLabel)}
        {stappenKop}
        <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {gedaanAnders && (
            <Tegel
              foto={getWorkoutImage({ name: gedaanAnders.naam || 'Training' })}
              eyebrow="Gedaan" titel={gedaanAnders.naam || 'Training'}
              klaar kanSchuiven={false}
              onClick={onOpenGedaan || undefined}
              isMobile={isMobile} icoon={Dumbbell}
            />
          )}
          {(workoutData || isActivity) && (
            <Tegel
              foto={getWorkoutImage(workoutData || { name: workoutKey })}
              eyebrow="Training" titel={titelTraining || 'Training'}
              sub={trainingTijd || null}
              klaar={isCompleted}
              kanSchuiven={!isCompleted && kanPlannen}
              onLinks={onShiftLeft} onRechts={onShiftRight} kanLinks={canShiftLeft} kanRechts={canShiftRight}
              onClick={isCompleted && onOpenGedaan ? onOpenGedaan : (kanOpenen || swapMode ? handleClick : undefined)}
              isMobile={isMobile} icoon={Dumbbell}
              groei={alles ? 1.15 : 1}
              onVerwijder={kanPlannen && onRemoveTraining ? onRemoveTraining : null}
            />
          )}
          {heeftCardio && (
            <Tegel
              foto={cardioFoto(cardio[0].soort)}
              eyebrow="Cardio" titel={cardio[0].soort + (cardio.length > 1 ? ` +${cardio.length - 1}` : '')}
              sub={`${cardio[0].tijd}${cardio[0].duur ? ` · ${cardio[0].duur} min` : ''}`}
              klaar={cardioKlaar}
              kanSchuiven={!cardioKlaar && kanPlannen && !!onCardioShiftLeft}
              onLinks={() => onCardioShiftLeft?.(cardio[0])} onRechts={() => onCardioShiftRight?.(cardio[0])}
              kanLinks={dayIndex > 0} kanRechts={dayIndex < 6}
              onClick={cardioKlaar && onOpenCardioGedaan ? () => onOpenCardioGedaan(cardio[0]) : (kanOpenen ? () => logCardio(cardio[0]) : undefined)}
              isMobile={isMobile} icoon={HeartPulse}
              onVerwijder={kanPlannen && onRemoveCardio ? () => onRemoveCardio(cardio[0]) : null}
            />
          )}
        </div>
      </div>
    </div>
  )
}
