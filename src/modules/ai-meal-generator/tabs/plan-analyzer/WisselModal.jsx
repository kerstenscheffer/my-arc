// src/modules/ai-meal-generator/tabs/plan-analyzer/WisselModal.jsx
//
// Het wisselvenster van de analyzer: dezelfde opbouw als het wisselvenster
// van de klant (meal-plan/components/AIAlternativesModal), zodat coach en
// klant naar hetzelfde scherm kijken. Bovenin de maaltijd die je wisselt als
// kaart, daaronder zoeken, drie keuzes (moment, bron, volgorde) en grenzen;
// de lijst is dezelfde kaart als in de dagplanning. Kiezen gaat via een blad
// met het verschil in macro's, en pas dan de knop.
//
// Verschil met de klant-versie: de ster is hier een coach-favoriet
// (coach_meal_favorites) en "Eigen maaltijden" zijn die van de klant.
// Er wordt niets geschaald: wat je kiest komt 1-op-1 in het slot.

import React, { useState, useEffect, useRef } from 'react'
import MealCard from '../../../meal-plan/components/day-schedule/MealCard'
import Keuze from '../../../meal-plan/components/Keuze'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { niveauVoorDoel } from '../../../meal-plan/DayTemplateService'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import BereikKeuze from './BereikKeuze'
import { findPortionConfig } from '../../../meal-plan/components/food-log/portionPresets'
import { portieInfo, portieLabel, stapPortie } from './portie'
import { X, Search, Check, ArrowUp, ArrowDown, Minus, Star, Info, SlidersHorizontal } from 'lucide-react'

// Slots van het weekplan ('breakfast', 'snack2', 'pre_workout', …) naar de
// zes momenten van de keuzelijst.
function slotNaarMoment(slot) {
  const v = String(slot || '').toLowerCase()
  if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
  if (v.includes('lunch')) return 'lunch'
  if (v.includes('dinner') || v.includes('diner') || v.includes('avondeten')) return 'dinner'
  if (v.includes('pre')) return 'pre_workout'
  if (v.includes('post')) return 'post_workout'
  return 'snack'
}

// Avondsnack is in ai_meals geen eigen timing (die blijft 'snack'), maar wel
// een eigen moment in de keuzelijst en een eigen lijst vaste swaps van de
// coach ('avondsnack'). Herkend aan het slot of aan het label op de kaart.
const isAvondsnack = (slot, meal) =>
  /avond\s*snack|before_bed/i.test(`${slot || ''} ${meal?.display_label || ''} ${meal?.slot || ''} ${meal?.timeSlot || ''}`)
const swapSlotNaarMoment = (s) => (/avondsnack|before_bed/i.test(String(s || '')) ? 'avondsnack' : slotNaarMoment(s))
const basisMoment = (m) => (m === 'avondsnack' ? 'snack' : m)

const SECTIE_NAAR_MOMENT = {
  ontbijt: 'breakfast', lunch: 'lunch', diner: 'dinner', avondeten: 'dinner',
  snack: 'snack', tussendoortje: 'snack', snacks: 'snack',
}

const MOMENT_OPTIES = [
  { id: 'alles', label: 'Alle maaltijden' },
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Diner' },
  { id: 'snack', label: 'Snack' },
  { id: 'avondsnack', label: 'Avondsnack' },
  { id: 'pre_workout', label: 'Pre-workout' },
  { id: 'post_workout', label: 'Post-workout' },
]

const SORTEER_OPTIES = [
  { id: 'smart', label: 'Beste match' },
  { id: 'same-cal', label: 'Zelfde kcal' },
  { id: 'more-cal', label: 'Meer kcal' },
  { id: 'less-cal', label: 'Minder kcal' },
  { id: 'same-protein', label: 'Zelfde eiwit' },
  { id: 'more-protein', label: 'Meer eiwit' },
  { id: 'less-protein', label: 'Minder eiwit' },
]

// "Beste match": dezelfde afstand als getSmartAlternatives in de klant-app.
// Kcal en eiwit wegen het zwaarst, koolhydraten en vet als kcal-equivalent,
// en een kleine voorkeur voor gerechten die ingrediënten delen.
function wisselAfstand(m, huidig) {
  const doel = {
    calories: Number(huidig?.calories) || 0,
    protein: Number(huidig?.protein) || 0,
    carbs: Number(huidig?.carbs) || 0,
    fat: Number(huidig?.fat) || 0,
  }
  const kcalRef = Math.max(doel.calories, 150)
  const eiwitRef = Math.max(doel.protein, 10)
  const dKcal = Math.abs((m.calories || 0) - doel.calories) / kcalRef
  const dEiwit = Math.abs((m.protein || 0) - doel.protein) / eiwitRef
  const dRest = (Math.abs((m.carbs || 0) - doel.carbs) * 4
               + Math.abs((m.fat || 0) - doel.fat) * 9) / kcalRef
  const idsVan = (x) => new Set((Array.isArray(x?.ingredients_list) ? x.ingredients_list : [])
    .map(i => i?.ingredient_id).filter(Boolean))
  const a = idsVan(huidig), b = idsVan(m)
  let gedeeld = 0
  a.forEach(id => { if (b.has(id)) gedeeld++ })
  const unie = a.size + b.size - gedeeld
  const overlap = unie > 0 ? gedeeld / unie : 0
  return 3 * dKcal + 2 * dEiwit + 1 * dRest + 0.5 * overlap
}

export default function WisselModal({
  db, slot, currentMeal, clientId, targetCalories,
  // Waar geldt de wissel? Zelfde vraag als in het bewerk-blad van de klant.
  // dagNaam = de dag die open staat ("maandag"); plekken = waar de huidige
  // maaltijd verder nog in de week staat [{ dag, slot }]. Is plekken
  // undefined (pre-workout: één maaltijd voor het hele plan), dan wordt de
  // vraag overgeslagen.
  dagNaam = null, plekken = undefined,
  // Toegevoegd vanuit de agenda: de getikte tijd ('18:00').
  tijd = null,
  onSelect, onClose, isMobile, embedded = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [moment, setMoment] = useState('alles')
  const [bron, setBron] = useState('alles')
  const [sortering, setSortering] = useState('smart')
  const [maxKcal, setMaxKcal] = useState('')
  const [minEiwit, setMinEiwit] = useState('')
  const [toonFilter, setToonFilter] = useState(false)
  const [allMeals, setAllMeals] = useState([])
  const [customMeals, setCustomMeals] = useState([])
  const [coachOptions, setCoachOptions] = useState([])
  const [coachPerMoment, setCoachPerMoment] = useState({})
  const [coachId, setCoachId] = useState(null)
  const [favorites, setFavorites] = useState(() => new Set())
  const [infoMeal, setInfoMeal] = useState(null)
  const [infoIngredienten, setInfoIngredienten] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  // Producten en ingrediënten (ai_ingredients): een biertje of een appel is
  // geen recept, maar wel iets dat je in het plan wilt zetten. Zoeken op
  // naam of merk; kiezen vraagt eerst de portie en legt dan een maaltijd
  // vast in ai_meals, zodat het slot gewoon een meal_id draagt.
  const [producten, setProducten] = useState([])
  const [productenLaden, setProductenLaden] = useState(false)
  const productZoekRef = useRef(0)
  const [portieVan, setPortieVan] = useState(null)   // product waarvan de portie open staat
  const [gram, setGram] = useState(100)
  const [portieBezig, setPortieBezig] = useState(false)

  useEffect(() => {
    const term = searchTerm.trim()
    if (term.length < 2) { setProducten([]); setProductenLaden(false); return }
    const eigen = ++productZoekRef.current
    setProductenLaden(true)
    const t = setTimeout(async () => {
      try {
        const veilig = term.replace(/[%,()]/g, ' ')
        const { data } = await db.supabase
          .from('ai_ingredients')
          .select('id, name, name_en, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, default_portion_gram, image_url, barcode, log_count')
          .or(`name.ilike.%${veilig}%,name_en.ilike.%${veilig}%,brand.ilike.%${veilig}%`)
          .order('log_count', { ascending: false, nullsFirst: false })
          .limit(20)
        if (eigen !== productZoekRef.current) return
        const t2 = term.toLowerCase()
        const rang = (n) => { const x = String(n || '').toLowerCase(); return x === t2 ? 0 : x.startsWith(t2) ? 1 : 2 }
        setProducten((data || []).sort((a, b) => rang(a.name) - rang(b.name) || (b.log_count || 0) - (a.log_count || 0)))
      } catch (e) {
        console.warn('producten zoeken mislukt', e?.message)
        if (eigen === productZoekRef.current) setProducten([])
      } finally {
        if (eigen === productZoekRef.current) setProductenLaden(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [searchTerm, db])

  const productMacros = (ing, g) => {
    const f = (Number(g) || 0) / 100
    return {
      calories: Math.round((Number(ing?.calories_per_100g) || 0) * f),
      protein: Math.round((Number(ing?.protein_per_100g) || 0) * f * 10) / 10,
      carbs: Math.round((Number(ing?.carbs_per_100g) || 0) * f * 10) / 10,
      fat: Math.round((Number(ing?.fat_per_100g) || 0) * f * 10) / 10,
      fiber: Math.round((Number(ing?.fiber_per_100g) || 0) * f * 10) / 10,
    }
  }
  const productNaam = (ing) => ing?.brand && !String(ing.name || '').includes(ing.brand) ? `${ing.name} (${ing.brand})` : (ing?.name || 'Product')

  // Product met portie vastleggen als maaltijd en daarna de gewone weg:
  // bevestig-blad, en bij een bestaand slot de vraag waar het geldt.
  const kiesProduct = async () => {
    if (!portieVan || portieBezig || !(Number(gram) > 0)) return
    setPortieBezig(true)
    try {
      const macro = productMacros(portieVan, gram)
      const eenheid = findPortionConfig(productNaam(portieVan))?.displayUnit === 'ml' ? 'ml' : 'g'
      const info = portieInfo(portieVan)
      const hoeveelheid = info ? portieLabel(gram, info) : `${Math.round(Number(gram))}${eenheid}`
      const rij = {
        name: `${productNaam(portieVan)} ${hoeveelheid}`,
        ...macro,
        ingredients_list: [{ ingredient_id: portieVan.id, amount: Number(gram) || 0, unit: 'gram' }],
        image_url: portieVan.image_url || null,
        // meal_type NIET zetten (check-constraint over textuur); moment in timing.
        timing: [slotNaarMoment(slot || currentMeal?.slot)],
      }
      const { data, error } = await db.supabase.from('ai_meals').insert([rij]).select('*').single()
      if (error || !data?.id) throw (error || new Error('geen id teruggegeven'))
      setPortieVan(null)
      setSelectedMeal({ ...data, meal_id: data.id })
    } catch (e) {
      console.error('product toevoegen mislukt:', e)
      alert('Product toevoegen mislukt: ' + (e?.message || 'onbekende fout'))
    } finally {
      setPortieBezig(false)
    }
  }

  const slotKey = isAvondsnack(slot, currentMeal) ? 'avondsnack' : slotNaarMoment(slot || currentMeal?.slot)
  const huidigId = currentMeal?.meal_id || currentMeal?.id || null

  const bronOpties = [
    { id: 'alles', label: 'Overal zoeken' },
    ...(coachOptions.length > 0 ? [{ id: 'coach', label: 'Vaste swaps' }] : []),
    ...(favorites.size > 0 ? [{ id: 'fav', label: 'Favorieten' }] : []),
    ...(customMeals.length > 0 ? [{ id: 'mine', label: 'Eigen maaltijden klant' }] : []),
    { id: 'db', label: 'Maaltijden-database' },
  ]

  useEffect(() => {
    laadAlles()
    return () => {
      setSelectedMeal(null)
      setSearchTerm('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, huidigId, clientId])

  const laadAlles = async () => {
    setLoading(true)
    try {
      // Coach + favorieten.
      try {
        const user = await db.getCurrentUser?.()
        if (user?.id) {
          setCoachId(user.id)
          const { data } = await db.supabase
            .from('coach_meal_favorites').select('meal_id').eq('coach_id', user.id)
          setFavorites(new Set((data || []).map(r => r.meal_id)))
        }
      } catch (e) { console.warn('favorieten laden mislukt', e?.message) }

      // De pool. Zonder limit en zonder needs_review, om dezelfde reden als
      // bij de klant: een lijst die zichzelf op macro's aanprijst mag geen
      // maaltijden bevatten waarvan de kcal niet klopt.
      const { data: meals } = await db.supabase
        .from('ai_meals')
        .select('*')
        .gt('calories', 0)
        .or('needs_review.is.null,needs_review.eq.false')

      // Vaste swaps van de coach voor deze klant (met de standaard-laag
      // eronder via de RPC), per moment.
      let curated = []
      const perMoment = {}
      try {
        let alleSlots = {}
        if (clientId) {
          const { data } = await db.supabase
            .rpc('get_effective_swap_options', { p_client_id: clientId })
          alleSlots = data || {}
        }
        const alleIds = [...new Set(Object.values(alleSlots).flatMap(v => v?.meal_ids || []))]
        if (alleIds.length > 0) {
          const { data: curatedMeals } = await db.supabase.from('ai_meals').select('*').in('id', alleIds)
          const opId = new Map((curatedMeals || []).map(m => [m.id, m]))
          Object.entries(alleSlots).forEach(([s, v]) => {
            const lijst = (v?.meal_ids || []).map(id => opId.get(id)).filter(Boolean)
            if (lijst.length === 0) return
            const mom = swapSlotNaarMoment(s)
            perMoment[mom] = [...(perMoment[mom] || []), ...lijst]
          })
          // Avondsnack zonder eigen lijst valt terug op de snacklijst.
          const eigenIds = alleSlots?.[slotKey]?.meal_ids?.length ? alleSlots[slotKey].meal_ids : (alleSlots?.[basisMoment(slotKey)]?.meal_ids || [])
          curated = eigenIds.map(id => opId.get(id)).filter(Boolean)
        }
      } catch (e) { console.warn('vaste swaps laden mislukt', e?.message) }

      // Dagmenu's van het niveau dat bij het caloriedoel hoort.
      try {
        const niveau = niveauVoorDoel(targetCalories)
        if (niveau) {
          const { data: dagmenu } = await db.supabase
            .from('ai_meals').select('*').like('internal_name', `dagmenu${niveau}_%`)
          const alGekozen = new Set(curated.map(m => m.id))
          ;(dagmenu || []).forEach(m => {
            const mom = slotNaarMoment((Array.isArray(m.timing) ? m.timing[0] : m.timing) || m.meal_type)
            if (!(perMoment[mom] || []).some(x => x.id === m.id)) {
              perMoment[mom] = [...(perMoment[mom] || []), m]
            }
            if (mom === basisMoment(slotKey) && !alGekozen.has(m.id)) {
              curated = [...curated, m]
              alGekozen.add(m.id)
            }
          })
        }
      } catch (e) { console.warn('dagmenu laden mislukt', e?.message) }

      // Eigen maaltijden van de klant.
      let custom = []
      try {
        if (clientId) {
          const { data } = await db.supabase
            .from('ai_custom_meals')
            .select('id, name, calories, protein, carbs, fat, fiber, image_url, section, ingredients_list')
            .eq('client_id', clientId)
            .eq('is_active', true)
          custom = (data || []).map(m => ({ ...m, _isCustom: true }))
        }
      } catch (e) { console.warn('eigen maaltijden laden mislukt', e?.message) }

      setAllMeals(meals || [])
      setCustomMeals(custom)
      setCoachOptions(curated)
      setCoachPerMoment(perMoment)
      setMoment(slotKey)
      setBron(curated.length > 0 ? 'coach' : 'alles')
    } catch (e) {
      console.error('WisselModal laden mislukt:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (mealId) => {
    if (!coachId || !mealId) return
    const was = favorites.has(mealId)
    setFavorites(prev => { const n = new Set(prev); was ? n.delete(mealId) : n.add(mealId); return n })
    try {
      if (was) {
        await db.supabase.from('coach_meal_favorites').delete().eq('coach_id', coachId).eq('meal_id', mealId)
      } else {
        await db.supabase.from('coach_meal_favorites').insert({ coach_id: coachId, meal_id: mealId })
      }
    } catch (e) {
      console.error('favoriet wisselen mislukt', e)
      setFavorites(prev => { const n = new Set(prev); was ? n.add(mealId) : n.delete(mealId); return n })
    }
  }

  const niveauVan = (m) => {
    const labels = Array.isArray(m?.labels) ? m.labels : []
    const label = labels.map(String).find(l => l.startsWith('dagmenu_'))
    return label ? Number(label.replace('dagmenu_', '')) : null
  }
  const huidigNiveau = niveauVoorDoel(targetCalories) || niveauVan(currentMeal)

  const momentenVan = (m) => {
    const uit = new Set()
    ;(Array.isArray(m?.timing) ? m.timing : []).forEach(t => uit.add(String(t).toLowerCase()))
    if (m?.section) {
      const s = String(m.section).toLowerCase()
      uit.add(SECTIE_NAAR_MOMENT[s] || s)
    }
    return uit
  }

  const filterActief = !!(maxKcal || minEiwit)

  const getFilteredMeals = () => {
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0
    const nietZelf = (m) => m.id !== huidigId

    let pool
    if (bron === 'coach') {
      if (moment !== 'alles') {
        // Geen eigen avondsnack-lijst? Dan de snacklijst.
        const lijst = coachPerMoment[moment]?.length ? coachPerMoment[moment] : (coachPerMoment[basisMoment(moment)] || [])
        pool = lijst.filter(nietZelf)
      } else {
        const gezien = new Set()
        pool = [...coachOptions, ...Object.values(coachPerMoment).flat()].filter(m => {
          if (!nietZelf(m) || gezien.has(m.id)) return false
          gezien.add(m.id); return true
        })
      }
    }
    else if (bron === 'fav') pool = allMeals.filter(m => favorites.has(m.id) && nietZelf(m))
    else if (bron === 'mine') pool = customMeals.filter(nietZelf)
    else if (bron === 'db') pool = allMeals.filter(nietZelf)
    else {
      const gezien = new Set()
      pool = [...coachOptions, ...customMeals, ...allMeals].filter(m => {
        if (!nietZelf(m) || gezien.has(m.id)) return false
        gezien.add(m.id); return true
      })
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return pool.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.name_en?.toLowerCase().includes(term) ||
        m.internal_name?.toLowerCase().includes(term)
      )
    }

    let meals = pool
    if (moment !== 'alles' && bron !== 'coach') {
      meals = pool.filter(m => {
        const set = momentenVan(m)
        return set.size === 0 || set.has(moment) || set.has(basisMoment(moment))
      })
    }

    if (huidigNiveau) {
      meals = meals.filter(m => {
        const n = niveauVan(m)
        return !n || n === huidigNiveau
      })
    }

    const kcalGrens = parseFloat(String(maxKcal).replace(',', '.'))
    const eiwitGrens = parseFloat(String(minEiwit).replace(',', '.'))
    if (Number.isFinite(kcalGrens) && kcalGrens > 0) meals = meals.filter(m => (m.calories || 0) <= kcalGrens)
    if (Number.isFinite(eiwitGrens) && eiwitGrens > 0) meals = meals.filter(m => (m.protein || 0) >= eiwitGrens)

    const opCal = (m) => m.calories || 0
    const opProt = (m) => m.protein || 0
    switch (sortering) {
      case 'same-cal':
        return [...meals].sort((a, b) => Math.abs(opCal(a) - currentCal) - Math.abs(opCal(b) - currentCal))
      case 'more-cal':
        return meals.filter(m => opCal(m) > currentCal).sort((a, b) => opCal(a) - opCal(b))
      case 'less-cal':
        return meals.filter(m => opCal(m) > 0 && opCal(m) < currentCal).sort((a, b) => opCal(b) - opCal(a))
      case 'same-protein':
        return [...meals].sort((a, b) => Math.abs(opProt(a) - currentProt) - Math.abs(opProt(b) - currentProt))
      case 'more-protein':
        return meals.filter(m => opProt(m) > currentProt).sort((a, b) => opProt(a) - opProt(b))
      case 'less-protein':
        return meals.filter(m => opProt(m) < currentProt).sort((a, b) => opProt(b) - opProt(a))
      default: {
        if (!currentMeal) return [...meals].sort((a, b) => opCal(a) - opCal(b))
        return meals
          .map(m => ({ m, d: wisselAfstand(m, currentMeal) }))
          .sort((a, b) => a.d - b.d)
          .map(x => x.m)
      }
    }
  }

  // Ingrediënten van een ai_meal zijn verwijzingen; voor het info-blad
  // schrijven we ze uit met naam en macro's.
  const schrijfIngredientenUit = async (lijst) => {
    const rijen = Array.isArray(lijst) ? lijst : []
    const ids = [...new Set(rijen.map(r => r?.ingredient_id).filter(Boolean))]
    if (ids.length === 0) return rijen.some(r => r?.calories || r?.protein) ? rijen : null
    try {
      const { data, error } = await db.supabase
        .from('ai_ingredients')
        .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
        .in('id', ids)
      if (error) throw error
      const opId = new Map((data || []).map(i => [i.id, i]))
      const uit = rijen.map(r => {
        const b = opId.get(r.ingredient_id)
        if (!b) return null
        const gram = Number(r.amount) || 0
        const deel = gram / 100
        return {
          name: b.name, amount: gram, unit: r.unit || 'gram',
          calories: Math.round((b.calories_per_100g || 0) * deel),
          protein: Math.round((b.protein_per_100g || 0) * deel * 10) / 10,
          carbs: Math.round((b.carbs_per_100g || 0) * deel * 10) / 10,
          fat: Math.round((b.fat_per_100g || 0) * deel * 10) / 10,
        }
      }).filter(Boolean)
      return uit.length ? uit : null
    } catch (e) {
      console.error('Ingrediënten uitschrijven mislukt:', e)
      return null
    }
  }

  const openInfo = async (meal) => {
    setInfoMeal(meal)
    setInfoIngredienten(null)
    const uit = await schrijfIngredientenUit(meal.ingredients_list)
    setInfoIngredienten(uit || [])
  }

  const getDiff = (newVal, oldVal) => {
    const diff = Math.round((newVal || 0) - (oldVal || 0))
    if (diff > 0) return { text: `+${diff}`, color: '#fff', Icon: ArrowUp }
    if (diff < 0) return { text: `${diff}`, color: '#ef4444', Icon: ArrowDown }
    return { text: '0', color: 'rgba(255,255,255,0.3)', Icon: Minus }
  }

  const [bezig, setBezig] = useState(null)
  const bevestig = async (bereik = 'day') => {
    if (!selectedMeal || bezig) return
    const gekozen = selectedMeal
    setBezig(bereik)
    try {
      await onSelect?.(gekozen, bereik)
      setSelectedMeal(null)
    } finally {
      setBezig(null)
    }
  }

  const vraagBereik = plekken !== undefined && !!currentMeal

  const filteredMeals = getFilteredMeals()

  const inhoud = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        maxWidth: embedded || isMobile ? '100%' : 600,
        width: '100%', margin: '0 auto',
        background: '#0a0a0a', overflow: 'hidden',
      }}
    >
      {/* ── Kop ── */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, marginBottom: '0.7rem',
        }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            Wissel maaltijd
          </div>
          <button
            onClick={onClose}
            aria-label="Sluit"
            style={{
              width: 36, height: 36, flexShrink: 0,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 10, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* De maaltijd die je gaat wisselen, als dezelfde kaart. */}
        {currentMeal ? (
          <div style={{ margin: isMobile ? '0 -1rem 0.7rem' : '0 -1.5rem 0.8rem' }}>
            <MealCard
              meal={{
                name: currentMeal?.name || currentMeal?.meal_name,
                image_url: currentMeal?.image_url,
                slot: slot || currentMeal?.slot,
                timing: currentMeal?.timing,
                calories: currentMeal?.calories, protein: currentMeal?.protein,
                carbs: currentMeal?.carbs, fat: currentMeal?.fat,
              }}
              isMobile={isMobile}
              acties={[]}
            />
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '0.7rem' }}>
            {tijd ? `Nieuwe maaltijd op ${dagNaam || 'deze dag'} om ${tijd}.` : 'Dit slot is nog leeg.'}
          </div>
        )}

        <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          {currentMeal ? 'Wissel voor:' : 'Kies een maaltijd:'}
        </div>

        {/* Zoeken */}
        <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.2)' }} />
          <input
            type="text"
            placeholder="Zoek maaltijd..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 10, color: 'white',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              outline: 'none', minHeight: 40, boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
          />
        </div>

        {/* Drie keuzes: moment, bron, volgorde. */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Keuze waarde={moment} opties={MOMENT_OPTIES} zet={setMoment} isMobile={isMobile} />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <Keuze waarde={bron} opties={bronOpties} zet={setBron} isMobile={isMobile} />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <Keuze waarde={sortering} opties={SORTEER_OPTIES} zet={setSortering} isMobile={isMobile} uitlijning="rechts" />
        </div>

        {/* Grenzen, dicht tot je ze nodig hebt. */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setToonFilter(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', padding: 0,
              color: filterActief ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={2.6} />
            {filterActief
              ? [maxKcal ? `max ${maxKcal} kcal` : null, minEiwit ? `min ${minEiwit}g eiwit` : null].filter(Boolean).join(' · ')
              : 'Grenzen'}
          </button>

          {toonFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { waarde: maxKcal, zet: setMaxKcal, plaats: 'max kcal' },
                { waarde: minEiwit, zet: setMinEiwit, plaats: 'min eiwit' },
              ].map(veld => (
                <input
                  key={veld.plaats}
                  type="number" inputMode="numeric"
                  value={veld.waarde}
                  onChange={e => veld.zet(e.target.value)}
                  placeholder={veld.plaats}
                  style={{
                    width: 110, minHeight: 38, padding: '0 0.7rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                    color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              ))}
              {filterActief && (
                <button
                  onClick={() => { setMaxKcal(''); setMinEiwit('') }}
                  style={{
                    minHeight: 38, padding: '0 0.8rem', borderRadius: 10,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 800,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  Wissen
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Lijst ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '0.6rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div style={{
              width: 32, height: 32,
              border: '2px solid rgba(255, 255, 255, 0.06)',
              borderTopColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              animation: 'wisselSpin 0.8s linear infinite',
            }} />
          </div>
        ) : (filteredMeals.length > 0 || producten.length > 0 || productenLaden) ? (<>
          {filteredMeals.map((meal, idx) => (
            <SuggestieKaart
              key={meal.id || idx}
              meal={meal}
              currentMeal={currentMeal}
              slot={slot}
              isSelected={selectedMeal?.id === meal.id}
              onSelect={() => setSelectedMeal(selectedMeal?.id === meal.id ? null : meal)}
              isMobile={isMobile}
              isFavoriet={favorites.has(meal.id)}
              onSter={meal._isCustom ? null : () => toggleFavorite(meal.id)}
              onInfo={() => openInfo(meal)}
            />
          ))}

          {/* Producten en ingrediënten, alleen bij een zoekterm. */}
          {searchTerm.trim().length >= 2 && (producten.length > 0 || productenLaden) && (
            <div style={{ marginTop: filteredMeals.length > 0 ? '0.6rem' : 0 }}>
              <div style={{ padding: isMobile ? '0 0.9rem 0.45rem' : '0 1.25rem 0.5rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
                Producten en ingrediënten{productenLaden ? '…' : ''}
              </div>
              {producten.map(ing => {
                const portie = ing.default_portion_gram || 100
                const m = productMacros(ing, portie)
                return (
                  <MealCard
                    key={ing.id}
                    meal={{
                      name: productNaam(ing),
                      image_url: ing.image_url || foodImageFallback(ing.name, null, 200),
                      calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat,
                    }}
                    momentLabel={ing.barcode ? 'Product' : 'Basis'}
                    tijdLabel={`per ${portie} ${findPortionConfig(productNaam(ing))?.displayUnit === 'ml' ? 'ml' : 'g'}`}
                    isMobile={isMobile}
                    compact
                    onTik={() => { setPortieVan(ing); setGram(portie) }}
                    acties={[{ icon: <Check size={isMobile ? 11 : 12} strokeWidth={2.6} />, label: 'Kies', onClick: () => { setPortieVan(ing); setGram(portie) } }]}
                  />
                )
              })}
            </div>
          )}
        </>) : (
          <div style={{ textAlign: 'center', padding: '3rem 1.25rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: '0.35rem' }}>
              Geen resultaten
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, maxWidth: 300, margin: '0 auto' }}>
              {bron === 'coach' && moment !== 'alles'
                ? `Voor ${(MOMENT_OPTIES.find(o => o.id === moment)?.label || moment).toLowerCase()} staan geen vaste swaps.`
                : bron === 'coach'
                  ? 'Er staan nog geen vaste swaps.'
                  : bron === 'mine'
                    ? 'De klant heeft hier nog geen eigen maaltijden die passen.'
                    : searchTerm.trim().length >= 2
                      ? 'Niets gevonden bij maaltijden, producten of ingrediënten.'
                      : 'Probeer een ander moment, een andere bron of een zoekterm.'}
            </div>
            {(moment !== 'alles' || bron !== 'alles') && (
              <button
                onClick={() => { setMoment('alles'); setBron('alles') }}
                style={{
                  marginTop: '1rem', padding: '0.55rem 1rem',
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: 10, color: '#fff',
                  fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: 'pointer', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Zoek overal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {embedded ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0, background: '#0a0a0a' }}>
          {inhoud}
        </div>
      ) : (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', zIndex: 10500,
          }}
        >
          {inhoud}
        </div>
      )}

      {/* Portie van een product: eerst de hoeveelheid, dan pas vastleggen.
          "330 ml Hertog Jan" is iets anders dan "Hertog Jan". */}
      <BladModal
        open={!!portieVan}
        titel={portieVan ? productNaam(portieVan) : 'Product'}
        onClose={() => { if (!portieBezig) setPortieVan(null) }}
        zIndex={10600}
      >
        {portieVan && (() => {
          const m = productMacros(portieVan, gram)
          // Vloeistoffen in milliliters (dichtheid ≈ 1, dus de rekensom blijft
          // per 100 g). Natuurlijke porties: eerst de eenheid uit de database
          // (eenheid + gram_per_eenheid), anders de lijst van de klant-app.
          const cfg = findPortionConfig(productNaam(portieVan))
          const eenheid = cfg?.displayUnit === 'ml' ? 'ml' : 'g'
          const info = portieInfo(portieVan)
          const porties = info
            ? [1, 2, 3].map(n => ({ label: portieLabel(n * info.gram, info), grams: Math.round(n * info.gram) }))
            : (cfg?.presets || [])
          const stap = (dir) => setGram(g => info ? stapPortie(g, info, dir) : Math.max(0, Math.round((Number(g) || 0) + dir * 10)))
          const stapGroot = (dir) => setGram(g => Math.max(0, Math.round((Number(g) || 0) + dir * 50)))
          return (
            <>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                {Math.round(portieVan.calories_per_100g || 0)} kcal per 100 {eenheid === 'ml' ? 'ml' : 'gram'}
                {info ? ` · 1 ${info.eenheid} = ${Math.round(info.gram)} ${eenheid}` : ''}
              </div>
              {porties.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {porties.map(pz => {
                    const actief = Math.round(Number(gram) || 0) === pz.grams
                    return (
                      <button
                        key={pz.label}
                        onClick={() => { setGram(pz.grams); if (navigator.vibrate) navigator.vibrate(15) }}
                        style={{
                          minHeight: 40, padding: '0 0.8rem', borderRadius: 999,
                          background: actief ? '#fff' : 'transparent',
                          border: `1px solid ${actief ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                          color: actief ? '#0a0a0a' : '#fff', fontSize: '0.78rem', fontWeight: 900,
                          fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {pz.label}<span style={{ marginLeft: 5, opacity: 0.6, fontWeight: 700 }}>{pz.grams} {eenheid}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <button onClick={() => stapGroot(-1)} style={portieKnop}>-50</button>
                <button onClick={() => stap(-1)} style={portieKnop}>{info ? `-1 ${info.eenheid}` : '-10'}</button>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={gram}
                  onChange={e => setGram(e.target.value)}
                  style={{
                    flex: 1, minWidth: 0, minHeight: 44, textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 10, color: '#fff', fontSize: '1.1rem', fontWeight: 900,
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>{eenheid}</span>
                <button onClick={() => stap(1)} style={portieKnop}>{info ? `+1 ${info.eenheid}` : '+10'}</button>
                <button onClick={() => stapGroot(1)} style={portieKnop}>+50</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
                {[
                  { label: 'kcal', waarde: m.calories },
                  { label: 'eiwit', waarde: `${Math.round(m.protein)}g` },
                  { label: 'koolh', waarde: `${Math.round(m.carbs)}g` },
                  { label: 'vet', waarde: `${Math.round(m.fat)}g` },
                ].map(x => (
                  <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{x.waarde}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={kiesProduct}
                disabled={portieBezig || !(Number(gram) > 0)}
                style={{
                  width: '100%', minHeight: 50,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: Number(gram) > 0 ? '#fff' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12,
                  color: Number(gram) > 0 ? '#0a0a0a' : 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: 900,
                  fontFamily: 'inherit', cursor: portieBezig ? 'wait' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Check size={16} strokeWidth={3} /> {portieBezig ? 'Bezig…' : 'Kies deze portie'}
              </button>
            </>
          )
        })()}
      </BladModal>

      {/* Wat zit erin, voordat je kiest. */}
      <BladModal
        open={!!infoMeal}
        titel={infoMeal?.name || 'Maaltijd'}
        onClose={() => { setInfoMeal(null); setInfoIngredienten(null) }}
        zIndex={10600}
      >
        {infoMeal && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                { label: 'kcal', waarde: Math.round(infoMeal.calories || 0) },
                { label: 'eiwit', waarde: `${Math.round(infoMeal.protein || 0)}g` },
                { label: 'koolh', waarde: `${Math.round(infoMeal.carbs || 0)}g` },
                { label: 'vet', waarde: `${Math.round(infoMeal.fat || 0)}g` },
              ].map(x => (
                <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{x.waarde}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Ingrediënten
            </div>
            {infoIngredienten === null ? (
              <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
            ) : infoIngredienten.length === 0 ? (
              <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                Van deze maaltijd staan geen ingrediënten in de database.
              </div>
            ) : (
              <div style={{ margin: '0 -1.25rem 1rem' }}>
                {infoIngredienten.map((ing, i) => (
                  <MealCard
                    key={`${ing.name}-${i}`}
                    meal={{
                      name: ing.name,
                      image_url: foodImageFallback(ing.name, null, 200),
                      calories: ing.calories, protein: ing.protein,
                      carbs: ing.carbs, fat: ing.fat,
                    }}
                    momentLabel=""
                    rechts={`${ing.amount}${ing.unit === 'gram' ? 'g' : ` ${ing.unit || ''}`}`}
                    isMobile={isMobile}
                    acties={[]}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => { setSelectedMeal(infoMeal); setInfoMeal(null); setInfoIngredienten(null) }}
              style={{
                width: '100%', minHeight: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#fff', border: 'none', borderRadius: 12,
                color: '#0a0a0a', fontSize: '0.9rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={15} strokeWidth={3} /> Kies deze
            </button>
          </>
        )}
      </BladModal>

      {/* Bevestigen: de nieuwe maaltijd als kaart, het verschil eronder, dan de knop. */}
      <BladModal
        open={!!selectedMeal}
        titel="Wissel hiermee?"
        onClose={() => setSelectedMeal(null)}
        zIndex={10600}
      >
        {selectedMeal && (
          <>
            <div style={{ margin: '0 -1.25rem 0.9rem' }}>
              <MealCard
                meal={{
                  name: selectedMeal.name,
                  image_url: selectedMeal.image_url,
                  slot: slot || currentMeal?.slot,
                  calories: selectedMeal.calories, protein: selectedMeal.protein,
                  carbs: selectedMeal.carbs, fat: selectedMeal.fat,
                }}
                momentLabel={selectedMeal._isCustom ? 'Eigen maaltijd' : 'Nieuw'}
                isMobile={isMobile}
                acties={[]}
              />
            </div>

            {currentMeal && (
              <>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  Verschil met {currentMeal?.name || 'de huidige maaltijd'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
                  {[
                    { label: 'kcal', diff: getDiff(selectedMeal.calories, currentMeal?.calories) },
                    { label: 'eiwit', diff: getDiff(selectedMeal.protein, currentMeal?.protein) },
                    { label: 'koolh', diff: getDiff(selectedMeal.carbs, currentMeal?.carbs) },
                    { label: 'vet', diff: getDiff(selectedMeal.fat, currentMeal?.fat) },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                      <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: item.diff.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {item.diff.text}
                      </div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {vraagBereik ? (
              <BereikKeuze
                vraag="Waar geldt deze wissel?"
                dagNaam={dagNaam} slot={slot}
                oudeNaam={currentMeal?.name} nieuweNaam={selectedMeal?.name}
                plekken={plekken} metAlleDagen
                bezig={bezig} onKies={bevestig}
              />
            ) : (
              <button
                onClick={() => bevestig('day')}
                disabled={!!bezig}
                style={{
                  width: '100%', minHeight: 50, marginBottom: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: '#fff', border: 'none', borderRadius: 12,
                  color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900,
                  fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Check size={16} strokeWidth={3} /> {bezig ? 'Bezig…' : currentMeal ? 'Wissel hiermee' : 'Zet in het slot'}
              </button>
            )}
            <button
              onClick={() => setSelectedMeal(null)}
              style={{
                width: '100%', minHeight: 40,
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 800,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Annuleren
            </button>
          </>
        )}
      </BladModal>

      <style>{`
        @keyframes wisselSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}

const portieKnop = {
  minWidth: 44, minHeight: 44, padding: '0 0.5rem', flexShrink: 0,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
  color: '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

// Eén suggestie: dezelfde kaart als in de dagplanning, met op de foto het
// verschil in kcal en eiwit met de huidige maaltijd. De ster is de
// coach-favoriet.
function SuggestieKaart({ meal, currentMeal, slot, isSelected, onSelect, isMobile, isFavoriet, onSter, onInfo }) {
  const teken = (n) => `${n > 0 ? '+' : ''}${n}`
  const heeftHuidig = !!currentMeal
  const kcalOp = Math.round((meal.calories || 0) - (currentMeal?.calories || 0))
  const eiwitOp = Math.round((meal.protein || 0) - (currentMeal?.protein || 0))
  const kcalLabel = !heeftHuidig ? `${Math.round(meal.calories || 0)} kcal` : kcalOp === 0 ? 'Zelfde kcal' : `${teken(kcalOp)} kcal`
  const eiwitLabel = !heeftHuidig ? `${Math.round(meal.protein || 0)}g eiwit` : eiwitOp === 0 ? 'zelfde eiwit' : `${teken(eiwitOp)}g eiwit`

  return (
    <MealCard
      meal={{
        name: meal.name,
        image_url: meal.image_url,
        slot: slot || currentMeal?.slot,
        calories: meal.calories, protein: meal.protein,
        carbs: meal.carbs, fat: meal.fat,
      }}
      momentLabel={kcalLabel}
      tijdLabel={eiwitLabel}
      isMobile={isMobile}
      geselecteerd={isSelected}
      onCheck={onSelect}
      hoekKnop={onSter ? (
        <button
          onClick={(e) => { e.stopPropagation(); onSter() }}
          aria-label={isFavoriet ? 'Favoriet verwijderen' : 'Favoriet maken'}
          title={isFavoriet ? 'Favoriet verwijderen' : 'Favoriet maken'}
          style={{
            width: 28, height: 28, padding: 0,
            background: 'transparent', border: 'none', borderRadius: 7,
            color: '#fff', opacity: isFavoriet ? 1 : 0.55,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Star size={14} strokeWidth={2.6} fill={isFavoriet ? '#fff' : 'none'} />
        </button>
      ) : null}
      acties={[
        { icon: <Info size={isMobile ? 11 : 12} />, label: 'Info', onClick: onInfo },
        {
          icon: <Check size={isMobile ? 11 : 12} strokeWidth={2.6} />,
          label: isSelected ? 'Gekozen' : 'Kies',
          onClick: onSelect,
          checked: isSelected,
        },
      ]}
    />
  )
}
