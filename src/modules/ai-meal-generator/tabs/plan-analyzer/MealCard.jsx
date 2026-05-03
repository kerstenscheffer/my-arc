// src/modules/ai-meal-generator/tabs/plan-analyzer/MealCard.jsx
// v3.1 — Compacte rij layout voor nieuwe sidebar design
// Swap/Bewerk/Schaal/Verwijder als subtiele actie rij onder de meal

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Shuffle, Trash2, Plus, Scale, Pencil } from 'lucide-react'
import MealEditModal from './MealEditModal'

const SLOT_LABELS = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3'
}

const SLOT_COLORS = {
  breakfast: '#f59e0b', snack1: '#6b7280', lunch: '#10b981',
  snack2: '#f97316', dinner: '#3b82f6', snack3: '#a855f7'
}

const SLOT_TIMES = {
  breakfast: '07:00', lunch: '12:30', dinner: '18:00',
  snack1: '10:00', snack2: '15:30', snack3: '21:00'
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseIngredients(ingredients) {
  if (!ingredients) return []
  if (!Array.isArray(ingredients) && typeof ingredients === 'object') {
    return Object.entries(ingredients).map(([name, amount]) => ({
      name: String(name), amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0,
      unit: typeof amount === 'string' && amount.includes('ml') ? 'ml' : 'g', id: null
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
  isEmpty, onSwap, onDelete, onAdd, onUpdateMeal, conflicts, isMobile
}) {
  const [expanded, setExpanded] = useState(false)
  const [showScaler, setShowScaler]   = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTiming, setEditingTiming] = useState(false)

  // Scaler state
  const [scalerData, setScalerData]     = useState(null)
  const [loadingScaler, setLoadingScaler] = useState(false)
  const [scalerAmounts, setScalerAmounts] = useState({})

  // Ingredient namen
  const [ingredientNames, setIngredientNames] = useState({})
  const [loadingNames, setLoadingNames]       = useState(false)

  const m = isMobile
  const slotColor = SLOT_COLORS[slot] || '#FFD700'
  const slotLabel = SLOT_LABELS[slot] || slot
  const slotTime  = meal?.timing || SLOT_TIMES[slot] || ''
  const rawIngredients = meal?.ingredients_list || meal?.ingredients || null
  const ingredientList = parseIngredients(rawIngredients)
  const isUUIDFormat   = ingredientList.some(i => i.id && UUID_REGEX.test(i.id))
  const needsNameLookup = ingredientList.some(i => i.id && !i.name)

  // Ingredient namen laden
  useEffect(() => {
    if (!needsNameLookup || !db?.supabase) return
    const uuids = ingredientList.filter(i => i.id && UUID_REGEX.test(i.id) && !ingredientNames[i.id]).map(i => i.id)
    if (uuids.length === 0) return
    const load = async () => {
      setLoadingNames(true)
      const { data } = await db.supabase.from('ai_ingredients').select('id, name').in('id', uuids)
      if (data) { const map = {}; data.forEach(ing => { map[ing.id] = ing.name }); setIngredientNames(prev => ({ ...prev, ...map })) }
      setLoadingNames(false)
    }
    load()
  }, [needsNameLookup])

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
    if (ing.id) return loadingNames ? '...' : `[${ing.id.slice(0,8)}…]`
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
      <button onClick={() => onAdd?.(dayIndex, slot)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 0.75rem',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        borderLeft: `2px solid ${slotColor}15`,
        color: `${slotColor}40`, fontSize: '0.6rem', fontWeight: 700,
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px'
      }}>
        <Plus size={11} />
        <span style={{ fontSize: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{slotLabel}</span>
      </button>
    )
  }

  const functionLabel = meal?.function || null
  const showFunctionLabel = functionLabel && !isPreWorkout && !functionLabel.toUpperCase().includes('PRE-WORKOUT')

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      borderLeft: `2px solid ${isPreWorkout ? '#f97316' : slotColor}`,
      background: '#0a0a0a',
      position: 'relative'
    }}>
      {/* ── HOOFD RIJ ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m ? '0.5rem 0.625rem' : '0.5rem 0.75rem' }}>

        {/* Foto thumbnail */}
        {meal.image_url && (
          <div style={{ width: m ? '36px' : '40px', height: m ? '36px' : '40px', flexShrink: 0, borderRadius: '4px', backgroundImage: `url(${meal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden' }} />
        )}

        {/* Slot label + naam */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.1rem' }}>
            <span style={{ fontSize: '0.38rem', fontWeight: 700, color: isPreWorkout ? '#f97316' : slotColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {slotLabel}
            </span>
            {isPreWorkout && (
              <span style={{ fontSize: '0.32rem', fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '0.02rem 0.2rem', borderRadius: '2px', textTransform: 'uppercase' }}>PRE-WORKOUT</span>
            )}
            {showFunctionLabel && (
              <span style={{ fontSize: '0.32rem', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>{functionLabel}</span>
            )}
            {/* Timing — klikbaar */}
            <div style={{ marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
              {editingTiming ? (
                <input type="time" defaultValue={slotTime || ''} autoFocus
                  onBlur={e => { if (e.target.value && onUpdateMeal) onUpdateMeal(dayIndex, slot, { ...meal, timing: e.target.value }); setEditingTiming(false) }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingTiming(false) }}
                  style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '3px', color: '#FFD700', fontSize: '0.5rem', fontWeight: 800, padding: '0.05rem 0.25rem', fontFamily: 'inherit', outline: 'none', width: '68px' }}
                />
              ) : (
                <button onClick={() => setEditingTiming(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.05rem 0.2rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.45rem', fontWeight: 600, color: slotTime ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }}>{slotTime || '—'}</span>
                  <span style={{ fontSize: '0.32rem', color: 'rgba(255,215,0,0.25)' }}>✎</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
            {meal.name || meal.meal_name || 'Onbekend'}
          </div>

          {/* Macro pills */}
          <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.15rem', alignItems: 'center' }}>
            {meal.protein > 0 && <MacroPill label="E" value={meal.protein} color="#10b981" m={m} />}
            {meal.carbs > 0  && <MacroPill label="K" value={meal.carbs}   color="#3b82f6" m={m} />}
            {meal.fat > 0    && <MacroPill label="V" value={meal.fat}     color="#f59e0b" m={m} />}
            {conflicts?.length > 0 && (
              <span style={{ fontSize: '0.45rem', color: '#f59e0b', marginLeft: '0.2rem' }}>⚠️ {conflicts.length}</span>
            )}
          </div>
        </div>

        {/* Kcal + expand */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: m ? '1rem' : '1.1rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>
            {Math.round(meal.calories || 0)}
          </span>
        </div>
      </div>

      {/* ── CONFLICT BANNER ── */}
      {conflicts?.length > 0 && expanded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.75rem', background: 'rgba(239,68,68,0.06)', borderTop: '1px solid rgba(239,68,68,0.12)' }}>
          <span style={{ fontSize: '0.7rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            {conflicts.map((c, i) => (
              <div key={i} style={{ fontSize: '0.5rem', fontWeight: 700, color: c.severity === 'high' ? '#ef4444' : '#f59e0b' }}>{c.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIE RIJ ── */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <ActionBtn icon={Shuffle} label="Swap"    color="#FFD700" onClick={() => onSwap(dayIndex, slot, meal)} m={m} />
        <ActionBtn icon={Pencil}  label="Bewerk"  color="#6366f1" onClick={() => setShowEditModal(true)} m={m} active={showEditModal} />
        <ActionBtn icon={Scale}   label="Schaal"  color="#8b5cf6" onClick={() => setShowScaler(!showScaler)} m={m} active={showScaler} />
        <ActionBtn icon={Trash2}  label="Verwijder" color="#ef4444" onClick={() => onDelete(dayIndex, slot)} m={m} />
      </div>

      {/* ── SCALER ── */}
      {showScaler && (
        <div style={{ borderTop: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.42rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>INGREDIËNTEN AANPASSEN</span>
            {scalerMacros && (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: hasMacroChange ? '#FFD700' : 'rgba(255,255,255,0.2)' }}>{scalerMacros.calories} kcal</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#10b981' }}>{scalerMacros.protein}g E</span>
              </div>
            )}
          </div>
          {loadingScaler && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>}
          {!loadingScaler && scalerData && ingredientList.map((ing, i) => {
            if (!ing.id || !UUID_REGEX.test(ing.id)) return null
            const dbIng = scalerData[ing.id]; if (!dbIng) return null
            const currentAmount = scalerAmounts[ing.id] ?? ing.amount
            const step = getStep(dbIng); const min = dbIng.min_portion_gram || 0; const max = dbIng.max_portion_gram || 500
            const scalable = dbIng.scalable !== false; const changed = currentAmount !== ing.amount
            return (
              <div key={`${ing.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: scalable ? 1 : 0.4 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: changed ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dbIng.name}</div>
                  <div style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.15)' }}>{scalable ? `${min}–${max}g · stap ${step}g` : 'niet aanpasbaar'}</div>
                </div>
                {scalable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    <button onClick={() => adjustAmount(ing.id, -step)} disabled={currentAmount <= min} style={scalerBtnStyle(m, currentAmount <= min, '#ef4444')}>−</button>
                    <div style={{ minWidth: '44px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: changed ? '#FFD700' : 'rgba(255,255,255,0.5)' }}>
                      {currentAmount}<span style={{ fontSize: '0.38rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', marginLeft: '1px' }}>g</span>
                    </div>
                    <button onClick={() => adjustAmount(ing.id, step)} disabled={currentAmount >= max} style={scalerBtnStyle(m, currentAmount >= max, '#10b981')}>+</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>{currentAmount}g</span>
                )}
              </div>
            )
          })}
          {!loadingScaler && scalerMacros && (
            <div style={{ padding: '0.4rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[{l:'kcal',v:scalerMacros.calories,o:Math.round(meal.calories||0),c:'#FFD700'},{l:'E',v:scalerMacros.protein,o:Math.round((meal.protein||0)*10)/10,c:'#10b981'},{l:'K',v:scalerMacros.carbs,o:Math.round((meal.carbs||0)*10)/10,c:'#3b82f6'},{l:'V',v:scalerMacros.fat,o:Math.round((meal.fat||0)*10)/10,c:'#f59e0b'}].map(s => {
                  const diff = s.v - s.o; const hasDiff = Math.abs(diff) >= 1
                  return (
                    <div key={s.l} style={{ display: 'flex', alignItems: 'baseline', gap: '0.1rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.c }}>{s.v}</span>
                      <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>{s.l}</span>
                      {hasDiff && <span style={{ fontSize: '0.38rem', fontWeight: 700, color: diff > 0 ? '#10b981' : '#ef4444', marginLeft: '1px' }}>{diff > 0 ? '+' : ''}{Math.round(diff)}</span>}
                    </div>
                  )
                })}
              </div>
              <button onClick={applySmartScale} disabled={!hasMacroChange} style={{ padding: '0.3rem 0.6rem', background: hasMacroChange ? '#8b5cf6' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '4px', color: hasMacroChange ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: '0.6rem', fontWeight: 800, cursor: hasMacroChange ? 'pointer' : 'not-allowed', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px', flexShrink: 0 }}>
                Toepassen
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── INGREDIËNTEN toggle + uitklap ── */}
      {ingredientList.length > 0 && !showScaler && (
        <>
          <button onClick={() => setExpanded(p => !p)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.2rem 0.75rem',
            background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent',
            border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <span style={{ fontSize: '0.45rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>
              {ingredientList.length} ingrediënten
            </span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,215,0,0.4)', fontWeight: 700 }}>
              {expanded ? '▲' : '▼'}
            </span>
          </button>

          {expanded && (
            <div style={{ padding: '0.2rem 0.75rem 0.35rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
              {loadingNames && <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>Namen ophalen...</div>}
              <style>{`._hs::-webkit-scrollbar{display:none}`}</style>
              <div className="_hs" style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {ingredientList.map((ing, i) => (
                  <div key={i} style={{ flexShrink: 0, fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.15rem', padding: '0.1rem 0.3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                    <span>{getIngredientName(ing)}</span>
                    {ing.amount > 0 && <span style={{ fontWeight: 800, color: '#FFD700', marginLeft: '0.1rem' }}>{ing.amount}{ing.unit}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {showEditModal && createPortal(
        <MealEditModal db={db} meal={meal} slot={slot} dayIndex={dayIndex}
          onSave={(updatedMeal) => onUpdateMeal(dayIndex, slot, updatedMeal)}
          onClose={() => setShowEditModal(false)} isMobile={m} />,
        document.body
      )}
    </div>
  )
}

function MacroPill({ label, value, color, m }) {
  if (!value || value === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.08rem', padding: m ? '0.06rem 0.25rem' : '0.08rem 0.3rem', background: `${color}10`, border: `1px solid ${color}20`, borderRadius: '3px' }}>
      <span style={{ fontSize: m ? '0.58rem' : '0.62rem', fontWeight: 800, color }}>{Math.round(value)}</span>
      <span style={{ fontSize: '0.38rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)' }}>{label}</span>
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick, m, active }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
      padding: m ? '0.3rem 0' : '0.35rem 0',
      background: active ? `${color}10` : 'transparent',
      border: 'none', borderRight: '1px solid rgba(255,255,255,0.03)',
      color: active ? color : 'rgba(255,255,255,0.2)',
      fontSize: m ? '0.45rem' : '0.5rem', fontWeight: 700,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      minHeight: '28px', transition: 'all 0.15s ease'
    }}>
      <Icon size={10} />{label}
    </button>
  )
}

function scalerBtnStyle(m, disabled, color) {
  return {
    width: m ? '26px' : '28px', height: m ? '26px' : '28px', borderRadius: '4px', flexShrink: 0,
    background: disabled ? 'rgba(255,255,255,0.02)' : `${color}15`,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : color + '40'}`,
    color: disabled ? 'rgba(255,255,255,0.1)' : color,
    fontSize: '1rem', fontWeight: 700, lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
  }
}
