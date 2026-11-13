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

import { CircleCheck, ChevronLeft, ChevronRight, HeartPulse, Dumbbell, Trash2, Footprints, CalendarX } from 'lucide-react'
import { cardioFoto } from '../../utils/workoutFoto'
import { getWorkoutImage } from './workoutImage'

// Eén tegel: foto, verloop, eyebrow + titel linksonder, pijltjes onderin.
function Tegel({ foto, eyebrow, titel, soortTraining = null, sub, klaar, kanSchuiven, onLinks, onRechts, kanLinks, kanRechts, onClick, isMobile, icoon, groei = 1, onVerwijder = null, onUitplannen = null, band = null, aaneen = false }) {
  // Als variabele met hoofdletter, anders telt de lint-regel de JSX-aanroep niet.
  const Icoon = icoon
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', flex: groei, minHeight: isMobile ? 58 : 66, width: '100%',
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        // Aaneen: de dagen vormen samen één strook, dus geen eigen hoeken of
        // rand. Gedaan = alleen een groene lijn onderlangs; rondom gaf het
        // groene strepen tussen de dagen (13 nov 2026, Kersten).
        ...(aaneen
          ? { borderRadius: 0, boxShadow: klaar ? 'inset 0 -2px 0 rgba(16,185,129,0.8)' : 'none' }
          : { borderRadius: 10, border: `1px solid ${klaar ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}` }),
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: klaar ? 0.45 : 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.88) 100%)' }} />
      {/* Afgerond: een vinkje in een cirkel midden op de foto (13 nov 2026,
          Kersten); stond als het woord "Gedaan" boven de titel. */}
      {klaar && (
        <div aria-label="Gedaan" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <CircleCheck size={isMobile ? 24 : 28} strokeWidth={2.4} color="#10b981" style={{ filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.8))' }} />
        </div>
      )}
      {/* Stappen van de dag: een strook over de bovenkant van de foto, binnen
          de rand van de tegel, zodat het één kaart is. */}
      {band}
      <div style={{ position: 'absolute', left: 4, right: 4, bottom: kanSchuiven ? (isMobile ? 20 : 22) : 4, textAlign: 'left' }}>
        {/* Gedaan: geen woord, maar een vinkje midden op de tegel (zie hieronder). */}
        {!klaar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: isMobile ? '0.46rem' : '0.52rem', fontWeight: 900, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            <Icoon size={9} strokeWidth={2.8} />{eyebrow}
          </div>
        )}
        <div style={{ fontSize: isMobile ? '0.68rem' : '0.78rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {titel}
        </div>
        {/* Soort training van een cardioblok (sublabel), bv. 'Zone 2'. */}
        {soortTraining && (
          <div style={{ fontSize: isMobile ? '0.54rem' : '0.58rem', fontWeight: 800, color: '#06b6d4', textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {soortTraining}
          </div>
        )}
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
          position: 'absolute', top: band ? (isMobile ? 17 : 19) : 2, right: 2, width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, padding: 0,
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <Trash2 size={isMobile ? 13 : 14} strokeWidth={2.8} />
        </button>
      )}
      {/* Uitplannen (alleen builder): uit de week, blijft in het plan staan. */}
      {onUitplannen && !klaar && (
        <button onClick={(e) => { e.stopPropagation(); onUitplannen(); if (navigator.vibrate) navigator.vibrate(25) }} aria-label="Uitplannen" title="Uit de week halen, blijft in het plan" style={{
          position: 'absolute', top: band ? (isMobile ? 17 : 19) : 2, left: 2, width: isMobile ? 24 : 26, height: isMobile ? 24 : 26, padding: 0,
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <CalendarX size={isMobile ? 13 : 14} strokeWidth={2.6} />
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
  dayDate, kanPlannen = true, kanOpenen = true, kanBekijken = false, gedimd = false,
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
  extraTrainingen = [], onOpenExtra = null, onShiftExtra = null, onRemoveExtra = null, onUitplannen = null, onUitplannenExtra = null,
  onCardioInfo = null,
  // Dagen zonder tussenruimte naast elkaar (WeekGrid).
  aaneen = false,
}) {
  const isActivity = ['cardio', 'swimming', 'hiking', 'cycling', 'running'].includes(workoutKey)
  const heeftTraining = !!workoutData || isActivity || !!gedaanAnders || extraTrainingen.length > 0
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

  const hoogte = isMobile ? 144 : 168
  const dateNum = dayDate ? dayDate.getDate() : null

  // inTegel: strook over de foto van de bovenste tegel (13 nov 2026, Kersten:
  // de losse grijze band erboven hoorde er niet bij). Los = een rustdag, waar
  // geen tegel is om hem op te leggen.
  const stappenBand = (inTegel) => {
    if (!stappen) return null
    const n = Number(stappen.steps) || 0
    const tekst = n === 0 ? (stappen.toekomst ? '' : '0') : n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : String(n)
    const kort = (x) => (x >= 10000 ? `${Math.round(x / 1000)}k` : x >= 1000 ? `${(x / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k` : String(x))
    // Coach-rooster: bij vandaag het doel achter de stand (13 nov 2026, Kersten).
    const metDoel = !!stappen.doelTonen && stappenDoel > 0
    const deel = Math.min(1, n / Math.max(1, stappenDoel))
    // Van grijs naar groen naarmate er meer stappen staan: 3.000 is een
    // beetje groen, 10.000 helemaal (13 nov 2026, Kersten).
    const groen = Math.min(1, n / 10000)
    const meng = (van, naar) => Math.round(van + (naar - van) * groen)
    const kleur = n > 0 ? `rgb(${meng(255, 16)},${meng(255, 185)},${meng(255, 129)})` : 'rgba(255,255,255,0.4)'
    const vulling = `rgba(${meng(200, 16)},${meng(200, 185)},${meng(200, 129)},${(0.22 + 0.23 * groen).toFixed(2)})`
    return (
      <div title={`${n.toLocaleString('nl-NL')} stappen${metDoel ? ` · doel ${stappenDoel.toLocaleString('nl-NL')}` : ''}${stappen.onKlik ? ' · klik voor 30 en 90 dagen' : ''}`}
        // Coach-rooster: de stappen openen de grafiek over 30 en 90 dagen.
        onClick={stappen.onKlik ? (e) => { e.stopPropagation(); stappen.onKlik() } : undefined}
        onPointerDown={stappen.onKlik ? (e) => e.stopPropagation() : undefined}
        style={{
        cursor: stappen.onKlik ? 'pointer' : undefined,
        width: '100%', flexShrink: 0, height: isMobile ? 16 : 18, overflow: 'hidden', boxSizing: 'border-box',
        ...(inTegel
          ? { position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }
          : { position: 'relative', borderRadius: aaneen ? 0 : 8, background: 'rgba(255,255,255,0.06)' }),
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(deel * 100)}%`, background: vulling, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: smal ? (isMobile ? '0.58rem' : '0.64rem') : (isMobile ? '0.64rem' : '0.7rem'), fontWeight: 900, color: kleur, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {!smal && <Footprints size={isMobile ? 9 : 10} strokeWidth={2.6} style={{ opacity: 0.8 }} />}
          <span>{tekst || '·'}{metDoel && <span style={{ opacity: 0.6 }}> / {kort(stappenDoel)}</span>}</span>
        </div>
      </div>
    )
  }
  const kaart = {
    position: 'relative', width: '100%', minWidth: 0,
    minHeight: hoogte, borderRadius: isMobile ? 12 : 14,
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
      <div style={{ position: 'relative', minWidth: 0, display: 'flex' }}>
        <div onClick={swapMode ? handleClick : undefined} style={{
          ...kaart, paddingLeft: 0, paddingRight: 0,
          ...(!metLabel ? { paddingTop: 0, paddingBottom: 0, borderRadius: aaneen ? 0 : 8 } : {}),
          background: isToday && metLabel ? 'rgba(255,255,255, 0.05)' : aaneen ? 'rgba(255,255,255,0.035)' : 'transparent',
          border: aaneen ? 'none' : isToday && metLabel ? `1px solid ${tone.border}` : '1px dashed rgba(255,255,255,0.12)',
          cursor: swapMode ? 'pointer' : 'default', opacity: gedimd ? 0.7 : 1,
        }}>
          {metLabel && (isToday ? todayPill : dayLabel)}
          {stappenBand(false)}
          <div style={{ fontSize: smal ? '0.5rem' : (isMobile ? '0.6rem' : '0.65rem'), fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: smal ? '0.04em' : '0.1em', textTransform: 'uppercase', marginTop: 'auto', marginBottom: 'auto' }}>
            Rust
          </div>
        </div>
      </div>
    )
  }

  // Alleen de bovenste tegel sluit aan op de stappenband.
  let bandVrij = !!stappen
  const band = () => { const ja = bandVrij; bandVrij = false; return ja ? stappenBand(true) : null }
  const titelTraining = (workoutData?.name || workoutData?.focus || (isActivity ? workoutKey : '')).trim()
  return (
    <div style={{ position: 'relative', minWidth: 0, display: 'flex' }}>
      <div style={{
        ...kaart, opacity: gedimd ? 0.7 : 1,
        // Met de dagenstrook erboven staan de tegels op zichzelf: geen vlak,
        // geen rand, geen binnenruimte. De kolomafstand scheidt de dagen.
        ...(metLabel
          ? { background: tone.bg, border: `1px solid ${tone.border}` }
          : { background: 'transparent', border: 'none', padding: 0, borderRadius: 0, overflow: 'visible' }),
      }}>
        {metLabel && (isToday ? todayPill : dayLabel)}
        <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: aaneen ? 1 : 3 }}>
          {gedaanAnders && (
            <Tegel
              foto={getWorkoutImage({ name: gedaanAnders.naam || 'Training' })}
              eyebrow="Gedaan" titel={gedaanAnders.naam || 'Training'}
              klaar kanSchuiven={false}
              onClick={onOpenGedaan || undefined}
              aaneen={aaneen} isMobile={isMobile} icoon={Dumbbell} band={band()}
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
              onClick={isCompleted && onOpenGedaan ? onOpenGedaan : (kanOpenen || kanBekijken || swapMode ? handleClick : undefined)}
              aaneen={aaneen} isMobile={isMobile} icoon={Dumbbell} band={band()}
              groei={alles ? 1.15 : 1}
              onVerwijder={kanPlannen && onRemoveTraining ? onRemoveTraining : null}
              onUitplannen={kanPlannen && workoutData ? onUitplannen : null}
            />
          )}
          {extraTrainingen.map((x, i) => (
            <Tegel key={x.rosterKey}
              foto={getWorkoutImage(x.data || { name: x.key })}
              eyebrow={`Training ${i + 2}`} titel={(x.data?.name || x.data?.focus || x.key || 'Training').trim()}
              klaar={x.klaar}
              // Ook een tweede training van de dag kun je verschuiven (13 nov
              // 2026, Kersten: Push verloor zijn pijltjes zodra hij erbij kwam).
              kanSchuiven={!x.klaar && kanPlannen && !!onShiftExtra}
              onLinks={() => onShiftExtra?.(x.rosterKey, -1)} onRechts={() => onShiftExtra?.(x.rosterKey, +1)}
              kanLinks={dayIndex > 0} kanRechts={dayIndex < 6}
              onClick={x.klaar && onOpenGedaan ? onOpenGedaan : ((kanOpenen || kanBekijken) && onOpenExtra ? () => onOpenExtra(x.key) : undefined)}
              aaneen={aaneen} isMobile={isMobile} icoon={Dumbbell} band={band()}
              onVerwijder={kanPlannen && onRemoveExtra ? () => onRemoveExtra(x.rosterKey) : null}
              onUitplannen={kanPlannen && onUitplannenExtra ? () => onUitplannenExtra(x.rosterKey) : null}
            />
          ))}
          {/* Elke cardiosessie een eigen tegel (13 nov 2026): eerst stond
              alleen de eerste er, met "+1" achter de naam. */}
          {heeftCardio && cardio.map((c, i) => (
            <Tegel key={c.id || i}
              foto={cardioFoto(c.soort)}
              eyebrow="Cardio" titel={c.soort}
              soortTraining={c.sublabel || null}
              sub={`${c.tijd}${c.duur ? ` · ${c.duur} min` : ''}`}
              klaar={!!c.gedaan}
              kanSchuiven={!c.gedaan && kanPlannen && !!onCardioShiftLeft}
              onLinks={() => onCardioShiftLeft?.(c)} onRechts={() => onCardioShiftRight?.(c)}
              kanLinks={dayIndex > 0} kanRechts={dayIndex < 6}
              onClick={c.gedaan && onOpenCardioGedaan ? () => onOpenCardioGedaan(c) : (kanOpenen ? () => logCardio(c) : (kanBekijken && onCardioInfo ? () => onCardioInfo(c) : undefined))}
              aaneen={aaneen} isMobile={isMobile} icoon={HeartPulse} band={band()}
              onVerwijder={kanPlannen && onRemoveCardio ? () => onRemoveCardio(c) : null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
