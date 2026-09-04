// src/modules/ai-meal-generator/tabs/plan-analyzer/SwapModal.jsx
// v3.0 — Label filters + fuzzy search via pg_trgm

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Search, ChevronRight, Zap, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

const DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

// Filter-set draait om DICHTHEDEN, niet labels of absolute getallen.
// Twee assen: eiwit-per-calorie en calorie-per-gram. Robuust tegen
// portie-opschaling.
//
// Allergie-filters (lactose_free, gluten_free) gaan client-side via
// meal.allergens — geen backend labels.
const FILTER_GROUPS = [
  {
    label: 'Dieet & Allergie',
    options: ['lactose_free', 'gluten_free', 'vegetarian', 'vegan'],
  },
]

const ALLERGEN_LABELS = new Set(['lactose_free', 'gluten_free'])
// De data tagt allergenen inconsistent (dairy / melk / lactose / soms niets).
// Daarom matchen we op ALLE synoniemen én een naam-check als vangnet.
const ALLERGEN_RULES = {
  lactose_free: {
    tags: ['dairy', 'melk', 'lactose', 'milk', 'zuivel'],
    names: ['yoghurt', 'yogurt', 'kwark', 'kaas', 'melk', 'feta', 'room', 'skyr', 'kefir', 'mozzarella', 'cheese', 'hutten', 'cottage', 'latte', 'cappucc', 'karnemelk', 'brie', 'parmezaan'],
  },
  gluten_free: {
    tags: ['gluten', 'tarwe', 'wheat', 'gerst', 'rogge'],
    names: ['brood', 'boterham', 'pasta', 'spaghetti', 'macaroni', 'penne', 'couscous', 'wrap', 'tortilla', 'cracker', 'muesli', 'granola', 'cruesli', 'tarwe', 'bagel', 'pistolet', 'ontbijtkoek', 'bulgur', 'paneermeel', 'beslag'],
  },
}

// Total gewicht (g) van een meal — sommeer ingredients_list amounts
// (gram + ml behandelen we 1:1). Piece-units skippen we.
const getTotalGrams = (meal) => {
  const list = meal?.ingredients_list || []
  return list.reduce((sum, i) => {
    const u = (i.unit || '').toLowerCase()
    if (u === 'gram' || u === 'g' || u === 'ml') return sum + (parseFloat(i.amount) || 0)
    return sum
  }, 0)
}

// Density-filters (Doel-groep). Test → true = meal voldoet aan filter.
// Bij ontbrekende data (kcal of gewicht 0) → false (filter excludeert).
const DENSITY_FILTERS = [
  {
    id: 'protein_dense',
    label: 'Eiwit-dicht',
    test: (m) => {
      const k = parseFloat(m.calories) || 0
      const p = parseFloat(m.protein) || 0
      if (k <= 0) return false
      return (p * 4) / k >= 0.30  // ≥30% kcal uit eiwit
    },
  },
  {
    id: 'high_fiber',
    label: 'High fiber',
    test: (m) => {
      const k = parseFloat(m.calories) || 0
      const f = parseFloat(m.fiber) || 0
      if (k <= 0) return false
      return (f / k) * 100 >= 2.0  // ≥2g vezel per 100 kcal
    },
  },
  {
    id: 'high_volume',
    label: 'Hoog volume',
    test: (m) => {
      const k = parseFloat(m.calories) || 0
      const g = getTotalGrams(m)
      if (k <= 0 || g <= 0) return false
      return (k / g) <= 0.8  // ≤0.8 kcal/g = veel volume voor weinig kcal
    },
  },
  {
    id: 'cal_dense',
    label: 'Caloriedicht',
    test: (m) => {
      const k = parseFloat(m.calories) || 0
      const g = getTotalGrams(m)
      if (k <= 0 || g <= 0) return false
      return (k / g) >= 2.0  // ≥2 kcal/g
    },
  },
]

// Maaltijd-type chips → mappen op meal.timing array
const MEAL_TYPES = [
  { id: 'breakfast',   label: 'Ontbijt' },
  { id: 'lunch',       label: 'Lunch' },
  { id: 'dinner',      label: 'Diner' },
  { id: 'snack',       label: 'Snack' },
  { id: 'pre_workout', label: 'Pre workout' },
  { id: 'before_bed',  label: 'Avondsnack' },
  { id: 'fruit',       label: 'Fruit' },
]

// Slot → nette titel-label voor de header ("Snack 1 toevoegen", "Ontbijt vervangen")
const SLOT_LABELS = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner',
  snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3', snack4: 'Snack 4',
  snack5: 'Snack 5', snack6: 'Snack 6', snack7: 'Snack 7', snack8: 'Snack 8',
}
const slotLabel = (slot) => SLOT_LABELS[slot] || 'Maaltijd'
// Slot → meal-type chip die vooraf aangevinkt wordt (snack-slots → 'snack')
const SLOT_TO_TYPE = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' }
const slotToMealType = (slot) => SLOT_TO_TYPE[slot] || 'snack'

// Compacte chip-stijl. Kleiner dan voorheen — past in inline-rij naast
// section-label. Gouden border + gouden bg bij actief.
const goldChipStyle = (m, active) => ({
  padding: m ? '0.3rem 0.65rem' : '0.32rem 0.7rem',
  background: active ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.035)',
  border: `1px solid ${active ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 999,
  color: active ? '#FFD700' : 'rgba(255,255,255,0.7)',
  fontSize: m ? '0.7rem' : '0.74rem',
  fontWeight: active ? 800 : 600,
  cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.1s ease', fontFamily: 'inherit',
  minHeight: m ? 26 : 28,
  letterSpacing: '-0.005em',
  whiteSpace: 'nowrap',
})

// Hernoemde label-display voor de chips
const LABEL_DISPLAY = {
  lactose_free: 'Lactosevrij',
  gluten_free:  'Glutenvrij',
  vegetarian:   'Vegetarisch',
  vegan:        'Vegan',
  quick:        'Quick',
  no_cook:      'No cook',
  meal_prep:    'Meal prep',
}

export default function SwapModal({
  db, slot, currentMeal, dayIndex, dayTotals, targets, trainingDays = [],
  onSelect, onMultiDaySelect, onClose, isMobile, embedded = false
}) {
  const modalHost = useModalHost()
  const [meals, setMeals]               = useState([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [selectedDays, setSelectedDays] = useState([dayIndex])
  const [activeLabels, setActiveLabels] = useState([])
  const [activeDensities, setActiveDensities] = useState([])  // ['protein_dense','high_fiber',...]
  const [activeMealTypes, setActiveMealTypes] = useState(() => slot ? [slotToMealType(slot)] : [])  // vooraf aangevinkt op het slot
  const [showFilters, setShowFilters]   = useState(true)
  // Coach-favorieten — Set van meal_ids die deze coach heeft gemarkeerd.
  const [coachId, setCoachId] = useState(null)
  const [favorites, setFavorites] = useState(() => new Set())
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [expandedMealId, setExpandedMealId] = useState(null)
  const [ingNameCache, setIngNameCache] = useState({})
  const [loadingIngsFor, setLoadingIngsFor] = useState(null)
  const debounceRef = useRef(null)
  const m = isMobile

  const toggleExpand = async (meal) => {
    if (expandedMealId === meal.id) { setExpandedMealId(null); return }
    setExpandedMealId(meal.id)
    const ids = (meal.ingredients_list || [])
      .map(i => i.ingredient_id)
      .filter(id => id && !ingNameCache[id])
    if (ids.length === 0) return
    setLoadingIngsFor(meal.id)
    try {
      const { data } = await db.supabase.from('ai_ingredients').select('id, name').in('id', ids)
      if (data) {
        const map = {}
        data.forEach(r => { map[r.id] = r.name })
        setIngNameCache(prev => ({ ...prev, ...map }))
      }
    } catch (e) { console.warn('ingredient names fetch failed', e) }
    setLoadingIngsFor(null)
  }

  // Laad suggesties bij mount en bij label filter wijziging
  useEffect(() => {
    if (!search.trim()) loadSuggestions()
  }, [activeLabels, activeDensities, activeMealTypes, onlyFavorites, favorites])

  useEffect(() => { loadSuggestions() }, [])

  // Laad coach + favorieten één keer
  useEffect(() => {
    (async () => {
      try {
        const user = await db.getCurrentUser?.()
        const cid = user?.id
        if (!cid) return
        setCoachId(cid)
        const { data, error } = await db.supabase
          .from('coach_meal_favorites')
          .select('meal_id')
          .eq('coach_id', cid)
        if (error) { console.warn('load favorites', error); return }
        setFavorites(new Set((data || []).map(r => r.meal_id)))
      } catch (e) { console.warn('load favorites failed', e) }
    })()
  }, [])

  const toggleFavorite = async (mealId) => {
    if (!coachId || !mealId) return
    const isFav = favorites.has(mealId)
    // Optimistisch
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(mealId); else next.add(mealId)
      return next
    })
    try {
      if (isFav) {
        await db.supabase
          .from('coach_meal_favorites')
          .delete()
          .eq('coach_id', coachId)
          .eq('meal_id', mealId)
      } else {
        await db.supabase
          .from('coach_meal_favorites')
          .insert({ coach_id: coachId, meal_id: mealId })
      }
    } catch (e) {
      console.error('toggle favorite failed', e)
      // Revert
      setFavorites(prev => {
        const next = new Set(prev)
        if (isFav) next.add(mealId); else next.delete(mealId)
        return next
      })
    }
  }

  // Debounce zoeken
  useEffect(() => {
    if (!search.trim()) { loadSuggestions(); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadSearch(search), 300)
  }, [search])

  // Allergen-filters (lactose_free, gluten_free) gaan niet naar backend,
  // we filteren client-side via meal.allergens. Hier alleen pure labels.
  const labelFilterForBackend = () => activeLabels.filter(l => !ALLERGEN_LABELS.has(l))

  const applyLocalFilters = (list) => {
    return (list || []).filter(meal => {
      // Alleen favorieten
      if (onlyFavorites && !favorites.has(meal.id)) return false
      // Allergie-filters: meal mag het verboden allergeen NIET hebben
      const allergens = (meal.allergens || []).map(a => String(a).toLowerCase())
      const mealName = (meal.name || meal.internal_name || '').toLowerCase()
      for (const tag of activeLabels) {
        if (!ALLERGEN_LABELS.has(tag)) continue
        const rule = ALLERGEN_RULES[tag]
        if (!rule) continue
        const hasAllergen = rule.tags.some(t => allergens.includes(t)) || rule.names.some(n => mealName.includes(n))
        if (hasAllergen) return false
      }
      // Density-filters — multi-select. AND-logica: meal moet aan ALLE
      // actieve density-filters voldoen.
      for (const id of activeDensities) {
        const f = DENSITY_FILTERS.find(x => x.id === id)
        if (f && !f.test(meal)) return false
      }
      return true
    })
  }

  // ── Initiële suggesties op timing + label filters ──
  // Filter-combinatie:
  // - Favorieten + meal-type chip → toon favs die ook in dat slot vallen (AND).
  // - Favorieten alleen (geen chip) → toon álle favs, ongeacht slot.
  // - Geen favorieten, geen chip → default slot-timing (lunch-slot toont lunch).
  // - Geen favorieten, wél chip → toon meals van die chip-types.
  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const baseSelect = 'id, name, internal_name, calories, protein, carbs, fat, fiber, image_url, timing, labels, allergens, ingredients_list, difficulty, cost_tier'
      let query = db.supabase.from('ai_meals').select(baseSelect).limit(120)

      // Timing-filter: alleen overslaan als enkel favorieten aanstaan zonder
      // expliciete meal-type chip — dan willen we álle favs zien.
      const timingMap = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack1: 'snack', snack2: 'snack', snack3: 'snack' }
      let timingsToApply = null
      if (activeMealTypes.length > 0) {
        timingsToApply = activeMealTypes
      } else if (!onlyFavorites) {
        timingsToApply = [timingMap[slot] || 'snack']
      }
      if (timingsToApply) query = query.overlaps('timing', timingsToApply)

      // Favorieten-filter: stapelt bovenop timing.
      if (onlyFavorites) {
        const favIds = Array.from(favorites)
        if (favIds.length === 0) { setMeals([]); setLoading(false); return }
        query = query.in('id', favIds)
      }

      const backendLabels = labelFilterForBackend()
      if (backendLabels.length > 0) {
        query = query.contains('labels', backendLabels)
      }

      const { data } = await query
      setMeals(scoreAndSort(applyLocalFilters(data)))
    } catch (e) { console.warn('SwapModal suggestions failed:', e) }
    setLoading(false)
  }

  // ── Fuzzy search via pg_trgm RPC ──
  const loadSearch = async (q) => {
    setLoading(true)
    try {
      const backendLabels = labelFilterForBackend()
      const { data, error } = await db.supabase.rpc('search_meals_fuzzy', {
        search_term: q,
        label_filter: backendLabels.length > 0 ? backendLabels : null,
        result_limit: 80
      })

      if (error) {
        const { data: fallback } = await db.supabase
          .from('ai_meals')
          .select('id, name, internal_name, calories, protein, carbs, fat, fiber, image_url, timing, labels, allergens, ingredients_list, difficulty, cost_tier')
          .or(`name.ilike.%${q}%,internal_name.ilike.%${q}%`)
          .limit(80)
        setMeals(scoreAndSort(applyLocalFilters(fallback)))
      } else {
        setMeals(scoreAndSort(applyLocalFilters(data)))
      }
    } catch (e) {
      console.warn('SwapModal search failed:', e)
    }
    setLoading(false)
  }

  // ── Fit score ──
  const scoreAndSort = (data) => {
    const cal  = dayTotals?.kcal || dayTotals?.calories || 0
    const prot = dayTotals?.protein || 0
    const currentCal  = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein  || 0
    const needCal  = (targets?.calories || 2500) - cal  + currentCal
    const needProt = (targets?.protein  || 150)  - prot + currentProt

    return data
      .map(meal => {
        const calDiff  = Math.abs((meal.calories || 0) - needCal)
        const protDiff = Math.abs((meal.protein  || 0) - needProt)
        return { ...meal, fitScore: Math.max(0, Math.round(100 - calDiff / 20 - protDiff / 5)) }
      })
      // Favorieten altijd bovenaan, daarna op fit-score.
      .sort((a, b) => {
        const fa = favorites.has(a.id) ? 1 : 0
        const fb = favorites.has(b.id) ? 1 : 0
        if (fa !== fb) return fb - fa
        return b.fitScore - a.fitScore
      })
  }

  const toggleLabel = (label) => {
    setActiveLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  const handleMealSelect = (meal) => { setSelectedMeal(meal); setShowDayPicker(true) }
  const toggleDay = (i) => setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])

  const applySelection = () => {
    if (!selectedMeal) return
    if (selectedDays.length === 1 && selectedDays[0] === dayIndex) onSelect(selectedMeal)
    else onMultiDaySelect(selectedMeal, slot, selectedDays)
  }

  const modal = (
    // Ingebed in het zijvak hoort dit gewoon een blok in de stroom te zijn.
    // Het stond op position:fixed met inset:0, wat leunt op een transform op
    // een ouder om binnen het vak te blijven. In split screen zit die ouder
    // een laag dieper en verdween het paneel uit beeld: het vak was zwart
    // terwijl de maaltijden wél geladen waren. TimingModal en PlanSwitcher
    // deden dit al met een ternary; SwapModal, AutoBalancer en BestSwaps niet.
    <div onClick={embedded ? undefined : onClose} style={embedded ? {
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%', minHeight: 0,
      background: '#0a0a0a',
    } : {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      zIndex: 10000, display: 'flex',
      alignItems: 'stretch', justifyContent: 'center',
      padding: m ? '0' : 'min(40px, 4vh) 20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a',
        width: '100%', maxWidth: embedded ? 'none' : 880,
        height: (embedded || m) ? '100%' : 'min(100%, 920px)',
        borderRadius: (embedded || m) ? 0 : 18,
        border: (embedded || m) ? 'none' : '1px solid rgba(255,215,0,0.25)',
        boxShadow: (embedded || m) ? 'none' : '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        paddingTop: m ? 'env(safe-area-inset-top, 0px)' : 0,
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
        }}>
          <div>
            <div style={{
              fontSize: m ? '0.95rem' : '1.1rem', fontWeight: 800,
              color: '#FFD700', letterSpacing: '-0.01em',
            }}>
              {showDayPicker ? 'Toepassen op dagen' : `${slotLabel(slot)} ${currentMeal ? 'vervangen' : 'toevoegen'}`}
            </div>
            <div style={{ fontSize: m ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {showDayPicker
                ? `${selectedMeal?.name} → selecteer dagen`
                : (currentMeal?.name ? `${currentMeal.name} → kies alternatief` : 'Kies een maaltijd')}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={16} /></button>
        </div>

        {/* ═══ DAY PICKER ═══ */}
        {showDayPicker ? (
          <div style={{ padding: m ? '0.75rem' : '1rem', overflowY: 'auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.625rem', marginBottom: '0.75rem',
              background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '6px'
            }}>
              {selectedMeal?.image_url && (
                <div style={{ width: '40px', height: '32px', borderRadius: '3px', backgroundImage: `url(${selectedMeal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 700, color: '#fff' }}>{selectedMeal?.name}</div>
                <div style={{ fontSize: m ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                  {Math.round(selectedMeal?.calories || 0)} kcal · {Math.round(selectedMeal?.protein || 0)}g E
                </div>
              </div>
            </div>

            <div style={{ fontSize: m ? '0.4rem' : '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              WELKE DAGEN?
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {DAYS_SHORT.map((day, i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  flex: 1, padding: m ? '0.5rem 0' : '0.6rem 0',
                  background: selectedDays.includes(i) ? 'rgba(255,215,0,0.08)' : 'transparent',
                  border: `1px solid ${selectedDays.includes(i) ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  color: selectedDays.includes(i) ? '#FFD700' : 'rgba(255,255,255,0.3)',
                  fontSize: m ? '0.6rem' : '0.65rem', fontWeight: selectedDays.includes(i) ? 800 : 600,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px'
                }}>{day}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
              <QuickBtn label="Alleen vandaag" active={selectedDays.length === 1 && selectedDays[0] === dayIndex} onClick={() => setSelectedDays([dayIndex])} m={m} />
              <QuickBtn label="Alle dagen"     active={selectedDays.length === 7}                                 onClick={() => setSelectedDays([0,1,2,3,4,5,6])} m={m} />
              {trainingDays.length > 0 && (
                <QuickBtn label="💪 Trainingsdagen" active={selectedDays.length === trainingDays.length && trainingDays.every(d => selectedDays.includes(d))} onClick={() => setSelectedDays([...trainingDays])} m={m} />
              )}
              <QuickBtn label="Werkdagen"      active={selectedDays.length === 5 && !selectedDays.includes(5)}   onClick={() => setSelectedDays([0,1,2,3,4])} m={m} />
            </div>
            <button onClick={applySelection} disabled={selectedDays.length === 0} style={{
              width: '100%', padding: m ? '0.625rem' : '0.75rem',
              background: selectedDays.length === 0 ? 'rgba(255,255,255,0.05)' : '#FFD700',
              border: 'none', borderRadius: '6px',
              color: selectedDays.length === 0 ? 'rgba(255,255,255,0.2)' : '#000',
              fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800,
              cursor: selectedDays.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              <Calendar size={15} />
              Toepassen op {selectedDays.length} dag{selectedDays.length !== 1 ? 'en' : ''}
            </button>
            <button onClick={() => { setShowDayPicker(false); setSelectedMeal(null) }} style={{
              width: '100%', padding: '0.5rem', marginTop: '0.35rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.3)',
              fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 600, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>← Andere maaltijd kiezen</button>
          </div>

        ) : (
          <>
            {/* ═══ ZOEK + FILTERS ═══ */}
            <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Zoekbalk */}
              <div style={{ padding: m ? '0.5rem 0.75rem 0.35rem' : '0.5rem 1rem 0.35rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.625rem', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px'
                }}>
                  <Search size={14} color="rgba(255,255,255,0.2)" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Zoek op naam of coach naam..."
                    autoFocus
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit' }}
                  />
                  {loading && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', borderTopColor: '#FFD700', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                </div>
              </div>

              {/* Filters — label + dropdowns op één regel (bold witte tekst). */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                padding: m ? '0.5rem 0.75rem' : '0.6rem 1rem',
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: m ? '0.82rem' : '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginRight: 2 }}>
                  Filters
                </span>
                <FilterDropdown
                  label="Dieet & Allergie" m={m}
                  options={FILTER_GROUPS[0].options.map(o => ({ value: o, label: LABEL_DISPLAY[o] || o.replace(/_/g, ' ') }))}
                  activeSet={activeLabels} onToggle={toggleLabel}
                />
                <FilterDropdown
                  label="Maaltijd" m={m}
                  options={MEAL_TYPES.map(t => ({ value: t.id, label: t.label }))}
                  activeSet={activeMealTypes}
                  onToggle={(v) => setActiveMealTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                />
                {(activeLabels.length > 0 || activeMealTypes.length > 0) && (
                  <button
                    onClick={() => { setActiveLabels([]); setActiveMealTypes([]) }}
                    style={{
                      padding: m ? '0.45rem 0.8rem' : '0.5rem 0.9rem',
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: 10, color: '#ef4444',
                      fontSize: m ? '0.82rem' : '0.88rem', fontWeight: 800, cursor: 'pointer',
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                    × Wis
                  </button>
                )}
              </div>
            </div>

            {/* ═══ RESULTATEN ═══ */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {!loading && meals.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
                  Geen maaltijden gevonden
                </div>
              )}
              {meals.map(meal => {
                const isFav = favorites.has(meal.id)
                const isExpanded = expandedMealId === meal.id
                return (
                  <div key={meal.id} style={{ borderBottom: '2px solid rgba(255,255,255,0.14)' }}>
                  <div onClick={() => handleMealSelect(meal)} style={{
                    width: '100%', display: 'flex', gap: '0.5rem',
                    padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem',
                    background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    alignItems: 'center'
                  }}>
                    {meal.image_url && (
                      <div style={{ width: '48px', height: '40px', borderRadius: '4px', backgroundImage: `url(${meal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.05rem' }}>
                        {meal.name}
                      </div>
                      {meal.internal_name && (
                        <div style={{ fontSize: '0.4rem', fontWeight: 600, color: 'rgba(255,215,0,0.4)', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🔒 {meal.internal_name}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.4rem', fontSize: m ? '0.55rem' : '0.6rem' }}>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{Math.round(meal.calories)} kcal</span>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{Math.round(meal.protein)}g E</span>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{Math.round(meal.carbs)}g K</span>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{Math.round(meal.fat)}g V</span>
                      </div>
                    </div>

                    {/* Info-uitklap — toont ingrediënten onder de rij */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(meal) }}
                      title={isExpanded ? 'Verberg ingrediënten' : 'Toon ingrediënten'}
                      style={{
                        width: 28, height: 28, padding: 0, flexShrink: 0,
                        background: isExpanded ? 'rgba(255,215,0,0.08)' : 'transparent',
                        border: `1px solid ${isExpanded ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 6, cursor: 'pointer',
                        color: isExpanded ? '#FFD700' : 'rgba(255,255,255,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Favoriet-ster — click vangt eigen event, niet meal-select */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(meal.id) }}
                      title={isFav ? 'Verwijder uit favorieten' : 'Maak favoriet'}
                      style={{
                        width: 22, height: 22, padding: 0, flexShrink: 0,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: isFav ? '#FFD700' : 'rgba(255,255,255,0.3)',
                        fontSize: '0.8rem', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {isFav ? '★' : '☆'}
                    </button>

                    {meal.fitScore > 0 && !search && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.15rem',
                        padding: '0.15rem 0.35rem',
                        background: meal.fitScore >= 70 ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${meal.fitScore >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '3px', flexShrink: 0
                      }}>
                        <Zap size={9} color={meal.fitScore >= 70 ? '#10b981' : 'rgba(255,255,255,0.25)'} />
                        <span style={{ fontSize: '0.5rem', fontWeight: 800, color: meal.fitScore >= 70 ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{meal.fitScore}</span>
                      </div>
                    )}
                    <ChevronRight size={12} color="rgba(255,255,255,0.1)" style={{ flexShrink: 0 }} />
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: m ? '0.5rem 0.75rem 0.7rem' : '0.5rem 1rem 0.75rem',
                      background: 'rgba(255,215,0,0.02)',
                      borderTop: '1px solid rgba(255,215,0,0.06)',
                    }}>
                      {loadingIngsFor === meal.id && (
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Laden…</div>
                      )}
                      {!loadingIngsFor && (!meal.ingredients_list || meal.ingredients_list.length === 0) && (
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Geen ingrediënten bekend</div>
                      )}
                      {loadingIngsFor !== meal.id && meal.ingredients_list?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {meal.ingredients_list.map((ing, i) => {
                            const name = ingNameCache[ing.ingredient_id] || (ing.ingredient_id ? '…' : 'onbekend')
                            const unit = ing.unit || 'gram'
                            const amt = ing.amount ?? '—'
                            return (
                              <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                                fontSize: m ? '0.6rem' : '0.65rem',
                              }}>
                                <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{name}</span>
                                <span style={{ color: 'rgba(255,215,0,0.7)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                  {amt} {unit === 'piece' ? 'st' : (unit === 'ml' ? 'ml' : 'g')}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return (
    // flex:1 + minHeight:0 in plaats van height:100%. Het dock-paneel is een
    // kolom-flex, dus dit vult altijd de beschikbare hoogte. Een procentuele
    // hoogte hangt af van of élke ouder in de keten een vaste hoogte heeft, en
    // in split screen klapte die keten dicht: het paneel opende, maar de lijst
    // erin was nul pixels hoog en je zag geen maaltijden.
    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, transform: 'translateZ(0)', overflow: 'hidden' }}>{modal}</div>
  )
  return createPortal(modal, modalHost)
}

// Filter-dropdown — bold witte trigger + uitklaplijst met (multi-select) opties.
function FilterDropdown({ label, options, activeSet, onToggle, m }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown) }
  }, [open])
  const count = options.filter(o => activeSet.includes(o.value)).length
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: m ? '0.45rem 0.7rem' : '0.5rem 0.85rem',
          background: count > 0 ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${count > 0 ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 10, color: '#fff', fontWeight: 800,
          fontSize: m ? '0.82rem' : '0.88rem', letterSpacing: '-0.01em',
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {label}
        {count > 0 && (
          <span style={{ fontSize: '0.7em', fontWeight: 900, color: '#000', background: '#FFD700', borderRadius: 999, padding: '0 6px', lineHeight: 1.6 }}>{count}</span>
        )}
        <ChevronDown size={14} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, zIndex: 60,
          minWidth: 190, maxHeight: 300, overflowY: 'auto',
          background: '#111', border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}>
          {options.map((o, i) => {
            const active = activeSet.includes(o.value)
            return (
              <button
                key={o.value}
                onClick={() => onToggle(o.value)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', gap: 9,
                  padding: '0.55rem 0.75rem',
                  background: active ? 'rgba(255,215,0,0.1)' : 'transparent',
                  border: 'none', borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: '#fff', fontWeight: 700, fontSize: '0.82rem', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  width: 15, height: 15, flexShrink: 0, borderRadius: 4,
                  border: `1px solid ${active ? '#FFD700' : 'rgba(255,255,255,0.3)'}`,
                  background: active ? '#FFD700' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#000', fontSize: '0.7rem', fontWeight: 900,
                }}>{active ? '✓' : ''}</span>
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function QuickBtn({ label, active, onClick, m }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: m ? '0.35rem 0' : '0.4rem 0',
      background: active ? 'rgba(255,215,0,0.06)' : 'transparent',
      border: `1px solid ${active ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '3px', color: active ? '#FFD700' : 'rgba(255,255,255,0.25)',
      fontSize: m ? '0.5rem' : '0.55rem', fontWeight: 700,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
    }}>{label}</button>
  )
}
