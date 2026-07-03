// src/modules/ai-meal-generator/tabs/plan-analyzer/MealEditModal.jsx
// v1.1 — preparation_steps preserved bij opslaan + recipe editor tab

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Save, Copy, Zap, ChefHat } from 'lucide-react'
import { resolveFoodImage } from '../../../meal-plan/foodImageFallback'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const LABEL_GROUPS = [
  { label: 'Doel',      color: '#FFD700', options: ['bulk_friendly','cut_friendly','high_protein','low_calorie','high_calorie','calorie_dense','lean','muscle_gain'] },
  { label: 'Macro',     color: '#10b981', options: ['high_carb','low_carb','high_fat','low_fat','high_fiber','keto_friendly','whole_grain','simple_carbs'] },
  { label: 'Dieet',     color: '#6366f1', options: ['vegetarian','vegan','plant_based','gluten_free','whole_food','clean'] },
  { label: 'Timing',    color: '#f97316', options: ['breakfast','lunch','dinner','snack','pre_workout','post_workout','before_bed'] },
  { label: 'Praktisch', color: '#3b82f6', options: ['quick','meal_prep','no_cook','budget','freezable','on_the_go','one_pot','simple'] },
  { label: 'Smaak',     color: '#a855f7', options: ['comfort_food','sweet','savory','spicy','creamy','fresh','warm','indulgent'] },
]

export default function MealEditModal({ db, meal, slot, dayIndex, onSave, onClose, isMobile, embedded = false }) {
  const m = isMobile
  const [activeTab, setActiveTab] = useState('ingredients')
  const [mealName, setMealName]         = useState(meal?.name || meal?.meal_name || '')
  const [internalName, setInternalName] = useState(meal?.internal_name || '')
  const [selectedLabels, setSelectedLabels] = useState(meal?.labels || [])
  const [ingredients, setIngredients]   = useState([])
  const [dbCache, setDbCache]           = useState({})
  const [loadingInit, setLoadingInit]   = useState(true)
  const [prepSteps, setPrepSteps] = useState(Array.isArray(meal?.preparation_steps) ? meal.preparation_steps : [])
  const [tips, setTips] = useState(meal?.tips || '')
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]         = useState(false)
  const [showSearch, setShowSearch]       = useState(false)
  const [searchFullBase, setSearchFullBase] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)
  const [showLabels, setShowLabels] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState(null)

  useEffect(() => {
    const init = async () => {
      setLoadingInit(true)
      const raw  = meal?.ingredients_list || meal?.ingredients || []
      const list = Array.isArray(raw) ? raw : []
      const uuids = list.filter(i => i?.ingredient_id && UUID_REGEX.test(i.ingredient_id)).map(i => i.ingredient_id)
      let dbRows = {}
      if (uuids.length > 0 && db?.supabase) {
        const { data } = await db.supabase.from('ai_ingredients')
          .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, min_portion_gram, max_portion_gram, default_portion_gram, scalable, unit_type')
          .in('id', uuids)
        if (data) data.forEach(r => { dbRows[r.id] = r })
      }
      setDbCache(dbRows)
      const built = list.map(item => {
        if (!item?.ingredient_id || !UUID_REGEX.test(item.ingredient_id)) return null
        const d = dbRows[item.ingredient_id]; if (!d) return null
        const amount = item.amount || d.default_portion_gram || 100
        return { ingredient_id: item.ingredient_id, name: d.name, amount, unit: item.unit || 'gram', cal: d.calories_per_100g, prot: d.protein_per_100g, carbs: d.carbs_per_100g, fat: d.fat_per_100g, min: d.min_portion_gram || 0, max: Infinity, scalable: d.scalable !== false }
      }).filter(Boolean)
      setIngredients(built)

      // ✅ Als preparation_steps leeg zijn in snapshot, haal op uit DB
      const mealId = meal?.meal_id || meal?.id
      if (built.length >= 0 && mealId) {
        const { data: mealRow } = await db.supabase
          .from('ai_meals')
          .select('preparation_steps, tips')
          .eq('id', mealId)
          .single()
        if (mealRow?.preparation_steps?.length && !prepSteps.length) {
          setPrepSteps(mealRow.preparation_steps)
        }
        if (mealRow?.tips && !tips) {
          setTips(mealRow.tips)
        }
      }

      setLoadingInit(false)
    }
    init()
  }, [])

  const calcMacros = (ings) => {
    let cal = 0, prot = 0, carbs = 0, fat = 0
    ings.forEach(i => { const f = (parseFloat(i.amount) || 0) / 100; cal += (i.cal||0)*f; prot += (i.prot||0)*f; carbs += (i.carbs||0)*f; fat += (i.fat||0)*f })
    return { calories: Math.round(cal), protein: Math.round(prot*10)/10, carbs: Math.round(carbs*10)/10, fat: Math.round(fat*10)/10 }
  }

  const liveMacros = calcMacros(ingredients)
  const origMacros = { calories: Math.round(meal?.calories||0), protein: Math.round((meal?.protein||0)*10)/10, carbs: Math.round((meal?.carbs||0)*10)/10, fat: Math.round((meal?.fat||0)*10)/10 }

  // Tijdens typen: rauwe string accepteren (incl. leeg) zodat de
  // gebruiker cijfers kan wissen zonder dat het systeem direct 0 of het
  // minimum invult. Clampen pas op blur — anders kun je geen nieuw
  // getal typen omdat elke keystroke een geldige waarde forceert.
  const updateAmount = (idx, newVal) => {
    setIngredients(prev => prev.map((i, n) => n === idx ? { ...i, amount: newVal } : i))
  }
  const commitAmount = (idx) => {
    setIngredients(prev => prev.map((i, n) => {
      if (n !== idx) return i
      const raw = parseFloat(i.amount)
      const safe = Number.isFinite(raw) ? Math.min(i.max, Math.max(i.min, raw)) : (i.min || 0)
      return { ...i, amount: safe }
    }))
  }
  // Stapgrootte schaalt mee met de portie: <50g→5, ≥50→10, ≥100→25, ≥200→50, ≥500→100
  const stepFor = (v) => v >= 500 ? 100 : v >= 200 ? 50 : v >= 100 ? 25 : v >= 50 ? 10 : 5
  const stepAmount = (idx, dir) => {
    setIngredients(prev => prev.map((i, n) => {
      if (n !== idx) return i
      const cur = parseFloat(i.amount) || 0
      const next = Math.min(i.max, Math.max(i.min, cur + dir * stepFor(cur)))
      return { ...i, amount: next }
    }))
  }
  const removeIngredient = (idx) => setIngredients(prev => prev.filter((_, n) => n !== idx))

  // Standaard: alleen de canonieke, coach-samengestelde set (source='coach').
  // Met fullBase=true wordt die filter losgelaten en doorzoekt hij óók de
  // ~37k openfoodfacts-rijen — bedoeld voor wanneer er geen canoniek
  // ingrediënt te vinden is. Canonieke hits komen bovenaan.
  const runSearch = async (val, fullBase) => {
    if (!val.trim() || !db?.supabase) { setSearchResults([]); return }
    setSearching(true)
    let query = db.supabase
      .from('ai_ingredients')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, min_portion_gram, max_portion_gram, default_portion_gram, scalable, source')
      .ilike('name', `%${val}%`)
    if (!fullBase) query = query.eq('source', 'coach')
    const { data } = await query.order('source', { ascending: true }).limit(fullBase ? 40 : 20)
    setSearchResults(data || []); setSearching(false)
  }

  const handleSearch = (val) => {
    setSearchQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val, searchFullBase), 300)
  }

  const toggleFullBase = () => {
    const next = !searchFullBase
    setSearchFullBase(next)
    if (searchQuery.trim()) runSearch(searchQuery, next)
  }

  const addIngredient = (row) => {
    if (ingredients.some(i => i.ingredient_id === row.id)) return
    setIngredients(prev => [...prev, { ingredient_id: row.id, name: row.name, amount: row.default_portion_gram||100, unit: 'gram', cal: row.calories_per_100g, prot: row.protein_per_100g, carbs: row.carbs_per_100g, fat: row.fat_per_100g, min: row.min_portion_gram||0, max: Infinity, scalable: row.scalable!==false }])
    setDbCache(prev => ({ ...prev, [row.id]: row }))
    setSearchQuery(''); setSearchResults([]); setShowSearch(false)
  }

  const addStep    = () => setPrepSteps(prev => [...prev, ''])
  const updateStep = (idx, val) => setPrepSteps(prev => prev.map((s, i) => i === idx ? val : s))
  const removeStep = (idx) => setPrepSteps(prev => prev.filter((_, i) => i !== idx))
  const moveStep   = (idx, dir) => {
    const next = [...prepSteps]; const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]; setPrepSteps(next)
  }

  const buildUpdatedMeal = () => {
    const macros = calcMacros(ingredients)
    return {
      ...meal, name: mealName, meal_name: mealName, ...macros,
      ingredients_list: ingredients.map(i => ({ ingredient_id: i.ingredient_id, amount: parseFloat(i.amount) || 0, unit: i.unit||'gram' })),
      preparation_steps: prepSteps.filter(s => s.trim().length > 0),
      tips: tips || meal?.tips || null,
      original_calories: meal.original_calories || meal.calories,
      original_protein:  meal.original_protein  || meal.protein,
      original_carbs:    meal.original_carbs     || meal.carbs,
      original_fat:      meal.original_fat       || meal.fat,
    }
  }

  const handleSave = async (mode) => {
    setSaving(true); setSaveError(null)
    try {
      const updated = buildUpdatedMeal()
      if (mode === 'permanent' && meal.id) {
        const { error } = await db.supabase.from('ai_meals').update({
          name: mealName, internal_name: internalName||null, labels: selectedLabels,
          calories: updated.calories, protein: updated.protein, carbs: updated.carbs, fat: updated.fat,
          ingredients_list: updated.ingredients_list, preparation_steps: updated.preparation_steps, tips: updated.tips,
        }).eq('id', meal.id)
        if (error) throw error
      }
      if (mode === 'copy') {
        const { data, error } = await db.supabase.from('ai_meals').insert([{
          name: mealName+' (aangepast)', internal_name: internalName||null, labels: selectedLabels,
          calories: updated.calories, protein: updated.protein, carbs: updated.carbs, fat: updated.fat,
          ingredients_list: updated.ingredients_list, preparation_steps: updated.preparation_steps, tips: updated.tips,
          timing: Array.isArray(meal.timing)?meal.timing:[], difficulty: meal.difficulty||'etm', cost_tier: meal.cost_tier||'budget', image_url: meal.image_url||null,
        }]).select().single()
        if (error) throw error
        updated.id = data.id; updated.meal_id = data.id
      }
      onSave(updated, mode); onClose()
    } catch (err) { console.error(err); setSaveError(err.message) }
    setSaving(false)
  }

  const modal = (
    <div onClick={embedded ? undefined : onClose} style={embedded
      ? {}
      : { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={embedded
        ? { background: '#0a0a0a', width: '100%', maxHeight: m ? '68vh' : '58vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '1px solid rgba(255,215,0,0.18)' }
        : { background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '12px', width: '100%', maxWidth: '620px', maxHeight: m ? '95vh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', ...(m?{}:{margin:'auto',alignSelf:'center'}) }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m ? '0.45rem 0.7rem' : '0.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={mealName} onChange={e => setMealName(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 800, width: '100%', fontFamily: 'inherit', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '0.1rem' }} />
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={16} /></button>
        </div>

        {/* Body: ingrediënten links, macro-totalen rechts */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LINKS — ingrediënten (scrollt) */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* INGREDIËNTEN */}
          {(
            loadingInit ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m?'0.4rem 0.75rem':'0.45rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: m?'0.65rem':'0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ingrediënten ({ingredients.length})</span>
                  <button onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 100) }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.7rem', background: showSearch?'rgba(255,215,0,0.12)':'rgba(255,255,255,0.04)', border: `1px solid ${showSearch?'rgba(255,215,0,0.3)':'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: showSearch?'#FFD700':'rgba(255,255,255,0.7)', fontSize: m?'0.7rem':'0.75rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Plus size={13} /> Toevoegen
                  </button>
                </div>

                {showSearch && (
                  <div style={{ padding: m?'0.4rem 0.75rem':'0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,215,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px' }}>
                      <Search size={12} color="rgba(255,215,0,0.4)" />
                      <input ref={searchRef} type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Zoek ingrediënt..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m?'0.75rem':'0.8rem', fontFamily: 'inherit' }} />
                      {searching && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD700', animation: 'spin 0.8s linear infinite' }} />}
                    </div>
                    {/* Toggle: canonieke set vs. hele database (voor wanneer er geen canoniek ingrediënt te vinden is) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <button onClick={toggleFullBase} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.55rem', background: searchFullBase?'rgba(168,85,247,0.12)':'rgba(255,255,255,0.04)', border: `1px solid ${searchFullBase?'rgba(168,85,247,0.4)':'rgba(255,255,255,0.1)'}`, borderRadius: '5px', color: searchFullBase?'#c084fc':'rgba(255,255,255,0.45)', fontSize: m?'0.55rem':'0.6rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: searchFullBase?'#c084fc':'rgba(255,255,255,0.2)' }} />
                        {searchFullBase ? 'Hele database' : 'Alleen canoniek'}
                      </button>
                      <span style={{ fontSize: m?'0.5rem':'0.52rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                        {searchFullBase ? 'óók openfoodfacts — controleer macro’s' : 'gecureerde coach-set'}
                      </span>
                    </div>
                    {searchResults.length > 0 && (
                      <div
                        onWheel={e => e.stopPropagation()}
                        style={{ marginTop: '0.35rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', WebkitOverflowScrolling: 'touch' }}>
                        {searchResults.map(row => {
                          const added = ingredients.some(i => i.ingredient_id === row.id)
                          return (
                            <button key={row.id} onClick={() => !added && addIngredient(row)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m?'0.5rem 0.75rem':'0.6rem 0.85rem', background: added?'rgba(16,185,129,0.08)':'rgba(255,255,255,0.025)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: added?'default':'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', gap: '0.5rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                                <span style={{ fontSize: m?'0.8rem':'0.85rem', fontWeight: 700, color: added?'#10b981':'#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span>
                                {row.source && row.source !== 'coach' && (
                                  <span style={{ flexShrink: 0, fontSize: '0.45rem', fontWeight: 800, color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', padding: '0.05rem 0.25rem', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>extern</span>
                                )}
                              </span>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: m?'0.65rem':'0.7rem', fontWeight: 800, color: '#FFD700' }}>{row.calories_per_100g}<span style={{ fontSize: '0.7em', opacity: 0.6 }}>/100g</span></span>
                                <span style={{ fontSize: m?'0.65rem':'0.7rem', color: '#10b981', fontWeight: 700 }}>{row.protein_per_100g}E</span>
                                {added ? <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 900 }}>✓</span> : <Plus size={14} color="rgba(255,215,0,0.6)" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {ingredients.length === 0 && <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Geen ingrediënten — voeg er een toe</div>}

                {ingredients.map((ing, idx) => (
                  <div key={`${ing.ingredient_id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: m?'0.4rem 0.75rem':'0.45rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx%2===0?'transparent':'rgba(255,255,255,0.015)' }}>
                    <div style={{ width: m?30:34, height: m?30:34, flexShrink: 0, borderRadius: 6, background: `url(${resolveFoodImage(ing, { size: 80 })}) center/cover`, border: '1px solid rgba(255,255,255,0.08)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: m?'0.78rem':'0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{ing.name}</div>
                      <div style={{ fontSize: m?'0.58rem':'0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 1, fontWeight: 600 }}>{Math.round(ing.cal)}/100g · {Math.round(ing.prot)}E · {Math.round(ing.carbs)}K · {Math.round(ing.fat)}V</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexShrink: 0 }}>
                      <button onClick={() => stepAmount(idx, -1)} style={stepAmtBtn(m)}>−</button>
                      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                        <input type="number" value={ing.amount} min={ing.min} max={ing.max} onChange={e => updateAmount(idx, e.target.value)} onBlur={() => commitAmount(idx)} onFocus={e => e.target.select()} style={{ width: m?'40px':'46px', textAlign: 'right', padding: 0, background: 'transparent', border: 'none', color: '#fff', fontSize: m?'0.95rem':'1.05rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none' }} />
                        <span style={{ fontSize: m?'0.72rem':'0.78rem', color: '#fff', fontWeight: 800, marginLeft: 1 }}>g</span>
                      </span>
                      <button onClick={() => stepAmount(idx, 1)} style={stepAmtBtn(m)}>+</button>
                    </div>
                    <button onClick={() => removeIngredient(idx)} style={{ width: 30, height: 30, flexShrink: 0, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </>
            )
          )}

          </div>

          {/* RECHTS — macro-totalen, live update via liveMacros */}
          <div style={{ width: m?78:96, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'kcal',  val: liveMacros.calories, orig: origMacros.calories, unit: ''  },
              { label: 'Eiwit', val: liveMacros.protein,  orig: origMacros.protein,  unit: 'g' },
              { label: 'Koolh', val: liveMacros.carbs,    orig: origMacros.carbs,    unit: 'g' },
              { label: 'Vet',   val: liveMacros.fat,      orig: origMacros.fat,      unit: 'g' },
            ].map((s, i) => {
              const diff = s.val - s.orig
              const hasDiff = Math.abs(diff) >= 1
              return (
                <div key={i} style={{ flex: 1, padding: m?'0.35rem 0.5rem':'0.45rem 0.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: i<3?'1px solid rgba(255,255,255,0.05)':'none' }}>
                  <span style={{ fontSize: m?'0.5rem':'0.55rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                  <span style={{ fontSize: m?'1rem':'1.15rem', fontWeight: 900, color: '#FFD700', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                    {Math.round(s.val)}<span style={{ fontSize: '0.55em', opacity: 0.6 }}>{s.unit}</span>
                    {hasDiff && <span style={{ fontSize: '0.5em', fontWeight: 800, marginLeft: 3, color: diff>0?'#10b981':'#ef4444' }}>{diff>0?'+':''}{Math.round(diff)}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
          {saveError && <div style={{ fontSize: '0.55rem', color: '#ef4444', margin: m?'0.4rem 0.6rem 0':'0.4rem 0.85rem 0', padding: '0.3rem 0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '4px' }}>{saveError}</div>}
          <div style={{ display: 'flex' }}>
            <button onClick={() => handleSave('plan')} disabled={saving} style={saveBtn(m,'#fff',saving,false)} title="Alleen in dit plan — niet in database"><Zap size={13}/><span>Plan</span></button>
            <button onClick={() => handleSave('permanent')} disabled={saving||!meal.id} style={saveBtn(m,'#FFD700',saving||!meal.id,true)} title="Overschrijf permanent in database"><Save size={13}/><span>Overschrijf</span></button>
            <button onClick={() => handleSave('copy')} disabled={saving} style={saveBtn(m,'#10b981',saving,true)} title="Sla op als nieuwe meal in database"><Copy size={13}/><span>Kopie</span></button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return modal
  return createPortal(modal, document.body)
}

function stepAmtBtn(m) {
  const s = m ? 24 : 26
  return { width: s, height: s, flexShrink: 0, padding: 0, background: 'transparent', border: 'none', color: 'rgba(255,215,0,0.7)', fontSize: m?'1.3rem':'1.4rem', fontWeight: 700, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }
}

function stepBtn(disabled) {
  return { width: '20px', height: '20px', padding: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', color: disabled?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.4)', cursor: disabled?'not-allowed':'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
}

function saveBtn(m, color, disabled, divider) {
  return { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: m?'0.55rem 0.3rem':'0.65rem 0.4rem', background: 'transparent', border: 'none', borderLeft: divider ? '1px solid rgba(255,255,255,0.06)' : 'none', color: disabled?'rgba(255,255,255,0.18)':color, fontSize: m?'0.66rem':'0.72rem', fontWeight: 800, cursor: disabled?'not-allowed':'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit', letterSpacing: '-0.01em' }
}
