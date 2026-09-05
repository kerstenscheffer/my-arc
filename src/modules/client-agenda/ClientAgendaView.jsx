// Client Agenda View — fase 1 (read-only).
//
// Toont één weekraster (ma-zo) met alle blokken van de geselecteerde
// client uit ClientAgendaService. Geen edit, geen drag-drop — alleen
// lezen, zodat de coach in één blik ziet hoe de week eruit ziet.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Utensils, Dumbbell, Moon, Briefcase, Pill, AlertCircle, Plus, Trash2, Check, X, ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { ClientAgendaService, DAYS, DAY_LABELS_NL, DAY_LABELS_NL_LONG, getMondayOf, dateForDay, toIsoDate, recurringIdFor } from './ClientAgendaService'
import { meldMaaltijdTijd, luisterMaaltijdTijd, luisterPlanGewijzigd, meldPlanGewijzigd } from '../meal-plan/utils/mealSync'
import WeekBudgetPaneel from './WeekBudgetPaneel'
import { balkVak, balkVakActief, balkIconKnop, balkScheiding } from './werkbalkStijl'

const COLORS = {
  bg: '#0a0a0a',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderItem: 'rgba(255,255,255,0.09)',
  text: '#fff',
  text50: 'rgba(255,255,255,0.6)',
  text25: 'rgba(255,255,255,0.45)',
  gold: '#ffffff',  // 6 cijfers: elders wordt hier een alfa-suffix achter geplakt
  amber: '#f59e0b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  slate: '#64748b',
  green: '#22c55e',
}

// Tijdas: 6:00 → 24:00 (slaap wordt apart als block aan rand getoond)
const HOUR_START = 6
// Tot middernacht. Stond op 23, waardoor een slaapblok dat om 22:00 begint
// op 23:00 werd afgeknipt en dus korter leek dan het is.
const HOUR_END = 24
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

// Hoogte van het weekrooster. Stond als los getal in zowel DayColumn als
// TimeAxis; die moeten gelijk blijven of de uurlabels sluiten niet meer aan
// op de lijntjes. Verlaagd van 850/680 zodat de hele agenda — kop, weekbalk,
// selectiebalk en rooster — op één scherm past zonder scrollen.

// Stappen waarmee je een selectie verzet. Beide richtingen gebruiken
// dezelfde lijst, zodat "vier uur eerder" niet kan ontbreken omdat
// iemand alleen de vooruit-kant heeft bijgewerkt.
const VERZET_STAPPEN = [
  { min: 10,  label: '10 min' },
  { min: 30,  label: '30 min' },
  { min: 45,  label: '45 min' },
  { min: 60,  label: '1 uur'  },
  { min: 120, label: '2 uur'  },
  { min: 240, label: '4 uur'  },
]
// Ondergrens, geen vaste maat. Het rooster vult de ruimte die het krijgt:
// past het hele venster (6:00-23:00) er ruim in, dan wordt het hoger; is er
// weinig ruimte, dan drukt het samen tot dit minimum en scrollt de omhullende.
// Eerder was dit een harde 600px binnen een overflow:hidden — dan verdwenen
// de laatste uren gewoon, en dat is precies wat je niet wil zien in een agenda.
const GRID_MIN_HOOGTE = { desktop: 520, mobiel: 430 }
const KOP_HOOGTE = { desktop: '1.75rem', mobiel: '1.55rem' }
const kopHoogte = (isMobile) => (isMobile ? KOP_HOOGTE.mobiel : KOP_HOOGTE.desktop)
const gridMinHoogte = (isMobile) => (isMobile ? GRID_MIN_HOOGTE.mobiel : GRID_MIN_HOOGTE.desktop)
const MINUTES_VISIBLE = (HOUR_END - HOUR_START) * 60

const minToTop = (min) => {
  // Map min (sinds middernacht) op grid (0–100%).
  // Buiten venster wordt geclampt aan rand voor visuele indicatie.
  const startMin = HOUR_START * 60
  const endMin = HOUR_END * 60
  const clamped = Math.max(startMin, Math.min(endMin, min))
  return ((clamped - startMin) / MINUTES_VISIBLE) * 100
}

const formatTime = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const TYPE_ICON = {
  meal: Utensils,
  training: Dumbbell,
  sleep: Moon,
  work: Briefcase,
  supplement: Pill,
}

const LEGEND_ITEMS = [
  { type: 'meal',     color: COLORS.amber,  label: 'Maaltijd' },
  { type: 'training', color: COLORS.blue,   label: 'Training' },
  { type: 'sleep',    color: COLORS.indigo, label: 'Slaap (placeholder)' },
  { type: 'work',     color: COLORS.slate,  label: 'Werk (placeholder)' },
  { type: 'supplement', color: COLORS.green, label: 'Supplementen' },
]

// Fallback foto's identiek aan day-schedule/MealCard.jsx zodat de
// agenda dezelfde visuele taal toont als de client-meal pagina.
const MEAL_FALLBACK = {
  breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop&q=80',
  lunch:     'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
  dinner:    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
  snack1:    'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
  snack2:    'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
}
const WORKOUT_FALLBACK = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&q=80'
const SLEEP_FALLBACK   = 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=200&h=200&fit=crop&q=80'
const WORK_FALLBACK    = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop&q=80'
// Per soort baan een passend beeld. Een bureaufoto bij een winkel- of
// horecadienst zegt niets; het label staat er overheen, maar de foto hoort
// mee te vertellen wat voor dag het is.
const WERK_FOTO = {
  Kantoor:       'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop&q=80',
  Horeca:        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&q=80',
  Winkel:        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop&q=80',
  'Fysiek werk': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop&q=80',
}

const getBlockImage = (block) => {
  if (block.meta?.image_url) return block.meta.image_url
  if (block.type === 'meal') return MEAL_FALLBACK[block.meta?.slot] || MEAL_FALLBACK.lunch
  if (block.type === 'training') return WORKOUT_FALLBACK
  if (block.type === 'sleep')    return SLEEP_FALLBACK
  if (block.type === 'work')     return WERK_FOTO[block.label] || WORK_FALLBACK
  return null
}

// MealCard-stijl agenda blok. Foto links, slot-label + naam + macros
// rechts. Zelfde visuele taal als day-schedule/MealCard.jsx.
// Render-order voor overlap: langste blok eerst in DOM (komt onder te liggen),
// kortere blokken later (komen er bovenop). Beide volle breedte, beide 100%
// opaque. Tekst in elke card staat bovenaan zodat de onderliggende titel
// boven de overlay zichtbaar blijft.
// Overlappende blokken naast elkaar in plaats van op elkaar.
//
// Hiervoor werden ze simpelweg gestapeld: langste achter, kortste ervoor. Bij
// iemand die van 09:00 tot 18:00 in de winkel staat verdween daarmee de héle
// werkdag achter de maaltijden en de training — precies het blok waar je naar
// zoekt. Nu krijgt elke groep overlappende blokken evenveel breedte.
//
// Werkwijze: blokken op starttijd, dan groeperen zolang ze elkaar raken
// (transitief — A overlapt B, B overlapt C ⇒ één groep). Binnen een groep
// komt een blok in de eerste kolom die op dat moment vrij is.
function layoutBlocks(blocks) {
  if (!blocks?.length) return []
  const gesorteerd = [...blocks].sort((a, b) => (a.start - b.start) || (b.end - a.end))

  const uit = []
  let groep = []
  let groepEind = -Infinity

  const sluitGroep = () => {
    if (!groep.length) return
    // Kolommen: elk blok in de eerste kolom waarvan het laatste blok al klaar is.
    const kolomEind = []
    groep.forEach(b => {
      let k = kolomEind.findIndex(eind => eind <= b.start)
      if (k === -1) { k = kolomEind.length; kolomEind.push(b.end) }
      else kolomEind[k] = b.end
      b._kolom = k
    })
    groep.forEach(b => { b._kolommen = kolomEind.length })
    uit.push(...groep)
    groep = []
    groepEind = -Infinity
  }

  gesorteerd.forEach(b => {
    if (groep.length && b.start >= groepEind) sluitGroep()
    groep.push(b)
    groepEind = Math.max(groepEind, b.end)
  })
  sluitGroep()
  return uit
}

function AgendaBlock({ block, isMobile, onClick, onPointerDownDrag, draggable, isGhost, isDragSource, isSelected, selectieModus }) {
  const top = minToTop(block.start)
  const height = Math.max(2.2, minToTop(block.end) - top)
  const isPlaceholder = block.meta?.placeholder
  const isPlaceholderTime = block.meta?.placeholder_time
  const clickable = (block.editable || selectieModus) && onClick
  const sleepbaar = draggable && (!selectieModus || isSelected)
  const durationMin = block.end - block.start

  // Visuele dichtheid op basis van blokhoogte:
  //   ≥ 45 min  → volle MealCard-look met foto + macros
  //   30-44 min → compacte variant zonder foto
  //   < 30 min  → enkele regel (icoon + label)
  // Uitzondering: meal-blokken (incl. snacks van 15 min) krijgen altijd
  // de foto+naam layout zodat het visueel consistent is.
  const Icon = TYPE_ICON[block.type] || Calendar
  const imageUrl = getBlockImage(block)
  const sizeMode = (block.type === 'meal' && imageUrl)
    ? 'full'
    : (durationMin >= 45 ? 'full' : durationMin >= 30 ? 'compact' : 'mini')
  const showImage = sizeMode === 'full' && imageUrl

  // Slot/type label
  const topLabel = block.type === 'meal'
    ? block.label
    : block.type === 'training' ? 'Training'
    : block.type === 'sleep'    ? 'Slaap'
    : block.type === 'work'     ? (block.label || 'Werk')
    : block.type === 'supplement' ? (block.meta?.emojis || 'Supplementen')
    : 'Custom'

  // Hoofdnaam — meal-naam, workout-schema, of label voor sleep/work
  const mainTitle = block.sublabel || block.label

  return (
    <div
      title={`${topLabel}${mainTitle ? ` — ${mainTitle}` : ''}\n${formatTime(block.start)}–${formatTime(block.end)}${clickable ? '\n(tik om te bewerken · sleep voor 10-min verzet of andere dag)' : ''}`}
      // In selectiemodus mag je een blok dat je hebt aangevinkt slepen: de
      // hele selectie schuift dan mee. Blokken die nog niet aangevinkt zijn
      // blijven op aantikken reageren, anders kun je ze niet meer kiezen.
      //
      // Nooit allebei tegelijk aanhangen: bij een tik zonder beweging roept
      // de sleep-afhandeling handleBlockClick al aan, en met een onClick
      // erbovenop zou je de selectie twee keer omzetten — dus per saldo niets.
      onPointerDown={sleepbaar ? (e) => onPointerDownDrag?.(e, block) : undefined}
      onClick={(!sleepbaar && clickable) ? () => onClick(block) : undefined}
      style={{
        position: 'absolute',
        top: `${top}%`,
        height: `${height}%`,
        minHeight: block.type === 'meal' && imageUrl ? 32 : undefined,
        // Kolom binnen de overlap-groep. Eén blok = volle breedte, twee
        // blokken = ieder de helft, enzovoort.
        left: `calc(${((block._kolom || 0) / (block._kolommen || 1)) * 100}% + 3px)`,
        width: `calc(${100 / (block._kolommen || 1)}% - 6px)`,
        background: isSelected ? 'rgba(255,255,255,0.14)' : isGhost ? `${block.color}33` : 'rgba(255,255,255,0.025)',
        border: isSelected ? '1px solid #fff' : isGhost ? `1px dashed ${block.color}` : '1px solid rgba(255,255,255,0.05)',
        boxShadow: isSelected ? '0 0 0 1px #fff inset' : undefined,
        borderLeft: `3px solid ${block.color}`,
        borderRadius: 0,
        overflow: 'hidden',
        opacity: isDragSource ? 0.25 : isGhost ? 0.85 : (isPlaceholder ? 0.55 : 1),
        cursor: sleepbaar ? 'grab' : (clickable ? 'pointer' : 'default'),
        transition: isGhost ? 'none' : 'opacity 0.15s ease',
        userSelect: 'none',
        touchAction: sleepbaar ? 'none' : 'auto',
        pointerEvents: isGhost ? 'none' : 'auto',
        display: 'flex',
        zIndex: isGhost ? 5 : 1,
      }}
    >
      {/* Foto links — alleen voor 'full' size. Voor meals: donkere overlay
          met slot-label (Ontbijt/Lunch/Diner) eroverheen zodat het type
          herkenbaar blijft ook als de card kort is. */}
      {showImage && (
        <div style={{
          width: isMobile ? 56 : 68,
          flexShrink: 0,
          background: `url(${imageUrl}) center/cover`,
          // Etensfoto's zijn licht; een slaapkamer bij nacht of een kantoor
          // niet. Zonder deze correctie werden die kaarten bijna zwart.
          filter: block.type === 'meal' ? undefined : 'brightness(1.5) saturate(1.15)',
          position: 'relative',
        }}>
          {/* Naam op de foto. Zat alleen op maaltijden; werk en slaap kregen
              wel een foto maar zonder tekst — dan zie je niet waar je naar
              kijkt. Nu voor elk bloktype hetzelfde. */}
          {(
            <>
              <div style={{
                position: 'absolute', inset: 0,
                background: block.type === 'meal'
                  ? 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 100%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2px 4px',
              }}>
                <span style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: 900,
                  color: block.type === 'meal' ? block.color : '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  textAlign: 'center', lineHeight: 1.1,
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}>
                  {topLabel}{isPlaceholderTime && ' *'}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tekst-content rechts — bovenaan uitgelijnd zodat lange blokken
          (bv. werk 8u) hun titel niet in het midden krijgen, en zodat
          overlay-blokken de onderliggende titel niet verbergen. */}
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: isMobile
          ? (sizeMode === 'mini' ? '2px 6px' : '5px 8px')
          : (sizeMode === 'mini' ? '3px 8px' : '7px 10px'),
        gap: sizeMode === 'mini' ? 0 : 2,
      }}>
        {/* Top: voor meals met foto staat het slot-label op de foto.
            Voor andere blokken (of meals zonder foto) topLabel hier. */}
        {!showImage && (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              {sizeMode === 'mini' && (
                <Icon size={9} color={block.color} style={{ flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                fontWeight: 800,
                color: block.color,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                opacity: 0.9,
              }}>
                {topLabel}{isPlaceholderTime && ' *'}
              </span>
            </div>
            {sizeMode !== 'mini' && (
              <span style={{
                fontSize: isMobile ? '0.48rem' : '0.52rem', fontWeight: 700,
                color: COLORS.text25, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {formatTime(block.start)}
              </span>
            )}
          </div>
        )}

        {/* Voor meals met foto: titel + tijd op één rij bovenaan.
            Eén regel, max ~22 tekens — anders ellipsis. */}
        {showImage && (() => {
          const MAX_TITLE_CHARS = 22
          const raw = mainTitle || topLabel || ''
          const titleText = raw.length > MAX_TITLE_CHARS ? `${raw.slice(0, MAX_TITLE_CHARS - 1).trimEnd()}…` : raw
          return (
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', gap: 6,
            }}>
              <div style={{
                fontSize: isMobile ? '0.62rem' : '0.68rem',
                fontWeight: 800, color: '#fff',
                lineHeight: 1.2, letterSpacing: '-0.015em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                minWidth: 0,
              }}>
                {titleText}
              </div>
              <span style={{
                fontSize: isMobile ? '0.48rem' : '0.52rem', fontWeight: 700,
                color: COLORS.text25, whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {formatTime(block.start)}
              </span>
            </div>
          )
        })()}

        {/* Hoofdnaam — alleen voor non-meal blokken of meal zonder foto */}
        {mainTitle && sizeMode !== 'mini' && !showImage && (
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.78rem',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            display: '-webkit-box',
            WebkitLineClamp: sizeMode === 'full' ? 2 : 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {mainTitle}
          </div>
        )}
        {mainTitle && sizeMode === 'mini' && !isMobile && (
          <div style={{
            fontSize: '0.72rem', color: COLORS.text50,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}>
            {mainTitle}
          </div>
        )}

        {/* Macros worden niet in de agenda getoond — alleen foto + naam + tijd.
            Macros bekijk je in de plan-analyzer. */}

        {/* Oefenaantal voor workout — zelfde stijl als TodaysWorkoutCard
            (X oefeningen + tijd). Fallback op split-naam als de exacte
            workout niet bekend is. */}
        {block.type === 'training' && sizeMode === 'full' && (
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
            marginTop: 1,
          }}>
            {block.meta?.exercise_count != null && block.meta.exercise_count > 0 && (
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 2,
              }}>
                <span style={{
                  fontSize: isMobile ? '0.62rem' : '0.68rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                }}>
                  {block.meta.exercise_count}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.46rem' : '0.5rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                }}>
                  oefeningen
                </span>
              </div>
            )}
            {block.meta?.estimated_time && (
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 2,
              }}>
                <span style={{
                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {block.meta.estimated_time}
                </span>
              </div>
            )}
            {!block.meta?.exercise_count && block.meta?.split && (
              <span style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {block.meta.split}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DayColumn({
  day, blocks, isMobile, onBlockClick, onAddClick,
  onBlockPointerDownDrag, isDropTarget, ghostBlock, sourceBlockId, groepSleep, gridRef,
  dateForHeader, isToday, geselecteerd, selectieModus, onGridClick, plaatsModus,
}) {
  return (
    <div
      style={{
        flex: 1, minWidth: 0,
        borderRight: `1px solid ${COLORS.border}`,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        background: isDropTarget ? 'rgba(255,255,255,0.04)' : COLORS.panel,
        transition: 'background 0.12s ease',
      }}>
      {/* Header */}
      <div style={{
        height: kopHoogte(isMobile),
        padding: isMobile ? '0 0.3rem' : '0 0.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: `1px solid ${COLORS.border}`,
        background: 'rgba(0,0,0,0.3)',
        position: 'relative', boxSizing: 'border-box',
      }}>
        {/* Eén regel: WOENSDAG 2 SEPT. Stond als drie regels onder elkaar —
            dagnaam, datum, aantal items — wat de kop hoger maakte dan de
            informatie rechtvaardigt. Het aantal items zie je al doordat de
            blokken eronder staan. */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'center',
          gap: 5, flexWrap: 'nowrap', whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: isMobile ? '0.62rem' : '0.72rem',
            fontWeight: 900,
            color: '#fff',
            opacity: isToday ? 1 : 0.55,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}>
            {isMobile ? DAY_LABELS_NL[day] : DAY_LABELS_NL_LONG[day]}
          </span>
          {dateForHeader && (
            <span style={{
              fontSize: isMobile ? '0.62rem' : '0.72rem',
              fontWeight: 900,
              color: '#fff',
              opacity: isToday ? 1 : 0.75,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}>
              {dateForHeader.getDate()} {dateForHeader.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '')}
            </span>
          )}
          {/* Sterretje blijft: het meldt dat een blok voor deze dag afwijkt
              van het vaste weekpatroon, en dat zie je nergens anders. */}
          {blocks.some(b => b.meta?.isOverridden) && (
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.72rem' }}>★</span>
          )}
        </div>
        {onAddClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(day) }}
            title="Voeg blok toe"
            style={{
              position: 'absolute',
              top: 2, right: 2,
              width: 18, height: 18,
              padding: 0,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 0,
              color: COLORS.text50,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {/* Block-area */}
      <div
        ref={gridRef}
        data-day={day}
        // In plaats-modus is de héle kolom een doelwit: waar je tikt, komt
        // het item. De tijd volgt uit de verticale positie van de klik.
        onClick={plaatsModus ? (e) => {
          if (e.target !== e.currentTarget) return  // klik op een blok telt niet
          const r = e.currentTarget.getBoundingClientRect()
          onGridClick?.(day, (e.clientY - r.top) / r.height)
        } : undefined}
        style={{
          position: 'relative',
          flex: 1, minHeight: gridMinHoogte(isMobile),
          cursor: plaatsModus ? 'copy' : undefined,
          // Grid-lijntjes elke uur. HOURS heeft 18 labels (6 t/m 23) maar
          // het venster zelf is 17 uur breed (6:00 → 23:00). Pattern moet
          // ook 17-step zijn anders sluiten label en lijntjes niet aan.
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(${100 / (HOURS.length - 1)}% - 1px),
            ${COLORS.borderItem} calc(${100 / (HOURS.length - 1)}% - 1px),
            ${COLORS.borderItem} ${100 / (HOURS.length - 1)}%
          )`,
          outline: isDropTarget ? `2px dashed ${COLORS.gold}` : 'none',
          outlineOffset: -2,
        }}
      >
        {layoutBlocks(blocks).map(b => (
          <AgendaBlock
            key={b.id}
            block={b}
            isMobile={isMobile}
            onClick={onBlockClick}
            draggable={b.editable && !!onBlockPointerDownDrag && !b.meta?.wrapHalf}
            onPointerDownDrag={onBlockPointerDownDrag}
            isDragSource={sourceBlockId === b.id || (groepSleep && !!geselecteerd?.has(b.id))}
            isSelected={!!geselecteerd?.has(b.id)}
            selectieModus={selectieModus}
          />
        ))}
        {/* Bij een groepsverplaatsing staat hier de hele selectie in
            schaduw, niet alleen het blok dat je vasthoudt — anders zie je
            pas na het loslaten wat er met de andere vier gebeurde. */}
        {(ghostBlock || []).map(g => (
          <AgendaBlock
            key={g.id}
            block={g}
            isMobile={isMobile}
            isGhost
          />
        ))}
      </div>
    </div>
  )
}

function TimeAxis({ isMobile }) {
  return (
    <div style={{
      width: isMobile ? 28 : 36, flexShrink: 0,
      borderRight: `1px solid ${COLORS.border}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: isMobile ? '0.4rem 0.3rem' : '0.5rem 0.4rem',
        borderBottom: `1px solid ${COLORS.border}`,
        background: 'rgba(0,0,0,0.3)',
        height: kopHoogte(isMobile),
      }} />
      <div style={{
        position: 'relative',
        flex: 1, minHeight: gridMinHoogte(isMobile),
      }}>
        {HOURS.map((h, idx) => (
          <div key={h} style={{
            position: 'absolute',
            // Zelfde schaal als blocks (minToTop): label-N op
            // ((N - HOUR_START) / (HOUR_END - HOUR_START)) van de hoogte.
            // De oude `idx / HOURS.length` rekende met 18 stappen voor
            // een 17-uur venster — alles schoof daardoor ~30 min op.
            top: `${(idx / (HOURS.length - 1)) * 100}%`,
            left: 0, right: 0,
            fontSize: isMobile ? '0.62rem' : '0.7rem',
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'right',
            paddingRight: 4,
            paddingTop: 1,
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}>
            {String(h % 24).padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  )
}

// Vraag bij elke wijziging of het sjabloon óf alleen deze datum
// aangepast moet worden. Vier paden:
//   only-this  → override op die ene datum (client_agenda_overrides)
//   always     → sjabloon op die ene weekdag (bestaande update-pad)
//   all-days   → sjabloon op alle 7 weekdagen (bulk via applyBulkShift)
//   selected   → toont multi-day-picker; daarna bulk op die selectie
function ScopePromptModal({
  title, dateStr, dayNameLong, originDay, blockType,
  onChoose, onCancel, isMobile,
}) {
  const [picking, setPicking] = useState(false)
  const [selected, setSelected] = useState(() => new Set([originDay]))
  const toggle = (d) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(d)) n.delete(d); else n.add(d)
      return n
    })
  }
  // Sleep is "per dag" van nature, dus default-suggestie is "alle dagen".
  // Andere types blijven op weekdag-specifiek.
  const allDaysSuggested = blockType === 'sleep'

  const btnBase = {
    width: '100%', padding: '0.65rem 0.9rem',
    border: 'none', borderRadius: 0,
    fontSize: '0.78rem', fontWeight: 700,
    cursor: 'pointer',
  }
  const btnPrimary = {
    ...btnBase, fontSize: '0.82rem', fontWeight: 800,
    background: '#fff',
    color: '#000',
  }
  const btnSecondary = {
    ...btnBase,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    color: '#fff',
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        zIndex: 1100, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderRadius: 0, border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: isMobile ? '1rem' : '1.2rem' }}>
          <h3 style={{
            margin: 0, fontSize: '0.95rem', fontWeight: 800,
            color: '#fff', marginBottom: 6,
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0, fontSize: '0.72rem',
            color: COLORS.text50, lineHeight: 1.5,
          }}>
            {picking
              ? 'Kies op welke dagen je de wijziging wilt toepassen.'
              : `Wijziging toepassen op…`}
          </p>
        </div>

        {!picking && (
          <div style={{
            padding: '0.6rem 0.85rem 0.85rem',
            borderTop: `1px solid ${COLORS.border}`,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <button onClick={() => onChoose({ scope: 'only-this' })}
              style={allDaysSuggested ? btnSecondary : btnPrimary}>
              Alleen voor {dateStr}
            </button>
            <button onClick={() => onChoose({ scope: 'always' })}
              style={btnSecondary}>
              Voor elke {dayNameLong}
            </button>
            <button onClick={() => onChoose({ scope: 'all-days' })}
              style={allDaysSuggested ? btnPrimary : btnSecondary}>
              Voor alle dagen
            </button>
            <button onClick={() => setPicking(true)}
              style={btnSecondary}>
              Voor specifieke dagen…
            </button>
            <button onClick={onCancel}
              style={{
                ...btnBase, background: 'transparent',
                color: COLORS.text25, fontSize: '0.7rem',
              }}>
              Annuleer
            </button>
          </div>
        )}

        {picking && (
          <div style={{
            padding: '0.6rem 0.85rem 0.85rem',
            borderTop: `1px solid ${COLORS.border}`,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
            }}>
              {DAYS.map(d => {
                const isOn = selected.has(d)
                return (
                  <button key={d} onClick={() => toggle(d)}
                    style={{
                      padding: '0.55rem 0.4rem',
                      background: isOn ? `${COLORS.gold}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isOn ? COLORS.gold : COLORS.border}`,
                      borderRadius: 0,
                      color: isOn ? COLORS.gold : COLORS.text50,
                      fontSize: '0.7rem', fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                    {DAY_LABELS_NL[d]}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPicking(false)}
                style={{ ...btnSecondary, flex: 1 }}>
                Terug
              </button>
              <button
                disabled={selected.size === 0}
                onClick={() => onChoose({ scope: 'selected', days: Array.from(selected) })}
                style={{
                  ...btnPrimary,
                  flex: 2,
                  opacity: selected.size === 0 ? 0.45 : 1,
                  cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                }}>
                Toepassen ({selected.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal om een blok te bewerken. Drie-pad-logica:
//  • type=meal → schrijft nieuwe `timing` naar week_structure (geen delete)
//  • type=training|sleep|work|custom + bestaande dbId → update row
//  • placeholder of nieuw → insert nieuwe row in client_agenda_blocks
// `onMealSelect` / `onMealDelete` worden alleen meegegeven door de Plan
// Analyzer. Daar leven de maaltijden (client_meal_plans.week_structure) en
// staat de logica die totalen herberekent en wegschrijft — dat willen we hier
// niet dupliceren. Zonder die props verschijnen de knoppen niet, zodat de
// klant-agenda en het coach-agenda-tabblad onveranderd blijven.
function BlockEditModal({ block, client, service, isMobile, onClose, onSaved, onTimeSaveRequest, onMealSelect, onMealDelete }) {
  const isMeal = block.type === 'meal'
  const isPlaceholder = block.source === 'placeholder'
  const isNew = !!block.isNew
  const hasDbId = !!block.dbId

  // HTML `<input type="time">` accepteert max "23:59" — een opgeslagen
  // 24:00 (zoals het slaap-tot-middernacht placeholder) moeten we
  // cappen of de browser stuurt 00:00 terug.
  const clampDisplay = (min) => formatTime(Math.min(min, 23 * 60 + 59))
  // Voor blokken die over middernacht lopen splits de view ze in twee
  // halves. fullStart/fullEnd uit meta is de échte window — gebruik die
  // zodat de coach één edit doet en niet per helft hoeft te knippen.
  const initialStart = block.meta?.fullStart != null ? block.meta.fullStart : block.start
  const initialEnd   = block.meta?.fullEnd   != null ? block.meta.fullEnd   : block.end
  const [label, setLabel] = useState(block.label || '')
  const [type, setType] = useState(block.type)
  const [startStr, setStartStr] = useState(clampDisplay(initialStart))
  const [endStr, setEndStr] = useState(clampDisplay(initialEnd))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const TYPE_LABEL_NL = { training: 'Training', sleep: 'Slaap', work: 'Werk', custom: 'Custom', meal: 'Maaltijd' }
  const TYPE_OPTIONS = ['training', 'sleep', 'work', 'custom']

  const parse = (s) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s)
    if (!m) return null
    const h = parseInt(m[1], 10), mm = parseInt(m[2], 10)
    if (h < 0 || h > 24 || mm < 0 || mm > 59) return null
    return h * 60 + mm
  }

  const handleSave = async () => {
    setErr(null)
    const startMin = parse(startStr)
    const endMin = parse(endStr)
    if (startMin == null || endMin == null) { setErr('Tijd-formaat moet HH:MM zijn'); return }
    if (startMin === endMin) { setErr('Start- en eindtijd mogen niet gelijk zijn'); return }
    // Bewust géén strikte end > start check meer: een blok dat over
    // middernacht loopt (werk-nachtdienst, slaap, custom feest, …) is
    // legaal. Bij end < start gaat het systeem ervan uit dat het blok
    // doorgaat tot na 00:00.

    setSaving(true)
    try {
      // Time changed? Dan via parent → scope-prompt (alleen deze datum /
      // dit specifieke weekdag / alle dagen / specifieke dagen). Voor
      // pure label/type-wijzigingen behouden we het directe pad — die
      // raken het row-zelf en zijn dus altijd "voor altijd op deze dag".
      const timeChanged = startMin !== initialStart || endMin !== initialEnd
      const otherChanged = (label.trim() !== (block.label || '').trim()) || type !== block.type
      if (timeChanged && onTimeSaveRequest) {
        // Parent handelt scope-prompt + save af. We sluiten de modal
        // direct zodat de scope-prompt op de voorgrond komt. Label /
        // type-veranderingen schrijven we hier eerst nog snel weg als
        // ze ook wijzigden — die mogen altijd op één dag.
        if (!isMeal && otherChanged && hasDbId) {
          await service.upsertBlock({
            id: block.dbId,
            clientId: client.id,
            day: block.day,
            type,
            label: label.trim() || TYPE_LABEL_NL[type],
            sublabel: block.sublabel,
            startMin: initialStart, endMin: initialEnd,
            color: block.color,
          })
        }
        await onTimeSaveRequest({ block, newStartMin: startMin, newEndMin: endMin })
        return // parent roept onSaved zelf
      }
      // Geen tijd-wijziging → direct pad
      if (isMeal) {
        await service.updateMealTiming({
          mealPlanId: block.meta?.mealPlanId,
          day: block.day,
          slot: block.meta?.slot,
          newStartMin: startMin,
        })
      } else {
        await service.upsertBlock({
          id: hasDbId ? block.dbId : null,
          clientId: client.id,
          day: block.day,
          type,
          label: label.trim() || TYPE_LABEL_NL[type],
          sublabel: block.sublabel,
          startMin, endMin,
          color: block.color,
        })
      }
      await onSaved()
    } catch (e) {
      console.error(e)
      setErr(e.message || 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!hasDbId) return
    if (!confirm('Dit blok verwijderen?')) return
    setSaving(true)
    try {
      await service.deleteBlock(block.dbId)
      await onSaved()
    } catch (e) {
      console.error(e)
      setErr(e.message || 'Verwijderen mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={() => !saving && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
          borderRadius: 0, border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${block.color || COLORS.gold}10`,
        }}>
          <div>
            <h3 style={{
              margin: 0, fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: 800, color: block.color || COLORS.gold,
            }}>
              {isNew ? 'Nieuw blok' : `Bewerk ${TYPE_LABEL_NL[block.type] || block.type}`}
            </h3>
            <div style={{
              fontSize: '0.72rem', color: COLORS.text50, marginTop: 2,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {DAY_LABELS_NL_LONG[block.day]}
              {isMeal && ` · ${block.meta?.slot || ''}`}
              {isPlaceholder && ' · placeholder (wordt opgeslagen)'}
            </div>
          </div>
          <button onClick={() => !saving && onClose()} disabled={saving} style={{
            width: 32, height: 32, padding: 0,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 0, color: COLORS.text50,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem' }}>
          {/* Type-keuze (alleen voor niet-meal én nieuw of custom) */}
          {!isMeal && isNew && (
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: '0.72rem',
                color: COLORS.text50, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 6,
              }}>Type</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TYPE_OPTIONS.map(t => (
                  <button key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      background: type === t ? `${COLORS.gold}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${type === t ? COLORS.gold : COLORS.border}`,
                      borderRadius: 0,
                      color: type === t ? COLORS.gold : COLORS.text50,
                      fontSize: '0.75rem', fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                    {TYPE_LABEL_NL[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label */}
          {!isMeal && (
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: '0.72rem',
                color: COLORS.text50, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 6,
              }}>Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={TYPE_LABEL_NL[type]}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 0, color: '#fff',
                  fontSize: '0.85rem', fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Tijden */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block', fontSize: '0.72rem',
                color: COLORS.text50, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 6,
              }}>Start</label>
              <input
                type="time"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.55rem 0.7rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 0, color: '#fff',
                  fontSize: '0.9rem', fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>
            {!isMeal && (
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block', fontSize: '0.72rem',
                  color: COLORS.text50, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: 6,
                }}>Eind</label>
                <input
                  type="time"
                  value={endStr}
                  onChange={(e) => setEndStr(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.55rem 0.7rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 0, color: '#fff',
                    fontSize: '0.9rem', fontFamily: 'inherit',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>

          {isMeal && (
            <div style={{
              marginTop: 10, padding: '0.5rem 0.7rem',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 0,
              fontSize: '0.72rem', color: COLORS.text50,
              lineHeight: 1.5,
            }}>
              Tijd-aanpassing schrijft direct naar het meal-plan
              ({block.meta?.slot}) — zichtbaar in plan-analyzer én client-app.
            </div>
          )}

          {err && (
            <div style={{
              marginTop: 10, padding: '0.5rem 0.7rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 0,
              fontSize: '0.7rem', color: '#fca5a5',
            }}>
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '0.75rem 1.25rem',
          borderTop: `1px solid ${COLORS.border}`,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', gap: 8,
        }}>
          {/* Maaltijd: kiezen en verwijderen gaat via de Plan Analyzer.
              De gewone blok-verwijderknop kan hier niet: een maaltijd is geen
              agenda-blok met een dbId maar een slot in het weekplan. */}
          {isMeal && onMealSelect && (
            <button
              onClick={() => { onMealSelect({ day: block.day, slot: block.meta?.slot, meal: block.meta?.meal || null }); onClose() }}
              disabled={saving || !block.meta?.slot}
              style={{
                padding: '0.55rem 0.8rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 0, color: '#fff',
                fontSize: '0.75rem', fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Repeat size={13} /> Andere maaltijd
            </button>
          )}
          {isMeal && onMealDelete && (
            <button
              onClick={async () => {
                if (!block.meta?.slot) return
                if (!confirm(`"${block.label || 'Deze maaltijd'}" uit het plan verwijderen?`)) return
                setSaving(true)
                try { await onMealDelete({ day: block.day, slot: block.meta.slot }); onClose() }
                catch (e) { setErr(e.message || 'Verwijderen mislukt') }
                finally { setSaving(false) }
              }}
              disabled={saving || !block.meta?.slot}
              style={{
                padding: '0.55rem 0.8rem',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 0, color: '#ef4444',
                fontSize: '0.75rem', fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Trash2 size={13} /> Verwijder
            </button>
          )}
          {hasDbId && !isMeal && (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '0.55rem 0.8rem',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 0, color: '#ef4444',
                fontSize: '0.75rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Trash2 size={13} /> Verwijder
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            style={{
              padding: '0.55rem 0.9rem',
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 0, color: COLORS.text50,
              fontSize: '0.75rem', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Annuleer
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.55rem 1rem',
              background: saving ? 'rgba(255,255,255,0.25)' : '#fff',
              border: 'none', borderRadius: 0,
              color: saving ? COLORS.text50 : '#000',
              fontSize: '0.8rem', fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Check size={14} /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientAgendaView({
  client, db, isMobile: isMobileProp,
  viewerRole = 'coach',
  // Wat de ouder vooraan in de werkbalk wil zetten — CoachAgendaTab schuift
  // hier zijn klantkiezer in, zodat die geen eigen regel meer kost.
  werkbalkExtra = null,
  // Als ingevuld (bv. 'monday') toont de view alleen die ene dag-kolom.
  // Handig voor embedded gebruik (plan-analyzer day view) waar maar 1
  // dag relevant is. Week-navigator + datum-headers blijven werken.
  singleDay = null,
  // Externe trigger om de agenda te herladen — bv. wanneer plan-analyzer
  // een meal swapt of verwijdert. Elke verandering aan deze waarde
  // triggert een fresh fetch van week_structure + blocks.
  refreshKey = 0,
  // Callback wanneer een meal-blok wordt verschoven (timing edit). De
  // parent (plan-analyzer) gebruikt dit om z'n lokale week_structure
  // te herladen zodat de meal-card meteen de nieuwe tijd toont.
  onMealUpdate,
  // Synchronous optimistic-update callback. Vuurt direct bij drag-commit
  // (vóór de DB-save) zodat plan-analyzer's MealCard meteen kan updaten
  // i.p.v. wachten op de async reload.
  onMealTimingChange,
  // Alleen gevuld vanuit de Plan Analyzer — zie BlockEditModal.
  onMealSelect,
  onMealDelete,
  // Forceer een specifiek meal-plan (i.p.v. de actieve). Plan-analyzer
  // werkt vaak met een concept-plan dat NIET is_active=true is. Zonder
  // deze prop laadde de agenda het verkeerde plan en gingen edits in
  // de agenda naar 't actieve plan i.p.v. de concept dat coach bewerkt.
  mealPlanId: forcedMealPlanId = null,
}) {
  const isMobile = typeof isMobileProp === 'boolean' ? isMobileProp : (typeof window !== 'undefined' && window.innerWidth <= 768)
  const isClient = viewerRole === 'client'
  // Op een telefoon één dag tegelijk.
  //
  // Zeven kolommen in ~360px gaf ongeveer 50px per dag: labels afgekapt tot
  // "SLAA" en "ONTBI", datumkoppen die over elkaar heen liepen, blokken die
  // je niet kon raken. Met één dag over de volle breedte is elk blok leesbaar
  // en aantikbaar. De week blijft bereikbaar via de dagkiezer erboven.
  //
  // Een expliciete singleDay (de Plan Analyzer geeft die mee) wint altijd.
  const [mobieleDag, setMobieleDag] = useState(() => DAYS[(new Date().getDay() + 6) % 7])
  const visibleDays = singleDay && DAYS.includes(singleDay)
    ? [singleDay]
    : (isMobile ? [mobieleDag] : DAYS)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [editingBlock, setEditingBlock] = useState(null)
  const [drag, setDrag] = useState(null)  // { block, pointerId, startX, startY, originStart, originDay, newStart, targetDay, moved, cursorX, cursorY }
  const [moveError, setMoveError] = useState(null)
  // Refs per dag-column zodat we tijdens drag de px-naar-min schaal én
  // de target-dag (welke kolom is de pointer over) kunnen bepalen.
  const gridRefs = useRef({})
  // Week-anker (maandag) — door pijltjes verschuif je weken.
  const [weekAnchor, setWeekAnchor] = useState(() => getMondayOf(new Date()))
  // Prompt voor recurring scope ("alleen deze datum" vs "voor altijd").
  const [scopePrompt, setScopePrompt] = useState(null)
  // Meerdere blokken tegelijk verzetten of verwijderen. Bewust een aparte
  // modus: buiten die modus opent een tik het bewerkvenster en werkt slepen,
  // en dat botst met aantikken om te selecteren.
  const [selectieModus, setSelectieModus] = useState(false)
  const [geselecteerd, setGeselecteerd] = useState(() => new Set())
  const [bulkBezig, setBulkBezig] = useState(false)
  // Iets inplannen: eerst een soort aanklikken, dan een plek in de agenda.
  // Zelfde patroon als de takenagenda — geen sleepwerk nodig, en het werkt
  // net zo goed op een telefoon.
  const [teplaatsen, setTeplaatsen] = useState(null)

  const service = useMemo(() => db?.supabase ? new ClientAgendaService(db.supabase) : null, [db])

  // Elke agenda krijgt zijn eigen naam. Eerder heette elke instantie 'agenda',
  // en omdat een luisteraar zijn eigen bron overslaat negeerden twee agenda's
  // naast elkaar juist elkáár — precies het geval in split screen, waar de
  // Plan Analyzer ook een agenda toont.
  const instantieRef = useRef(null)
  if (!instantieRef.current) instantieRef.current = `agenda-${Math.random().toString(36).slice(2, 9)}`

  // De andere helft van het scherm laten weten dat het plan is veranderd.
  // Alleen na een geslaagde schrijfactie: het bericht betekent "haal opnieuw
  // op", en dan moet er ook iets nieuws te halen zijn.
  const meldWijziging = (reden) => meldPlanGewijzigd({
    clientId: client?.id,
    mealPlanId: forcedMealPlanId || data?.mealPlan?.id || null,
    reden,
    bron: instantieRef.current,
  })

  const reload = async () => {
    if (!service || !client?.id) return
    try {
      const res = await service.loadWeek(client.id, weekAnchor, forcedMealPlanId)
      setData(res)
    } catch (e) { console.error(e); setError(e) }
  }

  // Verandert de opbouw van het plan elders — een maaltijd erbij, eruit of
  // vervangen — dan halen we opnieuw op. Anders dan bij een tijdwijziging:
  // daar weet je precies welk blok waarheen gaat, hier niet. Raden wat er
  // veranderd is levert een agenda op die net iets anders zegt dan het plan.
  //
  // Alleen als het over dezelfde klant gaat. In split screen kun je links een
  // andere klant open hebben dan rechts, en dan is een herlaad hier verspilde
  // moeite.
  useEffect(() => luisterPlanGewijzigd(({ clientId, mealPlanId }) => {
    if (clientId && client?.id && clientId !== client.id) return
    if (mealPlanId && forcedMealPlanId && mealPlanId !== forcedMealPlanId) return
    reload()
  }, instantieRef.current), [client?.id, forcedMealPlanId, service, weekAnchor])

  // Verschuift een ander scherm een maaltijd, dan schuiven we het blok hier
  // meteen mee. Bewust geen herlaad: het bericht vertrekt zodra de gebruiker
  // loslaat, en de database-opslag loopt daar async achteraan. Een herlaad op
  // dat moment haalt de óude tijd op. Lokaal verschuiven is bovendien direct.
  useEffect(() => luisterMaaltijdTijd(({ day, slot, newTiming }) => {
    if (!day || !slot || !newTiming) return
    const mm = /^(\d{1,2}):(\d{2})/.exec(newTiming)
    if (!mm) return
    const nieuwStart = parseInt(mm[1], 10) * 60 + parseInt(mm[2], 10)
    setData(prev => {
      if (!prev?.blocksByDay?.[day]) return prev
      let geraakt = false
      const blokken = prev.blocksByDay[day].map(b => {
        if (b.type !== 'meal' || b.meta?.slot !== slot) return b
        geraakt = true
        return { ...b, start: nieuwStart, end: nieuwStart + (b.end - b.start), meta: { ...b.meta, isOverridden: false } }
      })
      if (!geraakt) return prev
      return { ...prev, blocksByDay: { ...prev.blocksByDay, [day]: blokken } }
    })
  }, instantieRef.current), [])

  useEffect(() => {
    if (!service || !client?.id) return
    let cancelled = false
    setLoading(true); setError(null)
    service.loadWeek(client.id, weekAnchor, forcedMealPlanId)
      .then(res => { if (!cancelled) { setData(res); setLoading(false) } })
      .catch(e => { if (!cancelled) { console.error(e); setError(e); setLoading(false) } })
    return () => { cancelled = true }
  }, [service, client?.id, weekAnchor, refreshKey, forcedMealPlanId])

  // Datums voor de week (ma..zo) — voor headers + override-prompts
  const weekDates = useMemo(() => {
    const map = {}
    DAYS.forEach(d => { map[d] = dateForDay(weekAnchor, d) })
    return map
  }, [weekAnchor])
  const isThisWeek = useMemo(() => {
    return toIsoDate(weekAnchor) === toIsoDate(getMondayOf(new Date()))
  }, [weekAnchor])
  const shiftWeek = (n) => setWeekAnchor(prev => {
    const d = new Date(prev); d.setDate(d.getDate() + 7 * n); return d
  })

  // Client mag meal-blokken niet aanraken (eigendomsgebied van coach).
  // Andere blokken (training/sleep/work/custom) mag client editen.
  const handleBlockClick = (block) => {
    if (selectieModus) {
      setGeselecteerd(prev => {
        const next = new Set(prev)
        next.has(block.id) ? next.delete(block.id) : next.add(block.id)
        return next
      })
      return
    }
    if (isClient && block.type === 'meal') return
    setEditingBlock(block)
  }

  // Alle blokken van de zichtbare dagen, om van een id terug naar het blok te
  // komen bij de bulk-acties.
  const blokPerId = useMemo(() => {
    const m = new Map()
    Object.values(data?.blocksByDay || {}).forEach(lijst => (lijst || []).forEach(b => m.set(b.id, b)))
    return m
  }, [data])

  const stopSelectie = () => { setSelectieModus(false); setGeselecteerd(new Set()) }

  // Vaste keuzes voor wat je snel wil inplannen. Duur in minuten, want die
  // verschilt sterk: boodschappen doe je in een uur, meal prep kost er twee.
  const SNELKEUZES = [
    { id: 'boodschappen', label: 'Boodschappen', duur: 60,  kleur: '#22c55e' },
    { id: 'mealprep',     label: 'Meal prep',    duur: 120, kleur: '#f59e0b' },
    { id: 'cardio',       label: 'Cardio',       duur: 45,  kleur: '#06b6d4' },
    { id: 'wandelen',     label: 'Wandelen',     duur: 45,  kleur: '#84cc16' },
    { id: 'werk',         label: 'Werk',         duur: 480, kleur: '#64748b' },
    { id: 'afspraak',     label: 'Afspraak',     duur: 60,  kleur: '#a855f7' },
  ]

  // Klik in het rooster → tijd. `fractie` is de verticale positie (0 = bovenaan
  // = HOUR_START). Afronden op kwartieren: preciezer aanklikken lukt toch niet
  // en dit leest netter terug.
  const plaatsOpGrid = async (day, fractie) => {
    if (!teplaatsen || bulkBezig) return
    const minuut = HOUR_START * 60 + Math.max(0, Math.min(1, fractie)) * MINUTES_VISIBLE
    const start = Math.round(minuut / 15) * 15
    const eind = Math.min(24 * 60, start + teplaatsen.duur)
    setBulkBezig(true)
    try {
      await service.upsertBlock({
        id: null,
        clientId: client.id,
        day,
        type: 'custom',
        label: teplaatsen.label,
        sublabel: null,
        startMin: start,
        endMin: eind,
        color: teplaatsen.kleur,
      })
      await reload()
      // Bewust niet uitzetten: meestal plan je er meteen nog een paar in.
      // Klaar ben je met Escape of de knop 'Stop'.
    } catch (e) {
      console.error('inplannen mislukt:', e)
      setMoveError(e.message || 'Inplannen mislukt')
      setTimeout(() => setMoveError(null), 3500)
    } finally { setBulkBezig(false) }
  }

  // Escape stopt het plaatsen — anders blijf je per ongeluk blokken zetten.
  useEffect(() => {
    if (!teplaatsen) return
    const onKey = (e) => { if (e.key === 'Escape') setTeplaatsen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [teplaatsen])

  // De hele selectie verzetten: zoveel minuten, en eventueel zoveel dagen
  // opzij. Eén functie voor twee ingangen — de dropdown in de balk (dagen
  // blijven gelijk) en het slepen van een geselecteerd blok (dagen kunnen
  // meeschuiven). Zo kan het gedrag van die twee niet uit elkaar lopen.
  //
  // Placeholders en niet-bewerkbare blokken slaan we over: die bestaan nog
  // niet in de database, er valt niets aan te verzetten.
  const verschuifSelectie = async ({ deltaMin = 0, dagDelta = 0 }) => {
    if (bulkBezig || !geselecteerd.size) return
    if (!deltaMin && !dagDelta) return
    setBulkBezig(true)
    const overgeslagen = []
    try {
      for (const id of geselecteerd) {
        const b = blokPerId.get(id)
        if (!b || !b.editable) { overgeslagen.push(b?.label || id); continue }

        // Buiten de week valt niets te verplaatsen — dan sla ik het blok
        // liever over dan het stilletjes op maandag te laten landen.
        const dagIdx = DAYS.indexOf(b.day)
        const nieuweDagIdx = dagIdx + dagDelta
        if (dagIdx < 0 || nieuweDagIdx < 0 || nieuweDagIdx >= DAYS.length) {
          overgeslagen.push(b.label || id); continue
        }

        const nieuw = Math.max(0, Math.min(24 * 60 - 10, (b.start || 0) + deltaMin))
        await service.shiftBlock({
          block: { ...b, clientId: client.id },
          newStartMin: nieuw,
          toDay: dagDelta === 0 ? null : DAYS[nieuweDagIdx],
          mealPlanId: data?.mealPlan?.id,
        })
      }
      await reload()
      meldWijziging('selectie verzet')
      if (overgeslagen.length) {
        setMoveError(`${overgeslagen.length} blok(ken) overgeslagen — niet verplaatsbaar`)
        setTimeout(() => setMoveError(null), 3500)
      }
      stopSelectie()
    } catch (e) {
      console.error('selectie verschuiven mislukt:', e)
      setMoveError(e.message || 'Verplaatsen mislukt')
      setTimeout(() => setMoveError(null), 3500)
    } finally { setBulkBezig(false) }
  }

  const bulkVerschuif = (delta) => verschuifSelectie({ deltaMin: delta })

  // Verwijderen. Maaltijden zijn geen agenda-blok maar een slot in het
  // weekplan — die gaan via de Plan Analyzer (onMealDelete). Zonder die
  // callback slaan we ze over in plaats van iets verkeerds te wissen.
  const bulkVerwijder = async () => {
    if (bulkBezig || !geselecteerd.size) return
    const blokken = [...geselecteerd].map(id => blokPerId.get(id)).filter(Boolean)
    if (!confirm(`${blokken.length} item(s) verwijderen?`)) return
    setBulkBezig(true)
    const overgeslagen = []
    try {
      for (const b of blokken) {
        if (b.type === 'meal') {
          if (onMealDelete && b.meta?.slot) await onMealDelete({ day: b.day, slot: b.meta.slot })
          else overgeslagen.push(b.label)
          continue
        }
        if (!b.dbId) { overgeslagen.push(b.label); continue }
        await service.deleteBlock(b.dbId)
      }
      await reload()
      meldWijziging('items verwijderd')
      if (overgeslagen.length) {
        setMoveError(`${overgeslagen.length} overgeslagen — hier niet te verwijderen`)
        setTimeout(() => setMoveError(null), 4000)
      }
      stopSelectie()
    } catch (e) {
      console.error('bulk verwijderen mislukt:', e)
      setMoveError(e.message || 'Verwijderen mislukt')
      setTimeout(() => setMoveError(null), 3500)
    } finally { setBulkBezig(false) }
  }
  const handleAddClick = (day) => setEditingBlock({
    isNew: true, day, type: 'custom',
    label: '', sublabel: null,
    start: 12 * 60, end: 13 * 60,
    editable: true, meta: {},
  })

  // ── Pointer-drag handlers ──
  // Productivity-style: pointerdown op blok, window-pointermove voor live
  // delta-berekening, pointerup om weg te schrijven of klik te triggeren.
  const SNAP_MINUTES = 10
  const DRAG_THRESHOLD_PX = 5

  const handleBlockPointerDown = (e, block) => {
    if (isClient && block.type === 'meal') return
    if (!block.editable || block.meta?.wrapHalf) return
    if (e.button === 2) return
    e.preventDefault()
    setMoveError(null)
    setDrag({
      block,
      pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      cursorX: e.clientX, cursorY: e.clientY,
      originStart: block.start,
      originDay: block.day,
      newStart: block.start,
      targetDay: block.day,
      moved: false,
      // Sleep je een aangevinkt blok in selectiemodus, dan verplaatst de
      // hele selectie mee. Nu vastleggen en niet bij het loslaten opnieuw
      // bepalen: de selectie kan tussentijds veranderen.
      groep: selectieModus && geselecteerd.has(block.id),
    })
  }

  useEffect(() => {
    if (!drag) return

    const dayDuration = (drag.block.meta?.fullEnd ?? drag.block.end) - (drag.block.meta?.fullStart ?? drag.block.start)
    // Block-positionering gebruikt MINUTES_VISIBLE = (HOUR_END-HOUR_START)*60
    // = 1020 (17 uur). Drag moet exact dezelfde schaal gebruiken anders
    // klopt de mapping pixel→minuut niet.
    const MINUTES_VISIBLE_LOCAL = MINUTES_VISIBLE

    const onMove = (e) => {
      if (e.pointerId !== drag.pointerId) return
      const dy = e.clientY - drag.startY
      const dx = e.clientX - drag.startX
      const distance = Math.hypot(dx, dy)
      const moved = drag.moved || distance > DRAG_THRESHOLD_PX

      // Px → minuten via de hoogte van de source-column
      let pxPerMin = 1
      const sourceEl = gridRefs.current[drag.originDay]
      if (sourceEl) {
        const rect = sourceEl.getBoundingClientRect()
        pxPerMin = rect.height / MINUTES_VISIBLE_LOCAL
      }
      const rawDelta = pxPerMin > 0 ? dy / pxPerMin : 0
      const snapped = Math.round(rawDelta / SNAP_MINUTES) * SNAP_MINUTES
      let newStart = drag.originStart + snapped
      // Clamp binnen 0..24*60-duration
      newStart = Math.max(0, Math.min(24 * 60 - dayDuration, newStart))

      // Target-dag op basis van pointer-X
      let targetDay = drag.originDay
      for (const [d, el] of Object.entries(gridRefs.current)) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right) { targetDay = d; break }
      }

      setDrag(prev => prev ? {
        ...prev,
        newStart, targetDay, moved,
        cursorX: e.clientX, cursorY: e.clientY,
      } : prev)
    }

    const onUp = async (e) => {
      if (e.pointerId !== drag.pointerId) return
      const d = drag
      setDrag(null)
      if (!d.moved) {
        handleBlockClick(d.block)
        return
      }
      const sameSpot = d.newStart === d.originStart && d.targetDay === d.originDay
      if (sameSpot) return
      if (isClient && d.block.type === 'meal') return

      // Groepsverplaatsing: iedereen schuift hetzelfde aantal minuten en
      // dagen op als het blok dat je vasthield. Geen scope-vraag hier — bij
      // een selectie heb je al aangewezen wat er mee moet, en die vraag per
      // blok stellen zou vijf keer achter elkaar poppen.
      if (d.groep) {
        await verschuifSelectie({
          deltaMin: d.newStart - d.originStart,
          dagDelta: DAYS.indexOf(d.targetDay) - DAYS.indexOf(d.originDay),
        })
        return
      }

      // Recurring scope-prompt — vraag eerst of het 1× of altijd is.
      // Cross-day drag = altijd (anders zou je per datum nieuwe overrides
      // krijgen die de basis-week niet aanpassen). Same-day tijdverschuiving
      // krijgt de keuze.
      const targetDate = weekDates[d.targetDay]
      const targetIso = targetDate ? toIsoDate(targetDate) : null
      const dayNameLong = DAY_LABELS_NL_LONG[d.targetDay] || d.targetDay
      const dateStr = targetDate
        ? targetDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
        : ''
      const isSameDay = d.targetDay === d.originDay

      if (isSameDay && targetIso) {
        const duration = (d.block.meta?.fullEnd ?? d.block.end) - (d.block.meta?.fullStart ?? d.block.start)

        // Meal-blokken: skip scope-prompt en sla direct het sjabloon op.
        // Optimistische update — verschuif het blok lokaal eerst zodat
        // de UI direct reageert. DB-save loopt async; bij fout draaien
        // we de lokale state terug.
        if (d.block.type === 'meal') {
          const duration = d.block.end - d.block.start
          const newEnd = d.newStart + duration
          const prevData = data
          const newTimingStr = `${String(Math.floor(d.newStart / 60)).padStart(2, '0')}:${String(d.newStart % 60).padStart(2, '0')}`

          // 1. Agenda lokaal verschuiven
          setData(prev => {
            if (!prev) return prev
            const day = d.block.day
            return {
              ...prev,
              blocksByDay: {
                ...prev.blocksByDay,
                [day]: (prev.blocksByDay[day] || []).map(b => (
                  b.id === d.block.id
                    ? { ...b, start: d.newStart, end: newEnd, meta: { ...b.meta, isOverridden: false } }
                    : b
                )),
              },
            }
          })

          // 2. Plan-analyzer (parent) DIRECT laten weten — MealCard updatet
          //    zonder te wachten op DB-roundtrip.
          onMealTimingChange?.({
            day: d.block.day,
            slot: d.block.meta?.slot,
            newTiming: newTimingStr,
          })

          // En naar de andere helft van het scherm. onMealTimingChange bereikt
          // alleen een ouder die de agenda zelf rendert; in split screen staat
          // de Plan Analyzer in een eigen boom en hoort die er niets van.
          meldMaaltijdTijd({
            mealPlanId: d.block.meta?.mealPlanId || forcedMealPlanId || null,
            day: d.block.day,
            slot: d.block.meta?.slot,
            newTiming: newTimingStr,
            bron: instantieRef.current,
          })

          ;(async () => {
            try {
              if (targetIso) {
                await service.deleteOverride({
                  clientId: client.id,
                  dateIso: targetIso,
                  recurringId: recurringIdFor(d.block),
                })
              }
              await service.shiftBlock({
                block: { ...d.block, clientId: client.id },
                newStartMin: d.newStart,
                toDay: null,
                mealPlanId: data?.mealPlan?.id,
              })
              onMealUpdate?.()
            } catch (err) {
              console.error('shiftBlock meal failed:', err)
              setData(prevData)  // revert
              setMoveError(err.message || 'Verplaatsen mislukt')
              setTimeout(() => setMoveError(null), 3500)
            }
          })()
          return
        }

        setScopePrompt({
          title: 'Aanpassing toepassen op…',
          dateStr, dayNameLong,
          originDay: d.block.day,
          blockType: d.block.type,
          onChoose: async (result) => {
            setScopePrompt(null)
            try {
              const { scope, days } = result || {}
              if (scope === 'only-this') {
                await service.upsertOverride({
                  clientId: client.id,
                  dateIso: targetIso,
                  recurringId: recurringIdFor(d.block),
                  startMin: d.newStart,
                  endMin: d.newStart + duration,
                })
              } else if (scope === 'always') {
                await service.shiftBlock({
                  block: { ...d.block, clientId: client.id },
                  newStartMin: d.newStart,
                  toDay: null,
                  mealPlanId: data?.mealPlan?.id,
                })
              } else if (scope === 'all-days') {
                await service.applyBulkShift({
                  block: { ...d.block, clientId: client.id },
                  newStartMin: d.newStart,
                  days: DAYS,
                  mealPlanId: data?.mealPlan?.id,
                  clientId: client.id,
                })
              } else if (scope === 'selected' && Array.isArray(days) && days.length > 0) {
                await service.applyBulkShift({
                  block: { ...d.block, clientId: client.id },
                  newStartMin: d.newStart,
                  days,
                  mealPlanId: data?.mealPlan?.id,
                  clientId: client.id,
                })
              }
              await reload()
              if (d.block.type === 'meal') onMealUpdate?.()
            } catch (err) {
              console.error(err); setMoveError(err.message || 'Verplaatsen mislukt')
              setTimeout(() => setMoveError(null), 3500)
            }
          },
          onCancel: () => setScopePrompt(null),
        })
        return
      }

      // Cross-day → altijd het sjabloon zelf aanpassen
      try {
        await service.shiftBlock({
          block: { ...d.block, clientId: client.id },
          newStartMin: d.newStart,
          toDay: d.targetDay,
          mealPlanId: data?.mealPlan?.id,
        })
        await reload()
        if (d.block.type === 'meal') onMealUpdate?.()
      } catch (err) {
        console.error('shiftBlock', err)
        setMoveError(err.message || 'Verplaatsen mislukt')
        setTimeout(() => setMoveError(null), 3500)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, isClient, service, client?.id, data?.mealPlan?.id])

  // Modal-tijd-edit → zelfde scope-prompt als drag, gebruikt het
  // weekDates-anker voor de juiste kalenderdatum.
  const handleTimeSaveFromModal = async ({ block, newStartMin, newEndMin }) => {
    const targetDate = weekDates[block.day]
    const targetIso = targetDate ? toIsoDate(targetDate) : null
    const dateStr = targetDate
      ? targetDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
      : ''
    const dayNameLong = DAY_LABELS_NL_LONG[block.day] || block.day

    // Sluit modal zodat scope-prompt op de voorgrond komt
    setEditingBlock(null)

    return new Promise(resolve => {
      setScopePrompt({
        title: 'Tijd-wijziging toepassen op…',
        dateStr, dayNameLong,
        originDay: block.day,
        blockType: block.type,
        onChoose: async (result) => {
          setScopePrompt(null)
          try {
            const { scope, days } = result || {}
            if (scope === 'only-this' && targetIso) {
              await service.upsertOverride({
                clientId: client.id,
                dateIso: targetIso,
                recurringId: recurringIdFor(block),
                startMin: newStartMin,
                endMin: newEndMin,
              })
            } else if (scope === 'always') {
              await service.shiftBlock({
                block: { ...block, clientId: client.id },
                newStartMin,
                newEndMin, // expliciet meegegeven — gebruiker bepaalde end-tijd
                toDay: null,
                mealPlanId: data?.mealPlan?.id,
              })
            } else if (scope === 'all-days') {
              await service.applyBulkShift({
                block: { ...block, clientId: client.id },
                newStartMin,
                newEndMin,
                days: DAYS,
                mealPlanId: data?.mealPlan?.id,
                clientId: client.id,
              })
            } else if (scope === 'selected' && Array.isArray(days) && days.length > 0) {
              await service.applyBulkShift({
                block: { ...block, clientId: client.id },
                newStartMin,
                newEndMin,
                days,
                mealPlanId: data?.mealPlan?.id,
                clientId: client.id,
              })
            }
            await reload()
            if (block.type === 'meal') onMealUpdate?.()
          } catch (err) {
            console.error(err)
            setMoveError(err.message || 'Opslaan mislukt')
            setTimeout(() => setMoveError(null), 3500)
          }
          resolve()
        },
        onCancel: () => { setScopePrompt(null); resolve() },
      })
    })
  }

  // Het ghost-blok zoals het tijdens drag in de target-kolom zou landen.
  const ghostByDay = useMemo(() => {
    if (!drag || !drag.moved) return {}
    const duurVan = (b) => (b.meta?.fullEnd ?? b.end) - (b.meta?.fullStart ?? b.start)

    const zet = (uit, blok) => {
      if (!uit[blok.day]) uit[blok.day] = []
      uit[blok.day].push(blok)
      return uit
    }

    if (!drag.groep) {
      return zet({}, {
        ...drag.block,
        day: drag.targetDay,
        id: `ghost-${drag.block.id}`,
        start: drag.newStart,
        end: drag.newStart + duurVan(drag.block),
      })
    }

    // Groep: dezelfde verschuiving op elk aangevinkt blok, zodat het
    // voorbeeld precies laat zien wat het loslaten gaat doen.
    const deltaMin = drag.newStart - drag.originStart
    const dagDelta = DAYS.indexOf(drag.targetDay) - DAYS.indexOf(drag.originDay)
    const uit = {}
    for (const id of geselecteerd) {
      const b = blokPerId.get(id)
      if (!b || !b.editable) continue
      const dagIdx = DAYS.indexOf(b.day)
      const nieuweDagIdx = dagIdx + dagDelta
      if (dagIdx < 0 || nieuweDagIdx < 0 || nieuweDagIdx >= DAYS.length) continue
      const start = Math.max(0, Math.min(24 * 60 - 10, (b.start || 0) + deltaMin))
      zet(uit, {
        ...b,
        day: DAYS[nieuweDagIdx],
        id: `ghost-${b.id}`,
        start,
        end: start + duurVan(b),
      })
    }
    return uit
  }, [drag, geselecteerd, blokPerId])

  // Voor een client-viewer: maak meal-blokken read-only (cursor + click).
  // Belangrijk: dit useMemo moet ÓNCONDITIONEEL vóór elke early-return,
  // anders verandert de hook-volgorde tussen renders en gooit React een
  // "Rendered more hooks than during the previous render"-fout.
  const blocksByDay = useMemo(() => {
    const raw = data?.blocksByDay
    if (!raw) return null
    if (!isClient) return raw
    const out = {}
    Object.entries(raw).forEach(([day, blocks]) => {
      out[day] = blocks.map(b => b.type === 'meal' ? { ...b, editable: false } : b)
    })
    return out
  }, [data, isClient])

  if (!client?.id) {
    return (
      <div style={{ padding: '2rem', color: COLORS.text50, textAlign: 'center' }}>
        Selecteer een client.
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: COLORS.text50, textAlign: 'center' }}>
        Agenda laden…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#ef4444' }}>
        Fout bij laden agenda: {error.message}
      </div>
    )
  }

  const { hasMealPlan, hasSchema, mealPlan, schema, schemaZonderWeekindeling, schemaDagen } = data

  return (
    <div style={{
      padding: isMobile ? '0.3rem 0.4rem' : '0.4rem 0.5rem',
      display: 'flex', flexDirection: 'column',
      gap: isMobile ? '0.3rem' : '0.4rem',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Eén werkbalk. Week-navigatie, waarschuwingen, snelkeuzes,
          selecteren en het weekbudget stonden als vijf blokken onder elkaar
          en aten samen bijna een derde van het scherm op. Ze zijn nu flex-
          items in dezelfde rij; op een smal scherm mag hij afbreken. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, rowGap: 6, flexWrap: 'wrap',
        flexShrink: 0, paddingBottom: 2,
      }}>
      {werkbalkExtra}
      {werkbalkExtra && <div style={balkScheiding(isMobile)} />}

      {/* Week-navigatie als één segment: pijl, label, pijl tegen elkaar aan.
          Losse knopjes met een zwevend label ertussen lazen als drie dingen. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <button onClick={() => shiftWeek(-1)} title="Vorige week"
          style={balkIconKnop(isMobile)}>
          <ChevronLeft size={13} />
        </button>
        <div style={balkVak(isMobile, {
          borderLeftWidth: 0, borderRightWidth: 0,
          color: isThisWeek ? COLORS.gold : '#fff',
          minWidth: isMobile ? 78 : 96, justifyContent: 'center',
        })}>
          {isThisWeek ? 'Deze week' : weekAnchor.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
        </div>
        <button onClick={() => shiftWeek(1)} title="Volgende week"
          style={balkIconKnop(isMobile)}>
          <ChevronRight size={13} />
        </button>
        {!isThisWeek && (
          <button onClick={() => setWeekAnchor(getMondayOf(new Date()))} title="Naar deze week"
            style={balkVak(isMobile, {
              marginLeft: 4, cursor: 'pointer', color: COLORS.gold,
              borderTopColor: `${COLORS.gold}55`, borderBottomColor: `${COLORS.gold}55`,
              borderLeftColor: `${COLORS.gold}55`, borderRightColor: `${COLORS.gold}55`,
            })}>
            Vandaag
          </button>
        )}
      </div>

      {/* Ontbrekende gegevens. Stond als blok van drie regels boven de
          agenda; dat kostte meer hoogte dan het rooster eronder waard was.
          Nu één icoon met de melding in de tooltip — je ziet dat er iets is,
          en de tekst is er nog als je hem nodig hebt. */}
      {(!hasMealPlan || !hasSchema || schemaZonderWeekindeling) && (
        <span
          title={[
            !hasMealPlan && 'Geen actief meal-plan voor deze client — maaltijden ontbreken in de agenda.',
            !hasSchema && 'Geen workout-schema toegewezen — training-dagen worden niet bepaald.',
            schemaZonderWeekindeling && `Het schema is toegewezen${schemaDagen ? ` (${schemaDagen} dagen)` : ''}, maar er staat niet vast op welke weekdagen het valt. De agenda toont daarom de trainingsdagen uit het voedingsplan, en die kunnen verouderd zijn.`,
            'Placeholders (transparant) kun je gewoon aanklikken — ze worden bij opslaan een echt blok.',
          ].filter(Boolean).join('\n')}
          style={balkVak(isMobile, {
            background: 'rgba(245,158,11,0.1)',
            borderTopColor: 'rgba(245,158,11,0.3)', borderBottomColor: 'rgba(245,158,11,0.3)',
            borderLeftColor: 'rgba(245,158,11,0.3)', borderRightColor: 'rgba(245,158,11,0.3)',
            color: COLORS.amber, cursor: 'help', flexShrink: 0,
          })}
        >
          <AlertCircle size={12} />
          {[!hasMealPlan, !hasSchema, schemaZonderWeekindeling].filter(Boolean).length}
        </span>
      )}

      {/* ── Snel inplannen ────────────────────────────────────────────
          Kies een soort, tik dan een plek in de agenda. Bewust geen slepen:
          dat werkt slecht op een telefoon en botst met het verzetten van
          bestaande blokken. */}
      {!isClient && !selectieModus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={balkScheiding(isMobile)} />
          {/* Zes chips naast elkaar waren de breedste post in de balk. Eén
              lijst doet hetzelfde. Het kleurblokje zit binnen hetzelfde vak
              als de lijst; los ernaast zag het eruit als een foutje. */}
          <div style={(teplaatsen ? balkVakActief : balkVak)(isMobile, { padding: '0 0 0 0.5rem' })}>
            <span style={{
              width: 8, height: 8, flexShrink: 0,
              background: teplaatsen?.kleur || 'rgba(255,255,255,0.2)',
            }} />
            <select
              value={teplaatsen?.id || ''}
              onChange={(e) => setTeplaatsen(SNELKEUZES.find(x => x.id === e.target.value) || null)}
              aria-label="Blok inplannen"
              style={{
                height: '100%', background: 'transparent', border: 'none',
                color: 'inherit', font: 'inherit', cursor: 'pointer',
                outline: 'none', padding: '0 0.5rem 0 0.35rem',
              }}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#ccc' }}>Inplannen…</option>
              {SNELKEUZES.map(k => (
                <option key={k.id} value={k.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {k.label} · {k.duur} min
                </option>
              ))}
            </select>
          </div>

          {teplaatsen && (
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
              {bulkBezig ? 'Bezig…' : 'tik een plek'}
            </span>
          )}
        </div>
      )}

      {/* ── Meerdere tegelijk ─────────────────────────────────────────── */}
      {!isClient && !selectieModus && <div style={balkScheiding(isMobile)} />}
      {!isClient && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {!selectieModus ? (
            <button
              onClick={() => setSelectieModus(true)}
              style={balkVak(isMobile, {
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              })}
            >
              <Check size={12} /> Selecteren
            </button>
          ) : (
            <>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff' }}>
                {geselecteerd.size} geselecteerd
              </span>

              {/* Vier vaste knoppen (-60/-30/+30/+60) dekten te weinig. Nu
                  één lijst met beide richtingen: kiezen voert direct uit en
                  de lijst springt terug naar de kop, zodat je 'm meteen
                  opnieuw kunt gebruiken. */}
              <select
                value=""
                aria-label="Selectie verzetten"
                disabled={!geselecteerd.size || bulkBezig}
                onChange={(e) => {
                  const minuten = parseInt(e.target.value, 10)
                  e.target.value = ''
                  if (!Number.isNaN(minuten)) bulkVerschuif(minuten)
                }}
                style={balkVak(isMobile, {
                  cursor: (!geselecteerd.size || bulkBezig) ? 'not-allowed' : 'pointer',
                  opacity: (!geselecteerd.size || bulkBezig) ? 0.35 : 1,
                })}
              >
                <option value="">Verzetten…</option>
                <optgroup label="Later">
                  {VERZET_STAPPEN.map(o => (
                    <option key={`later-${o.min}`} value={o.min}>+ {o.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Eerder">
                  {VERZET_STAPPEN.map(o => (
                    <option key={`eerder-${o.min}`} value={-o.min}>− {o.label}</option>
                  ))}
                </optgroup>
              </select>

              <button
                onClick={bulkVerwijder}
                disabled={!geselecteerd.size || bulkBezig}
                style={balkVak(isMobile, {
                  background: 'rgba(239,68,68,0.08)',
                  borderTopColor: 'rgba(239,68,68,0.4)', borderBottomColor: 'rgba(239,68,68,0.4)',
                  borderLeftColor: 'rgba(239,68,68,0.4)', borderRightColor: 'rgba(239,68,68,0.4)',
                  color: '#ef4444',
                  cursor: (!geselecteerd.size || bulkBezig) ? 'not-allowed' : 'pointer',
                  opacity: (!geselecteerd.size || bulkBezig) ? 0.35 : 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                })}
              >
                <Trash2 size={12} /> Verwijder
              </button>

              <div style={{ flex: 1 }} />
              <button
                onClick={stopSelectie}
                disabled={bulkBezig}
                style={{
                  padding: '0.35rem 0.6rem', borderRadius: 0,
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                }}
              >
                {bulkBezig ? 'Bezig…' : 'Klaar'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Weekbudget — uitklapbaar. Alleen voor de coach: het is zijn
          rekenwerk, en een kilo-voorspelling bij de klant neerleggen is een
          andere beslissing dan deze. */}
      {!isClient && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <WeekBudgetPaneel
          db={db}
          clientId={client?.id}
          mealPlan={data?.mealPlan}
          isMobile={isMobile}
        />
        </div>
      )}
      </div>

      {/* Dagkiezer — alleen op de telefoon, en alleen als de dag niet van
          buitenaf is opgelegd. Toont de datum eronder zodat je niet hoeft te
          gokken welke week je bekijkt. */}
      {isMobile && !singleDay && (
        <div style={{
          display: 'flex', gap: 4, flexShrink: 0,
          padding: '0.4rem 0', marginBottom: '0.35rem',
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          {DAYS.map(d => {
            const datum = weekDates[d]
            const isVandaag = datum && toIsoDate(datum) === toIsoDate(new Date())
            const actief = d === mobieleDag
            return (
              <button key={d} onClick={() => setMobieleDag(d)} style={{
                flex: 1, minWidth: 42,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                padding: '0.35rem 0.2rem',
                background: actief ? '#fff' : 'rgba(255,255,255,0.03)',
                borderTop: `1px solid ${actief ? '#fff' : COLORS.border}`,
                borderBottom: `1px solid ${actief ? '#fff' : COLORS.border}`,
                borderLeft: `1px solid ${actief ? '#fff' : COLORS.border}`,
                borderRight: `1px solid ${actief ? '#fff' : COLORS.border}`,
                borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 900,
                  color: actief ? '#0a0a0a' : (isVandaag ? '#FFD700' : 'rgba(255,255,255,0.7)'),
                }}>{DAY_LABELS_NL[d]}</span>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700,
                  color: actief ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)',
                }}>{datum ? datum.getDate() : ''}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Week grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 0,
        // Verticaal scrollen i.p.v. verbergen: raakt de ruimte onder het
        // minimum, dan scroll je naar de late uren in plaats van ze kwijt
        // te raken. Horizontaal blijft dicht: op een breed scherm passen de
        // zeven dagen, op een telefoon staat er maar één kolom.
        overflowY: 'auto', overflowX: 'hidden',
        background: COLORS.bg,
      }}>
        <TimeAxis isMobile={isMobile} />
        {visibleDays.map(day => {
          const dForHeader = weekDates[day]
          const todayIso = toIsoDate(new Date())
          const isToday = dForHeader && toIsoDate(dForHeader) === todayIso
          return (
            <DayColumn
              key={day}
              day={day}
              blocks={blocksByDay[day]}
              isMobile={isMobile}
              onBlockClick={handleBlockClick}
              onAddClick={handleAddClick}
              geselecteerd={geselecteerd}
              selectieModus={selectieModus}
              plaatsModus={!!teplaatsen}
              onGridClick={plaatsOpGrid}
              onBlockPointerDownDrag={handleBlockPointerDown}
              isDropTarget={drag && drag.moved && drag.targetDay === day && drag.originDay !== day}
              ghostBlock={ghostByDay[day]}
              sourceBlockId={drag?.block?.id}
              groepSleep={!!drag?.groep && !!drag?.moved}
              gridRef={(el) => { gridRefs.current[day] = el }}
              dateForHeader={dForHeader}
              isToday={isToday}
            />
          )
        })}
      </div>

      {/* Floating tijd-bubble — volgt de cursor tijdens drag, toont de
          snapped start-tijd van het blok. Hoofdfeedback voor de coach. */}
      {drag && drag.moved && (
        <div style={{
          position: 'fixed',
          left: drag.cursorX + 16,
          top: drag.cursorY - 30,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: 0,
          padding: '0.4rem 0.7rem',
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        }}>
          {formatTime(drag.newStart)}
        </div>
      )}

      {moveError && (
        <div style={{
          position: 'fixed',
          // Hoger dan de floating bottom-nav (op bottom:30 + ~60px) zodat
          // de toast altijd zichtbaar is, ook in plan-analyzer.
          bottom: 130, left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.7rem 1.1rem',
          background: 'rgba(239,68,68,0.96)', color: '#fff',
          fontSize: '0.82rem', fontWeight: 800,
          borderRadius: 0, zIndex: 9999,
          boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(239,68,68,0.4)',
          maxWidth: '92vw',
          textAlign: 'center',
        }}>
          {moveError}
        </div>
      )}

      {scopePrompt && <ScopePromptModal {...scopePrompt} isMobile={isMobile} />}

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          client={client}
          service={service}
          isMobile={isMobile}
          onMealSelect={onMealSelect}
          onMealDelete={onMealDelete}
          onClose={() => setEditingBlock(null)}
          onSaved={async () => { setEditingBlock(null); await reload() }}
          onTimeSaveRequest={handleTimeSaveFromModal}
        />
      )}

      {/* Footer */}
      <div style={{
        fontSize: '0.72rem', color: COLORS.text25,
        textAlign: 'right', fontStyle: 'italic',
      }}>
        Bron: {mealPlan?.template_name ? `meal-plan "${mealPlan.template_name}"` : 'geen meal-plan'}
        {schema?.name && ` · workout "${schema.name}"`}
      </div>
    </div>
  )
}
