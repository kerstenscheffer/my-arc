// src/modules/ai-meal-generator/tabs/plan-analyzer/WisselModal.jsx
//
// Het wisselvenster van de analyzer: dezelfde opbouw als het wisselvenster
// van de klant (meal-plan/components/AIAlternativesModal), zodat coach en
// klant naar hetzelfde scherm kijken. Bovenin de maaltijd die je wisselt als
// cirkels (oud -> nieuw), daaronder zoeken, het moment als pilletjes en een
// filterblad (volgorde, grenzen). Eén lijst in groepen: vaste swaps,
// favorieten, eigen maaltijden van de klant, de rest. Tik = kiezen (popt in
// de cirkel, verschil eronder), de ronde knop = wisselen (27 okt 2026,
// zelfde upgrade als de klant).
//
// Verschil met de klant-versie: de ster is hier een coach-favoriet
// (coach_meal_favorites) en "Eigen maaltijden" zijn die van de klant.
// Er wordt niets geschaald: wat je kiest komt 1-op-1 in het slot.

import React, { useState, useEffect, useRef } from 'react'
import MealCard from '../../../meal-plan/components/day-schedule/MealCard'
import { foodImageFallback, resolveFoodImage } from '../../../meal-plan/foodImageFallback'
import { niveauVoorDoel } from '../../../meal-plan/DayTemplateService'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import BereikKeuze from './BereikKeuze'
import { findPortionConfig } from '../../../meal-plan/components/food-log/portionPresets'
import { portieInfo, portieLabel, stapPortie } from './portie'
import { X, Search, Check, Star, Info, SlidersHorizontal, ArrowRight, Utensils, RefreshCw, Plus, ChevronDown } from 'lucide-react'

// Slots van het weekplan ('breakfast', 'snack2', 'pre_workout', …) naar de
// zes momenten van de keuzelijst.
function slotNaarMoment(slot) {
  const v = String(slot || '').toLowerCase()
  if (v.includes('breakfast') || v.includes('ontbijt')) return 'breakfast'
  if (v.includes('lunch')) return 'lunch'
  if (v.includes('dinner') || v.includes('diner') || v.includes('avondeten')) return 'dinner'
  if (v.includes('pre')) return 'pre_workout'
  if (v.includes('post') || v.includes('after')) return 'post_workout'
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
  dagNaam = null, plekken = undefined, dagIndex = null,
  // Week-modus van de Analyzer: maandag van de week die je apart aanpast.
  weekStart = null,
  // Toegevoegd vanuit de agenda: de getikte tijd ('18:00').
  tijd = null,
  onSelect, onClose, isMobile, embedded = false,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [moment, setMoment] = useState('alles')
  const [sortering, setSortering] = useState('smart')
  const [maxKcal, setMaxKcal] = useState('')
  const [minEiwit, setMinEiwit] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  // Aangetikt in de lijst: popt rechts in de cirkel. Pas de ronde knop wisselt.
  const [gekozen, setGekozen] = useState(null)
  // Ingeklapte groepen (op kopje) en de groep per maaltijd.
  const [dicht, setDicht] = useState(() => new Set())
  const laagRef = useRef(new Map())
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
      setGekozen({ ...data, meal_id: data.id })
    } catch (e) {
      console.error('product toevoegen mislukt:', e)
      alert('Product toevoegen mislukt: ' + (e?.message || 'onbekende fout'))
    } finally {
      setPortieBezig(false)
    }
  }

  // Het label op de kaart wint van het slot: zet je een lunch om naar 'Diner',
  // dan blijft het slot 'lunch' maar hoort de swaplijst bij diner te openen.
  const slotKey = currentMeal?.display_label
    ? swapSlotNaarMoment(currentMeal.display_label)
    : isAvondsnack(slot, currentMeal) ? 'avondsnack' : slotNaarMoment(slot || currentMeal?.slot)
  const huidigId = currentMeal?.meal_id || currentMeal?.id || null

  useEffect(() => {
    laadAlles()
    return () => {
      setSelectedMeal(null)
      setGekozen(null)
      setSearchTerm('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, huidigId, clientId])

  // Alles tegelijk ophalen: eerst stonden hier zes rondes na elkaar.
  const laadAlles = async () => {
    setLoading(true)
    try {
      const sb = db.supabase
      const niveau = niveauVoorDoel(targetCalories)
      const [user, poolRes, slotsRes, dagmenuRes, customRes] = await Promise.all([
        Promise.resolve(db.getCurrentUser?.()).then(r => r, () => null),
        // Zonder needs_review: een lijst die zichzelf op macro's aanprijst
        // mag geen maaltijden bevatten waarvan de kcal niet klopt.
        sb.from('ai_meals').select('*').gt('calories', 0)
          .or('needs_review.is.null,needs_review.eq.false').then(r => r, () => ({ data: [] })),
        // Vaste swaps voor deze klant (met de standaard-laag via de RPC).
        clientId
          ? sb.rpc('get_effective_swap_options', { p_client_id: clientId }).then(r => r, () => ({ data: {} }))
          : Promise.resolve({ data: {} }),
        // Dagmenu's van het niveau dat bij het caloriedoel hoort.
        niveau
          ? sb.from('ai_meals').select('*').like('internal_name', `dagmenu${niveau}_%`).then(r => r, () => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        // Eigen maaltijden van de klant.
        clientId
          ? sb.from('ai_custom_meals')
              .select('id, name, calories, protein, carbs, fat, fiber, image_url, section, ingredients_list')
              .eq('client_id', clientId).eq('is_active', true).then(r => r, () => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ])
      const meals = poolRes.data || []

      // Favorieten van de coach.
      if (user?.id) {
        setCoachId(user.id)
        const { data } = await sb.from('coach_meal_favorites').select('meal_id').eq('coach_id', user.id)
          .then(r => r, () => ({ data: [] }))
        setFavorites(new Set((data || []).map(r => r.meal_id)))
      }

      // Vaste swaps per moment, in de volgorde waarin de coach ze koos. Ze
      // staan bijna altijd al in de pool; alleen wat ontbreekt apart halen.
      let curated = []
      const perMoment = {}
      try {
        const alleSlots = slotsRes.data || {}
        const alleIds = [...new Set(Object.values(alleSlots).flatMap(v => v?.meal_ids || []))]
        if (alleIds.length > 0) {
          const opId = new Map(meals.filter(m => alleIds.includes(m.id)).map(m => [m.id, m]))
          const mist = alleIds.filter(id => !opId.has(id))
          if (mist.length) {
            const { data: extra } = await sb.from('ai_meals').select('*').in('id', mist)
            ;(extra || []).forEach(m => opId.set(m.id, m))
          }
          Object.entries(alleSlots).forEach(([s2, v]) => {
            const lijst = (v?.meal_ids || []).map(id => opId.get(id)).filter(Boolean)
            if (lijst.length === 0) return
            const mom = swapSlotNaarMoment(s2)
            perMoment[mom] = [...(perMoment[mom] || []), ...lijst]
          })
          // Avondsnack zonder eigen lijst valt terug op de snacklijst.
          const eigenIds = alleSlots?.[slotKey]?.meal_ids?.length ? alleSlots[slotKey].meal_ids : (alleSlots?.[basisMoment(slotKey)]?.meal_ids || [])
          curated = eigenIds.map(id => opId.get(id)).filter(Boolean)
        }
      } catch (e) { console.warn('vaste swaps laden mislukt', e?.message) }

      const alGekozen = new Set(curated.map(m => m.id))
      ;(dagmenuRes.data || []).forEach(m => {
        const mom = slotNaarMoment((Array.isArray(m.timing) ? m.timing[0] : m.timing) || m.meal_type)
        if (!(perMoment[mom] || []).some(x => x.id === m.id)) {
          perMoment[mom] = [...(perMoment[mom] || []), m]
        }
        if (mom === basisMoment(slotKey) && !alGekozen.has(m.id)) {
          curated = [...curated, m]
          alGekozen.add(m.id)
        }
      })

      setAllMeals(meals)
      setCustomMeals((customRes.data || []).map(m => ({ ...m, _isCustom: true })))
      setCoachOptions(curated)
      setCoachPerMoment(perMoment)
      setMoment(slotKey)
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

  // Wat er anders staat dan standaard, als chips met een kruisje.
  const afwijkingen = [
    sortering !== 'smart' && { id: 'sort', label: SORTEER_OPTIES.find(o => o.id === sortering)?.label, terug: () => setSortering('smart') },
    maxKcal && { id: 'kcal', label: `max ${maxKcal} kcal`, terug: () => setMaxKcal('') },
    minEiwit && { id: 'eiwit', label: `min ${minEiwit}g eiwit`, terug: () => setMinEiwit('') },
  ].filter(Boolean)
  const allesTonen = () => { setMoment('alles'); setSortering('smart'); setMaxKcal(''); setMinEiwit('') }

  // Kopje boven een groep in de lijst.
  const KOPPEN = ['Vaste swaps', 'Favorieten', 'Eigen maaltijden klant', 'Meer maaltijden']
  const kopVan = (m) => (m ? KOPPEN[laagRef.current.get(m.id) ?? 3] : null)

  const getFilteredMeals = () => {
    const currentCal = currentMeal?.calories || 0
    const currentProt = currentMeal?.protein || 0
    const nietZelf = (m) => m.id !== huidigId

    // Eén lijst in groepen (geen bron meer kiezen). De vaste swaps zijn al
    // per moment gekozen; de rest filtert op de timing van de maaltijd, en
    // een maaltijd zonder timing blijft staan.
    const pastMoment = (m) => {
      if (moment === 'alles') return true
      const set = momentenVan(m)
      return set.size === 0 || set.has(moment) || set.has(basisMoment(moment))
    }
    const vast = moment !== 'alles'
      ? (coachPerMoment[moment]?.length ? coachPerMoment[moment] : (coachPerMoment[basisMoment(moment)] || []))
      : [...coachOptions, ...Object.values(coachPerMoment).flat()]
    const gezien = new Set()
    const laag = new Map()
    const neem = (lijst, l) => lijst.filter(m => {
      if (!m || !nietZelf(m) || gezien.has(m.id)) return false
      gezien.add(m.id); laag.set(m.id, l)
      return true
    })
    laagRef.current = laag
    const pool = [
      ...neem(vast, 0),
      ...neem(allMeals.filter(m => favorites.has(m.id) && pastMoment(m)), 1),
      ...neem(customMeals.filter(pastMoment), 2),
      ...neem(allMeals.filter(pastMoment), 3),
    ]

    // Zoeken gaat over alles, ook over andere momenten.
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const alles = [...pool, ...neem([...customMeals, ...allMeals], 3)]
      return alles.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.name_en?.toLowerCase().includes(term) ||
        m.internal_name?.toLowerCase().includes(term)
      )
    }

    let meals = pool
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
        // Per groep. Vaste swaps in de volgorde van de coach, de rest op
        // afstand tot de huidige maaltijd (zie wisselAfstand).
        const volg = new Map(meals.map((m, i) => [m.id, i]))
        const afstand = new Map(meals.map(m => [m.id, currentMeal ? wisselAfstand(m, currentMeal) : opCal(m)]))
        return [...meals].sort((a, b) => {
          const la = laag.get(a.id) ?? 3, lb = laag.get(b.id) ?? 3
          if (la !== lb) return la - lb
          if (la === 0) return volg.get(a.id) - volg.get(b.id)
          return afstand.get(a.id) - afstand.get(b.id)
        })
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

  const [bezig, setBezig] = useState(null)
  const bevestig = async (bereik = 'day', dagen = null, geldt = 'altijd', meal = selectedMeal) => {
    if (!meal || bezig) return
    setBezig(bereik)
    try {
      await onSelect?.(meal, bereik, dagen, geldt)
      setSelectedMeal(null)
      setGekozen(null)
    } finally {
      setBezig(null)
    }
  }

  // Ook bij toevoegen (geen currentMeal) als er datums spelen: dan moet je
  // kunnen kiezen of hij er elke week bij komt of alleen die week.
  const vraagBereik = plekken !== undefined && (!!currentMeal || !!weekStart)

  const filteredMeals = getFilteredMeals()
  // De ronde knop: moet er nog gevraagd worden waar het geldt, dan het blad;
  // anders meteen.
  const wissel = () => {
    if (!gekozen) return
    if (vraagBereik) setSelectedMeal(gekozen)
    else bevestig('day', null, 'altijd', gekozen)
  }
  const kies = (meal) => setGekozen(prev => (prev?.id === meal.id ? null : meal))

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
            {currentMeal ? 'Wissel maaltijd' : 'Maaltijd toevoegen'}
          </div>
          {!embedded && (
            <button
              onClick={onClose}
              aria-label="Sluit"
              style={{
                width: 36, height: 36, flexShrink: 0, padding: 0, marginRight: -6,
                background: 'none', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={22} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {/* Oud -> nieuw: wat je wisselt, en de aangetikte maaltijd die erin popt. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 6, margin: '0.2rem 0 1rem' }}>
          <div style={{ flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {currentMeal ? (
              <img src={resolveFoodImage({ ...currentMeal, name: currentMeal.name || currentMeal.meal_name }, { size: 200 })} alt=""
                onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', opacity: 0.6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
            ) : (
              <div style={{
                width: 60, height: 60, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.25)', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)',
              }}>
                <Plus size={20} strokeWidth={2.4} />
              </div>
            )}
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem' }}>
              {currentMeal
                ? `${Math.round(currentMeal.calories || 0)} kcal · ${Math.round(currentMeal.protein || 0)}g eiwit`
                : (tijd ? `${dagNaam || 'Deze dag'} ${tijd}` : 'Nu leeg')}
            </div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.25,
              maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {currentMeal?.name || currentMeal?.meal_name || ''}
            </div>
          </div>
          <div style={{ height: 60, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ArrowRight size={20} strokeWidth={2.8} color="#fff" />
          </div>
          <div style={{ flex: '0 1 42%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {gekozen ? (
              <div key={gekozen.id} style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'wisselPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                <img src={resolveFoodImage(gekozen, { size: 200 })} alt=""
                  onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', marginTop: '0.5rem' }}>
                  {Math.round(gekozen.calories || 0)} kcal · {Math.round(gekozen.protein || 0)}g eiwit
                </div>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.25,
                  maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{gekozen.name}</div>
              </div>
            ) : (<>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.35)', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)',
              }}>
                <Utensils size={20} strokeWidth={2} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: '0.5rem', lineHeight: 1.25 }}>
                Kies hieronder
              </div>
            </>)}
          </div>
        </div>

        {/* Gekozen: het verschil per macro, met de ronde wisselknop ernaast. */}
        {gekozen && (
          <div key={`v-${gekozen.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 16 : 22, marginBottom: '0.9rem', animation: 'wisselFadeIn 0.25s ease both' }}>
            {currentMeal && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 16 : 26 }}>
                {[
                  { label: 'kcal', n: (gekozen.calories || 0) - (currentMeal.calories || 0), kleur: '#10b981', g: '' },
                  { label: 'eiwit', n: (gekozen.protein || 0) - (currentMeal.protein || 0), kleur: '#3b82f6', g: 'g' },
                  { label: 'koolh', n: (gekozen.carbs || 0) - (currentMeal.carbs || 0), kleur: '#ec4899', g: 'g' },
                  { label: 'vet', n: (gekozen.fat || 0) - (currentMeal.fat || 0), kleur: '#f59e0b', g: 'g' },
                ].map(x => {
                  const v = Math.round(x.n)
                  return (
                    <div key={x.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: v === 0 ? 'rgba(255,255,255,0.45)' : '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                        {v > 0 ? '+' : v < 0 ? '−' : ''}{Math.abs(v)}{x.g}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 3, fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.kleur }} />{x.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={wissel} disabled={!!bezig} aria-label={currentMeal ? 'Wissel' : 'Zet in het slot'} title={currentMeal ? 'Wissel' : 'Zet in het slot'} style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: '50%', padding: 0,
              background: '#fff', border: 'none', color: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: bezig ? 'wait' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {currentMeal ? <RefreshCw size={20} strokeWidth={3} /> : <Check size={20} strokeWidth={3} />}
            </button>
          </div>
        )}

        {/* Zoeken */}
        <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
          <input
            type="text"
            placeholder="Zoek maaltijd of product"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              background: 'rgba(255, 255, 255, 0.07)',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600,
              outline: 'none', minHeight: 42, boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Moment als pilletjes (de gekozen wit) en één filterknop. */}
        <div style={{ display: 'flex', alignItems: 'center', margin: isMobile ? '0 -1rem' : '0 -1.5rem' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', padding: isMobile ? '0 0 0 1rem' : '0 0 0 1.5rem' }}>
            {MOMENT_OPTIES.map(o => {
              const aan = moment === o.id
              return (
                <button key={o.id} onClick={() => setMoment(o.id)} style={{
                  flexShrink: 0, height: 32, padding: '0 0.8rem', borderRadius: 999, border: 'none',
                  background: aan ? '#fff' : 'transparent', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{o.id === 'alles' ? 'Alles' : o.label}</button>
              )
            })}
          </div>
          <button onClick={() => setFilterOpen(true)} aria-label="Filter" style={{
            position: 'relative', flexShrink: 0, width: 44, height: 36, padding: 0,
            marginRight: isMobile ? '0.5rem' : '1rem', marginLeft: 4,
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <SlidersHorizontal size={19} strokeWidth={2.6} />
            {afwijkingen.length > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 6, minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                background: '#fff', color: '#0a0a0a', fontSize: '0.62rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
              }}>{afwijkingen.length}</span>
            )}
          </button>
        </div>

        {/* Wat er anders staat dan standaard, met een kruisje om terug te zetten. */}
        {afwijkingen.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {afwijkingen.map(x => (
              <button key={x.id} onClick={x.terug} style={{
                display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 0.55rem 0 0.75rem',
                borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                fontSize: '0.74rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                {x.label} <X size={13} strokeWidth={3} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lijst ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', paddingTop: '0.6rem' }}>
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
          {filteredMeals.map((meal, idx) => {
            const kop = sortering === 'smart' && !searchTerm ? kopVan(meal) : null
            const nieuweKop = kop && kop !== kopVan(filteredMeals[idx - 1])
            return (
              <React.Fragment key={meal.id || idx}>
                {nieuweKop && (
                  <div onClick={() => setDicht(prev => { const n = new Set(prev); if (n.has(kop)) n.delete(kop); else n.add(kop); return n })} style={{
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent', userSelect: 'none',
                    padding: `${idx === 0 ? '0.2rem' : '0.9rem'} ${isMobile ? '0.9rem' : '1.25rem'} 0.35rem`,
                    fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
                  }}>
                    {kop}
                    <ChevronDown size={14} strokeWidth={3} style={{ transition: 'transform 0.15s ease', transform: dicht.has(kop) ? 'rotate(-90deg)' : 'none' }} />
                  </div>
                )}
                {!(kop && dicht.has(kop)) && (
                  <SuggestieKaart
                    meal={meal}
                    currentMeal={currentMeal}
                    slot={slot}
                    isSelected={gekozen?.id === meal.id}
                    onSelect={() => kies(meal)}
                    isMobile={isMobile}
                    isFavoriet={favorites.has(meal.id)}
                    onSter={meal._isCustom ? null : () => toggleFavorite(meal.id)}
                    onInfo={() => openInfo(meal)}
                  />
                )}
              </React.Fragment>
            )
          })}

          {/* Producten en ingrediënten, alleen bij een zoekterm. */}
          {searchTerm.trim().length >= 2 && (producten.length > 0 || productenLaden) && (
            <div style={{ marginTop: filteredMeals.length > 0 ? '0.6rem' : 0 }}>
              <div style={{
                padding: `0.9rem ${isMobile ? '0.9rem' : '1.25rem'} 0.35rem`,
                fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
              }}>
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
                    acties={[]}
                  />
                )
              })}
            </div>
          )}

          {/* Weinig over door filters? Eén tik en alles staat er. */}
          {!searchTerm.trim() && filteredMeals.length < 6 && (moment !== 'alles' || afwijkingen.length > 0) && (
            <div style={{ textAlign: 'center', padding: '1rem 1rem 1.25rem' }}>
              <button onClick={allesTonen} style={{
                background: 'none', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
              }}>Niet gevonden wat je zoekt? Toon alles</button>
            </div>
          )}
        </>) : (
          <div style={{ textAlign: 'center', padding: '3rem 1.25rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: '0.35rem' }}>
              Geen resultaten
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, maxWidth: 300, margin: '0 auto' }}>
              {searchTerm.trim().length >= 2
                ? 'Niets gevonden bij maaltijden, producten of ingrediënten.'
                : 'Probeer een ander moment of minder strenge grenzen.'}
            </div>
            {(moment !== 'alles' || afwijkingen.length > 0) && (
              <button
                onClick={allesTonen}
                style={{
                  marginTop: '1rem', padding: '0.55rem 1rem',
                  background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: 10, color: '#fff',
                  fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: 'pointer', touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Toon alles
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
            {/* Macro's: vier getallen met een stipje, geen vakken. */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 26, marginBottom: '1.1rem' }}>
              {[
                { label: 'kcal', waarde: Math.round(infoMeal.calories || 0), kleur: '#10b981' },
                { label: 'eiwit', waarde: `${Math.round(infoMeal.protein || 0)}g`, kleur: '#3b82f6' },
                { label: 'koolh', waarde: `${Math.round(infoMeal.carbs || 0)}g`, kleur: '#ec4899' },
                { label: 'vet', waarde: `${Math.round(infoMeal.fat || 0)}g`, kleur: '#f59e0b' },
              ].map(x => (
                <div key={x.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{x.waarde}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: x.kleur }} />{x.label}
                  </div>
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
              onClick={() => { setGekozen(infoMeal); setInfoMeal(null); setInfoIngredienten(null) }}
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

      {/* Volgorde en grenzen, in een blad (zoals bij de klant). */}
      <BladModal open={filterOpen} titel="Filter" onClose={() => setFilterOpen(false)} zIndex={10600}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Volgorde</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.1rem' }}>
          {SORTEER_OPTIES.map(o => {
            const aan = sortering === o.id
            return (
              <button key={o.id} onClick={() => setSortering(o.id)} style={{
                height: 34, padding: '0 0.85rem', borderRadius: 999,
                background: aan ? '#fff' : 'rgba(255,255,255,0.06)', border: 'none',
                color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>{o.label}</button>
            )
          })}
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Grenzen</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem' }}>
          {[
            { waarde: maxKcal, zet: setMaxKcal, plaats: 'max kcal' },
            { waarde: minEiwit, zet: setMinEiwit, plaats: 'min eiwit (g)' },
          ].map(veld => (
            <input key={veld.plaats} type="number" inputMode="numeric" value={veld.waarde}
              onChange={e => veld.zet(e.target.value)} placeholder={veld.plaats}
              style={{
                flex: 1, minWidth: 0, height: 42, padding: '0 0.8rem', background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: '0.88rem', fontWeight: 700,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }} />
          ))}
        </div>
        <button onClick={() => setFilterOpen(false)} style={{
          width: '100%', minHeight: 50, borderRadius: 12, border: 'none', background: '#fff', color: '#0a0a0a',
          fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>Toon {filteredMeals.length} maaltijden</button>
        {(afwijkingen.length > 0 || moment !== 'alles') && (
          <button onClick={() => { allesTonen(); setFilterOpen(false) }} style={{
            width: '100%', minHeight: 40, marginTop: 6, background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          }}>Alles terugzetten</button>
        )}
      </BladModal>

      {/* Waar geldt de wissel? Het verschil staat al bovenin het venster. */}
      <BladModal
        open={!!selectedMeal}
        titel={currentMeal ? 'Waar geldt deze wissel?' : 'Waar komt hij erbij?'}
        onClose={() => { if (!bezig) setSelectedMeal(null) }}
        zIndex={10600}
      >
        {selectedMeal && (
          <>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: '0.9rem' }}>
              {currentMeal ? <>{currentMeal.name || currentMeal.meal_name} <span style={{ color: '#fff' }}>→ {selectedMeal.name}</span></> : selectedMeal.name}
            </div>
            <BereikKeuze
              vraag={currentMeal ? 'Waar geldt deze wissel?' : 'Waar komt hij erbij?'}
              dagNaam={dagNaam} slot={slot}
              oudeNaam={currentMeal?.name} nieuweNaam={selectedMeal?.name}
              plekken={plekken} metAlleDagen dagIndex={dagIndex} weekStart={weekStart}
              bezig={bezig} onKies={bevestig}
            />
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
        @keyframes wisselPopIn { 0% { opacity: 0; transform: scale(0.4); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes wisselFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
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

// Eén suggestie, compact zoals bij de klant: tik = kiezen (popt bovenin),
// het verschil met de huidige maaltijd als regel onder de naam, ster
// (coach-favoriet) en info in een kolom rechts.
function SuggestieKaart({ meal, currentMeal, slot, isSelected, onSelect, isMobile, isFavoriet, onSter, onInfo }) {
  const teken = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`
  const kcalOp = Math.round((meal.calories || 0) - (currentMeal?.calories || 0))
  const eiwitOp = Math.round((meal.protein || 0) - (currentMeal?.protein || 0))
  const verschil = currentMeal ? (
    <span>
      <span style={{ color: '#fff' }}>{kcalOp === 0 ? 'zelfde kcal' : `${teken(kcalOp)} kcal`}</span>
      {' · '}{eiwitOp === 0 ? 'zelfde eiwit' : `${teken(eiwitOp)}g eiwit`}
    </span>
  ) : null
  const hoek = {
    width: 30, height: 30, padding: 0, background: 'transparent', border: 'none',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }

  return (
    <MealCard
      meal={{
        name: meal.name,
        image_url: meal.image_url,
        slot: slot || currentMeal?.slot,
        calories: meal.calories, protein: meal.protein,
        carbs: meal.carbs, fat: meal.fat,
      }}
      momentLabel={currentMeal ? '' : null}
      ondertitel={verschil}
      compact
      isMobile={isMobile}
      geselecteerd={isSelected}
      onCheck={onSelect}
      onTik={onSelect}
      rechts={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginRight: -6 }}>
          {onSter ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSter() }}
              aria-label={isFavoriet ? 'Favoriet verwijderen' : 'Favoriet maken'}
              title={isFavoriet ? 'Favoriet verwijderen' : 'Favoriet maken'}
              style={{ ...hoek, opacity: isFavoriet ? 1 : 0.55, cursor: 'pointer' }}
            >
              <Star size={16} strokeWidth={2.6} fill={isFavoriet ? '#fff' : 'none'} />
            </button>
          ) : <div style={{ width: 30, height: 30 }} />}
          <button onClick={(e) => { e.stopPropagation(); onInfo?.() }} aria-label="Info" style={{ ...hoek, opacity: 0.55, cursor: 'pointer' }}>
            <Info size={16} strokeWidth={2.6} />
          </button>
        </div>
      }
      acties={[]}
    />
  )
}

