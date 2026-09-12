// src/modules/meal-plan/components/day-schedule/MealCard.jsx
//
// v7 — foto over de volle hoogte links, met het moment ("Ontbijt") en de tijd
// eroverheen op een donkere foto. Rechts van de foto de naam, de macro's en
// daaronder de knoppen; die zijn kleiner dan voorheen, want ze staan nu naast
// de foto en niet meer over de hele breedte eronder.

import React from 'react'
import { Check, Info, RefreshCw } from 'lucide-react'
import { foodImageFallback } from '../../foodImageFallback'

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
  // Andere knoppen dan Info / Wissel / Afronden. Wat de klant zelf logde
  // gebruikt dezelfde kaart, maar dan met Bewerken en Verwijderen.
  acties = null,
  // Naam op de foto (moment) is standaard het slot-label; hiermee kan een
  // gelogde maaltijd zijn eigen tijd meegeven.
  momentLabel = null,
  tijdLabel = null,
  // Regel onder de naam in plaats van de macro's — een supplement heeft geen
  // kcal maar wel een dosering.
  ondertitel = null,
  // Aangetikt in een keuzelijst (wisselvenster): witte rand in plaats van de
  // grijze, zonder het "afgevinkt"-gedrag van isChecked.
  geselecteerd = false,
  // Knopje rechtsboven op de kaart (de ster in het wisselvenster).
  hoekKnop = null,
  // Vaste waarde helemaal rechts op de kaart, verticaal in het midden — bv.
  // het aantal gram bij een ingrediënt.
  rechts = null,
}) {
  const photoSize = isMobile ? 78 : 90
  // Een lege string betekent bewust geen label op de foto (ingrediënten).
  const moment = momentLabel === '' ? '' : (momentLabel || getMealTypeLabel(meal))
  const tijd = tijdLabel || (typeof meal.timing === 'string' && /^\d{1,2}:\d{2}/.test(meal.timing) ? meal.timing : null)
  return (
    <div style={{
      margin: isMobile ? '0 0.9rem 0.55rem' : '0 1.25rem 0.7rem',
      background: geselecteerd ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${geselecteerd ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: isChecked ? 0.55 : 1,
      transition: 'opacity 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {hoekKnop && (
        <div style={{ position: 'absolute', top: 2, right: 2, zIndex: 3 }}>{hoekKnop}</div>
      )}
      {/* Bovenste rij: kleine foto + info ernaast */}
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        <div
          onClick={onCheck}
          style={{
            width: photoSize, alignSelf: 'stretch',
            flexShrink: 0,
            background: `url(${getMealImage(meal)}) center/cover`,
            position: 'relative', overflow: 'hidden',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Donkerder, zodat het moment en de tijd erop leesbaar zijn zonder
              dat je van elke foto de belichting hoeft te vertrouwen. */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.8) 100%)',
          }} />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: isMobile ? '0 5px 5px' : '0 6px 6px',
            pointerEvents: 'none',
          }}>
            {moment && <div style={{
              fontSize: isMobile ? '0.6rem' : '0.66rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.01em', lineHeight: 1.1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
            }}>
              {moment}
            </div>}
            {tijd && (
              <div style={{
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: 800, color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.2, marginTop: 1,
                textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              }}>
                {tijd}
              </div>
            )}
          </div>
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

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '0.45rem 0.7rem 0.35rem' : '0.55rem 0.95rem 0.45rem',
        }}>
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

          {ondertitel && (
            <div style={{
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: 800, color: 'rgba(255,255,255,0.45)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {ondertitel}
            </div>
          )}

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

      {/* Actie-rij — naast de foto in plaats van over de volle breedte
          eronder, en daardoor compacter. Een lege lijst betekent: geen
          knoppen (de kaart als voorbeeld, bijvoorbeeld in het wisselvenster). */}
      <div style={{
        display: acties && acties.length === 0 ? 'none' : 'flex',
        borderTop: `1px solid ${DIVIDER}`,
      }}>
        {(acties || [
          { icon: <Info size={isMobile ? 11 : 12} />, label: 'Info', onClick: onInfo },
          { icon: <RefreshCw size={isMobile ? 11 : 12} />, label: 'Wissel', onClick: onAlternatives },
          { icon: <Check size={isMobile ? 11 : 12} strokeWidth={2.6} />, label: isChecked ? 'Gelogd' : 'Afronden', onClick: onCheck, checked: isChecked },
        ]).map((actie, i) => (
          <React.Fragment key={actie.label}>
            {i > 0 && <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />}
            <ActionCell
              icon={actie.icon}
              label={actie.label}
              onClick={(e) => { e.stopPropagation(); actie.onClick?.() }}
              isMobile={isMobile}
              checked={actie.checked}
              kleur={actie.kleur}
            />
          </React.Fragment>
        ))}
      </div>
        </div>

        {rechts && (
          <div style={{
            flexShrink: 0, alignSelf: 'center',
            padding: isMobile ? '0 0.8rem 0 0.4rem' : '0 1rem 0 0.5rem',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
            whiteSpace: 'nowrap',
          }}>
            {rechts}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionCell({ icon, label, onClick, isMobile, checked, kleur }) {
  const color = kleur || (checked ? '#10b981' : 'rgba(255,255,255,0.7)')
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 4,
        padding: isMobile ? '0.25rem 0.3rem' : '0.3rem 0.4rem',
        background: 'transparent',
        border: 'none',
        color,
        fontSize: isMobile ? '0.6rem' : '0.65rem',
        fontWeight: 700,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 24,
        letterSpacing: '-0.005em',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
