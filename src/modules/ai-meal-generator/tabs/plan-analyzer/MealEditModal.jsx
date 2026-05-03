// src/modules/ai-meal-generator/tabs/plan-analyzer/MealEditModal.jsx
// v1.1 — preparation_steps preserved bij opslaan + recipe editor tab

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Trash2, Save, Copy, Zap, ChefHat } from 'lucide-react'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const LABEL_GROUPS = [
  { label: 'Doel',      color: '#FFD700', options: ['bulk_friendly','cut_friendly','high_protein','low_calorie','high_calorie','calorie_dense','lean','muscle_gain'] },
  { label: 'Macro',     color: '#10b981', options: ['high_carb','low_carb','high_fat','low_fat','high_fiber','keto_friendly','whole_grain','simple_carbs'] },
  { label: 'Dieet',     color: '#6366f1', options: ['vegetarian','vegan','plant_based','gluten_free','whole_food','clean'] },
  { label: 'Timing',    color: '#f97316', options: ['breakfast','lunch','dinner','snack','pre_workout','post_workout','before_bed'] },
  { label: 'Praktisch', color: '#3b82f6', options: ['quick','meal_prep','no_cook','budget','freezable','on_the_go','one_pot','simple'] },
  { label: 'Smaak',     color: '#a855f7', options: ['comfort_food','sweet','savory','spicy','creamy','fresh','warm','indulgent'] },
]

export default function MealEditModal({ db, meal, slot, dayIndex, onSave, onClose, isMobile }) {
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
        return { ingredient_id: item.ingredient_id, name: d.name, amount, unit: item.unit || 'gram', cal: d.calories_per_100g, prot: d.protein_per_100g, carbs: d.carbs_per_100g, fat: d.fat_per_100g, min: d.min_portion_gram || 0, max: d.max_portion_gram || 500, scalable: d.scalable !== false }
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
    ings.forEach(i => { const f = i.amount / 100; cal += (i.cal||0)*f; prot += (i.prot||0)*f; carbs += (i.carbs||0)*f; fat += (i.fat||0)*f })
    return { calories: Math.round(cal), protein: Math.round(prot*10)/10, carbs: Math.round(carbs*10)/10, fat: Math.round(fat*10)/10 }
  }

  const liveMacros = calcMacros(ingredients)
  const origMacros = { calories: Math.round(meal?.calories||0), protein: Math.round((meal?.protein||0)*10)/10, carbs: Math.round((meal?.carbs||0)*10)/10, fat: Math.round((meal?.fat||0)*10)/10 }

  const updateAmount = (idx, newVal) => {
    const ing = ingredients[idx]
    setIngredients(prev => prev.map((i, n) => n === idx ? { ...i, amount: Math.min(ing.max, Math.max(ing.min, parseFloat(newVal)||0)) } : i))
  }
  const removeIngredient = (idx) => setIngredients(prev => prev.filter((_, n) => n !== idx))

  const handleSearch = (val) => {
    setSearchQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!val.trim() || !db?.supabase) { setSearchResults([]); return }
      setSearching(true)
      const { data } = await db.supabase.from('ai_ingredients').select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, min_portion_gram, max_portion_gram, default_portion_gram, scalable').ilike('name', `%${val}%`).limit(20)
      setSearchResults(data || []); setSearching(false)
    }, 300)
  }

  const addIngredient = (row) => {
    if (ingredients.some(i => i.ingredient_id === row.id)) return
    setIngredients(prev => [...prev, { ingredient_id: row.id, name: row.name, amount: row.default_portion_gram||100, unit: 'gram', cal: row.calories_per_100g, prot: row.protein_per_100g, carbs: row.carbs_per_100g, fat: row.fat_per_100g, min: row.min_portion_gram||0, max: row.max_portion_gram||500, scalable: row.scalable!==false }])
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
      ingredients_list: ingredients.map(i => ({ ingredient_id: i.ingredient_id, amount: i.amount, unit: i.unit||'gram' })),
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '12px', width: '100%', maxWidth: '620px', maxHeight: m ? '95vh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', ...(m?{}:{margin:'auto',alignSelf:'center'}) }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input value={mealName} onChange={e => setMealName(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m ? '0.9rem' : '1rem', fontWeight: 800, width: '100%', fontFamily: 'inherit', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '0.1rem' }} />
            <div style={{ fontSize: m?'0.45rem':'0.5rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.15rem' }}>Zichtbaar voor de client</div>
            <div style={{ marginTop: '0.4rem' }}>
              <div style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>🔒 COACH NAAM</div>
              <input value={internalName} onChange={e => setInternalName(e.target.value)} placeholder="bijv. LC - Haver Ei Banaan" style={{ width: '100%', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '4px', color: '#FFD700', fontSize: m?'0.6rem':'0.65rem', fontWeight: 600, padding: '0.25rem 0.4rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={16} /></button>
        </div>

        {/* Macro bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {[{label:'KCAL',val:liveMacros.calories,orig:origMacros.calories,color:'#FFD700'},{label:'EIWIT',val:liveMacros.protein,orig:origMacros.protein,color:'#10b981'},{label:'KOOLH',val:liveMacros.carbs,orig:origMacros.carbs,color:'#3b82f6'},{label:'VET',val:liveMacros.fat,orig:origMacros.fat,color:'#f59e0b'}].map((s,i) => {
            const diff = s.val - s.orig; const hasDiff = Math.abs(diff) >= 1
            return (
              <div key={i} style={{ flex: 1, padding: m?'0.4rem 0.5rem':'0.5rem 0.75rem', textAlign: 'center', borderRight: i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <div style={{ fontSize: m?'0.9rem':'1rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.38rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.1rem' }}>{s.label}</div>
                {hasDiff && <div style={{ fontSize: '0.38rem', fontWeight: 700, color: diff>0?'#10b981':'#ef4444', marginTop: '0.05rem' }}>{diff>0?'+':''}{Math.round(diff)}</div>}
              </div>
            )
          })}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {[{id:'ingredients',label:'Ingrediënten'},{id:'recipe',label:'👨‍🍳 Recept'}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: m?'0.4rem 0':'0.5rem 0', background: 'transparent', border: 'none', borderBottom: activeTab===tab.id?'2px solid #FFD700':'2px solid transparent', color: activeTab===tab.id?'#FFD700':'rgba(255,255,255,0.3)', fontSize: m?'0.55rem':'0.6rem', fontWeight: activeTab===tab.id?700:500, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* INGREDIËNTEN */}
          {activeTab === 'ingredients' && (
            loadingInit ? (
              <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m?'0.4rem 0.75rem':'0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>INGREDIËNTEN ({ingredients.length})</span>
                  <button onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 100) }} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem', background: showSearch?'rgba(255,215,0,0.08)':'rgba(255,255,255,0.03)', border: `1px solid ${showSearch?'rgba(255,215,0,0.25)':'rgba(255,255,255,0.08)'}`, borderRadius: '4px', color: showSearch?'#FFD700':'rgba(255,255,255,0.3)', fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Plus size={10} /> Toevoegen
                  </button>
                </div>

                {showSearch && (
                  <div style={{ padding: m?'0.4rem 0.75rem':'0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,215,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px' }}>
                      <Search size={12} color="rgba(255,215,0,0.4)" />
                      <input ref={searchRef} type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Zoek ingrediënt..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m?'0.75rem':'0.8rem', fontFamily: 'inherit' }} />
                      {searching && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD700', animation: 'spin 0.8s linear infinite' }} />}
                    </div>
                    {searchResults.length > 0 && (
                      <div
                        onWheel={e => e.stopPropagation()}
                        style={{ marginTop: '0.35rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', WebkitOverflowScrolling: 'touch' }}>
                        {searchResults.map(row => {
                          const added = ingredients.some(i => i.ingredient_id === row.id)
                          return (
                            <button key={row.id} onClick={() => !added && addIngredient(row)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m?'0.35rem 0.6rem':'0.4rem 0.75rem', background: added?'rgba(16,185,129,0.05)':'rgba(255,255,255,0.02)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: added?'default':'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                              <span style={{ fontSize: m?'0.65rem':'0.7rem', fontWeight: 600, color: added?'#10b981':'#fff' }}>{row.name}</span>
                              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#FFD700' }}>{row.calories_per_100g}/100g</span>
                                <span style={{ fontSize: '0.5rem', color: '#10b981' }}>{row.protein_per_100g}E</span>
                                {added ? <span style={{ fontSize: '0.45rem', color: '#10b981' }}>✓</span> : <Plus size={10} color="rgba(255,215,0,0.5)" />}
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
                  <div key={`${ing.ingredient_id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m?'0.4rem 0.75rem':'0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', background: idx%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: m?'0.65rem':'0.7rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ing.name}</div>
                      <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.05rem' }}>{Math.round(ing.cal)}/100g · {Math.round(ing.prot)}E · {Math.round(ing.carbs)}K · {Math.round(ing.fat)}V</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <input type="number" value={ing.amount} min={ing.min} max={ing.max} onChange={e => updateAmount(idx, e.target.value)} style={{ width: m?'52px':'60px', textAlign: 'right', padding: '0.2rem 0.3rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '4px', color: '#FFD700', fontSize: m?'0.7rem':'0.75rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', minWidth: '16px' }}>g</span>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', minWidth: m?'40px':'48px' }}>
                      <div style={{ fontSize: m?'0.6rem':'0.65rem', fontWeight: 800, color: '#FFD700' }}>{Math.round(ing.cal*ing.amount/100)}</div>
                      <div style={{ fontSize: '0.38rem', color: '#10b981' }}>{Math.round(ing.prot*ing.amount/100*10)/10}E</div>
                    </div>
                    <button onClick={() => removeIngredient(idx)} style={{ width: '28px', height: '28px', flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Trash2 size={11} /></button>
                  </div>
                ))}
              </>
            )
          )}

          {/* RECEPT */}
          {activeTab === 'recipe' && (
            <div style={{ padding: m?'0.5rem 0.75rem':'0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BEREIDINGSSTAPPEN ({prepSteps.filter(s=>s.trim()).length})
                </span>
                <button onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.25rem 0.5rem', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '4px', color: '#FFD700', fontSize: '0.5rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <Plus size={10} /> Stap toevoegen
                </button>
              </div>

              {prepSteps.length === 0 && (
                <div style={{ padding: '1rem 0', textAlign: 'center', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Nog geen stappen — klik op "+ Stap toevoegen"</div>
              )}

              {prepSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.4rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#FFD700', marginTop: '0.15rem' }}>
                    {idx + 1}
                  </div>
                  <textarea value={step} onChange={e => updateStep(idx, e.target.value)} placeholder={`Stap ${idx+1}...`} rows={2} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m?'0.72rem':'0.78rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.4, minHeight: '36px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flexShrink: 0 }}>
                    <button onClick={() => moveStep(idx,-1)} disabled={idx===0} style={stepBtn(idx===0)}>↑</button>
                    <button onClick={() => moveStep(idx,1)} disabled={idx===prepSteps.length-1} style={stepBtn(idx===prepSteps.length-1)}>↓</button>
                    <button onClick={() => removeStep(idx)} style={{...stepBtn(false),color:'#ef4444',borderColor:'rgba(239,68,68,0.2)'}}>✕</button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>TIP / OPMERKING</div>
                <textarea value={tips} onChange={e => setTips(e.target.value)} placeholder="Bereidingstip, variatie of opmerking..." rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', fontSize: m?'0.72rem':'0.78rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
              </div>
            </div>
          )}
        </div>

        {/* Labels */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
          <button onClick={() => setShowLabels(!showLabels)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m?'0.4rem 0.75rem':'0.5rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LABELS</span>
              {selectedLabels.length > 0 && (
                <div style={{ display: 'flex', gap: '0.15rem', flexWrap: 'wrap' }}>
                  {selectedLabels.slice(0,4).map(l => <span key={l} style={{ fontSize: '0.38rem', fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.08)', padding: '0.05rem 0.3rem', borderRadius: '2px' }}>{l.replace(/_/g,' ')}</span>)}
                  {selectedLabels.length > 4 && <span style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.2)' }}>+{selectedLabels.length-4}</span>}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>{showLabels?'▲':'▼'}</span>
          </button>
          {showLabels && (
            <div style={{ padding: m?'0 0.75rem 0.5rem':'0 1rem 0.625rem' }}>
              {LABEL_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.38rem', fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem', opacity: 0.7 }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    {group.options.map(opt => {
                      const active = selectedLabels.includes(opt)
                      return <button key={opt} onClick={() => setSelectedLabels(prev => prev.includes(opt)?prev.filter(l=>l!==opt):[...prev,opt])} style={{ padding: '0.15rem 0.4rem', background: active?`${group.color}18`:'rgba(255,255,255,0.03)', border: `1px solid ${active?group.color+'50':'rgba(255,255,255,0.06)'}`, borderRadius: '3px', color: active?group.color:'rgba(255,255,255,0.25)', fontSize: m?'0.5rem':'0.55rem', fontWeight: active?700:500, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>{opt.replace(/_/g,' ')}</button>
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, padding: m?'0.625rem 0.75rem':'0.75rem 1rem', background: 'rgba(0,0,0,0.3)' }}>
          {saveError && <div style={{ fontSize: '0.5rem', color: '#ef4444', marginBottom: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '4px' }}>{saveError}</div>}
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>OPSLAAN ALS</div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={() => handleSave('plan')} disabled={saving} style={saveBtn(m,'rgba(255,255,255,0.06)','rgba(255,255,255,0.08)','#fff',saving)}><Zap size={12}/><div><div style={{fontSize:m?'0.55rem':'0.6rem',fontWeight:800}}>Alleen plan</div><div style={{fontSize:'0.38rem',opacity:0.5}}>Niet in database</div></div></button>
            <button onClick={() => handleSave('permanent')} disabled={saving||!meal.id} style={saveBtn(m,'rgba(255,215,0,0.08)','rgba(255,215,0,0.2)','#FFD700',saving||!meal.id)}><Save size={12}/><div><div style={{fontSize:m?'0.55rem':'0.6rem',fontWeight:800}}>Overschrijven</div><div style={{fontSize:'0.38rem',opacity:0.5}}>Permanent in DB</div></div></button>
            <button onClick={() => handleSave('copy')} disabled={saving} style={saveBtn(m,'rgba(16,185,129,0.08)','rgba(16,185,129,0.2)','#10b981',saving)}><Copy size={12}/><div><div style={{fontSize:m?'0.55rem':'0.6rem',fontWeight:800}}>Kopie opslaan</div><div style={{fontSize:'0.38rem',opacity:0.5}}>Nieuwe meal in DB</div></div></button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}

function stepBtn(disabled) {
  return { width: '20px', height: '20px', padding: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', color: disabled?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.4)', cursor: disabled?'not-allowed':'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
}

function saveBtn(m, bg, border, color, disabled) {
  return { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', flexDirection: 'column', padding: m?'0.5rem 0.25rem':'0.625rem 0.5rem', background: disabled?'rgba(255,255,255,0.02)':bg, border: `1px solid ${disabled?'rgba(255,255,255,0.05)':border}`, borderRadius: '6px', color: disabled?'rgba(255,255,255,0.15)':color, cursor: disabled?'not-allowed':'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: m?'52px':'56px', fontFamily: 'inherit', transition: 'all 0.15s ease' }
}
