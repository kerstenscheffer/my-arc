// src/modules/meal-plan/components/day-schedule/MealCard.jsx
//
// v6 — terug naar de compacte foto linksboven + info ernaast, en de
// actie-rij sluit edge-to-edge aan onderaan de kaart. Geen border, geen
// achtergrond op het paneel — alleen een dun lijntje boven en verticale
// lijntjes tussen Info / Wissel / Afronden (Koolh/Vet-stijl).

import React from 'react'
import { Check, Info, RefreshCw } from 'lucide-react'
import { foodImageFallback } from '../../foodImageFallback'

const GOLD = '#FFD700'
const DIVIDER = 'rgba(255,255,255,0.06)'

// Foto: eigen image_url indien aanwezig, anders een titel-gebaseerde fallback
// (kwark -> zuivel, kip -> kip, enz.) zodat er altijd een passende foto is.
const getMealImage = (meal) => {
  if (meal?.image_url) return meal.image_url
  return foodImageFallback(meal?.name || meal?.title, meal?.slot, 200)
}

const SLOT_LABELS = {
  breakfast: 'Ontbijt',
  lunch:     'Lunch',
  dinner:    'Diner',
  snack1:    'Snack 1',
  snack2:    'Snack 2',
  snack3:    'Snack 3',
  snack4:    'Snack 4',
}
// Toont de "soort maaltijd"-titel. Coach-titel (display_label, bv.
// "Pre Workout Meal") wint; anders het standaard slot-label; anders de
// slot-naam netjes met hoofdletter — nooit meer een kale key.
const getMealTypeLabel = (meal) => {
  if (meal?.display_label) return meal.display_label
  const slot = meal?.slot
  if (slot && SLOT_LABELS[slot]) return SLOT_LABELS[slot]
  return slot ? slot.charAt(0).toUpperCase() + slot.slice(1) : 'Maaltijd'
}

export default function MealCard({
  meal, isChecked, isMobile, onCheck, onInfo, onAlternatives,
}) {
  const photoSize = isMobile ? 70 : 80
  return (
    <div style={{
      margin: isMobile ? '0 0.9rem 0.55rem' : '0 1.25rem 0.7rem',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      overflow: 'hidden',
      opacity: isChecked ? 0.55 : 1,
      transition: 'opacity 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Bovenste rij: kleine foto + info ernaast */}
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        <div
          onClick={onCheck}
          style={{
            width: photoSize, height: photoSize,
            flexShrink: 0,
            background: `url(${getMealImage(meal)}) center/cover`,
            position: 'relative',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isChecked && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(16, 185, 129, 0.78)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Check size={isMobile ? 22 : 26} color="white" strokeWidth={3} />
            </div>
          )}
        </div>

        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '0.45rem 0.7rem 0.4rem' : '0.55rem 0.95rem 0.5rem',
        }}>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: 800,
            color: GOLD,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1,
            marginBottom: 4,
            opacity: 0.85,
          }}>
            {getMealTypeLabel(meal)}
          </div>

          <div style={{
            fontSize: isMobile ? '0.9rem' : '0.98rem',
            fontWeight: 800,
            color: isChecked ? 'rgba(255,255,255,0.45)' : '#fff',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textDecoration: isChecked ? 'line-through' : 'none',
            letterSpacing: '-0.015em',
            marginBottom: 4,
          }}>
            {meal.meal_name || meal.name || 'Maaltijd'}
          </div>

          <div style={{
            display: 'flex',
            gap: isMobile ? '0.55rem' : '0.7rem',
            overflow: 'hidden',
          }}>
            {[
              { val: meal.calories, label: 'kcal' },
              { val: meal.protein,  label: 'E' },
              { val: meal.carbs,    label: 'K' },
              { val: meal.fat,      label: 'V' },
            ].filter(m => m.val > 0).map(macro => (
              <div key={macro.label} style={{
                display: 'flex', alignItems: 'baseline', gap: 2,
              }}>
                <span style={{
                  fontSize: isMobile ? '0.72rem' : '0.78rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.7)',
                }}>
                  {Math.round(macro.val)}
                </span>
                <span style={{
                  fontSize: isMobile ? '0.52rem' : '0.58rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                }}>
                  {macro.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actie-rij — sluit edge-to-edge aan de zijkanten van de kaart.
          Geen border, geen eigen achtergrond — alleen een dun bovenlijntje
          dat 'm scheidt van de info, en verticale lijntjes tussen de cellen
          (Koolh/Vet-stijl). */}
      <div style={{
        display: 'flex',
        borderTop: `1px solid ${DIVIDER}`,
      }}>
        <ActionCell
          icon={<Info size={isMobile ? 12 : 13} />}
          label="Info"
          onClick={(e) => { e.stopPropagation(); onInfo?.() }}
          isMobile={isMobile}
        />
        <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
        <ActionCell
          icon={<RefreshCw size={isMobile ? 12 : 13} />}
          label="Wissel"
          onClick={(e) => { e.stopPropagation(); onAlternatives?.() }}
          isMobile={isMobile}
        />
        <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
        <ActionCell
          icon={<Check size={isMobile ? 12 : 13} strokeWidth={2.6} />}
          label={isChecked ? 'Gelogd' : 'Afronden'}
          onClick={(e) => { e.stopPropagation(); onCheck?.() }}
          isMobile={isMobile}
          checked={isChecked}
        />
      </div>
    </div>
  )
}

function ActionCell({ icon, label, onClick, isMobile, checked }) {
  const color = checked ? '#10b981' : 'rgba(255,255,255,0.7)'
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5,
        padding: isMobile ? '0.42rem 0.3rem' : '0.5rem 0.4rem',
        background: 'transparent',
        border: 'none',
        color,
        fontSize: isMobile ? '0.68rem' : '0.72rem',
        fontWeight: 700,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 32,
        letterSpacing: '-0.005em',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
