// src/modules/ai-meal-generator/tabs/plan-analyzer/MealCard.jsx
//
// v4 — gestyleerd naar de client meal-card (gefloate kaart, gouden slot-
// label, dunne dividers tussen acties). Coach behoudt Swap / Edit / Scale
// / Delete, en de extra functies (timing edit, scaler, ingrediënten-
// expand) blijven achter dezelfde card.

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Shuffle, Trash2, Plus, Scale, Pencil, CalendarDays } from 'lucide-react'
import MealEditModal from './MealEditModal'

const GOLD = '#FFD700'
const DIVIDER = 'rgba(255,255,255,0.06)'

const SLOT_LABELS = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3',
}

// Custom labels die de coach kan kiezen via de dropdown. Slaat op in
// meal.display_label en wint van de slot-default.
const LABEL_OPTIONS = [
  'Ontbijt', 'Lunch', 'Diner', 'Pre Workout Meal', 'After Workout Meal', 'Snack', 'Avondsnack', 'Fruit',
]

const SLOT_TIMES = {
  breakfast: '07:00', lunch: '12:30', dinner: '18:00',
  snack1: '10:00', snack2: '15:30', snack3: '21:00',
}

// Fallback foto's per slot wanneer ai_meals.image_url leeg is — zelfde set
// die de client-meal-card gebruikt. Ongeveer 50% van de meals heeft geen
// eigen foto in de DB, dus zonder fallback bleef het kale "geen foto"-vlak.
const SLOT_FALLBACK_IMG = {
  breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop&q=80',
  lunch:     'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
  dinner:    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
  snack1:    'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
  snack2:    'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
  snack3:    'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80',
}
const FALLBACK_GENERIC = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop&q=80'
const getMealImage = (meal, slot) => meal?.image_url || SLOT_FALLBACK_IMG[slot] || FALLBACK_GENERIC

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseIngredients(ingredients) {
  if (!ingredients) return []
  if (!Array.isArray(ingredients) && typeof ingredients === 'object') {
    return Object.entries(ingredients).map(([name, amount]) => ({
      name: String(name), amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0,
      unit: typeof amount === 'string' && amount.includes('ml') ? 'ml' : 'g', id: null,
    }))
  }
  if (Array.isArray(ingredients)) {
    return ingredients.map((item, idx) => {
      if (typeof item === 'string') return { name: item, amount: 0, unit: 'g', id: null }
      if (typeof item === 'object' && item !== null) {
        if (item.ingredient_id && !item.name) {
          return { name: null, amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0, unit: item.unit || 'g', id: item.ingredient_id }
        }
        return { name: item.name ? String(item.name) : `ingredient ${idx + 1}`, amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || item.grams || 0, unit: item.unit || 'g', id: item.id || null }
      }
      return { name: `ingredient ${idx + 1}`, amount: 0, unit: 'g', id: null }
    })
  }
  return []
}

export default function MealCard({
  db, meal, slot, dayIndex, mealSchedule, isPreWorkout,
  isEmpty, onSwap, onDelete, onAdd, onUpdateMeal, onApplyToDays, conflicts, isMobile,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showScaler, setShowScaler]   = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTiming, setEditingTiming] = useState(false)
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const labelBtnRef = useRef(null)
  const [labelMenuPos, setLabelMenuPos] = useState(null)

  const openLabelMenu = () => {
    if (!labelBtnRef.current) return
    const r = labelBtnRef.current.getBoundingClientRect()
    setLabelMenuPos({ top: r.bottom + 4, left: r.left })
    setShowLabelMenu(true)
  }

  // Scaler state
  const [scalerData, setScalerData]     = useState(null)
  const [loadingScaler, setLoadingScaler] = useState(false)
  const [scalerAmounts, setScalerAmounts] = useState({})

  // Ingredient namen
  const [ingredientNames, setIngredientNames] = useState({})
  const [loadingNames, setLoadingNames]       = useState(false)

  const m = isMobile
  // Custom label uit meal.display_label gaat voor de slot-default.
  const slotLabel = meal?.display_label || SLOT_LABELS[slot] || slot
  const slotTime  = meal?.timing || SLOT_TIMES[slot] || ''
  const rawIngredients = meal?.ingredients_list || meal?.ingredients || null
  const ingredientList = parseIngredients(rawIngredients)
  const isUUIDFormat   = ingredientList.some(i => i.id && UUID_REGEX.test(i.id))
  const needsNameLookup = ingredientList.some(i => i.id && !i.name)

  // Sleutel van alle ingredient-UUID's — zo draait de lookup opnieuw zodra de
  // maaltijd (of z'n ingrediënten) wijzigt, bv. na een swap. Voorheen hing 't
  // alleen aan de boolean needsNameLookup → bleef die true, dan werden nieuwe
  // id's nooit opgehaald en zag je de rauwe UUID-code.
  const uuidKey = ingredientList.filter(i => i.id && UUID_REGEX.test(i.id)).map(i => i.id).join(',')

  // Ingredient namen laden
  useEffect(() => {
    if (!db?.supabase) return
    const uuids = ingredientList.filter(i => i.id && UUID_REGEX.test(i.id) && !ingredientNames[i.id]).map(i => i.id)
    if (uuids.length === 0) return
    const load = async () => {
      setLoadingNames(true)
      const { data, error } = await db.supabase.from('ai_ingredients').select('id, name').in('id', uuids)
      if (error) console.warn('[MealCard] ingredient-namen laden mislukt:', error.message)
      if (data) { const map = {}; data.forEach(ing => { map[ing.id] = ing.name }); setIngredientNames(prev => ({ ...prev, ...map })) }
      setLoadingNames(false)
    }
    load()
  }, [uuidKey, db])

  // Scaler data laden
  useEffect(() => {
    if (!showScaler || !isUUIDFormat || !db?.supabase || scalerData) return
    const uuids = ingredientList.filter(i => i.id && UUID_REGEX.test(i.id)).map(i => i.id)
    if (uuids.length === 0) return
    const load = async () => {
      setLoadingScaler(true)
      const { data } = await db.supabase.from('ai_ingredients').select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, min_portion_gram, max_portion_gram, default_portion_gram, scalable').in('id', uuids)
      if (data) {
        const map = {}; data.forEach(r => { map[r.id] = r }); setScalerData(map)
        const initial = {}; ingredientList.forEach(i => { if (i.id && UUID_REGEX.test(i.id)) initial[i.id] = i.amount }); setScalerAmounts(initial)
      }
      setLoadingScaler(false)
    }
    load()
  }, [showScaler])

  const getIngredientName = (ing) => {
    if (ing.name) return ing.name
    if (ing.id && ingredientNames[ing.id]) return ingredientNames[ing.id]
    if (ing.id && scalerData?.[ing.id]) return scalerData[ing.id].name
    if (ing.id) return loadingNames ? '…' : 'Ingrediënt'
    return 'onbekend'
  }

  const getStep = (dbIng) => {
    if (!dbIng) return 10
    const min = dbIng.min_portion_gram || 25
    if (min <= 5) return 5; if (min <= 10) return 10; if (min <= 25) return 25
    return min
  }

  const adjustAmount = (ingredientId, delta) => {
    const dbIng = scalerData?.[ingredientId]
    if (!dbIng || !dbIng.scalable) return
    const min = dbIng.min_portion_gram || 0; const max = dbIng.max_portion_gram || 500
    const current = scalerAmounts[ingredientId] || dbIng.default_portion_gram || 100
    setScalerAmounts(prev => ({ ...prev, [ingredientId]: Math.min(max, Math.max(min, current + delta)) }))
  }

  const calcScalerMacros = () => {
    if (!scalerData) return null
    let cal = 0, prot = 0, carbs = 0, fat = 0
    ingredientList.forEach(ing => {
      if (!ing.id || !UUID_REGEX.test(ing.id)) return
      const dbIng = scalerData[ing.id]; if (!dbIng) return
      const amount = scalerAmounts[ing.id] ?? ing.amount; const f = amount / 100
      cal += (dbIng.calories_per_100g || 0) * f; prot += (dbIng.protein_per_100g || 0) * f
      carbs += (dbIng.carbs_per_100g || 0) * f; fat += (dbIng.fat_per_100g || 0) * f
    })
    return { calories: Math.round(cal), protein: Math.round(prot * 10) / 10, carbs: Math.round(carbs * 10) / 10, fat: Math.round(fat * 10) / 10 }
  }

  const applySmartScale = () => {
    if (!onUpdateMeal || !scalerData) return
    const newMacros = calcScalerMacros(); if (!newMacros) return
    const newIngredients = (rawIngredients || []).map(item => {
      if (!item?.ingredient_id || !UUID_REGEX.test(item.ingredient_id)) return item
      const newAmount = scalerAmounts[item.ingredient_id]
      return newAmount !== undefined ? { ...item, amount: newAmount } : item
    })
    onUpdateMeal(dayIndex, slot, { ...meal, ...newMacros, ingredients_list: newIngredients, original_calories: meal.original_calories || meal.calories, original_protein: meal.original_protein || meal.protein, original_carbs: meal.original_carbs || meal.carbs, original_fat: meal.original_fat || meal.fat })
    setShowScaler(false); setScalerData(null)
  }

  const scalerMacros = showScaler && scalerData ? calcScalerMacros() : null
  const hasMacroChange = scalerMacros && (scalerMacros.calories !== Math.round(meal?.calories || 0))

  // ── EMPTY SLOT ──
  if (isEmpty || !meal) {
    return (
      <button
        onClick={() => onAdd?.(dayIndex, slot)}
        style={{
          margin: m ? '0 0.5rem 0.4rem' : '0 0.75rem 0.5rem',
          width: 'calc(100% - 1rem)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0.6rem 0.75rem',
          background: 'rgba(255,255,255,0.02)',
          border: `1px dashed ${DIVIDER}`,
          borderRadius: 10,
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.62rem', fontWeight: 700,
          cursor: 'pointer', touchAction: 'manipulation',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          minHeight: 44,
        }}
      >
        <Plus size={12} />
        {slotLabel} toevoegen
      </button>
    )
  }

  const photoSize = m ? 70 : 80

  return (
    <div style={{
      // Floating card — exact dezelfde stijl als de client meal-card.
      margin: m ? '0 0.5rem 0.45rem' : '0 0.75rem 0.55rem',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Bovenste rij: foto + info */}
      <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
        {/* Foto-kolom — gebruikt fallback per slot als meal geen eigen
            image_url heeft. Lege ai_meals laten geen kaal vlak meer zien. */}
        <div style={{
          width: photoSize, height: photoSize,
          flexShrink: 0,
          background: `url(${getMealImage(meal, slot)}) center/cover`,
          position: 'relative',
        }}>
          {isPreWorkout && (
            <div style={{
              position: 'absolute', top: 4, left: 4,
              fontSize: '0.42rem', fontWeight: 800,
              color: '#fff', background: 'rgba(249,115,22,0.85)',
              padding: '1px 4px', borderRadius: 3,
              letterSpacing: '0.04em',
            }}>PRE</div>
          )}
        </div>

        {/* Info area */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: m ? '0.45rem 0.7rem 0.4rem' : '0.55rem 0.95rem 0.5rem',
        }}>
          {/* Slot + timing op één regel */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 4,
          }}>
            {/* Klikbare slot-label. Dropdown wordt via portal gerenderd
                op document.body zodat de MealCard's overflow:hidden hem
                niet afkapt. */}
            <button
              ref={labelBtnRef}
              onClick={openLabelMenu}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 0,
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: m ? '0.55rem' : '0.6rem',
                fontWeight: 800, color: GOLD,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                lineHeight: 1, opacity: 0.85,
                fontFamily: 'inherit',
              }}
            >
              {slotLabel}
              <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▾</span>
            </button>
            {showLabelMenu && labelMenuPos && createPortal(
              <>
                <div
                  onClick={() => setShowLabelMenu(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                />
                <div style={{
                  position: 'fixed',
                  top: labelMenuPos.top, left: labelMenuPos.left,
                  zIndex: 9999,
                  background: '#111',
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: 8,
                  minWidth: 160,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                }}>
                  {LABEL_OPTIONS.map((opt, i) => {
                    const isSelected = slotLabel.toLowerCase() === opt.toLowerCase()
                    return (
                      <button key={opt}
                        onClick={() => {
                          setShowLabelMenu(false)
                          if (onUpdateMeal) {
                            onUpdateMeal(dayIndex, slot, { ...meal, display_label: opt })
                          }
                        }}
                        style={{
                          width: '100%',
                          display: 'block',
                          padding: '0.6rem 0.8rem',
                          background: isSelected ? 'rgba(255,215,0,0.08)' : 'transparent',
                          border: 'none',
                          borderBottom: i < LABEL_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          color: isSelected ? GOLD : 'rgba(255,255,255,0.8)',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 800 : 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </>,
              document.body
            )}
            <span style={{ flex: 1 }} />
            {editingTiming ? (
              <input
                type="time" defaultValue={slotTime || ''} autoFocus
                onBlur={(e) => {
                  if (e.target.value && onUpdateMeal) onUpdateMeal(dayIndex, slot, { ...meal, timing: e.target.value })
                  setEditingTiming(false)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingTiming(false) }}
                style={{
                  background: 'rgba(255,215,0,0.06)',
                  border: '1px solid rgba(255,215,0,0.25)',
                  borderRadius: 3, color: GOLD,
                  fontSize: '0.55rem', fontWeight: 800,
                  padding: '0.05rem 0.25rem',
                  fontFamily: 'inherit', outline: 'none', width: 68,
                }}
              />
            ) : (
              <button
                onClick={() => setEditingTiming(true)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '0.05rem 0.2rem',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700,
                  color: slotTime ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
                }}>{slotTime || '—'}</span>
                <span style={{ fontSize: '0.5rem', color: 'rgba(255,215,0,0.4)' }}>✎</span>
              </button>
            )}
          </div>

          {/* Naam + kcal */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            marginBottom: 4,
          }}>
            <div style={{
              flex: 1, minWidth: 0,
              fontSize: m ? '0.9rem' : '0.98rem',
              fontWeight: 800, color: '#fff',
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {meal.name || meal.meal_name || 'Onbekend'}
            </div>
          </div>

          {/* Macro-regel — dezelfde compacte stijl als de client card */}
          <div style={{
            display: 'flex', alignItems: 'baseline',
            gap: m ? '0.55rem' : '0.7rem',
            overflow: 'hidden',
          }}>
            <MacroBit val={meal.calories} label="kcal" m={m} />
            <MacroBit val={meal.protein}  label="E"    m={m} />
            <MacroBit val={meal.carbs}    label="K"    m={m} />
            <MacroBit val={meal.fat}      label="V"    m={m} />
            {conflicts?.length > 0 && (
              <span style={{
                fontSize: m ? '0.6rem' : '0.65rem',
                color: '#f59e0b', fontWeight: 700,
                marginLeft: 'auto',
              }}>
                ⚠ {conflicts.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acties — zelfde divider-stijl als client card. 4 cellen voor coach
          (Swap / Edit / Scale / Delete). */}
      <div style={{
        display: 'flex',
        borderTop: `1px solid ${DIVIDER}`,
      }}>
        <ActionCell
          icon={<Shuffle size={m ? 13 : 14} />}
          label="Swap"
          onClick={(e) => { e.stopPropagation(); onSwap?.(dayIndex, slot, meal) }}
          m={m}
        />
        <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
        <ActionCell
          icon={<Pencil size={m ? 13 : 14} />}
          label="Edit"
          onClick={(e) => { e.stopPropagation(); setShowEditModal(s => !s) }}
          m={m}
          active={showEditModal}
        />
        <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
        <ActionCell
          icon={<CalendarDays size={m ? 13 : 14} />}
          label="Dagen"
          onClick={(e) => { e.stopPropagation(); onApplyToDays?.(dayIndex, slot, meal) }}
          m={m}
        />
        <div style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }} />
        <ActionCell
          icon={<Trash2 size={m ? 13 : 14} />}
          label="Wis"
          onClick={(e) => { e.stopPropagation(); onDelete?.(dayIndex, slot) }}
          m={m}
          danger
        />
      </div>

      {/* ── CONFLICT BANNER ── */}
      {conflicts?.length > 0 && expanded && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '0.3rem 0.75rem',
          background: 'rgba(239,68,68,0.06)',
          borderTop: '1px solid rgba(239,68,68,0.12)',
        }}>
          <span style={{ fontSize: '0.7rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            {conflicts.map((c, i) => (
              <div key={i} style={{ fontSize: '0.55rem', fontWeight: 700, color: c.severity === 'high' ? '#ef4444' : '#f59e0b' }}>{c.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── SCALER ── */}
      {showScaler && (
        <div style={{ borderTop: `1px solid rgba(139,92,246,0.2)`, background: 'rgba(139,92,246,0.03)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.45rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ingrediënten aanpassen
            </span>
            {scalerMacros && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: hasMacroChange ? GOLD : 'rgba(255,255,255,0.25)' }}>{scalerMacros.calories} kcal</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#10b981' }}>{scalerMacros.protein}g E</span>
              </div>
            )}
          </div>
          {loadingScaler && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>}
          {!loadingScaler && scalerData && ingredientList.map((ing, i) => {
            if (!ing.id || !UUID_REGEX.test(ing.id)) return null
            const dbIng = scalerData[ing.id]; if (!dbIng) return null
            const currentAmount = scalerAmounts[ing.id] ?? ing.amount
            const step = getStep(dbIng); const min = dbIng.min_portion_gram || 0; const max = dbIng.max_portion_gram || 500
            const scalable = dbIng.scalable !== false; const changed = currentAmount !== ing.amount
            return (
              <div key={`${ing.id}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.35rem 0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                opacity: scalable ? 1 : 0.4,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: changed ? '#fff' : 'rgba(255,255,255,0.45)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {dbIng.name}
                  </div>
                  <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>
                    {scalable ? `${min}–${max}g · stap ${step}g` : 'niet aanpasbaar'}
                  </div>
                </div>
                {scalable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => adjustAmount(ing.id, -step)} disabled={currentAmount <= min} style={scalerBtnStyle(m, currentAmount <= min, '#ef4444')}>−</button>
                    <div style={{
                      minWidth: 48, textAlign: 'center',
                      fontSize: '0.75rem', fontWeight: 800,
                      color: changed ? GOLD : 'rgba(255,255,255,0.55)',
                    }}>
                      {currentAmount}<span style={{ fontSize: '0.45rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', marginLeft: 1 }}>g</span>
                    </div>
                    <button onClick={() => adjustAmount(ing.id, step)} disabled={currentAmount >= max} style={scalerBtnStyle(m, currentAmount >= max, '#10b981')}>+</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{currentAmount}g</span>
                )}
              </div>
            )
          })}
          {!loadingScaler && scalerMacros && (
            <div style={{
              padding: '0.45rem 0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { l: 'kcal', v: scalerMacros.calories, o: Math.round(meal.calories || 0), c: GOLD },
                  { l: 'E',    v: scalerMacros.protein,  o: Math.round((meal.protein || 0) * 10) / 10, c: '#10b981' },
                  { l: 'K',    v: scalerMacros.carbs,    o: Math.round((meal.carbs || 0) * 10) / 10, c: '#3b82f6' },
                  { l: 'V',    v: scalerMacros.fat,      o: Math.round((meal.fat || 0) * 10) / 10, c: '#f59e0b' },
                ].map(s => {
                  const diff = s.v - s.o; const hasDiff = Math.abs(diff) >= 1
                  return (
                    <div key={s.l} style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: s.c }}>{s.v}</span>
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)' }}>{s.l}</span>
                      {hasDiff && (
                        <span style={{
                          fontSize: '0.45rem', fontWeight: 700,
                          color: diff > 0 ? '#10b981' : '#ef4444',
                          marginLeft: 2,
                        }}>
                          {diff > 0 ? '+' : ''}{Math.round(diff)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <button
                onClick={applySmartScale}
                disabled={!hasMacroChange}
                style={{
                  padding: '0.35rem 0.65rem',
                  background: hasMacroChange ? '#8b5cf6' : 'rgba(255,255,255,0.04)',
                  border: 'none', borderRadius: 5,
                  color: hasMacroChange ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontSize: '0.65rem', fontWeight: 800,
                  cursor: hasMacroChange ? 'pointer' : 'not-allowed',
                  minHeight: 30, flexShrink: 0,
                }}
              >
                Toepassen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── INGREDIËNTEN toggle + uitklap ── */}
      {ingredientList.length > 0 && !showScaler && !showEditModal && (
        <>
          <button
            onClick={() => setExpanded(p => !p)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.3rem 0.75rem',
              background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent',
              border: 'none', borderTop: `1px solid ${DIVIDER}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
              {ingredientList.length} ingrediënten
            </span>
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,215,0,0.5)', fontWeight: 700 }}>
              {expanded ? '▲' : '▼'}
            </span>
          </button>
          {expanded && (
            <div style={{
              padding: '0.3rem 0.75rem 0.5rem',
              borderTop: '1px solid rgba(255,255,255,0.03)',
            }}>
              {loadingNames && <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' }}>Namen ophalen...</div>}
              <style>{`._hs::-webkit-scrollbar{display:none}`}</style>
              <div className="_hs" style={{
                display: 'flex', gap: 5, overflowX: 'auto',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
              }}>
                {ingredientList.map((ing, i) => (
                  <div key={i} style={{
                    flexShrink: 0,
                    fontSize: '0.58rem', color: 'rgba(255,255,255,0.55)',
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '0.18rem 0.4rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}>
                    <span>{getIngredientName(ing)}</span>
                    {ing.amount > 0 && (
                      <span style={{ fontWeight: 800, color: GOLD, marginLeft: 2 }}>
                        {ing.amount}{ing.unit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit — inline paneel ONDER de card (zelfde plek/stijl als de scaler). */}
      {showEditModal && (
        <MealEditModal
          embedded
          db={db} meal={meal} slot={slot} dayIndex={dayIndex}
          onSave={(updatedMeal) => onUpdateMeal(dayIndex, slot, updatedMeal)}
          onClose={() => setShowEditModal(false)} isMobile={m}
        />
      )}
    </div>
  )
}

function MacroBit({ val, label, m }) {
  const v = Math.round(val || 0)
  if (!v) return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{
        fontSize: m ? '0.72rem' : '0.78rem',
        fontWeight: 800,
        color: 'rgba(255,255,255,0.7)',
      }}>
        {v}
      </span>
      <span style={{
        fontSize: m ? '0.52rem' : '0.58rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}

// Action-cel in client-card stijl — geen border/bg, alleen via dividers
// gescheiden van de andere acties. "danger" geeft rode tint voor Wis.
function ActionCell({ icon, label, onClick, m, active, danger }) {
  const color = danger ? '#ef4444' : active ? GOLD : 'rgba(255,255,255,0.65)'
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 4,
        padding: m ? '0.42rem 0.3rem' : '0.5rem 0.4rem',
        background: 'transparent', border: 'none',
        color,
        fontSize: m ? '0.62rem' : '0.66rem',
        fontWeight: 700,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 32,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function scalerBtnStyle(m, disabled, color) {
  return {
    width: m ? 28 : 30, height: m ? 28 : 30, borderRadius: 5, flexShrink: 0,
    background: disabled ? 'rgba(255,255,255,0.02)' : `${color}15`,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : color + '40'}`,
    color: disabled ? 'rgba(255,255,255,0.1)' : color,
    fontSize: '1.1rem', fontWeight: 700, lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
