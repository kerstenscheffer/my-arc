// Client Agenda View — fase 1 (read-only).
//
// Toont één weekraster (ma-zo) met alle blokken van de geselecteerde
// client uit ClientAgendaService. Geen edit, geen drag-drop — alleen
// lezen, zodat de coach in één blik ziet hoe de week eruit ziet.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Utensils, Dumbbell, Moon, Briefcase, AlertCircle, Plus, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ClientAgendaService, DAYS, DAY_LABELS_NL, DAY_LABELS_NL_LONG, getMondayOf, dateForDay, toIsoDate, recurringIdFor } from './ClientAgendaService'

const COLORS = {
  bg: '#0a0a0a',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  borderItem: 'rgba(255,255,255,0.05)',
  text: '#fff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  gold: '#FFD700',
  amber: '#f59e0b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  slate: '#64748b',
}

// Tijdas: 6:00 → 23:00 (slaap wordt apart als block aan rand getoond)
const HOUR_START = 6
const HOUR_END = 23
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
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
}

const LEGEND_ITEMS = [
  { type: 'meal',     color: COLORS.amber,  label: 'Maaltijd' },
  { type: 'training', color: COLORS.blue,   label: 'Training' },
  { type: 'sleep',    color: COLORS.indigo, label: 'Slaap (placeholder)' },
  { type: 'work',     color: COLORS.slate,  label: 'Werk (placeholder)' },
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

const getBlockImage = (block) => {
  if (block.meta?.image_url) return block.meta.image_url
  if (block.type === 'meal') return MEAL_FALLBACK[block.meta?.slot] || MEAL_FALLBACK.lunch
  if (block.type === 'training') return WORKOUT_FALLBACK
  if (block.type === 'sleep')    return SLEEP_FALLBACK
  if (block.type === 'work')     return WORK_FALLBACK
  return null
}

// MealCard-stijl agenda blok. Foto links, slot-label + naam + macros
// rechts. Zelfde visuele taal als day-schedule/MealCard.jsx.
// Render-order voor overlap: langste blok eerst in DOM (komt onder te liggen),
// kortere blokken later (komen er bovenop). Beide volle breedte, beide 100%
// opaque. Tekst in elke card staat bovenaan zodat de onderliggende titel
// boven de overlay zichtbaar blijft.
function sortForOverlap(blocks) {
  if (!blocks?.length) return blocks
  return [...blocks].sort((a, b) => (b.end - b.start) - (a.end - a.start))
}

function AgendaBlock({ block, isMobile, onClick, onPointerDownDrag, draggable, isGhost, isDragSource }) {
  const top = minToTop(block.start)
  const height = Math.max(2.2, minToTop(block.end) - top)
  const isPlaceholder = block.meta?.placeholder
  const isPlaceholderTime = block.meta?.placeholder_time
  const clickable = block.editable && onClick
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
    : block.type === 'work'     ? 'Werk'
    : 'Custom'

  // Hoofdnaam — meal-naam, workout-schema, of label voor sleep/work
  const mainTitle = block.sublabel || block.label

  return (
    <div
      title={`${topLabel}${mainTitle ? ` — ${mainTitle}` : ''}\n${formatTime(block.start)}–${formatTime(block.end)}${clickable ? '\n(tik om te bewerken · sleep voor 10-min verzet of andere dag)' : ''}`}
      onPointerDown={draggable ? (e) => onPointerDownDrag?.(e, block) : undefined}
      onClick={(!draggable && clickable) ? () => onClick(block) : undefined}
      style={{
        position: 'absolute',
        top: `${top}%`,
        height: `${height}%`,
        minHeight: block.type === 'meal' && imageUrl ? 32 : undefined,
        left: 3, right: 3,
        background: isGhost ? `${block.color}33` : 'rgba(255,255,255,0.025)',
        border: isGhost ? `1px dashed ${block.color}` : '1px solid rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${block.color}`,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isDragSource ? 0.25 : isGhost ? 0.85 : (isPlaceholder ? 0.55 : 1),
        cursor: draggable ? 'grab' : (clickable ? 'pointer' : 'default'),
        transition: isGhost ? 'none' : 'opacity 0.15s ease',
        userSelect: 'none',
        touchAction: draggable ? 'none' : 'auto',
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
          position: 'relative',
        }}>
          {block.type === 'meal' && (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.75) 100%)',
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
                  color: block.color,
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
        {!(block.type === 'meal' && showImage) && (
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
        {block.type === 'meal' && showImage && (() => {
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
        {mainTitle && sizeMode !== 'mini' && !(block.type === 'meal' && showImage) && (
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
            fontSize: '0.5rem', color: COLORS.text50,
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
  onBlockPointerDownDrag, isDropTarget, ghostBlock, sourceBlockId, gridRef,
  dateForHeader, isToday,
}) {
  return (
    <div
      style={{
        flex: 1, minWidth: 0,
        borderRight: `1px solid ${COLORS.border}`,
        position: 'relative',
        background: isDropTarget ? 'rgba(255,215,0,0.04)' : COLORS.panel,
        transition: 'background 0.12s ease',
      }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.4rem 0.3rem' : '0.5rem 0.4rem',
        textAlign: 'center',
        borderBottom: `1px solid ${COLORS.border}`,
        background: 'rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        <div style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: 800,
          color: isToday ? COLORS.gold : COLORS.text50,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {isMobile ? DAY_LABELS_NL[day] : DAY_LABELS_NL_LONG[day]}
        </div>
        {dateForHeader && (
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.7rem',
            color: isToday ? COLORS.gold : '#fff',
            fontWeight: isToday ? 800 : 700,
            marginTop: 1,
            lineHeight: 1,
          }}>
            {dateForHeader.getDate()} {dateForHeader.toLocaleDateString('nl-NL', { month: 'short' })}
          </div>
        )}
        <div style={{
          fontSize: '0.5rem', color: COLORS.text25, marginTop: 2,
        }}>
          {blocks.filter(b => !b.meta?.placeholder).length} item{blocks.filter(b => !b.meta?.placeholder).length === 1 ? '' : 's'}
          {blocks.some(b => b.meta?.isOverridden) && (
            <span style={{ marginLeft: 4, color: COLORS.gold, fontWeight: 800 }}>★</span>
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
              borderRadius: 4,
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
        style={{
          position: 'relative',
          height: isMobile ? 680 : 850,
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
        {sortForOverlap(blocks).map(b => (
          <AgendaBlock
            key={b.id}
            block={b}
            isMobile={isMobile}
            onClick={onBlockClick}
            draggable={b.editable && !!onBlockPointerDownDrag && !b.meta?.wrapHalf}
            onPointerDownDrag={onBlockPointerDownDrag}
            isDragSource={sourceBlockId === b.id}
          />
        ))}
        {ghostBlock && (
          <AgendaBlock
            block={ghostBlock}
            isMobile={isMobile}
            isGhost
          />
        )}
      </div>
    </div>
  )
}

function TimeAxis({ isMobile }) {
  return (
    <div style={{
      width: isMobile ? 28 : 36, flexShrink: 0,
      borderRight: `1px solid ${COLORS.border}`,
    }}>
      <div style={{
        padding: isMobile ? '0.4rem 0.3rem' : '0.5rem 0.4rem',
        borderBottom: `1px solid ${COLORS.border}`,
        background: 'rgba(0,0,0,0.3)',
        height: isMobile ? '2.05rem' : '2.45rem',
      }} />
      <div style={{
        position: 'relative',
        height: isMobile ? 680 : 850,
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
            fontSize: '0.5rem',
            color: COLORS.text25,
            textAlign: 'right',
            paddingRight: 4,
            paddingTop: 1,
            fontWeight: 600,
          }}>
            {String(h).padStart(2, '0')}
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
    border: 'none', borderRadius: 10,
    fontSize: '0.78rem', fontWeight: 700,
    cursor: 'pointer',
  }
  const btnPrimary = {
    ...btnBase, fontSize: '0.82rem', fontWeight: 800,
    background: `linear-gradient(135deg, ${COLORS.gold} 0%, #D4AF37 100%)`,
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
          borderRadius: 14, border: `1px solid ${COLORS.border}`,
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
                      borderRadius: 8,
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
function BlockEditModal({ block, client, service, isMobile, onClose, onSaved, onTimeSaveRequest }) {
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
          borderRadius: 16, border: `1px solid ${COLORS.border}`,
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
              fontSize: '0.6rem', color: COLORS.text50, marginTop: 2,
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
            borderRadius: 8, color: COLORS.text50,
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
                display: 'block', fontSize: '0.55rem',
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
                      borderRadius: 8,
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
                display: 'block', fontSize: '0.55rem',
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
                  borderRadius: 8, color: '#fff',
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
                display: 'block', fontSize: '0.55rem',
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
                  borderRadius: 8, color: '#fff',
                  fontSize: '0.9rem', fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
            </div>
            {!isMeal && (
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block', fontSize: '0.55rem',
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
                    borderRadius: 8, color: '#fff',
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
              borderRadius: 8,
              fontSize: '0.65rem', color: COLORS.text50,
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
              borderRadius: 8,
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
          {hasDbId && !isMeal && (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '0.55rem 0.8rem',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 8, color: '#ef4444',
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
              borderRadius: 8, color: COLORS.text50,
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
              background: saving ? 'rgba(255,215,0,0.1)' : `linear-gradient(135deg, ${COLORS.gold} 0%, #D4AF37 100%)`,
              border: 'none', borderRadius: 8,
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
  // Forceer een specifiek meal-plan (i.p.v. de actieve). Plan-analyzer
  // werkt vaak met een concept-plan dat NIET is_active=true is. Zonder
  // deze prop laadde de agenda het verkeerde plan en gingen edits in
  // de agenda naar 't actieve plan i.p.v. de concept dat coach bewerkt.
  mealPlanId: forcedMealPlanId = null,
}) {
  const isMobile = typeof isMobileProp === 'boolean' ? isMobileProp : (typeof window !== 'undefined' && window.innerWidth <= 768)
  const isClient = viewerRole === 'client'
  const visibleDays = singleDay && DAYS.includes(singleDay) ? [singleDay] : DAYS
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

  const service = useMemo(() => db?.supabase ? new ClientAgendaService(db.supabase) : null, [db])

  const reload = async () => {
    if (!service || !client?.id) return
    try {
      const res = await service.loadWeek(client.id, weekAnchor, forcedMealPlanId)
      setData(res)
    } catch (e) { console.error(e); setError(e) }
  }

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
    if (isClient && block.type === 'meal') return
    setEditingBlock(block)
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
    const duration = (drag.block.meta?.fullEnd ?? drag.block.end) - (drag.block.meta?.fullStart ?? drag.block.start)
    return {
      [drag.targetDay]: {
        ...drag.block,
        id: `ghost-${drag.block.id}`,
        start: drag.newStart,
        end: drag.newStart + duration,
      },
    }
  }, [drag])

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

  const { hasMealPlan, hasSchema, mealPlan, schema } = data
  const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email

  return (
    <div style={{
      padding: isMobile ? '0.3rem 0.4rem' : '0.4rem 0.5rem',
      display: 'flex', flexDirection: 'column',
      gap: isMobile ? '0.3rem' : '0.4rem',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Compacte top — alleen week-navigator (titel + legenda zijn weg
          op gebruikersverzoek voor meer ruimte voor de tijd-grid). */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, flexWrap: 'wrap',
      }}>
        <button
          onClick={() => shiftWeek(-1)}
          title="Vorige week"
          style={{
            width: 24, height: 24, padding: 0,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 5, color: COLORS.text50,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={12} />
        </button>
        <div style={{
          fontSize: '0.6rem', color: isThisWeek ? COLORS.gold : '#fff',
          fontWeight: 700,
        }}>
          {isThisWeek ? 'Deze week' : `Week van ${weekAnchor.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
        </div>
        <button
          onClick={() => shiftWeek(1)}
          title="Volgende week"
          style={{
            width: 24, height: 24, padding: 0,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 5, color: COLORS.text50,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={12} />
        </button>
        {!isThisWeek && (
          <button
            onClick={() => setWeekAnchor(getMondayOf(new Date()))}
            title="Naar deze week"
            style={{
              padding: '0.2rem 0.45rem',
              background: 'rgba(255,215,0,0.06)',
              border: `1px solid ${COLORS.gold}40`,
              borderRadius: 5, color: COLORS.gold,
              fontSize: '0.5rem', fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            Vandaag
          </button>
        )}
      </div>

      {/* Empty-state hints */}
      {(!hasMealPlan || !hasSchema) && (
        <div style={{
          display: 'flex', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.7)',
        }}>
          <AlertCircle size={14} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            {!hasMealPlan && <div>Geen actief meal-plan voor deze client — maaltijden ontbreken in de agenda.</div>}
            {!hasSchema && <div>Geen workout-schema toegewezen — training-dagen worden niet bepaald.</div>}
            <div style={{ marginTop: 4, color: COLORS.text25, fontStyle: 'italic' }}>
              Placeholders (transparant) kun je gewoon aanklikken — ze worden bij opslaan een echt blok.
            </div>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        overflow: 'hidden',
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
              onBlockPointerDownDrag={handleBlockPointerDown}
              isDropTarget={drag && drag.moved && drag.targetDay === day && drag.originDay !== day}
              ghostBlock={ghostByDay[day]}
              sourceBlockId={drag?.block?.id}
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
          border: '1px solid rgba(255,215,0,0.35)',
          borderRadius: 10,
          padding: '0.4rem 0.7rem',
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.08)',
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
          borderRadius: 10, zIndex: 9999,
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
          onClose={() => setEditingBlock(null)}
          onSaved={async () => { setEditingBlock(null); await reload() }}
          onTimeSaveRequest={handleTimeSaveFromModal}
        />
      )}

      {/* Footer */}
      <div style={{
        fontSize: '0.55rem', color: COLORS.text25,
        textAlign: 'right', fontStyle: 'italic',
      }}>
        Bron: {mealPlan?.template_name ? `meal-plan "${mealPlan.template_name}"` : 'geen meal-plan'}
        {schema?.name && ` · workout "${schema.name}"`}
      </div>
    </div>
  )
}
